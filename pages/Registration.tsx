
import React, { useState, useEffect } from 'react';
import {
    Save, User, Phone, MapPin, Calendar, FileText, CreditCard,
    Activity, Upload, Printer, CheckCircle, Eye, Info, UserCheck,
    ShieldCheck, DollarSign, Stethoscope, Briefcase, Map as MapIcon,
    FlaskConical, Microscope, Users, Home, Archive, Mail, Tag,
    ChevronRight, ArrowLeft, UserPlus, Plus, Trash2, Edit3, Check, X, Settings
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { Patient, PreviousVisionHistory, RoomMaster } from '../types';
import { useNavigate, useLocation } from 'react-router-dom';
import { MOCK_EMPLOYEES } from '../constants';

const Registration = () => {
    const { addPatient, getRecommendedOPDRoom, rooms, addRoom, deleteRoom, updateRoom, addTransaction, currency, hasPermission, campaigns } = useData();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSuccess, setIsSuccess] = useState(false);

    const canAdd = hasPermission('Patient Registration', 'add');

    const [serviceType, setServiceType] = useState<'OPD' | 'Lab' | 'Diagnosis'>('OPD');
    const doctors = MOCK_EMPLOYEES.filter(e => e.role.includes('Doctor'));

    const [formData, setFormData] = useState({
        name: '', dob: '', ageYrs: '', ageMns: '0', gender: 'Male',
        paymentCategory: 'Pay', speciality: 'Ophthalmology', patientType: 'New',
        allocation: '', mrLocation: '', nextOfKin: '', village: '',
        postOffice: '', postCode: '', upazilla: '', district: '',
        state: '', country: 'Bangladesh', contact: '', altContact: '', email: '',
        remarks: '', registrationFee: '100', diagnosis: '', assignedDoctor: '', campaignId: ''
    });

    const [selectedRoomId, setSelectedRoomId] = useState<string>('');

    // Room Management State Variables
    const [showRoomModal, setShowRoomModal] = useState(false);
    const [newRoomNumber, setNewRoomNumber] = useState('');
    const [newRoomName, setNewRoomName] = useState('');
    const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
    const [editingRoomNumber, setEditingRoomNumber] = useState('');
    const [editingRoomName, setEditingRoomName] = useState('');

    const handleAddRoom = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRoomNumber || !newRoomName) return;
        const newRoom: RoomMaster = {
            id: `R-${Date.now()}`,
            roomNumber: newRoomNumber,
            name: newRoomName,
            type: serviceType,
            currentLoad: 0
        };
        addRoom(newRoom);
        setNewRoomNumber('');
        setNewRoomName('');
        // Automatically select the new room
        setSelectedRoomId(newRoom.id);
    };

    const handleStartEditRoom = (room: RoomMaster) => {
        setEditingRoomId(room.id);
        setEditingRoomNumber(room.roomNumber);
        setEditingRoomName(room.name);
    };

    const handleSaveEditRoom = (id: string) => {
        if (!editingRoomNumber || !editingRoomName) return;
        updateRoom(id, {
            roomNumber: editingRoomNumber,
            name: editingRoomName
        });
        setEditingRoomId(null);
    };

    const handleDeleteRoom = (id: string) => {
        if (confirm("Are you sure you want to delete this counter room?")) {
            deleteRoom(id);
            // If the deleted room was selected, select another one
            if (selectedRoomId === id) {
                const remaining = rooms.filter(r => r.id !== id && r.type === serviceType);
                if (remaining.length > 0) {
                    setSelectedRoomId(remaining[0].id);
                } else {
                    setSelectedRoomId('');
                }
            }
        }
    };

    useEffect(() => {
        const rec = getRecommendedOPDRoom(serviceType);
        if (rec) setSelectedRoomId(rec.id);
    }, [serviceType, getRecommendedOPDRoom]);

    useEffect(() => {
        if (location.state?.patient) {
            const p = location.state.patient as Patient;
            setFormData({
                name: p.name, dob: p.dob || '', ageYrs: p.age.toString(), ageMns: (p.ageMonths || 0).toString(),
                gender: p.gender, paymentCategory: p.paymentCategory, speciality: p.speciality,
                patientType: p.patientType, allocation: p.allocation, mrLocation: p.mrLocation,
                nextOfKin: p.nextOfKin, village: p.village, postOffice: p.postOffice,
                postCode: p.postCode, upazilla: p.upazilla, district: p.district,
                state: p.state, country: p.country, contact: p.contact,
                altContact: p.altContact || '', email: p.email || '',
                remarks: p.remarks, registrationFee: p.registrationFee.toString(),
                diagnosis: p.diagnosis, assignedDoctor: p.assignedDoctor || ''
            });
        }
    }, [location.state]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newId = `PID-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
        const room = rooms.find(r => r.id === selectedRoomId);

        const newPatient: Patient = {
            id: newId,
            name: formData.name,
            age: parseInt(formData.ageYrs) || 0,
            ageMonths: parseInt(formData.ageMns) || 0,
            dob: formData.dob,
            gender: formData.gender as any,
            contact: formData.contact,
            altContact: formData.altContact,
            email: formData.email,
            lastVisit: new Date().toISOString().split('T')[0],
            diagnosis: formData.diagnosis || 'New Registration',
            status: 'OPD',
            assignedRoom: room?.roomNumber,
            assignedDoctor: formData.assignedDoctor,
            paymentCategory: formData.paymentCategory as any,
            speciality: formData.speciality,
            patientType: formData.patientType,
            allocation: formData.allocation || room?.name || '',
            mrLocation: formData.mrLocation,
            nextOfKin: formData.nextOfKin,
            village: formData.village,
            postOffice: formData.postOffice,
            postCode: formData.postCode,
            upazilla: formData.upazilla,
            district: formData.district,
            state: formData.state,
            country: formData.country,
            remarks: formData.remarks,
            registrationFee: parseFloat(formData.registrationFee) || 0,
            visitHistory: [],
            campaignId: formData.campaignId
        };

        addPatient(newPatient);
        if (newPatient.registrationFee > 0) {
            addTransaction({
                id: `TXN-REG-${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                description: `${serviceType} Registration Fee: ${newPatient.name} (${newPatient.id})`,
                category: 'Income',
                amount: newPatient.registrationFee,
                method: 'Cash'
            });
        }
        if (selectedRoomId) {
            const targetRoom = rooms.find(r => r.id === selectedRoomId);
            if (targetRoom) updateRoom(selectedRoomId, { currentLoad: targetRoom.currentLoad + 1 });
        }
        setIsSuccess(true);
        setTimeout(() => { navigate('/patients'); }, 2000);
    };

    if (isSuccess) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6"><CheckCircle size={48} /></div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Registration Success</h2>
                <p className="text-slate-500 mb-8 font-medium">The patient record has been successfully added to the database.</p>
                <button onClick={() => navigate('/patients')} className="px-8 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 shadow-xl shadow-teal-100 transition-all">View Patient List</button>
            </div>
        )
    }

    return (
        <div className="bg-mesh-gradient min-h-screen p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto animate-in fade-in duration-700 pb-16">
            <div className="flex justify-between items-center glass-card py-3 px-6 rounded-2xl sticky top-20 z-30 border border-white/40 shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-50 text-teal-600 rounded-xl shadow-sm"><UserPlus size={18} /></div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900 tracking-tight">Patient Registration</h1>
                        <p className="text-xs text-slate-500 font-medium">Create a new Electronic Medical Record (EMR)</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-all text-xs">Discard</button>
                    {canAdd && (
                        <button type="submit" form="regForm" className="px-5 py-2 bg-slate-900 text-white rounded-xl hover:bg-teal-600 font-black flex items-center gap-2 shadow-md transition-all active:scale-[0.97] text-xs uppercase tracking-wider">
                            <Save size={14} /> Save Record
                        </button>
                    )}
                </div>
            </div>

            <form id="regForm" onSubmit={handleSubmit} className="space-y-8">

                {/* Department Information */}
                <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden border border-white/5">
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent"></div>
                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                        <div>
                            <h3 className="font-black text-teal-400 mb-3 text-xs uppercase tracking-[0.2em]">Assigned Department</h3>
                            <div className="grid grid-cols-3 gap-2">
                                {[{ id: 'OPD', label: 'OPD', icon: Stethoscope }, { id: 'Lab', label: 'Lab', icon: Microscope }, { id: 'Diagnosis', label: 'Diag', icon: Eye }].map(type => (
                                    <button key={type.id} type="button" onClick={() => setServiceType(type.id as any)} className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${serviceType === type.id ? 'bg-teal-600 border-teal-400 shadow-md' : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'}`}>
                                        <type.icon size={16} className="mb-1" /><span className="text-[10px] font-black uppercase tracking-tight">{type.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h3 className="font-black text-indigo-400 mb-2 text-xs uppercase tracking-[0.2em]">Automated Routing</h3>
                            <p className="text-xs text-slate-300 font-medium leading-relaxed">Intelligence-led assignment: <span className="text-white font-black border-b border-teal-500 pb-0.5">{rooms.find(r => r.id === selectedRoomId)?.name || 'Processing...'}</span> assigned for clinical intake.</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10 flex items-center gap-3 group hover:border-teal-500/30 transition-all w-full lg:w-[85%] ml-auto">
                            <div className="text-right flex-1">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Target Counter</p>
                                <select className="bg-transparent border-none text-xl font-black text-white focus:ring-0 cursor-pointer text-right outline-none w-full appearance-none" value={selectedRoomId} onChange={(e) => setSelectedRoomId(e.target.value)}>
                                    {rooms.filter(r => r.type === serviceType).map(r => (
                                        <option key={r.id} value={r.id} className="text-slate-900 text-xs">{r.roomNumber} - {r.name}</option>
                                    ))}
                                    {rooms.filter(r => r.type === serviceType).length === 0 && (
                                        <option value="" className="text-slate-900 text-xs">No rooms available</option>
                                    )}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5 items-center">
                                <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-teal-600 text-white rounded-lg flex items-center justify-center font-black text-xl shadow-lg group-hover:scale-105 transition-transform">{rooms.find(r => r.id === selectedRoomId)?.roomNumber || '--'}</div>
                                <button type="button" onClick={() => setShowRoomModal(true)} className="px-2 py-0.5 bg-white/10 hover:bg-teal-600 text-white hover:text-white rounded text-[8px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 border border-white/10">
                                    <Settings size={8} /> Edit Rooms
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Personal Profile */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-3">
                        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2 mb-1">
                            <UserCheck size={16} className="text-teal-600" /> Personal Identity
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Full Legal Name *</label>
                                <input required name="name" className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:ring-1 focus:ring-teal-500 outline-none transition-all" value={formData.name} onChange={handleInputChange} placeholder="Enter full name as per ID" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Date of Birth</label>
                                    <input type="date" name="dob" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 bg-white" value={formData.dob} onChange={handleInputChange} />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500">Age (Years)</label>
                                        <input required name="ageYrs" type="number" className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-900" value={formData.ageYrs} onChange={handleInputChange} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500">Age (Months)</label>
                                        <input name="ageMns" type="number" className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-900" value={formData.ageMns} onChange={handleInputChange} />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Gender</label>
                                    <select name="gender" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 bg-white" value={formData.gender} onChange={handleInputChange}>
                                        <option>Male</option><option>Female</option><option>Other</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Financial Category</label>
                                    <select name="paymentCategory" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 bg-white" value={formData.paymentCategory} onChange={handleInputChange}>
                                        <option value="Pay">Standard (Paying)</option>
                                        <option value="Free">Charity (Free)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Details */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-3">
                        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2 mb-1">
                            <Phone size={16} className="text-indigo-600" /> Contact Information
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Primary Phone Number *</label>
                                    <input required name="contact" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-900" value={formData.contact} onChange={handleInputChange} placeholder="Primary mobile" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Secondary Phone Number</label>
                                    <input name="altContact" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-900" value={formData.altContact} onChange={handleInputChange} placeholder="Alternative mobile" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                    <input name="email" type="email" className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-900" value={formData.email} onChange={handleInputChange} placeholder="patient@example.com" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Emergency Contact / Next of Kin</label>
                                <input name="nextOfKin" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-900" value={formData.nextOfKin} onChange={handleInputChange} placeholder="Full name of emergency contact" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Permanent Address */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-3">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2 mb-1">
                        <Home size={16} className="text-emerald-600" /> Residential Address Details
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500">Street / Village / Area</label>
                            <input name="village" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-900" value={formData.village} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500">Mailing Office</label>
                            <input name="postOffice" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-900" value={formData.postOffice} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500">Postal / ZIP Code</label>
                            <input name="postCode" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-900" value={formData.postCode} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500">Sub-District (Upazilla)</label>
                            <input name="upazilla" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-900" value={formData.upazilla} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500">District</label>
                            <input name="district" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-900" value={formData.district} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500">State / Province</label>
                            <input name="state" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-900" value={formData.state} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                            <label className="text-xs font-semibold text-slate-500">Country</label>
                            <input name="country" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-900" value={formData.country} onChange={handleInputChange} />
                        </div>
                    </div>
                </div>

                {/* Administrative Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-3">
                        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2 mb-1">
                            <Archive size={16} className="text-blue-600" /> Hospital Administration
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Physical File Location</label>
                                <input name="mrLocation" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 bg-slate-50" value={formData.mrLocation} onChange={handleInputChange} placeholder="Shelf / Rack reference" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Patient Category</label>
                                <select name="patientType" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 bg-white" value={formData.patientType} onChange={handleInputChange}>
                                    <option>New Patient</option>
                                    <option>Returning / Old Patient</option>
                                    <option>Referral</option>
                                    <option>Camp Referral</option>
                                    <option>Corporate Account</option>
                                </select>
                            </div>
                            {formData.patientType === 'Camp Referral' && (
                                <div className="space-y-1 animate-in slide-in-from-left-2 duration-200">
                                    <label className="text-xs font-semibold text-slate-500">Select Campaign / Camp *</label>
                                    <div className="relative">
                                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-500" size={14} />
                                        <select required name="campaignId" className="w-full pl-8 pr-3 py-1.5 bg-teal-50 border border-teal-100 rounded-lg text-xs font-bold text-teal-900 focus:ring-1 focus:ring-teal-500 outline-none transition-all appearance-none" value={formData.campaignId} onChange={handleInputChange}>
                                            <option value="">-- Select Active Camp --</option>
                                            {campaigns.filter(c => c.status !== 'Completed').map(c => (
                                                <option key={c.id} value={c.id}>{c.name} ({c.location})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500">Medical Specialty</label>
                            <input name="speciality" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-900" value={formData.speciality} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500">Assigned Booth / Room</label>
                            <input name="allocation" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 bg-slate-50" value={formData.allocation} onChange={handleInputChange} />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-3">
                        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2 mb-1">
                            <FileText size={16} className="text-rose-600" /> Preliminary Assessment
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Assigned Consultant</label>
                                <select name="assignedDoctor" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 bg-white" value={formData.assignedDoctor} onChange={handleInputChange}>
                                    <option value="">-- Assign Doctor --</option>
                                    {doctors.map(d => <option key={d.id} value={d.name}>{d.name} ({d.department})</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Primary Complaint / Initial Diagnosis</label>
                                <input name="diagnosis" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-900" value={formData.diagnosis} onChange={handleInputChange} placeholder="Brief clinical summary" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Administrative Remarks</label>
                                <textarea name="remarks" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 min-h-[40px] resize-none" value={formData.remarks} onChange={handleInputChange} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Registration Payment */}
                <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg flex flex-wrap gap-6 items-center justify-between border border-slate-800">
                    <div className="flex gap-6 flex-1 min-w-[250px]">
                        <div>
                            <p className="text-[10px] font-semibold text-slate-400 mb-1">Registration Ticket Fee</p>
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-bold text-teal-400">{currency === 'BDT' ? '৳' : '$'}</span>
                                <input name="registrationFee" type="number" className="bg-transparent border-none text-2xl font-bold text-white focus:ring-0 w-24 outline-none p-0" value={formData.registrationFee} onChange={handleInputChange} />
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium mt-1 italic">Standard registration charge</p>
                        </div>
                        <div className="h-10 w-px bg-slate-800 self-center hidden md:block"></div>
                        <div className="flex-1">
                            <p className="text-[10px] font-semibold text-slate-400 mb-1">Data Verification</p>
                            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                                <ShieldCheck size={14} />
                                <span className="text-xs tracking-tight uppercase">Active</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => navigate('/patients')} className="px-4 py-2.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-700 transition-all">Cancel</button>
                        <button type="submit" className="px-6 py-2.5 bg-teal-600 text-white rounded-xl font-bold text-xs shadow-md hover:bg-teal-500 transition-all active:scale-95">Finalize Registration</button>
                    </div>
                </div>
            </form >

            {/* Manage Counter Rooms Modal */}
            {showRoomModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 animate-in zoom-in duration-200">
                        <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-teal-500/20 text-teal-400 rounded-2xl border border-teal-500/30">
                                    <Settings size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tighter text-white">Manage Counter Rooms</h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Configure counters for {serviceType} service</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => setShowRoomModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Room List Container */}
                        <div className="p-8 space-y-6 max-h-[350px] overflow-y-auto custom-scrollbar">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Counter List ({serviceType})</h4>
                            <div className="space-y-3">
                                {rooms.filter(r => r.type === serviceType).map(room => (
                                    <div key={room.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-slate-200 transition-all">
                                        {editingRoomId === room.id ? (
                                            <div className="flex items-center gap-3 flex-1 mr-4">
                                                <input
                                                    type="text"
                                                    value={editingRoomNumber}
                                                    onChange={(e) => setEditingRoomNumber(e.target.value)}
                                                    className="w-16 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:ring-1 focus:ring-teal-500 outline-none"
                                                    placeholder="No."
                                                />
                                                <input
                                                    type="text"
                                                    value={editingRoomName}
                                                    onChange={(e) => setEditingRoomName(e.target.value)}
                                                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:ring-1 focus:ring-teal-500 outline-none"
                                                    placeholder="Room Name"
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex items-center gap-4">
                                                <span className="w-12 h-8 bg-teal-50 border border-teal-100 text-teal-600 rounded-lg flex items-center justify-center font-bold text-xs">{room.roomNumber}</span>
                                                <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{room.name}</span>
                                            </div>
                                        )}

                                        <div className="flex gap-2">
                                            {editingRoomId === room.id ? (
                                                <>
                                                    <button type="button" onClick={() => handleSaveEditRoom(room.id)} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 border border-emerald-100 transition-all">
                                                        <Check size={14} />
                                                    </button>
                                                    <button type="button" onClick={() => setEditingRoomId(null)} className="p-2 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 border border-slate-200 transition-all">
                                                        <X size={14} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button type="button" onClick={() => handleStartEditRoom(room)} className="p-2 bg-indigo-50 text-indigo-500 rounded-xl hover:bg-indigo-100 border border-indigo-100 transition-all opacity-0 group-hover:opacity-100 shadow-sm">
                                                        <Edit3 size={14} />
                                                    </button>
                                                    <button type="button" onClick={() => handleDeleteRoom(room.id)} className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 border border-rose-100 transition-all opacity-0 group-hover:opacity-100 shadow-sm">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {rooms.filter(r => r.type === serviceType).length === 0 && (
                                    <p className="text-xs text-slate-400 italic text-center py-6 font-medium">No counter rooms configured for this department yet.</p>
                                )}
                            </div>
                        </div>

                        {/* Add New Room Form */}
                        <form onSubmit={handleAddRoom} className="p-8 bg-slate-50 border-t border-slate-100 space-y-4">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Add New Counter Room</h4>
                            <div className="flex gap-3">
                                <input
                                    required
                                    type="text"
                                    placeholder="No. (e.g. 104)"
                                    value={newRoomNumber}
                                    onChange={(e) => setNewRoomNumber(e.target.value)}
                                    className="w-24 px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none"
                                />
                                <input
                                    required
                                    type="text"
                                    placeholder="Counter Name (e.g. Consultation Booth 4)"
                                    value={newRoomName}
                                    onChange={(e) => setNewRoomName(e.target.value)}
                                    className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none"
                                />
                                <button type="submit" className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md active:scale-95">
                                    <Plus size={14} /> Add
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div >
    );
};

export default Registration;
