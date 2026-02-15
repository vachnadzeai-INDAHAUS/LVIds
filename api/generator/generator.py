import sys
import os
import json
import shutil
import argparse
import multiprocessing
from PIL import Image, ImageDraw, ImageFont

# Monkey patch for Pillow 10+ which removed ANTIALIAS
if not hasattr(Image, 'ANTIALIAS'):
    if hasattr(Image, 'Resampling'):
        Image.ANTIALIAS = Image.Resampling.LANCZOS
    else:
        Image.ANTIALIAS = Image.LANCZOS

from moviepy.editor import ImageClip, CompositeVideoClip, concatenate_videoclips, AudioFileClip, CompositeAudioClip
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
            # ignore_errors=True helps on Windows when files are still locked
            shutil.rmtree(path, ignore_errors=True)
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

def create_pil_text_clip(text, fontsize, color, stroke_width, width, height, align, position_y):
    """
    Create a MoviePy ImageClip with text using Pillow (no ImageMagick required).
    """
    try:
        # Create a transparent image for the text
        # Make it full width for proper centering
        img = Image.new('RGBA', (width, int(fontsize * 1.5)), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # Try to load Arial font, fallback to default
        try:
            font = ImageFont.truetype("arial.ttf", fontsize)
        except IOError:
            try:
                # Try a common linux font
                font = ImageFont.truetype("DejaVuSans.ttf", fontsize)
            except IOError:
                font = ImageFont.load_default()
        
        # Calculate text size
        bbox = draw.textbbox((0, 0), text, font=font)
        text_w = bbox[2] - bbox[0]
        text_h = bbox[3] - bbox[1]
        
        # Calculate X position
        x = 50 # Default left padding
        if align == 'center':
            x = (width - text_w) // 2
        elif align == 'right':
            x = width - text_w - 50
            
        # Draw stroke (outline) manually
        if stroke_width > 0:
            stroke_color = 'black'
            # Draw in 8 directions for stroke
            for offset_x in range(-stroke_width, stroke_width+1):
                for offset_y in range(-stroke_width, stroke_width+1):
                    draw.text((x + offset_x, (img.height - text_h)//2 + offset_y), text, font=font, fill=stroke_color)
        
        # Draw main text
        draw.text((x, (img.height - text_h)//2), text, font=font, fill=color)
        
        # Convert to numpy array for MoviePy
        return ImageClip(np.array(img)).set_position(('center', position_y))
        
    except Exception as e:
        print(f"Error creating text clip: {e}")
        return None

def create_text_overlay(clip, textOverlay, width, height):
    """Add text and logo overlay to clip"""
    if not textOverlay.get('enabled', False):
        return clip
    
    title = textOverlay.get('title', '')
    price = textOverlay.get('price', '')
    phone = textOverlay.get('phone', '')
    position = textOverlay.get('position', 'bottom-left')
    color = textOverlay.get('color', 'white')
    show_logo = textOverlay.get('showLogo', False)
    
    # Color mapping
    color_map = {
        'white': 'white',
        'black': 'black', 
        'orange': '#F97316'
    }
    text_color = color_map.get(color, 'white')
    
    # Position mapping
    position_map = {
        'bottom-left': ('left', height - 150),
        'bottom-center': ('center', height - 150),
        'bottom-right': ('right', height - 150)
    }
    
    text_align, y_pos = position_map.get(position, ('left', height - 150))
    
    # Build text clips
    text_clips = []
    current_y = y_pos
    
    # Helper to calculate position based on alignment
    def get_pos(clip_w, current_y, align, container_w):
        if align == 'center':
            return ('center', current_y)
        elif align == 'right':
            return (container_w - clip_w - 50, current_y)
        else:
            return (50, current_y)

    if title:
        # Use our custom PIL function
        title_clip = create_pil_text_clip(
            title, 
            fontsize=60, 
            color=text_color, 
            stroke_width=2, 
            width=width, 
            height=height, 
            align=text_align,
            position_y=current_y
        )
        if title_clip:
            title_clip = title_clip.set_duration(clip.duration)
            text_clips.append(title_clip)
            current_y += 70 # Approximate height + padding
    
    if price:
        price_clip = create_pil_text_clip(
            price, 
            fontsize=80, 
            color=text_color, 
            stroke_width=3, 
            width=width, 
            height=height, 
            align=text_align,
            position_y=current_y
        )
        if price_clip:
            price_clip = price_clip.set_duration(clip.duration)
            text_clips.append(price_clip)
            current_y += 90 # Approximate height + padding
    
    if phone:
        phone_text = f"📞 {phone}"
        phone_clip = create_pil_text_clip(
            phone_text, 
            fontsize=40, 
            color=text_color, 
            stroke_width=1, 
            width=width, 
            height=height, 
            align=text_align,
            position_y=current_y
        )
        if phone_clip:
            phone_clip = phone_clip.set_duration(clip.duration)
            text_clips.append(phone_clip)
    
    # Logo overlay (top-right)
    if show_logo:
        logo_clip = create_pil_text_clip(
            "LUMINAVIDS",
            fontsize=30,
            color='white',
            stroke_width=1,
            width=width,
            height=height,
            align='right', # Force right align for logo
            position_y=30
        )
        if logo_clip:
            # Override position for top-right specifically
            logo_clip = logo_clip.set_position((width - 200, 30)).set_duration(clip.duration)
            text_clips.append(logo_clip)
    
    # Composite all clips
    if text_clips:
        return CompositeVideoClip([clip] + text_clips, size=(width, height))
    
    return clip

def generate_format(fmt_key, dimensions, images, temp_base, property_id, output_dir, settings):
    w, h = dimensions
    fps = int(settings.get("fps", 30))
    duration = float(settings.get("secondsPerImage", 3.0))
    transition_type = settings.get("transition", "cut") 
    music_file = settings.get("musicFile")
    music_volume = float(settings.get("musicVolume", 0.5))
    trans_duration = float(settings.get("transitionDuration", 0.8))
    text_overlay = settings.get("textOverlay", {})
    
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
                end_time = duration - trans_duration
                if end_time <= 0:
                    end_time = duration
                body = current_clip.subclip(0, end_time)
                final_clips_sequence.append(body)
            else:
                prev_clip_ref = main_clips[i-1]
                start_tail = duration - trans_duration
                if start_tail < 0: start_tail = 0
                c1 = prev_clip_ref.subclip(start_tail, duration)
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
                
                # Mapped Fallbacks for missing transitions
                elif transition_type == "luma_wipe":
                    trans = wipe_transition(c1, c2, trans_duration, 'left')
                elif transition_type == "glitch":
                    trans = pixelate_transition(c1, c2, trans_duration)
                elif transition_type == "cube3d":
                    trans = spin_transition(c1, c2, trans_duration, 'in')
                elif transition_type == "flip3d":
                    trans = spin_transition(c1, c2, trans_duration, 'out')
                elif transition_type == "blur_crossfade":
                    trans = concatenate_videoclips([c1, c2], method="compose", padding=-0.5) # fade fallback
                elif transition_type == "directional_blur_wipe":
                    trans = wipe_transition(c1, c2, trans_duration, 'right')
                
                else:
                    # Default cut
                    trans = concatenate_videoclips([c1, c2])

                final_clips_sequence.append(trans)
                
                start = trans_duration
                if i == len(main_clips) - 1:
                    end = duration
                else:
                    end = duration - trans_duration
                
                if start >= end:
                    start = 0
                    end = duration 
                
                body = current_clip.subclip(start, end)
                final_clips_sequence.append(body)
        
        final_clip = concatenate_videoclips(final_clips_sequence, method="compose")
    
    # 4. Add Text Overlay (if enabled)
    final_clip = create_text_overlay(final_clip, text_overlay, w, h)
    
    # 5. Add Music (if provided)
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

    # 6. Write File
    out_filename = f"{property_id}_{fmt_key}.mp4"
    out_path = os.path.join(output_dir, out_filename)
    
    try:
        final_clip.write_videofile(
            out_path, 
            fps=fps, 
            codec="libx264", 
            audio_codec="aac" if music_file else None,
            audio=bool(music_file),
            preset="ultrafast",
            threads=4,
            logger=MyBarLogger(fmt_key)
        )
        return out_filename
    finally:
        final_clip.close()
        for c in main_clips:
            c.close()

def generate_slideshow(images, property_id, output_dir, settings):
    """Main generator function with multiprocessing."""
    generated_files = []
    temp_base = os.path.join(output_dir, "temp_proc")
    os.makedirs(temp_base, exist_ok=True)

    try:
        tasks = []
        for fmt_key, dimensions in FORMATS.items():
            tasks.append((fmt_key, dimensions, images, temp_base, property_id, output_dir, settings))
        
        num_processes = min(4, multiprocessing.cpu_count())
        
        with multiprocessing.Pool(processes=num_processes) as pool:
            results = pool.starmap(generate_format, tasks)
            generated_files = results

    finally:
        clean_temp(temp_base)

    return generated_files

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--images", nargs="+", required=True)
    parser.add_argument("--id", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--settings", required=True)
    
    args = parser.parse_args()
    
    original_stdout = sys.stdout
    sys.stdout = sys.stderr
    
    try:
        settings = json.loads(args.settings)
        files = generate_slideshow(args.images, args.id, args.output, settings)
        
        sys.stdout = original_stdout
        print(json.dumps({"status": "success", "files": files}))
    except Exception as e:
        sys.stdout = original_stdout
        print(json.dumps({"status": "error", "message": str(e)}))
        sys.exit(0) # Exit with 0 so the node server can parse the error message
