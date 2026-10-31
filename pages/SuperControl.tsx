
import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, ModuleControl, SubModuleControl, FeatureControl, Branch } from '../types';
import {
    ShieldCheck, Database, Layout, Settings, Activity,
    Globe, Lock, Power, ChevronRight, CheckCircle2,
    AlertTriangle, Save, RefreshCw, Key, Server,
    Cpu, Zap, Eye, EyeOff, Terminal, Command, Landmark
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
                    { id: 'FEAT003', name: 'Vitals Tracking', isEnabled: true }
                ]
            },
            {
                id: 'SUB002',
                name: 'IPD & Bed Management',
                isEnabled: true,
                features: [
                    { id: 'FEAT004', name: 'Bed Allocation', isEnabled: true },
                    { id: 'FEAT005', name: 'Nursing Notes', isEnabled: true }
                ]
            }
        ]
    },
    {
        id: 'MOD002',
        name: 'Diagnostic Suite',
        isEnabled: true,
        subModules: [
            {
                id: 'SUB003',
                name: 'Laboratory',
                isEnabled: true,
                features: [
                    { id: 'FEAT006', name: 'Sample Tracking', isEnabled: true },
                    { id: 'FEAT007', name: 'Automated Reporting', isEnabled: true }
                ]
            }
        ]
    },
    {
        id: 'MOD003',
        name: 'Commercial & Retail',
        isEnabled: true,
        subModules: [
            {
                id: 'SUB004',
                name: 'Pharmacy POS',
                isEnabled: true,
                features: [
                    { id: 'FEAT008', name: 'Inventory Alerts', isEnabled: true },
                    { id: 'FEAT009', name: 'GST Billing', isEnabled: true }
                ]
            }
        ]
    }
];

