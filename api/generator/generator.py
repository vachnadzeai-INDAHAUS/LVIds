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

FONT_FILE_MAP = {
    'ka_notosansgeorgian': ['NotoSansGeorgian-Regular.ttf', 'NotoSansGeorgian.ttf', 'NotoSansGeorgian-Bold.ttf'],
    'ka_notosansgeorgian_regular': ['NotoSansGeorgian-Regular.ttf', 'NotoSansGeorgian.ttf'],
    'ka_bpg_glaho': ['BPG_Glaho.ttf', 'bpg-glaho-webfont.ttf', 'bpg_nino_mkhedruli_bold.otf'],
    'ka_sylfaen': ['Sylfaen.ttf', 'sylfaen.ttf'],
    'en_inter': ['Inter-Regular.ttf', 'Inter.ttf', 'Inter-VariableFont_slnt,wght.ttf', 'Inter-VariableFont_opsz,wght.ttf', 'Inter_24pt-Regular.ttf', 'Inter_18pt-Regular.ttf'],
    'en_inter_regular': ['Inter-Regular.ttf', 'Inter.ttf', 'Inter-VariableFont_slnt,wght.ttf', 'Inter-VariableFont_opsz,wght.ttf', 'Inter_24pt-Regular.ttf', 'Inter_18pt-Regular.ttf'],
    'en_roboto_bold': ['Roboto-Bold.ttf', 'Roboto-Bold.ttf'],
    'en_playfairdisplay_regular': ['PlayfairDisplay-Regular.ttf', 'PlayfairDisplay.ttf'],
    'ru_notosans': ['NotoSans-Regular.ttf', 'NotoSans.ttf', 'NotoSans-Bold.ttf'],
    'ru_notosans_regular': ['NotoSans-Regular.ttf', 'NotoSans.ttf'],
    'ru_roboto_regular': ['Roboto-Regular.ttf', 'Roboto.ttf'],
    'ru_montserrat_regular': ['Montserrat-Regular.ttf', 'Montserrat.ttf'],
    'noto sans georgian': ['NotoSansGeorgian-Regular.ttf', 'NotoSansGeorgian.ttf'],
    'bpg glaho': ['BPG_Glaho.ttf', 'bpg-glaho-webfont.ttf', 'bpg_nino_mkhedruli_bold.otf'],
    'sylfaen': ['Sylfaen.ttf', 'sylfaen.ttf'],
    'inter': ['Inter-Regular.ttf', 'Inter.ttf', 'Inter-VariableFont_slnt,wght.ttf'],
    'roboto': ['Roboto-Regular.ttf', 'Roboto-Bold.ttf', 'Roboto.ttf'],
    'playfair display': ['PlayfairDisplay-Regular.ttf', 'PlayfairDisplay.ttf'],
    'montserrat': ['Montserrat-Regular.ttf', 'Montserrat.ttf'],
    'noto sans': ['NotoSans-Regular.ttf', 'NotoSans.ttf', 'NotoSans-Bold.ttf']
}

# Formats definition
FORMATS = {
    "9x16": (1080, 1920),
    "1x1": (1080, 1080),
    "4x5": (1080, 1350),
    "16x9": (1920, 1080)
}

DEFAULT_FORMATS = {
    "tiktok": "9x16",
    "instagram": "4x5",
    "facebook": "1x1",
    "youtube": "16x9"
}

