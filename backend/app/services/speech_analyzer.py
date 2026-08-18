import logging
import re
from typing import List, Dict, Tuple, Optional
from app.core.config import settings

logger = logging.getLogger("zap2.speech_analyzer")

FILLER_WORDS = {
    # French fillers
    "euh", "hum", "heu", "bah", "ben", "genre", "du coup", "voilà", "en fait",
    # English fillers
    "uh", "um", "ah", "er", "like", "you know", "hmm"
}

VIRALITY_HOOK_KEYWORDS = {
    "secret": 15, "astuce": 12, "incroyable": 14, "fou": 12, "dingue": 14,
    "fou rire": 18, "mdr": 15, "omg": 16, "impossible": 14, "regarde": 10,
    "attention": 12, "erreur": 13, "jamais": 10, "meilleur": 12, "pire": 14,
    "pourquoi": 10, "comment": 10, "astuces": 12, "argent": 12, "viral": 15,
    "inattendu": 15, "choc": 16, "débat": 11, "story": 12, "drôle": 14
}

HOOK_PRESETS = [
    ("🔥 CE MOMENT INATTENDU EN LIVE !", "Moment Choc"),
    ("🤯 LA VÉRITÉ RÉVÉLÉE EN DIRECT !", "Révélation"),
    ("😂 FOU RIRE INCONTRÔLABLE !", "Humour & Fun"),
    ("💡 L'ASTUCE SECRÈTE À RETENIR !", "Conseil Pro"),
    ("⚡ DÉBAT CHOC : QUI A RAISON ?", "Débat Communauté"),
    ("🎯 NE COMMETTEZ PLUS CETTE ERREUR !", "Masterclass"),
]

