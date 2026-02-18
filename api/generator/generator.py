import sys
import os
import json
import shutil
import argparse
import multiprocessing
from PIL import Image, ImageDraw, ImageFont
import numpy as np

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

def create_pil_text_clip(text, fontsize, color, stroke_width, width, height, align, position_y, font_family=None, letter_spacing=0, line_height=1.0, font_weight=None):
    try:
        def contains_georgian(value):
            return any('\u10A0' <= ch <= '\u10FF' for ch in value)

        def load_font(family, size, text_value):
            candidates = []
            font_dir = None
            if os.name == 'nt':
                windir = os.environ.get('WINDIR', 'C:\\Windows')
                font_dir = os.path.join(windir, 'Fonts')

            def add_candidate(name):
                if not name:
                    return
                candidates.append(name)
                if font_dir:
                    candidates.append(os.path.join(font_dir, name))

            family_key = (family or '').strip().lower()
            has_georgian = contains_georgian(text_value)

            if has_georgian:
                for candidate in [
                    'NotoSansGeorgian-Regular.ttf',
                    'NotoSansGeorgian.ttf',
                    'NotoSansGeorgian-Bold.ttf',
                    'Sylfaen.ttf',
                    'sylfaen.ttf',
                    'segoeui.ttf',
                    'segoeuib.ttf'
                ]:
                    add_candidate(candidate)

            if family_key:
                add_candidate(family)
                add_candidate(f"{family}.ttf")
                add_candidate(f"{family}.otf")

            family_map = {
                'arial': ['arial.ttf'],
                'times new roman': ['times.ttf'],
                'courier new': ['cour.ttf'],
                'comic sans ms': ['comic.ttf'],
                'impact': ['impact.ttf']
            }
            for name in family_map.get(family_key, []):
                add_candidate(name)

            if has_georgian:
                add_candidate('Sylfaen.ttf')
                add_candidate('sylfaen.ttf')
                add_candidate('segoeui.ttf')

            add_candidate('arial.ttf')
            add_candidate('DejaVuSans.ttf')

            for candidate in candidates:
                try:
                    return ImageFont.truetype(candidate, size)
                except Exception:
                    continue
            if has_georgian:
                print("Warning: Georgian text detected but no compatible font found. Falling back to default.")
            return ImageFont.load_default()

        def measure_text(draw_obj, value, font_obj, spacing):
            if spacing <= 0:
                bbox = draw_obj.textbbox((0, 0), value, font=font_obj)
                return bbox[2] - bbox[0], bbox[3] - bbox[1]
            total_w = 0
            max_h = 0
            for ch in value:
                bbox = draw_obj.textbbox((0, 0), ch, font=font_obj)
                ch_w = bbox[2] - bbox[0]
                ch_h = bbox[3] - bbox[1]
                total_w += ch_w
                if ch_h > max_h:
                    max_h = ch_h
            total_w += spacing * max(0, len(value) - 1)
            return total_w, max_h

        def draw_text_with_spacing(draw_obj, value, start_x, start_y, font_obj, fill_color, stroke, stroke_fill, spacing):
            if spacing <= 0:
                if stroke > 0:
                    for offset_x in range(-stroke, stroke + 1):
                        for offset_y in range(-stroke, stroke + 1):
                            draw_obj.text((start_x + offset_x, start_y + offset_y), value, font=font_obj, fill=stroke_fill)
                draw_obj.text((start_x, start_y), value, font=font_obj, fill=fill_color)
                return
            current_x = start_x
            for ch in value:
                if stroke > 0:
                    for offset_x in range(-stroke, stroke + 1):
                        for offset_y in range(-stroke, stroke + 1):
                            draw_obj.text((current_x + offset_x, start_y + offset_y), ch, font=font_obj, fill=stroke_fill)
                draw_obj.text((current_x, start_y), ch, font=font_obj, fill=fill_color)
                bbox = draw_obj.textbbox((0, 0), ch, font=font_obj)
                current_x += (bbox[2] - bbox[0]) + spacing

        img = Image.new('RGBA', (width, int(max(fontsize * line_height, fontsize) + stroke_width * 2 + 4)), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        font = load_font(font_family, fontsize, text)
        text_w, text_h = measure_text(draw, text, font, letter_spacing)

        padding = int(width * 0.05)
        x = padding
        if align == 'center':
            x = (width - text_w) // 2
        elif align == 'right':
            x = width - text_w - padding

        y = (img.height - text_h) // 2
        draw_text_with_spacing(draw, text, x, y, font, color, stroke_width, 'black', letter_spacing)

        return ImageClip(np.array(img)).set_position(('center', position_y))
    except Exception as e:
        print(f"Error creating text clip: {e}")
        return None

def create_text_overlay(clip, textOverlay, width, height):
    """Add text and logo overlay to clip"""
    if not textOverlay.get('enabled', False):
        print("DEBUG: Text overlay disabled")
        return clip
    
    text_value = textOverlay.get('text', '').strip()
    title = textOverlay.get('title', '')
    price = textOverlay.get('price', '')
    phone = textOverlay.get('phone', '')
    position = textOverlay.get('position', 'bottom-left')
    color = textOverlay.get('color', 'white')
    show_logo = textOverlay.get('showLogo', False)
    print(f"DEBUG: text_overlay text_len={len(text_value)} position={position} color={color} fontFamily={textOverlay.get('fontFamily')}")
    
    # Color mapping
    color_map = {
        'white': 'white',
        'black': 'black',
        'orange': '#F97316',
        'red': '#EF4444',
        'green': '#22C55E',
        'sky': '#0EA5E9',
        'gray': '#6B7280',
        'maroon': '#800000'
    }
    text_color = color_map.get(color, 'white')
    
    # Position mapping
    position_parts = position.split('-')
    vertical = position_parts[0] if len(position_parts) > 0 else 'bottom'
    horizontal = position_parts[1] if len(position_parts) > 1 else 'left'
    text_align = horizontal

    font_family = textOverlay.get('fontFamily')
    font_sizes = textOverlay.get('fontSizes', {})
    font_weights = textOverlay.get('fontWeights', {})
    letter_spacing = textOverlay.get('letterSpacing', {})
    line_height = float(textOverlay.get('lineHeight', 1.1))
    line_gap = int(textOverlay.get('lineGap', 12))

    def get_size(key, default):
        value = font_sizes.get(key, default)
        try:
            return int(value)
        except Exception:
            return default

    def get_weight(key, default):
        value = font_weights.get(key, default)
        try:
            return int(value)
        except Exception:
            return default

    def get_spacing(key, default):
        value = letter_spacing.get(key, default)
        try:
            return float(value)
        except Exception:
            return default

    title_size = get_size('title', 60)
    price_size = get_size('price', 80)
    phone_size = get_size('phone', 40)

    title_weight = get_weight('title', 600)
    price_weight = get_weight('price', 700)
    phone_weight = get_weight('phone', 500)

    title_spacing = get_spacing('title', 0)
    price_spacing = get_spacing('price', 0)
    phone_spacing = get_spacing('phone', 0)

    lines = []
    if text_value:
        lines.append(('text', text_value, title_size, title_weight, title_spacing, 2))
    else:
        if title:
            lines.append(('title', title, title_size, title_weight, title_spacing, 2))
        if price:
            lines.append(('price', price, price_size, price_weight, price_spacing, 3))
        if phone:
            lines.append(('phone', f" {phone}", phone_size, phone_weight, phone_spacing, 1))

    if not lines:
        print("DEBUG: No text lines to render after validation")
        return clip

    total_height = 0
    for i, (_, _, size, _, _, _) in enumerate(lines):
        line_height_px = int(max(size * line_height, size))
        total_height += line_height_px
        if i < len(lines) - 1:
            total_height += line_gap

    if vertical == 'top':
        y_pos = int(height * 0.1)
    else:
        y_pos = int(height * 0.9 - total_height)
    
    # Build text clips
    text_clips = []
    current_y = y_pos

    for index, (_, value, size, weight, spacing, stroke) in enumerate(lines):
        clip_item = create_pil_text_clip(
            value,
            fontsize=size,
            color=text_color,
            stroke_width=stroke,
            width=width,
            height=height,
            align=text_align,
            position_y=current_y,
            font_family=font_family,
            letter_spacing=spacing,
            line_height=line_height,
            font_weight=weight
        )
        if clip_item:
            clip_item = clip_item.set_duration(clip.duration)
            text_clips.append(clip_item)
            line_height_px = int(max(size * line_height, size))
            if index < len(lines) - 1:
                current_y += line_height_px + line_gap
    
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
            position_y=30,
            font_family=font_family
        )
        if logo_clip:
            # Override position for top-right specifically
            logo_clip = logo_clip.set_position((width - 200, 30)).set_duration(clip.duration)
            text_clips.append(logo_clip)
    
    if text_clips:
        # Create a new composite clip where text overlays are added
        # Important: set_duration must be called on the composite clip
        final = CompositeVideoClip([clip] + text_clips, size=(width, height)).set_duration(clip.duration)
        return final
    
    return clip

