import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Video, Menu, HelpCircle, Globe } from 'lucide-react';
import { useLanguage } from '../../i18n/useLanguage';

const Layout: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#1F2937] border-b border-[#374151] z-50 flex items-center px-4">
        <div className="w-full flex justify-between items-center">
          {/* Left: Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-14 h-14 relative flex items-center justify-center">
               <img
                 src="/src/assets/logo-main.jpg"
                 alt="Lumina Vids Logo"
                 className="w-full h-full object-contain drop-shadow-lg rounded-lg"
               />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-lg font-black tracking-widest text-[#FF8A1F] drop-shadow-md font-['Oswald']">LUMINA</span>
              <span className="text-lg font-black tracking-widest text-[#FF8A1F] drop-shadow-md font-['Oswald']">VIDS</span>
            </div>
          </div>
          
          {/* Right: Navigation (Shifted to the right side as requested) */}
          <div className="flex items-center space-x-8 pr-4">
            <nav className="flex space-x-8">
              <NavLink 
                to="/" 
                className={({ isActive }) => 
                  `flex items-center space-x-2 text-sm font-medium transition-all hover:scale-105 text-[#FF8A1F] ${isActive ? 'drop-shadow-sm font-bold' : ''}`
                }
              >
                <Video size={18} className="text-[#FF8A1F]" />
                <span className="text-[#FF8A1F]">{t('nav.generate')}</span>
              </NavLink>
              <NavLink 
                to="/outputs" 
                className={({ isActive }) => 
                  `flex items-center space-x-2 text-sm font-medium transition-all hover:scale-105 text-[#FF8A1F] ${isActive ? 'drop-shadow-sm font-bold' : ''}`
                }
              >
                <Menu size={18} className="text-[#FF8A1F]" />
                <span className="text-[#FF8A1F]">{t('nav.outputs')}</span>
              </NavLink>
              <NavLink 
                to="/help" 
                className={({ isActive }) => 
                  `flex items-center space-x-2 text-sm font-medium transition-all hover:scale-105 text-[#FF8A1F] ${isActive ? 'drop-shadow-sm font-bold' : ''}`
                }
              >
                <HelpCircle size={18} className="text-[#FF8A1F]" />
                <span className="text-[#FF8A1F]">{t('nav.help')}</span>
              </NavLink>
            </nav>

            <div className="h-6 w-px bg-[#243042]" />

            <div className="flex items-center space-x-2 text-[#FF8A1F] transition-colors">
              <Globe size={16} />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'en' | 'ka' | 'ru')}
                className="bg-[#1F2937] text-sm text-[#FF8A1F] border border-[#374151] rounded px-2 py-1 focus:outline-none focus:border-[#FF8A1F] hover:border-[#FF8A1F]/50 transition-colors cursor-pointer"
              >
                <option value="en">English</option>
                <option value="ka">ქართული</option>
                <option value="ru">Русский</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mt-16 p-2">
        <div className="w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
