import os
from PIL import Image, ImageFilter

def preprocess_image(image_path, output_dir, target_width, target_height):
    """
    Preprocess a single image:
    - No cropping allowed (contain mode).
    - Background: same image, cover mode, blurred + slightly darkened.
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

        # 1. Background - Black
        bg = Image.new("RGB", (target_width, target_height), (0, 0, 0))

        # 2. Create Foreground (Contain)
        # Calculate max dimensions
        scale = min(target_width / img_w, target_height / img_h)
        
        # "Upscale maximum 2x only"
        if scale > 2.0:
            scale = 2.0
            
        fg_w = int(img_w * scale)
        fg_h = int(img_h * scale)
        
        fg = img.resize((fg_w, fg_h), Image.Resampling.LANCZOS)

        # 3. Composite
        # Paste fg onto bg (centered)
        paste_x = (target_width - fg_w) // 2
        paste_y = (target_height - fg_h) // 2
        
        bg.paste(fg, (paste_x, paste_y))
        
        bg.save(output_path, quality=95)
        return output_path

    except Exception as e:
        print(f"Error processing {image_path}: {str(e)}")
        raise

def preprocess_images(image_paths, temp_dir, width, height):
    processed_paths = []
    for p in image_paths:
        processed_paths.append(preprocess_image(p, temp_dir, width, height))
    return processed_paths
