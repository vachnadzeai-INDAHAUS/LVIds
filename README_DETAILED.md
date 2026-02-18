# 🌌 Lumina Vids

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-FF8C42?style=for-the-badge&logoColor=white" alt="Version">
  <img src="https://img.shields.io/badge/platform-Windows-FF8C42?style=for-the-badge&logo=windows&logoColor=white" alt="Platform">
  <img src="https://img.shields.io/badge/PRs-welcome-6B7280?style=for-the-badge" alt="PRs Welcome">
</p>

<p align="center">
  <b>Professional Local Video Slideshow Generator for Social Media</b>
</p>

<p align="center">
  Create stunning video slideshows for your real estate listings, products, or any image collection.<br>
  <b>100% local processing</b> - your images never leave your computer.
</p>

---

## 📸 Screenshots

<p align="center">
  <i>Coming soon - Add your screenshots here</i>
</p>

---

## ✨ Features

### 🎬 Social Media Ready Video Formats

| Format | Resolution | Best For | Status |
|--------|-----------|----------|--------|
| **9:16** | 1080x1920 | Stories, Reels, TikTok, YouTube Shorts | ✅ Ready |
| **1:1** | 1080x1080 | Instagram Feed, Facebook Posts | ✅ Ready |
| **4:5** | 1080x1350 | Instagram Portrait | ✅ Ready |
| **16:9** | 1920x1080 | YouTube, LinkedIn | ✅ Ready |

### 🎨 15+ Professional Transition Effects

- ✨ **Fade** - Smooth crossfade between images
- ⬅️ **Slide** - Left, Right, Up, Down directions
- 🔍 **Zoom** - In and Out effects
- 🧹 **Wipe** - Directional wipes
- 👾 **Pixelate** - Creative pixel transition
- 💧 **Ripple** - Water ripple effect
- 📄 **Page Curl** - 3D page turn
- ⭕ **Circle** - Open and Close animations
- 🔄 **Spin** - In and Out rotations
- ✈️ **Fly** - In and Out movements

### 📝 Advanced Text Overlay

- 🏷️ **Custom Title** - Property name or description
- 💰 **Price Display** - Automatic formatting
- 📞 **Contact Info** - Phone number display
- 🎨 **Color Options** - White, Black, Orange
- 📍 **Position Control** - Bottom-left, Center, Bottom-right
- 🖼️ **Optional Watermark** - LUMINAVIDS branding

### 🎵 Audio Features

- 🎶 **Background Music** - Upload MP3, WAV files
- 🎚️ **Volume Control** - 0-100% adjustment
- 🔄 **Auto-Loop** - Music loops if shorter than video
- 📀 **Sample Library** - Built-in music samples

### 🌍 Multi-Language Support

- 🇬🇧 **English** - Full support
- 🇬🇪 **Georgian (ქართული)** - Full support
- 🇷🇺 **Russian (Русский)** - Full support

---

## 🚀 Quick Start

### Prerequisites

Before installing, ensure you have:

- **Windows 10/11** (64-bit)
- **Node.js** v18.0.0 or higher
- **Python** v3.9.0 or higher
- **Git** (optional, for cloning)

### Installation

#### Step 1: Clone the Repository

```bash
git clone https://github.com/viphouse2244-rgb/lumina-vids-.git
cd lumina-vids-
```

Or download the ZIP file and extract it.

#### Step 2: Install Node.js Dependencies

```bash
npm install
```

This will install all required Node.js packages including:
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Express.js
- And more...

#### Step 3: Install Python Dependencies

```bash
cd api/generator
pip install Pillow moviepy numpy proglog
```

Required Python packages:
- **Pillow** - Image processing
- **MoviePy** - Video generation
- **NumPy** - Mathematical operations
- **Proglog** - Progress bars

#### Step 4: Start the Application

From the project root directory:

```bash
npm run dev
```

#### Step 5: Open in Browser

Navigate to:
```
http://localhost:5173/
```

---

## 📖 User Guide

### Creating Your First Video

#### 1. Upload Images

1. Click on the **"Drag & drop images here"** area
2. Select multiple images (JPG, PNG supported)
3. Or drag and drop images directly
4. **Reorder** images by dragging them
5. **Remove** images by clicking the X button

#### 2. Configure Settings

| Setting | Options | Description |
|---------|---------|-------------|
| **Transition** | 15+ effects | Choose transition between images |
| **Duration** | 1-5 seconds | How long each image shows |
| **FPS** | 24, 30, 60 | Video quality (30 recommended) |
| **Property ID** | Text | Unique identifier for the project |

#### 3. Add Text Overlay (Optional)

1. Toggle **"Text Overlay"** to ON
2. Fill in the fields:
   - **Title**: e.g., "3-Room Apartment in City Center"
   - **Price**: e.g., "150,000₾" or "$200,000"
   - **Phone**: e.g., "+995 599 12 34 56"
3. Select **Position**:
   - Bottom-left (default)
   - Bottom-center
   - Bottom-right
4. Choose **Color**:
   - White (best for dark images)
   - Black (best for light images)
   - Orange (brand color)
5. Toggle **"Show LUMINAVIDS Logo"** if desired

#### 4. Add Music (Optional)

1. Toggle **"Background Music"** to ON
2. Choose from:
   - **Sample Music**: 5 built-in tracks
   - **Upload Your Own**: MP3 or WAV files
3. Adjust **Volume** (0-100%)
4. Preview music before generating

#### 5. Generate Video

