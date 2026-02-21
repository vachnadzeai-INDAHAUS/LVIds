import React, { useCallback, useEffect, useState } from 'react';
import { Download, Archive, Youtube, Instagram, Facebook, Video, Film, Trash2 } from 'lucide-react';
import { useLanguage } from '../i18n/useLanguage';

interface Job {
  jobId: string;
  propertyId: string;
  status: string;
  createdAt: number;
  filesCount: number;
  hasZip: boolean;
}

interface JobDetails {
  jobId: string;
  propertyId?: string;
  status: string;
  error?: string;
  zipFile?: string;
  files?: string[];
}

const Outputs: React.FC = () => {
  const { t } = useLanguage();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedJobDetails, setSelectedJobDetails] = useState<JobDetails | null>(null);
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'done':
        return t('outputs.status_done');
      case 'error':
        return t('outputs.status_error');
      case 'queued':
        return t('outputs.status_queued');
      case 'running':
        return t('outputs.status_rendering');
      case 'canceled':
        return t('outputs.status_canceled');
      default:
        return status;
    }
  };

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/jobs');
      const data = (await res.json()) as Job[];
      setJobs(data);
      setSelectedJobId((current) => current ?? data[0]?.jobId ?? null);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleDeleteFile = useCallback(async (file: string) => {
    if (!selectedJobId) return;
    try {
      await fetch(`/api/jobs/${selectedJobId}/files/${encodeURIComponent(file)}`, { method: 'DELETE' });
      setSelectedJobDetails((current) => {
        if (!current) return current;
        return {
          ...current,
          files: (current.files || []).filter(item => item !== file),
          zipFile: undefined
        };
      });
      fetchJobs();
    } catch (e) {
      console.error(e);
    }
  }, [selectedJobId, fetchJobs]);

  useEffect(() => {
    if (selectedJobId) {
      fetch(`/api/jobs/${selectedJobId}`)
        .then(res => res.json())
        .then(data => setSelectedJobDetails(data as JobDetails))
        .catch(err => console.error(err));
    }
  }, [selectedJobId]);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  const getIconForFile = (filename: string) => {
    // 9x16 -> TikTok
    if (filename.includes('9x16')) {
        return (
            <div className="flex flex-col items-center">
                <div className="text-[#F97316] mb-1">
                    <Video size={24} />
                </div>
                <span className="text-xs font-bold text-white">TikTok</span>
            </div>
        );
    }
    // 1x1 -> Instagram
    if (filename.includes('1x1')) {
        return (
            <div className="flex flex-col items-center">
                <div className="text-[#F97316] mb-1">
                    <Instagram size={24} />
                </div>
                <span className="text-xs font-bold text-white">Instagram</span>
            </div>
        );
    }
    // 4x5 -> Facebook
    if (filename.includes('4x5')) {
        return (
            <div className="flex flex-col items-center">
                <div className="text-[#F97316] mb-1">
                    <Facebook size={24} />
                </div>
                <span className="text-xs font-bold text-white">Facebook</span>
            </div>
        );
    }
    // 16x9 -> YouTube
    if (filename.includes('16x9')) {
        return (
            <div className="flex flex-col items-center">
                <div className="text-[#F97316] mb-1">
                    <Youtube size={24} />
                </div>
                <span className="text-xs font-bold text-white">YouTube</span>
            </div>
        );
    }
    return <Film size={24} />;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-8rem)]">
      {/* Sidebar List */}
      <div className="lg:col-span-4 flex flex-col h-full card p-0 overflow-hidden">
        <div className="p-4 border-b border-[#374151] bg-[#111827]">
          <h2 className="text-lg font-semibold text-[#E5E7EB]">{t('outputs.title')}</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {jobs.length === 0 ? (
            <div className="p-8 text-center text-[#9CA3AF]">{t('outputs.no_runs')}</div>
          ) : (
            jobs.map(job => (
              <div 
                key={job.jobId}
                onClick={() => setSelectedJobId(job.jobId)}
                className={`p-4 border-b border-[#374151] cursor-pointer hover:bg-[#1F2937] transition-colors ${selectedJobId === job.jobId ? 'bg-[#1F2937] border-l-4 border-l-[#F97316]' : 'border-l-4 border-l-transparent'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-[#E5E7EB]">{job.propertyId || t('outputs.untitled')}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    job.status === 'done' ? 'bg-green-500/20 text-green-400' :
                    job.status === 'error' ? 'bg-red-500/20 text-red-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {getStatusLabel(job.status)}
                  </span>
                </div>
                <div className="text-xs text-[#9CA3AF]">
                  {new Date(job.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Details Panel */}
      <div className="lg:col-span-8 h-full flex flex-col">
        {selectedJobDetails ? (
          <div className="space-y-6 h-full overflow-y-auto pr-2">
            {/* Header */}
            <div className="card flex justify-between items-center">
               <div>
                 <h2 className="text-2xl font-bold text-[#E5E7EB]">{selectedJobDetails.propertyId || selectedJobDetails.jobId}</h2>
                 <p className="text-[#9CA3AF] text-sm mt-1">{t('outputs.status_label')} {getStatusLabel(selectedJobDetails.status)}</p>
                 {selectedJobDetails.error && (
                   <p className="text-red-400 text-sm mt-1">{selectedJobDetails.error}</p>
                 )}
               </div>
               {selectedJobDetails.zipFile && (
                 <a 
                   href={`/api/jobs/${selectedJobId}/download/${selectedJobDetails.zipFile}`}
                   className="btn bg-[#F97316] hover:bg-[#EA580C] text-white flex items-center"
                 >
                   <Archive className="mr-2" size={18} />
                   {t('outputs.btn_download_zip')}
                 </a>
               )}
            </div>

            {/* Videos Grid */}
            {selectedJobDetails.files && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full">
                {selectedJobDetails.files.map((file: string) => (
                  <div key={file} className="bg-[#1F2937] border border-[#374151] rounded-lg p-4 flex flex-col h-[400px] relative overflow-hidden group">
                    <button
                      type="button"
                      onClick={() => handleDeleteFile(file)}
                      className="absolute top-3 right-3 z-20 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5"
                      aria-label={t('outputs.btn_delete')}
                    >
                      <Trash2 size={14} />
                    </button>
                    <div className="flex justify-center items-start z-10 mb-4 bg-[#111827] p-2 rounded-lg w-full">
                        {getIconForFile(file)}
                    </div>
                    
                    {/* Middle: Video Preview */}
                    <div className="flex-1 relative bg-black rounded border border-[#374151] overflow-hidden mb-4">
                        <video 
                            controls 
                            className="w-full h-full object-contain"
                            src={`/api/jobs/${selectedJobId}/download/${file}`} 
                        />
                    </div>

                    {/* Bottom: Download */}
                    <div className="z-30 mt-auto">
                      <a 
                        href={`/api/jobs/${selectedJobId}/download/${file}`}
                        className="w-full flex items-center justify-center bg-[#374151] hover:bg-[#4B5563] text-white text-sm py-3 rounded transition-colors border border-[#4B5563]"
                      >
                        <Download size={16} className="mr-2" /> {t('outputs.btn_download')}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-[#9CA3AF]">
            {t('outputs.select_job')}
          </div>
        )}
      </div>
    </div>
  );
};

export default Outputs;
