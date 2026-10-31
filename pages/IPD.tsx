
import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Bed, Patient, WardMaster, FloorMaster, Admission, BedCategory, BillingItem } from '../types';
import {
    BedDouble, CheckCircle, Clock, AlertCircle, ArrowRightLeft,
    X, FileText, User, Plus, Grid, List, Edit, Eye,
    LogOut, Save, Printer, DollarSign, Stethoscope, Scissors,
    Search, Info, ShieldCheck, Download, Trash2, ChevronRight, ArrowLeft,
    Settings as CogIcon, LayoutGrid, Layers, MapPin, Building, Activity,
    MoreVertical, ChevronDown, ChevronUp, Database, Mail
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MOCK_EMPLOYEES } from '../constants';
import { downloadPDF, shareToWhatsApp, shareToEmail } from '../services/exportService';

const IPD = () => {
    const {
        patients, beds, wards, floors, admissions,
        addBed, updateBed, deleteBed,
        addWard, updateWard, deleteWard,
        addFloor, updateFloor, deleteFloor,
        addAdmission, updateAdmission, deleteAdmission, addAdmissionItem,
        updatePatient, addTransaction, formatCurrency, currency, billingItems,
        bedCategories, addBedCategory, updateBedCategory, deleteBedCategory,
        addBillingItem, updateBillingItem, deleteBillingItem
    } = useData();
    const navigate = useNavigate();

    const [view, setView] = useState<'dashboard' | 'admission' | 'infrastructure' | 'config' | 'reports'>('dashboard');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [groupBy, setGroupBy] = useState<'none' | 'category' | 'floor' | 'ward'>('none');
    const [infraTab, setInfraTab] = useState<'beds' | 'wards' | 'floors' | 'categories' | 'charges'>('beds');
    const [showInfraModal, setShowInfraModal] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [viewingAdmissionBill, setViewingAdmissionBill] = useState<Admission | null>(null);
    const [showAddItemModal, setShowAddItemModal] = useState(false);
    const [selectedServiceId, setSelectedServiceId] = useState('');
    const [reportFilters, setReportFilters] = useState({
        startDate: '', endDate: '', category: 'All', floor: 'All', ward: 'All'
    });

    // Form States
    const [bedForm, setBedForm] = useState<Partial<Bed>>({ number: '', wardId: '', status: 'Available' });
    const [wardForm, setWardForm] = useState<Partial<WardMaster>>({ name: '', floorId: '', description: '' });
    const [floorForm, setFloorForm] = useState<Partial<FloorMaster>>({ name: '', level: 0 });
    const [categoryForm, setCategoryForm] = useState<Partial<BedCategory>>({ name: '', dailyRent: 0, description: '' });
    const [chargeForm, setChargeForm] = useState<Partial<BillingItem>>({ name: '', price: 0, department: 'IPD', code: '' });

    const [admissionForm, setAdmissionForm] = useState<Partial<Admission>>({
        patientId: '', bedId: '', surgeryName: '', doctorId: '', advancePaid: 0, notes: '', expectedDischargeDate: '',
        relativeName: '', relativeContact: '', caseType: 'Normal', admittedFrom: 'OPD', referredBy: ''
    });

    const doctors = MOCK_EMPLOYEES.filter(e =>
        e.role.toLowerCase().includes('doctor') ||
        e.role.toLowerCase().includes('ophthalmologist') ||
        e.role.toLowerCase().includes('surgeon') ||
        e.name.toLowerCase().startsWith('dr.')
    );
    const availableBeds = beds.filter(b => b.status === 'Available');

    // Infrastructure Grouping Logic
    const groupedBeds = (() => {
        if (groupBy === 'none') return { 'All Clinical Assets': beds };
        const groups: { [key: string]: Bed[] } = {};
        beds.forEach(bed => {
            let key = 'Unassigned';
            if (groupBy === 'category') key = bed.category || 'General Care';
            else if (groupBy === 'floor') {
                const ward = wards.find(w => w.id === bed.wardId);
                const floor = floors.find(f => f.id === ward?.floorId);
                key = floor?.name || 'Unknown Floor';
            } else if (groupBy === 'ward') {
                const ward = wards.find(w => w.id === bed.wardId);
                key = ward?.name || 'Unknown Ward';
            }
            if (!groups[key]) groups[key] = [];
            groups[key].push(bed);
        });
        return groups;
    })();

    // Infrastructure Handlers
    const handleInfraSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (infraTab === 'beds') {
            if (editingItem) updateBed(editingItem.id, bedForm);
            else addBed({ id: `B-${Date.now()}`, ...bedForm } as Bed);
        } else if (infraTab === 'wards') {
            if (editingItem) updateWard(editingItem.id, wardForm);
            else addWard({ id: `W-${Date.now()}`, ...wardForm } as WardMaster);
        } else if (infraTab === 'floors') {
            if (editingItem) updateFloor(editingItem.id, floorForm);
            else addFloor({ id: `F-${Date.now()}`, ...floorForm } as FloorMaster);
        } else if (infraTab === 'categories') {
            if (editingItem) updateBedCategory(editingItem.id, categoryForm);
            else addBedCategory({ id: `CAT-${Date.now()}`, ...categoryForm } as BedCategory);
        } else if (infraTab === 'charges') {
            if (editingItem) updateBillingItem(editingItem.id, chargeForm);
            else addBillingItem({ id: `IPD-${Date.now()}`, ...chargeForm } as BillingItem);
        }
        setShowInfraModal(false);
        setEditingItem(null);
    };

    const handleAdmission = (e: React.FormEvent) => {
        e.preventDefault();
        const p = patients.find(pat => pat.id === admissionForm.patientId);
        const b = beds.find(bed => bed.id === admissionForm.bedId);
        const d = doctors.find(doc => doc.id === admissionForm.doctorId);

        if (!p || !b || !d) return alert("Select valid patient, bed, and doctor.");

        const newAdmission: Admission = {
            id: `ADM-${Date.now().toString().slice(-6)}`,
            patientId: p.id,
            patientName: p.name,
            bedId: b.id,
            bedNumber: b.number,
            doctorId: d.id,
            doctorName: d.name,
            admissionDate: new Date().toISOString().split('T')[0],
            expectedDischargeDate: admissionForm.expectedDischargeDate,
            surgeryName: admissionForm.surgeryName,
            advancePaid: admissionForm.advancePaid || 0,
            status: 'Active',
            notes: admissionForm.notes,
            billItems: [],
            bedCategory: admissionForm.bedCategory,
            relativeName: admissionForm.relativeName,
            relativeContact: admissionForm.relativeContact,
            caseType: admissionForm.caseType as any || 'Normal',
            admittedFrom: admissionForm.admittedFrom as any || 'OPD',
            referredBy: admissionForm.referredBy
        };

        addAdmission(newAdmission);
        updateBed(b.id, { status: 'Occupied', patientId: p.id, admissionId: newAdmission.id });
        updatePatient(p.id, { status: 'IPD', assignedDoctor: d.name });

        if (newAdmission.advancePaid > 0) {
            addTransaction({
                id: `TXN-${Date.now()}`, date: new Date().toISOString().split('T')[0],
                description: `IPD Advance: ${p.name} (${newAdmission.id})`, category: 'Income',
                amount: newAdmission.advancePaid, method: 'Cash'
            });
        }
        alert("Patient Admitted Successfully.");
        setView('dashboard');
    };

    const handleExport = (type: 'admissions' | 'beds') => {
        const data = type === 'admissions' ? admissions : beds;
        const csv = JSON.stringify(data, null, 2);
        const blob = new Blob([csv], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ipd_${type}_data.json`;
        a.click();
    };

    const handleAddBillItem = (admission: Admission) => {
        const service = billingItems.find(s => s.id === selectedServiceId);
        if (service && admission) {
            addAdmissionItem(admission.id, { id: service.id, description: service.name, price: service.price, qty: 1 });
            setSelectedServiceId('');
            setShowAddItemModal(false);
            setViewingAdmissionBill(admissions.find(a => a.id === admission.id) || null);
        }
    };

    const handleProcessDischarge = (adm: Admission) => {
        const patient = patients.find(p => p.id === adm.patientId);
        if (!patient) return;
        navigate('/billing', {
            state: {
                view: 'create_bill',
                department: 'IPD',
                patient: patient,
                items: adm.billItems
            }
        });
    };

    if (view === 'admission') {
        return (
            <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-20">
                <div className="flex items-center gap-4">
                    <button onClick={() => setView('dashboard')} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ArrowLeft size={24} /></button>
                    <h1 className="text-2xl font-bold text-slate-900">In-Patient Admission (IPD)</h1>
                </div>

                <form onSubmit={handleAdmission} className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                    <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-500 rounded-2xl"><User size={28} /></div>
                            <div>
                                <p className="text-xs font-black uppercase text-indigo-300 tracking-widest">Digital Entry Record</p>
                                <h3 className="text-xl font-bold">New IPD Registration</h3>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-black uppercase text-slate-400">Entry Date</p>
                            <p className="font-mono font-bold text-teal-400">{new Date().toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="p-10 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-1">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Registered Patient *</label>
                                <select required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-teal-500" value={admissionForm.patientId} onChange={e => setAdmissionForm({ ...admissionForm, patientId: e.target.value })}>
                                    <option value="">-- Choose Patient --</option>
                                    {patients.filter(p => p.status !== 'IPD').map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Select Available Bed *</label>
                                <select required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={admissionForm.bedId} onChange={e => {
                                    const bed = beds.find(b => b.id === e.target.value);
                                    setAdmissionForm({ ...admissionForm, bedId: e.target.value, bedCategory: bed?.category });
                                }}>
                                    <option value="">-- Choose Available Bed --</option>
                                    {availableBeds.map(b => {
                                        const ward = wards.find(w => w.id === b.wardId);
                                        const cat = bedCategories.find(c => c.name === b.category);
                                        return <option key={b.id} value={b.id}>{b.number} - {b.category || 'General'} ({cat ? formatCurrency(cat.dailyRent) : 'N/A'}/day) - {ward?.name || 'Unit'}</option>;
                                    })}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-1">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Primary Doctor *</label>
                                <select required className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold bg-white" value={admissionForm.doctorId} onChange={e => setAdmissionForm({ ...admissionForm, doctorId: e.target.value })}>
                                    <option value="">-- Select Specialist --</option>
                                    {doctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.role})</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Case Type *</label>
                                <select required className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold bg-white" value={admissionForm.caseType} onChange={e => setAdmissionForm({ ...admissionForm, caseType: e.target.value as any })}>
                                    <option value="Normal">Normal</option>
                                    <option value="MLC">MLC (Medico-Legal Case)</option>
                                    <option value="Free">Free / Charity</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Admitted From *</label>
                                <select required className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold bg-white" value={admissionForm.admittedFrom} onChange={e => setAdmissionForm({ ...admissionForm, admittedFrom: e.target.value as any })}>
                                    <option value="OPD">OPD Clinic</option>
                                    <option value="Emergency">Emergency / ER</option>
                                    <option value="Direct">Direct Admission</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-100 pt-8">
                            <div className="space-y-1">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Relative / Attendant Name</label>
                                <input className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold" placeholder="Full name of Next of Kin" value={admissionForm.relativeName} onChange={e => setAdmissionForm({ ...admissionForm, relativeName: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Attendant Contact No</label>
                                <input className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold" placeholder="Contact number" value={admissionForm.relativeContact} onChange={e => setAdmissionForm({ ...admissionForm, relativeContact: e.target.value })} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-1">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Planned Procedure (if any)</label>
                                <input className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold" placeholder="e.g. Cataract Phaco" value={admissionForm.surgeryName} onChange={e => setAdmissionForm({ ...admissionForm, surgeryName: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Referred By</label>
                                <input className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold" placeholder="Referring Doctor name" value={admissionForm.referredBy} onChange={e => setAdmissionForm({ ...admissionForm, referredBy: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Admission Advance ({currency === 'BDT' ? '৳' : '$'})</label>
                                <input type="number" className="w-full p-3 border border-slate-200 rounded-xl text-sm font-black text-teal-700" value={admissionForm.advancePaid} onChange={e => setAdmissionForm({ ...admissionForm, advancePaid: parseFloat(e.target.value) })} />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Clinical Admission Notes</label>
                            <textarea className="w-full p-3 border border-slate-200 rounded-xl text-sm min-h-[100px] resize-none" value={admissionForm.notes} onChange={e => setAdmissionForm({ ...admissionForm, notes: e.target.value })} placeholder="Any special instructions or pre-op requirements..." />
                        </div>

                        <button type="submit" className="w-full py-5 bg-teal-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-teal-100 hover:bg-teal-700 transition-all flex items-center justify-center gap-2">
                            <CheckCircle size={20} /> Confirm Admission & Allocate Resources
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    if (view === 'infrastructure') {
        return (
            <div className="space-y-6 animate-in fade-in duration-300 pb-20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setView('dashboard')} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ArrowLeft size={24} /></button>
                        <h1 className="text-2xl font-bold text-slate-900">Hospital Infrastructure Master</h1>
                    </div>
                    <button onClick={() => { setEditingItem(null); setShowInfraModal(true); }} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg flex items-center gap-2">
                        <Plus size={18} /> Add {infraTab.slice(0, -1)}
                    </button>
                </div>

                <div className="flex bg-white p-1 rounded-2xl border border-slate-200 w-fit shadow-sm overflow-x-auto">
                    <button onClick={() => setInfraTab('floors')} className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${infraTab === 'floors' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Floors</button>
                    <button onClick={() => setInfraTab('wards')} className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${infraTab === 'wards' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Wards</button>
                    <button onClick={() => setInfraTab('beds')} className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${infraTab === 'beds' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Beds</button>
                    <button onClick={() => setInfraTab('categories')} className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${infraTab === 'categories' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Bed Categories</button>
                    <button onClick={() => setInfraTab('charges')} className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${infraTab === 'charges' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>IPD Charges</button>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-black uppercase text-xs tracking-widest">
                                <tr>
                                    <th className="px-8 py-5">Identity / Name</th>
                                    {(infraTab === 'beds' || infraTab === 'charges') && <th className="px-8 py-5">Category / Dept</th>}
                                    {infraTab === 'wards' && <th className="px-8 py-5">Floor</th>}
                                    <th className="px-8 py-5">Status / Detail / Price</th>
                                    <th className="px-8 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {infraTab === 'floors' && floors.map(f => (
                                    <tr key={f.id} className="hover:bg-slate-50 group">
                                        <td className="px-8 py-5 font-bold">{f.name}</td>
                                        <td className="px-8 py-5 text-slate-500">Level {f.level}</td>
                                        <td className="px-8 py-5 text-right">
                                            <button onClick={() => { setEditingItem(f); setFloorForm(f); setShowInfraModal(true); }} className="p-2 text-slate-400 hover:text-indigo-600"><Edit size={16} /></button>
                                            <button onClick={() => deleteFloor(f.id)} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                                {infraTab === 'wards' && wards.map(w => (
                                    <tr key={w.id} className="hover:bg-slate-50 group">
                                        <td className="px-8 py-5 font-bold">{w.name}</td>
                                        <td className="px-8 py-5">{floors.find(f => f.id === w.floorId)?.name || 'Unknown'}</td>
                                        <td className="px-8 py-5 text-slate-500">{w.description}</td>
                                        <td className="px-8 py-5 text-right">
                                            <button onClick={() => { setEditingItem(w); setWardForm(w); setShowInfraModal(true); }} className="p-2 text-slate-400 hover:text-indigo-600"><Edit size={16} /></button>
                                            <button onClick={() => deleteWard(w.id)} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                                {infraTab === 'beds' && beds.map(b => {
                                    const ward = wards.find(w => w.id === b.wardId);
                                    return (
                                        <tr key={b.id} className="hover:bg-slate-50 group">
                                            <td className="px-8 py-5 font-bold">Bed {b.number}</td>
                                            <td className="px-8 py-5">{ward?.name || 'General'}</td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${b.status === 'Occupied' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>{b.status}</span>
                                                    {b.category && <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-bold">{b.category}</span>}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button onClick={() => { setEditingItem(b); setBedForm(b); setShowInfraModal(true); }} className="p-2 text-slate-400 hover:text-indigo-600"><Edit size={16} /></button>
                                                <button onClick={() => deleteBed(b.id)} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 size={16} /></button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {infraTab === 'categories' && bedCategories.map(c => (
                                    <tr key={c.id} className="hover:bg-slate-50 group">
                                        <td className="px-8 py-5 font-bold">{c.name}</td>
                                        <td className="px-8 py-5 text-slate-500">{c.description || '--'}</td>
                                        <td className="px-8 py-5 font-black text-indigo-600">{formatCurrency(c.dailyRent)}/day</td>
                                        <td className="px-8 py-5 text-right">
                                            <button onClick={() => { setEditingItem(c); setCategoryForm(c); setShowInfraModal(true); }} className="p-2 text-slate-400 hover:text-indigo-600"><Edit size={16} /></button>
                                            <button onClick={() => deleteBedCategory(c.id)} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                                {infraTab === 'charges' && billingItems.filter(bi => bi.department === 'IPD').map(bi => (
                                    <tr key={bi.id} className="hover:bg-slate-50 group">
                                        <td className="px-8 py-5 font-bold">{bi.name}</td>
                                        <td className="px-8 py-5"><span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{bi.department}</span></td>
                                        <td className="px-8 py-5 font-black text-teal-600">{formatCurrency(bi.price)}</td>
                                        <td className="px-8 py-5 text-right">
                                            <button onClick={() => { setEditingItem(bi); setChargeForm(bi); setShowInfraModal(true); }} className="p-2 text-slate-400 hover:text-indigo-600"><Edit size={16} /></button>
                                            <button onClick={() => deleteBillingItem(bi.id)} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Infrastructure Modal */}
                {showInfraModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                                <h3 className="font-bold">Manage {infraTab.charAt(0).toUpperCase() + infraTab.slice(1, -1)}</h3>
                                <button onClick={() => setShowInfraModal(false)}><X /></button>
                            </div>
                            <form onSubmit={handleInfraSubmit} className="p-8 space-y-4">
                                {infraTab === 'floors' && (
                                    <>
                                        <input required placeholder="Floor Name" className="w-full p-3 border rounded-xl" value={floorForm.name} onChange={e => setFloorForm({ ...floorForm, name: e.target.value })} />
                                        <input required type="number" placeholder="Level Index" className="w-full p-3 border rounded-xl" value={floorForm.level} onChange={e => setFloorForm({ ...floorForm, level: parseInt(e.target.value) })} />
                                    </>
                                )}
                                {infraTab === 'wards' && (
                                    <>
                                        <input required placeholder="Ward Name" className="w-full p-3 border rounded-xl" value={wardForm.name} onChange={e => setWardForm({ ...wardForm, name: e.target.value })} />
                                        <select required className="w-full p-3 border rounded-xl bg-white" value={wardForm.floorId} onChange={e => setWardForm({ ...wardForm, floorId: e.target.value })}>
                                            <option value="">-- Select Floor --</option>
                                            {floors.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                        </select>
                                        <textarea placeholder="Description" className="w-full p-3 border rounded-xl" value={wardForm.description} onChange={e => setWardForm({ ...wardForm, description: e.target.value })} />
                                    </>
                                )}
                                {infraTab === 'beds' && (
                                    <>
                                        <input required placeholder="Bed Number / Label" className="w-full p-3 border rounded-xl" value={bedForm.number} onChange={e => setBedForm({ ...bedForm, number: e.target.value })} />
                                        <select required className="w-full p-3 border rounded-xl bg-white" value={bedForm.wardId} onChange={e => setBedForm({ ...bedForm, wardId: e.target.value })}>
                                            <option value="">-- Select Ward --</option>
                                            {wards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                        </select>
                                        <select className="w-full p-3 border rounded-xl bg-white" value={bedForm.status} onChange={e => setBedForm({ ...bedForm, status: e.target.value as any })}>
                                            <option>Available</option><option>Occupied</option><option>Cleaning</option><option>Maintenance</option>
                                        </select>
                                        <select className="w-full p-3 border rounded-xl bg-white font-bold" value={bedForm.category} onChange={e => setBedForm({ ...bedForm, category: e.target.value })}>
                                            <option value="">-- Select Bed Category --</option>
                                            {bedCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                        </select>
                                    </>
                                )}
                                {infraTab === 'categories' && (
                                    <>
                                        <input required placeholder="Category Name (e.g. VIP Cabin)" className="w-full p-3 border rounded-xl" value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} />
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{currency === 'BDT' ? '৳' : '$'}</span>
                                            <input required type="number" placeholder="Daily Rent" className="w-full p-3 pl-8 border rounded-xl font-black text-teal-700" value={categoryForm.dailyRent} onChange={e => setCategoryForm({ ...categoryForm, dailyRent: parseFloat(e.target.value) })} />
                                        </div>
                                        <textarea placeholder="Category Description" className="w-full p-3 border rounded-xl" value={categoryForm.description} onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })} />
                                    </>
                                )}
                                {infraTab === 'charges' && (
                                    <>
                                        <input required placeholder="Charge Name (e.g. Nursing Fee)" className="w-full p-3 border rounded-xl font-bold" value={chargeForm.name} onChange={e => setChargeForm({ ...chargeForm, name: e.target.value })} />
                                        <input placeholder="Service Code" className="w-full p-3 border rounded-xl font-mono" value={chargeForm.code} onChange={e => setChargeForm({ ...chargeForm, code: e.target.value })} />
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{currency === 'BDT' ? '৳' : '$'}</span>
                                            <input required type="number" placeholder="Charge Price" className="w-full p-3 pl-8 border rounded-xl font-black text-teal-700" value={chargeForm.price} onChange={e => setChargeForm({ ...chargeForm, price: parseFloat(e.target.value) })} />
                                        </div>
                                    </>
                                )}
                                <button type="submit" className="w-full py-4 bg-teal-600 text-white rounded-2xl font-bold uppercase text-xs tracking-widest hover:bg-teal-700">Save Asset Configuration</button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (view === 'reports') {
        return (
            <div className="space-y-6 animate-in fade-in duration-300 pb-20">
                <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                    <button onClick={() => setView('dashboard')} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-100 transition-all flex items-center gap-2 font-black text-xs uppercase tracking-widest">
                        <ArrowLeft size={18} /> Back to Dashboard
                    </button>
                    <div className="flex gap-2">
                        <button onClick={() => window.print()} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-100">
                            <Printer size={18} /> Print Statement
                        </button>
                        <button onClick={() => handleExport('admissions')} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 flex items-center gap-2">
                            <Download size={18} /> Export Data
                        </button>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8 border-b border-slate-50 pb-8">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 flex-1 w-full">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Start Date</label>
                                <input type="date" className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold bg-slate-50 focus:bg-white transition-all outline-none" value={reportFilters.startDate} onChange={e => setReportFilters({ ...reportFilters, startDate: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">End Date</label>
                                <input type="date" className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold bg-slate-50 focus:bg-white transition-all outline-none" value={reportFilters.endDate} onChange={e => setReportFilters({ ...reportFilters, endDate: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Bed Category</label>
                                <select className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold bg-slate-50 focus:bg-white transition-all outline-none" value={reportFilters.category} onChange={e => setReportFilters({ ...reportFilters, category: e.target.value })}>
                                    <option value="All">All Categories</option>
                                    {bedCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Hospital Floor</label>
                                <select className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold bg-slate-50 focus:bg-white transition-all outline-none" value={reportFilters.floor} onChange={e => setReportFilters({ ...reportFilters, floor: e.target.value })}>
                                    <option value="All">All Floors</option>
                                    {floors.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Clinical Ward</label>
                                <select className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold bg-slate-50 focus:bg-white transition-all outline-none" value={reportFilters.ward} onChange={e => setReportFilters({ ...reportFilters, ward: e.target.value })}>
                                    <option value="All">All Wards</option>
                                    {wards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div id="ipd-ledger-report" className="overflow-x-auto">
                        <div className="mb-10 text-center hidden print:block">
                            <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Bed Ledger Statement</h2>
                            <p className="text-slate-500 font-bold mt-1 uppercase text-xs tracking-widest">Visionary Care HMS Enterprise</p>
                        </div>
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-400 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-5 text-xs font-black uppercase tracking-widest">Adm. Date</th>
                                    <th className="px-6 py-5 text-xs font-black uppercase tracking-widest">Patient Details</th>
                                    <th className="px-6 py-5 text-xs font-black uppercase tracking-widest">Bed / Allocation</th>
                                    <th className="px-6 py-5 text-xs font-black uppercase tracking-widest">Clinical Team</th>
                                    <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-right">Advance Paid</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {admissions.filter(adm => {
                                    const bed = beds.find(b => b.id === adm.bedId);
                                    const ward = wards.find(w => w.id === bed?.wardId);
                                    const floor = floors.find(f => f.id === ward?.floorId);
                                    const matchCategory = reportFilters.category === 'All' || adm.bedCategory === reportFilters.category;
                                    const matchFloor = reportFilters.floor === 'All' || floor?.id === reportFilters.floor;
                                    const matchWard = reportFilters.ward === 'All' || ward?.id === reportFilters.ward;
                                    const matchStart = !reportFilters.startDate || adm.admissionDate >= reportFilters.startDate;
                                    const matchEnd = !reportFilters.endDate || adm.admissionDate <= reportFilters.endDate;
                                    return matchCategory && matchFloor && matchWard && matchStart && matchEnd;
                                }).map(adm => {
                                    const bed = beds.find(b => b.id === adm.bedId);
                                    const ward = wards.find(w => w.id === bed?.wardId);
                                    const floor = floors.find(f => f.id === ward?.floorId);
                                    return (
                                        <tr key={adm.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-5 font-mono text-xs font-bold text-slate-500">{adm.admissionDate}</td>
                                            <td className="px-6 py-5">
                                                <div className="font-black text-slate-900">{adm.patientName}</div>
                                                <div className="text-xs text-indigo-600 font-black uppercase tracking-tighter">{adm.id}</div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black text-slate-900">{adm.bedNumber}</span>
                                                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-black uppercase">{adm.bedCategory}</span>
                                                </div>
                                                <div className="text-xs text-slate-400 font-bold uppercase tracking-tighter mt-1">{floor?.name || 'NA'} • {ward?.name || 'NA'}</div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="font-bold text-slate-800">{adm.doctorName}</div>
                                                <div className="text-xs text-teal-600 font-black uppercase tracking-widest">{adm.caseType}</div>
                                            </td>
                                            <td className="px-6 py-5 text-right font-black text-slate-900">{formatCurrency(adm.advancePaid)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-tighter">In-Patient Wing (IPD)</h1>
                    <p className="text-sm text-slate-500">Live admission logs, clinical beds, and infrastructure setup.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setView('reports')} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 flex items-center gap-2">
                        <FileText size={18} /> Bed Ledger Reports
                    </button>
                    <button onClick={() => setView('infrastructure')} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 flex items-center gap-2">
                        <CogIcon size={18} /> IPD Setup & Configuration
                    </button>
                    <button onClick={() => setView('admission')} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2">
                        <Plus size={18} /> Process New Admission
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Asset Inventory', value: beds.length, icon: Building, color: 'text-blue-600 bg-blue-50' },
                    { label: 'Resident Count', value: beds.filter(b => b.status === 'Occupied').length, icon: User, color: 'text-rose-600 bg-rose-50' },
                    { label: 'Available Beds', value: beds.filter(b => b.status === 'Available').length, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
                    { label: 'Sanitization', value: beds.filter(b => b.status === 'Cleaning').length, icon: Clock, color: 'text-amber-600 bg-amber-50' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                        <div><p className="text-xs font-black uppercase text-slate-400 tracking-widest">{stat.label}</p><h3 className="text-2xl font-black mt-1">{stat.value}</h3></div>
                        <div className={`p-3 rounded-xl ${stat.color}`}><stat.icon size={24} /></div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex gap-2">
                        <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-white shadow-sm text-teal-600' : 'text-slate-400'}`}><Grid size={20} /></button>
                        <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-white shadow-sm text-teal-600' : 'text-slate-400'}`}><List size={20} /></button>
                    </div>
                    <div className="flex gap-4 items-center">
                        <select
                            className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold bg-white text-slate-600 outline-none focus:ring-2 focus:ring-teal-500"
                            value={groupBy}
                            onChange={(e) => setGroupBy(e.target.value as any)}
                        >
                            <option value="none">Ungrouped View</option>
                            <option value="category">By Bed Category</option>
                            <option value="floor">By Floor Level</option>
                            <option value="ward">By Clinical Ward</option>
                        </select>
                        <button onClick={() => handleExport('admissions')} className="p-2 text-slate-400 hover:text-indigo-600" title="Export JSON Data"><Download size={20} /></button>
                        <button onClick={() => window.print()} className="p-2 text-slate-400 hover:text-indigo-600" title="Print Current View"><Printer size={20} /></button>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none" placeholder="Search beds or patients..." />
                        </div>
                    </div>
                </div>

                {viewMode === 'grid' ? (
                    <div className="p-8 space-y-12">
                        {Object.entries(groupedBeds).map(([groupName, groupBeds]) => (
                            <div key={groupName} className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                        {groupBy === 'floor' ? <Layers size={18} /> : groupBy === 'ward' ? <MapPin size={18} /> : <Building size={18} />}
                                    </div>
                                    <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">{groupName} ({groupBeds.length})</h4>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {groupBeds.map(bed => {
                                        const ward = wards.find(w => w.id === bed.wardId);
                                        const patient = patients.find(p => p.id === bed.patientId);
                                        return (
                                            <div key={bed.id} className={`p-6 rounded-3xl border-2 transition-all hover:shadow-xl bg-white ${bed.status === 'Occupied' ? 'border-rose-100' : 'border-slate-50'}`}>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className={`p-3 rounded-2xl ${bed.status === 'Occupied' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}><BedDouble size={24} /></div>
                                                    <div className="text-right">
                                                        <span className={`text-xs font-black uppercase px-2 py-1 rounded-full ${bed.status === 'Occupied' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>{bed.status}</span>
                                                        {bed.category && <div className="mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{bed.category}</div>}
                                                    </div>
                                                </div>
                                                <h3 className="text-xl font-black text-slate-900">{bed.number}</h3>
                                                <p className="text-xs font-bold text-slate-400 uppercase mb-4">{ward?.name || 'General Unit'}</p>

                                                {bed.patientId ? (
                                                    <div className="pt-4 border-t border-slate-100">
                                                        <p className="text-xs font-black text-slate-400 uppercase mb-1">Active Resident</p>
                                                        <p className="font-bold text-sm text-slate-800 truncate">{patient?.name || 'Unknown Patient'}</p>
                                                        <div className="mt-3 flex gap-2">
                                                            <button onClick={() => {
                                                                const adm = admissions.find(a => a.id === bed.admissionId);
                                                                if (adm) setViewingAdmissionBill(adm);
                                                            }} className="flex-1 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">View Bill</button>
                                                            <button onClick={() => {
                                                                const adm = admissions.find(a => a.id === bed.admissionId);
                                                                if (adm) handleProcessDischarge(adm);
                                                            }} className="flex-1 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800">Checkout</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setView('admission')} className="w-full mt-4 py-3 bg-teal-50 text-teal-700 border border-teal-100 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-teal-600 hover:text-white transition-all">Assign Patient</button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-400 font-black uppercase text-xs tracking-widest border-b border-slate-100">
                                <tr>
                                    <th className="px-8 py-5">Admission ID</th>
                                    <th className="px-8 py-5">Patient Name</th>
                                    <th className="px-8 py-5">Bed / Unit</th>
                                    <th className="px-8 py-5">Surgeon / Doctor</th>
                                    <th className="px-8 py-5">Admission Date</th>
                                    <th className="px-8 py-5">Status</th>
                                    <th className="px-8 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {admissions.map(adm => (
                                    <tr key={adm.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-8 py-5 font-mono text-xs font-bold text-indigo-600">{adm.id}</td>
                                        <td className="px-8 py-5"><div className="font-black text-slate-900">{adm.patientName}</div><div className="text-xs text-slate-400 font-bold uppercase">ID: {adm.patientId}</div></td>
                                        <td className="px-8 py-5 font-bold text-slate-800">{adm.bedNumber}</td>
                                        <td className="px-8 py-5 text-slate-700 font-medium">{adm.doctorName}</td>
                                        <td className="px-8 py-5 font-mono text-slate-500">{adm.admissionDate}</td>
                                        <td className="px-8 py-5">
                                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase border ${adm.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-700 border-slate-100'}`}>{adm.status}</span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => setViewingAdmissionBill(adm)} className="p-2 text-slate-400 hover:text-indigo-600" title="View Running Bill"><DollarSign size={16} /></button>
                                                <button onClick={() => handleProcessDischarge(adm)} className="p-2 text-slate-400 hover:text-emerald-600" title="Process Discharge"><LogOut size={16} /></button>
                                                <button className="p-2 text-slate-400 hover:text-indigo-600" title="Edit Admission"><Edit size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {admissions.length === 0 && <tr><td colSpan={7} className="px-8 py-10 text-center text-slate-400 italic">No active patient admissions found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            {/* Admission Bill Modal */}
            {viewingAdmissionBill && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg">Running Bill: {viewingAdmissionBill.patientName}</h3>
                                <p className="text-xs text-slate-400 font-mono">{viewingAdmissionBill.id}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => downloadPDF('ipd-running-bill', `Bill_${viewingAdmissionBill.patientName}.pdf`)}
                                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
                                    title="Export PDF"
                                >
                                    <Download size={18} />
                                </button>
                                <button
                                    onClick={() => shareToWhatsApp('ipd-running-bill', `Running Bill for ${viewingAdmissionBill.patientName}: ${viewingAdmissionBill.id}`)}
                                    className="p-2 hover:bg-slate-800 rounded-lg text-green-500 transition-colors"
                                    title="Share to WhatsApp"
                                >
                                    <Mail size={18} />
                                </button>
                                <button onClick={() => setViewingAdmissionBill(null)} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X /></button>
                            </div>
                        </div>
                        <div className="p-8 flex-1 overflow-y-auto" id="ipd-running-bill">
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="text-sm font-black uppercase text-slate-400 tracking-widest">Billable Items</h4>
                                <button onClick={() => setShowAddItemModal(true)} className="px-4 py-2 bg-teal-50 text-teal-700 rounded-xl text-xs font-bold border border-teal-100 flex items-center gap-2 transition-all hover:bg-teal-600 hover:text-white"><Plus size={14} /> Add Service</button>
                            </div>

                            <table className="w-full text-sm">
                                <thead className="text-slate-400 font-bold border-b border-slate-100">
                                    <tr>
                                        <th className="py-3 text-left">Description</th>
                                        <th className="py-3 text-center">Qty</th>
                                        <th className="py-3 text-right">Unit Price</th>
                                        <th className="py-3 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {viewingAdmissionBill.billItems.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="py-3 font-medium text-slate-900">{item.description}</td>
                                            <td className="py-3 text-center">{item.qty}</td>
                                            <td className="py-3 text-right">{formatCurrency(item.price)}</td>
                                            <td className="py-3 text-right font-bold">{formatCurrency(item.price * item.qty)}</td>
                                        </tr>
                                    ))}
                                    {viewingAdmissionBill.billItems.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="py-10 text-center text-slate-400 italic">No billable items added yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 border-slate-900">
                                        <td colSpan={3} className="py-4 text-right font-black uppercase text-xs tracking-widest text-slate-400">Total Outstanding</td>
                                        <td className="py-4 text-right font-black text-xl text-slate-900">{formatCurrency(viewingAdmissionBill.billItems.reduce((acc, i) => acc + (i.price * i.qty), 0))}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4">
                            <button onClick={() => handleProcessDischarge(viewingAdmissionBill)} className="flex-1 py-4 bg-teal-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-teal-100 hover:bg-teal-700 transition-all">Proceed to Checkout</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Item Modal */}
            {showAddItemModal && viewingAdmissionBill && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in zoom-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                            <h3 className="font-bold">Add Service to Bill</h3>
                            <button onClick={() => setShowAddItemModal(false)}><X /></button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-1">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Select Service</label>
                                <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-teal-500" value={selectedServiceId} onChange={e => setSelectedServiceId(e.target.value)}>
                                    <option value="">-- Choose Service / Item --</option>
                                    {billingItems.filter(s => s.department === 'IPD' || s.department === 'General').map(s => (
                                        <option key={s.id} value={s.id}>{s.name} - {formatCurrency(s.price)}</option>
                                    ))}
                                </select>
                            </div>
                            <button onClick={() => handleAddBillItem(viewingAdmissionBill)} disabled={!selectedServiceId} className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-teal-700 disabled:opacity-50 disabled:bg-slate-400">Add to Running Bill</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IPD;
