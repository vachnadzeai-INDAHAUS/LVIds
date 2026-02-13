import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Video, List, HelpCircle, Globe } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

const Layout: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#111827] border-b border-[#243042] z-50 flex items-center px-6">
        <div className="max-w-7xl w-full mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2 text-[#3B82F6]">
            <Video size={24} />
            <span className="text-xl font-bold tracking-tight text-white">{t('nav.brand')}</span>
          </div>
          
          <div className="flex items-center space-x-6">
            <nav className="flex space-x-6">
              <NavLink 
                to="/" 
                className={({ isActive }) => 
                  `flex items-center space-x-2 text-sm font-medium transition-colors ${isActive ? 'text-[#3B82F6]' : 'text-[#9CA3AF] hover:text-[#E5E7EB]'}`
                }
              >
                <Video size={18} />
                <span>{t('nav.generate')}</span>
              </NavLink>
              <NavLink 
                to="/outputs" 
                className={({ isActive }) => 
                  `flex items-center space-x-2 text-sm font-medium transition-colors ${isActive ? 'text-[#3B82F6]' : 'text-[#9CA3AF] hover:text-[#E5E7EB]'}`
                }
              >
                <List size={18} />
                <span>{t('nav.outputs')}</span>
              </NavLink>
              <NavLink 
                to="/help" 
                className={({ isActive }) => 
                  `flex items-center space-x-2 text-sm font-medium transition-colors ${isActive ? 'text-[#3B82F6]' : 'text-[#9CA3AF] hover:text-[#E5E7EB]'}`
                }
              >
                <HelpCircle size={18} />
                <span>{t('nav.help')}</span>
              </NavLink>
            </nav>

            <div className="h-6 w-px bg-[#243042]" />

            <div className="flex items-center space-x-2">
              <Globe size={16} className="text-[#9CA3AF]" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'en' | 'ka')}
                className="bg-[#1F2937] text-sm text-[#E5E7EB] border border-[#374151] rounded px-2 py-1 focus:outline-none focus:border-[#3B82F6]"
              >
                <option value="en">English</option>
                <option value="ka">ქართული</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mt-16 p-6">
        <div className="max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
