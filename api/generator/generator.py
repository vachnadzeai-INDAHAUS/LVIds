import sys
import os
import json
import shutil
import argparse
import multiprocessing
from PIL import Image

# Monkey patch for Pillow 10+ which removed ANTIALIAS
if not hasattr(Image, 'ANTIALIAS'):
    if hasattr(Image, 'Resampling'):
        Image.ANTIALIAS = Image.Resampling.LANCZOS
    else:
        Image.ANTIALIAS = Image.LANCZOS

from moviepy.editor import ImageClip, concatenate_videoclips, AudioFileClip, CompositeAudioClip
from preprocess import preprocess_images
from transitions import (
    slide_transition, zoom_transition, wipe_transition,
    circle_transition, pixelate_transition, spin_transition, 
    fly_transition, page_curl_transition, ripple_transition
)

# Formats definition
FORMATS = {
    "9x16": (1080, 1920),
    "1x1": (1080, 1080),
    "4x5": (1080, 1350),
    "16x9": (1920, 1080)
}

def clean_temp(path):
    if os.path.exists(path):
        try:
            shutil.rmtree(path)
        except Exception as e:
            print(f"Warning: Failed to clean temp {path}: {e}")

from proglog import ProgressBarLogger

class MyBarLogger(ProgressBarLogger):
    def __init__(self, fmt):
        super().__init__()
        self.fmt = fmt

    def callback(self, **changes):
        pass

    def bars_callback(self, bar, attr, value, old_value=None):
        if bar == 't' and 'total' in self.bars[bar]:
             percentage = (value / self.bars[bar]['total']) * 100
             # Print to stderr to capture in node
             sys.stderr.write(f"::PROGRESS::{self.fmt}::{int(percentage)}\n")
             sys.stderr.flush()

def generate_format(fmt_key, dimensions, images, temp_base, property_id, output_dir, settings):
    w, h = dimensions
    fps = int(settings.get("fps", 30))
    duration = float(settings.get("secondsPerImage", 3.0))
    transition_type = settings.get("transition", "cut") 
    music_file = settings.get("musicFile")
    music_volume = float(settings.get("musicVolume", 0.5))
    trans_duration = float(settings.get("transitionDuration", 0.8))
    
    if duration <= trans_duration:
        trans_duration = duration / 2

    print(f"Rendering {fmt_key} ({w}x{h})...")
    
    # 1. Preprocess images for this format
    fmt_temp_dir = os.path.join(temp_base, fmt_key)
    os.makedirs(fmt_temp_dir, exist_ok=True)
    
    proc_images = preprocess_images(images, fmt_temp_dir, w, h)
    
    # 2. Create Clips logic
    main_clips = []
    
    for img_path in proc_images:
        clip = ImageClip(img_path).set_duration(duration)
        if transition_type == "fade":
             clip = clip.crossfadein(0.5)
        main_clips.append(clip)
    
    # 3. Concatenate
    if transition_type == "cut":
        final_clip = concatenate_videoclips(main_clips, method="compose")
    elif transition_type == "fade":
        final_clip = concatenate_videoclips(main_clips, method="compose", padding=-0.5)
    else:
        # Custom transitions logic
        final_clips_sequence = []
        for i in range(len(main_clips)):
            current_clip = main_clips[i]
            
            if i == 0:
                # First clip
                if len(main_clips) > 1:
                    # Fix for short duration
                    end_time = duration - trans_duration
                    if end_time <= 0:
                        end_time = duration
                        
                    body = current_clip.subclip(0, end_time)
                    final_clips_sequence.append(body)
                else:
                    final_clips_sequence.append(current_clip)
            else:
                prev_clip_ref = main_clips[i-1]
                
                # Tail of Prev
                start_tail = duration - trans_duration
                if start_tail < 0: start_tail = 0
                
                c1 = prev_clip_ref.subclip(start_tail, duration)
                
                # Head of Current
                end_head = trans_duration
                if end_head > duration: end_head = duration
                
                c2 = current_clip.subclip(0, end_head)
                
                # Generate Transition
                trans = None
                if transition_type == "slide_left":
                    trans = slide_transition(c1, c2, trans_duration, 'left')
                elif transition_type == "slide_right":
                    trans = slide_transition(c1, c2, trans_duration, 'right')
                elif transition_type == "slide_up":
                    trans = slide_transition(c1, c2, trans_duration, 'up')
                elif transition_type == "slide_down":
                    trans = slide_transition(c1, c2, trans_duration, 'down')
                elif transition_type == "zoom_in":
                    trans = zoom_transition(c1, c2, trans_duration, 'in')
                elif transition_type == "zoom_out":
                    trans = zoom_transition(c1, c2, trans_duration, 'out')
                elif transition_type == "wipe_left":
                    trans = wipe_transition(c1, c2, trans_duration, 'left')
                elif transition_type == "wipe_right":
                    trans = wipe_transition(c1, c2, trans_duration, 'right')
                elif transition_type == "wipe_up":
                    trans = wipe_transition(c1, c2, trans_duration, 'up')
                elif transition_type == "wipe_down":
                    trans = wipe_transition(c1, c2, trans_duration, 'down')
                elif transition_type == "circle_open":
                    trans = circle_transition(c1, c2, trans_duration, 'open')
                elif transition_type == "circle_close":
                    trans = circle_transition(c1, c2, trans_duration, 'close')
                elif transition_type == "pixelate":
                    trans = pixelate_transition(c1, c2, trans_duration)
                elif transition_type == "spin_in":
                    trans = spin_transition(c1, c2, trans_duration, 'in')
                elif transition_type == "spin_out":
                    trans = spin_transition(c1, c2, trans_duration, 'out')
                elif transition_type == "fly_in":
                    trans = fly_transition(c1, c2, trans_duration, 'in')
                elif transition_type == "fly_out":
                    trans = fly_transition(c1, c2, trans_duration, 'out')
                elif transition_type == "page_curl":
                    trans = page_curl_transition(c1, c2, trans_duration)
                elif transition_type == "ripple":
                    trans = ripple_transition(c1, c2, trans_duration)
                else:
                    # Fallback to cut if unknown
                    trans = concatenate_videoclips([c1, c2])

                final_clips_sequence.append(trans)
                
                # Body of current
                start = trans_duration
                if i == len(main_clips) - 1:
                    end = duration
                else:
                    end = duration - trans_duration
                
                # Fix for clip duration < start (e.g. 1.0s clip, 0.8s transition)
                if start >= end:
                    start = 0
                    end = duration 
                
                body = current_clip.subclip(start, end)
                final_clips_sequence.append(body)
        
        final_clip = concatenate_videoclips(final_clips_sequence, method="compose")
    
    # 4. Add Music (if provided)
    if music_file and os.path.exists(music_file):
        try:
            audio = AudioFileClip(music_file)
            if music_volume != 1.0:
                audio = audio.volumex(music_volume)
            
            video_duration = final_clip.duration
            if audio.duration < video_duration:
                audio = audio.audio_loop(duration=video_duration)
            else:
                audio = audio.subclip(0, video_duration)
                
            final_clip = final_clip.set_audio(audio)
        except Exception as e:
            print(f"Warning: Failed to add music: {e}")

    # 5. Write File
    out_filename = f"{property_id}_{fmt_key}.mp4"
    out_path = os.path.join(output_dir, out_filename)
    
    try:
        final_clip.write_videofile(
            out_path, 
            fps=fps, 
            codec="libx264", 
            audio_codec="aac" if music_file else None,
            audio=bool(music_file),
            preset="ultrafast",  # Changed to ultrafast for speed
            threads=4,
            logger=MyBarLogger(fmt_key)
        )
        return out_filename
    finally:
        final_clip.close()
        for c in main_clips:
            c.close()

