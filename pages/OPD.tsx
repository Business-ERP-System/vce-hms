
import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Patient, Vitals } from '../types';
import { useNavigate } from 'react-router-dom';
import {
    Search, Clock, FileText, Printer, Save, Plus, Trash2, Eye,
    Thermometer, Activity, User, ChevronRight, HeartPulse,
    AlertCircle, CheckCircle, Phone, MapPin, AlertTriangle,
    Grid, List, Stethoscope, Edit, MoreHorizontal, ArrowLeft, Download,
    // Fix: Added missing 'Info' icon to imports
    RefreshCw, ArrowRightLeft, BedDouble, Scissors, Users, X, Heart, Info
} from 'lucide-react';
import { MOCK_EMPLOYEES } from '../constants';

const OPD = () => {
    const { patients, updatePatient, deletePatient, beds, updateBed } = useData();
    const navigate = useNavigate();

    // View State
    const [viewMode, setViewMode] = useState<'list' | 'tiles'>('list');
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

    // Action Modal States
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferType, setTransferType] = useState<'Doctor' | 'IPD' | 'OT'>('Doctor');
    const [transferTarget, setTransferTarget] = useState('');
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusTarget, setStatusTarget] = useState<string>('');

    // Triage Modal State
    const [showTriageModal, setShowTriageModal] = useState(false);
    const [triageForm, setTriageForm] = useState<Vitals>({
        bp: '', pulse: '', temp: '', weight: '', vaRight: '', vaLeft: '', spo2: '', rbs: ''
    });

    // Data Filters
    const opdPatients = patients.filter(p => p.status === 'OPD');
    const doctors = MOCK_EMPLOYEES.filter(e => e.role === 'Doctor' || e.role === 'Chief Ophthalmologist');
    const availableBeds = beds.filter(b => b.status === 'Available');

    // Stats
    const stats = {
        total: patients.filter(p => p.lastVisit === new Date().toISOString().split('T')[0]).length,
        pending: opdPatients.length,
        completed: patients.filter(p => p.status === 'Discharged' && p.lastVisit === new Date().toISOString().split('T')[0]).length,
        newReg: patients.filter(p => p.id.includes('P10') || p.id.includes('P00')).length // Mock metric
    };

    // --- Handlers ---

    const handleStartConsultation = (patient: Patient) => {
        navigate('/emr', { state: { patient } });
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm("Remove patient from queue?")) deletePatient(id);
    }

    const openTransferModal = (e: React.MouseEvent, patient: Patient, type: 'Doctor' | 'IPD' | 'OT') => {
        e.stopPropagation();
        setSelectedPatient(patient);
        setTransferType(type);
        setTransferTarget('');
        setShowTransferModal(true);
    };

    const handleTransfer = () => {
        if (!selectedPatient || !transferTarget) return;

        if (transferType === 'Doctor') {
            updatePatient(selectedPatient.id, { assignedDoctor: transferTarget });
            alert(`Patient referred to ${transferTarget}`);
        } else if (transferType === 'IPD') {
            updateBed(transferTarget, {
                status: 'Occupied',
                patientName: selectedPatient.name,
                admissionDate: new Date().toISOString().split('T')[0]
            });
            updatePatient(selectedPatient.id, { status: 'IPD' });
            alert(`Patient admitted to Bed ID: ${transferTarget}`);
        } else if (transferType === 'OT') {
            alert(`Surgery scheduled for ${transferTarget}`);
        }
        setShowTransferModal(false);
        setSelectedPatient(null);
    };

    const openStatusModal = (e: React.MouseEvent, patient: Patient) => {
        e.stopPropagation();
        setSelectedPatient(patient);
        setStatusTarget(patient.status);
        setShowStatusModal(true);
    };

    const handleStatusUpdate = () => {
        if (selectedPatient && statusTarget) {
            updatePatient(selectedPatient.id, { status: statusTarget as any });
            setShowStatusModal(false);
            setSelectedPatient(null);
        }
    };

    const openTriageModal = (e: React.MouseEvent, patient: Patient) => {
        e.stopPropagation();
        setSelectedPatient(patient);
        if (patient.currentVitals) {
            setTriageForm(patient.currentVitals);
        } else {
            setTriageForm({ bp: '', pulse: '', temp: '', weight: '', vaRight: '', vaLeft: '', spo2: '', rbs: '' });
        }
        setShowTriageModal(true);
    };

    const handleTriageSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedPatient) {
            updatePatient(selectedPatient.id, {
                currentVitals: triageForm,
                // Update vision history OD/OS if VA is provided in triage
                previousVisionHistory: selectedPatient.previousVisionHistory ? {
                    ...selectedPatient.previousVisionHistory,
                    re: { ...selectedPatient.previousVisionHistory.re, va: triageForm.vaRight || selectedPatient.previousVisionHistory.re.va },
                    le: { ...selectedPatient.previousVisionHistory.le, va: triageForm.vaLeft || selectedPatient.previousVisionHistory.le.va }
                } : {
                    re: { sph: '', cyl: '', axis: '', va: triageForm.vaRight },
                    le: { sph: '', cyl: '', axis: '', va: triageForm.vaLeft },
                    notes: 'Captured at triage'
                }
            });
            alert(`Vitals recorded for ${selectedPatient.name}`);
            setShowTriageModal(false);
            setSelectedPatient(null);
        }
    };

    const handleViewRx = (e: React.MouseEvent, patient: Patient) => {
        e.stopPropagation();
        navigate('/e-prescription');
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">OPD Queue & Triage</h1>
                    <p className="text-sm text-slate-500">Manage daily outpatient visits and consultations.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-white border border-slate-200 p-1 rounded-lg flex gap-1">
                        <button onClick={() => setViewMode('list')} className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-teal-50 text-teal-700' : 'text-slate-400 hover:text-slate-600'}`}><List size={18} /></button>
                        <button onClick={() => setViewMode('tiles')} className={`p-2 rounded-md ${viewMode === 'tiles' ? 'bg-teal-50 text-teal-700' : 'text-slate-400 hover:text-slate-600'}`}><Grid size={18} /></button>
                    </div>
                    <button onClick={() => navigate('/registration')} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 flex items-center gap-2 shadow-sm">
                        <Plus size={16} /> Register Patient
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div><p className="text-xs text-slate-500 font-bold uppercase">Total Visits Today</p><h3 className="text-2xl font-bold text-slate-800">{stats.total}</h3></div>
                    <Users className="text-slate-200" size={32} />
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div><p className="text-xs text-slate-500 font-bold uppercase">Waiting / Pending</p><h3 className="text-2xl font-bold text-amber-600">{stats.pending}</h3></div>
                    <Clock className="text-amber-100" size={32} />
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div><p className="text-xs text-slate-500 font-bold uppercase">Completed</p><h3 className="text-2xl font-bold text-green-600">{stats.completed}</h3></div>
                    <CheckCircle className="text-green-100" size={32} />
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div><p className="text-xs text-slate-500 font-bold uppercase">New Reg.</p><h3 className="text-2xl font-bold text-blue-600">{stats.newReg}</h3></div>
                    <Plus className="text-blue-100" size={32} />
                </div>
            </div>

            {viewMode === 'list' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4">Queue No</th>
                                    <th className="px-6 py-4">Patient</th>
                                    <th className="px-6 py-4">Triage Status</th>
                                    <th className="px-6 py-4">Assigned Doctor</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {opdPatients.map((patient, idx) => (
                                    <tr key={patient.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4 font-mono font-medium text-slate-600">#{idx + 1}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-500">{patient.name.charAt(0)}</div>
                                                <div>
                                                    <div className="font-medium text-slate-900">{patient.name}</div>
                                                    <div className="text-xs text-slate-400">{patient.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {patient.currentVitals ? (
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 uppercase"><CheckCircle size={10} /> Vitals Recorded</span>
                                                    <span className="text-xs text-slate-400 font-mono">BP: {patient.currentVitals.bp} | VA: {patient.currentVitals.vaRight}/{patient.currentVitals.vaLeft}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs font-bold text-amber-500 uppercase flex items-center gap-1"><AlertCircle size={10} /> Vitals Pending</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{patient.assignedDoctor || 'Unassigned'}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                                                Waiting
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={(e) => openTriageModal(e, patient)}
                                                    className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                                    title="Triage / Vitals"
                                                >
                                                    <HeartPulse size={16} />
                                                </button>

                                                <button
                                                    onClick={() => handleStartConsultation(patient)}
                                                    className="p-2 bg-teal-50 text-teal-600 hover:bg-teal-100 rounded-lg transition-colors"
                                                    title="Start Consultation (EMR)"
                                                >
                                                    <Stethoscope size={16} />
                                                </button>

                                                <button onClick={(e) => openStatusModal(e, patient)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Update Status">
                                                    <RefreshCw size={16} />
                                                </button>

                                                <button onClick={(e) => openTransferModal(e, patient, 'Doctor')} className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Refer/Transfer">
                                                    <ArrowRightLeft size={16} />
                                                </button>

                                                <button onClick={(e) => handleViewRx(e, patient)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="View Prescription">
                                                    <FileText size={16} />
                                                </button>

                                                <button onClick={(e) => { e.stopPropagation(); navigate('/registration', { state: { patient } }) }} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="Edit Info">
                                                    <Edit size={16} />
                                                </button>

                                                <button onClick={(e) => handleDelete(e, patient.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Remove">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {opdPatients.length === 0 && <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400 italic">No patients in queue.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {viewMode === 'tiles' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {opdPatients.map((patient, idx) => (
                        <div key={patient.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group relative">
                            <div className="absolute top-4 right-4 text-slate-300 font-mono text-xs">#{idx + 1}</div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-lg">
                                    {patient.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">{patient.name}</h3>
                                    <p className="text-xs text-slate-500">{patient.age} Yrs / {patient.gender}</p>
                                </div>
                            </div>
                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">ID</span>
                                    <span className="font-mono text-slate-700">{patient.id}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Triage</span>
                                    <span className={`font-medium ${patient.currentVitals ? 'text-emerald-600' : 'text-amber-500'}`}>
                                        {patient.currentVitals ? 'Completed' : 'Pending'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={(e) => openTriageModal(e, patient)}
                                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-2 shadow-sm transition-colors"
                                >
                                    <HeartPulse size={16} /> Triage
                                </button>
                                <button
                                    onClick={() => handleStartConsultation(patient)}
                                    className="flex-1 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 flex items-center justify-center gap-2 shadow-sm transition-colors"
                                >
                                    <Stethoscope size={16} /> Consult
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Triage / Vitals Modal */}
            {showTriageModal && selectedPatient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-900 text-white flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500 rounded-lg text-white shadow-lg"><HeartPulse size={20} /></div>
                                <div>
                                    <h3 className="font-bold text-lg leading-tight">Patient TriageStation</h3>
                                    <p className="text-xs text-blue-300 font-medium">{selectedPatient.name} • {selectedPatient.id}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowTriageModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleTriageSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* General Vitals */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Physical Vitals</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase">BP (mmHg)</label>
                                            <input className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" value={triageForm.bp} onChange={e => setTriageForm({ ...triageForm, bp: e.target.value })} placeholder="120/80" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Pulse (bpm)</label>
                                            <input className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" value={triageForm.pulse} onChange={e => setTriageForm({ ...triageForm, pulse: e.target.value })} placeholder="72" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Temp (°F)</label>
                                            <input className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" value={triageForm.temp} onChange={e => setTriageForm({ ...triageForm, temp: e.target.value })} placeholder="98.6" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Weight (kg)</label>
                                            <input className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" value={triageForm.weight} onChange={e => setTriageForm({ ...triageForm, weight: e.target.value })} placeholder="70" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase">SPO2 (%)</label>
                                            <input className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" value={triageForm.spo2} onChange={e => setTriageForm({ ...triageForm, spo2: e.target.value })} placeholder="99" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase">RBS (mg/dL)</label>
                                            <input className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" value={triageForm.rbs} onChange={e => setTriageForm({ ...triageForm, rbs: e.target.value })} placeholder="110" />
                                        </div>
                                    </div>
                                </div>

                                {/* Vision Triage */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Vision Screen</h4>
                                    <div className="bg-slate-50 p-4 rounded-xl space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase">VA Right (OD)</label>
                                            <div className="relative">
                                                <Eye className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                                <input className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500" value={triageForm.vaRight} onChange={e => setTriageForm({ ...triageForm, vaRight: e.target.value })} placeholder="e.g. 6/6" />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase">VA Left (OS)</label>
                                            <div className="relative">
                                                <Eye className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                                <input className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500" value={triageForm.vaLeft} onChange={e => setTriageForm({ ...triageForm, vaLeft: e.target.value })} placeholder="e.g. 6/9" />
                                            </div>
                                        </div>
                                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex items-start gap-2">
                                            <Info size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                            <p className="text-xs text-amber-700 font-medium leading-relaxed">
                                                Screening VA is mandatory for all eye patients before consultation.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setShowTriageModal(false)} className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-colors">Discard</button>
                                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2">
                                    <Save size={18} /> Update Patient File
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Transfer / Referral Modal */}
            {showTransferModal && selectedPatient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-slate-900">Transfer / Refer Patient</h3>
                            <button onClick={() => setShowTransferModal(false)}><X size={20} className="text-slate-400" /></button>
                        </div>

                        {/* Tabs */}
                        <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
                            {['Doctor', 'IPD', 'OT'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => { setTransferType(t as any); setTransferTarget(''); }}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${transferType === t ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-4">
                            <p className="text-sm text-slate-600">
                                Transferring <span className="font-bold text-slate-900">{selectedPatient.name}</span> to:
                            </p>

                            {transferType === 'Doctor' && (
                                <select className="w-full p-2 border rounded-lg text-sm" value={transferTarget} onChange={(e) => setTransferTarget(e.target.value)}>
                                    <option value="">Select Doctor</option>
                                    {doctors.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                                </select>
                            )}

                            {transferType === 'IPD' && (
                                <select className="w-full p-2 border rounded-lg text-sm" value={transferTarget} onChange={(e) => setTransferTarget(e.target.value)}>
                                    <option value="">Select Available Bed</option>
                                    {availableBeds.map(b => <option key={b.id} value={b.id}>{b.ward} - Bed {b.number}</option>)}
                                </select>
                            )}

                            {transferType === 'OT' && (
                                <select className="w-full p-2 border rounded-lg text-sm" value={transferTarget} onChange={(e) => setTransferTarget(e.target.value)}>
                                    <option value="">Select Procedure</option>
                                    <option value="Cataract Phaco">Cataract Phaco</option>
                                    <option value="Lasik">Lasik</option>
                                    <option value="Retina">Retina Surgery</option>
                                </select>
                            )}
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowTransferModal(false)} className="flex-1 py-2 border border-slate-200 rounded-lg text-slate-600">Cancel</button>
                            <button onClick={handleTransfer} disabled={!transferTarget} className="flex-1 py-2 bg-teal-600 text-white rounded-lg disabled:opacity-50">Confirm</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Modal */}
            {showStatusModal && selectedPatient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
                        <h3 className="font-bold text-lg mb-4">Update Status</h3>
                        <select className="w-full p-2 border rounded-lg mb-4" value={statusTarget} onChange={(e) => setStatusTarget(e.target.value)}>
                            <option value="OPD">OPD (Waiting)</option>
                            <option value="In-Consult">In Consultation</option>
                            <option value="IPD">Admit (IPD)</option>
                            <option value="Discharged">Discharged</option>
                        </select>
                        <div className="flex gap-2">
                            <button onClick={() => setShowStatusModal(false)} className="flex-1 py-2 border rounded-lg">Cancel</button>
                            <button onClick={handleStatusUpdate} className="flex-1 py-2 bg-blue-600 text-white rounded-lg">Update</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OPD;
