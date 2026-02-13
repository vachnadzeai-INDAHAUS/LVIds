import React, { useState, useEffect } from 'react';
import { Upload, X, Play, Clock, Film, Settings as SettingsIcon, Youtube, Instagram, Facebook, Video, Music, Download, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

interface JobSettings {
  fps: number;
  secondsPerImage: number;
  transition: string;
  propertyId: string;
}

const TRANSITIONS = [
  { value: 'cut', labelKey: 'transition_cut' },
  { value: 'fade', labelKey: 'transition_fade' },
  { value: 'slide_left', labelKey: 'transition_slide_left' },
  { value: 'slide_right', labelKey: 'transition_slide_right' },
  { value: 'slide_up', labelKey: 'transition_slide_up' },
  { value: 'slide_down', labelKey: 'transition_slide_down' },
  { value: 'zoom_in', labelKey: 'transition_zoom_in' },
  { value: 'zoom_out', labelKey: 'transition_zoom_out' },
  { value: 'wipe_left', labelKey: 'transition_wipe_left' },
  { value: 'wipe_right', labelKey: 'transition_wipe_right' },
  { value: 'wipe_up', labelKey: 'transition_wipe_up' },
  { value: 'wipe_down', labelKey: 'transition_wipe_down' },
  { value: 'pixelate', labelKey: 'transition_pixelate' },
  { value: 'ripple', labelKey: 'transition_ripple' },
  { value: 'page_curl', labelKey: 'transition_page_curl' },
  { value: 'circle_open', labelKey: 'transition_circle_open' },
  { value: 'circle_close', labelKey: 'transition_circle_close' },
  { value: 'spin_in', labelKey: 'transition_spin_in' },
  { value: 'spin_out', labelKey: 'transition_spin_out' },
  { value: 'fly_in', labelKey: 'transition_fly_in' },
  { value: 'fly_out', labelKey: 'transition_fly_out' },
];

const Generate: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [files, setFiles] = useState<File[]>([]);
  const [settings, setSettings] = useState<JobSettings>({
    fps: 30,
    secondsPerImage: 3.2,
    transition: 'cut',
    propertyId: ''
  });
  const [transitionDuration, setTransitionDuration] = useState(0.8);
  const [isAutoDuration, setIsAutoDuration] = useState(false);
  const [isMusicEnabled, setIsMusicEnabled] = useState(false);
  const [musicVolume, setMusicVolume] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [musicFile, setMusicFile] = useState<File | null>(null);

  const handleMusicSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMusicFile(e.target.files[0]);
    }
  };

  const clearMusic = () => {
    setMusicFile(null);
  };
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('idle');
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [resultFiles, setResultFiles] = useState<string[]>([]);
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Polling for job status
  useEffect(() => {
    let interval: any;
    if (jobId && (status === 'queued' || status === 'running')) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/jobs/${jobId}`);
          if (res.ok) {
            const data = await res.json();
            
            // Only update status if it changed to avoid loops
            if (data.status !== status) {
                setStatus(data.status);
            }
            
            if (data.error) {
                setErrorMessage(data.error);
            }
            if (data.progress) {
              setProgress(data.progress);
            }
            if (data.status === 'done') {
              setResultFiles(data.files || []);
              // Set all progress to 100 on done
              setProgress({
                '9x16': 100,
                '1x1': 100,
                '4x5': 100,
                '16x9': 100
              });
              // Clear interval immediately
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles: File[]) => {
    // Filter images
    const images = newFiles.filter(f => f.type.startsWith('image/'));
    setFiles(prev => [...prev, ...images]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const startJob = async () => {
    if (files.length === 0) {
        console.warn("No files selected, cannot start job.");
        return;
    }
    
    // Reset states
    setStatus('queued');
    setErrorMessage(null);
    setProgress({});
    setResultFiles([]);
    
    console.log("Starting job with files:", files.length);
    const formData = new FormData();
    files.forEach(f => formData.append('images', f));
    formData.append('propertyId', settings.propertyId || `job_${Date.now()}`);
    if (isMusicEnabled && musicFile) {
      formData.append('music', musicFile);
    }
    formData.append('settings', JSON.stringify({
      fps: settings.fps,
      secondsPerImage: settings.secondsPerImage,
      transition: settings.transition,
      musicVolume: isMusicEnabled ? musicVolume / 100 : 0,
      transitionDuration: transitionDuration
    }));

    try {
      setStatus('queued');
      const res = await fetch('/api/generate', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setJobId(data.jobId);
      } else {
        setStatus('error');
        console.error('Failed to start job');
      }
    } catch (e) {
      setStatus('error');
      console.error(e);
    }
  };

  const cancelJob = async () => {
    if (!jobId) return;
    await fetch(`/api/jobs/${jobId}/cancel`, { method: 'POST' });
    setStatus('canceled');
  };

  const getIconForFormat = (fmt: string) => {
    switch(fmt) {
      case '9x16': return <div className="flex space-x-1"><Youtube size={16} /><Instagram size={16} /><Video size={16} /><Facebook size={16} /></div>;
      case '1x1': return <div className="flex space-x-1"><Youtube size={16} /><Instagram size={16} /><Video size={16} /><Facebook size={16} /></div>;
      case '4x5': return <div className="flex space-x-1"><Youtube size={16} /><Instagram size={16} /><Video size={16} /><Facebook size={16} /></div>;
      case '16x9': return <div className="flex space-x-1"><Youtube size={16} /><Instagram size={16} /><Video size={16} /><Facebook size={16} /></div>;
      default: return <Film size={16} />;
    }
  };

  const getFormatLabel = (fmt: string) => {
    switch(fmt) {
      case '9x16': return 'Shorts / Reels';
      case '1x1': return 'Post (Square)';
      case '4x5': return 'Post (Portrait)';
      case '16x9': return 'Landscape';
      default: return fmt;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: Inputs & Progress Cards */}
      <div className="lg:col-span-7 space-y-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 flex items-center text-[#E5E7EB]">
            <Upload className="mr-2" size={20} />
            {t('generate.input_images')}
          </h2>
          
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging ? 'border-[#F97316] bg-[#F97316]/10' : 'border-[#374151] hover:border-[#F97316]'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              className="hidden" 
              id="file-upload"
              onChange={handleFileSelect}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="flex flex-col items-center">
                <Upload size={40} className="text-[#9CA3AF] mb-3" />
                <p className="text-lg font-medium text-[#E5E7EB]">{t('generate.drag_drop')}</p>
                <p className="text-sm text-[#9CA3AF] mt-1">{t('generate.click_browse')}</p>
              </div>
            </label>
          </div>

          {files.length > 0 && (
            <div className="mt-6 grid grid-cols-4 sm:grid-cols-5 gap-4">
              {files.map((file, i) => (
                <div key={i} className="relative group aspect-square bg-black rounded overflow-hidden border border-[#374151]">
                  <img 
                    src={URL.createObjectURL(file)} 
                    alt={file.name} 
                    className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                  />
                  <button 
                    onClick={() => removeFile(i)}
                    className="absolute top-1 right-1 bg-red-500/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 text-sm text-[#9CA3AF]">
            {t('generate.images_selected', { count: files.length })}
          </div>
        </div>

        {/* Live Progress Cards */}
        {(status === 'running' || status === 'queued' || status === 'done') && (
          <div className="grid grid-cols-2 gap-4">
            {['9x16', '1x1', '4x5', '16x9'].map((fmt) => {
              const pct = progress[fmt] || 0;
              const isDone = pct === 100;
              const isProcessing = pct > 0 && pct < 100;
              const file = resultFiles.find(f => f.includes(fmt));
              
              return (
                <div key={fmt} className="bg-[#1F2937] border border-[#374151] rounded-lg p-4 flex flex-col justify-between h-[300px] relative overflow-hidden">
                  {/* Top: Logo & Label */}
                  <div className="flex justify-between items-start z-10">
                    <div className="text-[#F97316]">
                      {getIconForFormat(fmt)}
                    </div>
                    <span className="text-xs font-bold text-[#9CA3AF] bg-[#111827] px-2 py-1 rounded">
                      {fmt}
                    </span>
                  </div>
                  
                  <div className="z-10 mt-2">
                    <h3 className="text-white font-medium text-sm">{getFormatLabel(fmt)}</h3>
                  </div>

                  {/* Middle: Progress */}
                  <div className="flex-1 flex flex-col justify-center z-10 px-2 h-full">
                    {status === 'queued' && pct === 0 ? (
                      <div className="text-[#9CA3AF] text-xs flex items-center justify-center">
                        <Clock size={12} className="mr-1" /> Queued...
                      </div>
                    ) : isDone && file ? (
                      <div className="relative w-full h-full bg-black rounded overflow-hidden group">
                        <video 
                           controls 
                           className="w-full h-full object-contain"
                           src={`/api/jobs/${jobId}/download/${file}`} 
                        />
                      </div>
                    ) : (
                      <div className="w-full text-center">
                        <div className="text-3xl font-bold text-white mb-2">{pct}%</div>
                        <div className="w-full bg-[#111827] rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${isDone ? 'bg-green-500' : 'bg-[#F97316]'}`} 
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom: Download */}
                  <div className="z-10 mt-2">
                    {isDone && file ? (
                      <a 
                        href={`/api/jobs/${jobId}/download/${file}`}
                        className="w-full flex items-center justify-center bg-[#374151] hover:bg-[#4B5563] text-white text-xs py-2 rounded transition-colors"
                      >
                        <Download size={14} className="mr-1" /> Download
                      </a>
                    ) : (
                      <div className="h-8" /> // Spacer
                    )}
                  </div>
                  
                  {/* Background Pulse for active */}
                  {isProcessing && (
                    <div className="absolute inset-0 bg-[#F97316]/5 animate-pulse z-0" />
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {status === 'done' && (
           <div className="flex justify-center">
             <button onClick={() => { setStatus('idle'); setFiles([]); setJobId(null); }} className="text-[#9CA3AF] hover:text-white underline text-sm">
               Start New Generation
             </button>
           </div>
        )}
      </div>

      {/* Right: Settings & Control */}
      <div className="lg:col-span-5 space-y-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 flex items-center text-[#E5E7EB]">
            <SettingsIcon className="mr-2" size={20} />
            {t('generate.settings')}
          </h2>

          {/* Social Presets */}
          <div className="mb-6">
            <label className="label mb-2 block">{t('generate.presets')}</label>
            <div className="grid grid-cols-4 gap-2">
              <button className="flex flex-col items-center justify-center p-2 bg-[#1F2937] border border-[#374151] rounded hover:border-[#F97316] transition-colors" title="YouTube Shorts (9:16)">
                <Youtube size={20} className="text-red-500 mb-1" />
                <span className="text-[10px] text-[#9CA3AF]">Shorts</span>
              </button>
              <button className="flex flex-col items-center justify-center p-2 bg-[#1F2937] border border-[#374151] rounded hover:border-[#F97316] transition-colors" title="Instagram Reels (9:16)">
                <Instagram size={20} className="text-pink-500 mb-1" />
                <span className="text-[10px] text-[#9CA3AF]">Reels</span>
              </button>
              <button className="flex flex-col items-center justify-center p-2 bg-[#1F2937] border border-[#374151] rounded hover:border-[#F97316] transition-colors" title="TikTok (9:16)">
                <Video size={20} className="text-cyan-400 mb-1" />
                <span className="text-[10px] text-[#9CA3AF]">TikTok</span>
              </button>
              <button className="flex flex-col items-center justify-center p-2 bg-[#1F2937] border border-[#374151] rounded hover:border-[#F97316] transition-colors" title="Facebook (4:5 / 1:1)">
                <Facebook size={20} className="text-blue-500 mb-1" />
                <span className="text-[10px] text-[#9CA3AF]">Facebook</span>
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="label">{t('generate.property_id')}</label>
              <input 
                type="text" 
                className="input" 
                placeholder={t('generate.property_id_placeholder')}
                value={settings.propertyId}
                onChange={e => setSettings({...settings, propertyId: e.target.value})}
              />
            </div>

            <div>
               <div className="flex justify-between items-center mb-2">
                 <label className="label mb-0">{t('generate.duration')}</label>
               </div>
               
               <div className="flex items-center space-x-3">
                   <input 
                     type="range"
                     min="1"
                     max="5"
                     step="1"
                     className="w-full h-2 bg-[#374151] rounded-lg appearance-none cursor-pointer accent-[#F97316]"
                     value={settings.secondsPerImage}
                     onChange={e => setSettings({...settings, secondsPerImage: parseInt(e.target.value)})}
                   />
                   <div className="flex items-center bg-[#0B0F17] border border-[#374151] rounded px-2 w-12">
                      <span className="w-full bg-transparent py-1 text-[#E5E7EB] text-center text-sm">{settings.secondsPerImage}s</span>
                   </div>
               </div>
            </div>

            <div>
              <label className="label">{t('generate.transition_duration') || "Transition Duration (s)"}</label>
              <div className="flex items-center space-x-3">
                 <input 
                   type="range"
                   min="0.2"
                   max="2.0"
                   step="0.1"
                   className="w-full h-2 bg-[#374151] rounded-lg appearance-none cursor-pointer accent-[#F97316]"
                   value={transitionDuration}
                   onChange={e => setTransitionDuration(parseFloat(e.target.value))}
                 />
                 <div className="flex items-center bg-[#0B0F17] border border-[#374151] rounded px-2 w-12">
                    <span className="w-full bg-transparent py-1 text-[#E5E7EB] text-center text-sm">{transitionDuration}s</span>
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="label">{t('generate.fps')}</label>
                <div className="flex items-center bg-[#0B0F17] border border-[#374151] rounded px-3">
                  <Film size={16} className="text-[#9CA3AF] mr-2" />
                  <input 
                    type="number" 
                    className="w-full bg-transparent py-2 text-[#E5E7EB] outline-none"
                    value={settings.fps}
                    onChange={e => setSettings({...settings, fps: parseInt(e.target.value)})}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="label">{t('generate.transition')}</label>
              <select 
                className="w-full bg-[#0B0F17] border border-[#374151] rounded px-3 py-2 text-[#E5E7EB] outline-none focus:border-[#F97316]"
                value={settings.transition}
                onChange={e => setSettings({...settings, transition: e.target.value})}
              >
                {TRANSITIONS.map(tr => (
                  <option key={tr.value} value={tr.value}>
                    {t(`generate.${tr.labelKey}`)}
                  </option>
                ))}
              </select>
            </div>

            {/* Music Section */}
            <div>
              <div className="flex justify-between items-center mb-2">
                 <label className="label mb-0">{t('generate.music_label') || "Music"}</label>
                 <button 
                   className={`w-10 h-5 rounded-full relative transition-colors ${isMusicEnabled ? 'bg-[#F97316]' : 'bg-[#374151]'}`}
                   onClick={() => setIsMusicEnabled(!isMusicEnabled)}
                 >
                   <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isMusicEnabled ? 'left-6' : 'left-1'}`} />
                 </button>
              </div>

              {isMusicEnabled && (
                <>
                  <div className="bg-[#0B0F17] border border-[#374151] rounded p-4 text-center mb-2">
                     {musicFile ? (
                       <div className="flex flex-col items-center justify-center space-y-2">
                         <div className="flex items-center space-x-2 text-[#F97316]">
                           <Music size={24} />
                           <span className="text-sm font-medium truncate max-w-[200px]">{musicFile.name}</span>
                         </div>
                         <button 
                           onClick={clearMusic}
                           className="text-xs text-red-400 hover:text-red-300 underline"
                         >
                           Remove
                         </button>
                       </div>
                     ) : (
                       <div className="flex flex-col items-center justify-center space-y-2">
                         <Music size={24} className="text-[#9CA3AF]" />
                         <label className="cursor-pointer">
                           <span className="text-sm text-[#F97316] hover:text-[#EA580C] underline">Select Music File</span>
                           <input 
                             type="file" 
                             accept="audio/*" 
                             className="hidden" 
                             onChange={handleMusicSelect}
                           />
                         </label>
                         <p className="text-xs text-[#9CA3AF]">(MP3, WAV)</p>
                       </div>
                     )}
                  </div>
                  
                  <div className="flex items-center space-x-3">
                     <span className="text-xs text-[#9CA3AF] w-12">{t('generate.music_volume') || "Volume"}</span>
                     <input 
                       type="range"
                       min="0"
                       max="100"
                       step="1"
                       className="w-full h-2 bg-[#374151] rounded-lg appearance-none cursor-pointer accent-[#F97316]"
                       value={musicVolume}
                       onChange={e => setMusicVolume(parseInt(e.target.value))}
                     />
                     <span className="text-xs text-[#E5E7EB] w-8 text-right">{musicVolume}%</span>
                  </div>
                </>
              )}
            </div>
            
            <div className="pt-4 border-t border-[#374151]">
               <div className="flex justify-between text-sm mb-2">
                 <span className="text-[#9CA3AF]">{t('generate.estimated_duration')}</span>
                 <span className="text-[#E5E7EB] font-medium">
                   {(files.length * settings.secondsPerImage).toFixed(1)}s
                 </span>
               </div>
            </div>

            {status === 'running' || status === 'queued' ? (
              <div className="space-y-3">
                 <div className="w-full bg-[#374151] rounded-full h-2 overflow-hidden">
                   <div className="bg-[#F97316] h-full animate-pulse w-full origin-left"></div>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[#F97316] text-sm font-medium animate-pulse">
                      {status === 'queued' ? t('generate.status_queued') : t('generate.status_rendering')}
                    </span>
                    <button onClick={cancelJob} className="text-xs text-red-400 hover:text-red-300">
                      {t('generate.btn_cancel')}
                    </button>
                 </div>
              </div>
            ) : (
              <button 
                className="w-full btn bg-[#F97316] hover:bg-[#EA580C] text-white flex items-center justify-center py-3 text-lg font-semibold rounded transition-all"
                onClick={startJob}
                disabled={files.length === 0}
                style={{ pointerEvents: 'auto', cursor: 'pointer' }}
              >
                <Play className="mr-2" fill="currentColor" size={20} />
                {t('generate.btn_generate')}
              </button>
            )}
            
            {status === 'done' && (
               <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded text-center">
                 {t('generate.status_success')} <button onClick={() => navigate('/outputs')} className="underline font-bold">{t('generate.btn_view_outputs')}</button>
               </div>
            )}
            {status === 'error' && (
               <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded text-center">
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
