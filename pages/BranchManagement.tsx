
import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Company, Branch } from '../types';
import {
    Building2, Plus, Edit, Trash2, Globe, Mail, Phone,
    MapPin, Settings, CheckCircle, Database, Layout,
    Search, ShieldCheck, Activity, Users, Landmark,
    Layers, BarChart3, ArrowUpRight, TrendingUp, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const BranchManagement: React.FC = () => {
    const {
        companies, branches, addCompany, updateCompany,
        deleteCompany, addBranch, updateBranch, deleteBranch,
        formatCurrency
    } = useData();

    const [activeTab, setActiveTab] = useState<'companies' | 'branches' | 'analytics'>('companies');
    const [searchTerm, setSearchTerm] = useState('');

    // Modals
    const [showCompanyModal, setShowCompanyModal] = useState(false);
    const [showBranchModal, setShowBranchModal] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>(companies[0]?.id || '');

    // Form States
    const [companyForm, setCompanyForm] = useState<Partial<Company>>({
        name: '', address: '', contact: '', email: '', status: 'Active'
    });

    const [branchForm, setBranchForm] = useState<Partial<Branch>>({
        name: '', code: '', location: '', address: '', contact: '', email: '', status: 'Active'
    });

    const filteredCompanies = useMemo(() =>
        companies.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())),
        [companies, searchTerm]);

    const filteredBranches = useMemo(() =>
        branches.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()) || b.code.toLowerCase().includes(searchTerm.toLowerCase())),
        [branches, searchTerm]);

    const handleCompanySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCompany) {
            updateCompany(editingCompany.id, companyForm);
        } else {
            addCompany({
                ...companyForm as Company,
                id: `COMP-${Date.now()}`,
                createdAt: new Date().toISOString(),
            });
        }
        setShowCompanyModal(false);
        setEditingCompany(null);
        setCompanyForm({ name: '', address: '', contact: '', email: '', status: 'Active' });
    };

    const handleBranchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingBranch) {
            updateBranch(editingBranch.id, branchForm);
        } else {
            addBranch({
                ...branchForm as Branch,
                id: `BR-${Date.now()}`,
                companyId: selectedCompanyId,
                createdAt: new Date().toISOString(),
            });
        }
        setShowBranchModal(false);
        setEditingBranch(null);
        setBranchForm({ name: '', code: '', location: '', address: '', contact: '', email: '', status: 'Active' });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3 uppercase tracking-tight">
                        <Building2 className="text-teal-600" /> Enterprise Architecture
                    </h1>
                    <p className="text-sm text-slate-500 font-medium">Manage Mother Databases & Multi-Branch Ecosystems</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => { setEditingCompany(null); setShowCompanyModal(true); }}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-200 transition-all active:scale-95"
                    >
                        <Plus size={16} /> New Mother Database
                    </button>
                    <button
                        onClick={() => { setEditingBranch(null); setShowBranchModal(true); }}
                        className="bg-teal-600 hover:bg-teal-500 text-white px-6 py-3 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest shadow-xl shadow-teal-100 transition-all active:scale-95"
                    >
                        <Plus size={16} /> New Branch Entity
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Databases', value: companies.length, icon: Database, color: 'indigo' },
                    { label: 'Active Branches', value: branches.length, icon: Landmark, color: 'teal' },
                    { label: 'System Nodes', value: branches.length + 2, icon: Activity, color: 'blue' },
                    { label: 'Connectivity', value: '100%', icon: Globe, color: 'emerald' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
                        </div>
                        <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-600`}>
                            <stat.icon size={24} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs & Search */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-2 rounded-[2rem] border border-slate-100 shadow-sm gap-4">
                <div className="flex p-1 bg-slate-50 rounded-2xl">
                    {(['companies', 'branches', 'analytics'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            {tab === 'companies' ? 'Mother Databases' : tab === 'branches' ? 'Branch Network' : 'Group Analytics'}
                        </button>
                    ))}
                </div>
                <div className="relative w-full md:w-80 px-2">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search entities..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-teal-500/20 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Tab Content */}
            <div className="animate-in slide-in-from-bottom-4 duration-500">
                {activeTab === 'companies' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredCompanies.map(company => (
                            <div key={company.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500">
                                <div className="p-8 flex justify-between items-start">
                                    <div className="flex gap-6">
                                        <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-slate-200 group-hover:scale-110 transition-transform duration-500">
                                            <Database size={28} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-xl font-black text-slate-900 tracking-tight">{company.name}</h3>
                                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100">Live</span>
                                            </div>
                                            <p className="text-xs text-slate-400 font-bold mb-4 flex items-center gap-4">
                                                <span className="flex items-center gap-1.5"><MapPin size={12} /> {company.address}</span>
                                                <span className="flex items-center gap-1.5"><Building2 size={12} /> {branches.filter(b => b.companyId === company.id).length} Branches</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                        <button onClick={() => { setEditingCompany(company); setCompanyForm(company); setShowCompanyModal(true); }} className="p-3 bg-slate-50 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-2xl transition-all shadow-sm"><Edit size={16} /></button>
                                        <button onClick={() => deleteCompany(company.id)} className="p-3 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all shadow-sm"><Trash2 size={16} /></button>
                                    </div>
                                </div>

                                <div className="px-8 pb-8 pt-0 grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2"><Mail size={10} /> Corporate Email</p>
                                        <p className="text-xs font-black text-slate-700">{company.email}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2"><Phone size={10} /> IT Support Contact</p>
                                        <p className="text-xs font-black text-slate-700">{company.contact}</p>
                                    </div>
                                </div>

                                <div className="bg-slate-900 p-5 mt-2 flex justify-between items-center mx-4 mb-4 rounded-3xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-teal-400"><Activity size={16} /></div>
                                        <p className="text-xs font-black text-white/50 uppercase tracking-[0.2em]">DB Cluster Node: <span className="text-white">DHK-AZ-01</span></p>
                                    </div>
                                    <button className="text-teal-400 hover:text-white transition-colors"><ArrowUpRight size={18} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'branches' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredBranches.map(branch => (
                            <div key={branch.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-teal-100/30 transition-all duration-500 overflow-hidden group">
                                <div className="p-7">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-all duration-500">
                                            <Landmark size={22} />
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">Entity Code</span>
                                            <span className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-black tracking-tight">{branch.code}</span>
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-black text-slate-900 mb-2 truncate group-hover:text-teal-600 transition-colors">{branch.name}</h3>
                                    <p className="text-xs text-slate-500 font-medium mb-6 flex items-center gap-2">
                                        <MapPin size={12} className="text-teal-500" /> {branch.location}
                                    </p>

                                    <div className="space-y-3 mb-8">
                                        <div className="flex justify-between items-center text-xs py-2 border-b border-slate-50">
                                            <span className="font-bold text-slate-400 uppercase tracking-widest">Parent Group</span>
                                            <span className="font-black text-slate-900">{companies.find(c => c.id === branch.companyId)?.name || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs py-2 border-b border-slate-50">
                                            <span className="font-bold text-slate-400 uppercase tracking-widest">Phone Link</span>
                                            <span className="font-black text-slate-900">{branch.contact}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs py-2">
                                            <span className="font-bold text-slate-400 uppercase tracking-widest">Data Isolation</span>
                                            <span className="flex items-center gap-1.5 font-black text-emerald-600"><ShieldCheck size={12} /> ACTIVE</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => { setEditingBranch(branch); setBranchForm(branch); setSelectedCompanyId(branch.companyId); setShowBranchModal(true); }}
                                            className="flex-1 py-3 bg-slate-50 text-slate-600 hover:bg-slate-900 hover:text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300"
                                        >
                                            Config
                                        </button>
                                        <button
                                            onClick={() => deleteBranch(branch.id)}
                                            className="w-12 h-12 flex items-center justify-center bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white rounded-2xl transition-all duration-300"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className="space-y-6">
                        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-[80px] -mr-32 -mt-32"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="p-3 bg-teal-500 text-white rounded-2xl shadow-xl shadow-teal-500/20"><TrendingUp size={24} /></div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Consolidated Group Performance</h3>
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Real-time aggregate data across all mother databases</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                                    <div className="space-y-4">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest border-l-2 border-teal-500 pl-4">Revenue Attribution</p>
                                        <div className="space-y-3">
                                            {branches.map((b, i) => (
                                                <div key={b.id} className="flex flex-col gap-1.5">
                                                    <div className="flex justify-between text-xs font-black uppercase tracking-tighter">
                                                        <span>{b.name}</span>
                                                        <span>{35 - (i * 10)}%</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${35 - (i * 10)}%` }}
                                                            className="h-full bg-teal-500"
                                                        ></motion.div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="md:col-span-2 bg-slate-50 rounded-3xl p-6 border border-slate-100 flex flex-col justify-center items-center text-center">
                                        <BarChart3 size={48} className="text-slate-200 mb-4" />
                                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1">Predictive Resource Modeling</p>
                                        <p className="text-xs text-slate-400 font-medium max-w-xs leading-relaxed">System is analyzing cross-branch patient load patterns to optimize doctor availability.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Company / Mother DB Modal */}
            <AnimatePresence>
                {showCompanyModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200"
                        >
                            <div className="p-8 bg-slate-900 text-white flex justify-between items-center relative">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-teal-500 rounded-2xl shadow-lg shadow-teal-500/20"><Database size={24} /></div>
                                    <div>
                                        <h3 className="font-black text-2xl tracking-tight uppercase">{editingCompany ? 'Update Engine Profile' : 'New Mother Database'}</h3>
                                        <p className="text-xs font-black text-teal-400 uppercase tracking-widest mt-1">Master Enterprise Controller</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowCompanyModal(false)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"><Trash2 size={18} /></button>
                            </div>
                            <form onSubmit={handleCompanySubmit} className="p-10 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <dir className="space-y-4 p-0">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Entity Name</label>
                                            <input
                                                required
                                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm focus:ring-4 focus:ring-teal-500/10 outline-none transition-all"
                                                placeholder="e.g. Visionary Health Corp"
                                                value={companyForm.name}
                                                onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Headquarters</label>
                                            <input
                                                required
                                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm focus:ring-4 focus:ring-teal-500/10 outline-none transition-all"
                                                placeholder="City Tower, Flat 4B"
                                                value={companyForm.address}
                                                onChange={e => setCompanyForm({ ...companyForm, address: e.target.value })}
                                            />
                                        </div>
                                    </dir>
                                    <dir className="space-y-4 p-0">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Enterprise Email</label>
                                            <input
                                                required
                                                type="email"
                                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm focus:ring-4 focus:ring-teal-500/10 outline-none transition-all"
                                                placeholder="admin@corp.com"
                                                value={companyForm.email}
                                                onChange={e => setCompanyForm({ ...companyForm, email: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Contact Backbone</label>
                                            <input
                                                required
                                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm focus:ring-4 focus:ring-teal-500/10 outline-none transition-all"
                                                placeholder="+880 17..."
                                                value={companyForm.contact}
                                                onChange={e => setCompanyForm({ ...companyForm, contact: e.target.value })}
                                            />
                                        </div>
                                    </dir>
                                </div>

                                <div className="p-6 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <ShieldCheck size={14} className="text-teal-600" /> Security & Infrastructure
                                    </h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="p-4 bg-white rounded-2xl border border-slate-100">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Auth Mode</p>
                                            <p className="text-xs font-black text-slate-900">RSA-4096 / SSL</p>
                                        </div>
                                        <div className="p-4 bg-white rounded-2xl border border-slate-100">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Isolation</p>
                                            <p className="text-xs font-black text-slate-900">Physical Node</p>
                                        </div>
                                        <div className="p-4 bg-white rounded-2xl border border-slate-100">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sync Frequency</p>
                                            <p className="text-xs font-black text-slate-900">Real-time (0.2s)</p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-slate-800 shadow-2xl shadow-slate-200 transition-all active:scale-[0.98]"
                                >
                                    {editingCompany ? 'Commit Changes to Master' : 'Initialize Enterprise Hub'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Branch Entity Modal */}
            <AnimatePresence>
                {showBranchModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200"
                        >
                            <div className="flex flex-col md:flex-row h-[600px]">
                                {/* Left Side: Illustration / Context */}
                                <div className="md:w-[35%] bg-teal-600 p-10 flex flex-col justify-between text-white relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                                    <div className="relative z-10">
                                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-10 shadow-xl">
                                            <Landmark size={32} />
                                        </div>
                                        <h3 className="text-3xl font-black tracking-tight leading-tight mb-6">Provision New <br />Branch Entity.</h3>
                                        <p className="text-teal-100 text-xs font-medium leading-relaxed opacity-80">
                                            Branches act as separate operational units with dedicated resource pools while sharing a unified mother company database backend.
                                        </p>
                                    </div>
                                    <div className="relative z-10 space-y-4">
                                        {[
                                            { icon: ShieldCheck, text: "Independent P&L Tracking" },
                                            { icon: Activity, text: "Individual Resource Load" },
                                            { icon: Layers, text: "Cross-Branch Referrals" }
                                        ].map((feat, i) => (
                                            <div key={i} className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-teal-50">
                                                <feat.icon size={14} className="text-teal-300" /> {feat.text}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Right Side: Detailed Form */}
                                <div className="md:w-[65%] p-10 overflow-y-auto custom-scrollbar">
                                    <div className="flex justify-between items-center mb-10 pb-5 border-b border-slate-100">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Entity Blueprint</h4>
                                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-black uppercase tracking-widest">
                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> DB Ready
                                        </div>
                                    </div>

                                    <form onSubmit={handleBranchSubmit} className="space-y-8">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Parent Database / Company</label>
                                            <select
                                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm focus:ring-4 focus:ring-teal-500/10 outline-none transition-all appearance-none"
                                                value={selectedCompanyId}
                                                onChange={e => setSelectedCompanyId(e.target.value)}
                                            >
                                                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Branch Name</label>
                                                <input
                                                    required
                                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm focus:ring-4 focus:ring-teal-500/10 outline-none transition-all"
                                                    placeholder="City Medical Center"
                                                    value={branchForm.name}
                                                    onChange={e => setBranchForm({ ...branchForm, name: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Unique Code</label>
                                                <input
                                                    required
                                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm focus:ring-4 focus:ring-teal-500/10 outline-none transition-all"
                                                    placeholder="BR-001"
                                                    value={branchForm.code}
                                                    onChange={e => setBranchForm({ ...branchForm, code: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Location / Regional</label>
                                                <input
                                                    required
                                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm focus:ring-4 focus:ring-teal-500/10 outline-none transition-all"
                                                    placeholder="Dhaka North"
                                                    value={branchForm.location}
                                                    onChange={e => setBranchForm({ ...branchForm, location: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Contact Line</label>
                                                <input
                                                    required
                                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm focus:ring-4 focus:ring-teal-500/10 outline-none transition-all"
                                                    placeholder="+880..."
                                                    value={branchForm.contact}
                                                    onChange={e => setBranchForm({ ...branchForm, contact: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Physical Address</label>
                                            <textarea
                                                required
                                                rows={2}
                                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm focus:ring-4 focus:ring-teal-500/10 outline-none transition-all resize-none"
                                                placeholder="Full street address..."
                                                value={branchForm.address}
                                                onChange={e => setBranchForm({ ...branchForm, address: e.target.value })}
                                            />
                                        </div>

                                        <div className="flex gap-4 pt-5">
                                            <button type="button" onClick={() => setShowBranchModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
                                            <button type="submit" className="flex-[2] py-4 bg-teal-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-teal-700 shadow-xl shadow-teal-100 transition-all active:scale-[0.98]">Deploy Branch Node</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BranchManagement;