1. Click **"Generate 4 Videos"** button
2. Wait for processing (progress shown for each format)
3. Download individual videos or complete ZIP file

### Output Files

Generated videos are saved to:
```
lumina-vids-/outputs/{job_id}/
```

Each job creates:
- `{property_id}_9x16.mp4` - Stories/Reels
- `{property_id}_1x1.mp4` - Instagram Feed
- `{property_id}_4x5.mp4` - Instagram Portrait
- `{property_id}_16x9.mp4` - YouTube
- `{property_id}_output.zip` - All formats

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose | Version |
|------------|---------|---------|
| **React** | UI Framework | 18.x |
| **TypeScript** | Type Safety | 5.x |
| **Vite** | Build Tool | 5.x |
| **Tailwind CSS** | Styling | 3.x |
| **Lucide React** | Icons | Latest |

### Backend
| Technology | Purpose | Version |
|------------|---------|---------|
| **Node.js** | Runtime | 18+ |
| **Express.js** | API Server | 4.x |
| **Python** | Video Processing | 3.9+ |
| **MoviePy** | Video Generation | 1.0.x |
| **Pillow** | Image Processing | 10.x |
| **FFmpeg** | Video Encoding | 5.x+ |

---

## 📁 Project Structure

```
lumina-vids-
├── 📁 api/                      # Backend API
│   ├── 📁 generator/            # Python video engine
│   │   ├── generator.py         # Main video processor
│   │   ├── preprocess.py        # Image preprocessing
│   │   └── transitions.py       # Transition effects library
│   ├── app.ts                   # Express server
│   └── server.ts                # Server entry
├── 📁 src/                      # Frontend React
│   ├── 📁 components/           # React components
│   │   └── ui/                  # UI components
│   ├── 📁 pages/                # Page components
│   │   ├── Home.tsx             # Home page
│   │   ├── Generate.tsx         # Main generator interface
│   │   └── Outputs.tsx          # Output management
│   ├── 📁 i18n/                 # Translations
│   │   └── translations.ts      # EN/GE/RU translations
│   ├── App.tsx                  # Main app component
│   └── main.tsx                 # Entry point
├── 📁 outputs/                  # Generated videos (auto-created)
├── 📁 uploads/                  # Temporary uploads (auto-created)
├── 📄 tailwind.config.js        # Tailwind configuration
├── 📄 package.json              # Dependencies
├── 📄 README.md                 # This file
└── 📄 .gitignore                # Git ignore rules
```

---

## 🔒 Privacy & Security

### 100% Local Processing

- ✅ **No cloud upload** - Everything stays on your machine
- ✅ **No internet required** - Works offline after installation
- ✅ **No data collection** - We don't track anything
- ✅ **Private by default** - Your images are never shared

Perfect for:
- Real estate agencies with sensitive property photos
- Businesses with confidential product images
- Anyone who values privacy

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Python not found"
**Solution:**
```bash
# Install Python 3.9+ from https://python.org
# Make sure to check "Add Python to PATH" during installation

# Verify installation:
python --version
```

#### 2. "ModuleNotFoundError: No module named 'PIL'"
**Solution:**
```bash
cd api/generator
pip install Pillow moviepy numpy proglog
```

#### 3. "Port already in use"
**Solution:**
```bash
# Kill existing Node processes
taskkill /f /im node.exe

# Or use different port
npm run dev -- --port 3000
```

#### 4. "FFmpeg not found"
**Solution:**
```bash
# Download FFmpeg from https://ffmpeg.org/download.html
# Add to system PATH
# Or install via chocolatey: choco install ffmpeg
```

#### 5. Video generation fails
**Solution:**
- Check that images are valid (not corrupted)
- Ensure sufficient disk space
- Verify Python dependencies are installed
- Check logs in terminal for specific errors

---

## 📝 API Documentation

### Endpoints

#### POST /api/generate
Create a new video generation job.

**Request:**
```bash
curl -X POST http://localhost:3001/api/generate \
  -F "images=@image1.jpg" \
  -F "images=@image2.jpg" \
  -F "propertyId=prop123" \
  -F "settings={\"fps\":30,\"secondsPerImage\":3.2,\"transition\":\"fade\"}"
```

**Response:**
```json
{
  "jobId": "uuid-here"
}
```

#### GET /api/jobs/:id
Check job status.

**Response:**
```json
{
  "jobId": "uuid-here",
  "status": "running|done|error",
  "progress": {
    "9x16": 75,
    "1x1": 60,
    "4x5": 45,
    "16x9": 30
  }
}
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

---

## 👥 Credits

- **Created by:** Bejo (ბეჟო)
- **Development:** Galactus AI Assistant 🌌
- **Inspiration:** Real estate professionals worldwide

---

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Open an [Issue](../../issues) on GitHub
3. Contact the development team

---

## 🗺️ Roadmap

### Version 1.1 (Coming Soon)
- [ ] Drag & drop timeline
- [ ] Live video preview
- [ ] More transition effects
- [ ] Batch processing

### Version 1.2 (Planned)
- [ ] AI-powered features
- [ ] Smart property detection
- [ ] Auto-music sync
- [ ] Cloud storage option

### Version 2.0 (Future)
- [ ] Web-based version
- [ ] Mobile app
- [ ] Collaboration features
- [ ] Advanced analytics

---

<p align="center">
  <b>Made with ❤️ in Georgia</b>
</p>

<p align="center">
  <a href="https://github.com/viphouse2244-rgb/lumina-vids-/stargazers">⭐ Star this repository</a> if you find it helpful!
</p>
