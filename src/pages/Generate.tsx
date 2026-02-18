import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, X, Play, Settings as SettingsIcon, 
  Music, Download, Volume2, VolumeX, 
  GripVertical, Type, Image as ImageIcon, Palette,
  Monitor, Smartphone, Video, Plus, Minus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/useLanguage';

interface JobSettings {
  fps: number;
  secondsPerImage: number;
  transition: string;
  propertyId: string;
}

interface TextOverlay {
  enabled: boolean;
  text: string;
  position: 'bottom-left' | 'bottom-center' | 'bottom-right';
  color: 'white' | 'black' | 'orange' | 'red' | 'green' | 'sky' | 'gray' | 'maroon';
  showLogo: boolean;
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
  // Basic (Switch style)
  { value: 'cut', labelKey: 'transition_cut', icon: '✂️', type: 'basic' },
  { value: 'fade', labelKey: 'transition_fade', icon: '👻', type: 'basic' },
  
  // Creative
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

type FontOption = {
  id: string;
  labelKey: string;
  css: string;
  backend: string;
};

const FONT_OPTIONS: FontOption[] = [
  { id: 'sans', labelKey: 'font_sans', css: "'Arial', 'Helvetica', sans-serif", backend: 'Arial' },
  { id: 'serif', labelKey: 'font_serif', css: "'Times New Roman', 'Times', serif", backend: 'Times New Roman' },
  { id: 'mono', labelKey: 'font_mono', css: "'Courier New', 'Courier', monospace", backend: 'Courier New' },
  { id: 'script', labelKey: 'font_script', css: "'Comic Sans MS', 'Comic Sans', cursive", backend: 'Comic Sans MS' },
  { id: 'display', labelKey: 'font_display', css: "'Impact', 'Haettenschweiler', sans-serif", backend: 'Impact' }
];

const TEXT_STYLE = {
  title: { size: 60, weight: 600, letterSpacing: 0.5, lineHeight: 1.1 },
  price: { size: 80, weight: 700, letterSpacing: 0.6, lineHeight: 1.05 },
  phone: { size: 40, weight: 500, letterSpacing: 0.4, lineHeight: 1.1 },
  lineGap: 12
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
  const [hoveredTransition, setHoveredTransition] = useState<string | null>(null);
  const [settings, setSettings] = useState<JobSettings>({
    fps: 30,
    secondsPerImage: 3.2,
    transition: 'fade',
    propertyId: ''
  });
  
  // Text Overlay State
  const [textOverlay, setTextOverlay] = useState<TextOverlay>({
    enabled: true, // Default enabled for new layout
    text: '',
    position: 'bottom-left',
    color: 'white',
    showLogo: false
  });

  // New state for extended settings
  const [selectedFontId, setSelectedFontId] = useState(FONT_OPTIONS[0].id);
  const [propertyRooms, setPropertyRooms] = useState('');
  const [propertyArea, setPropertyArea] = useState('');
  const [compareMode, setCompareMode] = useState(false);
  const [compareFonts, setCompareFonts] = useState<string[]>([
    FONT_OPTIONS[0].id,
    FONT_OPTIONS[1].id
  ]);
  const [previewWidth, setPreviewWidth] = useState(0);
  const previewRef = useRef<HTMLDivElement | null>(null);

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
    instagram: '1x1',
    facebook: '1x1',
    youtube: '9x16'
  });

  const selectedFont = FONT_OPTIONS.find(font => font.id === selectedFontId) ?? FONT_OPTIONS[0];
  const previewText = textOverlay.text.trim();
  const hasPreviewText = previewText.length > 0;
  const previewSampleText = t('generate.font_sample_letter');
  const previewScale = previewWidth > 0 ? previewWidth / 1080 : 0.2;
  const getScaledSize = (size: number) => Math.max(8, Math.round(size * previewScale));
  const getScaledLetterSpacing = (value: number) => `${(value * previewScale).toFixed(2)}px`;

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
    if (!compareMode) return;
    if (compareFonts.length >= 2) return;
    setCompareFonts([FONT_OPTIONS[0].id, FONT_OPTIONS[1].id]);
  }, [compareMode, compareFonts.length]);

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
    
    // Add text overlay settings
    const overlayData = {
      ...textOverlay,
      fontFamily: selectedFont.backend,
      fontKey: selectedFont.id,
      text: textOverlay.text,
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
      rooms: propertyRooms,
      area: propertyArea
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
    const getPreviewStyle = (pos: string) => {
      const [v, h] = pos.split('-');
      const style: React.CSSProperties = { position: 'absolute', pointerEvents: 'none' };
      
      if (v === 'top') style.top = '10%';
      else style.bottom = '10%';
      
      if (h === 'left') { style.left = '5%'; style.textAlign = 'left'; }
      else if (h === 'right') { style.right = '5%'; style.textAlign = 'right'; }
      else { style.left = '50%'; style.transform = 'translateX(-50%)'; style.textAlign = 'center'; }
      
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
              <div className="space-y-2">
                {FONT_OPTIONS.map(font => {
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
                          <span className="text-sm font-semibold text-text-primary">{t(`generate.${font.labelKey}`)}</span>
                        </div>
                        <span className="text-xs text-text-secondary truncate" style={{ fontFamily: font.css }}>
                          {previewSampleText}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3">
                <div className="text-xs text-text-muted mb-2">{t('generate.font_live_preview')}</div>
                <div
                  ref={previewRef}
                  className="relative w-full overflow-hidden rounded-lg border border-surface-light bg-surface-dark"
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
                      ...getPreviewStyle(textOverlay.position),
                      color: TEXT_COLORS.find(c => c.name === textOverlay.color)?.value || 'white',
                      fontFamily: selectedFont.css,
                      textShadow: textOverlay.color === 'white' ? '0 1px 3px rgba(0,0,0,0.6)' : 'none'
                    }}
                  >
                    {hasPreviewText && (
                      <div
                        style={{
                          fontSize: `${getScaledSize(TEXT_STYLE.title.size)}px`,
                          fontWeight: TEXT_STYLE.title.weight,
                          lineHeight: TEXT_STYLE.title.lineHeight,
                          letterSpacing: getScaledLetterSpacing(TEXT_STYLE.title.letterSpacing)
                        }}
                      >
                        {previewText}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4 border-t border-surface-light/60 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-text-secondary">{t('generate.font_compare_title')}</span>
                  <button
                    className={`w-12 h-6 rounded-full relative transition-colors ${compareMode ? 'bg-primary' : 'bg-surface-light'}`}
                    onClick={() => setCompareMode(!compareMode)}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${compareMode ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
                {compareMode && (
                  <div className="space-y-3">
                    <div className="text-xs text-text-muted">{t('generate.font_compare_hint')}</div>
                    <div className="space-y-2">
                      {FONT_OPTIONS.map(font => {
                        const isChecked = compareFonts.includes(font.id);
                        const disableAdd = !isChecked && compareFonts.length >= 3;
                        return (
                          <label
                            key={font.id}
                            className={`flex items-center justify-between gap-3 border rounded-lg px-3 py-2 cursor-pointer ${
                              isChecked ? 'border-primary/70 bg-primary/10' : 'border-surface-light bg-surface-dark'
                            } ${disableAdd ? 'opacity-60 cursor-not-allowed' : ''}`}
                          >
                            <input
                              type="checkbox"
                              className="accent-primary"
                              checked={isChecked}
                              disabled={disableAdd}
                              onChange={() => {
                                setCompareFonts(prev => {
                                  if (prev.includes(font.id)) return prev.filter(id => id !== font.id);
                                  if (prev.length >= 3) return prev;
                                  return [...prev, font.id];
                                });
                              }}
                            />
                            <span className="text-sm text-text-secondary">{t(`generate.${font.labelKey}`)}</span>
                            <span className="text-xs text-text-secondary truncate" style={{ fontFamily: font.css }}>
                              {previewSampleText}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    {compareFonts.length >= 2 && (
                      <div className="space-y-2">
                        {compareFonts.map(fontId => {
                          const font = FONT_OPTIONS.find(item => item.id === fontId);
                          if (!font) return null;
                          return (
                            <div key={font.id} className="border border-surface-light rounded-lg bg-surface-dark/60 p-3">
                              <div className="text-xs text-text-muted mb-2">{t(`generate.${font.labelKey}`)}</div>
                              <div style={{ fontFamily: font.css, color: TEXT_COLORS.find(c => c.name === textOverlay.color)?.value || 'white' }}>
                                <div
                                  style={{
                                    fontSize: `${getScaledSize(TEXT_STYLE.title.size)}px`,
                                    fontWeight: TEXT_STYLE.title.weight,
                                    lineHeight: TEXT_STYLE.title.lineHeight,
                                    letterSpacing: getScaledLetterSpacing(TEXT_STYLE.title.letterSpacing)
                                  }}
                                >
                                  {previewSampleText}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
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
                   
                   {/* Position Control */}
                   <div className="space-y-2">
                      {/* Vertical */}
                      <div className="grid grid-cols-2 gap-2 bg-surface p-1 rounded-lg">
                        <button 
                          className={`text-xs py-1.5 rounded-md transition-all ${textOverlay.position.startsWith('top') ? 'bg-primary text-white shadow' : 'text-text-secondary hover:bg-surface-light'}`}
                          onClick={() => {
                             const align = textOverlay.position.split('-')[1] || 'left';
                             setTextOverlay({...textOverlay, position: `top-${align}` as TextOverlay['position']});
                          }}
                        >
                          {t('generate.position_top')}
                        </button>
                        <button 
                          className={`text-xs py-1.5 rounded-md transition-all ${textOverlay.position.startsWith('bottom') ? 'bg-primary text-white shadow' : 'text-text-secondary hover:bg-surface-light'}`}
                          onClick={() => {
                             const align = textOverlay.position.split('-')[1] || 'left';
                             setTextOverlay({...textOverlay, position: `bottom-${align}` as TextOverlay['position']});
                          }}
                        >
                          {t('generate.position_bottom')}
                        </button>
                      </div>

                      {/* Horizontal */}
                      <div className="grid grid-cols-3 gap-1 bg-surface p-1 rounded-lg">
                        {['left', 'center', 'right'].map((align) => (
                          <button 
                            key={align}
                            className={`text-xs py-1.5 rounded-md transition-all capitalize ${textOverlay.position.includes(align) ? 'bg-surface-light text-primary font-bold border border-primary/30' : 'text-text-muted hover:text-text-secondary'}`}
                            onClick={() => {
                               const vert = textOverlay.position.split('-')[0] || 'bottom';
                               setTextOverlay({...textOverlay, position: `${vert}-${align}` as TextOverlay['position']});
                            }}
                          >
                            {align === 'left' ? t('generate.align_left') : align === 'center' ? t('generate.align_center') : t('generate.align_right')}
                          </button>
                        ))}
                      </div>
                   </div>
                 </div>
               </details>
             </div>

             {/* Property Details - Stacked like Price/Phone */}
             <div>
              <label className="text-xs font-medium text-text-muted mb-1 block">{t('generate.rooms_label')}</label>
               <input 
                 type="text" 
                 className="w-full bg-surface-dark border border-surface-light rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary placeholder-text-muted"
                placeholder={t('generate.rooms_placeholder')}
                 value={propertyRooms}
                 onChange={e => setPropertyRooms(e.target.value)}
               />
             </div>
             <div>
              <label className="text-xs font-medium text-text-muted mb-1 block">{t('generate.area_label')}</label>
               <input 
                 type="text" 
                 className="w-full bg-surface-dark border border-surface-light rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary placeholder-text-muted"
                placeholder={t('generate.area_placeholder')}
                 value={propertyArea}
                 onChange={e => setPropertyArea(e.target.value)}
               />
             </div>

            <div>
             <label className="text-xs font-medium text-text-muted mb-1 block">{t('generate.text_input_label')}</label>
              <input 
                type="text" 
                className="w-full bg-surface-dark border border-surface-light rounded-lg px-3 py-2 text-text-primary placeholder-text-muted focus:outline-none focus:border-primary"
               placeholder={t('generate.text_input_placeholder')}
                value={textOverlay.text}
                onChange={e => setTextOverlay({...textOverlay, text: e.target.value})}
              />
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
             <input type="file" multiple accept="image/*" className="hidden" id="file-upload" onChange={handleFileSelect} />
             <label htmlFor="file-upload" className="cursor-pointer block">
               <Upload size={48} className="mx-auto text-text-secondary mb-3" />
               <p className="text-lg font-medium text-text-primary">{t('generate.drag_drop')}</p>
               <p className="text-sm text-text-muted mt-1">{t('generate.click_browse')}</p>
             </label>
           </div>

           {files.length > 0 && (
             <div className="mt-6 space-y-2">
               <p className="text-sm text-text-secondary mb-3">
                {t('generate.images_selected_hint', { count: files.length, max: MAX_IMAGES })}
               </p>
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
                            ...getPreviewStyle(textOverlay.position),
                            color: TEXT_COLORS.find(c => c.name === textOverlay.color)?.value || 'white',
                           fontFamily: selectedFont.css,
                            textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                         }}
                       >
                       <div
                         style={{
                           fontSize: `${getScaledSize(TEXT_STYLE.title.size)}px`,
                           fontWeight: TEXT_STYLE.title.weight,
                           lineHeight: TEXT_STYLE.title.lineHeight,
                           letterSpacing: getScaledLetterSpacing(TEXT_STYLE.title.letterSpacing)
                         }}
                       >
                         {previewText}
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
              
              {/* VISUAL PREVIEW BOX - Shows actual transition with real images */}
              <div className="mb-4 bg-surface-dark rounded-xl p-4 border border-surface-light">
                <div className="text-xs text-text-secondary mb-2 text-center">
                  {t('generate.transition_preview_label')} {hoveredTransition ? t(`generate.transition_${hoveredTransition}`) : t(`generate.transition_${settings.transition}`)}
                </div>
                <div className="relative w-full h-40 bg-surface rounded-lg overflow-hidden">
                  {/* Image 1 (Background) - Default visible */}
                  <img 
                    src="/preview/image1.jpg"
                    alt="Image 1"
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${
                      hoveredTransition === 'fade' ? 'opacity-0' :
                      hoveredTransition === 'slide_left' ? '-translate-x-full' :
                      hoveredTransition === 'slide_right' ? 'translate-x-full' :
                      hoveredTransition === 'slide_up' ? '-translate-y-full' :
                      hoveredTransition === 'slide_down' ? 'translate-y-full' :
                      hoveredTransition === 'zoom_in' ? 'scale-0' :
                      hoveredTransition === 'zoom_out' ? 'scale-150 opacity-0' :
                      hoveredTransition === 'spin_in' ? 'rotate-180 opacity-0' :
                      hoveredTransition === 'spin_out' ? '-rotate-180 opacity-0' :
                      hoveredTransition ? 'opacity-30' : 'opacity-100'
                    }`}
                    style={{ transitionTimingFunction: 'ease-in-out' }}
                  />
                  
                  {/* Image 2 (Foreground) - Default hidden, slides in on hover */}
                  <img 
                    src="/preview/image2.jpg"
                    alt="Image 2"
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${
                      hoveredTransition === 'fade' ? 'opacity-100' :
                      hoveredTransition === 'slide_left' ? 'translate-x-0' :
                      hoveredTransition === 'slide_right' ? 'translate-x-0' :
                      hoveredTransition === 'slide_up' ? 'translate-y-0' :
                      hoveredTransition === 'slide_down' ? 'translate-y-0' :
                      hoveredTransition === 'zoom_in' ? 'scale-100' :
                      hoveredTransition === 'zoom_out' ? 'scale-100 opacity-100' :
                      hoveredTransition === 'spin_in' ? 'rotate-0 opacity-100' :
                      hoveredTransition === 'spin_out' ? 'rotate-0 opacity-100' :
                      'opacity-0'
                    }`}
                    style={{
                      transform: hoveredTransition === null ? 'translateX(100%)' :
                                hoveredTransition === 'slide_left' ? 'translateX(0)' :
                                hoveredTransition === 'slide_right' ? 'translateX(0)' :
                                hoveredTransition === 'slide_up' ? 'translateY(0)' :
                                hoveredTransition === 'slide_down' ? 'translateY(0)' :
                                hoveredTransition === 'zoom_in' ? 'scale(1)' :
                                hoveredTransition === 'zoom_out' ? 'scale(1)' :
                                hoveredTransition === 'fade' ? 'none' :
                                hoveredTransition?.includes('spin') ? 'none' :
                                'translateX(100%)',
                      opacity: hoveredTransition === null ? '0' : undefined
                    }}
                  />
                  
                  {/* Transition Icon Overlay */}
                  {hoveredTransition && (
                    <div className="absolute top-2 right-2 bg-primary text-white px-2 py-1 rounded text-xs font-bold shadow-lg">
                      {TRANSITIONS.find(t => t.value === hoveredTransition)?.icon}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Basic Switches */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {TRANSITIONS.filter(t => t.type === 'basic').map((tr) => (
                  <button
                    key={tr.value}
                    onClick={() => setSettings({...settings, transition: tr.value})}
                    onMouseEnter={() => setHoveredTransition(tr.value)}
                    onMouseLeave={() => setHoveredTransition(null)}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all relative overflow-hidden ${
                      settings.transition === tr.value 
                        ? 'bg-primary border-primary text-white' 
                        : 'bg-surface-dark border-surface-light text-text-secondary hover:border-primary'
                    } ${hoveredTransition === tr.value ? 'ring-2 ring-primary/50' : ''}`}
                  >
                    {/* Hover Animation Preview */}
                    {hoveredTransition === tr.value && (
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent animate-pulse" />
                    )}
                    <span className="flex items-center relative z-10">
                      <span className="mr-2 text-lg">{tr.icon}</span>
                      <span className="font-medium">{t(`generate.${tr.labelKey}`)}</span>
                    </span>
                    <div className={`w-10 h-5 rounded-full relative transition-colors ${
                      settings.transition === tr.value ? 'bg-white/30' : 'bg-black/20'
                    }`}>
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${
                        settings.transition === tr.value ? 'left-6' : 'left-1'
                      }`} />
                    </div>
                  </button>
                ))}
              </div>

              {/* Creative Grid with Hover Effects */}
              <div className="grid grid-cols-3 xl:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {TRANSITIONS.filter(t => t.type === 'creative').map((tr) => (
                  <button
                    key={tr.value}
                    onClick={() => setSettings({...settings, transition: tr.value})}
                    onMouseEnter={() => setHoveredTransition(tr.value)}
                    onMouseLeave={() => setHoveredTransition(null)}
                    className={`p-2 rounded-lg text-xs text-center transition-all border flex flex-col items-center justify-center aspect-square relative overflow-hidden ${
                      settings.transition === tr.value 
                        ? 'bg-primary border-primary text-white' 
                        : 'bg-surface-dark border-surface-light text-text-secondary hover:border-primary'
                    } ${hoveredTransition === tr.value ? 'scale-105 shadow-lg' : ''}`}
                  >
                    {/* Hover Glow Effect */}
                    {hoveredTransition === tr.value && (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-primary/10 animate-pulse" />
                    )}
                    <span className={`block text-2xl mb-1 relative z-10 transition-transform ${hoveredTransition === tr.value ? 'scale-110' : ''}`}>
                      {tr.icon}
                    </span>
                    <span className="line-clamp-2 leading-tight relative z-10 font-medium">
                      {t(`generate.${tr.labelKey}`)}
                    </span>
                    {/* Preview indicator on hover */}
                    {hoveredTransition === tr.value && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary rounded-full" />
                    )}
                  </button>
                ))}
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
