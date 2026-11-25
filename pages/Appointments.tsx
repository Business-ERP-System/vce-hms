import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import {
  Calendar as CalendarIcon, Clock, User, CheckCircle2, XCircle, ChevronLeft, ChevronRight,
  Plus, Grid, List, X, Save, Download, Printer, Search, Filter, Stethoscope,
  Eye, Activity, Sparkles, Building2, AlertCircle, ArrowRight, Check,
  RotateCcw, SlidersHorizontal, UserCheck, CalendarDays, ShieldCheck, MapPin,
  Flame, Phone, FileText, ChevronDown, CheckCircle
} from 'lucide-react';
import { Appointment, Patient } from '../types';
import { MOCK_EMPLOYEES, ORG_DETAILS } from '../constants';
import { CustomDatePicker } from '../components/CustomDatePicker';
import { PrintSettingsModal } from '../components/PrintSettingsModal';

// Ophthalmic clinical room mapping for doctors
const DOCTOR_CHAMBER_MAP: Record<string, { room: string; specialty: string; color: string }> = {
  'Dr. Emily Chen': { room: 'Chamber 101', specialty: 'Chief Ophthalmologist • Cataract & Refractive', color: 'teal' },
  'Dr. Shafiqul Alam': { room: 'Chamber 102', specialty: 'Senior Surgeon • Vitreo-Retinal Diseases', color: 'indigo' },
  'Dr. A. Sharma': { room: 'Chamber 103', specialty: 'Consultant • Cornea & Anterior Segment', color: 'cyan' },
  'Dr. Sarah Khan': { room: 'Chamber 104', specialty: 'Consultant • Pediatric Ophthalmology & Strabismus', color: 'purple' },
  'Dr. B. Reynolds': { room: 'Chamber 105', specialty: 'Specialist • Glaucoma & Neuro-Ophthalmology', color: 'amber' },
  'Dr. M. A. Rahman': { room: 'Chamber 106', specialty: 'Senior Specialist • Retina & Ocular Oncology', color: 'rose' },
};

