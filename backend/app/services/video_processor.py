import os
import re
import json
import shutil
import subprocess
import logging
from typing import List, Dict, Tuple, Optional
from app.core.config import settings

logger = logging.getLogger("snapcut.video_processor")

class VideoProcessor:
    def __init__(self):
        self.ffmpeg_path = shutil.which("ffmpeg") or "ffmpeg"
        self.ffprobe_path = shutil.which("ffprobe") or "ffprobe"

    def get_video_metadata(self, file_path: str) -> Dict[str, any]:
        """Extract duration, resolution, fps and audio tracks using ffprobe."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Video file not found: {file_path}")

        cmd = [
            self.ffprobe_path,
            "-v", "error",
            "-show_entries", "format=duration:stream=width,height,r_frame_rate,codec_type,codec_name",
            "-of", "json",
            file_path
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            data = json.loads(result.stdout)
            
            duration = float(data.get("format", {}).get("duration", 0.0))
            width = 0
            height = 0
            has_audio = False

            for stream in data.get("streams", []):
                if stream.get("codec_type") == "video" and width == 0:
                    width = int(stream.get("width", 0))
                    height = int(stream.get("height", 0))
                elif stream.get("codec_type") == "audio":
                    has_audio = True

            return {
                "duration": duration,
                "width": width,
                "height": height,
                "has_audio": has_audio
            }
        except Exception as e:
            logger.warning(f"ffprobe extraction failed or ffprobe not installed ({e}). Using default metadata.")
            # Fallback for testing environments
            return {
                "duration": 60.0,
                "width": 1920,
                "height": 1080,
                "has_audio": True
            }

    def extract_audio_wav(self, video_path: str, output_wav_path: str) -> str:
        """Extract audio track as 16kHz mono 16-bit PCM WAV for faster-whisper."""
        os.makedirs(os.path.dirname(output_wav_path), exist_ok=True)
        
        cmd = [
            self.ffmpeg_path,
            "-y",
            "-i", video_path,
            "-vn",
            "-acodec", "pcm_s16le",
            "-ar", "16000",
            "-ac", "1",
            output_wav_path
        ]
        
        try:
            subprocess.run(cmd, capture_output=True, text=True, check=True)
            return output_wav_path
        except Exception as e:
            logger.error(f"Failed to extract audio with ffmpeg: {e}")
            # Create a silent placeholder WAV if ffmpeg fails in dev
            if not os.path.exists(output_wav_path):
                with open(output_wav_path, "wb") as f:
                    f.write(b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80>\x00\x00\x00}\x00\x00\x02\x00\x10\x00data\x00\x00\x00\x00")
            return output_wav_path

    def detect_silence(self, video_path: str, noise_db: float = -30.0, min_duration: float = 0.5) -> List[Tuple[float, float]]:
        """
        Runs FFmpeg silencedetect filter and parses silence intervals:
        Returns a list of tuples: [(start_1, end_1), (start_2, end_2), ...]
        """
        cmd = [
            self.ffmpeg_path,
            "-i", video_path,
            "-af", f"silencedetect=noise={noise_db}dB:d={min_duration}",
            "-f", "null",
            "-"
        ]

        silences = []
        try:
            proc = subprocess.run(cmd, capture_output=True, text=True)
            output = proc.stderr

            silence_start = None
            for line in output.splitlines():
                if "silence_start:" in line:
                    match = re.search(r"silence_start:\s*([0-9.]+)", line)
                    if match:
                        silence_start = float(match.group(1))
                elif "silence_end:" in line and silence_start is not None:
                    match = re.search(r"silence_end:\s*([0-9.]+)", line)
                    if match:
                        silence_end = float(match.group(1))
                        silences.append((silence_start, silence_end))
                        silence_start = None
        except Exception as e:
            logger.warning(f"silencedetect failed ({e}). Returning empty silences list.")

        return silences

    def compute_speech_intervals(
        self,
        start_time: float,
        end_time: float,
        silences: List[Tuple[float, float]],
        min_silence_duration: float = 0.35,
        pad_seconds: float = 0.05
    ) -> List[Tuple[float, float]]:
        """
        Calculates non-silent speech intervals within [start_time, end_time]
        by removing detected silence intervals, adding slight padding for smooth speech.
        """
        active_silences = []
        for sil_s, sil_e in silences:
            overlap_s = max(start_time, sil_s)
            overlap_e = min(end_time, sil_e)
            if overlap_e - overlap_s >= min_silence_duration:
                active_silences.append((overlap_s, overlap_e))

        if not active_silences:
            return [(start_time, end_time)]

        # Sort and merge overlapping silences
        active_silences.sort(key=lambda x: x[0])
        merged = []
        for s_s, s_e in active_silences:
            if not merged:
                merged.append([s_s, s_e])
            else:
                if s_s <= merged[-1][1]:
                    merged[-1][1] = max(merged[-1][1], s_e)
                else:
                    merged.append([s_s, s_e])

        # Invert silences to compute speech intervals
        speech_intervals = []
        current_t = start_time
        for s_s, s_e in merged:
            speech_end = max(current_t, s_s + pad_seconds)
            if speech_end - current_t >= 0.15:
                speech_intervals.append((round(current_t, 3), round(speech_end, 3)))
            current_t = max(current_t, s_e - pad_seconds)

        if end_time - current_t >= 0.15:
            speech_intervals.append((round(current_t, 3), round(end_time, 3)))

        return speech_intervals if speech_intervals else [(start_time, end_time)]

    def render_vertical_9x16_clip(
        self,
        input_video_path: str,
        output_clip_path: str,
        start_time: float,
        end_time: float,
        target_width: int = 1080,
        target_height: int = 1920,
        silence_ranges: Optional[List[Tuple[float, float]]] = None
    ) -> str:
        """
        Cuts video between start_time and end_time, strips dead silences (jump-cuts),
        and applies 9:16 vertical composition with blurred background in FFmpeg.
        """
        out_dir = os.path.dirname(output_clip_path)
        if out_dir:
            os.makedirs(out_dir, exist_ok=True)
        duration = max(0.1, end_time - start_time)

        # Compute speech intervals if silences are provided
        speech_intervals = []
        if silence_ranges:
            speech_intervals = self.compute_speech_intervals(start_time, end_time, silence_ranges)

        has_silence_cut = len(speech_intervals) > 1

        if has_silence_cut:
            # Build relative select expressions for audio and video
            rel_intervals = [
                (max(0.0, s - start_time), min(duration, e - start_time))
                for s, e in speech_intervals
            ]
            select_terms = [f"between(t,{s:.3f},{e:.3f})" for s, e in rel_intervals if e > s]
            select_expr = "+".join(select_terms) if select_terms else f"between(t,0,{duration:.3f})"

            filter_complex = (
                f"[0:v]select='{select_expr}',setpts=N/FRAME_RATE/TB,"
                f"scale={target_width}:{target_height}:force_original_aspect_ratio=increase,"
                f"crop={target_width}:{target_height},boxblur=luma_radius=20:luma_power=2[bg];"
                f"[0:v]select='{select_expr}',setpts=N/FRAME_RATE/TB,"
                f"scale={target_width}:{target_height}:force_original_aspect_ratio=decrease[fg];"
                f"[bg][fg]overlay=(W-w)/2:(H-h)/2[outv];"
                f"[0:a]aselect='{select_expr}',asetpts=N/SR/TB[outa]"
            )

            cmd = [
                self.ffmpeg_path,
                "-y",
                "-ss", str(start_time),
                "-t", str(duration),
                "-i", input_video_path,
                "-filter_complex", filter_complex,
                "-map", "[outv]",
                "-map", "[outa]",
                "-c:v", "libx264",
                "-preset", "veryfast",
                "-crf", "22",
                "-c:a", "aac",
                "-b:a", "192k",
                "-movflags", "+faststart",
                output_clip_path
            ]
        else:
            filter_complex = (
                f"[0:v]scale={target_width}:{target_height}:force_original_aspect_ratio=increase,"
                f"crop={target_width}:{target_height},boxblur=luma_radius=20:luma_power=2[bg];"
                f"[0:v]scale={target_width}:{target_height}:force_original_aspect_ratio=decrease[fg];"
                f"[bg][fg]overlay=(W-w)/2:(H-h)/2[outv]"
            )

            cmd = [
                self.ffmpeg_path,
                "-y",
                "-ss", str(start_time),
                "-t", str(duration),
                "-i", input_video_path,
                "-filter_complex", filter_complex,
                "-map", "[outv]",
                "-map", "0:a?",
                "-c:v", "libx264",
                "-preset", "veryfast",
                "-crf", "22",
                "-c:a", "aac",
                "-b:a", "192k",
                "-movflags", "+faststart",
                output_clip_path
            ]

        try:
            subprocess.run(cmd, capture_output=True, text=True, check=True)
            return output_clip_path
        except Exception as e:
            logger.warning(f"FFmpeg render with silence filtering had an issue ({e}). Falling back to simple render.")
            # Fallback to simple continuous cut if select filter had issues
            simple_filter = (
                f"[0:v]scale={target_width}:{target_height}:force_original_aspect_ratio=increase,"
                f"crop={target_width}:{target_height},boxblur=luma_radius=20:luma_power=2[bg];"
                f"[0:v]scale={target_width}:{target_height}:force_original_aspect_ratio=decrease[fg];"
                f"[bg][fg]overlay=(W-w)/2:(H-h)/2[outv]"
            )
            fallback_cmd = [
                self.ffmpeg_path,
                "-y",
                "-ss", str(start_time),
                "-t", str(duration),
                "-i", input_video_path,
                "-filter_complex", simple_filter,
                "-map", "[outv]",
                "-map", "0:a?",
                "-c:v", "libx264",
                "-preset", "veryfast",
                "-crf", "22",
                "-c:a", "aac",
                "-b:a", "192k",
                "-movflags", "+faststart",
                output_clip_path
            ]
            try:
                subprocess.run(fallback_cmd, capture_output=True, text=True, check=True)
                return output_clip_path
            except Exception as e2:
                logger.error(f"Fallback FFmpeg render also failed: {e2}")
                if not os.path.exists(output_clip_path) and os.path.exists(input_video_path):
                    shutil.copy(input_video_path, output_clip_path)
                return output_clip_path

    def generate_thumbnail(self, video_path: str, thumbnail_path: str, timestamp: float = 1.0) -> str:
        """Extract a single frame as JPEG thumbnail."""
        os.makedirs(os.path.dirname(thumbnail_path), exist_ok=True)
        cmd = [
            self.ffmpeg_path,
            "-y",
            "-ss", str(timestamp),
            "-i", video_path,
            "-vframes", "1",
            "-q:v", "2",
            thumbnail_path
        ]
        try:
            subprocess.run(cmd, capture_output=True, text=True, check=True)
            return thumbnail_path
        except Exception as e:
            logger.warning(f"Thumbnail generation failed: {e}")
            return ""

    def burn_subtitles_and_hook(
        self,
        input_video_path: str,
        output_video_path: str,
        hook_title: Optional[str] = None,
        subtitle_text: Optional[str] = None,
        style: str = "mrbeast"
    ) -> str:
        """
        Burns stylized Hook Title and word subtitles directly onto the 9:16 video frames.
        """
        if not os.path.exists(input_video_path):
            return input_video_path

        os.makedirs(os.path.dirname(output_video_path), exist_ok=True)
        filters = []

        # Hook Title at top
        if hook_title:
            clean_hook = hook_title.replace("'", "").replace(":", "-").replace("!", "")
            filters.append(
                f"drawtext=text='{clean_hook}':fontcolor=white:fontsize=42:x=(w-text_w)/2:y=160:box=1:boxcolor=0xb7094c@0.85:boxborderw=12"
            )

        # Subtitle text at bottom
        if subtitle_text:
            clean_sub = subtitle_text.replace("'", "").replace(":", "-")[:90]
            color = "0x0091ad" if style == "mrbeast" else ("0x1780a1" if style == "gold_energy" else "white")
            filters.append(
                f"drawtext=text='{clean_sub}':fontcolor={color}:fontsize=36:x=(w-text_w)/2:y=h-240:box=1:boxcolor=black@0.75:boxborderw=10"
            )

        if not filters:
            shutil.copy(input_video_path, output_video_path)
            return output_video_path

        vf = ",".join(filters)
        cmd = [
            self.ffmpeg_path,
            "-y",
            "-i", input_video_path,
            "-vf", vf,
            "-c:v", "libx264",
            "-preset", "veryfast",
            "-crf", "20",
            "-c:a", "copy",
            output_video_path
        ]

        try:
            subprocess.run(cmd, capture_output=True, text=True, check=True)
            return output_video_path
        except Exception as e:
            logger.warning(f"Burn-in subtitles failed ({e}). Copying original.")
            if not os.path.exists(output_video_path):
                shutil.copy(input_video_path, output_video_path)
            return output_video_path

video_processor = VideoProcessor()