def generate_slideshow(images, property_id, output_dir, settings):
    """
    Main generator function with multiprocessing.
    """
    generated_files = []
    
    # Create a temp dir for this run
    temp_base = os.path.join(output_dir, "temp_proc")
    os.makedirs(temp_base, exist_ok=True)

    try:
        # Prepare arguments for each process
        tasks = []
        for fmt_key, dimensions in FORMATS.items():
            tasks.append((fmt_key, dimensions, images, temp_base, property_id, output_dir, settings))
        
        # Run in parallel
        # Limit processes to CPU count or 4 (since we have 4 formats)
        num_processes = min(4, multiprocessing.cpu_count())
        
        with multiprocessing.Pool(processes=num_processes) as pool:
            # starmap blocks until all are done
            results = pool.starmap(generate_format, tasks)
            generated_files = results

    finally:
        # Clean temp directory after success or failure
        clean_temp(temp_base)

    return generated_files

if __name__ == "__main__":
    # Arguments: --images [list] --id [str] --output [dir] --settings [json_str]
    parser = argparse.ArgumentParser()
    parser.add_argument("--images", nargs="+", required=True)
    parser.add_argument("--id", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--settings", required=True)
    
    args = parser.parse_args()
    
    # Redirect stdout to stderr to prevent logs from corrupting JSON output
    original_stdout = sys.stdout
    sys.stdout = sys.stderr
    
    try:
        # settings might be passed as a string representation of json
        settings = json.loads(args.settings)
        files = generate_slideshow(args.images, args.id, args.output, settings)
        
        # Restore stdout for the final JSON
        sys.stdout = original_stdout
        # Print JSON result to stdout for Node.js to capture
        print(json.dumps({"status": "success", "files": files}))
    except Exception as e:
        # Restore stdout in case of error too
        sys.stdout = original_stdout
        # Print error JSON
        print(json.dumps({"status": "error", "message": str(e)}))
        sys.exit(1)
