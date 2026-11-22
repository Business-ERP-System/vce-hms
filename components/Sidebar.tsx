
import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { MENU_GROUPS, APP_NAME } from '../constants';
import { Eye, ChevronLeft, ChevronRight, LogOut, Shield, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { motion } from 'motion/react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  autoHide?: boolean;
  setAutoHide?: (autoHide: boolean) => void;
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  setIsOpen,
  autoHide = false,
  setAutoHide,
  mobileOpen = false,
  setMobileOpen
}) => {
  const { role, currentUser, logout } = useAuth();
  const { hasPermission } = useData();
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isAllowed = (name: string) => {
    return hasPermission(name, 'list') || hasPermission(name, 'view');
  };

  const handleMouseEnter = () => {
    if (isMobile) return;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (autoHide) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    if (autoHide) {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHovered(false);
      }, 180);
    }
  };

  useEffect(() => {
    if (!autoHide) {
      setIsHovered(false);
    }
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, [autoHide]);

  const isExpanded = isMobile ? true : (autoHide ? isHovered : isOpen);
  const isSlimEdge = !isMobile && !isExpanded && autoHide;

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen?.(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
        />
      )}

      <motion.div
        initial={false}
        animate={
          isMobile
            ? {
                x: mobileOpen ? 0 : -320,
                width: 280
              }
            : {
                x: 0,
                width: isExpanded ? 280 : (isSlimEdge ? 16 : 88)
              }
        }
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`bg-white/95 backdrop-blur-2xl text-slate-900 h-screen flex flex-col fixed left-0 top-0 z-50 border-r border-slate-200/60 overflow-x-hidden print:hidden ${
          isMobile
            ? 'shadow-2xl'
            : (isExpanded && autoHide
                ? 'shadow-2xl ring-1 ring-slate-900/10'
                : 'shadow-[0_4px_30px_rgba(0,0,0,0.03)]')
        }`}
      >
      {/* Slim Edge indicator when Auto Hide is active and collapsed to edge */}
      {isSlimEdge ? (
        <div className="h-full w-full flex flex-col items-center justify-between py-6 pointer-events-none select-none bg-teal-50/40">
          <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></div>
          <ChevronRight size={14} className="text-teal-600 animate-pulse" />
          <div className="w-1 h-8 rounded-full bg-teal-400/50"></div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="h-14 flex items-center justify-between px-3 bg-slate-50/60 border-b border-slate-100 flex-shrink-0 relative">
            <div className={`flex items-center gap-2.5 ${!isExpanded && 'justify-center w-full'}`}>
              <div
                className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center shadow-lg shadow-teal-500/20 cursor-pointer hover:scale-105 transition-transform flex-shrink-0"
                onClick={() => {
                  if (autoHide) {
                    setIsHovered(true);
                  } else if (!isOpen) {
                    setIsOpen(true);
                  }
                }}
              >
                <Eye className="w-5 h-5 text-white" />
              </div>
              {isExpanded && (
                <div className="flex flex-col min-w-0">
                  <span className="font-black text-sm tracking-tighter uppercase leading-none text-slate-900 truncate">{APP_NAME}</span>
                  <span className="text-[10px] font-black tracking-[0.2em] text-teal-600 uppercase mt-0.5 truncate">Enterprise ERP</span>
                </div>
              )}
            </div>

            {isMobile ? (
              <button
                type="button"
                onClick={() => setMobileOpen?.(false)}
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                title="Close Menu"
              >
                <X size={18} />
              </button>
            ) : isExpanded ? (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {setAutoHide && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAutoHide(!autoHide);
                    }}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all border cursor-pointer ${
                      autoHide
                        ? 'bg-teal-50 text-teal-700 border-teal-300 shadow-2xs ring-1 ring-teal-200'
                        : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                    title={autoHide ? "Auto Hide is ON (Hides when mouse leaves, opens when cursor goes to left side). Click to turn OFF." : "Click to enable Auto Hide (Automatically opens on hover)"}
                  >
                    <span className={`w-2 h-2 rounded-full ${autoHide ? 'bg-teal-500 animate-pulse' : 'bg-slate-300'}`}></span>
                    <span>Auto Hide</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(!isOpen)}
                  className="text-slate-400 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                  title={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                >
                  <ChevronLeft size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (autoHide) {
                    setAutoHide?.(false);
                    setIsOpen(true);
                  } else {
                    setIsOpen(!isOpen);
                  }
                }}
                className="absolute -right-3 top-8 bg-teal-500 text-white rounded-full p-1 shadow-xl hover:scale-110 z-[60] border-2 border-white cursor-pointer transition-all"
                title={autoHide ? "Auto Hide is ON (Hover to expand, or click to pin open)" : "Expand Sidebar"}
              >
                <ChevronRight size={12} />
              </button>
            )}
          </div>

          {/* Navigation Groups */}
          <div className="flex-1 overflow-y-auto py-6 px-3 space-y-6 custom-scrollbar">
            {MENU_GROUPS.map((group) => {
              const allowedGroupItems = group.items.filter(i => isAllowed(i.name));
              if (allowedGroupItems.length === 0) return null;

              return (
                <div key={group.group} className="space-y-2">
                  {isExpanded && (
                    <h4 className="px-3 text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                      {group.group}
                    </h4>
                  )}
                  <div className="space-y-1">
                    {allowedGroupItems.map((item) => (
                      <NavLink
                        key={item.name}
                        to={item.path}
                        onClick={() => {
                          if (isMobile) setMobileOpen?.(false);
                        }}
                        className={({ isActive }) => `
                          flex items-center gap-3 px-4 py-2.5 rounded-[1.2rem] transition-all duration-300 group relative
                          ${isActive
                            ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-[0_8px_16px_-4px_rgba(13,148,136,0.3)]'
                            : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-900'
                          }
                          ${!isExpanded && 'justify-center mx-1'}
                        `}
                        title={!isExpanded ? item.name : ''}
                      >
                        {({ isActive }) => (
                          <>
                            <item.icon className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                            {isExpanded && <span className="text-sm font-bold tracking-tight">{item.name}</span>}
                            {isActive && !isExpanded && (
                              <div className="absolute left-0 w-1 h-6 bg-teal-500 rounded-r-full"></div>
                            )}
                          </>
                        )}
                      </NavLink>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer: User Profile & Logout */}
          <div className="p-3 bg-slate-50/50 border-t border-slate-100 flex-shrink-0">
            {isExpanded ? (
              <>
                <div className="bg-white rounded-xl p-3 mb-3 border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 font-bold border border-teal-100 text-sm">
                      {currentUser.charAt(0)}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-xs font-bold text-slate-900 truncate">{currentUser}</span>
                      <div className="flex items-center gap-1">
                        <Shield size={10} className="text-teal-500" />
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest truncate">{role}</span>
                      </div>
                    </div>
                  </div>
                  <NavLink
                    to="/portal"
                    className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all text-xs font-black uppercase tracking-widest mb-2"
                  >
                    Patient Portal
                  </NavLink>
                  <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all text-xs font-black uppercase tracking-widest"
                  >
                    <LogOut size={12} />
                    Terminate
                  </button>
                </div>

                {/* Developer Info */}
                <div className="px-2 py-1 text-center">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-0.5">Developed by</p>
                  <p className="text-xs font-black text-teal-600/50 uppercase tracking-tighter mb-0.5">BUSINESS ERP SYSTEM</p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={logout}
                  className="w-10 h-10 flex items-center justify-center text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 font-black text-xs" title="BUSINESS ERP SYSTEM">
                  BE
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
    </>
  );
};

export default Sidebar;
