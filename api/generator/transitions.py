import numpy as np
from moviepy.editor import CompositeVideoClip, VideoClip, ImageClip
from PIL import Image

def slide_transition(clip1, clip2, duration=1.0, direction='left'):
    w, h = clip1.size
    c1 = clip1.set_duration(duration)
    c2 = clip2.set_duration(duration)

    if direction == 'left':
        pos1 = lambda t: (int(-w * (t / duration)), 0)
        pos2 = lambda t: (int(w * (1 - t / duration)), 0)
    elif direction == 'right':
        pos1 = lambda t: (int(w * (t / duration)), 0)
        pos2 = lambda t: (int(-w * (1 - t / duration)), 0)
    elif direction == 'up':
        pos1 = lambda t: (0, int(-h * (t / duration)))
        pos2 = lambda t: (0, int(h * (1 - t / duration)))
    elif direction == 'down':
        pos1 = lambda t: (0, int(h * (t / duration)))
        pos2 = lambda t: (0, int(-h * (1 - t / duration)))
    else:
        return clip1 

    c1 = c1.set_position(pos1)
    c2 = c2.set_position(pos2)
    return CompositeVideoClip([c1, c2], size=(w, h))

def zoom_transition(clip1, clip2, duration=1.0, mode='in'):
    w, h = clip1.size
    c1 = clip1.set_duration(duration)
    c2 = clip2.set_duration(duration)

    if mode == 'in':
        # Zoom IN to incoming (c2 scales 0->1)
        def make_scale(t):
            return 0.01 + 0.99 * (t / duration)
        c2 = c2.resize(make_scale).set_position('center')
        return CompositeVideoClip([c1, c2], size=(w, h))
    elif mode == 'out':
        # Zoom OUT outgoing (c1 scales 1->0)
        def make_scale(t):
            return 1.0 - 0.99 * (t / duration)
        c1 = c1.resize(make_scale).set_position('center')
        return CompositeVideoClip([c2, c1], size=(w, h))
    return clip1

def wipe_transition(clip1, clip2, duration=1.0, direction='left'):
    w, h = clip1.size
    c1 = clip1.set_duration(duration)
    c2 = clip2.set_duration(duration)
    
    def make_mask_frame(t):
        progress = t / duration
        mask = np.zeros((h, w), dtype=float)
        if direction == 'left': # Reveal from right
            start_x = int(w * (1 - progress))
            mask[:, start_x:] = 1.0
        elif direction == 'right':
            end_x = int(w * progress)
            mask[:, :end_x] = 1.0
        elif direction == 'up':
            start_y = int(h * (1 - progress))
            mask[start_y:, :] = 1.0
        elif direction == 'down':
            end_y = int(h * progress)
            mask[:end_y, :] = 1.0
        return mask

    mask_clip = VideoClip(make_mask_frame, duration=duration, ismask=True)
    c2_masked = c2.set_mask(mask_clip)
    return CompositeVideoClip([c1, c2_masked], size=(w, h))

def circle_transition(clip1, clip2, duration=1.0, mode='open'):
    w, h = clip1.size
    c1 = clip1.set_duration(duration)
    c2 = clip2.set_duration(duration)
    
    max_radius = np.sqrt((w/2)**2 + (h/2)**2)

    def make_mask_frame(t):
        progress = t / duration
        Y, X = np.ogrid[:h, :w]
        dist_sq = (X - w/2)**2 + (Y - h/2)**2
        
        if mode == 'open':
            # Reveal c2 from center
            r = max_radius * progress
            mask = (dist_sq <= r**2).astype(float)
        else: 
            # Close c2 from edges
            r = max_radius * (1 - progress)
            mask = (dist_sq >= r**2).astype(float)
            
        return mask

    mask_clip = VideoClip(make_mask_frame, duration=duration, ismask=True)
    c2_masked = c2.set_mask(mask_clip)
    return CompositeVideoClip([c1, c2_masked], size=(w, h))

