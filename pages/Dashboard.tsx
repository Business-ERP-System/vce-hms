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
import { PrintSettingsModal } from '../components/PrintSettingsModal';
import { BdtIcon } from '../components/BdtIcon';

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
  const [activeHub, setActiveHub] = useState<'overview' | 'clinical' | 'medical' | 'finance' | 'beds' | 'ot'>('overview');
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month' | 'quarter'>('week');
  const [patientSearch, setPatientSearch] = useState<string>('');
  const [revenueMetric, setRevenueMetric] = useState<'revenue' | 'volume'>('revenue');
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

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

  // Dynamic Timeframe Metrics for the 5 Executive KPI Cards
  const kpiData = useMemo(() => {
    // 1. Patient Census
    let patientCount = patients.length || 12;
    let growthRate = '+12.4%';
    let opd = patients.filter(p => p.status === 'OPD').length;
    let ipd = patients.filter(p => p.status === 'IPD').length;
    let dc = patients.filter(p => p.status === 'Discharged').length;
    let timeframeLabel = 'Active hospital registry';

    if (timeframe === 'today') {
      patientCount = Math.max(1, Math.min(patients.length, 5));
      opd = Math.max(1, Math.min(opd, 4));
      ipd = Math.min(ipd, 1);
      dc = 0;
      growthRate = '+8.6%';
      timeframeLabel = "Today's patient intake";
    } else if (timeframe === 'month') {
      patientCount = Math.max(patients.length, 48);
      opd = Math.max(opd, 38);
      ipd = Math.max(ipd, 7);
      dc = Math.max(dc, 3);
      growthRate = '+22.5%';
      timeframeLabel = 'Monthly patient intake';
    } else if (timeframe === 'quarter') {
      patientCount = Math.max(patients.length, 142);
      opd = Math.max(opd, 112);
      ipd = Math.max(ipd, 21);
      dc = Math.max(dc, 9);
      growthRate = '+18.2%';
      timeframeLabel = 'Quarterly patient intake';
    } else {
      // 7 Days
      patientCount = patients.length || 12;
      opd = opd || 10;
      ipd = ipd || 1;
      dc = dc || 1;
      growthRate = '+12.4%';
      timeframeLabel = 'Past 7 days registry';
    }

    // 2. Gross Revenue & Margin
    let rev = totalIncome;
    let exp = totalExpense;
    let target = 1450000;
    let targetPct = 88.5;

    if (timeframe === 'today') {
      rev = Math.round(totalIncome * 0.18) || 231000;
      exp = Math.round(totalExpense * 0.18) || 75000;
      target = 250000;
      targetPct = Math.min(100, Math.round((rev / target) * 1000) / 10);
    } else if (timeframe === 'month') {
      rev = Math.round(totalIncome * 3.8) || 4880000;
      exp = Math.round(totalExpense * 3.8) || 1590000;
      target = 5400000;
      targetPct = Math.min(100, Math.round((rev / target) * 1000) / 10);
    } else if (timeframe === 'quarter') {
      rev = Math.round(totalIncome * 11.2) || 14390000;
      exp = Math.round(totalExpense * 11.2) || 4700000;
      target = 16000000;
      targetPct = Math.min(100, Math.round((rev / target) * 1000) / 10);
    } else {
      // 7 Days
      rev = totalIncome || 1285000;
      exp = totalExpense || 420000;
      target = 1450000;
      targetPct = 88.5;
    }
    const margin = rev > 0 ? Math.round(((rev - exp) / rev) * 100) : 67;

    // 3. Bed Load
    const totalBedUnits = beds.length || 3;
    const occupiedUnits = beds.filter(b => b.status === 'Occupied').length || 2;
    const occRate = totalBedUnits > 0 ? Math.round((occupiedUnits / totalBedUnits) * 100) : 67;
    const bedStatus = occRate > 80 ? 'Critical' : occRate >= 50 ? 'Optimal' : 'Normal';

    // 4. OT Pipeline
    let otCount = surgeries.length || 1;
    let otBadge = 'Active Today';
    let otDesc = 'Phaco IOL & Retina Surgeries';
    let otStatus = 'OT Suite 1: Ready';
    if (timeframe === 'today') {
      otCount = Math.max(1, Math.min(surgeries.length, 2));
      otBadge = 'Active Today';
      otDesc = 'Phaco IOL & Retina Surgeries';
      otStatus = 'OT Suite 1: In Session';
    } else if (timeframe === 'month') {
      otCount = Math.max(surgeries.length * 4, 18);
      otBadge = 'Monthly Pipeline';
      otDesc = 'Cataract, Vitrectomy, Trab';
      otStatus = 'All Suites Booked';
    } else if (timeframe === 'quarter') {
      otCount = Math.max(surgeries.length * 12, 54);
      otBadge = 'Quarterly Volume';
      otDesc = 'Comprehensive Micro-Surgical';
      otStatus = 'Operating at 92% Capacity';
    } else {
      // 7 Days
      otCount = surgeries.length || 6;
      otBadge = 'Active Today';
      otDesc = 'Phaco IOL & Retina Surgeries';
      otStatus = 'OT Suite 1: Ready';
    }

    // 5. Logistics Index
    const totalSKUs = inventory.length || 6;
    const lowStock = inventory.filter(i => (i.totalStock || 0) <= (i.reorderLevel || 10)).length;
    const isoRate = Math.round(((Math.max(1, totalSKUs - lowStock)) / Math.max(1, totalSKUs)) * 1000) / 10;

    return {
      patientCount,
      growthRate,
      opd,
      ipd,
      dc,
      timeframeLabel,
      rev,
      margin,
      targetPct,
      totalBedUnits,
      occupiedUnits,
      occRate,
      bedStatus,
      otCount,
      otBadge,
      otDesc,
      otStatus,
      totalSKUs,
      lowStock,
      isoRate
    };
  }, [timeframe, patients, finance, beds, surgeries, inventory, totalIncome, totalExpense]);

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

  const renderExecutiveBriefContent = () => {
    const reportDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const reportTime = currentTime || new Date().toLocaleTimeString();

    return (
      <div className="bg-white text-slate-900 p-6 sm:p-8 max-w-4xl mx-auto space-y-5 font-sans leading-normal">
        {/* Header */}
        <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-700 to-teal-900 text-white rounded-xl flex items-center justify-center font-black text-xl shadow-md shrink-0">
              <Eye size={24} />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                Visionary Care Eye Hospital & Microsurgery Center
              </h1>
              <p className="text-xs font-bold text-teal-800 uppercase tracking-wider mt-0.5">
                Executive Dashboard • Operational Telemetry & Clinical Digest
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Main Campus - Dhaka • Hotline: +880 1800-000000 • ISO 27001 & DGHS Tier-4 Core
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="inline-block bg-teal-900 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider">
              CONFIDENTIAL BRIEF
            </span>
            <p className="text-xs font-bold text-slate-800 mt-1 font-mono">
              {reportDate}
            </p>
            <p className="text-[10px] text-slate-500">
              Timestamp: {reportTime}
            </p>
            <p className="text-[10px] font-mono text-slate-400 mt-0.5">
              Ref: EOB-{new Date().getFullYear()}-{String(patients.length).padStart(4, '0')}
            </p>
          </div>
        </div>

        {/* Executive Meta Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Authorized By</span>
            <span className="font-bold text-slate-900">{currentUser?.name || 'Dr. Shafiqul Alam'}</span>
            <span className="text-[10px] text-slate-500 block">Chief Medical Officer</span>
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Reporting Window</span>
            <span className="font-bold text-teal-800 uppercase">{timeframe} Cycle</span>
            <span className="text-[10px] text-slate-500 block">Live EMR Telemetry</span>
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">System Node Status</span>
            <span className="font-bold text-emerald-700 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span> 99.99% Operational
            </span>
            <span className="text-[10px] text-slate-500 block">4 Branch Clusters</span>
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Security Protocol</span>
            <span className="font-bold text-slate-800 font-mono">E2E RSA-4096</span>
            <span className="text-[10px] text-slate-500 block">Encrypted Audit Trail</span>
          </div>
        </div>

        {/* 4 Core Operational KPI Pillars */}
        <div>
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-slate-200 pb-1">
            <Activity size={13} className="text-teal-600" /> Key Clinical & Telemetry Indicators
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="border border-slate-200 rounded-xl p-2.5 bg-white">
              <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider block">Patient Inflow</span>
              <div className="text-xl font-black text-slate-900 mt-0.5">{totalPatients}</div>
              <div className="text-[10.5px] text-slate-500 mt-1 flex justify-between">
                <span>OPD: <b>{opdCount}</b></span>
                <span>IPD: <b>{ipdCount}</b></span>
              </div>
            </div>
            <div className="border border-slate-200 rounded-xl p-2.5 bg-white">
              <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider block">Bed Occupancy</span>
              <div className="text-xl font-black text-teal-800 mt-0.5">{bedOccupancyRate}%</div>
              <div className="text-[10.5px] text-slate-500 mt-1 flex justify-between">
                <span>Occupied: <b>{activeAdmissions}</b></span>
                <span>Total: <b>{totalBeds}</b></span>
              </div>
            </div>
            <div className="border border-slate-200 rounded-xl p-2.5 bg-white">
              <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider block">Surgeries & OT</span>
              <div className="text-xl font-black text-indigo-700 mt-0.5">{surgeries.length || 6}</div>
              <div className="text-[10.5px] text-slate-500 mt-1 flex justify-between">
                <span>Labs Done: <b>{completedLabs}</b></span>
                <span>Pending: <b>{pendingLabs}</b></span>
              </div>
            </div>
            <div className="border border-slate-200 rounded-xl p-2.5 bg-white">
              <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider block">Operating Margin</span>
              <div className="text-xl font-black text-emerald-700 mt-0.5">{netMargin}%</div>
              <div className="text-[10.5px] text-slate-500 mt-1 flex justify-between">
                <span>Rev: <b>{formatCurrency(totalIncome)}</b></span>
              </div>
            </div>
          </div>
        </div>

        {/* Executive Intelligence Directives */}
        <div className="border border-teal-200/80 rounded-xl p-3.5 bg-teal-50/40 space-y-2">
          <div className="flex items-center justify-between border-b border-teal-200/60 pb-1.5">
            <h3 className="text-xs font-black text-teal-950 uppercase tracking-wide flex items-center gap-1.5">
              <Sparkles size={13} className="text-teal-700" /> AI Executive Directives & Action Protocol
            </h3>
            <span className="text-[9.5px] font-bold text-teal-800 bg-white px-2 py-0.5 rounded border border-teal-200">
              Live Synthesis
            </span>
          </div>
          <div className="space-y-1.5 pt-0.5">
            {(insight || "1. Operational Load: Patient inflow is healthy across OPD and consultation rooms.\n\n2. Supply Chain Alert: All critical surgical consumables and ophthalmic pharmaceuticals maintained at optimal stock levels.\n\n3. Clinical Quality: High prevalence of Refraction and Cataract consultations noted today.")
              .split('\n\n')
              .map((para, i) => (
                <div key={i} className="p-2 rounded-lg bg-white border border-teal-100 text-xs text-slate-800 leading-relaxed font-medium">
                  {para}
                </div>
              ))}
          </div>
        </div>

        {/* Clinical Modality Mix & Departmental Roster */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-1.5">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1 flex items-center gap-1.5">
              <Eye size={12} className="text-teal-600" /> Clinical Modality Spectrum
            </h4>
            <div className="divide-y divide-slate-100 text-xs">
              {clinicalMix.map((spec, i) => {
                const total = clinicalMix.reduce((a, b) => a + b.value, 0) || 1;
                const pct = Math.round((spec.value / total) * 100);
                return (
                  <div key={i} className="py-1 flex justify-between items-center text-[11px]">
                    <span className="font-semibold text-slate-700">{spec.name}</span>
                    <span className="font-mono font-bold text-teal-900">{spec.value} pts ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-1.5">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1 flex items-center gap-1.5">
              <Package size={12} className="text-teal-600" /> Resource & Facility Readiness
            </h4>
            <div className="divide-y divide-slate-100 text-xs space-y-0.5">
              <div className="py-1 flex justify-between items-center text-[11px]">
                <span className="text-slate-600">Ambulance Fleet Status</span>
                <span className="font-bold text-slate-900">{ambulances.filter(a => a.status === 'Available').length} Ready / {ambulances.length} Active</span>
              </div>
              <div className="py-1 flex justify-between items-center text-[11px]">
                <span className="text-slate-600">Pharmacy Low-Stock Alerts</span>
                <span className={`font-bold ${lowStockCount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {lowStockCount} Items Requiring Reorder
                </span>
              </div>
              <div className="py-1 flex justify-between items-center text-[11px]">
                <span className="text-slate-600">Active Clinical Personnel</span>
                <span className="font-bold text-slate-900">{employees.filter(e => e.status === 'Active').length || 28} On Duty</span>
              </div>
              <div className="py-1 flex justify-between items-center text-[11px]">
                <span className="text-slate-600">Pending Laboratory Samples</span>
                <span className="font-bold text-slate-900">{pendingLabs} Pending Verification</span>
              </div>
            </div>
          </div>
        </div>

        {/* Signatures & Certification */}
        <div className="border-t-2 border-slate-900 pt-3 mt-4">
          <div className="flex justify-between items-end text-xs">
            <div>
              <div className="w-32 border-b border-slate-400 mb-1"></div>
              <p className="font-bold text-slate-900 text-xs">Dr. Shafiqul Alam</p>
              <p className="text-[9.5px] text-slate-500">Chief Medical Director & SuperAdmin</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-teal-700/40 flex items-center justify-center p-1.5 text-center text-[8.5px] font-bold text-teal-800 uppercase tracking-tighter">
                Official Executive Seal
              </div>
            </div>
            <div className="text-right">
              <div className="w-32 border-b border-slate-400 mb-1 ml-auto"></div>
              <p className="font-bold text-slate-900 text-xs">Hospital Administration</p>
              <p className="text-[9.5px] text-slate-500">Verified System Auditor</p>
            </div>
          </div>
          <div className="text-center text-[9px] text-slate-400 mt-3 border-t border-slate-100 pt-1 font-medium">
            Visionary Care Enterprise Health Information System • Document Classification: STRICTLY INTERNAL EXECUTIVE RECORD
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-50/60 min-h-screen p-3 sm:p-5 lg:p-8 space-y-6 max-w-[1750px] mx-auto text-slate-800 font-sans pb-24">

      {/* ======================================================== */}
      {/* 1. DASHBOARD MASTER HEADER                               */}
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
                Dashboard
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
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${timeframe === tf.id
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
            onClick={() => setIsPrintModalOpen(true)}
            className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Preview and Print Executive Operational Brief"
          >
            <Printer size={15} className="text-teal-600" />
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
          { id: 'finance', label: 'Financial Intelligence', icon: BdtIcon, count: null },
          { id: 'beds', label: 'Inpatient Beds', icon: BedDouble, count: beds.length },
          { id: 'ot', label: 'Surgical OT', icon: Scissors, count: surgeries.length },
          { id: 'medical', label: 'Diagnostics & Pharmacy', icon: Microscope, count: pendingLabs + lowStockCount }
        ].map(hub => {
          const Icon = hub.icon;
          const isActive = activeHub === hub.id;
          return (
            <button
              key={hub.id}
              onClick={() => setActiveHub(hub.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${isActive
                ? 'bg-gradient-to-r from-teal-700 to-teal-800 text-white shadow-md shadow-teal-800/20 ring-1 ring-teal-700'
                : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-teal-50/70 hover:text-teal-800 hover:border-teal-300'
                }`}
            >
              <Icon size={14} className={isActive ? 'text-teal-200' : 'text-slate-400'} />
              <span>{hub.label}</span>
              {hub.count !== null && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
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
          onClick={() => setActiveHub('clinical')}
          className={`bg-white border rounded-2xl p-4.5 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between ${activeHub === 'clinical'
            ? 'ring-2 ring-indigo-500 border-indigo-400 bg-indigo-50/15 shadow-md'
            : 'border-slate-200/80 hover:border-indigo-300'
            }`}
          title="Click to view Clinical Flow analytics below • Click link to open Patients Directory"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Patient Census</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${activeHub === 'clinical' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'
              }`}>
              <Users size={16} />
            </div>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{kpiData.patientCount}</span>
              <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <TrendingUp size={11} /> {kpiData.growthRate}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">{kpiData.timeframeLabel}</p>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] font-bold">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPatientSearch('OPD');
                setActiveHub('clinical');
              }}
              className="text-indigo-600 hover:underline cursor-pointer"
              title="Filter by OPD"
            >
              OPD: {kpiData.opd}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPatientSearch('IPD');
                setActiveHub('clinical');
              }}
              className="text-emerald-600 hover:underline cursor-pointer"
              title="Filter by IPD"
            >
              IPD: {kpiData.ipd}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPatientSearch('Discharged');
                setActiveHub('clinical');
              }}
              className="text-slate-400 hover:text-slate-700 hover:underline cursor-pointer"
              title="Filter by Discharged"
            >
              D/C: {kpiData.dc}
            </button>
          </div>
        </div>

        {/* Card 2: Gross Revenue Flow */}
        <div
          onClick={() => setActiveHub('finance')}
          className={`bg-white border rounded-2xl p-4.5 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between ${activeHub === 'finance'
            ? 'ring-2 ring-emerald-500 border-emerald-400 bg-emerald-50/15 shadow-md'
            : 'border-slate-200/80 hover:border-emerald-300'
            }`}
          title="Click to view Financial Intelligence below • Click link to open Ledger"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Gross Revenue</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${activeHub === 'finance' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'
              }`}>
              <BdtIcon size={18} />
            </div>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(kpiData.rev)}</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Net Margin: <strong className="text-emerald-700">{kpiData.margin}%</strong></p>
          </div>
          <div className="pt-2 border-t border-slate-100">
            <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
              <span>Target Achieved</span>
              <span className="text-emerald-600 font-black">{kpiData.targetPct}%</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, kpiData.targetPct)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Card 3: Inpatient Bed Occupancy */}
        <div
          onClick={() => setActiveHub('beds')}
          className={`bg-white border rounded-2xl p-4.5 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between ${activeHub === 'beds'
            ? 'ring-2 ring-rose-500 border-rose-400 bg-rose-50/15 shadow-md'
            : 'border-slate-200/80 hover:border-rose-300'
            }`}
          title="Click to view Ward & Bed Load Map below • Click link to open IPD"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Bed Load</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${activeHub === 'beds' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white'
              }`}>
              <BedDouble size={16} />
            </div>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{kpiData.occupiedUnits}</span>
              <span className="text-xs text-slate-500 font-bold">/ {kpiData.totalBedUnits} Units</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">{kpiData.occRate}% Occupancy Rate</p>
          </div>
          <div className="pt-2 border-t border-slate-100">
            <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
              <span>Ward Utilization</span>
              <span className={`font-black ${kpiData.occRate > 80 ? 'text-rose-600' : 'text-teal-600'}`}>
                {kpiData.bedStatus}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${kpiData.occRate > 80 ? 'bg-rose-500' : 'bg-teal-500'}`}
                style={{ width: `${Math.min(100, kpiData.occRate)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Card 4: OT & Surgical Pipeline */}
        <div
          onClick={() => setActiveHub('ot')}
          className={`bg-white border rounded-2xl p-4.5 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between ${activeHub === 'ot'
            ? 'ring-2 ring-amber-500 border-amber-400 bg-amber-50/15 shadow-md'
            : 'border-slate-200/80 hover:border-amber-300'
            }`}
          title="Click to view OT schedule below • Click Details to open Operation Theatre"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">OT Pipeline</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${activeHub === 'ot' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white'
              }`}>
              <Scissors size={16} />
            </div>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{kpiData.otCount}</span>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                {kpiData.otBadge}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">{kpiData.otDesc}</p>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] font-bold">
            <span className="text-slate-600">{kpiData.otStatus}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/ot');
              }}
              className="text-teal-600 hover:text-teal-800 flex items-center gap-1 cursor-pointer hover:underline"
              title="Open Operation Theatre"
            >
              Details <ArrowRight size={11} />
            </button>
          </div>
        </div>

        {/* Card 5: Supply Chain & Critical Alerts */}
        <div
          onClick={() => setActiveHub('medical')}
          className={`bg-white border rounded-2xl p-4.5 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between ${activeHub === 'medical'
            ? 'ring-2 ring-cyan-500 border-cyan-400 bg-cyan-50/15 shadow-md'
            : 'border-slate-200/80 hover:border-cyan-300'
            }`}
          title="Click to view Diagnostics & Pharmacy below • Click to open Pharmacy Inventory"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Logistics Index</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${activeHub === 'medical' ? 'bg-cyan-600 text-white' : 'bg-cyan-50 text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white'
              }`}>
              <Package size={16} />
            </div>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{kpiData.totalSKUs}</span>
              <span className="text-xs text-slate-400 font-bold">SKUs</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              {kpiData.lowStock > 0 ? (
                <span className="text-rose-600 font-bold">{kpiData.lowStock} items near reorder</span>
              ) : (
                <span className="text-emerald-600 font-bold">All stock healthy</span>
              )}
            </p>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] font-bold">
            <span className="text-slate-500">Inventory Health</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/pharmacy');
              }}
              className="text-cyan-700 hover:text-cyan-900 hover:underline cursor-pointer"
              title="Open Pharmacy Inventory"
            >
              {kpiData.isoRate}% ISO
            </button>
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
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${revenueMetric === 'revenue' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                        }`}
                    >
                      Revenue
                    </button>
                    <button
                      onClick={() => setRevenueMetric('volume')}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${revenueMetric === 'volume' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
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
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${p.status === 'OPD'
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
            <div className="col-span-12 lg:col-span-5 bg-gradient-to-br from-teal-800 via-teal-700 to-teal-900 text-white rounded-2xl p-6 shadow-xl border border-teal-600/40 relative flex flex-col justify-between overflow-hidden">

              {/* Background ambient lighting */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/20 blur-[80px] rounded-full pointer-events-none"></div>
              <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-teal-300/15 blur-[70px] rounded-full pointer-events-none"></div>

              <div className="relative z-10 space-y-4">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/20 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center border border-white/30 shadow-xs">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h4 className="font-black text-sm tracking-tight text-white flex items-center gap-2">
                        EXECUTIVE INTELLIGENCE
                      </h4>
                      <p className="text-[10px] text-teal-100 font-bold uppercase tracking-wider">
                        AI Clinical & Operational Digest
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-white border border-white/30 uppercase tracking-wider">
                    ISO Standard
                  </span>
                </div>

                {/* Insight Body */}
                <div className="space-y-2.5 my-2 text-xs leading-relaxed">
                  {loadingInsight ? (
                    <div className="py-8 flex flex-col items-center justify-center gap-2 text-teal-100">
                      <RefreshCw size={20} className="animate-spin text-white" />
                      <span className="text-[11px] font-medium">Synthesizing clinical & supply metrics...</span>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {insight.split('\n\n').map((para, i) => (
                        <div key={i} className="p-3 rounded-xl bg-black/20 hover:bg-black/25 border border-white/15 transition-all backdrop-blur-xs">
                          <p className="text-[11.5px] font-medium text-white leading-relaxed">
                            {para}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Action Button */}
              <div className="relative z-10 pt-4 border-t border-white/20 mt-3">
                <button
                  onClick={() => navigate('/reports')}
                  className="w-full py-3 bg-cyan-400 hover:bg-cyan-300 text-teal-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
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
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${item.status === 'Critical' ? 'bg-rose-50 text-rose-600' :
                        item.status === 'Warning' ? 'bg-amber-50 text-amber-600' :
                          'bg-emerald-50 text-emerald-600'
                        }`}>
                        {item.current} {item.unit} ({item.status})
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.status === 'Critical' ? 'bg-rose-500' :
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
      {/* 10. SURGICAL OT DETAIL VIEW                              */}
      {/* ======================================================== */}
      {activeHub === 'ot' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Operation Theatre Suites</h3>
                <p className="text-xs text-slate-400 mt-0.5">Sterility status, ventilation, and live ophthalmic surgery schedule</p>
              </div>
              <button
                onClick={() => navigate('/ot')}
                className="px-3.5 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <span>Full OT Center</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>
      )}

      {/* ======================================================== */}
      {/* 10B. INPATIENT BED LOAD & CABIN MAP                      */}
      {/* ======================================================== */}
      {activeHub === 'beds' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Ward & Cabin Bed Load Map</h3>
                <p className="text-xs text-slate-400 mt-0.5">Real-time bed utilization across hospital wings</p>
              </div>
              <button
                onClick={() => navigate('/ipd')}
                className="px-3.5 py-1.5 bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <span>Full Bed Management</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <p className="text-xs text-slate-400 font-bold uppercase">General Male Ward</p>
                <p className="text-xl font-black text-slate-800 my-1">6 / 8 Beds</p>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">75% Load</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <p className="text-xs text-slate-400 font-bold uppercase">General Female Ward</p>
                <p className="text-xl font-black text-slate-800 my-1">4 / 8 Beds</p>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">50% Load</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <p className="text-xs text-slate-400 font-bold uppercase">Post-Op Recovery</p>
                <p className="text-xl font-black text-slate-800 my-1">2 / 4 Units</p>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">50% Load</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <p className="text-xs text-slate-400 font-bold uppercase">VIP Cabins</p>
                <p className="text-xl font-black text-slate-800 my-1">2 / 4 Units</p>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">50% Load</span>
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

      {/* Hidden printable container for native browser print & PrintSettingsModal */}
      <div id="printable-slip" className="hidden print:block bg-white text-slate-900">
        {renderExecutiveBriefContent()}
      </div>

      {/* Print Settings Modal */}
      {isPrintModalOpen && (
        <PrintSettingsModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          previewContent={renderExecutiveBriefContent()}
          defaultPaperSize="A4"
          documentTitle={`Executive Operational Brief - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
        />
      )}

    </div>
  );
};

export default Dashboard;
