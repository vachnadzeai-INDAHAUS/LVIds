import React from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useLanguage } from '../i18n/useLanguage';

const Help: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">{t('help.title')}</h1>
        <p className="text-[#9CA3AF]">{t('help.description')}</p>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
          <CheckCircle className="mr-2 text-green-400" />
          {t('help.quick_start')}
        </h2>
        <ol className="list-decimal list-inside space-y-3 text-[#E5E7EB]">
          <li>{t('help.step_1')}</li>
          <li>{t('help.step_2')}</li>
          <li>{t('help.step_3')}</li>
          <li>{t('help.step_4')}</li>
          <li>{t('help.step_5')}</li>
          <li>{t('help.step_6')}</li>
          <li>{t('help.step_7')}</li>
        </ol>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
          <Info className="mr-2 text-blue-400" />
          {t('help.formats_title')}
        </h2>
        <p className="text-[#9CA3AF] mb-4">
          {t('help.formats_desc')}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: '9:16', res: '1080x1920' },
            { label: '1:1', res: '1080x1080' },
            { label: '4:5', res: '1080x1350' },
            { label: '16:9', res: '1920x1080' },
          ].map((fmt) => (
            <div key={fmt.label} className="bg-[#0B0F17] p-3 rounded border border-[#243042] text-center">
              <div className="font-bold text-white">{fmt.label}</div>
              <div className="text-xs text-[#9CA3AF]">{fmt.res}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
          <AlertCircle className="mr-2 text-orange-400" />
          {t('help.troubleshooting')}
        </h2>
        <ul className="space-y-3 text-[#E5E7EB]">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>{t('help.ts_ffmpeg')}</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>{t('help.ts_python')}</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>{t('help.ts_stuck')}</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Help;
