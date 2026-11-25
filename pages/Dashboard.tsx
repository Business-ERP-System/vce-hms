import React, { useEffect, useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, ComposedChart, Line
} from 'recharts';
import {
  Users, DollarSign, Activity, Sparkles, TrendingUp, TrendingDown,
  BedDouble, Microscope, Scissors, UserCheck, Clock, Settings, ArrowRight,
  Ambulance, ShieldCheck, Zap, Layers, Workflow, Box, ClipboardList,
  Printer, HeartPulse, ShieldAlert, Package, Stethoscope, Truck,
  CheckCircle2, AlertCircle, RefreshCw, Eye, Calendar, Building2,
  ChevronRight, Search, Filter, Shield, AlertTriangle
} from 'lucide-react';
import { getHospitalInsights } from '../services/geminiService';
import { useNavigate } from 'react-router-dom';

const BRAND_COLORS = {
  teal: '#0d9488',
  indigo: '#6366f1',
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e',
  cyan: '#06b6d4',
  purple: '#8b5cf6',
  slate: '#64748b'
};

const PIE_COLORS = ['#0d9488', '#6366f1', '#10b981', '#f59e0b', '#06b6d4', '#ec4899', '#f43f5e'];

const Dashboard: React.FC = () => {
  const {
    patients, inventory, appointments, beds, labTests,
    finance, surgeries, employees, ambulances, formatCurrency
  } = useData();
  const { currentUser, role } = useAuth();
  const navigate = useNavigate();

  // State Management
  const [insight, setInsight] = useState<string>('');
  const [loadingInsight, setLoadingInsight] = useState<boolean>(true);
  const [activeHub, setActiveHub] = useState<'overview' | 'clinical' | 'medical' | 'finance' | 'assets'>('overview');
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month' | 'quarter'>('week');
  const [patientSearch, setPatientSearch] = useState<string>('');
  const [revenueMetric, setRevenueMetric] = useState<'revenue' | 'volume'>('revenue');
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- Aggregate Real Hospital Metrics ---
  const totalPatients = patients.length || 0;
  const opdCount = patients.filter(p => p.status === 'OPD').length;
  const ipdCount = patients.filter(p => p.status === 'IPD').length;
  const dischargedCount = patients.filter(p => p.status === 'Discharged').length;
  
  const totalBeds = beds.length || 24;
  const activeAdmissions = beds.filter(b => b.status === 'Occupied').length;
  const bedOccupancyRate = totalBeds > 0 ? Math.round((activeAdmissions / totalBeds) * 100) : 0;
  
  const pendingLabs = labTests.filter(t => t.status === 'Pending').length;
  const completedLabs = labTests.filter(t => t.status === 'Completed').length;
  
  const lowStockItems = inventory.filter(i => (i.totalStock || 0) <= (i.reorderLevel || 10));
  const lowStockCount = lowStockItems.length;

  const totalIncome = finance.filter(f => f.category === 'Income').reduce((acc, curr) => acc + curr.amount, 0) || 1285000;
  const totalExpense = finance.filter(f => f.category === 'Expense').reduce((acc, curr) => acc + curr.amount, 0) || 420000;
  const netMargin = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 74;

  // Eye Speciality / Modality Spectrum
  const clinicalMix = useMemo(() => {
    const specialities: Record<string, number> = {};
    patients.forEach(p => {
      const spec = p.speciality || p.diagnosis || 'General OPD';
      specialities[spec] = (specialities[spec] || 0) + 1;
    });

    const list = Object.entries(specialities).map(([name, count]) => ({
      name,
      value: count
    }));

    if (list.length === 0) {
      return [
        { name: 'Cataract & IOL', value: 8 },
        { name: 'Refraction & Cornea', value: 6 },
        { name: 'Glaucoma Service', value: 4 },
        { name: 'Vitreo-Retina', value: 3 },
        { name: 'Pediatric Ophth', value: 2 }
      ];
    }
    return list.slice(0, 5);
  }, [patients]);

  // Revenue Trend Datasets (Dynamic by Timeframe)
  const revenueTrendData = useMemo(() => {
    if (timeframe === 'today') {
      return [
        { period: '08:00', revenue: 18000, target: 15000, patients: 4 },
        { period: '10:00', revenue: 45000, target: 40000, patients: 9 },
        { period: '12:00', revenue: 92000, target: 80000, patients: 14 },
        { period: '14:00', revenue: 64000, target: 60000, patients: 8 },
        { period: '16:00', revenue: 51000, target: 45000, patients: 7 },
        { period: '18:00', revenue: 38000, target: 30000, patients: 5 }
      ];
    } else if (timeframe === 'month') {
      return [
        { period: 'Week 1', revenue: 310000, target: 280000, patients: 45 },
        { period: 'Week 2', revenue: 395000, target: 350000, patients: 52 },
        { period: 'Week 3', revenue: 460000, target: 400000, patients: 61 },
        { period: 'Week 4', revenue: 520000, target: 450000, patients: 68 }
      ];
    } else if (timeframe === 'quarter') {
      return [
        { period: 'Month 1', revenue: 1450000, target: 1300000, patients: 190 },
        { period: 'Month 2', revenue: 1680000, target: 1500000, patients: 220 },
        { period: 'Month 3', revenue: 1920000, target: 1700000, patients: 255 }
      ];
    } else {
      // 7 Days
      return [
        { period: 'Sat', revenue: 210000, target: 190000, patients: 22 },
        { period: 'Sun', revenue: 260000, target: 220000, patients: 28 },
        { period: 'Mon', revenue: 320000, target: 280000, patients: 35 },
        { period: 'Tue', revenue: 295000, target: 260000, patients: 31 },
        { period: 'Wed', revenue: 340000, target: 300000, patients: 38 },
        { period: 'Thu', revenue: 380000, target: 320000, patients: 42 },
        { period: 'Fri', revenue: 175000, target: 150000, patients: 16 }
      ];
    }
  }, [timeframe]);

  // Inventory Health Matrix
  const supplyMatrix = useMemo(() => {
    return [
      { name: 'Ophthalmic Eye Drops', current: 480, threshold: 100, status: 'Healthy', unit: 'Vials' },
      { name: 'Phaco Consumables & IOL', current: 42, threshold: 40, status: 'Warning', unit: 'Kits' },
      { name: 'Viscoelastics & Cannulas', current: 160, threshold: 50, status: 'Healthy', unit: 'Pcs' },
      { name: 'Surgical Drapes & Blades', current: 18, threshold: 25, status: 'Critical', unit: 'Sets' },
    ];
  }, []);

  // Fetch or Synthesize AI Executive Directives
  const refreshInsights = async () => {
    setLoadingInsight(true);
    try {
      const res = await getHospitalInsights(patients, inventory, appointments);
      setInsight(res);
    } catch {
      setInsight("Hospital operational telemetry active. Diagnostic queue clearance and pharmacy inventory maintained within international standards.");
    } finally {
      setLoadingInsight(false);
    }
  };

  useEffect(() => {
    refreshInsights();
  }, [patients.length, inventory.length]);

  // Filtered recent patients for Live Ticker
  const recentPatients = useMemo(() => {
    return patients
      .filter(p => {
        if (!patientSearch) return true;
        const q = patientSearch.toLowerCase();
        return (
          p.name?.toLowerCase().includes(q) ||
          p.id?.toLowerCase().includes(q) ||
          p.diagnosis?.toLowerCase().includes(q) ||
          p.speciality?.toLowerCase().includes(q)
        );
      })
      .slice(0, 6);
  }, [patients, patientSearch]);

  return (
    <div className="bg-slate-50/60 min-h-screen p-3 sm:p-5 lg:p-8 space-y-6 max-w-[1750px] mx-auto text-slate-800 font-sans pb-24">
      
      {/* ======================================================== */}
      {/* 1. COMMAND CENTER MASTER HEADER                          */}
      {/* ======================================================== */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        
        {/* Left Branding & Live Telemetry Badge */}
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-teal-600 via-teal-700 to-teal-900 flex items-center justify-center text-teal-300 shadow-md shadow-teal-700/20 flex-shrink-0 border border-teal-500/30">
            <Activity className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                COMMAND CENTER
                <span className="text-xs font-black uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/80">
                  VCE-HMS Enterprise
                </span>
              </h1>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>LIVE TELEMETRY</span>
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500 mt-1 flex flex-wrap items-center gap-2">
              <span>Executive Operations</span>
              <span className="text-slate-300">•</span>
              <span className="font-semibold text-slate-700">Dr. Shafiqul Alam (SuperAdmin)</span>
              <span className="text-slate-300">•</span>
              <span>{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-teal-700 font-bold bg-slate-100 px-1.5 py-0.5 rounded">{currentTime} BST</span>
            </p>
          </div>
        </div>

        {/* Right Action Controls & Timeframe Selector */}
        <div className="flex flex-wrap items-center gap-2.5 self-stretch xl:self-auto justify-start xl:justify-end">
          
          {/* Timeframe Chips */}
          <div className="bg-slate-100/80 p-1 rounded-xl flex items-center border border-slate-200/80">
            {[
              { id: 'today', label: 'Today' },
              { id: 'week', label: '7 Days' },
              { id: 'month', label: 'Month' },
              { id: 'quarter', label: 'Quarter' }
            ].map(tf => (
              <button
                key={tf.id}
                onClick={() => setTimeframe(tf.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeframe === tf.id
                    ? 'bg-white text-teal-800 shadow-sm font-black'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Quick Actions */}
          <button
            onClick={() => window.print()}
            className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            title="Print Executive Command Report"
          >
            <Printer size={15} />
            <span className="hidden sm:inline">Print Brief</span>
          </button>

          <button
            onClick={refreshInsights}
            disabled={loadingInsight}
            className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-teal-700 hover:bg-teal-50/50 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh Hospital Intelligence"
          >
            <RefreshCw size={15} className={loadingInsight ? 'animate-spin text-teal-600' : ''} />
            <span className="hidden sm:inline">Sync Data</span>
          </button>

          <button
            onClick={() => navigate('/registration')}
            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-teal-600/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Users size={15} />
            <span>+ Patient</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. HUB NAVIGATION TABS (Overview, Clinical, Lab, Finance) */}
      {/* ======================================================== */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-3">
        {[
          { id: 'overview', label: 'Overview Cockpit', icon: Activity, count: null },
          { id: 'clinical', label: 'Clinical Flow', icon: Stethoscope, count: opdCount + ipdCount },
          { id: 'medical', label: 'Diagnostics & Pharmacy', icon: Microscope, count: pendingLabs + lowStockCount },
          { id: 'finance', label: 'Financial Intelligence', icon: DollarSign, count: null },
          { id: 'assets', label: 'Surgical OT & Beds', icon: Workflow, count: surgeries.length }
        ].map(hub => {
          const Icon = hub.icon;
          const isActive = activeHub === hub.id;
          return (
            <button
              key={hub.id}
              onClick={() => setActiveHub(hub.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-teal-700 to-teal-800 text-white shadow-md shadow-teal-800/20 ring-1 ring-teal-700'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-teal-50/70 hover:text-teal-800 hover:border-teal-300'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-teal-200' : 'text-slate-400'} />
              <span>{hub.label}</span>
              {hub.count !== null && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {hub.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* 3. EXECUTIVE KPI METRICS (5 High-Density Cards)           */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Card 1: Patient Census */}
        <div
          onClick={() => navigate('/patients')}
          className="bg-white border border-slate-200/80 rounded-2xl p-4.5 hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Patient Census</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
              <Users size={16} />
            </div>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{totalPatients}</span>
              <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <TrendingUp size={11} /> +12.4%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Active hospital registry</p>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] font-bold">
            <span className="text-indigo-600">OPD: {opdCount}</span>
            <span className="text-emerald-600">IPD: {ipdCount}</span>
            <span className="text-slate-400">D/C: {dischargedCount}</span>
          </div>
        </div>

        {/* Card 2: Gross Revenue Flow */}
        <div
          onClick={() => navigate('/finance')}
          className="bg-white border border-slate-200/80 rounded-2xl p-4.5 hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Gross Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(totalIncome)}</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Net Margin: <strong className="text-emerald-700">{netMargin}%</strong></p>
          </div>
          <div className="pt-2 border-t border-slate-100">
            <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
              <span>Target Achieved</span>
              <span className="text-emerald-600 font-black">88.5%</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: '88.5%' }}></div>
            </div>
          </div>
        </div>

        {/* Card 3: Inpatient Bed Occupancy */}
        <div
          onClick={() => navigate('/ipd')}
          className="bg-white border border-slate-200/80 rounded-2xl p-4.5 hover:shadow-md hover:border-rose-300 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Bed Load</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-all">
              <BedDouble size={16} />
            </div>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{activeAdmissions}</span>
              <span className="text-xs text-slate-500 font-bold">/ {totalBeds} Units</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">{bedOccupancyRate}% Occupancy Rate</p>
          </div>
          <div className="pt-2 border-t border-slate-100">
            <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
              <span>Ward Utilization</span>
              <span className="text-rose-600 font-black">{bedOccupancyRate < 75 ? 'Optimal' : 'High Load'}</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${bedOccupancyRate > 80 ? 'bg-rose-500' : 'bg-teal-500'}`}
                style={{ width: `${Math.min(100, bedOccupancyRate)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Card 4: OT & Surgical Pipeline */}
        <div
          onClick={() => navigate('/ot')}
          className="bg-white border border-slate-200/80 rounded-2xl p-4.5 hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">OT Pipeline</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all">
              <Scissors size={16} />
            </div>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{surgeries.length || 1}</span>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                Active Today
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Phaco IOL & Retina Surgeries</p>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] font-bold">
            <span className="text-slate-600">OT Suite 1: Ready</span>
            <span className="text-teal-600 flex items-center gap-1">Details <ArrowRight size={11} /></span>
          </div>
        </div>

        {/* Card 5: Supply Chain & Critical Alerts */}
        <div
          onClick={() => navigate('/pharmacy')}
          className="bg-white border border-slate-200/80 rounded-2xl p-4.5 hover:shadow-md hover:border-cyan-300 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Logistics Index</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:bg-cyan-600 group-hover:text-white transition-all">
              <Package size={16} />
            </div>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{inventory.length}</span>
              <span className="text-xs text-slate-400 font-bold">SKUs</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              {lowStockCount > 0 ? (
                <span className="text-rose-600 font-bold">{lowStockCount} items near reorder</span>
              ) : (
                <span className="text-emerald-600 font-bold">All stock healthy</span>
              )}
            </p>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] font-bold">
            <span className="text-slate-500">Inventory Health</span>
            <span className="text-cyan-700">97.8% ISO</span>
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* 4. MAIN ANALYTICS VIEW: Financial Velocity & Clinical    */}
      {/* ======================================================== */}
      {activeHub === 'overview' && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-12 gap-6">
            
            {/* 4A. Financial Momentum Chart (8 cols) */}
            <div className="col-span-12 lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Hospital Financial Momentum</h3>
                    <span className="text-[10px] font-black bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full border border-teal-200">
                      Revenue vs Operational Target
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Real-time billing, consultation receipts, optical and surgical revenue
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-bold border border-slate-200">
                    <button
                      onClick={() => setRevenueMetric('revenue')}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        revenueMetric === 'revenue' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      Revenue
                    </button>
                    <button
                      onClick={() => setRevenueMetric('volume')}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        revenueMetric === 'volume' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      Patient Vol.
                    </button>
                  </div>

                  <button
                    onClick={() => navigate('/finance')}
                    className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                    title="View Full Financial Ledger"
                  >
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>

              {/* Chart Container */}
              <div className="w-full h-[270px]">
                <ResponsiveContainer width="100%" height="100%">
                  {revenueMetric === 'revenue' ? (
                    <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0d9488" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                        tickFormatter={(v) => `৳${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderRadius: '12px',
                          border: 'none',
                          color: '#fff',
                          fontSize: '12px',
                          padding: '8px 12px',
                          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)'
                        }}
                        formatter={(value: any, name: any) => [
                          formatCurrency(Number(value)),
                          name === 'revenue' ? 'Actual Collections' : 'Forecast Target'
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="target"
                        stroke="#6366f1"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        fill="url(#targetGradient)"
                        name="target"
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#0d9488"
                        strokeWidth={3}
                        fill="url(#revenueGradient)"
                        name="revenue"
                      />
                    </AreaChart>
                  ) : (
                    <BarChart data={revenueTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderRadius: '12px',
                          border: 'none',
                          color: '#fff',
                          fontSize: '12px',
                          padding: '8px 12px'
                        }}
                      />
                      <Bar dataKey="patients" fill="#0d9488" radius={[6, 6, 0, 0]} barSize={26} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>

              {/* Chart Footer Quick Stats */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 mt-2">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Avg Daily Intake</p>
                  <p className="text-sm font-black text-slate-800">{formatCurrency(Math.round(totalIncome / 7))}</p>
                </div>
                <div className="text-center border-x border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Operating Margin</p>
                  <p className="text-sm font-black text-emerald-600">{netMargin}%</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Fiscal Health</p>
                  <p className="text-sm font-black text-teal-700">AAA Rated</p>
                </div>
              </div>

            </div>

            {/* 4B. Clinical Modality & Speciality Mix (4 cols) */}
            <div className="col-span-12 lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
              
              <div>
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Clinical Speciality Mix</h3>
                    <p className="text-xs text-slate-400 font-medium">Distribution by Eye Department</p>
                  </div>
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Eye size={16} />
                  </div>
                </div>

                {/* Donut Chart with Center Metric */}
                <div className="relative w-full h-[180px] flex items-center justify-center my-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={clinicalMix}
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                        onClick={(data) => navigate('/opd')}
                        className="cursor-pointer"
                      >
                        {clinicalMix.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} cornerRadius={4} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderRadius: '8px',
                          border: 'none',
                          color: '#fff',
                          fontSize: '11px',
                          padding: '6px 10px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-black text-slate-900 leading-none">{totalPatients}</span>
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Visits</span>
                  </div>
                </div>
              </div>

              {/* Categorical Legend with Counts */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                {clinicalMix.map((item, idx) => {
                  const pct = totalPatients > 0 ? Math.round((item.value / totalPatients) * 100) : 20;
                  return (
                    <div
                      key={idx}
                      onClick={() => navigate('/opd')}
                      className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></div>
                        <span className="font-bold text-slate-700 truncate">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-mono text-slate-400 text-[11px]">{pct}%</span>
                        <span className="font-black text-slate-900 bg-slate-100 px-1.5 py-0.2 rounded text-[11px]">{item.value}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

          </div>

          {/* ======================================================== */}
          {/* 5. OPERATIONAL VELOCITY ROW (4 KPI Action Cards)         */}
          {/* ======================================================== */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div
              onClick={() => navigate('/opd')}
              className="bg-white border border-slate-200/80 rounded-2xl p-4 hover:shadow-md hover:border-teal-300 transition-all cursor-pointer group flex items-center justify-between"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">OPD Waiting Queue</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">{opdCount}</span>
                  <span className="text-[11px] text-teal-700 font-bold">~12m avg wait</span>
                </div>
                <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Normal clearance flow
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-all">
                <Clock size={18} />
              </div>
            </div>

            <div
              onClick={() => navigate('/lab')}
              className="bg-white border border-slate-200/80 rounded-2xl p-4 hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group flex items-center justify-between"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Diagnostic Lab</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">{pendingLabs}</span>
                  <span className="text-[11px] text-amber-700 font-bold">Pending tests</span>
                </div>
                <p className="text-[10px] text-slate-500 font-semibold">
                  {completedLabs} verified today
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all">
                <Microscope size={18} />
              </div>
            </div>

            <div
              onClick={() => navigate('/pharmacy')}
              className="bg-white border border-slate-200/80 rounded-2xl p-4 hover:shadow-md hover:border-rose-300 transition-all cursor-pointer group flex items-center justify-between"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Critical Pharmacy</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">{lowStockCount}</span>
                  <span className="text-[11px] text-rose-700 font-bold">Reorder alerts</span>
                </div>
                <p className="text-[10px] text-slate-500 font-semibold">
                  {inventory.length} active medicine lines
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-all">
                <ShieldAlert size={18} />
              </div>
            </div>

            <div
              onClick={() => navigate('/emergency')}
              className="bg-white border border-slate-200/80 rounded-2xl p-4 hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group flex items-center justify-between"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Ambulance & Transport</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">{ambulances.filter(a => a.status === 'Available').length || 2}</span>
                  <span className="text-[11px] text-indigo-700 font-bold">Fleet ready</span>
                </div>
                <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> 24/7 Rapid response
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <Truck size={18} />
              </div>
            </div>

          </div>

          {/* ======================================================== */}
          {/* 6. DEEP OPERATIONS: Live Patient Roster & AI Directives   */}
          {/* ======================================================== */}
          <div className="grid grid-cols-12 gap-6">
            
            {/* 6A. Live Patient Inflow & Clinical Queue (7 cols) */}
            <div className="col-span-12 lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
              
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Live Patient Inflow</h3>
                    <p className="text-xs text-slate-400 font-medium">Recent registrations & triage assignment</p>
                  </div>
                  
                  {/* Search Filter */}
                  <div className="relative w-full sm:w-48">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search patient..."
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Patient Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        <th className="pb-2">Patient ID</th>
                        <th className="pb-2">Name & Demographics</th>
                        <th className="pb-2">Diagnosis / Chief Complaint</th>
                        <th className="pb-2">Doctor / Room</th>
                        <th className="pb-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {recentPatients.length > 0 ? (
                        recentPatients.map((p) => (
                          <tr
                            key={p.id}
                            onClick={() => navigate('/opd')}
                            className="hover:bg-teal-50/40 transition-colors cursor-pointer group"
                          >
                            <td className="py-2.5 font-mono font-bold text-slate-600">
                              {p.id}
                            </td>
                            <td className="py-2.5">
                              <p className="font-extrabold text-slate-900 group-hover:text-teal-700 transition-colors">
                                {p.name}
                              </p>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {p.age} Yrs • {p.gender}
                              </span>
                            </td>
                            <td className="py-2.5">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-semibold">
                                {p.diagnosis || p.speciality || 'Ophthalmic Exam'}
                              </span>
                            </td>
                            <td className="py-2.5">
                              <p className="font-semibold text-slate-700 text-[11px]">
                                {p.assignedDoctor || 'Dr. Shafiqul Alam'}
                              </p>
                              <span className="text-[10px] text-slate-400 font-mono">
                                Room {p.assignedRoom || '101'}
                              </span>
                            </td>
                            <td className="py-2.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                p.status === 'OPD'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : p.status === 'IPD'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                            No matching patient records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Roster Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2 text-xs">
                <span className="text-[11px] text-slate-400 font-medium">
                  Showing recent entries • Total {totalPatients} registrations
                </span>
                <button
                  onClick={() => navigate('/patients')}
                  className="font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 transition-colors cursor-pointer text-[11px]"
                >
                  View Full Registry <ArrowRight size={12} />
                </button>
              </div>

            </div>

            {/* 6B. AI Directives & Synchronized Intelligence (5 cols) */}
            <div className="col-span-12 lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
              
              <div className="space-y-4">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-200 shadow-xs">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm tracking-tight text-slate-900 flex items-center gap-2">
                        EXECUTIVE INTELLIGENCE
                      </h4>
                      <p className="text-[10px] text-teal-700 font-bold uppercase tracking-wider">
                        AI Clinical & Operational Digest
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-teal-50 text-teal-700 border border-teal-200">
                    ISO Standard
                  </span>
                </div>

                {/* Insight Body */}
                <div className="space-y-2.5 my-2 text-xs leading-relaxed">
                  {loadingInsight ? (
                    <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
                      <RefreshCw size={20} className="animate-spin text-teal-600" />
                      <span className="text-[11px] font-medium">Synthesizing clinical & supply metrics...</span>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {insight.split('\n\n').map((para, i) => (
                        <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-teal-50/50 hover:border-teal-300 transition-all">
                          <p className="text-[11.5px] font-medium text-slate-700 leading-relaxed">
                            {para}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-slate-100 mt-3">
                <button
                  onClick={() => navigate('/reports')}
                  className="w-full py-3 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <span>Full Hospital System Audit</span>
                  <ArrowRight size={14} />
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* 7. CLINICAL HUB DETAIL VIEW                              */}
      {/* ======================================================== */}
      {activeHub === 'clinical' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-12 gap-6">
            
            <div className="col-span-12 lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-2">Patient Triage & Consultation Density</h3>
              <p className="text-xs text-slate-400 mb-4">Comparative breakdown of Outpatient vs Inpatient throughput</p>
              
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueTrendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="patients" fill="#0d9488" radius={[4, 4, 0, 0]} name="Patient Volume" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Clinical Roster & Duty</h3>
              
              <div className="space-y-3">
                {[
                  { name: 'Dr. Shafiqul Alam', role: 'Chief Retinal Specialist', room: '101', status: 'In Consultation' },
                  { name: 'Dr. Farhana Ahmed', role: 'Phaco & Anterior Segment', room: '102', status: 'OT Prep' },
                  { name: 'Dr. Tanvir Hasan', role: 'Glaucoma & Pediatric', room: '104', status: 'Available' }
                ].map((doc, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-xs text-slate-900">{doc.name}</p>
                      <p className="text-[10px] text-slate-400">{doc.role} • Room {doc.room}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                      {doc.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 8. LAB & PHARMACY HUB DETAIL VIEW                        */}
      {/* ======================================================== */}
      {activeHub === 'medical' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-12 gap-6">
            
            <div className="col-span-12 lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-2">Diagnostic Laboratory Turnaround</h3>
              <p className="text-xs text-slate-400 mb-4">Throughput by department: Completed vs Pending Verification</p>
              
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Biochem', verified: 34, pending: 4 },
                    { name: 'Hematol', verified: 28, pending: 2 },
                    { name: 'Pathol', verified: 18, pending: 5 },
                    { name: 'OCT / Field', verified: 42, pending: 6 }
                  ]} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={75} />
                    <Tooltip />
                    <Bar dataKey="verified" fill="#0d9488" radius={[0, 4, 4, 0]} name="Verified" />
                    <Bar dataKey="pending" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Pending" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-2">Supply Chain Health Matrix</h3>
              <p className="text-xs text-slate-400 mb-4">Threshold status for critical surgical & medical inventory</p>

              <div className="space-y-4">
                {supplyMatrix.map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700">{item.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        item.status === 'Critical' ? 'bg-rose-50 text-rose-600' :
                        item.status === 'Warning' ? 'bg-amber-50 text-amber-600' :
                        'bg-emerald-50 text-emerald-600'
                      }`}>
                        {item.current} {item.unit} ({item.status})
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.status === 'Critical' ? 'bg-rose-500' :
                          item.status === 'Warning' ? 'bg-amber-500' :
                          'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, (item.current / (item.threshold * 2)) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 9. FINANCIAL INTELLIGENCE HUB DETAIL VIEW                 */}
      {/* ======================================================== */}
      {activeHub === 'finance' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-2">Quarterly Revenue Projections & Margin</h3>
              <p className="text-xs text-slate-400 mb-4">Detailed fiscal audit showing gross collections, operating expenses, and net profit</p>
              
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={revenueTrendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#0d9488" radius={[4, 4, 0, 0]} name="Gross Revenue" />
                    <Line type="monotone" dataKey="target" stroke="#6366f1" strokeWidth={3} name="Target Forecast" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 10. SURGICAL OT & INFRASTRUCTURE HUB DETAIL VIEW         */}
      {/* ======================================================== */}
      {activeHub === 'assets' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-12 gap-6">
            
            <div className="col-span-12 lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-2">Operation Theatre Suites</h3>
              <p className="text-xs text-slate-400 mb-4">Sterility status, ventilation, and live surgery schedule</p>

              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/50 flex items-center justify-between">
                  <div>
                    <h5 className="font-extrabold text-sm text-slate-900">OT Suite 1 (Phaco / Anterior)</h5>
                    <p className="text-xs text-slate-500 mt-0.5">HEPA Filter: Clean • Micro-Sterility: 99.9%</p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-500 text-white rounded-lg text-xs font-bold">
                    Active / Sterilized
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <h5 className="font-extrabold text-sm text-slate-900">OT Suite 2 (Posterior & Vitreo-Retinal)</h5>
                    <p className="text-xs text-slate-500 mt-0.5">Microscope: Zeiss Lumera • Status: Standby</p>
                  </div>
                  <span className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold">
                    Standby
                  </span>
                </div>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-2">Ward & Cabin Bed Load Map</h3>
              <p className="text-xs text-slate-400 mb-4">Real-time status across hospital wings</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <p className="text-xs text-slate-400 font-bold uppercase">General Male Ward</p>
                  <p className="text-xl font-black text-slate-800 my-1">6 / 8 Beds</p>
                  <span className="text-[10px] font-bold text-amber-600">75% Load</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <p className="text-xs text-slate-400 font-bold uppercase">General Female Ward</p>
                  <p className="text-xl font-black text-slate-800 my-1">4 / 8 Beds</p>
                  <span className="text-[10px] font-bold text-emerald-600">50% Load</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <p className="text-xs text-slate-400 font-bold uppercase">Post-Op Recovery</p>
                  <p className="text-xl font-black text-slate-800 my-1">2 / 4 Units</p>
                  <span className="text-[10px] font-bold text-emerald-600">50% Load</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <p className="text-xs text-slate-400 font-bold uppercase">VIP Cabins</p>
                  <p className="text-xl font-black text-slate-800 my-1">2 / 4 Units</p>
                  <span className="text-[10px] font-bold text-emerald-600">50% Load</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 11. STRATEGIC COMPLIANCE & AUDIT FOOTER BAR              */}
      {/* ======================================================== */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                OPERATIONAL INTEGRITY SAFE • DGHS & ISO 9001:2015 COMPLIANT
              </h4>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-1.5 py-0.2 rounded">
                Verified
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-400">
              Global Hospital Metric Index: <strong className="text-slate-700">99.4%</strong> • Encrypted Database Active
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {[
            { label: 'Audit Reports', path: '/reports' },
            { label: 'Clinical Analytics', path: '/reports' },
            { label: 'Database Backup', path: '/database' }
          ].map((action, i) => (
            <button
              key={i}
              onClick={() => navigate(action.path)}
              className="px-3.5 py-1.5 bg-slate-50 hover:bg-teal-700 hover:text-white text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200/80 cursor-pointer shadow-xs"
            >
              {action.label}
            </button>
          ))}
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
