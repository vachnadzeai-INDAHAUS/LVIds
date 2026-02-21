import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Upload, X, Play, Settings as SettingsIcon, 
  Music, Download, Volume2, VolumeX, 
  GripVertical, Type, Image as ImageIcon, Palette,
  Monitor, Smartphone, Video, Plus, Minus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/useLanguage';
import ModernSlider from '../components/ModernSlider';

interface JobSettings {
  fps: number;
  secondsPerImage: number;
  transition: string;
  propertyId: string;
}

interface TextOverlay {
  enabled: boolean;
  text: string;
  position: 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right' | 'custom';
  positionX: number;
  positionY: number;
  color: 'white' | 'black' | 'orange' | 'red' | 'green' | 'sky' | 'gray' | 'maroon';
  showLogo: boolean;
  fontSize: number;
  fontSizeUnit: 'px' | 'percent';
  scale?: number;
}

interface FileItem {
  file: File;
  preview: string;
  id: string;
}

const SOCIAL_PLATFORMS = [
  { id: 'tiktok', name: 'TikTok', icon: Smartphone, color: '#000000', formats: ['9x16'] },
  { id: 'instagram', name: 'Instagram', icon: ImageIcon, color: '#E1306C', formats: ['1x1', '4x5', '9x16'] },
  { id: 'facebook', name: 'Facebook', icon: Monitor, color: '#1877F2', formats: ['1x1', '16x9'] },
  { id: 'youtube', name: 'Shorts', icon: Video, color: '#FF0000', formats: ['9x16', '16x9'] },
];

const TRANSITIONS = [
  { value: 'slide_left', labelKey: 'transition_slide_left', icon: '⬅️', type: 'creative' },
  { value: 'slide_right', labelKey: 'transition_slide_right', icon: '➡️', type: 'creative' },
  { value: 'slide_up', labelKey: 'transition_slide_up', icon: '⬆️', type: 'creative' },
  { value: 'slide_down', labelKey: 'transition_slide_down', icon: '⬇️', type: 'creative' },
  { value: 'zoom_in', labelKey: 'transition_zoom_in', icon: '🔍', type: 'creative' },
  { value: 'zoom_out', labelKey: 'transition_zoom_out', icon: '🔎', type: 'creative' },
  { value: 'wipe_left', labelKey: 'transition_wipe_left', icon: '◀️', type: 'creative' },
  { value: 'wipe_right', labelKey: 'transition_wipe_right', icon: '▶️', type: 'creative' },
  { value: 'wipe_up', labelKey: 'transition_wipe_up', icon: '🔼', type: 'creative' },
  { value: 'wipe_down', labelKey: 'transition_wipe_down', icon: '🔽', type: 'creative' },
  { value: 'pixelate', labelKey: 'transition_pixelate', icon: '👾', type: 'creative' },
  { value: 'ripple', labelKey: 'transition_ripple', icon: '💧', type: 'creative' },
  { value: 'page_curl', labelKey: 'transition_page_curl', icon: '📄', type: 'creative' },
  { value: 'circle_open', labelKey: 'transition_circle_open', icon: '⭕', type: 'creative' },
  { value: 'circle_close', labelKey: 'transition_circle_close', icon: '⚫', type: 'creative' },
  { value: 'spin_in', labelKey: 'transition_spin_in', icon: '🔄', type: 'creative' },
  { value: 'spin_out', labelKey: 'transition_spin_out', icon: '🔃', type: 'creative' },
  { value: 'fly_in', labelKey: 'transition_fly_in', icon: '✈️', type: 'creative' },
  { value: 'fly_out', labelKey: 'transition_fly_out', icon: '🚀', type: 'creative' },
  { value: 'luma_wipe', labelKey: 'transition_luma_wipe', icon: '🌓', type: 'creative' },
  { value: 'glitch', labelKey: 'transition_glitch', icon: '📺', type: 'creative' },
  { value: 'cube3d', labelKey: 'transition_cube3d', icon: '🧊', type: 'creative' },
  { value: 'flip3d', labelKey: 'transition_flip3d', icon: '🃏', type: 'creative' },
];

const TRANSITION_EFFECT_MAP: Record<string, string> = {
  slide_left: 'slide',
  slide_right: 'slide',
  slide_up: 'slide',
  slide_down: 'slide',
  zoom_in: 'zoom',
  zoom_out: 'zoom',
  wipe_left: 'curtain',
  wipe_right: 'curtain',
  wipe_up: 'curtain',
  wipe_down: 'curtain',
  pixelate: 'motionBlur',
  ripple: 'liquid',
  page_curl: 'curtain',
  circle_open: 'splitScreen',
  circle_close: 'splitScreen',
  spin_in: 'carousel3d',
  spin_out: 'perspective',
  fly_in: 'parallax',
  fly_out: 'slideScale',
  luma_wipe: 'crossFade',
  glitch: 'glitch',
  cube3d: 'cube3d',
  flip3d: 'stacked3d'
};

type FontConfig = {
  id: string;
  label: string;
  group: 'ka' | 'en' | 'ru';
  css: string;
  backend: string;
  preview: {
    size: number;
    weight: number;
    letterSpacing: number;
    lineHeight: number;
    textTransform?: 'uppercase' | 'none';
  };
};

