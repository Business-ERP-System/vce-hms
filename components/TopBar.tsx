
import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Settings, User, ChevronDown, Command, Coins, LogOut, Shield, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { UserRole } from '../types';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

interface TopBarProps {
  sidebarOpen: boolean;
  onOpenCommandPalette: () => void;
  autoHide?: boolean;
  onToggleMobileMenu?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({
  sidebarOpen,
  onOpenCommandPalette,
  autoHide = false,
  onToggleMobileMenu
}) => {
  const { currentUser, role, switchRole, logout } = useAuth();
  const { currency, toggleCurrency } = useData();
  const navigate = useNavigate();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRoleSwitch = (newRole: UserRole) => {
    switchRole(newRole);
    setIsProfileOpen(false);
    navigate('/');
  };

  return (
    <div
      className={`fixed top-0 right-0 h-14 bg-white/80 backdrop-blur-2xl border-b border-slate-200/50 z-30 flex items-center justify-between px-3 sm:px-6 md:px-8 lg:px-10 transition-all duration-300 print:hidden ${autoHide
        ? 'left-0'
        : (sidebarOpen ? 'left-0 md:left-[88px] lg:left-[280px]' : 'left-0 md:left-[88px]')
        }`}
    >
      <div className="flex items-center gap-2 sm:gap-4 md:gap-6 flex-1 min-w-0 mr-4">
        {/* Mobile Hamburger Menu Button */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="p-1.5 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl md:hidden transition-all flex-shrink-0 cursor-pointer"
          title="Open Navigation Menu"
        >
          <Menu size={20} />
        </button>

        {/* Global Search / Command Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 sm:gap-3 w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl px-3 sm:px-4 py-1.5 bg-slate-100/50 border border-slate-200/80 rounded-[1rem] text-slate-400 hover:bg-white hover:border-teal-400 hover:shadow-[0_12px_24px_-8px_rgba(20,184,166,0.15)] hover:text-teal-700 transition-all group flex-shrink-0"
        >
          <Search className="w-4 h-4 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-bold tracking-tight truncate">Search anything...</span>
          <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
            <kbd className="hidden sm:inline-flex items-center h-5 px-1.5 sm:px-2 text-[10px] sm:text-xs font-black bg-white border border-slate-200 rounded-lg text-slate-400 shadow-sm">⌘ K</kbd>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          {/* Currency Toggle */}
          <button
            onClick={toggleCurrency}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-100 rounded-xl text-xs font-black text-slate-700 hover:bg-slate-50 transition-all shadow-sm uppercase tracking-widest"
            title="Switch Currency"
          >
            <Coins size={14} className="text-amber-500" />
            {currency}
          </button>

          <button className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all relative group">
            <Bell className="w-5 h-5 group-hover:shake" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white animate-pulse"></span>
          </button>
        </div>

        <div className="h-6 w-px bg-slate-200 mx-1"></div>

        {/* Profile & Role Switcher */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-1 pr-3 rounded-xl transition-all border ${isProfileOpen ? 'bg-slate-50 border-slate-200 shadow-inner' : 'border-transparent'}`}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg flex items-center justify-center text-teal-400 text-sm font-bold shadow-md border border-white/10">
              {currentUser.charAt(0)}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-black text-slate-900 leading-tight uppercase tracking-tighter">{currentUser}</p>
              <div className="flex items-center gap-1 text-xs font-black text-teal-600 uppercase tracking-[0.2em]">
                {role} <ChevronDown size={10} className={`transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
              </div>
            </div>
          </button>

          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-full right-0 mt-3 w-72 bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 py-4 z-50 overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50 mb-2">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Active Identity</p>
                  <div className="flex items-center gap-2">
                    <Shield size={14} className="text-teal-500" />
                    <p className="text-sm font-black text-slate-900 uppercase tracking-tighter">{role}</p>
                  </div>
                </div>
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar px-2">
                  {Object.values(UserRole).map((r) => (
                    <button
                      key={r}
                      onClick={() => handleRoleSwitch(r)}
                      className={`w-full text-left px-4 py-3 rounded-2xl text-sm hover:bg-slate-50 transition-all flex items-center justify-between group ${role === r ? 'bg-teal-50/50' : ''}`}
                    >
                      <div className="flex flex-col">
                        <span className={`font-black text-xs uppercase tracking-tight ${role === r ? 'text-teal-700' : 'text-slate-600'}`}>{r}</span>
                        <span className="text-xs text-slate-400 group-hover:text-slate-500 font-bold uppercase tracking-widest">Switch Profile</span>
                      </div>
                      {role === r && <div className="w-2 h-2 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.5)]"></div>}
                    </button>
                  ))}
                </div>

                <div className="border-t border-slate-50 mt-4 pt-4 px-4">
                  <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-2xl transition-all text-xs font-black uppercase tracking-widest"
                  >
                    <LogOut size={16} /> Terminate Session
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
