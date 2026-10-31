
import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import {
    Users, MapPin, Calendar, TrendingUp, Plus, ArrowUpRight,
    UserCheck, Stethoscope, Table, Clock, Edit, Trash2,
    Filter, Download, CheckCircle, AlertCircle, X, ChevronRight,
    Search, Award, HeartPulse, Building2, Activity
} from 'lucide-react';
import { Campaign, Employee } from '../types';

const Campaigns = () => {
    const { campaigns, addCampaign, updateCampaign, deleteCampaign, employees, surgeries, patients } = useData();
    const [selectedCampForView, setSelectedCampForView] = useState<Campaign | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'champion' | 'camp_ot'>('overview');
    const [showAddModal, setShowAddModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedCamp, setSelectedCamp] = useState<Campaign | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState<Partial<Campaign>>({
        name: '',
        location: '',
        date: new Date().toISOString().split('T')[0],
        status: 'Planned',
        targetPatients: 100,
        screenedPatients: 0
    });

    const handleOpenAdd = () => {
        setIsEditing(false);
        setSelectedCamp(null);
        setFormData({
            name: '',
            location: '',
            date: new Date().toISOString().split('T')[0],
            status: 'Planned',
            targetPatients: 100,
            screenedPatients: 0
        });
        setShowAddModal(true);
    };

    const handleOpenEdit = (camp: Campaign) => {
        setIsEditing(true);
        setSelectedCamp(camp);
        setFormData(camp);
        setShowAddModal(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditing && selectedCamp) {
            updateCampaign(selectedCamp.id, formData);
        } else {
            addCampaign({
                ...formData as Campaign,
                id: `CAMP-${Date.now().toString().slice(-4)}`
            });
        }
        setShowAddModal(false);
    };

    // Filter surgeries that are marked as camp surgeries (linked to patients from a campaign)
    const campSurgeries = surgeries.filter(s => {
        const p = patients.find(pat => pat.id === s.patientId);
        return p && p.campaignId;
    });

    const getPatientsInCamp = (campId: string) => patients.filter(p => p.campaignId === campId);

    const filteredCampaigns = campaigns.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <div className="p-2 bg-teal-100 text-teal-600 rounded-xl">
                            <Award size={24} />
                        </div>
                        Eye Campaigns & Outreach
                    </h1>
                    <p className="text-sm text-slate-500 mt-1 font-medium">Community screening, champion allocation, and surgical outreach management.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 lg:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search camps..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        {[
                            { id: 'overview', label: 'Active Camps', icon: Table },
                            { id: 'champion', label: 'Champions', icon: UserCheck },
                            { id: 'camp_ot', label: 'Outreach OT', icon: Stethoscope }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === tab.id
                                    ? 'bg-white shadow-md text-teal-700'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <tab.icon size={14} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {activeTab === 'overview' && (
                <>
                    <div className="flex justify-between items-center bg-teal-600 p-4 rounded-2xl text-white shadow-lg shadow-teal-900/10">
                        <div className="flex gap-8 px-4">
                            <div className="flex flex-col">
                                <span className="text-xs font-black uppercase opacity-70">Total Camps</span>
                                <span className="text-2xl font-black">{campaigns.length}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-black uppercase opacity-70">Total Screened</span>
                                <span className="text-2xl font-black">{campaigns.reduce((acc, c) => acc + c.screenedPatients, 0)}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-black uppercase opacity-70">Avg. Success</span>
                                <span className="text-2xl font-black">
                                    {campaigns.length > 0
                                        ? Math.round(campaigns.reduce((acc, c) => acc + (c.screenedPatients / c.targetPatients), 0) / campaigns.length * 100)
                                        : 0}%
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={handleOpenAdd}
                            className="bg-white text-teal-700 hover:bg-teal-50 px-6 py-2.5 rounded-xl flex items-center gap-2 text-xs font-black uppercase tracking-widest shadow-lg transition-all active:scale-95"
                        >
                            <Plus size={16} /> Schedule New Camp
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCampaigns.map((camp) => (
                            <div key={camp.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className={`h-2 w-full ${camp.status === 'Completed' ? 'bg-emerald-500' :
                                    camp.status === 'Active' ? 'bg-blue-500' : 'bg-amber-500'
                                    }`}></div>

                                <div className="p-6 flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-teal-50 transition-colors">
                                            <Building2 className="text-slate-400 group-hover:text-teal-600" size={20} />
                                        </div>
                                        <span className={`px-2.5 py-1 text-xs font-black uppercase tracking-wider rounded-lg border ${camp.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                            camp.status === 'Active' ? 'bg-blue-50 text-blue-700 border-blue-100 animate-pulse' :
                                                'bg-amber-50 text-amber-700 border-amber-100'
                                            }`}>
                                            {camp.status}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-black text-slate-900 mb-1 group-hover:text-teal-600 transition-colors">
                                        {camp.name}
                                    </h3>

                                    <div className="flex items-center gap-4 text-xs font-bold text-slate-400 mb-6">
                                        <div className="flex items-center gap-1.5">
                                            <MapPin size={14} className="text-rose-400" /> {camp.location}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Calendar size={14} className="text-blue-400" /> {new Date(camp.date).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <div className="space-y-4 bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-200">
                                        <div className="flex justify-between items-end">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-slate-400 uppercase">Screened / Target</span>
                                                <span className="text-sm font-black text-slate-900">{getPatientsInCamp(camp.id).length} / {camp.targetPatients}</span>
                                            </div>
                                            <span className="text-xs font-black text-teal-600">
                                                {Math.round((getPatientsInCamp(camp.id).length / camp.targetPatients) * 100)}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-1000 ease-out ${camp.status === 'Completed' ? 'bg-emerald-500' : 'bg-teal-500'}`}
                                                style={{ width: `${Math.min(100, (getPatientsInCamp(camp.id).length / camp.targetPatients) * 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex justify-between items-center">
                                    <span className="text-xs font-mono text-slate-400">#{camp.id}</span>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleOpenEdit(camp)}
                                            className="p-2 hover:bg-white hover:text-blue-600 rounded-lg text-slate-400 transition-all"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Delete this campaign?')) deleteCampaign(camp.id);
                                            }}
                                            className="p-2 hover:bg-white hover:text-rose-600 rounded-lg text-slate-400 transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <div className="w-px h-4 bg-slate-200 mx-1"></div>
                                        <button
                                            onClick={() => {
                                                setSelectedCampForView(camp);
                                                setShowDetailsModal(true);
                                            }}
                                            className="text-teal-600 text-xs font-black uppercase tracking-widest hover:underline flex items-center gap-1 transition-all"
                                        >
                                            Details <ArrowUpRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Champion Schedule Tab */}
            {activeTab === 'champion' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div>
                            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                <UserCheck className="text-teal-600" /> Champion & Resource Allocation
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">Coordinate clinical staff deployment for community outreach.</p>
                        </div>
                        <div className="flex gap-2">
                            <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-50 shadow-sm flex items-center gap-2">
                                <Download size={14} /> Export Schedule
                            </button>
                            <button className="bg-teal-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-teal-700 shadow-md flex items-center gap-2">
                                <Plus size={14} /> Assign Team
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50/50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 tracking-widest">Campaign Information</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 tracking-widest">Location & Slot</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 tracking-widest">Lead Champion</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 tracking-widest">Assigned Staff</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 tracking-widest">Deployment</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 tracking-widest text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {campaigns.map(camp => (
                                    <tr key={camp.id} className="hover:bg-slate-50/50 group transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-black text-slate-900">{camp.name}</p>
                                            <p className="text-xs font-mono text-slate-400">ID: {camp.id}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><MapPin size={12} className="text-rose-400" /> {camp.location}</p>
                                                <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5"><Calendar size={12} className="text-blue-400" /> {camp.date}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-black text-xs shadow-sm">
                                                    CH
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-slate-800">Dr. Arshad Khan</p>
                                                    <p className="text-xs font-bold text-slate-400">Phaco Specialist</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex -space-x-2">
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className="w-7 h-7 rounded-lg border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-black">
                                                        S{i}
                                                    </div>
                                                ))}
                                                <div className="w-7 h-7 rounded-lg border-2 border-white bg-teal-600 text-white flex items-center justify-center text-[10px] font-black">
                                                    +2
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-tighter ${camp.status === 'Active' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${camp.status === 'Active' ? 'bg-blue-600 animate-ping' : 'bg-slate-400'}`}></div>
                                                {camp.status === 'Active' ? 'Deployed' : 'Standby'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-teal-600 transition-all">
                                                <ChevronRight size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Camp OT Schedule Tab */}
            {activeTab === 'camp_ot' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 bg-rose-50/30">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                            <div className="space-y-1">
                                <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                    <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
                                        <Stethoscope size={24} />
                                    </div>
                                    Specialized Outreach OT
                                </h3>
                                <p className="text-sm font-medium text-slate-500">Managing surgical pipelines generated from community screening drives.</p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <div className="bg-white p-1 rounded-xl border border-slate-200 flex items-center pr-3">
                                    <div className="bg-slate-100 p-2 rounded-lg text-slate-500 mr-2">
                                        <Filter size={16} />
                                    </div>
                                    <select className="bg-transparent border-none text-xs font-black uppercase tracking-widest outline-none cursor-pointer pr-4">
                                        <option>All Active Camps</option>
                                        {campaigns.map(c => <option key={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <button className="bg-rose-600 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-700 shadow-lg shadow-rose-900/10 active:scale-95 transition-all">
                                    Block Mass OT Slot
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12">
                        <div className="lg:col-span-3 border-r border-slate-100 p-8 space-y-8 bg-slate-50/30">
                            <div>
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Referral Analytics</h4>
                                <div className="space-y-4">
                                    {[
                                        { label: 'Cataract Cases', val: 42, color: 'emerald' },
                                        { label: 'Pterygium', val: 12, color: 'blue' },
                                        { label: 'Glaucoma', val: 8, color: 'rose' },
                                        { label: 'Others', val: 15, color: 'amber' }
                                    ].map(item => (
                                        <div key={item.label} className="space-y-1.5">
                                            <div className="flex justify-between text-xs font-black uppercase">
                                                <span className="text-slate-500">{item.label}</span>
                                                <span className="text-slate-900">{item.val}</span>
                                            </div>
                                            <div className="w-full bg-white h-1 rounded-full overflow-hidden border border-slate-100">
                                                <div className={`h-full bg-${item.color}-500`} style={{ width: `${(item.val / 77) * 100}%` }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-6 bg-rose-600 rounded-2xl text-white shadow-xl shadow-rose-900/20 relative overflow-hidden group">
                                <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                                    <HeartPulse size={120} />
                                </div>
                                <h5 className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">Queue Status</h5>
                                <p className="text-3xl font-black mb-4">77<span className="text-sm opacity-50 font-medium ml-2 text-rose-100">Patients</span></p>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-black tracking-tighter px-2 py-1 bg-white/10 rounded-lg">
                                        <span>PRE-OP READY</span>
                                        <span>24</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-black tracking-tighter px-2 py-1 bg-white/10 rounded-lg">
                                        <span>IN THEATER</span>
                                        <span>02</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-9 p-8">
                            <div className="overflow-hidden border border-slate-100 rounded-2xl shadow-sm">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-900 text-white">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Referred Patient</th>
                                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Procedure</th>
                                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Surgeon</th>
                                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-center">Slot</th>
                                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-right">Workflow</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {campSurgeries.map((surg, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs group-hover:bg-rose-100 group-hover:text-rose-600 transition-colors">
                                                            {surg.patientName.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-slate-900">{surg.patientName}</p>
                                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
                                                                {campaigns.find(c => c.id === patients.find(p => p.id === surg.patientId)?.campaignId)?.name || 'Outreach Referral'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-black uppercase tracking-tighter">
                                                        {surg.procedure}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-black text-slate-600">{surg.surgeon}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-1.5 text-xs font-black text-slate-500 bg-slate-100/50 py-1 rounded-lg">
                                                        <Clock size={12} className="text-teal-500" /> {surg.time}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-black uppercase tracking-tighter border ${surg.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                                                            }`}>
                                                            {surg.status}
                                                        </span>
                                                        <button className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400">
                                                            <ChevronRight size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Schedule New Camp Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-slate-900 p-8 text-white relative">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="absolute right-6 top-6 p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-teal-500 rounded-2xl shadow-lg shadow-teal-500/20">
                                    <MapPin size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-tight">{isEditing ? 'Update Campaign' : 'Schedule New Camp'}</h2>
                                    <p className="text-sm text-slate-400 font-medium">Community outreach and clinical screening drive.</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Campaign Name</label>
                                        <input
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 font-bold focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g. Remote Vision Drive - Chittagong"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Venue / Location</label>
                                        <input
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 font-bold focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            placeholder="e.g. Sonaichari Primary School"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Date</label>
                                        <input
                                            required
                                            type="date"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 font-bold focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Initial Target</label>
                                        <input
                                            required
                                            type="number"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 font-bold focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                                            value={formData.targetPatients}
                                            onChange={(e) => setFormData({ ...formData, targetPatients: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Objective & Status</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['Planned', 'Active', 'Completed'].map(s => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, status: s as any })}
                                                className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${formData.status === s
                                                    ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                                                    : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                                                    }`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-6 py-4 rounded-2xl text-slate-500 font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-colors"
                                >
                                    Dismiss
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] bg-teal-600 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-teal-700 shadow-xl shadow-teal-900/20 active:scale-95 transition-all"
                                >
                                    {isEditing ? 'Commit Changes' : 'Initialize Campaign'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Campaign Details Modal */}
            {showDetailsModal && selectedCampForView && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in duration-300 flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-xl font-black text-slate-900">{selectedCampForView.name} - Screened Patients</h3>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Location: {selectedCampForView.location} | Date: {new Date(selectedCampForView.date).toLocaleDateString()}</p>
                            </div>
                            <button onClick={() => setShowDetailsModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-all">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto">
                            {getPatientsInCamp(selectedCampForView.id).length === 0 ? (
                                <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <Users size={48} className="mx-auto text-slate-300 mb-4" />
                                    <p className="text-slate-500 font-black uppercase tracking-widest text-sm">No patients registered for this camp yet.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {getPatientsInCamp(selectedCampForView.id).map(p => (
                                        <div key={p.id} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-teal-300 transition-all group">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-black text-slate-900 group-hover:text-teal-600 transition-colors">{p.name}</p>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{p.id} | {p.age}Y, {p.gender}</p>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded text-xs font-black uppercase tracking-widest ${p.status === 'OPD' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                    {p.status}
                                                </span>
                                            </div>
                                            <div className="mt-3 pt-3 border-t border-slate-50 flex justify-between items-center">
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <Activity size={12} />
                                                    <span className="text-xs font-bold uppercase">{p.diagnosis || 'General Screening'}</span>
                                                </div>
                                                <button className="text-xs font-black text-teal-600 uppercase tracking-widest hover:underline">View EMR</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                            <button onClick={() => setShowDetailsModal(false)} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">Close View</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Campaigns;
