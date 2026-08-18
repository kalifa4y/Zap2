import os
import pytest
from app.services.video_processor import VideoProcessor

def test_video_processor_metadata_not_found():
    vp = VideoProcessor()
    with pytest.raises(FileNotFoundError):
        vp.get_video_metadata("dummy_non_existent_file.mp4")

def test_silence_detect_fallback():
    vp = VideoProcessor()
    silences = vp.detect_silence("dummy_non_existent.mp4")
    assert isinstance(silences, list)

def test_render_vertical_clip_fallback():
    vp = VideoProcessor()
    out_path = vp.render_vertical_9x16_clip(
        input_video_path="dummy.mp4",
        output_clip_path="storage/exports/dummy_out.mp4",
        start_time=0.0,
        end_time=10.0
    )
    assert out_path == "storage/exports/dummy_out.mp4"

def test_compute_speech_intervals():
    vp = VideoProcessor()
    # Clip from 10.0 to 30.0 with a silence between 15.0 and 20.0
    silences = [(15.0, 20.0)]
    intervals = vp.compute_speech_intervals(10.0, 30.0, silences)
    assert len(intervals) == 2
    # First chunk around 10.0 to 15.0
    assert intervals[0][0] == 10.0
    assert intervals[0][1] <= 15.1
    # Second chunk around 19.9 to 30.0
    assert intervals[1][0] >= 19.9
    assert intervals[1][1] == 30.0