ALLOWED_FORMATS = {
    "tiktok": {"9x16"},
    "instagram": {"1x1", "4x5", "9x16"},
    "facebook": {"1x1", "4x5", "16x9"},
    "youtube": {"9x16", "16x9"}
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

def create_pil_text_clip(text, fontsize, color, stroke_width, width, height, align, position_y, position_x=None, font_family=None, font_key=None, letter_spacing=0, line_height=1.0, font_weight=None):
    try:
        def contains_georgian(value):
            return any('\u10A0' <= ch <= '\u10FF' for ch in value)

        def load_font(family, size, text_value, key_value):
            candidates = []
            font_dir = None
            project_font_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'fonts')
            project_font_index = None
            if project_font_dir and os.path.isdir(project_font_dir):
                project_font_index = {}
                for root, _, files in os.walk(project_font_dir):
                    for file_name in files:
                        key_name = file_name.lower()
                        if key_name not in project_font_index:
                            project_font_index[key_name] = os.path.join(root, file_name)
            if os.name == 'nt':
                windir = os.environ.get('WINDIR', 'C:\\Windows')
                font_dir = os.path.join(windir, 'Fonts')

            def add_candidate(name):
                if not name:
                    return
                candidates.append(name)
                if font_dir:
                    candidates.append(os.path.join(font_dir, name))
                if project_font_dir:
                    candidates.append(os.path.join(project_font_dir, name))
                    if project_font_index:
                        match_path = project_font_index.get(name.lower())
                        if match_path:
                            candidates.append(match_path)

            family_key = (family or '').strip().lower()
            key_normalized = (key_value or '').strip().lower()
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

            for name in FONT_FILE_MAP.get(key_normalized, []):
                add_candidate(name)
            for name in FONT_FILE_MAP.get(family_key, []):
                add_candidate(name)

            if has_georgian:
                add_candidate('Sylfaen.ttf')
                add_candidate('sylfaen.ttf')
                add_candidate('segoeui.ttf')

            add_candidate('segoeui.ttf')
            add_candidate('segoeuib.ttf')
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
                width = bbox[2] - bbox[0]
                height = bbox[3] - bbox[1]
                return width, height, bbox[1], bbox[3]
            total_w = 0
            min_y = 0
            max_y = 0
            first = True
            for ch in value:
                bbox = draw_obj.textbbox((0, 0), ch, font=font_obj)
                ch_w = bbox[2] - bbox[0]
                total_w += ch_w
                if first:
                    min_y = bbox[1]
                    max_y = bbox[3]
                    first = False
                else:
                    min_y = min(min_y, bbox[1])
                    max_y = max(max_y, bbox[3])
            total_w += spacing * max(0, len(value) - 1)
            height = max_y - min_y if not first else 0
            return total_w, height, min_y, max_y

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

        font = load_font(font_family, fontsize, text, font_key)
        temp_img = Image.new('RGBA', (10, 10), (0, 0, 0, 0))
        temp_draw = ImageDraw.Draw(temp_img)
        text_w, text_h, min_y, _ = measure_text(temp_draw, text, font, letter_spacing)

        padding_y = max(4, int(fontsize * 0.12))
        img_height = int(text_h + (stroke_width * 2) + (padding_y * 2))
        img = Image.new('RGBA', (width, img_height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        padding = int(width * 0.05)
        x = padding
        if align == 'center':
            x = (width - text_w) // 2
        elif align == 'right':
            x = width - text_w - padding

        y = padding_y + stroke_width - min_y
        draw_text_with_spacing(draw, text, x, y, font, color, stroke_width, 'black', letter_spacing)

        x_pos = 'center' if position_x is None else position_x
        return ImageClip(np.array(img)).set_position((x_pos, position_y))
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
    
    position_x = textOverlay.get('positionX', 50)
    position_y = textOverlay.get('positionY', 50)
    try:
        position_x = float(position_x)
    except Exception:
        position_x = 50
    try:
        position_y = float(position_y)
    except Exception:
        position_y = 50
    position_x = max(0.0, min(100.0, position_x))
    position_y = max(0.0, min(100.0, position_y))

    if position == 'custom':
        vertical = 'custom'
        horizontal = 'center'
    else:
        position_parts = position.split('-')
        vertical = position_parts[0] if len(position_parts) > 0 else 'bottom'
        if position == 'center':
            horizontal = 'center'
        else:
            horizontal = position_parts[1] if len(position_parts) > 1 else 'left'
    text_align = horizontal if horizontal in ['left', 'center', 'right'] else 'left'

    font_family = textOverlay.get('fontFamily')
    font_key = textOverlay.get('fontKey')
    font_sizes = textOverlay.get('fontSizes', {})
    font_weights = textOverlay.get('fontWeights', {})
    letter_spacing = textOverlay.get('letterSpacing', {})
    line_height = float(textOverlay.get('lineHeight', 1.1))
    line_gap = int(textOverlay.get('lineGap', 12))
    font_size_value = textOverlay.get('fontSize')
    font_size_unit = textOverlay.get('fontSizeUnit', 'percent')
    base_title_size = None
    try:
        base_title_size = int(font_sizes.get('title', 60))
    except Exception:
        base_title_size = 60

    text_scale = None
    if isinstance(font_size_value, (int, float)):
        if font_size_unit == 'px' and base_title_size > 0:
            safe_px = max(8.0, float(font_size_value))
            text_scale = safe_px / float(base_title_size)
        else:
            safe_percent = max(10.0, min(300.0, float(font_size_value)))
            text_scale = safe_percent / 100.0
    if text_scale is None:
        try:
            raw_text_scale = float(textOverlay.get('textScale', 2))
        except Exception:
            raw_text_scale = 2
        raw_text_scale = max(1.0, min(6.0, raw_text_scale))
        text_scale_preset = int(round(raw_text_scale))
        text_scale_map = {1: 0.8, 2: 1.0, 3: 1.2, 4: 1.35, 5: 1.5, 6: 1.7}
        text_scale = text_scale_map.get(text_scale_preset, 1.0)

    def load_font_for_measure(size, text_value):
        candidates = []
        font_dir = None
        project_font_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'fonts')
        project_font_index = None
        if project_font_dir and os.path.isdir(project_font_dir):
            project_font_index = {}
            for root, _, files in os.walk(project_font_dir):
                for file_name in files:
                    key_name = file_name.lower()
                    if key_name not in project_font_index:
                        project_font_index[key_name] = os.path.join(root, file_name)
        if os.name == 'nt':
            windir = os.environ.get('WINDIR', 'C:\\Windows')
            font_dir = os.path.join(windir, 'Fonts')

        def add_candidate(name):
            if not name:
                return
            candidates.append(name)
            if font_dir:
                candidates.append(os.path.join(font_dir, name))
            if project_font_dir:
                candidates.append(os.path.join(project_font_dir, name))
                if project_font_index:
                    match_path = project_font_index.get(name.lower())
                    if match_path:
                        candidates.append(match_path)

        family_key = (font_family or '').strip().lower()
        key_normalized = (font_key or '').strip().lower()
        has_georgian = any('\u10A0' <= ch <= '\u10FF' for ch in text_value)

        if has_georgian:
            for candidate in [
                'NotoSansGeorgian-Regular.ttf',
                'NotoSansGeorgian.ttf',
                'NotoSansGeorgian-Bold.ttf',
                'BPG_Glaho.ttf',
                'bpg-glaho-webfont.ttf',
                'Sylfaen.ttf',
                'sylfaen.ttf',
                'segoeui.ttf',
                'segoeuib.ttf'
            ]:
                add_candidate(candidate)

        if family_key:
            add_candidate(font_family)
            add_candidate(f"{font_family}.ttf")
            add_candidate(f"{font_family}.otf")

        for name in FONT_FILE_MAP.get(key_normalized, []):
            add_candidate(name)
        for name in FONT_FILE_MAP.get(family_key, []):
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
        return ImageFont.load_default()

    measure_image = Image.new('RGBA', (max(10, width), max(10, height)), (0, 0, 0, 0))
    measure_draw = ImageDraw.Draw(measure_image)

    def measure_text_width(value, size, spacing):
        font = load_font_for_measure(size, value)
        if spacing <= 0:
            bbox = measure_draw.textbbox((0, 0), value, font=font)
            return bbox[2] - bbox[0]
        total_w = 0
        for ch in value:
            bbox = measure_draw.textbbox((0, 0), ch, font=font)
            total_w += bbox[2] - bbox[0]
        total_w += spacing * max(0, len(value) - 1)
        return total_w

    def wrap_text(value, size, spacing, max_width):
        words = value.split()
        if not words:
            return []
        lines = []
        for i in range(0, len(words), 2):
            lines.append(" ".join(words[i:i + 2]))
        normalized = []
        for line in lines:
            if measure_text_width(line, size, spacing) <= max_width:
                normalized.append(line)
            else:
                normalized.extend(wrap_by_chars(line, size, spacing, max_width))
        return normalized

    def wrap_by_chars(value, size, spacing, max_width):
        lines = []
        current = ''
        for ch in value:
            test = f"{current}{ch}"
            if not current or measure_text_width(test, size, spacing) <= max_width:
                current = test
            else:
                lines.append(current)
                current = ch
        if current:
            lines.append(current)
        return lines

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

    base_scale = min(width / 1080.0, height / 1920.0)
    effective_scale = text_scale * base_scale

    title_size = int(round(get_size('title', 60) * effective_scale))
    price_size = int(round(get_size('price', 80) * effective_scale))
    phone_size = int(round(get_size('phone', 40) * effective_scale))

    title_weight = get_weight('title', 600)
    price_weight = get_weight('price', 700)
    phone_weight = get_weight('phone', 500)

    title_spacing = get_spacing('title', 0) * effective_scale
    price_spacing = get_spacing('price', 0) * effective_scale
    phone_spacing = get_spacing('phone', 0) * effective_scale
    line_gap = int(line_gap * effective_scale)

    lines = []
    if text_value:
        max_width = int(width * 0.8)
        wrapped = wrap_text(text_value, title_size, title_spacing, max_width)
        for line in wrapped:
            lines.append(('text', line, title_size, title_weight, title_spacing, 2))
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

    def compute_total_height(lines_list, gap_value):
        total = 0
        for i, (_, _, size, _, _, _) in enumerate(lines_list):
            line_height_px = int(max(size * line_height, size))
            total += line_height_px
            if i < len(lines_list) - 1:
                total += gap_value
        return total

    total_height = compute_total_height(lines, line_gap)
    max_height = int(height * 0.35)
    if total_height > max_height:
        scale_factor = max_height / total_height
        scaled = []
        for kind, value, size, weight, spacing, stroke in lines:
            scaled.append((kind, value, max(12, int(round(size * scale_factor))), weight, spacing * scale_factor, stroke))
        lines = scaled
        line_gap = max(0, int(round(line_gap * scale_factor)))
        total_height = compute_total_height(lines, line_gap)

    if vertical == 'top':
        y_pos = int(height * 0.1)
    elif vertical == 'center':
        y_pos = int((height - total_height) / 2)
    elif vertical == 'custom':
        y_pos = int((height * (position_y / 100.0)) - (total_height / 2))
    else:
        y_pos = int(height * 0.9 - total_height)
    max_y = max(0, height - total_height)
    y_pos = max(0, min(y_pos, max_y))
    position_x_override = None
    if vertical == 'custom':
        position_x_override = int((width * (position_x / 100.0)) - (width / 2))
    
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
            position_x=position_x_override,
            font_family=font_family,
            font_key=font_key,
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
            font_family=font_family,
            font_key=font_key
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

def is_aspect_match(image_path, target_w, target_h, tolerance=0.03):
    try:
        with Image.open(image_path) as img:
            img_ratio = img.width / img.height
        target_ratio = target_w / target_h
        return abs(img_ratio - target_ratio) <= tolerance
    except Exception:
        return True

def make_panorama_clip(image_path, duration, target_w, target_h):
    with Image.open(image_path) as img:
        img_w, img_h = img.size
    scale = max(target_w / img_w, target_h / img_h)
    scaled_w = int(img_w * scale)
    scaled_h = int(img_h * scale)
    base = ImageClip(image_path).resize((scaled_w, scaled_h)).set_duration(duration)
    pan_x = max(0, scaled_w - target_w)
    pan_y = max(0, scaled_h - target_h)
    denom = duration if duration > 0 else 0.01
    if pan_x > 0:
        start_x, end_x = 0, -pan_x
        y = (target_h - scaled_h) // 2
        move = lambda t: (start_x + (end_x - start_x) * (t / denom), y)
        return CompositeVideoClip([base.set_position(move)], size=(target_w, target_h)).set_duration(duration)
    if pan_y > 0:
        start_y, end_y = 0, -pan_y
        x = (target_w - scaled_w) // 2
        move = lambda t: (x, start_y + (end_y - start_y) * (t / denom))
        return CompositeVideoClip([base.set_position(move)], size=(target_w, target_h)).set_duration(duration)
    return base

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
        trans_duration = max(0.1, duration / 2)

    print(f"Rendering {fmt_key} ({w}x{h})...")
    
    # 1. Preprocess images for this format
    platform_suffix = (platform_name or fmt_key).replace(" ", "").replace("+", "_").lower()
    fmt_temp_dir = os.path.join(temp_base, f"{fmt_key}_{platform_suffix}")
    os.makedirs(fmt_temp_dir, exist_ok=True)
    
    proc_images = preprocess_images(images, fmt_temp_dir, w, h)
    
    # 2. Create Clips logic
    main_clips = []
    is_cut = transition_type == "cut"
    clip_duration = duration if is_cut else duration + (2 * trans_duration)
    
    for index, (img_path, original_path) in enumerate(zip(proc_images, images)):
        if not is_aspect_match(original_path, w, h):
            clip = make_panorama_clip(original_path, clip_duration, w, h)
        else:
            clip = ImageClip(img_path).set_duration(clip_duration)
        main_clips.append(clip)
    
    # 3. Concatenate
    if transition_type == "cut":
        final_clip = concatenate_videoclips(main_clips, method="compose")
    else:
        # Custom transitions logic
        final_clips_sequence = []
        for i in range(len(main_clips)):
            current_clip = main_clips[i]
            
            if i == 0:
                body = current_clip.subclip(0, duration)
                final_clips_sequence.append(body)
            else:
                prev_clip_ref = main_clips[i-1]
                c1 = prev_clip_ref.subclip(duration, duration + trans_duration)
                c2 = current_clip.subclip(0, trans_duration)
                
                # Generate Transition
                trans = None
                if transition_type == "fade":
                    trans = concatenate_videoclips([c1, c2], method="compose", padding=-trans_duration)
                elif transition_type == "slide_left":
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
                    trans = concatenate_videoclips([c1, c2], method="compose", padding=-trans_duration)
                elif transition_type == "directional_blur_wipe":
                    trans = wipe_transition(c1, c2, trans_duration, 'right')
                
                else:
                    # Default cut
                    trans = concatenate_videoclips([c1, c2])

                final_clips_sequence.append(trans)
                
                start = trans_duration
                end = trans_duration + duration
                
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
            preset="medium",
            ffmpeg_params=["-crf", "18"],
            threads=max(1, os.cpu_count() or 1),
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
    
    try:
        tasks = []
        for platform_id, enabled in platforms.items():
            if not enabled:
                continue
            fmt_key = selected_formats.get(platform_id) or DEFAULT_FORMATS.get(platform_id)
            allowed = ALLOWED_FORMATS.get(platform_id)
            if allowed and fmt_key not in allowed:
                fmt_key = DEFAULT_FORMATS.get(platform_id)
            if not fmt_key:
                continue
            dimensions = FORMATS.get(fmt_key)
            if not dimensions:
                continue
            platform_label = platform_id.upper()
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
