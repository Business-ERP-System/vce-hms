import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, ModuleControl, SubModuleControl, FeatureControl, Branch } from '../types';
import {
  ShieldCheck, Database, Layout, Settings, Activity,
  Globe, Lock, Power, ChevronRight, CheckCircle2,
  AlertTriangle, Save, RefreshCw, Key, Server,
  Cpu, Zap, Eye, EyeOff, Terminal, Command, Landmark,
  Shield, Check, X, Search, Filter, Plus, ArrowRight,
  HardDrive, Wifi, Sliders, Play, Pause, AlertCircle,
  Clock, ShieldAlert, Layers, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const INITIAL_MODULES: ModuleControl[] = [
  {
    id: 'MOD001',
    name: 'Clinical Operations',
    isEnabled: true,
    subModules: [
      {
        id: 'SUB001',
        name: 'OPD Management',
        isEnabled: true,
        features: [
          { id: 'FEAT001', name: 'Queue Management', isEnabled: true },
          { id: 'FEAT002', name: 'Digital Prescription', isEnabled: true },
          { id: 'FEAT003', name: 'Vitals & Refraction Tracking', isEnabled: true }
        ]
      },
      {
        id: 'SUB002',
        name: 'IPD & Bed Management',
        isEnabled: true,
        features: [
          { id: 'FEAT004', name: 'Ward & Cabin Allocation', isEnabled: true },
          { id: 'FEAT005', name: 'Nursing Clinical Notes', isEnabled: true }
        ]
      }
    ]
  },
  {
    id: 'MOD002',
    name: 'Diagnostic & Lab Suite',
    isEnabled: true,
    subModules: [
      {
        id: 'SUB003',
        name: 'Laboratory Information (LIS)',
        isEnabled: true,
        features: [
          { id: 'FEAT006', name: 'Barcode Sample Tracking', isEnabled: true },
          { id: 'FEAT007', name: 'Automated Diagnostic Verification', isEnabled: true }
        ]
      },
      {
        id: 'SUB004',
        name: 'Radiology & Ophthalmic Imaging',
        isEnabled: true,
        features: [
          { id: 'FEAT008', name: 'OCT Macular / Visual Field Uploads', isEnabled: true },
          { id: 'FEAT009', name: 'PACS Image Viewer Integration', isEnabled: true }
        ]
      }
    ]
  },
  {
    id: 'MOD003',
    name: 'Pharmacy & Retail Optical',
    isEnabled: true,
    subModules: [
      {
        id: 'SUB005',
        name: 'Pharmacy Point of Sale',
        isEnabled: true,
        features: [
          { id: 'FEAT010', name: 'Automated Reorder Alerts', isEnabled: true },
          { id: 'FEAT011', name: 'Batch Expiry & Serial Tracking', isEnabled: true }
        ]
      },
      {
        id: 'SUB006',
        name: 'Optical Lens Dispensary',
        isEnabled: true,
        features: [
          { id: 'FEAT012', name: 'Frame & Power Lens Pairing', isEnabled: true },
          { id: 'FEAT013', name: 'Custom Prescription Fitting', isEnabled: true }
        ]
      }
    ]
  },
  {
    id: 'MOD004',
    name: 'Financial Ledger & ERP',
    isEnabled: true,
    subModules: [
      {
        id: 'SUB007',
        name: 'Billing & POS Cashiering',
        isEnabled: true,
        features: [
          { id: 'FEAT014', name: 'Operating Currency (BDT ৳)', isEnabled: true },
          { id: 'FEAT015', name: 'Corporate & Insurance Billing', isEnabled: true }
        ]
      }
    ]
  }
];

const AUDIT_LOGS = [
  { id: 'log-1', action: 'Multi-Tenant Database Snapshot', user: 'SuperAdmin', timestamp: '2 mins ago', status: 'SUCCESS' },
  { id: 'log-2', action: 'Branch Node Chittagong Synced', user: 'System Worker', timestamp: '14 mins ago', status: 'SUCCESS' },
  { id: 'log-3', action: 'Kernel Security Parameter Verified', user: 'SuperAdmin', timestamp: '1 hour ago', status: 'SUCCESS' },
  { id: 'log-4', action: 'Automated Failover Cluster Checked', user: 'Kernel Daemon', timestamp: '3 hours ago', status: 'OPTIMAL' }
];

const SuperControl: React.FC = () => {
  const { role } = useAuth();
  const { companies, branches, addBranch, activeBranchId, databases } = useData();
  const [activeTab, setActiveTab] = useState<'modules' | 'branches' | 'database' | 'security' | 'kernel'>('modules');
  const [modules, setModules] = useState<ModuleControl[]>(INITIAL_MODULES);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [moduleSearch, setModuleSearch] = useState('');
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [newBranch, setNewBranch] = useState<Partial<Branch>>({
    companyId: companies[0]?.id || '',
    name: '',
    code: '',
    location: '',
    address: '',
    contact: '',
    email: '',
    status: 'Active'
  });

  if (role !== UserRole.SUPER_ADMIN) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-lg border border-rose-200">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Access Restricted</h2>
        <p className="text-slate-500 max-w-sm text-sm font-medium">
          The Super Control Center manages system kernel modules and multi-tenant databases. This area requires SuperAdmin authorization.
        </p>
      </div>
    );
  }

  const toggleModule = (modId: string) => {
    setModules(prev => prev.map(m => m.id === modId ? { ...m, isEnabled: !m.isEnabled } : m));
  };

  const toggleSubModule = (modId: string, subId: string) => {
    setModules(prev => prev.map(m => m.id === modId ? {
      ...m,
      subModules: m.subModules.map(sm => sm.id === subId ? { ...sm, isEnabled: !sm.isEnabled } : sm)
    } : m));
  };

  const toggleFeature = (modId: string, subId: string, featId: string) => {
    setModules(prev => prev.map(m => m.id === modId ? {
      ...m,
      subModules: m.subModules.map(sm => sm.id === subId ? {
        ...sm,
        features: sm.features.map(f => f.id === featId ? { ...f, isEnabled: !f.isEnabled } : f)
      } : sm)
    } : m));
  };

  const handleSave = () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 900);
  };

  const filteredModules = useMemo(() => {
    if (!moduleSearch) return modules;
    const q = moduleSearch.toLowerCase();
    return modules.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.subModules.some(s => s.name.toLowerCase().includes(q) || s.features.some(f => f.name.toLowerCase().includes(q)))
    );
  }, [modules, moduleSearch]);

  const activeFeaturesCount = useMemo(() => {
    let count = 0;
    modules.forEach(m => {
      if (m.isEnabled) {
        m.subModules.forEach(s => {
          if (s.isEnabled) {
            count += s.features.filter(f => f.isEnabled).length;
          }
        });
      }
    });
    return count;
  }, [modules]);

  return (
    <div className="bg-slate-50/60 min-h-screen p-3 sm:p-5 lg:p-8 space-y-6 max-w-[1750px] mx-auto text-slate-800 font-sans pb-24">

      {/* ======================================================== */}
      {/* 1. ENTERPRISE KERNEL COCKPIT HEADER                      */}
      {/* ======================================================== */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        
        {/* Left Branding & Live Kernel Telemetry */}
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-teal-700 via-teal-800 to-cyan-900 flex items-center justify-center text-teal-200 shadow-md shadow-teal-800/20 flex-shrink-0 border border-teal-600/40">
            <Cpu className="w-7 h-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                SUPER CONTROL CENTER
                <span className="text-xs font-black uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/80">
                  Kernel v2.6.4
                </span>
              </h1>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>NODES: STABLE</span>
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500 mt-1 flex flex-wrap items-center gap-2">
              <span>Multi-Tenant Orchestration Engine</span>
              <span className="text-slate-300">•</span>
              <span className="font-semibold text-slate-700">Root SuperAdmin</span>
              <span className="text-slate-300">•</span>
              <span>ISO 27001 & DGHS Tier-4 Compliant</span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-teal-700 font-bold bg-slate-100 px-1.5 py-0.5 rounded">E2E RSA-4096</span>
            </p>
          </div>
        </div>

        {/* Right Actions & Commit Button */}
        <div className="flex flex-wrap items-center gap-2.5 self-stretch xl:self-auto justify-start xl:justify-end">
          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle size={14} /> Configuration Propagated
            </span>
          )}

          <button
            onClick={() => setActiveTab('kernel')}
            className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Activity size={14} className="text-teal-600" />
            <span>Diagnostics</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-4 py-2 bg-gradient-to-r from-teal-700 to-teal-800 hover:from-teal-800 hover:to-teal-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-teal-700/20 flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-60`}
          >
            {isSaving ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
            <span>{isSaving ? 'Propagating...' : 'Commit Configuration'}</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. KERNEL TELEMETRY RIBBON (4 Metric Cards)              */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Kernel Architecture</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">VC-H2-2026</p>
            <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.2 rounded mt-1 inline-block">
              LTS Enterprise Core
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Zap size={20} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Active Clusters</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{branches.length || 4} Branches</p>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Multi-Tenant Isolation
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Globe size={20} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Active Features</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{activeFeaturesCount} Modules</p>
            <span className="text-[11px] font-bold text-slate-500 mt-1 inline-block">
              Granular RBAC enabled
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Sliders size={20} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Kernel Uptime SLA</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">99.99%</p>
            <span className="text-[11px] font-bold text-emerald-600 mt-1 inline-block">
              Zero Unplanned Outages
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
            <Activity size={20} />
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* 3. CONTROL TABS NAVIGATION                               */}
      {/* ======================================================== */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-3">
        {[
          { id: 'modules', label: 'Modular Switches', icon: Layout, count: modules.length },
          { id: 'branches', label: 'Branch Overlord', icon: Landmark, count: branches.length },
          { id: 'database', label: 'Mother DB Config', icon: Database, count: databases?.length || 2 },
          { id: 'security', label: 'Advanced Security', icon: Key, count: null },
          { id: 'kernel', label: 'Kernel Parameters', icon: Terminal, count: null }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-teal-700 to-teal-800 text-white shadow-md shadow-teal-800/20 ring-1 ring-teal-700'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-teal-50/70 hover:text-teal-800 hover:border-teal-300'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-teal-200' : 'text-slate-400'} />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* 4. TAB VIEWS CONTENT                                     */}
      {/* ======================================================== */}
      <AnimatePresence mode="wait">
        
        {/* --- VIEW 1: MODULAR SWITCHES --- */}
        {activeTab === 'modules' && (
          <motion.div
            key="modules"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Search and Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="relative w-full sm:w-80">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search modules or features..."
                  value={moduleSearch}
                  onChange={(e) => setModuleSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
                />
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <span>{filteredModules.length} Modules Available</span>
                <span className="text-slate-300">•</span>
                <span className="text-teal-700 font-bold">{activeFeaturesCount} Active Capabilities</span>
              </div>
            </div>

            {/* Modular Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredModules.map((mod) => (
                <div
                  key={mod.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all overflow-hidden flex flex-col justify-between"
                >
                  {/* Module Header Bar */}
                  <div className={`p-4 sm:p-5 flex justify-between items-center border-b border-slate-100 ${
                    !mod.isEnabled ? 'bg-slate-50/60 opacity-75' : 'bg-white'
                  }`}>
                    <div className="flex items-center gap-3.5">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all shadow-xs ${
                        mod.isEnabled ? 'bg-teal-700 text-white shadow-teal-700/20' : 'bg-slate-100 text-slate-400'
                      }`}>
                        <Layout size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{mod.name}</h3>
                          <span className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${
                            mod.isEnabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {mod.isEnabled ? 'ACTIVE' : 'DISABLED'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                          {mod.subModules.length} Sub-modules • Root Kernel Controller
                        </p>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => toggleModule(mod.id)}
                      className={`w-12 h-6.5 rounded-full transition-all duration-300 px-0.5 flex items-center cursor-pointer ${
                        mod.isEnabled ? 'bg-teal-600' : 'bg-slate-200'
                      }`}
                    >
                      <div className={`w-5.5 h-5.5 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                        mod.isEnabled ? 'translate-x-5.5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Sub-modules & Granular Features List */}
                  <div className="p-4 sm:p-5 space-y-4">
                    {mod.subModules.map((sub) => (
                      <div
                        key={sub.id}
                        className={`space-y-2.5 ${!mod.isEnabled ? 'pointer-events-none opacity-40' : ''}`}
                      >
                        <div className="flex justify-between items-center pb-1 border-b border-slate-100">
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${sub.isEnabled ? 'bg-teal-500' : 'bg-slate-300'}`} />
                            {sub.name}
                          </h4>
                          <button
                            type="button"
                            onClick={() => toggleSubModule(mod.id, sub.id)}
                            className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded transition-all cursor-pointer ${
                              sub.isEnabled
                                ? 'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100'
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                            }`}
                          >
                            {sub.isEnabled ? 'Granted' : 'Blocked'}
                          </button>
                        </div>

                        {/* Feature Badges */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {sub.features.map((feat) => (
                            <button
                              key={feat.id}
                              type="button"
                              onClick={() => toggleFeature(mod.id, sub.id, feat.id)}
                              disabled={!sub.isEnabled}
                              className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                feat.isEnabled
                                  ? 'bg-slate-50/70 border-slate-200 text-slate-800 hover:border-teal-300 hover:bg-teal-50/40'
                                  : 'bg-slate-50/30 border-dashed border-slate-200 text-slate-400'
                              }`}
                            >
                              <span className="text-xs font-semibold truncate pr-2">{feat.name}</span>
                              {feat.isEnabled ? (
                                <Check size={14} className="text-teal-600 shrink-0" />
                              ) : (
                                <X size={14} className="text-slate-300 shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* --- VIEW 2: BRANCH OVERLORD --- */}
        {activeTab === 'branches' && (
          <motion.div
            key="branches"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Enterprise Branch Overlord</h3>
                <p className="text-xs text-slate-500 font-medium">Manage and isolate multi-tenant hospital branch nodes</p>
              </div>
              <button
                onClick={() => setShowBranchModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-teal-700 to-teal-800 hover:from-teal-800 hover:to-teal-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm shadow-teal-700/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus size={14} /> Provision Node
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {branches.map(branch => (
                <div
                  key={branch.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-teal-300 hover:shadow-sm transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
                        <Landmark size={18} />
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        branch.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
                      }`}>
                        {branch.status}
                      </span>
                    </div>

                    <h4 className="text-base font-black text-slate-900 tracking-tight">{branch.name}</h4>
                    <p className="text-xs font-mono font-semibold text-slate-400 mt-0.5">Code: {branch.code}</p>

                    <div className="space-y-1.5 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Globe size={13} className="text-slate-400" />
                        <span className="font-medium">{branch.location || 'Bangladesh Central'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Lock size={13} className="text-slate-400" />
                        <span className="font-medium">{branch.settings?.currency || 'BDT'} Group Isolation</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 mt-4">
                    <button
                      type="button"
                      className="w-full py-2 bg-slate-50 hover:bg-teal-700 hover:text-white text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200/80"
                    >
                      <span>Node Topology</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Branch Provisioning Modal */}
            {showBranchModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
                  <div className="bg-gradient-to-r from-teal-800 to-cyan-800 p-4 text-white flex justify-between items-center">
                    <h3 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-2">
                      <Landmark size={16} /> Provision Branch Node
                    </h3>
                    <button
                      onClick={() => setShowBranchModal(false)}
                      className="text-white/80 hover:text-white p-1 rounded cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="p-5 space-y-3 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Branch Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Chittagong Vision Wing"
                        value={newBranch.name}
                        onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium outline-none focus:border-teal-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Branch Code</label>
                        <input
                          type="text"
                          placeholder="e.g. CTG-02"
                          value={newBranch.code}
                          onChange={(e) => setNewBranch({ ...newBranch, code: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium outline-none focus:border-teal-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Location / Division</label>
                        <input
                          type="text"
                          placeholder="e.g. Chittagong"
                          value={newBranch.location}
                          onChange={(e) => setNewBranch({ ...newBranch, location: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium outline-none focus:border-teal-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                    <button
                      onClick={() => setShowBranchModal(false)}
                      className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold text-xs cursor-pointer hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (!newBranch.name) return;
                        const b = { ...newBranch, id: `BR${Date.now()}`, createdAt: new Date().toISOString() } as Branch;
                        addBranch(b);
                        setShowBranchModal(false);
                      }}
                      className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold text-xs cursor-pointer shadow-sm"
                    >
                      Deploy Branch
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* --- VIEW 3: MOTHER DATABASE CONFIG --- */}
        {activeTab === 'database' && (
          <motion.div
            key="database"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-12 gap-6"
          >
            <div className="col-span-12 lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <Database size={16} className="text-teal-600" />
                  Primary Mother Cluster Deployment
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Synchronous read/write replicas with automated cryptographic point-in-time recovery
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { name: 'Mother DB Node 01 (Primary Active)', host: 'db-cluster-primary.vce-hms.local', status: 'Online', load: 38 },
                  { name: 'Mother DB Node 02 (Standby Replica)', host: 'db-replica-sync.vce-hms.local', status: 'Online', load: 24 },
                  { name: 'Encrypted Cold Storage Backup', host: 'backup-vault-s3.vce-hms.local', status: 'Optimal', load: 12 }
                ].map((db, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-bold text-xs text-slate-900">{db.name}</p>
                      <p className="font-mono text-[11px] text-slate-400 mt-0.5">{db.host}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded uppercase">
                        {db.status}
                      </span>
                      <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1.5">
                        <div className="bg-teal-600 h-full rounded-full" style={{ width: `${db.load}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hardware Resources Panel */}
            <div className="col-span-12 lg:col-span-5 bg-gradient-to-br from-teal-800 via-teal-700 to-teal-900 text-white rounded-2xl p-6 shadow-xl border border-teal-600/40 flex flex-col justify-between">
              <div>
                <h4 className="font-black text-sm tracking-tight text-white flex items-center gap-2 mb-4">
                  <Cpu size={16} className="text-cyan-300" /> Live Cluster Hardware Metrics
                </h4>

                <div className="space-y-4 text-xs">
                  <div>
                    <div className="flex justify-between font-bold text-teal-100 mb-1">
                      <span>Global CPU Utilization</span>
                      <span>36%</span>
                    </div>
                    <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden border border-white/10">
                      <div className="bg-cyan-400 h-full rounded-full" style={{ width: '36%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold text-teal-100 mb-1">
                      <span>RAM Memory Pool</span>
                      <span>44% (14.2 GB / 32 GB)</span>
                    </div>
                    <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden border border-white/10">
                      <div className="bg-teal-300 h-full rounded-full" style={{ width: '44%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold text-teal-100 mb-1">
                      <span>Storage Cluster SSD</span>
                      <span>58% (580 GB / 1 TB)</span>
                    </div>
                    <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden border border-white/10">
                      <div className="bg-emerald-400 h-full rounded-full" style={{ width: '58%' }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-black/20 border border-white/15 mt-6">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300 block">
                  Active Database Pool Connections
                </span>
                <p className="text-2xl font-black text-white mt-1">1,248 Connections</p>
                <p className="text-[11px] text-teal-100/70 mt-0.5">Peak traffic handled with zero connection drops</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* --- VIEW 4: ADVANCED SECURITY --- */}
        {activeTab === 'security' && (
          <motion.div
            key="security"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <ShieldCheck size={16} className="text-teal-600" /> Cryptographic Access Protocols
              </h3>
              <div className="space-y-3">
                {[
                  { title: 'Enforce 2-Factor Authentication (2FA)', desc: 'Mandatory TOTP for Doctors, Pharmacists, and SuperAdmins', enabled: true },
                  { title: 'Session Inactivity Timeout (30 mins)', desc: 'Automatically logout inactive workstation sessions', enabled: true },
                  { title: 'IP Whitelisting & VPN Restriction', desc: 'Allow clinical POS operations only from registered intranet subnets', enabled: true },
                  { title: 'Encrypted Patient Data Exports', desc: 'Password-protect PDF and CSV medical export records', enabled: true }
                ].map((item, i) => (
                  <div key={i} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-bold text-xs text-slate-800">{item.title}</p>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">{item.desc}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Enforced
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Clock size={16} className="text-teal-600" /> Recent SuperAdmin Audit Trail
              </h3>
              <div className="divide-y divide-slate-100 text-xs">
                {AUDIT_LOGS.map(log => (
                  <div key={log.id} className="py-2.5 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800">{log.action}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{log.user} • {log.timestamp}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 rounded text-[10px] font-bold">
                      {log.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* --- VIEW 5: KERNEL PARAMETERS & LOGS --- */}
        {activeTab === 'kernel' && (
          <motion.div
            key="kernel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <Terminal size={16} className="text-teal-600" /> Kernel Diagnostic Telemetry & System Logs
                </h3>
                <p className="text-xs text-slate-400 font-medium">Real-time daemon and API gateway operational health</p>
              </div>
              <button
                type="button"
                className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-all cursor-pointer"
              >
                Flush App Cache
              </button>
            </div>

            <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-xs leading-relaxed overflow-x-auto custom-scrollbar border border-slate-800 space-y-1">
              <p>[00:00:01] [KERNEL] VCE-HMS Multi-Tenant Engine v2.6.4 initialized successfully.</p>
              <p>[00:00:02] [CLUSTER] 4 Branch Nodes connected. Cryptographic handshakes verified.</p>
              <p>[00:00:03] [DB-POOL] Primary Mother DB latency: 11.4ms. Replication offset: 0 bytes.</p>
              <p>[00:00:04] [AUTH] SuperAdmin privilege verified. Audit logging active.</p>
              <p>[00:00:05] [SECURITY] Threat Shield Active: 0 malicious attempts blocked in last 24h.</p>
              <p className="text-cyan-300">[READY] System operational at 99.99% capacity index.</p>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* ======================================================== */}
      {/* 5. STRATEGIC COMPLIANCE & KERNEL FOOTER                  */}
      {/* ======================================================== */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-200">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
              SUPERADMIN INFRASTRUCTURE SECURITY SHIELD ACTIVE
            </h4>
            <p className="text-[11px] font-medium text-slate-400">
              Multi-Branch Hospital Network • ISO 9001:2015 & DGHS Certified Kernel
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 cursor-pointer"
          >
            Export Architecture Brief
          </button>
        </div>
      </div>

    </div>
  );
};

export default SuperControl;
