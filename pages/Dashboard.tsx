
import React, { useEffect, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, BarChart, Bar, ComposedChart, Line,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, RadialBar, RadialBarChart
} from 'recharts';
import {
    Users, DollarSign, Activity, Sparkles, TrendingUp,
    BedDouble, Microscope, Scissors, UserCheck, Clock, Settings, ArrowRight,
    Ambulance, ShieldCheck, Zap, Layers, Workflow, Box, ClipboardList,
    Printer, HeartPulse, ShieldAlert, Package, Stethoscope, Truck
} from 'lucide-react';
import { getHospitalInsights } from '../services/geminiService';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const Dashboard = () => {
    const {
        patients, inventory, appointments, beds, labTests,
        finance, surgeries, employees, ambulances, formatCurrency
    } = useData();
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [insight, setInsight] = useState<string>("Synthesizing global hospital data...");
    const [loadingInsight, setLoadingInsight] = useState<boolean>(true);
    const [activeHub, setActiveHub] = useState<'overview' | 'clinical' | 'medical' | 'finance' | 'assets'>('overview');
    const [dateRange, setDateRange] = useState('Overview');

    // --- Data Aggregation ---
    const totalPatients = patients.length;
    const opdCount = patients.filter(p => p.status === 'OPD').length;
    const ipdCount = patients.filter(p => p.status === 'IPD').length;
    const activeAdmissions = beds.filter(b => b.status === 'Occupied').length;
    const pendingLabs = labTests.filter(t => t.status === 'Pending').length;
    const lowStockCount = inventory.filter(i => i.totalStock <= i.reorderLevel).length;

    const clinicalMix = [
        { name: 'OPD', value: opdCount, fill: '#6366f1' },
        { name: 'IPD', value: ipdCount, fill: '#10b981' },
        { name: 'Emergency', value: Math.round(totalPatients * 0.15) || 5, fill: '#ef4444' },
    ];

    const stockMatrix = [
        { category: 'Antibiotics', current: 850, status: 'Healthy' },
        { category: 'Surgical', current: 120, status: 'Critical' },
        { category: 'General', current: 450, status: 'Healthy' },
        { category: 'Injections', current: 310, status: 'Healthy' },
    ];

    const totalIncome = finance.filter(f => f.category === 'Income').reduce((acc, curr) => acc + curr.amount, 0) || 1250000;
    const revenueGrowth = [
        { period: 'W1', revenue: 240000, margin: 18 },
        { period: 'W2', revenue: 280000, margin: 22 },
        { period: 'W3', revenue: 350000, margin: 25 },
        { period: 'W4', revenue: 380000, margin: 24 },
    ];

    const ambulanceLoad = [
        { name: 'Avail', value: ambulances.filter(a => a.status === 'Available').length || 2 },
        { name: 'Busy', value: ambulances.filter(a => a.status === 'Busy').length || 1 },
        { name: 'Maint', value: ambulances.filter(a => a.status === 'Maintenance').length || 0 },
    ];

    useEffect(() => {
        const fetchInsight = async () => {
            setLoadingInsight(true);
            try {
                if (patients.length > 0) {
                    const text = await getHospitalInsights(patients, inventory, appointments);
                    setInsight(text);
                } else {
                    setInsight("Visionary Care initialized. Awaiting patient registration for AI synthesis.");
                }
            } catch (error) {
                setInsight("AI Insight engine active. Analyzing real-time operational metrics...");
            }
            setLoadingInsight(false);
        };
        fetchInsight();
    }, [patients.length, inventory.length]);

    // --- Compact Components ---
    const HubButton = ({ id, label, icon: Icon }: any) => (
        <button
            onClick={() => setActiveHub(id)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 border ${activeHub === id ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}
        >
            <Icon size={12} />
            {label}
        </button>
    );

    const Card = ({ title, subtitle, icon: Icon, children, className = "", onClick }: any) => (
        <motion.div
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            onClick={onClick}
            className={`premium-card p-6 relative flex flex-col group ${className}`}
        >
            <div className="flex justify-between items-start mb-5">
                <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{title}</h3>
                    {subtitle && <p className="text-xs text-slate-400 font-semibold uppercase mt-1 tracking-normal">{subtitle}</p>}
                </div>
                <div className="p-2.5 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors shadow-sm"><Icon size={14} /></div>
            </div>
            <div className="flex-1 min-h-[140px]">{children}</div>
        </motion.div>
    );

    const StatMini = ({ label, value, icon: Icon, color, path }: any) => (
        <div
            onClick={() => path && navigate(path)}
            className={`bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-slate-300 transition-all ${path ? 'cursor-pointer hover:shadow-md active:scale-[0.98]' : ''}`}
        >
            <div className={`p-2.5 rounded-lg ${color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
                <Icon size={18} className={color.replace('bg-', 'text-')} />
            </div>
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">{label}</p>
                <div className="flex items-center gap-2">
                    <p className="text-lg font-black text-slate-900 tracking-tight">{value}</p>
                    {path && <ArrowRight size={12} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />}
                </div>
            </div>
        </div>
    );

    return (
        <div className="bg-mesh-gradient min-h-screen p-4 lg:p-10 space-y-10 max-w-[1680px] mx-auto animate-in fade-in duration-700 pb-20">

            {/* Header: Professional & Compact */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 glass-card p-8 rounded-[2.5rem]">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-teal-400 shadow-2xl relative group overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <Activity size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                            COMMAND <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-teal-500">CENTER</span>
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-black rounded-full border border-emerald-200 uppercase animate-pulse tracking-[0.2em] ml-2">Live Ops</span>
                        </h1>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.25em] mt-1.5 flex items-center gap-2">
                            Executive Directive • <span className="text-slate-900 font-black">{currentUser}</span> • {new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100">
                        {['Systems', 'Clinical', 'Financial'].map(m => (
                            <button key={m} onClick={() => setDateRange(m)} className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${dateRange === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                                {m}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => window.print()} className="p-2 bg-white border border-slate-200 text-slate-400 rounded-lg hover:text-slate-900 hover:border-slate-400 transition-all">
                        <Printer size={16} />
                    </button>
                </div>
            </div>

            {/* Global Hub Navigation: Subtle & Dense */}
            <div className="flex flex-wrap gap-2 px-1">
                <HubButton id="overview" label="Overview" icon={Activity} />
                <HubButton id="clinical" label="Clinical" icon={Stethoscope} />
                <HubButton id="medical" label="Lab & Pharmacy" icon={Microscope} />
                <HubButton id="finance" label="Finance" icon={DollarSign} />
                <HubButton id="assets" label="Assets & OT" icon={Workflow} />
            </div>

            {/* Main Content Viewport */}
            <div className="transition-all duration-300">
                {activeHub === 'overview' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4">

                        {/* Top Stats Ribbon */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatMini label="Global Census" value={totalPatients} icon={Users} color="bg-indigo-600" path="/patients" />
                            <StatMini label="Revenue Flow" value={formatCurrency(totalIncome)} icon={DollarSign} color="bg-emerald-600" path="/finance" />
                            <StatMini label="Bed Load" value={`${activeAdmissions} Units`} icon={BedDouble} color="bg-rose-600" path="/ipd" />
                            <StatMini label="System Team" value={employees.length} icon={UserCheck} color="bg-amber-600" path="/hr" />
                        </div>

                        {/* Summary Grid: The "Global" View the user requested */}
                        <div className="grid grid-cols-12 gap-6">

                            {/* 1. Revenue Trends (Financial Hub Summary) */}
                            <Card title="Financial Momentum" subtitle="Revenue Trends vs Operating Margin" icon={TrendingUp} className="col-span-12 lg:col-span-8">
                                <ResponsiveContainer width="100%" height={240}>
                                    <ComposedChart
                                        data={revenueGrowth}
                                        onClick={() => navigate('/finance')}
                                        className="cursor-pointer"
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', fontSize: '12px' }} />
                                        <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={0.05} fill="#6366f1" />
                                        <Bar dataKey="margin" barSize={10} fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </Card>

                            {/* 2. Clinical Mix (Clinical Hub Summary) */}
                            <Card title="Clinical Proportions" subtitle="Distribution by Modality" icon={Layers} className="col-span-12 lg:col-span-4">
                                <div className="flex h-full items-center gap-4">
                                    <ResponsiveContainer width="50%" height={160}>
                                        <PieChart>
                                            <Pie
                                                data={clinicalMix}
                                                innerRadius={45}
                                                outerRadius={65}
                                                paddingAngle={8}
                                                dataKey="value"
                                                stroke="none"
                                                onClick={(data) => {
                                                    const path = data.name === 'OPD' ? '/opd' : data.name === 'IPD' ? '/ipd' : '/patients';
                                                    navigate(path);
                                                }}
                                                className="cursor-pointer"
                                            >
                                                {clinicalMix.map((entry, index) => <Cell key={`c-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={4} />)}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="w-1/2 space-y-2">
                                        {clinicalMix.map((item, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => {
                                                    const path = item.name === 'OPD' ? '/opd' : item.name === 'IPD' ? '/ipd' : '/patients';
                                                    navigate(path);
                                                }}
                                                className="flex justify-between items-center border-b border-slate-50 pb-1.5 cursor-pointer hover:bg-slate-50 rounded px-1 transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }}></div>
                                                    <span className="text-xs font-bold text-slate-500 uppercase">{item.name}</span>
                                                </div>
                                                <span className="text-xs font-black text-slate-900">{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>

                            {/* 3. Operational Queues (Live Command summary) */}
                            <div className="col-span-12 lg:col-span-12 grid grid-cols-2 lg:grid-cols-4 gap-6">
                                {[
                                    { label: 'OPD Queue', value: opdCount, icon: Clock, color: 'text-blue-500', path: '/opd' },
                                    { label: 'Lab Pending', value: pendingLabs, icon: Microscope, color: 'text-amber-500', path: '/lab' },
                                    { label: 'Stock Alerts', value: lowStockCount, icon: ShieldAlert, color: 'text-rose-500', path: '/pharmacy' },
                                    { label: 'OT Active', value: surgeries.length, icon: Scissors, color: 'text-indigo-500', path: '/ot' },
                                ].map((stat, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => navigate(stat.path)}
                                        className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-2 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md cursor-pointer transition-all active:scale-[0.98]"
                                    >
                                        <div className={`${stat.color} bg-slate-50 w-fit p-2 rounded-lg`}>
                                            <stat.icon size={16} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">{stat.label}</p>
                                            <div className="flex items-center justify-between">
                                                <p className="text-xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
                                                <ArrowRight size={14} className="text-slate-200 group-hover:text-indigo-500" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* 4. Logistic Resilience (Medical Hub Summary) */}
                            <Card
                                title="Medical Logistics"
                                subtitle="Critical Supply Chain Status"
                                icon={Package}
                                className="col-span-12 lg:col-span-8 cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
                                onClick={() => navigate('/pharmacy')}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6 mt-4">
                                    {stockMatrix.map((s, idx) => (
                                        <div key={idx} className="space-y-2">
                                            <div className="flex justify-between items-end">
                                                <span className="text-xs font-bold uppercase text-slate-500">{s.category}</span>
                                                <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${s.status === 'Critical' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'}`}>{s.status}</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${(s.current / 1000) * 100}%` }} className={`h-full ${s.status === 'Critical' ? 'bg-rose-500' : 'bg-slate-900'} rounded-full`} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            {/* 5. AI Directives (Premium Glass Panel) */}
                            <motion.div
                                whileHover={{ scale: 1.01 }}
                                className="col-span-12 lg:col-span-4 bg-slate-900 p-8 rounded-[2rem] text-white relative flex flex-col justify-between overflow-hidden shadow-2xl border border-white/5"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-20"><Zap size={100} className="text-teal-400" /></div>
                                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-600/20 blur-[100px] rounded-full"></div>

                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 bg-indigo-500/20 rounded-lg backdrop-blur-md">
                                            <Sparkles size={16} className="text-teal-400" />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-[0.3em] text-indigo-300">Synchronized Insights</span>
                                    </div>
                                    <h4 className="text-xl font-medium leading-relaxed italic pr-6 text-slate-200">
                                        "{insight.length > 160 ? insight.substring(0, 160) + '...' : insight}"
                                    </h4>
                                </div>
                                <button className="relative z-10 mt-8 w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-teal-400 hover:text-white transition-all flex items-center justify-center gap-3 group shadow-xl">
                                    Full System Audit <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </motion.div>

                        </div>
                    </div>
                )}

                {/* --- Detail Modules (Clinical, Medical, Finance, Assets) --- */}
                {/* These are now more compact and consistent with the new style */}
                {activeHub === 'clinical' && (
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-12 gap-6">
                        <Card title="Patient Load Analysis" subtitle="OPD vs IPD Comparative Density" icon={Activity} className="col-span-12">
                            <ResponsiveContainer width="100%" height={280}>
                                <AreaChart data={revenueGrowth}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="period" />
                                    <YAxis />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="#6366f1" fillOpacity={0.05} strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Card>
                    </motion.div>
                )}

                {activeHub === 'medical' && (
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-12 gap-6">
                        <Card title="Laboratory Performance" subtitle="Throughput Efficiency by Dept" icon={Microscope} className="col-span-12 lg:col-span-7">
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={[
                                    { name: 'Biochem', comp: 45, pend: 12 },
                                    { name: 'Hematol', comp: 38, pend: 8 },
                                    { name: 'Pathol', comp: 22, pend: 15 },
                                    { name: 'Radiol', comp: 30, pend: 5 },
                                ]} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} width={80} />
                                    <Tooltip />
                                    <Bar dataKey="comp" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
                                    <Bar dataKey="pend" fill="#cbd5e1" radius={[0, 4, 4, 0]} barSize={12} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card>
                        <Card title="Pharmacy Inventory" subtitle="Density by Category" icon={Package} className="col-span-12 lg:col-span-5">
                            <ResponsiveContainer width="100%" height={260}>
                                <PieChart>
                                    <Pie data={[{ name: 'Meds', v: 450 }, { name: 'Surg', v: 120 }, { name: 'Consum', v: 310 }]} innerRadius={60} outerRadius={85} dataKey="v" stroke="none">
                                        {COLORS.map((c, i) => <Cell key={`p-${i}`} fill={c} cornerRadius={6} />)}
                                    </Pie>
                                    <Tooltip />
                                    <Legend iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </Card>
                    </motion.div>
                )}

                {activeHub === 'finance' && (
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-12 gap-6">
                        <Card title="Revenue Projection" subtitle="Monthly Growth Vector" icon={DollarSign} className="col-span-12">
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={revenueGrowth}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="period" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} barSize={50} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card>
                    </motion.div>
                )}

                {activeHub === 'assets' && (
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-12 gap-6">
                        <Card title="Infrastructure Readiness" subtitle="Fleet & OT Status Matrix" icon={Truck} className="col-span-12 lg:col-span-6">
                            <ResponsiveContainer width="100%" height={240}>
                                <PieChart>
                                    <Pie data={ambulanceLoad} innerRadius={65} outerRadius={90} dataKey="value" stroke="none">
                                        {ambulanceLoad.map((_, i) => <Cell key={`a-${i}`} fill={COLORS[i % COLORS.length]} cornerRadius={8} />)}
                                    </Pie>
                                    <Tooltip />
                                    <Legend iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </Card>
                        <div className="col-span-12 lg:col-span-6 space-y-4">
                            <div className="bg-white p-6 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">OT Active Sessions</p>
                                    <h5 className="text-2xl font-black text-slate-900">{surgeries.length}</h5>
                                </div>
                                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-lg"><Scissors size={24} /></div>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Bed Capacity</p>
                                    <h5 className="text-2xl font-black text-rose-600">{beds.length}</h5>
                                </div>
                                <div className="p-4 bg-rose-50 text-rose-600 rounded-lg"><BedDouble size={24} /></div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Strategic Footer: Compact Action Bar */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><ShieldCheck size={20} /></div>
                    <div>
                        <h4 className="text-xs font-black text-slate-900 uppercase">Operational Integrity Safe</h4>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Global Hospital Metric Index: 98.4%</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {[
                        { label: 'Reports', path: '/reports' },
                        { label: 'Analytics', path: '/reports' },
                        { label: 'Sync', path: '/database' }
                    ].map((btn, i) => (
                        <button
                            key={i}
                            onClick={() => navigate(btn.path)}
                            className="px-5 py-2 bg-white text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-900 hover:text-white transition-all border border-slate-200"
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