const SuperControl: React.FC = () => {
    const { role } = useAuth();
    const { companies, branches, addBranch, activeBranchId } = useData();
    const [activeTab, setActiveTab] = useState<'modules' | 'database' | 'branches' | 'security' | 'advanced'>('modules');
    const [modules, setModules] = useState<ModuleControl[]>(INITIAL_MODULES);
    const [isSaving, setIsSaving] = useState(false);
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
            <div className="h-full flex flex-col items-center justify-center p-20 text-center space-y-4">
                <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center shadow-xl shadow-rose-100">
                    <AlertTriangle size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Access Denied</h2>
                <p className="text-slate-500 max-w-sm font-medium">This module contains advanced infrastructure controllers and is restricted to System SuperAdmins only.</p>
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
        setTimeout(() => {
            setIsSaving(false);
            // Logic to actually save would go here
        }, 1500);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-24 px-4 lg:px-0">
            {/* Header with Glass Card */}
            <div className="relative overflow-hidden bg-slate-900 rounded-[3rem] p-10 lg:p-14 text-white shadow-2xl shadow-slate-200">
                <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/20 rounded-full blur-[120px] -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[100px] -ml-24 -mb-24"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-teal-500 rounded-2xl shadow-xl shadow-teal-500/30">
                                <ShieldCheck size={32} />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">Super Control Center</h1>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="px-2 py-0.5 bg-white/10 rounded-full text-xs font-black uppercase tracking-[0.2em] text-teal-400 border border-white/5">System Kernel Level</span>
                                    <span className="flex items-center gap-1.5 text-xs font-bold text-white/50"><Activity size={12} /> Nodes Status: Stable</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-slate-300 max-w-xl text-sm font-medium leading-relaxed opacity-80">
                            Advanced enterprise orchestration engine. Configure mother databases, toggle modular capabilities, and manage global security protocols from a unified kernel command center.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`px-8 py-4 rounded-[1.5rem] flex items-center gap-3 text-xs font-black uppercase tracking-widest transition-all ${isSaving ? 'bg-slate-800 text-slate-400' : 'bg-teal-500 hover:bg-teal-400 text-white shadow-xl shadow-teal-500/20 active:scale-95'
                                }`}
                        >
                            {isSaving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                            {isSaving ? 'Propagating Changes...' : 'Commit Configuration'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-14">
                    {[
                        { label: 'Kernel Version', value: 'VC-H2-2026', icon: Zap },
                        { label: 'Active Clusters', value: '4 Global', icon: Globe },
                        { label: 'Security Mode', value: 'E2E RSA', icon: Lock },
                        { label: 'System Uptime', value: '99.99%', icon: Activity }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5 flex flex-col gap-1">
                            <stat.icon className="text-teal-400 mb-2" size={18} />
                            <p className="text-xs font-black text-white/40 uppercase tracking-widest">{stat.label}</p>
                            <p className="text-lg font-black tracking-tight">{stat.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Control Tabs */}
            <div className="flex flex-wrap items-center bg-white p-2 rounded-[2.5rem] border border-slate-100 shadow-sm gap-2">
                {[
                    { id: 'modules', label: 'Modular Switches', icon: Layout },
                    { id: 'branches', label: 'Branch Overlord', icon: Landmark },
                    { id: 'database', label: 'Mother DB Config', icon: Database },
                    { id: 'security', label: 'Advanced Security', icon: Key },
                    { id: 'advanced', label: 'Kernel Parameters', icon: Terminal }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Modular Switches View */}
            <AnimatePresence mode="wait">
                {activeTab === 'branches' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-8"
                    >
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Branch Infrastructure</h3>
                                <p className="text-xs text-slate-400 font-bold mt-1">Deploy and manage enterprise branch nodes across the mother company database.</p>
                            </div>
                            <button
                                onClick={() => setShowBranchModal(true)}
                                className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:shadow-2xl hover:shadow-slate-200 transition-all active:scale-95"
                            >
                                Provision New Branch
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {branches.map(branch => (
                                <div key={branch.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 overflow-hidden relative group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Landmark size={80} />
                                    </div>
                                    <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                                        <div>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900">
                                                    <Landmark size={20} />
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${branch.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                    {branch.status}
                                                </span>
                                            </div>
                                            <h4 className="text-lg font-black text-slate-900 tracking-tight leading-tight">{branch.name}</h4>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Code: {branch.code}</p>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 text-slate-500">
                                                <Globe size={14} className="opacity-50" />
                                                <span className="text-xs font-bold">{branch.location}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-slate-500">
                                                <Lock size={14} className="opacity-50" />
                                                <span className="text-xs font-bold">{branch.settings?.currency || 'BDT'} Group Isolation</span>
                                            </div>
                                        </div>

                                        <button className="w-full py-4 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                                            Access Management <ChevronRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Branch Provisioning Modal */}
                        {showBranchModal && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 lg:p-12">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                                    onClick={() => setShowBranchModal(false)}
                                />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    className="relative z-10 w-full max-w-4xl bg-white rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row"
                                >
                                    <div className="w-full lg:w-1/3 bg-slate-900 p-10 lg:p-14 text-white relative flex flex-col justify-between overflow-hidden">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/20 rounded-full blur-[80px] -mr-32 -mt-32"></div>
                                        <div className="relative z-10">
                                            <div className="w-16 h-16 bg-teal-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-teal-500/40 mb-8">
                                                <Landmark size={32} />
                                            </div>
                                            <h2 className="text-3xl font-black tracking-tighter uppercase leading-none mb-4">Provision Node</h2>
                                            <p className="text-slate-400 text-xs font-medium leading-relaxed">
                                                Initialize a new branch environment within the multi-tenant cluster. All data will be isolated at the kernel level.
                                            </p>
                                        </div>
                                        <div className="relative z-10 space-y-4 pt-10 border-t border-white/10">
                                            <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-teal-400">
                                                <CheckCircle2 size={16} /> Multi-Tenancy Core
                                            </div>
                                            <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-white/50 leading-tight">
                                                Secure Data Segregation Enabled
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-full lg:w-2/3 p-10 lg:p-14 max-h-[80vh] overflow-y-auto custom-scrollbar">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Branch Name</label>
                                                <input
                                                    type="text"
                                                    value={newBranch.name}
                                                    onChange={e => setNewBranch({ ...newBranch, name: e.target.value })}
                                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-slate-900 transition-all outline-none"
                                                    placeholder="e.g. South Campus - Khulna"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Unique Code</label>
                                                <input
                                                    type="text"
                                                    value={newBranch.code}
                                                    onChange={e => setNewBranch({ ...newBranch, code: e.target.value })}
                                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-slate-900 transition-all outline-none"
                                                    placeholder="KLN-05"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Geo Location</label>
                                                <input
                                                    type="text"
                                                    value={newBranch.location}
                                                    onChange={e => setNewBranch({ ...newBranch, location: e.target.value })}
                                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-slate-900 transition-all outline-none"
                                                    placeholder="City Name"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Corporate Email</label>
                                                <input
                                                    type="email"
                                                    value={newBranch.email}
                                                    onChange={e => setNewBranch({ ...newBranch, email: e.target.value })}
                                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-slate-900 transition-all outline-none"
                                                    placeholder="branch@visionary.com"
                                                />
                                            </div>
                                            <div className="md:col-span-2 space-y-2">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Physical Address</label>
                                                <textarea
                                                    rows={3}
                                                    value={newBranch.address}
                                                    onChange={e => setNewBranch({ ...newBranch, address: e.target.value })}
                                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-slate-900 transition-all outline-none resize-none"
                                                    placeholder="Street address, block, city..."
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-4 mt-12 pt-10 border-t border-slate-50">
                                            <button
                                                onClick={() => setShowBranchModal(false)}
                                                className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                            >
                                                Abort Deployment
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const b = { ...newBranch, id: `BR${Date.now()}`, createdAt: new Date().toISOString() } as Branch;
                                                    addBranch(b);
                                                    setShowBranchModal(false);
                                                }}
                                                className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-teal-500 transition-all shadow-xl active:scale-95"
                                            >
                                                Finalize & Deploy Node
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'modules' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                    >
                        {modules.map((mod) => (
                            <div key={mod.id} className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500">
                                <div className={`p-8 flex justify-between items-center border-b border-slate-50 ${!mod.isEnabled ? 'bg-slate-50/50 opacity-80' : ''}`}>
                                    <div className="flex items-center gap-5">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg ${mod.isEnabled ? 'bg-slate-900 text-teal-400 shadow-slate-200' : 'bg-slate-200 text-slate-400'}`}>
                                            <Layout size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">{mod.name}</h3>
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Main Module Controller</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleModule(mod.id)}
                                        className={`w-14 h-8 rounded-full relative transition-all duration-500 px-1 ${mod.isEnabled ? 'bg-teal-500' : 'bg-slate-300'}`}
                                    >
                                        <div className={`w-6 h-6 rounded-full bg-white shadow-md transition-all duration-500 ${mod.isEnabled ? 'ml-6' : 'ml-0'}`}></div>
                                    </button>
                                </div>

                                <div className="p-8 space-y-8">
                                    {mod.subModules.map(sub => (
                                        <div key={sub.id} className={`space-y-4 ${!mod.isEnabled ? 'pointer-events-none opacity-40' : ''}`}>
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-xs font-black text-slate-700 uppercase tracking-tight flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${sub.isEnabled ? 'bg-teal-500' : 'bg-slate-300'}`}></div>
                                                    {sub.name}
                                                </h4>
                                                <button onClick={() => toggleSubModule(mod.id, sub.id)} className={`text-xs font-black uppercase tracking-widest p-2 rounded-lg transition-all ${sub.isEnabled ? 'text-teal-600 bg-teal-50 hover:bg-teal-100' : 'text-slate-400 bg-slate-100'}`}>
                                                    {sub.isEnabled ? 'Full Access' : 'Restricted'}
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4 border-l-2 border-slate-100 ml-1">
                                                {sub.features.map(feat => (
                                                    <button
                                                        key={feat.id}
                                                        onClick={() => toggleFeature(mod.id, sub.id, feat.id)}
                                                        disabled={!sub.isEnabled}
                                                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${feat.isEnabled
                                                            ? 'bg-white border-slate-200 text-slate-900 shadow-sm hover:border-teal-200'
                                                            : 'bg-slate-50 border-transparent text-slate-400'
                                                            }`}
                                                    >
                                                        <span className="text-xs font-black uppercase tracking-tighter">{feat.name}</span>
                                                        {feat.isEnabled ? <Eye size={14} className="text-teal-500" /> : <EyeOff size={14} />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* Database View (Expanded for SuperAdmin) */}
                {activeTab === 'database' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-8"
                    >
                        <div className="md:col-span-2 bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 space-y-10">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3"><Server className="text-indigo-600" /> Mother Cluster Deployment</h3>
                                    <p className="text-xs text-slate-400 font-bold mt-1">Configure global PostgreSQL/MSSQL instances across cloud nodes.</p>
                                </div>
                                <button className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-600 hover:text-white transition-all">Add Instance</button>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { name: 'Primary Core Cluster', host: 'dhaka-az-01.db.visionary.io', status: 'Optimal', load: 32 },
                                    { name: 'Regional Backup Node', host: 'ctg-az-02.db.visionary.io', status: 'Optimal', load: 12 }
                                ].map((db, i) => (
                                    <div key={i} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between group hover:bg-white hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/50 transition-all duration-500">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm"><Database size={20} /></div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900">{db.name}</p>
                                                <p className="text-xs font-bold text-slate-400 font-mono mt-0.5">{db.host}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-black text-emerald-600 uppercase tracking-widest block mb-1">{db.status}</span>
                                            <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500" style={{ width: `${db.load}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-[3rem] p-10 text-white space-y-8 flex flex-col justify-between">
                            <div>
                                <h4 className="text-lg font-black tracking-tight mb-4 flex items-center gap-3"><Cpu className="text-teal-400" /> HW Resources</h4>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-black uppercase tracking-widest text-white/50">
                                            <span>Global CPU Utilization</span>
                                            <span>42%</span>
                                        </div>
                                        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                            <motion.div initial={{ width: 0 }} animate={{ width: '42%' }} className="h-full bg-teal-400"></motion.div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-black uppercase tracking-widest text-white/50">
                                            <span>Storage Cluster A</span>
                                            <span>88%</span>
                                        </div>
                                        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                            <motion.div initial={{ width: 0 }} animate={{ width: '88%' }} className="h-full bg-rose-400"></motion.div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
                                <p className="text-xs font-black text-teal-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Command size={14} /> Active Connections</p>
                                <p className="text-4xl font-black text-white tracking-tighter">1,248</p>
                                <p className="text-xs font-bold text-white/30 mt-2">Peak load at 11:30 AM local time</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Security & Advanced would follow similar premium patterns */}
                {(activeTab === 'security' || activeTab === 'advanced') && (
                    <div className="h-96 flex flex-col items-center justify-center bg-white rounded-[3rem] border border-slate-100 shadow-sm border-dashed">
                        <Settings size={48} className="text-slate-200 animate-spin-slow mb-4" />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Kernel Controllers Loading</p>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SuperControl;
