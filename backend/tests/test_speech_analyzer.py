import pytest
from app.services.speech_analyzer import SpeechAnalyzer

def test_speech_analyzer_fallback():
    analyzer = SpeechAnalyzer()
    res = analyzer.transcribe_and_detect_fillers("non_existent_path.wav")
    assert "segments" in res
    assert len(res["segments"]) >= 1
    assert "language" in res

def test_smart_clip_ranges_generation():
    analyzer = SpeechAnalyzer()
    dummy_transcription = {
        "segments": [
            {"start": 0.0, "end": 15.0, "text": "Bonjour tout le monde."},
            {"start": 15.0, "end": 35.0, "text": "Aujourd'hui nous allons parler de SnapCut et de ses fonctionnalités."},
            {"start": 35.0, "end": 65.0, "text": "Le recadrage 9:16 avec arrière-plan flouté est ultra rapide."},
            {"start": 65.0, "end": 95.0, "text": "Et voilà comment vous pouvez publier en un seul clic !"}
        ]
    }
    clips = analyzer.generate_smart_clip_ranges(
        total_duration=100.0,
        transcription_data=dummy_transcription,
        silence_ranges=[(34.0, 35.0)],
        min_clip_duration=30.0,
        max_clip_duration=60.0
    )
    assert len(clips) >= 1
    for clip in clips:
        assert clip["duration"] >= 20.0
        assert "#Shorts" in clip["description"]
        assert clip["start_time"] < clip["end_time"]
