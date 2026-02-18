# 🌌 Lumina Vids

**Professional Local Video Slideshow Generator for Social Media**

Create stunning video slideshows for your real estate listings, products, or any image collection. 100% local processing - your images never leave your computer.

![Version](https://img.shields.io/badge/version-1.0.0-orange)
![Platform](https://img.shields.io/badge/platform-Windows-green)

## ✨ Features

### 🎬 Video Formats (Social Media Ready)
- **9:16 (1080x1920)** - Stories, Reels, TikTok, YouTube Shorts
- **1:1 (1080x1080)** - Instagram Feed, Facebook Posts
- **4:5 (1080x1350)** - Instagram Portrait
- **16:9 (1920x1080)** - YouTube, LinkedIn

### 🎨 15+ Transition Effects
- Fade, Slide (Left/Right/Up/Down)
- Zoom (In/Out), Wipe, Pixelate
- Ripple, Page Curl, Circle Open/Close
- Spin, Fly In/Out

### 📝 Text Overlay
- Custom title, price, phone number
- Position control (bottom-left/center/right)
- Color selection (white/black/orange)
- Optional LUMINAVIDS watermark

### 🎵 Music Support
- Background music upload (MP3, WAV)
- Volume control
- Auto-loop if music is shorter than video

### 🌍 Multi-Language
- 🇬🇧 English
- 🇬🇪 Georgian (ქართული)
- 🇷🇺 Russian (Русский)

## 🚀 Installation

### Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.9 or higher)
- **Windows** 10/11

### Step 1: Install Node Dependencies
```bash
cd "Lumina Vids/lumina-vids"
npm install
```

### Step 2: Install Python Dependencies
```bash
cd api/generator
pip install Pillow moviepy numpy proglog
```

### Step 3: Start Development Server
```bash
npm run dev
```

### Step 4: Open in Browser
Navigate to: `http://localhost:5173/`

## 📖 Usage Guide

### Creating Your First Video

1. **Upload Images**
   - Click "Drag & drop images here" or browse
   - Select multiple images (JPG, PNG)
   - Drag to reorder images

2. **Configure Settings**
   - Choose transition effect
   - Set duration per image (1-5 seconds)
   - Select FPS (24, 30, 60)

3. **Add Text Overlay** (Optional)
   - Enable "Text Overlay"
   - Enter title (e.g., "3-Room Apartment")
   - Add price (e.g., "150,000₾")
   - Add phone number
   - Choose position and color

4. **Add Music** (Optional)
   - Enable "Background Music"
   - Select from samples or upload your own
   - Adjust volume

5. **Generate**
   - Click "Generate 4 Videos"
   - Wait for processing
   - Download individual videos or ZIP file

### Output Location
Generated videos are saved to:
```
Lumina Vids/lumina-vids/outputs/{job_id}/
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI Framework
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

### Backend
- **Node.js** + **Express** - API Server
- **Python** + **MoviePy** - Video Processing
- **Pillow** - Image Processing
- **FFmpeg** - Video Encoding

## 📁 Project Structure

```
lumina-vids/
├── api/                    # Backend
│   ├── generator/          # Python video engine
│   │   ├── generator.py    # Main processor
│   │   ├── preprocess.py   # Image preprocessing
│   │   └── transitions.py  # Effect library
│   └── app.ts              # Express server
├── src/
│   ├── components/         # React components
│   ├── pages/              # Generate, Outputs, Home
│   └── i18n/               # Translations
├── outputs/                # Generated videos
└── uploads/                # Temporary uploads
```

## 🔒 Privacy

**100% Local Processing**
- All images processed on your machine
- No cloud upload required
- No internet connection needed after installation
- Perfect for sensitive real estate photos

## 🐛 Troubleshooting

### Python not found
```bash
# Install Python 3.9+ and add to PATH
# Verify:
python --version
```

### Module not found errors
```bash
cd api/generator
pip install Pillow moviepy numpy proglog
```

### Port already in use
```bash
# Kill existing Node processes
taskkill /f /im node.exe
```

## 👥 Credits

Created by **Bejo** (ბეჟო) with assistance from **Galactus** AI 🌌

---

**Made with ❤️ in Georgia**