const APPOINTMENT_TYPE_CONFIG: Record<string, { label: string; badgeClass: string; borderClass: string; dotClass: string }> = {
  'Consultation': { label: 'Consultation', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200', borderClass: 'border-l-blue-500', dotClass: 'bg-blue-500' },
  'Surgery': { label: 'Surgery / Pre-Op', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200', borderClass: 'border-l-purple-500', dotClass: 'bg-purple-500' },
  'Follow-up': { label: 'Follow-up', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200', borderClass: 'border-l-emerald-500', dotClass: 'bg-emerald-500' },
  'Emergency': { label: 'Emergency', badgeClass: 'bg-red-50 text-red-700 border-red-200', borderClass: 'border-l-red-500', dotClass: 'bg-red-500' },
};

const STANDARD_SLOTS = [
  '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
];

const Appointments: React.FC = () => {
  const { appointments, patients, addAppointment, updateAppointment, updatePatient } = useData();

  // Navigation & View Mode
  const [viewMode, setViewMode] = useState<'week' | 'day' | 'month' | 'list'>('week');
  const [activeDateStr, setActiveDateStr] = useState<string>(() => {
    // Default to current hospital operational date (2026-11-25)
    return '2026-11-25';
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>('All');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');

  // Modals & Sheets
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printDocumentType, setPrintDocumentType] = useState<'runSheet' | 'patientSlip'>('runSheet');

  // Form State for New Appointment
  const [formPatientId, setFormPatientId] = useState('');
  const [formDoctorName, setFormDoctorName] = useState('Dr. Emily Chen');
  const [formDate, setFormDate] = useState('2026-11-25');
  const [formTime, setFormTime] = useState('09:30');
  const [formType, setFormType] = useState<'Consultation' | 'Surgery' | 'Follow-up' | 'Emergency'>('Consultation');
  const [formNotes, setFormNotes] = useState('');
  const [formAutoCheckIn, setFormAutoCheckIn] = useState(false);

  // Doctors list
  const doctors = useMemo(() => {
    const docList = MOCK_EMPLOYEES.filter(e => e.role === 'Doctor' || e.role === 'Chief Ophthalmologist');
    return docList.length > 0 ? docList : [
      { id: 'EMP001', name: 'Dr. Emily Chen', department: 'Clinical', role: 'Chief Ophthalmologist', status: 'Active' },
      { id: 'EMP006', name: 'Dr. Shafiqul Alam', department: 'Clinical', role: 'Doctor', status: 'Active' },
      { id: 'EMP007', name: 'Dr. A. Sharma', department: 'Clinical', role: 'Doctor', status: 'Active' },
      { id: 'EMP008', name: 'Dr. Sarah Khan', department: 'Clinical', role: 'Doctor', status: 'Active' },
      { id: 'EMP009', name: 'Dr. B. Reynolds', department: 'Clinical', role: 'Doctor', status: 'Active' },
      { id: 'EMP010', name: 'Dr. M. A. Rahman', department: 'Clinical', role: 'Doctor', status: 'Active' }
    ];
  }, []);

  // Active Date Object
  const activeDate = useMemo(() => {
    const parts = activeDateStr.split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2] || 1);
  }, [activeDateStr]);

  // Compute Current Week Days (Monday to Sunday)
  const currentWeekDays = useMemo(() => {
    const d = new Date(activeDate);
    const day = d.getDay();
    // In JS: 0 is Sunday. Normalize so Monday is 0
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));

    const days: { date: Date; dateStr: string; dayName: string; dayNumber: number; isToday: boolean }[] = [];
    for (let i = 0; i < 7; i++) {
      const nextDate = new Date(monday);
      nextDate.setDate(monday.getDate() + i);
      const iso = nextDate.toISOString().split('T')[0];
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      days.push({
        date: nextDate,
        dateStr: iso,
        dayName: dayNames[i],
        dayNumber: nextDate.getDate(),
        isToday: iso === '2026-11-25'
      });
    }
    return days;
  }, [activeDate]);

  // Date Stepping Helpers
  const stepDate = (direction: 'prev' | 'next') => {
    const d = new Date(activeDate);
    if (viewMode === 'day') {
      d.setDate(d.getDate() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() + (direction === 'next' ? 7 : -7));
    } else if (viewMode === 'month') {
      d.setMonth(d.getMonth() + (direction === 'next' ? 1 : -1));
    } else {
      d.setDate(d.getDate() + (direction === 'next' ? 1 : -1));
    }
    setActiveDateStr(d.toISOString().split('T')[0]);
  };

  const jumpToToday = () => {
    setActiveDateStr('2026-11-25');
  };

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = apt.patientName?.toLowerCase().includes(q);
        const matchesDoc = apt.doctorName?.toLowerCase().includes(q);
        const matchesId = apt.id?.toLowerCase().includes(q) || apt.patientId?.toLowerCase().includes(q);
        const matchesNotes = apt.notes?.toLowerCase().includes(q);
        if (!matchesName && !matchesDoc && !matchesId && !matchesNotes) return false;
      }
      // Doctor filter
      if (selectedDoctorFilter !== 'All' && apt.doctorName !== selectedDoctorFilter) {
        return false;
      }
      // Type filter
      if (selectedTypeFilter !== 'All' && apt.type !== selectedTypeFilter) {
        return false;
      }
      // Status filter
      if (selectedStatusFilter !== 'All' && apt.status !== selectedStatusFilter) {
        return false;
      }
      return true;
    });
  }, [appointments, searchQuery, selectedDoctorFilter, selectedTypeFilter, selectedStatusFilter]);

  // KPI Metrics Calculation
  const metrics = useMemo(() => {
    const todayList = appointments.filter(a => a.date === '2026-11-25');
    const scheduled = todayList.filter(a => a.status === 'Scheduled').length;
    const completed = todayList.filter(a => a.status === 'Completed').length;
    const surgeryCount = todayList.filter(a => a.type === 'Surgery').length;
    const emergencyCount = todayList.filter(a => a.type === 'Emergency').length;
    const activeDoctorCount = doctors.filter(d => (d as any).status === 'Active').length;
    const totalSlots = activeDoctorCount * 12; // 12 theoretical booking slots per doctor day
    const capacityPct = totalSlots > 0 ? Math.round((todayList.length / totalSlots) * 100) : 0;

    return {
      todayTotal: todayList.length,
      scheduled,
      completed,
      surgeryCount,
      emergencyCount,
      activeDoctors: activeDoctorCount,
      capacityPct
    };
  }, [appointments, doctors]);

  // Open New Appointment Modal with prefilled date & time
  const handleOpenSlot = (date: string, time: string, doctorName?: string) => {
    setFormDate(date);
    setFormTime(time);
    if (doctorName) setFormDoctorName(doctorName);
    setFormPatientId('');
    setFormNotes('');
    setShowNewModal(true);
  };

  // Create Appointment
  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find(p => p.id === formPatientId);
    if (!patient) {
      alert("Please select a registered patient.");
      return;
    }

    const newApt: Appointment = {
      id: `APT-${Date.now().toString().slice(-6)}`,
      branchId: 'BR001',
      patientId: patient.id,
      patientName: patient.name,
      doctorName: formDoctorName,
      date: formDate,
      time: formTime,
      type: formType,
      status: 'Scheduled',
      notes: formNotes || undefined
    };

    addAppointment(newApt);

    // If auto check-in is toggled, transition patient to active OPD status
    if (formAutoCheckIn) {
      updatePatient(patient.id, {
        status: 'OPD',
        assignedDoctor: formDoctorName,
        lastVisit: formDate
      });
    }

    setShowNewModal(false);
    setSelectedAppointment(newApt);
  };

  // Status Change
  const handleStatusChange = (id: string, status: Appointment['status']) => {
    updateAppointment(id, { status });
    if (selectedAppointment && selectedAppointment.id === id) {
      setSelectedAppointment(prev => prev ? { ...prev, status } : null);
    }
  };

  // Route patient from appointment directly into OPD Queue
  const handleCheckInToOPD = (apt: Appointment) => {
    const patient = patients.find(p => p.id === apt.patientId);
    if (patient) {
      updatePatient(patient.id, {
        status: 'OPD',
        assignedDoctor: apt.doctorName,
        lastVisit: apt.date
      });
      updateAppointment(apt.id, { status: 'Scheduled' });
      alert(`Patient ${patient.name} (${patient.id}) successfully checked in and dispatched to OPD Queue for ${apt.doctorName}.`);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Appointment ID', 'Patient ID', 'Patient Name', 'Doctor', 'Date', 'Time', 'Type', 'Status', 'Clinical Notes'];
    const rows = filteredAppointments.map(a => [
      a.id,
      a.patientId,
      `"${a.patientName}"`,
      `"${a.doctorName}"`,
      a.date,
      a.time,
      a.type,
      a.status,
      `"${a.notes || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `VCE_Appointments_${activeDateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render Printable Document Content
  const renderPrintContent = () => {
    if (printDocumentType === 'runSheet') {
      const dayAppts = appointments.filter(a => a.date === activeDateStr && (selectedDoctorFilter === 'All' || a.doctorName === selectedDoctorFilter));
      return (
        <div className="p-8 font-sans max-w-4xl mx-auto text-slate-900 bg-white">
          <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-teal-800">{ORG_DETAILS.name}</h1>
              <p className="text-xs text-slate-500 font-medium">{ORG_DETAILS.address} • Tel: {ORG_DETAILS.contact}</p>
              <h2 className="text-lg font-black mt-2 text-slate-900 uppercase tracking-wide">
                DAILY CLINICAL APPOINTMENT RUN SHEET
              </h2>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold bg-slate-100 px-3 py-1 rounded border border-slate-200">
                DATE: {activeDateStr}
              </span>
              <p className="text-xs text-slate-500 mt-1">Doctor: {selectedDoctorFilter}</p>
              <p className="text-[11px] text-slate-400">Total Bookings: {dayAppts.length}</p>
            </div>
          </div>

          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 font-bold uppercase text-slate-700">
                <th className="py-2.5 px-3 border border-slate-200">Time</th>
                <th className="py-2.5 px-3 border border-slate-200">Token / ID</th>
                <th className="py-2.5 px-3 border border-slate-200">Patient Details</th>
                <th className="py-2.5 px-3 border border-slate-200">Doctor / Chamber</th>
                <th className="py-2.5 px-3 border border-slate-200">Type</th>
                <th className="py-2.5 px-3 border border-slate-200">Status</th>
                <th className="py-2.5 px-3 border border-slate-200">Clinical Indication / Notes</th>
              </tr>
            </thead>
            <tbody>
              {dayAppts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400 italic">No appointments scheduled for this date.</td>
                </tr>
              ) : (
                dayAppts.map(apt => (
                  <tr key={apt.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono font-bold border border-slate-200">{apt.time}</td>
                    <td className="py-2 px-3 font-mono border border-slate-200">{apt.id}</td>
                    <td className="py-2 px-3 font-bold border border-slate-200">
                      {apt.patientName} <span className="text-[10px] text-slate-500 block font-normal">PID: {apt.patientId}</span>
                    </td>
                    <td className="py-2 px-3 border border-slate-200">
                      {apt.doctorName}
                      <span className="text-[10px] text-slate-400 block">{DOCTOR_CHAMBER_MAP[apt.doctorName]?.room || 'Chamber'}</span>
                    </td>
                    <td className="py-2 px-3 border border-slate-200 font-medium">{apt.type}</td>
                    <td className="py-2 px-3 border border-slate-200">
                      <span className="font-bold uppercase text-[10px]">{apt.status}</span>
                    </td>
                    <td className="py-2 px-3 text-slate-600 border border-slate-200">{apt.notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between text-xs text-slate-500">
            <p>Printed on: {new Date().toLocaleString()} • Dispatch Terminal: Reception Main</p>
            <p>Signature: __________________________</p>
          </div>
        </div>
      );
    } else {
      // Individual Patient Slip
      const apt = selectedAppointment || appointments[0];
      if (!apt) return <div>No appointment selected.</div>;
      return (
        <div className="p-8 font-sans max-w-md mx-auto text-slate-900 bg-white border border-slate-300 rounded-lg">
          <div className="text-center border-b pb-4 mb-4">
            <h1 className="text-lg font-black text-teal-800 uppercase">{ORG_DETAILS.name}</h1>
            <p className="text-[11px] text-slate-500">{ORG_DETAILS.address} • Tel: {ORG_DETAILS.contact}</p>
            <div className="mt-2 inline-block px-3 py-1 bg-teal-50 border border-teal-200 rounded text-xs font-bold text-teal-800 uppercase tracking-widest">
              OFFICIAL APPOINTMENT CONFIRMATION
            </div>
          </div>

          <div className="space-y-3 text-xs mb-6">
            <div className="flex justify-between border-b border-slate-100 pb-1.5">
              <span className="text-slate-500">Appointment Token:</span>
              <strong className="font-mono text-sm text-slate-900">{apt.id}</strong>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1.5">
              <span className="text-slate-500">Patient Name:</span>
              <strong className="text-slate-900">{apt.patientName} (PID: {apt.patientId})</strong>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1.5">
              <span className="text-slate-500">Consulting Doctor:</span>
              <strong className="text-teal-700">{apt.doctorName}</strong>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1.5">
              <span className="text-slate-500">Chamber Room:</span>
              <strong className="text-slate-900">{DOCTOR_CHAMBER_MAP[apt.doctorName]?.room || 'OPD Chamber'}</strong>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1.5">
              <span className="text-slate-500">Date & Time:</span>
              <strong className="font-bold text-slate-900">{apt.date} at {apt.time}</strong>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1.5">
              <span className="text-slate-500">Appointment Nature:</span>
              <strong className="text-slate-900">{apt.type}</strong>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600 mb-6">
            <strong>Important Patient Guidelines:</strong>
            <ul className="list-disc ml-4 mt-1 space-y-0.5">
              <li>Please report to the reception counter 15 minutes before your scheduled slot.</li>
              <li>Carry your previous ophthalmic prescriptions and diagnostic scan records.</li>
              <li>In case of pupil dilation, avoid driving back unassisted.</li>
            </ul>
          </div>

          <div className="text-center text-[10px] text-slate-400 border-t pt-2">
            Automated Generation from VCE-HMS Enterprise • Valid for OPD Admissions
          </div>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">

      {/* ======================================================== */}
      {/* 1. ENTERPRISE COCKPIT HEADER BAR                         */}
      {/* ======================================================== */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 rounded-2xl md:rounded-3xl p-5 md:p-6 text-white shadow-xl shadow-teal-950/20 border border-teal-700/30 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wider uppercase bg-teal-500/20 text-teal-300 border border-teal-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                CLINICAL SCHEDULING DISPATCH
              </span>
              <span className="text-teal-300/80 text-xs font-mono font-medium">
                • VCE-HMS ENTERPRISE
              </span>
              <span className="hidden sm:inline-block text-xs bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-mono">
                ISO 9001:2015 ACCREDITED
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <CalendarIcon className="text-teal-400 w-7 h-7" />
              Appointment Scheduling
            </h1>
            <p className="text-xs sm:text-sm text-teal-100/70 font-medium mt-1">
              Multi-consultant clinical timetables, doctor chamber allocation, and real-time patient queue dispatch.
            </p>
          </div>

          {/* Global Action CTAs */}
          <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
            <button
              onClick={() => {
                setPrintDocumentType('runSheet');
                setIsPrintModalOpen(true);
              }}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition-all shadow-sm cursor-pointer"
              title="Print Daily Doctor Schedule"
            >
              <Printer size={15} /> Print Run List
            </button>
            <button
              onClick={handleExportCSV}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition-all shadow-sm cursor-pointer"
              title="Export Scheduled Appointments to CSV"
            >
              <Download size={15} /> Export CSV
            </button>
            <button
              onClick={() => {
                setFormDate(activeDateStr);
                setFormTime('10:00');
                setFormPatientId('');
                setFormNotes('');
                setShowNewModal(true);
              }}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-300 hover:to-teal-400 text-teal-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-teal-950/30 transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <Plus size={16} strokeWidth={3} /> New Appointment
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. EXECUTIVE CLINICAL KPI METRICS STRIP                   */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Today's Total Bookings */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Today's Census</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <CalendarDays size={15} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{metrics.todayTotal}</span>
            <span className="text-xs font-bold text-teal-600">Patients</span>
          </div>
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
            <span className="text-emerald-700 font-bold">{metrics.completed} Done</span>
            <span>•</span>
            <span className="text-amber-600 font-bold">{metrics.scheduled} Pending</span>
          </div>
        </div>

        {/* Card 2: Consulting Doctors Active */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Doctor Chambers</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Stethoscope size={15} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{metrics.activeDoctors}</span>
            <span className="text-xs font-bold text-indigo-600">Active Today</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>All chambers operational</span>
          </div>
        </div>

        {/* Card 3: Surgical & Pre-op Pipeline */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Surgical Pipeline</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Eye size={15} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{metrics.surgeryCount}</span>
            <span className="text-xs font-bold text-purple-600">Surgeries / Pre-Op</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
            <span className="text-purple-700 font-bold">Phaco & Vitrectomy</span>
          </div>
        </div>

        {/* Card 4: Slot Utilization Index */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Capacity Load</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Activity size={15} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{metrics.capacityPct}%</span>
            <span className="text-xs font-bold text-amber-600">Booked</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                metrics.capacityPct > 80 ? 'bg-amber-500' : 'bg-teal-500'
              }`}
              style={{ width: `${Math.min(metrics.capacityPct, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Card 5: Queue Dispatch Readiness */}
        <div className="col-span-2 sm:col-span-1 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Queue Sync</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck size={15} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">100%</span>
            <span className="text-xs font-bold text-emerald-600">OPD Feeder</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-100 text-[11px] text-emerald-700 font-bold">
            <CheckCircle2 size={12} /> Auto Check-in Enabled
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. MASTER CONTROL TOOLBAR: DATE JUMP, SEARCH, & FILTERS  */}
      {/* ======================================================== */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3">

          {/* Left: View Mode Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto border border-slate-200/60">
            {[
              { id: 'week', label: 'Week View', icon: CalendarIcon },
              { id: 'day', label: 'Doctor Chambers (Day)', icon: Stethoscope },
              { id: 'month', label: 'Month Grid', icon: Grid },
              { id: 'list', label: 'Directory List', icon: List }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = viewMode === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setViewMode(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-teal-600' : 'text-slate-400'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Center: Date Stepper & Today Shortcut */}
          <div className="flex items-center gap-2 self-center">
            <div className="flex items-center bg-slate-50 border border-slate-200/90 rounded-xl p-1 shadow-xs">
              <button
                onClick={() => stepDate('prev')}
                className="p-1.5 hover:bg-slate-200/70 rounded-lg text-slate-600 transition-colors"
                title="Previous Period"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={jumpToToday}
                className="px-2.5 py-1 text-xs font-black uppercase tracking-wider text-teal-700 hover:bg-teal-50 rounded-md transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => stepDate('next')}
                className="p-1.5 hover:bg-slate-200/70 rounded-lg text-slate-600 transition-colors"
                title="Next Period"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-bold text-slate-800">
              <CalendarIcon size={14} className="text-teal-600" />
              <span>
                {viewMode === 'day' && activeDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                {viewMode === 'week' && `${currentWeekDays[0]?.dayNumber} ${currentWeekDays[0]?.date.toLocaleDateString('en-US', { month: 'short' })} – ${currentWeekDays[6]?.dayNumber} ${currentWeekDays[6]?.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
                {viewMode === 'month' && activeDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                {viewMode === 'list' && `All Records (${activeDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})`}
              </span>
            </div>

            {/* Jump to specific date */}
            <div className="w-32">
              <CustomDatePicker
                value={activeDateStr}
                onChange={(e) => setActiveDateStr(e.target.value)}
                placeholder="Jump to..."
              />
            </div>
          </div>

          {/* Right: Search Box */}
          <div className="relative min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient, doctor, PID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={12} />
              </button>
            )}
          </div>

        </div>

        {/* Sub-bar: Doctor Filter Pills & Nature Filters */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Doctor filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Doctor:</span>
            <button
              onClick={() => setSelectedDoctorFilter('All')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                selectedDoctorFilter === 'All'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Doctors
            </button>
            {doctors.map(doc => (
              <button
                key={doc.id}
                onClick={() => setSelectedDoctorFilter(doc.name)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  selectedDoctorFilter === doc.name
                    ? 'bg-teal-700 text-white font-bold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {doc.name.replace('Dr. ', '')}
              </button>
            ))}
          </div>

          {/* Status & Type Filter Pills */}
          <div className="flex items-center gap-2">
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none"
            >
              <option value="All">All Visit Types</option>
              <option value="Consultation">Consultation</option>
              <option value="Surgery">Surgery / Pre-Op</option>
              <option value="Follow-up">Follow-up</option>
              <option value="Emergency">Emergency</option>
            </select>

            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. MAIN SCHEDULING CANVAS (GRID & SIDEBAR)               */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

        {/* Main Workspace (Views) */}
        <div className="xl:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden flex flex-col min-h-[680px]">

          {/* VIEW 1: WEEK CALENDAR VIEW (Default & Primary) */}
          {viewMode === 'week' && (
            <div className="flex flex-col h-full flex-1">
              {/* Day Headers */}
              <div className="grid grid-cols-8 border-b border-slate-200/90 bg-slate-50/80 sticky top-0 z-10 text-xs">
                {/* Time Slot column header */}
                <div className="p-3 text-center font-black text-slate-400 uppercase tracking-widest border-r border-slate-200/80">
                  TIME
                </div>
                {/* 7 Days */}
                {currentWeekDays.map(col => (
                  <div
                    key={col.dateStr}
                    onClick={() => {
                      setActiveDateStr(col.dateStr);
                      setViewMode('day');
                    }}
                    className={`p-2.5 text-center border-r border-slate-200/80 cursor-pointer hover:bg-teal-50/60 transition-colors ${
                      col.isToday ? 'bg-teal-50/70' : ''
                    }`}
                  >
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      {col.dayName}
                    </span>
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-black text-sm my-0.5 ${
                        col.isToday
                          ? 'bg-teal-700 text-white shadow-sm'
                          : 'text-slate-800'
                      }`}
                    >
                      {col.dayNumber}
                    </span>
                    {col.isToday && (
                      <span className="block text-[9px] font-black uppercase tracking-wider text-teal-700">
                        Today
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Time Slot Rows Grid */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {STANDARD_SLOTS.map(slot => (
                  <div key={slot} className="grid grid-cols-8 min-h-[96px] group/row hover:bg-slate-50/30 transition-colors">
                    {/* Time Label */}
                    <div className="p-2 border-r border-slate-200/80 text-[11px] font-mono font-bold text-slate-400 flex items-start justify-center bg-slate-50/40">
                      {slot}
                    </div>

                    {/* 7 Day Cells */}
                    {currentWeekDays.map(col => {
                      // Find appointments in this day and slot
                      const cellAppts = filteredAppointments.filter(a => {
                        if (a.date !== col.dateStr) return false;
                        const aptHour = a.time.split(':')[0];
                        const slotHour = slot.split(':')[0];
                        return aptHour === slotHour && Math.abs(parseInt(a.time.split(':')[1] || '0') - parseInt(slot.split(':')[1] || '0')) < 25;
                      });

                      return (
                        <div
                          key={`${col.dateStr}-${slot}`}
                          className="border-r border-slate-100 p-1 relative group/cell hover:bg-teal-50/30 transition-colors flex flex-col gap-1"
                        >
                          {cellAppts.map(apt => {
                            const config = APPOINTMENT_TYPE_CONFIG[apt.type] || APPOINTMENT_TYPE_CONFIG['Consultation'];
                            return (
                              <div
                                key={apt.id}
                                onClick={() => setSelectedAppointment(apt)}
                                className={`p-1.5 rounded-lg border-l-4 ${config.borderClass} bg-white shadow-xs hover:shadow-md border border-slate-200/70 transition-all cursor-pointer text-left relative overflow-hidden group/card`}
                              >
                                <div className="flex items-center justify-between gap-1 mb-0.5">
                                  <span className="font-mono text-[10px] font-bold text-slate-500">{apt.time}</span>
                                  <span className={`text-[9px] font-black uppercase px-1 py-0.2 rounded border ${config.badgeClass}`}>
                                    {apt.type}
                                  </span>
                                </div>
                                <div className="font-bold text-xs text-slate-900 truncate leading-tight">
                                  {apt.patientName}
                                </div>
                                <div className="text-[10px] text-teal-700 truncate font-medium">
                                  {apt.doctorName.replace('Dr. ', '')}
                                </div>
                                <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1 pt-1 border-t border-slate-100">
                                  <span className="font-mono">{apt.id}</span>
                                  <span
                                    className={`font-bold ${
                                      apt.status === 'Completed' ? 'text-emerald-600' :
                                      apt.status === 'Cancelled' ? 'text-slate-400 line-through' : 'text-amber-600'
                                    }`}
                                  >
                                    {apt.status}
                                  </span>
                                </div>
                              </div>
                            );
                          })}

                          {/* Quick Slot Booking Button on Hover */}
                          {cellAppts.length === 0 && (
                            <button
                              onClick={() => handleOpenSlot(col.dateStr, slot, selectedDoctorFilter !== 'All' ? selectedDoctorFilter : undefined)}
                              className="opacity-0 group-hover/cell:opacity-100 transition-opacity absolute inset-1 m-auto h-7 w-20 rounded-md bg-teal-600/90 text-white text-[10px] font-bold flex items-center justify-center gap-1 shadow-xs hover:bg-teal-700"
                            >
                              <Plus size={12} /> Book
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 2: DOCTOR CHAMBERS DAY TIMETABLE (International Reception Standard) */}
          {viewMode === 'day' && (
            <div className="flex flex-col h-full flex-1">
              <div className="p-3 bg-slate-50 border-b border-slate-200/90 flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">CHAMBER TIMETABLE:</span>
                  <span className="font-black text-teal-800 text-sm">
                    {activeDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <div className="text-slate-500 font-medium">
                  Click any open slot to schedule a consultation with that physician.
                </div>
              </div>

              {/* Doctors Column Headers */}
              <div className={`grid border-b border-slate-200/90 bg-white sticky top-0 z-10 text-xs`} style={{ gridTemplateColumns: `80px repeat(${doctors.length}, minmax(180px, 1fr))` }}>
                <div className="p-3 text-center font-black text-slate-400 uppercase tracking-widest border-r border-slate-200/80">
                  SLOT
                </div>
                {doctors.map(doc => {
                  const chamber = DOCTOR_CHAMBER_MAP[doc.name] || { room: 'Chamber 101', specialty: doc.department };
                  const docTodayCount = appointments.filter(a => a.date === activeDateStr && a.doctorName === doc.name).length;

                  return (
                    <div key={doc.id} className="p-3 border-r border-slate-200/80 text-left bg-slate-50/50">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs truncate">{doc.name}</span>
                        <span className="text-[10px] bg-teal-50 text-teal-700 font-bold px-1.5 py-0.2 rounded border border-teal-200">
                          {docTodayCount} booked
                        </span>
                      </div>
                      <p className="text-[11px] text-teal-600 font-bold mt-0.5">{chamber.room}</p>
                      <p className="text-[10px] text-slate-400 truncate">{chamber.specialty}</p>
                    </div>
                  );
                })}
              </div>

              {/* Time Slots Rows */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {STANDARD_SLOTS.map(slot => (
                  <div
                    key={slot}
                    className="grid min-h-[85px] hover:bg-slate-50/30 transition-colors"
                    style={{ gridTemplateColumns: `80px repeat(${doctors.length}, minmax(180px, 1fr))` }}
                  >
                    {/* Time */}
                    <div className="p-2 border-r border-slate-200/80 text-[11px] font-mono font-bold text-slate-400 flex items-start justify-center bg-slate-50/40">
                      {slot}
                    </div>

                    {/* Each Doctor's Cell */}
                    {doctors.map(doc => {
                      const docAppt = filteredAppointments.find(a => {
                        if (a.date !== activeDateStr) return false;
                        if (a.doctorName !== doc.name) return false;
                        const aptHour = a.time.split(':')[0];
                        const slotHour = slot.split(':')[0];
                        return aptHour === slotHour && Math.abs(parseInt(a.time.split(':')[1] || '0') - parseInt(slot.split(':')[1] || '0')) < 25;
                      });

                      return (
                        <div
                          key={`${doc.id}-${slot}`}
                          className="border-r border-slate-100 p-1.5 relative group/slot hover:bg-teal-50/30 transition-colors flex flex-col justify-center"
                        >
                          {docAppt ? (
                            <div
                              onClick={() => setSelectedAppointment(docAppt)}
                              className="p-2 rounded-xl bg-white border border-teal-200 shadow-xs hover:shadow-md transition-all cursor-pointer text-left border-l-4 border-l-teal-600"
                            >
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="font-mono font-bold text-slate-500">{docAppt.time}</span>
                                <span className="text-[9px] font-bold text-teal-700 bg-teal-50 px-1 py-0.2 rounded border border-teal-100">
                                  {docAppt.type}
                                </span>
                              </div>
                              <div className="font-bold text-xs text-slate-900 mt-1 truncate">
                                {docAppt.patientName}
                              </div>
                              <div className="text-[10px] text-slate-500 flex items-center justify-between mt-1 pt-1 border-t border-slate-100">
                                <span>PID: {docAppt.patientId}</span>
                                <span
                                  className={`font-bold ${
                                    docAppt.status === 'Completed' ? 'text-emerald-600' :
                                    docAppt.status === 'Cancelled' ? 'text-slate-400' : 'text-amber-600'
                                  }`}
                                >
                                  {docAppt.status}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleOpenSlot(activeDateStr, slot, doc.name)}
                              className="opacity-0 group-hover/slot:opacity-100 transition-opacity w-full py-2 rounded-lg border border-dashed border-teal-300 text-teal-700 bg-teal-50/50 hover:bg-teal-100 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Plus size={12} /> Free Slot
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 3: MONTH GRID VIEW */}
          {viewMode === 'month' && (
            <div className="p-4 flex flex-col h-full flex-1">
              <div className="grid grid-cols-7 border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                  <div key={d} className="p-2.5 text-center font-black text-xs text-slate-500 bg-slate-50 border-b border-slate-200 uppercase tracking-wider">
                    {d}
                  </div>
                ))}
                {/* 35 Calendar Cells */}
                {Array.from({ length: 35 }).map((_, i) => {
                  const dayNum = i - 1; // Simulated days of month
                  const isValid = dayNum >= 1 && dayNum <= 30;
                  const dateIso = `2026-11-${dayNum < 10 ? `0${dayNum}` : dayNum}`;
                  const isCurrent = dateIso === activeDateStr;
                  const isToday = dateIso === '2026-11-25';
                  const count = appointments.filter(a => a.date === dateIso).length;

                  return (
                    <div
                      key={i}
                      onClick={() => {
                        if (isValid) {
                          setActiveDateStr(dateIso);
                          setViewMode('week');
                        }
                      }}
                      className={`min-h-[100px] p-2 border-b border-r border-slate-200/70 transition-all ${
                        isValid ? 'hover:bg-teal-50/40 cursor-pointer' : 'bg-slate-50/50 opacity-40'
                      } ${isCurrent ? 'bg-teal-50/60 ring-2 ring-teal-500 ring-inset' : ''}`}
                    >
                      {isValid && (
                        <>
                          <div className="flex justify-between items-center mb-1.5">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                isToday ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-700'
                              }`}
                            >
                              {dayNum}
                            </span>
                            {count > 0 && (
                              <span className="text-[10px] font-bold text-teal-700 bg-teal-100 px-1.5 py-0.2 rounded-full">
                                {count} appts
                              </span>
                            )}
                          </div>
                          {/* Mini chips */}
                          <div className="space-y-1">
                            {appointments.filter(a => a.date === dateIso).slice(0, 2).map(apt => (
                              <div key={apt.id} className="text-[10px] truncate bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-700 font-medium shadow-2xs">
                                <span className="font-bold text-teal-700">{apt.time}</span> {apt.patientName}
                              </div>
                            ))}
                            {count > 2 && (
                              <span className="text-[9px] text-slate-400 block font-bold">
                                +{count - 2} more...
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 4: DIRECTORY LIST VIEW */}
          {viewMode === 'list' && (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/90 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="px-4 py-3.5">Schedule Time</th>
                    <th className="px-4 py-3.5">Token / PID</th>
                    <th className="px-4 py-3.5">Patient Details</th>
                    <th className="px-4 py-3.5">Physician & Chamber</th>
                    <th className="px-4 py-3.5">Visit Nature</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400 italic">
                        No appointments match current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map(apt => {
                      const chamber = DOCTOR_CHAMBER_MAP[apt.doctorName];
                      const config = APPOINTMENT_TYPE_CONFIG[apt.type] || APPOINTMENT_TYPE_CONFIG['Consultation'];

                      return (
                        <tr key={apt.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-4 py-3 font-mono font-bold text-slate-800">
                            <div>{apt.date}</div>
                            <div className="text-[11px] text-teal-700 font-black">{apt.time}</div>
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-500">
                            <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-bold text-slate-700">
                              {apt.id}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">PID: {apt.patientId}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900 text-sm">{apt.patientName}</div>
                            {apt.notes && (
                              <div className="text-[11px] text-slate-400 truncate max-w-xs">{apt.notes}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-teal-900">{apt.doctorName}</div>
                            <div className="text-[10px] text-slate-400">{chamber?.room || 'OPD Room'} • {chamber?.specialty.split('•')[0]}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${config.badgeClass}`}>
                              {apt.type}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                apt.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                apt.status === 'Cancelled' ? 'bg-slate-100 text-slate-500 line-through' :
                                'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                              }`}
                            >
                              {apt.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {apt.status === 'Scheduled' && (
                                <>
                                  <button
                                    onClick={() => handleCheckInToOPD(apt)}
                                    className="px-2 py-1 bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white rounded-lg text-[10px] font-bold border border-teal-200 transition-colors"
                                    title="Check In & Send Directly to OPD Consultation Queue"
                                  >
                                    OPD Queue
                                  </button>
                                  <button
                                    onClick={() => handleStatusChange(apt.id, 'Completed')}
                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                    title="Mark Completed"
                                  >
                                    <CheckCircle size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleStatusChange(apt.id, 'Cancelled')}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Cancel"
                                  >
                                    <XCircle size={16} />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedAppointment(apt);
                                  setPrintDocumentType('patientSlip');
                                  setIsPrintModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                                title="Print Patient Slip"
                              >
                                <Printer size={15} />
                              </button>
                              <button
                                onClick={() => setSelectedAppointment(apt)}
                                className="px-2 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-bold hover:bg-slate-800 transition-colors"
                              >
                                View
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

        </div>

        {/* ======================================================== */}
        {/* 5. SIDEBAR: DOCTOR CHAMBER ROSTERING & QUEUE FEEDER     */}
        {/* ======================================================== */}
        <div className="xl:col-span-1 space-y-5">

          {/* Doctor Presence & Chamber Allocation Card */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/90">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Stethoscope size={18} className="text-teal-600" />
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">Chamber Rostering</h3>
              </div>
              <span className="text-[10px] font-black bg-teal-50 text-teal-700 px-2 py-0.5 rounded border border-teal-200">
                Live
              </span>
            </div>

            <div className="space-y-2.5">
              {doctors.map(doc => {
                const chamber = DOCTOR_CHAMBER_MAP[doc.name] || { room: 'Chamber 101', specialty: doc.department };
                const todayBookings = appointments.filter(a => a.date === activeDateStr && a.doctorName === doc.name).length;
                const isFiltered = selectedDoctorFilter === doc.name;

                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoctorFilter(isFiltered ? 'All' : doc.name)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isFiltered
                        ? 'border-teal-500 bg-teal-50/60 shadow-xs ring-1 ring-teal-500'
                        : 'border-slate-100 hover:border-teal-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-teal-100/70 text-teal-800 flex items-center justify-center font-bold text-xs border border-teal-200">
                          {doc.name.replace('Dr. ', '').charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 leading-tight">{doc.name}</h4>
                          <span className="text-[10px] font-bold text-teal-700">{chamber.room}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {todayBookings} booked
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5 truncate">
                      {chamber.specialty}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setFormDate(activeDateStr);
                  setFormTime('11:00');
                  setFormType('Emergency');
                  setShowNewModal(true);
                }}
                className="w-full py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Flame size={14} className="text-red-600" />
                Emergency Walk-in Slot
              </button>
            </div>
          </div>

          {/* Quick Immediate Queue Feeder Card */}
          <div className="bg-gradient-to-br from-slate-900 to-teal-950 p-5 rounded-2xl text-white shadow-md">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-teal-400">Next In Line</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </div>
            {filteredAppointments.filter(a => a.status === 'Scheduled').slice(0, 1).map(nextApt => (
              <div key={nextApt.id} className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <h4 className="text-sm font-black text-white">{nextApt.patientName}</h4>
                  <span className="font-mono text-xs text-teal-300 font-bold">{nextApt.time}</span>
                </div>
                <p className="text-xs text-slate-300">
                  Assigned to <strong className="text-teal-200">{nextApt.doctorName}</strong> ({DOCTOR_CHAMBER_MAP[nextApt.doctorName]?.room || 'Chamber'})
                </p>
                <button
                  onClick={() => handleCheckInToOPD(nextApt)}
                  className="w-full mt-2 py-2 bg-teal-500 hover:bg-teal-400 text-teal-950 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                >
                  <UserCheck size={14} /> Send to OPD Queue
                </button>
              </div>
            ))}
            {filteredAppointments.filter(a => a.status === 'Scheduled').length === 0 && (
              <p className="text-xs text-slate-400 italic">No scheduled patients pending check-in.</p>
            )}
          </div>

        </div>

      </div>

      {/* ======================================================== */}
      {/* 6. NEW APPOINTMENT MODAL (INTERNATIONAL SPEC)            */}
      {/* ======================================================== */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-teal-800 to-teal-900 p-5 text-white flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-teal-300 block">
                  CLINICAL RESOURCE SCHEDULER
                </span>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <CalendarIcon size={18} className="text-teal-300" /> Book Clinical Appointment
                </h3>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="p-6 space-y-4 text-xs">
              {/* Select Patient */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Patient <span className="text-red-500">*</span>
                </label>
                <select
                  value={formPatientId}
                  onChange={(e) => setFormPatientId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                  required
                >
                  <option value="">-- Search & Select Patient (PID / Name) --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} • PID: {p.id} {p.contact ? `• ${p.contact}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Doctor & Chamber */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Consulting Physician & Chamber <span className="text-red-500">*</span>
                </label>
                <select
                  value={formDoctorName}
                  onChange={(e) => setFormDoctorName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                  required
                >
                  {doctors.map(d => {
                    const ch = DOCTOR_CHAMBER_MAP[d.name];
                    return (
                      <option key={d.id} value={d.name}>
                        {d.name} • {ch?.room || 'Chamber'} ({ch?.specialty.split('•')[0] || d.department})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <CustomDatePicker
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Slot Time <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                    required
                  >
                    {STANDARD_SLOTS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Type Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Appointment Nature <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Consultation', 'Surgery', 'Follow-up', 'Emergency'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormType(type)}
                      className={`py-2 px-1 text-center rounded-xl font-bold text-xs border transition-all ${
                        formType === type
                          ? 'bg-teal-700 text-white border-teal-800 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clinical Indication & Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chief Complaint / Clinical Notes
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Blurry vision in right eye, routine post-op review, corneal screening..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              {/* Auto Check-in Option */}
              <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-teal-900 block">Immediate Arrival Check-In</span>
                  <span className="text-[11px] text-teal-700">Dispatch patient directly into OPD consultation queue now.</span>
                </div>
                <input
                  type="checkbox"
                  checked={formAutoCheckIn}
                  onChange={(e) => setFormAutoCheckIn(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 cursor-pointer"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md shadow-teal-700/20"
                >
                  <Save size={15} /> Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. APPOINTMENT DETAIL SHEET / MODAL                      */}
      {/* ======================================================== */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden text-xs">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono text-teal-400 font-bold">
                  TOKEN: {selectedAppointment.id}
                </span>
                <h3 className="text-base font-black text-white mt-0.5">
                  {selectedAppointment.patientName}
                </h3>
                <span className="text-xs text-slate-300">PID: {selectedAppointment.patientId}</span>
              </div>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-3.5">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Consultant</span>
                  <strong className="text-slate-800 text-xs">{selectedAppointment.doctorName}</strong>
                  <span className="text-[10px] text-teal-700 block font-bold">
                    {DOCTOR_CHAMBER_MAP[selectedAppointment.doctorName]?.room || 'Chamber'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Date & Time</span>
                  <strong className="text-slate-800 text-xs">{selectedAppointment.date}</strong>
                  <span className="text-[11px] font-mono text-teal-700 block font-black">{selectedAppointment.time}</span>
                </div>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 font-bold">Appointment Nature:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${APPOINTMENT_TYPE_CONFIG[selectedAppointment.type]?.badgeClass}`}>
                  {selectedAppointment.type}
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 font-bold">Current Status:</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase ${
                    selectedAppointment.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' :
                    selectedAppointment.status === 'Cancelled' ? 'bg-slate-100 text-slate-500' : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {selectedAppointment.status}
                </span>
              </div>

              {selectedAppointment.notes && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Clinical Notes</span>
                  <p className="text-slate-700 font-medium leading-relaxed">{selectedAppointment.notes}</p>
                </div>
              )}

              {/* Status Action Buttons */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                {selectedAppointment.status === 'Scheduled' && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleCheckInToOPD(selectedAppointment)}
                      className="py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <UserCheck size={14} /> Send to OPD Queue
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedAppointment.id, 'Completed')}
                      className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 size={14} /> Mark Completed
                    </button>
                  </div>
                )}

                <div className="flex gap-2">
                  {selectedAppointment.status === 'Scheduled' && (
                    <button
                      onClick={() => handleStatusChange(selectedAppointment.id, 'Cancelled')}
                      className="flex-1 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-bold"
                    >
                      Cancel Appointment
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setPrintDocumentType('patientSlip');
                      setIsPrintModalOpen(true);
                    }}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-1.5"
                  >
                    <Printer size={14} /> Print Patient Slip
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden printable container for native browser print & PrintSettingsModal */}
      <div id="printable-slip" className="hidden print:block bg-white text-slate-900">
        {renderPrintContent()}
      </div>

      {/* Print Settings Modal */}
      {isPrintModalOpen && (
        <PrintSettingsModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          previewContent={renderPrintContent()}
          defaultPaperSize={printDocumentType === 'runSheet' ? 'A4' : 'A5'}
          documentTitle={
            printDocumentType === 'runSheet'
              ? `Doctor Appointment Run Sheet - ${activeDateStr}`
              : `Appointment Slip - ${selectedAppointment?.id || 'Patient'}`
          }
        />
      )}

    </div>
  );
};

export default Appointments;