const FONTS_CONFIG: FontConfig[] = [
  { id: 'ka_notosansgeorgian_regular', label: 'Noto Sans Georgian', group: 'ka', css: '"Noto Sans Georgian", sans-serif', backend: 'Noto Sans Georgian', preview: { size: 54, weight: 600, letterSpacing: 0.35, lineHeight: 1.12 } },
  { id: 'ka_bpg_glaho', label: 'BPG Glaho', group: 'ka', css: '"BPG Glaho", sans-serif', backend: 'BPG Glaho', preview: { size: 54, weight: 600, letterSpacing: 0.35, lineHeight: 1.12 } },
  { id: 'ka_sylfaen', label: 'Sylfaen', group: 'ka', css: '"Sylfaen", serif', backend: 'Sylfaen', preview: { size: 54, weight: 600, letterSpacing: 0.35, lineHeight: 1.12 } },
  { id: 'en_inter_regular', label: 'Inter', group: 'en', css: '"Inter", sans-serif', backend: 'Inter', preview: { size: 52, weight: 600, letterSpacing: 0.25, lineHeight: 1.12 } },
  { id: 'en_roboto_bold', label: 'Roboto Bold', group: 'en', css: '"Roboto", sans-serif', backend: 'Roboto', preview: { size: 52, weight: 700, letterSpacing: 0.2, lineHeight: 1.12 } },
  { id: 'en_playfairdisplay_regular', label: 'Playfair Display', group: 'en', css: '"Playfair Display", serif', backend: 'Playfair Display', preview: { size: 52, weight: 600, letterSpacing: 0.2, lineHeight: 1.1 } },
  { id: 'ru_notosans_regular', label: 'Noto Sans', group: 'ru', css: '"Noto Sans", sans-serif', backend: 'Noto Sans', preview: { size: 52, weight: 600, letterSpacing: 0.25, lineHeight: 1.12 } },
  { id: 'ru_roboto_regular', label: 'Roboto', group: 'ru', css: '"Roboto", sans-serif', backend: 'Roboto', preview: { size: 52, weight: 600, letterSpacing: 0.2, lineHeight: 1.12 } },
  { id: 'ru_montserrat_regular', label: 'Montserrat', group: 'ru', css: '"Montserrat", sans-serif', backend: 'Montserrat', preview: { size: 52, weight: 600, letterSpacing: 0.2, lineHeight: 1.12 } }
];

const FONT_GROUPS = [
  { id: 'ka', label: 'ქართული' },
  { id: 'en', label: 'English' },
  { id: 'ru', label: 'Русский' }
];

const TEXT_STYLE = {
  title: { size: 72, weight: 600, letterSpacing: 0.4, lineHeight: 1.12 },
  price: { size: 96, weight: 700, letterSpacing: 0.5, lineHeight: 1.06 },
  phone: { size: 48, weight: 500, letterSpacing: 0.35, lineHeight: 1.12 },
  lineGap: 16
};

const SAMPLE_MUSIC = Array.from({ length: 30 }, (_, i) => ({
  id: `track_${i + 1}`,
  duration: '0:30',
  genreKey: ['pop', 'rock', 'ambient', 'jazz', 'electronic'][i % 5]
}));