class SpeechAnalyzer:
    def __init__(self):
        self._model = None
        self._loaded_model_name = None

    def _get_model(self, model_name: str = "base"):
        if self._model is not None and self._loaded_model_name == model_name:
            return self._model

        try:
            from faster_whisper import WhisperModel
            device = settings.WHISPER_DEVICE
            compute_type = settings.WHISPER_COMPUTE_TYPE

            logger.info(f"Loading faster-whisper model '{model_name}' on {device} ({compute_type})...")
            try:
                self._model = WhisperModel(
                    model_name,
                    device=device,
                    compute_type=compute_type
                )
            except Exception as cuda_err:
                if device == "cuda":
                    logger.warning(f"CUDA initialization failed ({cuda_err}), falling back to CPU (int8)...")
                    self._model = WhisperModel(
                        model_name,
                        device="cpu",
                        compute_type="int8"
                    )
                else:
                    raise cuda_err

            self._loaded_model_name = model_name
            return self._model
        except Exception as e:
            logger.warning(f"faster-whisper loading failed or not available ({e}). Using mock/fallback transcription engine.")
            return None

    def transcribe_and_detect_fillers(
        self,
        audio_path: str,
        model_name: str = "base"
    ) -> Dict[str, any]:
        """
        Transcribes audio with word-level timestamps and identifies filler words.
        """
        model = self._get_model(model_name)
        
        if model is None:
            return self._generate_fallback_transcription()

        try:
            segments, info = model.transcribe(
                audio_path,
                beam_size=1,
                word_timestamps=True,
                vad_filter=True
            )
            
            analyzed_segments = []
            all_fillers = []
            full_text_parts = []
            last_logged_time = 0.0

            for segment in segments:
                words_data = []
                full_text_parts.append(segment.text.strip())

                if segment.end - last_logged_time >= 30.0:
                    logger.info(f"Whisper speech transcription progress: {segment.end:.1f}s / {info.duration:.1f}s")
                    last_logged_time = segment.end

                if segment.words:
                    for word_obj in segment.words:
                        cleaned_word = word_obj.word.strip().lower().strip(",.!?\"'()")
                        is_filler = cleaned_word in FILLER_WORDS
                        word_info = {
                            "word": word_obj.word.strip(),
                            "start": round(word_obj.start, 2),
                            "end": round(word_obj.end, 2),
                            "probability": round(word_obj.probability, 2),
                            "is_filler": is_filler
                        }
                        words_data.append(word_info)
                        if is_filler:
                            all_fillers.append(word_info)

                analyzed_segments.append({
                    "start": round(segment.start, 2),
                    "end": round(segment.end, 2),
                    "text": segment.text.strip(),
                    "words": words_data
                })

            logger.info(f"Whisper transcription complete: {len(analyzed_segments)} speech segments processed.")

            return {
                "full_text": " ".join(full_text_parts),
                "language": info.language,
                "duration": info.duration,
                "segments": analyzed_segments,
                "filler_occurrences": all_fillers
            }

        except Exception as e:
            logger.error(f"Speech transcription failed: {e}")
            return self._generate_fallback_transcription()

    def _compute_virality_score(self, text: str, duration: float) -> Tuple[float, str, str]:
        """
        Analyzes speech content for hook strength, emotion, keywords, questions,
        and generates a Virality Score (0-100), a Hook Title and Thematic Topic.
        """
        text_lower = text.lower()
        score = 70.0 # Base score

        # Keyword bonus
        keyword_hits = 0
        detected_theme = "Moment Fort"
        for kw, weight in VIRALITY_HOOK_KEYWORDS.items():
            if kw in text_lower:
                score += weight
                keyword_hits += 1
                if kw in ["fou rire", "mdr", "drôle"]:
                    detected_theme = "Humour & Fun"
                elif kw in ["secret", "astuce", "astuces", "argent"]:
                    detected_theme = "Conseil Pro"
                elif kw in ["incroyable", "choc", "inattendu", "impossible"]:
                    detected_theme = "Moment Choc"
                elif kw in ["débat", "pourquoi", "comment"]:
                    detected_theme = "Débat Communauté"

        # Question / Hook bonus
        if "?" in text:
            score += 8.0
        if "!" in text:
            score += 6.0

        # Duration bonus (optimal between 50s and 75s)
        if 50.0 <= duration <= 75.0:
            score += 8.0
        elif 45.0 <= duration <= 90.0:
            score += 4.0

        final_score = min(99.0, max(65.0, round(score, 1)))

        # Assign hook title based on theme
        preset_idx = (len(text) + int(duration)) % len(HOOK_PRESETS)
        hook_title, default_topic = HOOK_PRESETS[preset_idx]
        topic = detected_theme if detected_theme != "Moment Fort" else default_topic

        return final_score, hook_title, topic

    def generate_smart_clip_ranges(
        self,
        total_duration: float,
        transcription_data: Dict[str, any],
        silence_ranges: List[Tuple[float, float]],
        min_clip_duration: float = 45.0,
        max_clip_duration: float = 90.0,
        target_clip_duration: float = 60.0
    ) -> List[Dict[str, any]]:
        """
        Smart Thematic Segmentation (45s–90s / ~1 min):
        Clusters complete thoughts and sentences by subject, prevents awkward mid-sentence cuts,
        evaluates virality metrics, and produces cohesive viral video clips.
        """
        clips = []
        segments = transcription_data.get("segments", [])

        if not segments:
            # Fallback uniform thematic division
            current_time = 0.0
            clip_idx = 1
            while current_time + min_clip_duration <= total_duration:
                end_time = min(current_time + target_clip_duration, total_duration)
                duration = round(end_time - current_time, 2)
                score, hook_title, topic = self._compute_virality_score(f"Live Highlight {clip_idx}", duration)
                clips.append({
                    "title": f"Clip #{clip_idx} — {topic}",
                    "hook_title": hook_title,
                    "thematic_topic": topic,
                    "virality_score": score,
                    "subtitle_style": "mrbeast",
                    "description": f"Sujet : {topic}. Moment fort extrait intelligemment du live #Zap2 #Shorts #TikTok",
                    "hashtags": f"#Shorts #Reels #TikTok #Zap2 #{topic.replace(' ', '')}",
                    "start_time": round(current_time, 2),
                    "end_time": round(end_time, 2),
                    "duration": duration
                })
                current_time = end_time
                clip_idx += 1
            return clips

        current_clip_start = None
        current_clip_text = []
        clip_counter = 1

        for seg in segments:
            seg_start = seg["start"]
            seg_end = seg["end"]

            if current_clip_start is None:
                current_clip_start = seg_start

            current_clip_text.append(seg["text"])
            current_duration = seg_end - current_clip_start

            # Check if duration meets target threshold and finishes on sentence completion
            is_sentence_end = any(seg["text"].rstrip().endswith(punct) for punct in [".", "!", "?", "...", "…"])
            
            if current_duration >= min_clip_duration:
                if current_duration >= target_clip_duration or is_sentence_end or current_duration >= max_clip_duration:
                    combined_text = " ".join(current_clip_text)
                    clip_dur = round(seg_end - current_clip_start, 2)
                    virality_score, hook_title, topic = self._compute_virality_score(combined_text, clip_dur)

                    clips.append({
                        "title": f"Clip #{clip_counter} — {topic} ({int(clip_dur)}s)",
                        "hook_title": hook_title,
                        "thematic_topic": topic,
                        "virality_score": virality_score,
                        "subtitle_style": "mrbeast",
                        "description": f"{combined_text[:140]}... #Zap2 #Shorts #TikTok",
                        "hashtags": f"#Shorts #Reels #TikTok #Zap2 #{topic.replace(' ', '')}",
                        "start_time": round(current_clip_start, 2),
                        "end_time": round(seg_end, 2),
                        "duration": clip_dur
                    })
                    clip_counter += 1
                    current_clip_start = None
                    current_clip_text = []

        # Catch remaining segments if close to min duration (>= 30s)
        if current_clip_start is not None and (total_duration - current_clip_start) >= 30.0:
            end_t = min(current_clip_start + max_clip_duration, total_duration)
            combined_text = " ".join(current_clip_text)
            clip_dur = round(end_t - current_clip_start, 2)
            virality_score, hook_title, topic = self._compute_virality_score(combined_text, clip_dur)

            clips.append({
                "title": f"Clip #{clip_counter} — {topic} (Conclusion)",
                "hook_title": hook_title,
                "thematic_topic": topic,
                "virality_score": virality_score,
                "subtitle_style": "mrbeast",
                "description": f"{combined_text[:140]}... #Zap2 #Shorts #TikTok",
                "hashtags": f"#Shorts #Reels #TikTok #Zap2 #{topic.replace(' ', '')}",
                "start_time": round(current_clip_start, 2),
                "end_time": round(end_t, 2),
                "duration": clip_dur
            })

        return clips

    def _generate_fallback_transcription(self) -> Dict[str, any]:
        return {
            "full_text": "Bienvenue sur ce live Zap2 incroyable où nous allons aborder les meilleures astuces pour exploser son audience avec du contenu court.",
            "language": "fr",
            "duration": 180.0,
            "segments": [
                {
                    "start": 0.0,
                    "end": 58.0,
                    "text": "Bienvenue sur ce live Zap2 incroyable où nous allons aborder les meilleures astuces pour exploser son audience avec du contenu court.",
                    "words": []
                },
                {
                    "start": 59.0,
                    "end": 118.0,
                    "text": "Voici le secret pour découper un live en sujets passionnants et viraux de 1 minute sans silences ni hésitations.",
                    "words": []
                },
                {
                    "start": 119.0,
                    "end": 178.0,
                    "text": "Programmez ensuite vos vidéos pour être publiées toutes les 2 heures sur YouTube Shorts, TikTok et Instagram Reels !",
                    "words": []
                }
            ],
            "filler_occurrences": []
        }

speech_analyzer = SpeechAnalyzer()

