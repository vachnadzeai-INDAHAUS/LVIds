import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, X, Play, Settings as SettingsIcon, 
  Music, Download, Volume2, VolumeX, Eye, 
  GripVertical, Type, Image as ImageIcon, Palette,
  Monitor, Smartphone, Video, Plus, Minus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

interface JobSettings {
  fps: number;
  secondsPerImage: number;
  transition: string;
  propertyId: string;
}

interface TextOverlay {
  enabled: boolean;
  title: string;
  price: string;
  phone: string;
  position: 'bottom-left' | 'bottom-center' | 'bottom-right';
  color: 'white' | 'black' | 'orange';
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

const SAMPLE_MUSIC = Array.from({ length: 30 }, (_, i) => ({
  id: `track_${i + 1}`,
  name: `Track ${i + 1} - ${['Pop', 'Rock', 'Ambient', 'Jazz', 'Electronic'][i % 5]}`,
  duration: '0:30',
  genre: ['Pop', 'Rock', 'Ambient', 'Jazz', 'Electronic'][i % 5]
}));

const Generate: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [settings, setSettings] = useState<JobSettings>({
    fps: 30,
    secondsPerImage: 3.2,
    transition: 'fade',
    propertyId: ''
  });
  
  // Text Overlay State
  const [textOverlay, setTextOverlay] = useState<TextOverlay>({
    enabled: false,
    title: '',
    price: '',
    phone: '',
    position: 'bottom-left',
    color: 'white',
    showLogo: false
  });
  
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
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  const handlePlatformSelect = (id: string) => {
    if (selectedPlatform === id) {
      setSelectedPlatform(null);
    } else {
      setSelectedPlatform(id);
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
    console.log('Adding files:', newFiles.length);
    const images = newFiles.filter(f => f.type.startsWith('image/'));
    console.log('Filtered images:', images.length);
    const filesWithPreview = images.map((file, index) => ({
      file: file,
      preview: URL.createObjectURL(file),
      id: `${file.name}-${index}-${Date.now()}`
    }));
    setFiles(prev => {
      const updated = [...prev, ...filesWithPreview];
      console.log('Total files:', updated.length);
      return updated;
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
    let interval: any;
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
    return () => clearInterval(interval);
  }, [jobId, status]);

  const startJob = async () => {
    if (files.length === 0) return;
    
    setStatus('queued');
    setErrorMessage(null);
    setProgress({});
    setResultFiles([]);
    
    const formData = new FormData();
    files.forEach(f => formData.append('images', f.file));
    formData.append('propertyId', settings.propertyId || `job_${Date.now()}`);
    
    // Add text overlay settings
    formData.append('textOverlay', JSON.stringify(textOverlay));
    
    if (isMusicEnabled && (musicFile || selectedSampleMusic)) {
      if (musicFile) formData.append('music', musicFile);
      if (selectedSampleMusic) formData.append('sampleMusic', selectedSampleMusic);
    }
    
    formData.append('settings', JSON.stringify({
      fps: settings.fps,
      secondsPerImage: settings.secondsPerImage,
      transition: settings.transition,
      musicVolume: isMusicEnabled ? musicVolume / 100 : 0,
      transitionDuration: transitionDuration
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
      setStatus('error');
    }
  };

  const cancelJob = async () => {
    if (!jobId) return;
    await fetch(`/api/jobs/${jobId}/cancel`, { method: 'POST' });
    setStatus('canceled');
  };

  const textColorClasses = {
    'white': 'text-white',
    'black': 'text-gray-900',
    'orange': 'text-primary'
  };

  const positionClasses = {
    'bottom-left': 'items-start',
    'bottom-center': 'items-center',
    'bottom-right': 'items-end'
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Side */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Image Upload */}
        <div className="bg-surface rounded-xl border border-surface-light p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center text-text-primary">
            <Upload className="mr-2 text-primary" size={20} />
            {t('generate.input_images')}
          </h2>
          
          <div 
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
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
                {t('generate.images_selected', { count: files.length })} - Drag to reorder
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {files.map((file, i) => (
                  <div 
                    key={file.id}
                    draggable
                    onDragStart={() => handleDragStart(i)}
                    onDragOver={(e) => handleDragOver(e, i)}
                    onDragEnd={handleDragEnd}
                    className={`relative group aspect-square bg-surface-dark rounded-lg overflow-hidden border-2 transition-all cursor-move ${
                      draggedItem === i ? 'border-primary opacity-50' : 'border-surface-light hover:border-primary'
                    }`}
                  >
                    <img src={file.preview} alt={file.file.name} className="w-full h-full object-cover" />
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

        {/* Text Overlay Preview */}
        {textOverlay.enabled && (textOverlay.title || textOverlay.price) && files.length > 0 && (
          <div className="bg-surface rounded-xl border border-surface-light p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center">
              <Eye className="mr-2 text-primary" size={18} />
              Text Preview
            </h3>
            <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden">
              <img src={files[0]?.preview} alt="Preview" className="w-full h-full object-cover" />
              <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex flex-col ${positionClasses[textOverlay.position]}`}>
                {textOverlay.title && (
                  <span className={`text-lg font-bold ${textColorClasses[textOverlay.color]} drop-shadow-lg`}>
                    {textOverlay.title}
                  </span>
                )}
                {textOverlay.price && (
                  <span className={`text-xl font-bold ${textColorClasses[textOverlay.color]} drop-shadow-lg mt-1`}>
                    {textOverlay.price}
                  </span>
                )}
                {textOverlay.phone && (
                  <span className={`text-sm ${textColorClasses[textOverlay.color]} drop-shadow-lg mt-1 opacity-90`}>
                    📞 {textOverlay.phone}
                  </span>
                )}
              </div>
              {textOverlay.showLogo && (
                <div className="absolute top-4 right-4 bg-primary/90 text-white px-3 py-1 rounded text-sm font-bold">
                  LUMINAVIDS
                </div>
              )}
            </div>
          </div>
        )}

        {/* Progress */}
        {(status === 'running' || status === 'queued' || status === 'done') && (
          <div className="grid grid-cols-2 gap-4">
            {['9x16', '1x1', '4x5', '16x9'].map((fmt) => {
              const pct = progress[fmt] || 0;
              const isDone = pct === 100;
              const file = resultFiles.find(f => f.includes(fmt));
              
              return (
                <div key={fmt} className="bg-surface border border-surface-light rounded-xl p-4 flex flex-col h-[280px]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-text-muted bg-surface-dark px-2 py-1 rounded">{fmt}</span>
                    <span className="text-xs text-text-secondary">{isDone ? '✓' : `${pct}%`}</span>
                  </div>
                  <div className="flex-1 flex items-center justify-center bg-surface-dark rounded-lg overflow-hidden mb-3">
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
                      <Download size={14} className="mr-1" /> Download
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Side - Settings */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-surface rounded-xl border border-surface-light p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center text-text-primary">
            <SettingsIcon className="mr-2 text-primary" size={20} />
            {t('generate.settings')}
          </h2>

          {/* Text Overlay Section */}
          <div className="mb-6 border-b border-surface-light pb-6">
            <h3 className="text-sm font-medium text-text-secondary flex items-center mb-4">
              <Type className="mr-2" size={16} />
              Text Overlay (Optional)
            </h3>
            
            <div className="space-y-4">
              <input 
                type="text" 
                className="w-full bg-surface-dark border border-surface-light rounded-lg px-3 py-2 text-text-primary placeholder-text-muted focus:outline-none focus:border-primary"
                placeholder="Title (e.g., 3-Room Apartment)"
                value={textOverlay.title}
                onChange={e => setTextOverlay({...textOverlay, title: e.target.value, enabled: true})}
              />
              <input 
                type="text" 
                className="w-full bg-surface-dark border border-surface-light rounded-lg px-3 py-2 text-text-primary placeholder-text-muted focus:outline-none focus:border-primary"
                placeholder="Price (e.g., 150,000₾)"
                value={textOverlay.price}
                onChange={e => setTextOverlay({...textOverlay, price: e.target.value, enabled: true})}
              />
              <input 
                type="text" 
                className="w-full bg-surface-dark border border-surface-light rounded-lg px-3 py-2 text-text-primary placeholder-text-muted focus:outline-none focus:border-primary"
                placeholder="Phone (e.g., 599 12 34 56)"
                value={textOverlay.phone}
                onChange={e => setTextOverlay({...textOverlay, phone: e.target.value, enabled: true})}
              />

              {/* Position */}
              <div>
                <label className="text-xs text-text-muted mb-2 block">Position</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['bottom-left', 'bottom-center', 'bottom-right'] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setTextOverlay({...textOverlay, position: pos, enabled: true})}
                      className={`p-2 rounded text-xs capitalize transition-colors ${
                        textOverlay.position === pos 
                          ? 'bg-primary text-white' 
                          : 'bg-surface-dark text-text-secondary hover:bg-surface-light'
                      }`}
                    >
                      {pos.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="text-xs text-text-muted mb-2 block flex items-center">
                  <Palette className="mr-1" size={12} />
                  Text Color
                </label>
                <div className="flex gap-2">
                  {(['white', 'black', 'orange'] as const).map((color) => (
                    <button
                      key={color}
                      onClick={() => setTextOverlay({...textOverlay, color, enabled: true})}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        textOverlay.color === color ? 'border-primary scale-110' : 'border-transparent'
                      } ${
                        color === 'white' ? 'bg-white' : 
                        color === 'black' ? 'bg-gray-900' : 
                        'bg-primary'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Logo Toggle */}
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm text-text-secondary flex items-center">
                  <ImageIcon className="mr-2" size={14} />
                  Show LUMINAVIDS Logo
                </span>
                <button 
                  className={`w-10 h-5 rounded-full relative transition-colors ${textOverlay.showLogo ? 'bg-primary' : 'bg-surface-light'}`}
                  onClick={() => setTextOverlay({...textOverlay, showLogo: !textOverlay.showLogo, enabled: true})}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${textOverlay.showLogo ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Social Platforms (Target) */}
          <div className="mb-6 border-b border-surface-light pb-6">
            <h3 className="text-sm font-medium text-text-secondary mb-4 flex items-center">
              <Monitor className="mr-2" size={16} />
              Target Platform
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {SOCIAL_PLATFORMS.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => handlePlatformSelect(platform.id)}
                  className={`flex items-center p-3 rounded-lg border transition-all ${
                    selectedPlatform === platform.id 
                      ? 'bg-surface-dark border-primary' 
                      : 'bg-surface-dark border-surface-light hover:border-primary/50'
                  }`}
                >
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                    style={{ backgroundColor: platform.color }}
                  >
                    <platform.icon size={16} className="text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-text-primary">{platform.name}</div>
                    <div className="text-xs text-text-muted">{platform.formats.join(', ')}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Transitions */}
          <div className="mb-6 border-b border-surface-light pb-6">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              {t('generate.transition')}
            </label>
            
            {/* Basic Switches */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {TRANSITIONS.filter(t => t.type === 'basic').map((tr) => (
                <button
                  key={tr.value}
                  onClick={() => setSettings({...settings, transition: tr.value})}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    settings.transition === tr.value 
                      ? 'bg-primary border-primary text-white' 
                      : 'bg-surface-dark border-surface-light text-text-secondary hover:border-primary'
                  }`}
                >
                  <span className="flex items-center">
                    <span className="mr-2">{tr.icon}</span>
                    {t(`generate.${tr.labelKey}`)}
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

            {/* Creative Grid */}
            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {TRANSITIONS.filter(t => t.type === 'creative').map((tr) => (
                <button
                  key={tr.value}
                  onClick={() => setSettings({...settings, transition: tr.value})}
                  className={`p-2 rounded-lg text-xs text-center transition-all border flex flex-col items-center justify-center aspect-square ${
                    settings.transition === tr.value 
                      ? 'bg-primary border-primary text-white' 
                      : 'bg-surface-dark border-surface-light text-text-secondary hover:border-primary'
                  }`}
                >
                  <span className="block text-xl mb-1">{tr.icon}</span>
                  <span className="line-clamp-2 leading-tight">{t(`generate.${tr.labelKey}`)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Music */}
          <div className="mb-6 border-b border-surface-light pb-6">
            <div className="flex justify-between items-center mb-4">
              <label className="text-sm font-medium text-text-secondary">{t('generate.music_label')}</label>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-text-muted">{isMusicEnabled ? 'Enabled' : 'Disabled'}</span>
                <button 
                  className={`w-10 h-5 rounded-full relative transition-colors ${isMusicEnabled ? 'bg-primary' : 'bg-surface-light'}`}
                  onClick={() => { setIsMusicEnabled(!isMusicEnabled); if (isMusicEnabled) stopMusicPreview(); }}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isMusicEnabled ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-surface-dark rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                {SAMPLE_MUSIC.map((sample) => (
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
                          {sample.name}
                        </span>
                        <span className="text-xs text-text-muted">{sample.duration} • {sample.genre}</span>
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
                <label className="text-xs text-text-muted mb-1 block">Duration per image</label>
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
                <label className="text-xs text-text-muted mb-1 block">Transition Duration</label>
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
               <label className="text-xs text-text-muted mb-1 block">FPS</label>
               <input type="number" 
                  className="w-full bg-surface-dark border border-surface-light rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary"
                  value={settings.fps}
                  onChange={e => setSettings({...settings, fps: parseInt(e.target.value)})}
                />
            </div>
          </div>

          {/* Generate Button */}
          {(status === 'running' || status === 'queued') ? (
            <div className="mt-4 space-y-2">
              <div className="w-full bg-surface-light rounded-full h-2">
                <div className="bg-primary h-full animate-pulse w-full" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-primary text-sm">{status === 'queued' ? 'Queued...' : 'Rendering...'}</span>
                <button onClick={cancelJob} className="text-xs text-red-400">Cancel</button>
              </div>
            </div>
          ) : (
            <button 
              className={`w-full mt-4 flex items-center justify-center py-3 text-lg font-semibold rounded-lg transition-all ${
                files.length === 0 
                  ? 'bg-surface-light text-text-muted cursor-not-allowed' 
                  : 'bg-primary hover:bg-primary-dark text-white'
              }`}
              onClick={startJob}
              disabled={files.length === 0}
            >
              <Play className="mr-2" fill="currentColor" size={20} />
              {t('generate.btn_generate') || 'Generate 4 Videos'}
            </button>
          )}

          {status === 'done' && (
            <div className="mt-4 bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-lg text-center text-sm">
              Success! <button onClick={() => navigate('/outputs')} className="underline font-bold">View outputs</button>
            </div>
          )}
          {status === 'error' && (
            <div className="mt-4 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-center text-sm">
              {errorMessage || 'Error occurred'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Generate;