def generate_format(fmt_key, dimensions, images, temp_base, property_id, output_dir, settings, platform_name=None):
    w, h = dimensions
    fps = int(settings.get("fps", 30))
    duration = float(settings.get("secondsPerImage", 3.0))
    transition_type = settings.get("transition", "cut") 
    music_file = settings.get("musicFile")
    music_volume = float(settings.get("musicVolume", 0.5))
    trans_duration = float(settings.get("transitionDuration", 0.8))
    text_overlay = settings.get("textOverlay", {})
    
    # DEBUG
    print(f"DEBUG generate_format: fmt_key={fmt_key}, platform_name={platform_name}")
    
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
    # Apply text overlay to the final concatenated clip instead of individual clips
    # This ensures text stays on top of transitions
    final_clip_with_text = create_text_overlay(final_clip, text_overlay, w, h)
    
    # 5. Add Music (if provided)
    if music_file and os.path.exists(music_file):
        try:
            audio = AudioFileClip(music_file)
            if music_volume != 1.0:
                audio = audio.volumex(music_volume)
            
            video_duration = final_clip_with_text.duration
            if audio.duration < video_duration:
                audio = audio.loop(duration=video_duration)
            else:
                audio = audio.subclip(0, video_duration)
                
            final_clip_with_text = final_clip_with_text.set_audio(audio)
        except Exception as e:
            print(f"Warning: Failed to add music: {e}")

    # 6. Write File
    if platform_name:
        out_filename = f"{property_id}_{platform_name.replace(' + ', '_')}_{fmt_key}.mp4"
    else:
        out_filename = f"{property_id}_{fmt_key}.mp4"
    out_path = os.path.join(output_dir, out_filename)
    
    try:
        final_clip_with_text.write_videofile(
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
    
    # DEBUG: Print what we received
    print(f"DEBUG: Settings received: {json.dumps(settings, indent=2)}")
    
    # Get platforms and formats from settings
    platforms = settings.get("platforms", {})
    selected_formats = settings.get("formats", {})
    
    print(f"DEBUG: platforms={platforms}")
    print(f"DEBUG: selected_formats={selected_formats}")
    
    # Map formats to platform names
    format_to_platform = {}
    for platform_id, enabled in platforms.items():
        if enabled and platform_id in selected_formats:
            fmt = selected_formats[platform_id]
            platform_name = platform_id.upper()
            if fmt not in format_to_platform:
                format_to_platform[fmt] = []
            format_to_platform[fmt].append(platform_name)

    try:
        tasks = []
        for fmt_key, dimensions in FORMATS.items():
            # Check if this format is selected by any platform
            platform_names = format_to_platform.get(fmt_key, [])
            if platform_names:  # Only generate if at least one platform uses this format
                platform_label = " + ".join(platform_names)
                tasks.append((fmt_key, dimensions, images, temp_base, property_id, output_dir, settings, platform_label))
        
        if not tasks:
            print("No formats selected by any platform!")
            return []
        
        num_processes = min(4, multiprocessing.cpu_count())
        
        with multiprocessing.Pool(processes=num_processes) as pool:
            results = pool.starmap(generate_format, tasks)
            generated_files = [f for f in results if f]  # Filter out None values

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