const Generate: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const MAX_IMAGES = 100;
  const [files, setFiles] = useState<FileItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [settings, setSettings] = useState<JobSettings>({
    fps: 30,
    secondsPerImage: 3.2,
    transition: 'slide_left',
    propertyId: ''
  });
  
  // Text Overlay State
  const [textOverlay, setTextOverlay] = useState<TextOverlay>({
    enabled: true, // Default enabled for new layout
    text: '',
    position: 'bottom-left',
    positionX: 50,
    positionY: 50,
    color: 'white',
    showLogo: false,
    fontSize: 100,
    fontSizeUnit: 'percent'
  });

  // New state for extended settings
  const [selectedFontId, setSelectedFontId] = useState(FONTS_CONFIG[0].id);
  
  const [previewWidth, setPreviewWidth] = useState(0);
  const [autoTranslateEnabled, setAutoTranslateEnabled] = useState(true);
  const [translatedOverlayText, setTranslatedOverlayText] = useState('');
  const previewRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const TEXT_COLORS: { name: TextOverlay['color']; value: string }[] = [
    { name: 'white', value: '#FFFFFF' },
    { name: 'black', value: '#000000' },
    { name: 'orange', value: '#F97316' },
    { name: 'red', value: '#EF4444' },
    { name: 'green', value: '#22C55E' },
    { name: 'sky', value: '#0EA5E9' },
    { name: 'gray', value: '#6B7280' },
    { name: 'maroon', value: '#800000' }
  ];

  // Outro Videos
  const OUTRO_VIDEOS = Array.from({ length: 6 }, (_, i) => ({
    id: `outro_${i + 1}`,
    name: `Video ${i + 1}`,
    preview: null // Placeholder
  }));
  
  const [selectedOutro, setSelectedOutro] = useState<string | null>(null);
  
  const [transitionDuration, setTransitionDuration] = useState(0.8);
  const [isMusicEnabled, setIsMusicEnabled] = useState(false);
  const [musicVolume, setMusicVolume] = useState(50);
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [selectedSampleMusic, setSelectedSampleMusic] = useState<string | null>(null);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('idle');
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [resultFiles, setResultFiles] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Platform selection state - which platforms are enabled and their formats
  const [enabledPlatforms, setEnabledPlatforms] = useState<Record<string, boolean>>({
    tiktok: false,
    instagram: false,
    facebook: false,
    youtube: false
  });
  const [selectedFormats, setSelectedFormats] = useState<Record<string, string>>({
    tiktok: '9x16',
    instagram: '4x5',
    facebook: '1x1',
    youtube: '16x9'
  });

  const selectedFont = FONTS_CONFIG.find(font => font.id === selectedFontId) ?? FONTS_CONFIG[0];
  const targetLanguage = selectedFont.group;
  const containsGeorgian = (value: string) => /[\u10A0-\u10FF]/.test(value);
  const resolvedOverlayText = autoTranslateEnabled && targetLanguage !== 'ka' && translatedOverlayText.trim()
    ? translatedOverlayText
    : textOverlay.text;
  const previewText = resolvedOverlayText.trim();
  const hasPreviewText = previewText.length > 0;
  const baseTitleSize = TEXT_STYLE.title.size;
  const legacyScalePreset = Math.min(6, Math.max(1, Math.round(textOverlay.scale || 2)));
  const LEGACY_SCALE_MAP: Record<number, number> = { 1: 0.8, 2: 1.0, 3: 1.2, 4: 1.35, 5: 1.5, 6: 1.7 };
  const legacyScale = LEGACY_SCALE_MAP[legacyScalePreset] ?? 1;
  const fontSizeValue = Number.isFinite(textOverlay.fontSize) ? textOverlay.fontSize : undefined;
  const textScale = (() => {
    if (typeof fontSizeValue === 'number') {
      if (textOverlay.fontSizeUnit === 'px') {
        const safePx = Math.max(8, fontSizeValue);
        return safePx / baseTitleSize;
      }
      const safePercent = Math.min(300, Math.max(10, fontSizeValue));
      return safePercent / 100;
    }
    return legacyScale;
  })();
  const formatPreviewText = (value: string) => {
    const words = value.trim().split(/\s+/).filter(Boolean);
    if (words.length <= 2) return value;
    const lines = [];
    for (let i = 0; i < words.length; i += 2) {
      lines.push(words.slice(i, i + 2).join(' '));
    }
    return lines.join('\n');
  };
  const previewDisplayText = hasPreviewText ? formatPreviewText(previewText) : previewText;
  const previewSampleText = t('generate.font_sample_letter');
  const previewScale = previewWidth > 0 ? previewWidth / 1080 : 0.2;
  const getScaledSize = (size: number) => Math.max(8, Math.round(size * previewScale));
  const getScaledLetterSpacing = (value: number) => `${(value * previewScale).toFixed(2)}px`;
  const previewTypography = {
    fontFamily: selectedFont.css,
    fontSize: `${getScaledSize(selectedFont.preview.size * textScale)}px`,
    fontWeight: selectedFont.preview.weight,
    lineHeight: selectedFont.preview.lineHeight,
    letterSpacing: getScaledLetterSpacing(selectedFont.preview.letterSpacing * textScale),
    textTransform: selectedFont.preview.textTransform ?? 'none',
    whiteSpace: 'pre-line'
  };
  const transitionEffects = TRANSITIONS.map((transition) => ({
    id: transition.value,
    label: t(`generate.${transition.labelKey}`),
    effectId: TRANSITION_EFFECT_MAP[transition.value] ?? 'fade'
  }));

  const translateOverlayText = useCallback(async (value: string) => {
    if (!autoTranslateEnabled || !value.trim()) return value;
    if (targetLanguage === 'ka') return value;
    if (!containsGeorgian(value)) return value;
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: value, target: targetLanguage })
      });
      if (!res.ok) return value;
      const data = await res.json();
      if (typeof data?.text === 'string' && data.text.trim()) return data.text;
      return value;
    } catch {
      return value;
    }
  }, [autoTranslateEnabled, targetLanguage]);

  useEffect(() => {
    if (!previewRef.current) return;
    const element = previewRef.current;
    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) setPreviewWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let active = true;
    const value = textOverlay.text.trim();
    if (!autoTranslateEnabled || targetLanguage === 'ka' || !value) {
      setTranslatedOverlayText('');
      return;
    }
    const timer = setTimeout(async () => {
      const translated = await translateOverlayText(value);
      if (active) setTranslatedOverlayText(translated);
    }, 400);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [textOverlay.text, autoTranslateEnabled, targetLanguage, translateOverlayText]);

  const togglePlatform = (id: string) => {
    setEnabledPlatforms(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
    // Auto-configure when enabling
    if (!enabledPlatforms[id]) {
      switch(id) {
        case 'tiktok':
          setSettings({...settings, fps: 30, secondsPerImage: 2.5});
          break;
        case 'instagram':
          setSettings({...settings, fps: 30, secondsPerImage: 3});
          break;
        case 'facebook':
          setSettings({...settings, fps: 30, secondsPerImage: 3.5});
          break;
        case 'youtube':
          setSettings({...settings, fps: 60, secondsPerImage: 4});
          break;
      }
    }
  };

  const playMusicPreview = (sampleId: string) => {
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(`/api/samples/${sampleId}.mp3`);
    audio.volume = musicVolume / 100;
    audioRef.current = audio;
    audio.play().catch(() => console.log('Demo music'));
    setIsPlayingMusic(true);
    setSelectedSampleMusic(sampleId);
    setMusicFile(null);
    audio.onended = () => setIsPlayingMusic(false);
  };

  const stopMusicPreview = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlayingMusic(false);
  };

  const handleDragStart = (index: number) => setDraggedItem(index);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;
    const newFiles = [...files];
    const draggedFile = newFiles[draggedItem];
    newFiles.splice(draggedItem, 1);
    newFiles.splice(index, 0, draggedFile);
    setFiles(newFiles);
    setDraggedItem(index);
  };

  const handleDragEnd = () => setDraggedItem(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
  };

  const addFiles = (newFiles: File[]) => {
    setFiles(prev => {
      const images = newFiles.filter(f => f.type.startsWith('image/'));
      const remaining = MAX_IMAGES - prev.length;
      if (remaining <= 0) return prev;
      const toAdd = images.slice(0, remaining).map((file, index) => ({
        file,
        preview: URL.createObjectURL(file),
        id: `${file.name}-${index}-${Date.now()}`
      }));
      return [...prev, ...toAdd];
    });
  };

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (jobId && (status === 'queued' || status === 'running')) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/jobs/${jobId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.status !== status) setStatus(data.status);
            if (data.error) setErrorMessage(data.error);
            if (data.progress) setProgress(data.progress);
            if (data.status === 'done') {
              setResultFiles(data.files || []);
              setProgress({ '9x16': 100, '1x1': 100, '4x5': 100, '16x9': 100 });
              clearInterval(interval);
            }
            if (data.status === 'error' || data.status === 'canceled') {
              clearInterval(interval);
            }
          }
        } catch (e) {
          console.error(e);
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [jobId, status]);

  const startJob = async () => {
    console.log('🚀 startJob called');
    console.log('📁 files:', files.length);
    console.log('📱 platforms:', enabledPlatforms);
    
    if (files.length === 0) {
      setErrorMessage(t('generate.error_no_images'));
      console.log('❌ No files');
      return;
    }
    
    // Check if at least one platform is enabled
    const hasEnabledPlatform = Object.values(enabledPlatforms).some(enabled => enabled);
    console.log('✅ hasEnabledPlatform:', hasEnabledPlatform);
    
    if (!hasEnabledPlatform) {
      setErrorMessage(t('generate.error_no_platform'));
      console.log('❌ No platform selected');
      return;
    }
    
    setStatus('queued');
    setErrorMessage(null);
    setProgress({});
    setResultFiles([]);
    console.log('✅ Job started!');
    
    const formData = new FormData();
    files.forEach(f => formData.append('images', f.file));
    formData.append('propertyId', settings.propertyId || `job_${Date.now()}`);
    
    const overlayText = await translateOverlayText(textOverlay.text);

    // Add text overlay settings
    const overlayData = {
      ...textOverlay,
      fontFamily: selectedFont.backend,
      fontKey: selectedFont.id,
      text: overlayText,
      textScale: textScale,
      fontSize: textOverlay.fontSize,
      fontSizeUnit: textOverlay.fontSizeUnit,
      positionX: textOverlay.positionX,
      positionY: textOverlay.positionY,
      fontSizes: {
        title: TEXT_STYLE.title.size,
        price: TEXT_STYLE.price.size,
        phone: TEXT_STYLE.phone.size
      },
      fontWeights: {
        title: TEXT_STYLE.title.weight,
        price: TEXT_STYLE.price.weight,
        phone: TEXT_STYLE.phone.weight
      },
      letterSpacing: {
        title: TEXT_STYLE.title.letterSpacing,
        price: TEXT_STYLE.price.letterSpacing,
        phone: TEXT_STYLE.phone.letterSpacing
      },
      lineHeight: TEXT_STYLE.title.lineHeight,
      lineGap: TEXT_STYLE.lineGap,
      
    };
    formData.append('textOverlay', JSON.stringify(overlayData));
    
    if (isMusicEnabled && (musicFile || selectedSampleMusic)) {
      if (musicFile) formData.append('music', musicFile);
      if (selectedSampleMusic) formData.append('sampleMusic', selectedSampleMusic);
    }
    
    formData.append('settings', JSON.stringify({
      fps: settings.fps,
      secondsPerImage: settings.secondsPerImage,
      transition: settings.transition,
      musicVolume: isMusicEnabled ? musicVolume / 100 : 0,
      transitionDuration: transitionDuration,
      platforms: enabledPlatforms,
      formats: selectedFormats
    }));

    try {
      const res = await fetch('/api/generate', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        setJobId(data.jobId);
      } else {
        setStatus('error');
      }
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const cancelJob = async () => {
    if (!jobId) return;
    await fetch(`/api/jobs/${jobId}/cancel`, { method: 'POST' });
    setStatus('canceled');
  };

    // Position mapping helper
    const getPreviewStyle = (overlay: TextOverlay) => {
      const style: React.CSSProperties = { position: 'absolute', pointerEvents: 'none' };
      if (overlay.position === 'custom') {
        style.left = `${overlay.positionX}%`;
        style.top = `${overlay.positionY}%`;
        style.transform = 'translate(-50%, -50%)';
        style.textAlign = 'center';
        return style;
      }
      const [v, h] = overlay.position.split('-');
      const transforms: string[] = [];
      
      if (v === 'top') style.top = '10%';
      else if (v === 'center') { style.top = '50%'; transforms.push('translateY(-50%)'); }
      else style.bottom = '10%';
      
      if (h === 'left') { style.left = '5%'; style.textAlign = 'left'; }
      else if (h === 'right') { style.right = '5%'; style.textAlign = 'right'; }
      else { style.left = '50%'; style.textAlign = 'center'; transforms.push('translateX(-50%)'); }
      
      if (transforms.length) style.transform = transforms.join(' ');
      return style;
    };

    return (
      <div className="flex flex-col lg:flex-row gap-4 w-full px-0 items-start">
      
      {/* COLUMN 1: Text Overlay Settings (Left) - Wider Width */}
      <div className="w-full lg:w-[380px] shrink-0">
        <div className="bg-surface rounded-xl border border-surface-light p-5 h-fit">
           <div className="flex items-center justify-between mb-6">
             <h3 className="text-lg font-bold text-text-primary flex items-center">
               <Type className="mr-2" size={20} />
              {t('generate.text_section_title')}
             </h3>
             <button 
               className={`w-12 h-6 rounded-full relative transition-colors ${textOverlay.enabled ? 'bg-primary' : 'bg-surface-light'}`}
               onClick={() => setTextOverlay({...textOverlay, enabled: !textOverlay.enabled})}
             >
               <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${textOverlay.enabled ? 'left-7' : 'left-1'}`} />
             </button>
           </div>
           
           <div className={`space-y-6 transition-all duration-300 ${!textOverlay.enabled ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
             {/* Font Selection */}
            <div>
              <label className="text-sm font-semibold text-text-secondary mb-2 block">{t('generate.font_select_label')}</label>
              <div className="space-y-3">
                {FONT_GROUPS.map(group => (
                  <div key={group.id} className="space-y-2">
                    <div className="text-xs font-semibold text-text-muted">{group.label}</div>
                    {FONTS_CONFIG.filter(font => font.group === group.id).map(font => {
                      const isSelected = selectedFontId === font.id;
                      return (
                        <button
                          key={font.id}
                          onClick={() => setSelectedFontId(font.id)}
                          className={`w-full text-left border rounded-lg px-3 py-2 transition-all ${
                            isSelected ? 'border-primary bg-primary/10' : 'border-surface-light bg-surface-dark hover:border-primary/60'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-primary' : 'bg-surface-light'}`} />
                              <span className="text-sm font-semibold text-text-primary">{font.label}</span>
                            </div>
                            <span
                              className="text-xs text-text-secondary truncate"
                              style={{
                                fontFamily: font.css,
                                fontWeight: font.preview.weight,
                                letterSpacing: `${font.preview.letterSpacing}px`,
                                textTransform: font.preview.textTransform ?? 'none'
                              }}
                            >
                              {previewSampleText}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <div className="text-xs text-text-muted mb-2">{t('generate.font_live_preview')}</div>
                <div
                  ref={previewRef}
                  className="relative w-full overflow-hidden rounded-lg border border-surface-light bg-surface-dark max-w-[50%]"
                  style={{ aspectRatio: '9 / 16' }}
                >
                  {files[0]?.preview ? (
                    <img src={files[0].preview} alt={t('generate.preview_alt')} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-surface-light to-surface" />
                  )}
                  <div
                    className="absolute w-[90%] z-10"
                    style={{
                      ...getPreviewStyle(textOverlay),
                      color: TEXT_COLORS.find(c => c.name === textOverlay.color)?.value || 'white',
                      textShadow: textOverlay.color === 'white' ? '0 1px 3px rgba(0,0,0,0.6)' : 'none'
                    }}
                  >
                    {hasPreviewText && (
                      <div style={previewTypography}>
                        {previewDisplayText}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

             {/* Visuals (Collapsible Color Picker) */}
             <div>
               <details className="group border border-surface-light rounded-lg bg-surface-dark open:bg-surface-dark/50 transition-all" open>
                 <summary className="flex items-center justify-between p-3 cursor-pointer list-none select-none">
                   <div className="flex items-center">
                     <Palette size={16} className="mr-2 text-text-secondary" />
                     <span className="text-sm font-medium text-text-secondary">{t('generate.colors_position_label')}</span>
                   </div>
                   <div className="flex items-center">
                     <div 
                       className="w-4 h-4 rounded-md border border-surface-light mr-2"
                       style={{ backgroundColor: TEXT_COLORS.find(c => c.name === textOverlay.color)?.value || '#FFF' }}
                     />
                     <svg className="w-4 h-4 text-text-muted group-open:rotate-180 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                   </div>
                 </summary>
                 <div className="p-3 pt-0 border-t border-surface-light/50 mt-2">
                   {/* Colors */}
                   <div className="flex flex-wrap gap-2 mb-4 pt-2">
                     {TEXT_COLORS.map((c) => (
                       <button
                         key={c.name}
                        onClick={() => setTextOverlay({...textOverlay, color: c.name})}
                         className={`w-8 h-8 rounded-md border-2 transition-all ${
                           textOverlay.color === c.name ? 'border-primary scale-110 ring-2 ring-primary/20' : 'border-surface-light hover:border-primary/50'
                         }`}
                         style={{ backgroundColor: c.value }}
                         title={c.name}
                       />
                     ))}
                   </div>
                   
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-1 bg-surface p-1 rounded-lg">
                      {[
                        { id: 'top-left', label: '↖' },
                        { id: 'top-center', label: '↑' },
                        { id: 'top-right', label: '↗' },
                        { id: 'center-left', label: '←' },
                        { id: 'center', label: '•' },
                        { id: 'center-right', label: '→' },
                        { id: 'bottom-left', label: '↙' },
                        { id: 'bottom-center', label: '↓' },
                        { id: 'bottom-right', label: '↘' }
                      ].map((pos) => (
                        <button
                          key={pos.id}
                          className={`text-xs py-2 rounded-md transition-all ${
                            textOverlay.position === pos.id
                              ? 'bg-primary text-white shadow'
                              : 'text-text-secondary hover:bg-surface-light'
                          }`}
                          onClick={() => setTextOverlay({ ...textOverlay, position: pos.id as TextOverlay['position'] })}
                          title={pos.id}
                        >
                          {pos.label}
                        </button>
                      ))}
                    </div>
                    <button
                      className={`w-full text-xs py-2 rounded-md transition-all ${
                        textOverlay.position === 'custom'
                          ? 'bg-surface-light text-primary font-bold border border-primary/30'
                          : 'bg-surface text-text-secondary hover:bg-surface-light'
                      }`}
                      onClick={() => setTextOverlay({ ...textOverlay, position: 'custom' })}
                    >
                      {t('generate.position_custom')}
                    </button>
                    {textOverlay.position === 'custom' && (
                      <div className="space-y-3 bg-surface p-3 rounded-lg">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-text-secondary">{t('generate.position_x')}</span>
                            <span className="text-xs text-text-muted">{textOverlay.positionX}%</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={textOverlay.positionX}
                            onChange={(e) => setTextOverlay({ ...textOverlay, positionX: Number(e.target.value) })}
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-text-secondary">{t('generate.position_y')}</span>
                            <span className="text-xs text-text-muted">{textOverlay.positionY}%</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={textOverlay.positionY}
                            onChange={(e) => setTextOverlay({ ...textOverlay, positionY: Number(e.target.value) })}
                            className="w-full"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                 </div>
               </details>
             </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-text-muted">{t('generate.font_size_label')}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={textOverlay.fontSizeUnit === 'px' ? 12 : 10}
                    max={textOverlay.fontSizeUnit === 'px' ? 200 : 300}
                    value={textOverlay.fontSize}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      if (Number.isNaN(next)) return;
                      const min = textOverlay.fontSizeUnit === 'px' ? 12 : 10;
                      const max = textOverlay.fontSizeUnit === 'px' ? 200 : 300;
                      setTextOverlay({ ...textOverlay, fontSize: Math.min(max, Math.max(min, next)) });
                    }}
                    className="w-20 bg-surface-dark border border-surface-light rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-primary"
                  />
                  <select
                    value={textOverlay.fontSizeUnit}
                    onChange={(e) => setTextOverlay({ ...textOverlay, fontSizeUnit: e.target.value as TextOverlay['fontSizeUnit'] })}
                    className="bg-surface-dark border border-surface-light rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-primary"
                  >
                    <option value="px">{t('generate.font_size_px')}</option>
                    <option value="percent">{t('generate.font_size_percent')}</option>
                  </select>
                </div>
              </div>
              <input
                type="range"
                min={textOverlay.fontSizeUnit === 'px' ? 12 : 10}
                max={textOverlay.fontSizeUnit === 'px' ? 200 : 300}
                value={textOverlay.fontSize}
                onChange={(e) => setTextOverlay({ ...textOverlay, fontSize: Number(e.target.value) })}
                className="w-full"
              />
              <label className="text-xs font-medium text-text-muted mb-1 mt-3 block">{t('generate.text_input_label')}</label>
              <input 
                type="text" 
                className="w-full bg-surface-dark border border-surface-light rounded-lg px-3 py-2 text-text-primary placeholder-text-muted focus:outline-none focus:border-primary"
               placeholder={t('generate.text_input_placeholder')}
                value={textOverlay.text}
                onChange={e => setTextOverlay({...textOverlay, text: e.target.value})}
              />
            </div>

            <div className="flex items-center justify-between bg-surface-dark border border-surface-light rounded-lg px-3 py-2">
              <span className="text-sm font-semibold text-text-primary">{t('generate.auto_translate_label')}</span>
              <button
                className={`w-12 h-6 rounded-full relative transition-colors ${autoTranslateEnabled ? 'bg-primary' : 'bg-surface-light'}`}
                onClick={() => setAutoTranslateEnabled(!autoTranslateEnabled)}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${autoTranslateEnabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
             
             {/* Outro Section (Sareklamo Qudis Ganyofileba) */}
             <div className="pt-4 border-t border-surface-light mt-4">
               <h3 className="text-sm font-bold text-text-primary mb-3">{t('generate.outro_section_title')}</h3>
                <div className="grid grid-cols-3 gap-2">
                  {OUTRO_VIDEOS.map((outro) => (
                    <button
                      key={outro.id}
                      onClick={() => setSelectedOutro(selectedOutro === outro.id ? null : outro.id)}
                      className={`aspect-video rounded-lg border-2 flex items-center justify-center relative overflow-hidden transition-all ${
                        selectedOutro === outro.id 
                          ? 'border-primary bg-primary/10' 
                          : 'border-surface-light bg-surface-dark hover:border-primary/50'
                      }`}
                    >
                      <span className="text-xs text-text-muted">{outro.name}</span>
                      {selectedOutro === outro.id && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <div className="bg-primary text-white rounded-full p-0.5">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
               <p className="text-xs text-text-muted mt-2 text-center">{t('generate.outro_section_hint')}</p>
             </div>
           </div>
        </div>
      </div>

      {/* COLUMN 2: Image Upload (Middle) - Flexible Width */}
      <div className="flex-1 min-w-0">
        <div className="bg-surface rounded-xl border border-surface-light p-5 h-fit">
           <h2 className="text-lg font-semibold mb-3 flex items-center text-text-primary">
             <Upload className="mr-2 text-primary" size={18} />
             {t('generate.input_images')}
           </h2>
           
           <div 
             className={`border-2 border-dashed rounded-xl p-4 text-center transition-all flex flex-col items-center justify-center min-h-[150px] ${
               isDragging ? 'border-primary bg-primary/10' : 'border-surface-light hover:border-primary'
             }`}
             onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
             onDragLeave={() => setIsDragging(false)}
             onDrop={(e) => {
               e.preventDefault();
               setIsDragging(false);
               if (e.dataTransfer.files) addFiles(Array.from(e.dataTransfer.files));
             }}
           >
            <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" id="file-upload" onChange={handleFileSelect} />
             <label htmlFor="file-upload" className="cursor-pointer block">
               <Upload size={48} className="mx-auto text-text-secondary mb-3" />
               <p className="text-lg font-medium text-text-primary">{t('generate.drag_drop')}</p>
               <p className="text-sm text-text-muted mt-1">{t('generate.click_browse')}</p>
             </label>
           </div>

           {files.length > 0 && (
             <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-text-secondary">
                 {t('generate.images_selected_hint', { count: files.length, max: MAX_IMAGES })}
                </p>
                <button
                  type="button"
                  onClick={() => { setFiles([]); setDraggedItem(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="text-xs text-text-muted hover:text-text-primary border border-surface-light rounded-md px-2 py-1 transition-colors"
                >
                  გასუფთავება
                </button>
              </div>
               <div className="grid grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2">
                 {files.map((file, i) => (
                   <div 
                     key={file.id}
                     draggable
                     onDragStart={() => handleDragStart(i)}
                     onDragOver={(e) => handleDragOver(e, i)}
                     onDragEnd={handleDragEnd}
                     className={`relative group h-24 md:h-28 bg-surface-dark rounded-lg overflow-hidden border-2 transition-all cursor-move ${
                       draggedItem === i ? 'border-primary opacity-50' : 'border-surface-light hover:border-primary'
                     }`}
                   >
                     <img src={file.preview} alt={file.file.name} className="w-full h-full object-contain" />
                     
                     {/* Text Overlay Preview */}
                    {textOverlay.enabled && hasPreviewText && (
                       <div 
                        className="absolute w-[90%] z-10"
                         style={{ 
                            ...getPreviewStyle(textOverlay),
                            color: TEXT_COLORS.find(c => c.name === textOverlay.color)?.value || 'white',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                         }}
                       >
                      <div style={previewTypography}>
                        {previewDisplayText}
                       </div>
                       </div>
                     )}

                     <div className="absolute top-1 left-1 bg-black/50 text-white rounded p-1 opacity-0 group-hover:opacity-100">
                       <GripVertical size={12} />
                     </div>
                     <button 
                       onClick={() => removeFile(i)}
                       className="absolute top-1 right-1 bg-red-500/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100"
                     >
                       <X size={14} />
                     </button>
                     <div className="absolute bottom-1 left-1 bg-primary text-white text-xs rounded px-1.5 py-0.5">
                       {i + 1}
                     </div>
                   </div>
                 ))}
               </div>
             </div>
           )}
        </div>
        
        {/* Progress & Results (Below Image Upload) */}
        {(status === 'running' || status === 'queued' || status === 'done') && (
          <div className="grid grid-cols-2 gap-4">
            {['9x16', '1x1', '4x5', '16x9'].map((fmt) => {
              const pct = progress[fmt] || 0;
              const isDone = pct === 100;
              const file = resultFiles.find(f => f.includes(fmt));
              
              return (
                <div key={fmt} className="bg-surface border border-surface-light rounded-xl p-4 flex flex-col h-[450px]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-text-muted bg-surface-dark px-2 py-1 rounded">{fmt}</span>
                    <span className="text-xs text-text-secondary">{isDone ? '✓' : `${pct}%`}</span>
                  </div>
                  <div className="flex-1 flex items-center justify-center bg-surface-dark rounded-lg overflow-hidden mb-3 relative">
                    {isDone && file ? (
                      <video controls className="w-full h-full object-contain" src={`/api/jobs/${jobId}/download/${file}`} />
                    ) : (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-text-primary mb-2">{pct}%</div>
                        <div className="w-24 bg-surface-light rounded-full h-2">
                          <div className={`h-full rounded-full ${isDone ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                  {isDone && file && (
                    <a href={`/api/jobs/${jobId}/download/${file}`} className="w-full flex items-center justify-center bg-surface-light hover:bg-surface-light/80 text-text-primary text-sm py-2 rounded">
                      <Download size={14} className="mr-1" /> {t('generate.btn_download')}
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* COLUMN 3: Other Settings (Right) - Wider Width */}
      <div className="w-full lg:w-[440px] shrink-0">
        <div className="bg-surface rounded-xl border border-surface-light p-5 h-fit">
          <h2 className="text-lg font-semibold mb-4 flex items-center text-text-primary">
            <SettingsIcon className="mr-2 text-primary" size={18} />
            {t('generate.settings')}
          </h2>

          <div className="space-y-6">
            {/* Social Platforms (Target) - New Design with Toggles */}
            <div className="mb-6 border-b border-surface-light pb-6">
              <h3 className="text-sm font-medium text-text-secondary mb-4 flex items-center">
                <Monitor className="mr-2" size={16} />
                {t('generate.target_platform')}
              </h3>
              <div className="space-y-3">
                {SOCIAL_PLATFORMS.map((platform) => (
                  <div 
                    key={platform.id}
                    className={`p-3 rounded-lg border transition-all ${
                      enabledPlatforms[platform.id] 
                        ? 'bg-surface-dark border-primary' 
                        : 'bg-surface-dark/50 border-surface-light'
                    }`}
                  >
                    {/* Header: Logo Image + Name + Toggle */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-lg mr-3 flex items-center justify-center shadow-md bg-surface-light">
                          <platform.icon size={20} style={{ color: platform.color }} />
                        </div>
                        <div className="text-sm font-medium text-text-primary">{platform.name}</div>
                      </div>
                      {/* Toggle Switch */}
                      <button
                        onClick={() => togglePlatform(platform.id)}
                        className={`w-12 h-6 rounded-full relative transition-colors ${
                          enabledPlatforms[platform.id] ? 'bg-primary' : 'bg-surface-light'
                        }`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                          enabledPlatforms[platform.id] ? 'left-7' : 'left-1'
                        }`} />
                      </button>
                    </div>
                    
                    {/* Format Dropdown (only show if enabled) */}
                    {enabledPlatforms[platform.id] && (
                      <div className="mt-2 pl-11">
                        <select
                          value={selectedFormats[platform.id]}
                          onChange={(e) => setSelectedFormats({...selectedFormats, [platform.id]: e.target.value})}
                          className="w-full bg-surface border border-surface-light rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                        >
                          {platform.formats.map((format) => (
                            <option key={format} value={format}>
                              {format === '9x16' ? '9:16 (Vertical)' : 
                               format === '1x1' ? '1:1 (Square)' : 
                               format === '4x5' ? '4:5 (Portrait)' : 
                               format === '16x9' ? '16:9 (Landscape)' : format}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Selected Platforms Summary */}
              <div className="mt-4 p-3 bg-surface-dark/30 rounded-lg">
                <div className="text-xs text-text-secondary mb-2">{t('generate.selected_platforms_label')}</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(enabledPlatforms).filter(([, enabled]) => enabled).length === 0 ? (
                    <span className="text-xs text-text-muted">{t('generate.selected_platforms_empty')}</span>
                  ) : (
                    Object.entries(enabledPlatforms).filter(([, enabled]) => enabled).map(([id]) => {
                      const platform = SOCIAL_PLATFORMS.find(p => p.id === id);
                      return (
                        <span key={id} className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">
                          {platform?.name}: {selectedFormats[id]}
                        </span>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Transitions with Visual Preview */}
            <div className="mb-6 border-b border-surface-light pb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-text-secondary">
                  {t('generate.transition')}
                </label>
              </div>
              
              <div className="mb-4 bg-surface-dark rounded-xl p-4 border border-surface-light">
                <div className="text-xs text-text-secondary mb-2 text-center">
                  {t('generate.transition_preview_label')}
                </div>
                <ModernSlider
                  className="w-full"
                  effects={transitionEffects}
                  previewImages={[
                    { id: 'preview-1', src: '/preview/image1.jpg', alt: 'Preview 1' },
                    { id: 'preview-2', src: '/preview/image2.jpg', alt: 'Preview 2' }
                  ]}
                  selectedId={settings.transition}
                  selectedEffectId={TRANSITION_EFFECT_MAP[settings.transition] ?? 'fade'}
                  onSelectEffect={(effectId) => setSettings({ ...settings, transition: effectId })}
                />
              </div>
              
              {/* Selected Transition Info */}
              <div className="mt-3 p-2 bg-surface-dark/50 rounded-lg text-center">
                <span className="text-xs text-text-secondary">{t('generate.selected_label')} </span>
                <span className="text-sm font-bold text-primary">
                  {TRANSITIONS.find(t => t.value === settings.transition)?.icon} {' '}
                  {t(`generate.transition_${settings.transition}`)}
                </span>
              </div>
            </div>

            {/* Music */}
            <div className="mb-6 border-b border-surface-light pb-6">
              <div className="flex justify-between items-center mb-4">
                <label className="text-sm font-medium text-text-secondary">{t('generate.music_label')}</label>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-text-muted">{isMusicEnabled ? t('generate.music_enabled') : t('generate.music_disabled')}</span>
                  <button 
                    className={`w-10 h-5 rounded-full relative transition-colors ${isMusicEnabled ? 'bg-primary' : 'bg-surface-light'}`}
                    onClick={() => { setIsMusicEnabled(!isMusicEnabled); if (isMusicEnabled) stopMusicPreview(); }}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isMusicEnabled ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {isMusicEnabled && (
                  <div className="flex items-center justify-between bg-surface-dark p-2 rounded-lg border border-surface-light">
                    <div className="text-xs text-text-secondary">
                      {musicFile ? musicFile.name : t('generate.music_upload')}
                    </div>
                    <label className="text-xs px-3 py-1.5 rounded bg-surface-light text-text-primary cursor-pointer">
                      {t('generate.music_browse')}
                      <input
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          if (file) {
                            stopMusicPreview();
                            setSelectedSampleMusic(null);
                            setMusicFile(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                )}
                <div className="bg-surface-dark rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                  {SAMPLE_MUSIC.map((sample, index) => (
                    <div 
                      key={sample.id}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                        selectedSampleMusic === sample.id 
                          ? 'bg-primary/20 border border-primary' 
                          : 'hover:bg-surface-light border border-transparent'
                      }`}
                      onClick={() => {
                        playMusicPreview(sample.id);
                        if (!isMusicEnabled) setIsMusicEnabled(true);
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <Music size={16} className={selectedSampleMusic === sample.id ? 'text-primary' : 'text-text-muted'} />
                        <div className="flex flex-col">
                          <span className={`text-sm font-medium ${selectedSampleMusic === sample.id ? 'text-primary' : 'text-text-secondary'}`}>
                            {t('generate.sample_track_name', { index: index + 1, genre: t(`generate.genre_${sample.genreKey}`) })}
                          </span>
                          <span className="text-xs text-text-muted">{sample.duration} • {t(`generate.genre_${sample.genreKey}`)}</span>
                        </div>
                      </div>
                      {isPlayingMusic && selectedSampleMusic === sample.id ? (
                        <div className="bg-primary/20 p-1.5 rounded-full">
                          <Volume2 size={14} className="text-primary animate-pulse" />
                        </div>
                      ) : (
                        <div className="bg-surface-light p-1.5 rounded-full">
                          <Play size={14} className="text-text-secondary" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {isMusicEnabled && (
                  <div className="flex items-center space-x-3 bg-surface-dark p-2 rounded-lg border border-surface-light">
                    <VolumeX size={14} className="text-text-muted" />
                    <input 
                      type="range" min="0" max="100"
                      className="flex-1 h-2 bg-surface-light rounded-lg accent-primary cursor-pointer"
                      value={musicVolume}
                      onChange={(e) => { setMusicVolume(parseInt(e.target.value)); if (audioRef.current) audioRef.current.volume = parseInt(e.target.value) / 100; }}
                    />
                    <Volume2 size={14} className="text-text-muted" />
                    <span className="text-xs font-mono text-text-secondary w-8 text-right">{musicVolume}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Other Settings */}
            <div className="space-y-4">
              <input 
                type="text" 
                className="w-full bg-surface-dark border border-surface-light rounded-lg px-3 py-2 text-text-primary placeholder-text-muted focus:outline-none focus:border-primary"
                placeholder={t('generate.property_id_placeholder')}
                value={settings.propertyId}
                onChange={e => setSettings({...settings, propertyId: e.target.value})}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-text-muted mb-1 block">{t('generate.duration')}</label>
                  <div className="flex items-center space-x-2 bg-surface-dark rounded-lg p-1 border border-surface-light">
                    <button 
                      onClick={() => setSettings(s => ({...s, secondsPerImage: Math.max(0.5, s.secondsPerImage - 0.5)}))}
                      className="p-1 hover:bg-surface-light rounded transition-colors text-text-primary"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="flex-1 text-center text-sm font-medium text-text-primary">
                      {settings.secondsPerImage.toFixed(1)}s
                    </span>
                    <button 
                      onClick={() => setSettings(s => ({...s, secondsPerImage: Math.min(5, s.secondsPerImage + 0.5)}))}
                      className="p-1 hover:bg-surface-light rounded transition-colors text-text-primary"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-1 block">{t('generate.transition_duration')}</label>
                  <div className="flex items-center space-x-2">
                     <input type="range" min="0.5" max="3" step="0.1"
                      className="flex-1 h-2 bg-surface-light rounded-lg accent-primary"
                      value={transitionDuration}
                      onChange={e => setTransitionDuration(parseFloat(e.target.value))}
                    />
                    <span className="text-sm text-text-secondary w-8 text-right">{transitionDuration}s</span>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                 <label className="text-xs text-text-muted mb-1 block">{t('generate.fps')}</label>
                 <input type="number" 
                    className="w-full bg-surface-dark border border-surface-light rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary"
                    value={settings.fps}
                    onChange={e => setSettings({...settings, fps: parseInt(e.target.value)})}
                  />
              </div>
            </div>

            {/* Generate Button (Moved inside) */}
            {(status === 'running' || status === 'queued') ? (
              <div className="mt-6 space-y-2">
                <div className="w-full bg-surface-light rounded-full h-2">
                  <div className="bg-primary h-full animate-pulse w-full" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-primary text-sm">{status === 'queued' ? t('generate.status_queued') : t('generate.status_rendering')}</span>
                  <button onClick={cancelJob} className="text-xs text-red-400">{t('generate.btn_cancel')}</button>
                </div>
              </div>
            ) : (
              <div className="mt-6">
                {/* Validation Messages */}
                {files.length === 0 && (
                  <div className="mb-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-yellow-400 text-xs text-center">
                    {t('generate.validation_no_images')}
                  </div>
                )}
                {files.length > 0 && !Object.values(enabledPlatforms).some(enabled => enabled) && (
                  <div className="mb-3 p-2 bg-orange-500/10 border border-orange-500/30 rounded text-orange-400 text-xs text-center">
                    {t('generate.validation_no_platform')}
                  </div>
                )}
                
                <button 
                  className={`w-full flex items-center justify-center py-3 text-lg font-semibold rounded-lg transition-all ${
                    files.length === 0 || !Object.values(enabledPlatforms).some(enabled => enabled)
                      ? 'bg-surface-light text-text-muted cursor-not-allowed' 
                      : 'bg-primary hover:bg-primary-dark text-white shadow-lg hover:shadow-xl'
                  }`}
                  onClick={startJob}
                  disabled={files.length === 0 || !Object.values(enabledPlatforms).some(enabled => enabled)}
                >
                  <Play className="mr-2" fill="currentColor" size={20} />
                  {files.length === 0 
                    ? t('generate.disabled_no_images')
                    : !Object.values(enabledPlatforms).some(enabled => enabled)
                      ? t('generate.disabled_no_platform')
                      : t('generate.btn_generate')
                  }
                </button>
              </div>
            )}

            {status === 'done' && (
              <div className="mt-4 bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-lg text-center text-sm">
                {t('generate.status_success')} <button onClick={() => navigate('/outputs')} className="underline font-bold">{t('generate.btn_view_outputs')}</button>
              </div>
            )}
            {status === 'error' && (
              <div className="mt-4 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-center text-sm">
                {errorMessage || t('generate.status_error')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Generate;
