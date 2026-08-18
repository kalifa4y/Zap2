import os
import shutil
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone
import yt_dlp
from app.core.config import settings

logger = logging.getLogger("snapcut.video_downloader")

class VideoDownloader:
    def __init__(self):
        self.upload_dir = os.path.join(settings.BASE_DIR, settings.UPLOAD_DIR)
        os.makedirs(self.upload_dir, exist_ok=True)

    def download_from_url(self, url: str, project_id: str, max_duration_seconds: Optional[float] = None) -> Dict[str, Any]:
        """
        Downloads a video or live replay from any supported platform (YouTube, TikTok, Twitch, etc.)
        using yt-dlp and saves it as an MP4 in the uploads directory.
        """
        output_template = os.path.join(self.upload_dir, f"{project_id}_%(title).50s.%(ext)s")

        ydl_opts = {
            "format": "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
            "outtmpl": output_template,
            "merge_output_format": "mp4",
            "noplaylist": True,
            "quiet": True,
            "no_warnings": True,
        }

        if max_duration_seconds:
            ydl_opts["download_ranges"] = yt_dlp.utils.download_range_func(None, [(0, max_duration_seconds)])

        try:
            logger.info(f"Starting yt-dlp download for URL: {url}")
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                downloaded_filename = ydl.prepare_filename(info)
                
                # Ensure .mp4 extension
                base, _ = os.path.splitext(downloaded_filename)
                final_path = f"{base}.mp4"
                if not os.path.exists(final_path) and os.path.exists(downloaded_filename):
                    shutil.move(downloaded_filename, final_path)

                title = info.get("title", "Video_Importée")
                duration = float(info.get("duration", 0.0) or 0.0)
                width = int(info.get("width", 1920) or 1920)
                height = int(info.get("height", 1080) or 1080)

                logger.info(f"Download complete: {final_path} ({duration}s, {width}x{height})")
                return {
                    "success": True,
                    "file_path": final_path,
                    "filename": f"{title}.mp4",
                    "title": title,
                    "duration": duration,
                    "width": width,
                    "height": height,
                    "uploader": info.get("uploader", "Unknown"),
                    "error": None
                }

        except Exception as e:
            logger.error(f"yt-dlp download failed for URL {url}: {e}")
            return {
                "success": False,
                "file_path": None,
                "filename": None,
                "title": None,
                "duration": 0.0,
                "width": 1920,
                "height": 1080,
                "uploader": None,
                "error": str(e)
            }

video_downloader = VideoDownloader()