def pixelate_transition(clip1, clip2, duration=1.0):
    w, h = clip1.size
    c1 = clip1.set_duration(duration)
    c2 = clip2.set_duration(duration)
    
    def filter(get_frame, t):
        if t < duration / 2:
            img = c1.get_frame(t)
            p = t / (duration/2)
            ratio = 1.0 - 0.95 * p 
        else:
            img = c2.get_frame(t)
            p = (t - duration/2) / (duration/2)
            ratio = 0.05 + 0.95 * p 
            
        new_w = int(max(1, w * ratio))
        new_h = int(max(1, h * ratio))
        
        pil_img = Image.fromarray(img)
        pil_small = pil_img.resize((new_w, new_h), resample=Image.NEAREST)
        pil_back = pil_small.resize((w, h), resample=Image.NEAREST)
        return np.array(pil_back)

    return VideoClip(lambda t: filter(None, t), duration=duration)

def spin_transition(clip1, clip2, duration=1.0, mode='in'):
    w, h = clip1.size
    c1 = clip1.set_duration(duration)
    c2 = clip2.set_duration(duration)
    
    if mode == 'in':
        c2_rotated = c2.rotate(lambda t: 360 * (1 - t/duration), expand=False)
        c2_scaled = c2_rotated.resize(lambda t: 0.01 + 0.99*(t/duration))
        c2_final = c2_scaled.set_position('center')
        return CompositeVideoClip([c1, c2_final], size=(w,h))
    elif mode == 'out':
        c1_rotated = c1.rotate(lambda t: 360 * (t/duration), expand=False)
        c1_scaled = c1_rotated.resize(lambda t: 1.0 - 0.99*(t/duration))
        c1_final = c1_scaled.set_position('center')
        return CompositeVideoClip([c2, c1_final], size=(w,h))

def fly_transition(clip1, clip2, duration=1.0, mode='in'):
    w, h = clip1.size
    c1 = clip1.set_duration(duration)
    c2 = clip2.set_duration(duration)
    
    if mode == 'in':
        c2_anim = c2.resize(lambda t: 0.01 + 0.99*(t/duration))
        def pos_func(t):
            p = t/duration
            s = 0.01 + 0.99*p
            curr_w, curr_h = w*s, h*s
            center_x = (w/2) * p
            center_y = (h/2) * p
            return (int(center_x - curr_w/2), int(center_y - curr_h/2))
        c2_final = c2_anim.set_position(pos_func)
        return CompositeVideoClip([c1, c2_final], size=(w,h))
    elif mode == 'out':
        c1_anim = c1.resize(lambda t: 1.0 - 0.99*(t/duration))
        def pos_func(t):
            p = t/duration
            s = 1.0 - 0.99*p
            curr_w, curr_h = w*s, h*s
            center_x = (w/2) + (w/2)*p
            center_y = (h/2) - (h/2)*p
            return (int(center_x - curr_w/2), int(center_y - curr_h/2))
        c1_final = c1_anim.set_position(pos_func)
        return CompositeVideoClip([c2, c1_final], size=(w,h))

def page_curl_transition(clip1, clip2, duration=1.0):
    w, h = clip1.size
    c1 = clip1.set_duration(duration)
    c2 = clip2.set_duration(duration)
    
    def make_mask(t):
        p = t / duration
        limit = (w + h) * (1 - p * 1.5) + (w+h)*0.25
        Y, X = np.ogrid[:h, :w]
        mask = (X + Y < limit).astype(float)
        return mask
        
    mask_clip = VideoClip(make_mask, duration=duration, ismask=True)
    c1_masked = c1.set_mask(mask_clip)
    return CompositeVideoClip([c2, c1_masked], size=(w,h))

def ripple_transition(clip1, clip2, duration=1.0):
    w, h = clip1.size
    c1 = clip1.set_duration(duration)
    c2 = clip2.set_duration(duration)
    
    def make_mask(t):
        p = t / duration
        Y, X = np.ogrid[:h, :w]
        limit = w * p
        wave = 20 * np.sin(Y / 20.0 + t * 10)
        mask = (X < (limit + wave)).astype(float)
        return mask
        
    mask_clip = VideoClip(make_mask, duration=duration, ismask=True)
    c2_masked = c2.set_mask(mask_clip)
    return CompositeVideoClip([c1, c2_masked], size=(w,h))
