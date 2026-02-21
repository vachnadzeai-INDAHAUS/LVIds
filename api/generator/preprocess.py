import os
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

def preprocess_image(image_path, output_dir, target_width, target_height):
    """
    Preprocess a single image:
    - No cropping allowed (contain mode).
    - Background: same image, cover mode.
    - Upscale maximum 2x only.
    - Save to output_dir.
    """
    try:
        filename = os.path.basename(image_path)
        output_path = os.path.join(output_dir, f"processed_{filename}")

        img = Image.open(image_path).convert("RGB")
        img_w, img_h = img.size
        target_ratio = target_width / target_height
        img_ratio = img_w / img_h

        # 1. Background - Cover (no blur)
        bg_scale = max(target_width / img_w, target_height / img_h)
        bg_w = int(img_w * bg_scale)
        bg_h = int(img_h * bg_scale)
        bg = img.resize((bg_w, bg_h), Image.Resampling.LANCZOS)
        left = max(0, (bg_w - target_width) // 2)
        top = max(0, (bg_h - target_height) // 2)
        bg = bg.crop((left, top, left + target_width, top + target_height))

        bg.save(output_path, quality=95)
        return output_path

    except Exception as e:
        print(f"Error processing {image_path}: {str(e)}")
        raise

def preprocess_images(image_paths, temp_dir, width, height):
    if not image_paths:
        return []
    max_workers = min(len(image_paths), max(1, os.cpu_count() or 1))
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [executor.submit(preprocess_image, p, temp_dir, width, height) for p in image_paths]
        return [future.result() for future in futures]
