
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock, User, Eye, EyeOff, ShieldCheck,
  Activity, ArrowRight, Building2, Globe,
  Server, Database, HelpCircle, Languages,
  ChevronDown, CheckCircle2, AlertCircle, Download
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { UserRole } from '../types';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { branches } = useData();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [branch, setBranch] = useState(branches[0]?.name || 'Main Campus');
  const [language, setLanguage] = useState('English (US)');

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: UserRole.SUPER_ADMIN
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulated authentication logic
    setTimeout(() => {
      if (formData.username && formData.password) {
        login(formData.username, formData.role);
        navigate('/');
      } else {
        setError('Invalid credentials. Please verify your Employee ID and Security Key.');
        setIsLoading(false);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8 font-sans selection:bg-teal-500/30 selection:text-slate-900 overflow-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(20,184,166,0.1),_transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_100%,_rgba(59,130,246,0.1),_transparent_50%)]"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://picsum.photos/id/122/1920/1080')] bg-cover bg-center opacity-[0.03] grayscale"></div>
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[100px]"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[1040px] min-h-[640px] bg-white rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col md:flex-row relative z-10 border border-slate-200"
      >

        {/* Left Side: Immersive Branding */}
        <div className="md:w-[42%] p-10 md:p-14 flex flex-col justify-between relative overflow-hidden border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/50">
          <div className="relative z-10">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3 mb-14"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
                <Activity size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tighter text-slate-900 uppercase leading-none font-display">Visionary</h1>
                <p className="text-xs font-black tracking-[0.4em] uppercase text-teal-600 mt-1">HMS ERP System</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-4xl font-bold text-slate-900 leading-[1.15] mb-6 tracking-tight font-display">
                The Future of <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600">Clinical Intelligence.</span>
              </h2>
              <p className="text-slate-500 text-base font-medium leading-relaxed max-w-xs mb-10">
                A unified, secure, and intelligent ecosystem designed for modern healthcare excellence.
              </p>
            </motion.div>

            <div className="space-y-5">
              {[
                { icon: ShieldCheck, title: "Secure Infrastructure", desc: "End-to-end encrypted data protocols." },
                { icon: Database, title: "Unified Records", desc: "Real-time sync across all campuses." },
                { icon: Server, title: "High Availability", desc: "99.99% uptime for critical care." }
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.6 + (idx * 0.1) }}
                  className="flex items-start gap-4 group"
                >
                  <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-teal-600 group-hover:bg-teal-500 group-hover:text-white transition-all duration-300 shadow-sm">
                    <item.icon size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 font-display">{item.title}</h4>
                    <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="relative z-10 mt-12 pt-8 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?img=${i + 20}`} alt="User" />
                  </div>
                ))}
              </div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Trusted by <span className="text-slate-900">100+</span> Orgs
              </p>
            </div>
            <div className="flex gap-3">
              <a
                href="https://www.businesserpsystem.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-teal-600 transition-colors"
                title="Help Center"
              >
                <HelpCircle size={16} />
              </a>
              <a
                href="https://www.businesserpsystem.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-teal-600 transition-colors"
                title="Global Website"
              >
                <Globe size={16} />
              </a>
            </div>
          </div>
        </div>

        {/* Right Side: Sophisticated Login Form */}
        <div className="md:w-[58%] p-10 md:p-16 flex flex-col justify-center bg-white relative">
          <div className="max-w-[400px] mx-auto w-full">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-teal-50 border border-teal-100 rounded-full">
                <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-black text-teal-600 uppercase tracking-widest">System Operational</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 hover:text-slate-900 cursor-pointer transition-colors">
                <Languages size={14} />
                <span className="text-xs font-black uppercase tracking-widest">{language}</span>
                <ChevronDown size={12} />
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-2 uppercase font-display">Authorization</h3>
              <p className="text-slate-400 font-medium text-sm">Access your enterprise dashboard.</p>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-bold flex items-center gap-3"
                >
                  <AlertCircle size={18} />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Branch</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <select
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-xs focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all appearance-none cursor-pointer"
                      value={branch}
                      onChange={e => setBranch(e.target.value)}
                    >
                      {branches.map(b => (
                        <option key={b.id}>{b.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Profile</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <select
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-xs focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all appearance-none cursor-pointer"
                      value={formData.role}
                      onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                    >
                      {Object.values(UserRole).map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Employee ID</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" size={18} />
                  <input
                    required
                    type="text"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold placeholder:text-slate-300 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all text-sm"
                    placeholder="VIS-2026-001"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Security Key</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" size={18} />
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    className="w-full pl-11 pr-11 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold placeholder:text-slate-300 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all text-sm"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input type="checkbox" className="peer w-4.5 h-4.5 rounded-md border-slate-200 text-teal-600 focus:ring-teal-500/20 transition-all cursor-pointer appearance-none bg-slate-50 border" />
                    <CheckCircle2 className="absolute left-0.5 top-0.5 w-3.5 h-3.5 text-teal-600 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                  <span className="text-xs font-bold text-slate-500 group-hover:text-slate-900 transition-colors">Remember me</span>
                </label>
                <a href="#" className="text-xs font-bold text-teal-600 hover:text-teal-700 transition-colors">Forgot Key?</a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-4"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Authorize Access
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-slate-100">
              <button
                onClick={() => navigate('/portal')}
                className="w-full py-4 bg-white border-2 border-slate-900 border-dashed text-slate-900 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-slate-50 transition-all group"
              >
                <Download size={18} className="text-indigo-600 group-hover:scale-110 transition-transform" />
                Patient Portal: Download Reports
              </button>
              <p className="text-xs font-bold text-slate-400 text-center mt-3 uppercase tracking-widest">Access diagnostics with Patient ID & Invoice</p>
            </div>

            <div className="mt-10 flex flex-col items-center gap-2 text-center">
              <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Developed by</p>
              <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">BUSINESS ERP SYSTEM</p>
              <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                <span>+8801738658455</span>
                <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                <a href="https://www.businesserpsystem.com" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">www.businesserpsystem.com</a>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Footer Micro-details */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-10 hidden md:flex items-center gap-6 text-xs font-black text-slate-400 uppercase tracking-[0.4em]">
        <span className="flex items-center gap-2"><div className="w-1 h-1 bg-teal-500 rounded-full"></div> Visionary v4.2</span>
        <span className="opacity-20">|</span>
        <span className="hover:text-slate-900 cursor-pointer transition-colors">Support</span>
        <span className="opacity-20">|</span>
        <span className="hover:text-slate-900 cursor-pointer transition-colors">Infrastructure</span>
      </div>
    </div>
  );
};

export default Login;
