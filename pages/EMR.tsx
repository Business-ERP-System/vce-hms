
import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { Patient, PrescribedMedicine, Prescription, GlassPrescription } from '../types';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Save, Eye, FileText, Pill, Eraser, Plus, Trash2,
    Sparkles, BrainCircuit, Activity, ChevronRight, PenTool,
    Search, Users, Thermometer, HeartPulse, Scale, UserCheck,
    ClipboardList, Clock, CheckCircle, Stethoscope, X, Camera, Scan,
    RefreshCw, Zap, Download, Mail, Glasses
} from 'lucide-react';
import { downloadPDF, shareToWhatsApp } from '../services/exportService';
import { GoogleGenAI } from "@google/genai";
import { useAuth } from '../contexts/AuthContext';
import { extractVitalsFromImage } from '../services/geminiService';

const EMR = () => {
    const { patients, updatePatient, addPrescription, appointments, updateAppointment, admissions, addAdmissionItem, billingItems, formatCurrency } = useData();
    const { role } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [patient, setPatient] = useState<Patient | null>(null);
    const [showClinicalSummary, setShowClinicalSummary] = useState(false);
    const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState<string>("");
    const [activeTab, setActiveTab] = useState<'clinical' | 'visual' | 'refraction' | 'vitals' | 'diagnosis'>('vitals');
    const [searchTerm, setSearchTerm] = useState('');

    const [isScanningVitals, setIsScanningVitals] = useState(false);

    const [vitals, setVitals] = useState({
        bp: '',
        pulse: '',
        temp: '',
        weight: '',
        spo2: '',
        rbs: ''
    });

    const [clinicalData, setClinicalData] = useState({
        chiefComplaint: '',
        historyOfPresentIllness: '',
        pastHistory: '',
        allergies: '',
        familyHistory: ''
    });

    const [visualTemplate, setVisualTemplate] = useState<'anterior' | 'posterior'>('anterior');
    const [drawingColor, setDrawingColor] = useState('#ef4444');
    const [isDrawing, setIsDrawing] = useState(false);

    const canvasRefOD = useRef<HTMLCanvasElement>(null);
    const canvasRefOS = useRef<HTMLCanvasElement>(null);

    const [refraction, setRefraction] = useState({
        od: { sph: '', cyl: '', axis: '', va: '', add: '' },
        os: { sph: '', cyl: '', axis: '', va: '', add: '' },
        iop: { od: '', os: '' }
    });

    const [glRx, setGlRx] = useState<GlassPrescription>({
        ar: {
            re: { sph: '', cyl: '', axis: '' },
            le: { sph: '', cyl: '', axis: '' }
        },
        acc: {
            re: {
                dv: { sph: '', cyl: '', axis: '', va: '' },
                add: { sph: '', va: '' }
            },
            le: {
                dv: { sph: '', cyl: '', axis: '', va: '' },
                add: { sph: '', va: '' }
            }
        },
        pd: { dist: '', near: '' },
        lensTypes: [],
        instructions: '',
        refractionist: ''
    });

    const [diagnosisList, setDiagnosisList] = useState<string[]>([]);
    const [newDiagnosis, setNewDiagnosis] = useState('');
    const [advice, setAdvice] = useState('');
    const [medicines, setMedicines] = useState<PrescribedMedicine[]>([]);
    const [newMed, setNewMed] = useState<PrescribedMedicine>({ name: '', dosage: '', duration: '', instruction: '' });

    useEffect(() => {
        if (location.state?.patient) {
            const p = location.state.patient as Patient;
            initPatientWorkup(p);
        }
        if (role === 'Nurse') {
            setActiveTab('vitals');
        }
    }, [location.state, role]);

    const initPatientWorkup = (p: Patient) => {
        setPatient(p);
        setClinicalData(prev => ({
            ...prev,
            pastHistory: p.previousHistory || '',
            allergies: p.allergies || '',
            familyHistory: p.familyHistory || ''
        }));

        if (p.currentVitals) {
            setVitals({
                bp: p.currentVitals.bp || '',
                pulse: p.currentVitals.pulse || '',
                temp: p.currentVitals.temp || '',
                weight: p.currentVitals.weight || '',
                spo2: p.currentVitals.spo2 || '',
                rbs: p.currentVitals.rbs || ''
            });
        }

        if (p.diagnosis) setDiagnosisList([p.diagnosis]);
        if (p.previousVisionHistory) {
            setRefraction(prev => ({
                ...prev,
                od: { ...prev.od, ...p.previousVisionHistory!.re },
                os: { ...prev.os, ...p.previousVisionHistory!.le }
            }));
        }
    };

    const handleVitalsOCR = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsScanningVitals(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
            const result = await extractVitalsFromImage(reader.result as string);
            if (result) {
                setVitals(prev => ({
                    ...prev,
                    bp: result.bp || prev.bp,
                    pulse: result.pulse || prev.pulse,
                    temp: result.temp || prev.temp,
                    spo2: result.spo2 || prev.spo2,
                    weight: result.weight || prev.weight
                }));
            }
            setIsScanningVitals(false);
        };
        reader.readAsDataURL(file);
    };

    const drawBaseEye = (ctx: CanvasRenderingContext2D, width: number, height: number, type: 'anterior' | 'posterior', label: string) => {
        ctx.clearRect(0, 0, width, height);
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 90, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(width / 2 - 100, height / 2);
        ctx.lineTo(width / 2 + 100, height / 2);
        ctx.moveTo(width / 2, height / 2 - 100);
        ctx.lineTo(width / 2, height / 2 + 100);
        ctx.stroke();

        if (type === 'anterior') {
            ctx.beginPath();
            ctx.arc(width / 2, height / 2, 35, 0, 2 * Math.PI);
            ctx.fillStyle = '#f1f5f9';
            ctx.fill();
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.arc(width / 2 + 30, height / 2, 15, 0, 2 * Math.PI);
            ctx.fillStyle = '#ffedd5';
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(width / 2 - 20, height / 2 + 5, 8, 0, 2 * Math.PI);
            ctx.fillStyle = '#fee2e2';
            ctx.fill();
            ctx.stroke();
        }

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, width / 2, height - 10);
    };

    const initCanvases = () => {
        [{ ref: canvasRefOD, lbl: 'OD' }, { ref: canvasRefOS, lbl: 'OS' }].forEach(({ ref, lbl }) => {
            if (ref.current) {
                const ctx = ref.current.getContext('2d');
                if (ctx) drawBaseEye(ctx, ref.current.width, ref.current.height, visualTemplate, lbl);
            }
        });
    };

    useEffect(() => {
        if (activeTab === 'visual') {
            setTimeout(initCanvases, 100);
        }
    }, [visualTemplate, activeTab]);

    const handleDraw = (e: React.MouseEvent, canvasRef: React.RefObject<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);

        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const startDrawing = (e: React.MouseEvent, canvasRef: React.RefObject<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.strokeStyle = drawingColor;
        setIsDrawing(true);
    };

    const runAiAnalysis = async () => {
        setIsAiAnalyzing(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `
            Act as an Expert Clinical Ophthalmologist.
            Patient: ${patient?.age}Y ${patient?.gender}
            Complaints: ${clinicalData.chiefComplaint}
            Vitals: ${JSON.stringify(vitals)}
            Refraction: OD ${refraction.od.sph}/${refraction.od.cyl} x ${refraction.od.axis}, OS ${refraction.os.sph}/${refraction.os.cyl} x ${refraction.os.axis}
            IOP: OD ${refraction.iop.od}, OS ${refraction.iop.os}
            
            Analyze the case and provide:
            1. Most Likely Diagnosis
            2. Recommended Specialized Investigations (e.g. OCT, B-Scan)
            3. Detailed Treatment Plan
            Keep it clinical and structured in Markdown.
          `;
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: prompt
            });
            setAiSuggestion(response.text || "Insight unavailable.");
        } catch (e) {
            setAiSuggestion("Error analyzing case.");
        }
        setIsAiAnalyzing(false);
    };

    const handleFinalize = () => {
        if (!patient) return;
        const newRx: Prescription = {
            id: `RX-${Date.now().toString().slice(-6)}`,
            patientId: patient.id, patientName: patient.name, patientAge: patient.age, patientGender: patient.gender,
            doctorName: patient.assignedDoctor || 'Unknown', date: new Date().toISOString().split('T')[0],
            diagnosis: diagnosisList.join(', '), medicines, notes: advice,
            vitals: { bp: vitals.bp, pulse: vitals.pulse, temp: vitals.temp, weight: vitals.weight },
            vision: { re: `${refraction.od.sph}/${refraction.od.va}`, le: `${refraction.os.sph}/${refraction.os.va}` },
            glassPrescription: glRx
        };
        addPrescription(newRx);

        // Link today's active appointment if it exists
        const today = new Date().toISOString().split('T')[0];
        const todayAppt = appointments.find(a => a.patientId === patient.id && a.date === today && a.status === 'Scheduled');
        if (todayAppt) {
            updateAppointment(todayAppt.id, { status: 'Completed' });
        }

        updatePatient(patient.id, {
            diagnosis: diagnosisList.join(', '),
            status: 'Discharged',
            currentVitals: undefined,
            previousVisionHistory: {
                re: { sph: refraction.od.sph, cyl: refraction.od.cyl, axis: refraction.od.axis, va: refraction.od.va },
                le: { sph: refraction.os.sph, cyl: refraction.os.cyl, axis: refraction.os.axis, va: refraction.os.va },
                notes: 'Saved from EMR Consultation'
            }
        });
        // Integration: If patient is in IPD, add consultation fee to running bill
        const admission = admissions.find(a => a.patientId === patient.id && a.status === 'Active');
        if (admission) {
            const consultationItem = billingItems.find(i => i.id === 'S001' || i.name.includes('Consultation'));
            if (consultationItem) {
                addAdmissionItem(admission.id, {
                    id: `CONS-${Date.now()}`,
                    description: `Consultation Fee: ${patient.assignedDoctor || 'Doctor'}`,
                    price: consultationItem.price,
                    qty: 1
                });
            }
        }

        alert("Consultation finalized. Prescription sent to E-Prescription module and appointment marked as Completed.");
        navigate('/e-prescription');
        setPatient(null);
    };

    const handleNursingSubmit = () => {
        if (!patient) return;
        updatePatient(patient.id, {
            currentVitals: {
                ...vitals,
                vaRight: refraction.od.va,
                vaLeft: refraction.os.va
            },
            previousVisionHistory: {
                re: { sph: refraction.od.sph, cyl: refraction.od.cyl, axis: refraction.od.axis, va: refraction.od.va },
                le: { sph: refraction.os.sph, cyl: refraction.os.cyl, axis: refraction.os.axis, va: refraction.os.va },
                notes: 'Initial Triage VA'
            },
            prescriptionNotes: `Nursing Workup Complete: BP ${vitals.bp}, Pulse ${vitals.pulse}`
        });
        alert("Nursing Workup Saved. Patient moved to Doctor's Queue.");
        setPatient(null);
    };

    const addMedicine = () => {
        if (!newMed.name) return;
        setMedicines([...medicines, newMed]);
        setNewMed({ name: '', dosage: '', duration: '', instruction: '' });
    };

    if (!patient) {
        const clinicalQueue = patients.filter(p => p.status === 'OPD' && p.name.toLowerCase().includes(searchTerm.toLowerCase()));

        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Medical Records & Clinical Hub</h1>
                        <p className="text-sm text-slate-500">Manage patient clinical files and active triage queues.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search clinical files..."
                                className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 w-64 outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <Activity className="text-teal-600" size={18} />
                                    {role === 'Nurse' ? 'Nursing Station Queue' : 'Doctor\'s Active Consultation Queue'}
                                </h3>
                                <span className="bg-teal-100 text-teal-700 text-xs font-bold px-2 py-0.5 rounded-full uppercase">Real-time</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-medium">
                                        <tr>
                                            <th className="px-6 py-4">UHID</th>
                                            <th className="px-6 py-4">Patient Name</th>
                                            <th className="px-6 py-4">Wait Time</th>
                                            <th className="px-6 py-4">Stage</th>
                                            <th className="px-6 py-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {clinicalQueue.slice(0, 10).map((p, idx) => (
                                            <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-6 py-4 font-mono font-medium text-slate-600">{p.id}</td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-900">{p.name}</div>
                                                    <div className="text-xs text-slate-500">{p.age}Y / {p.gender}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1 text-slate-500">
                                                        <Clock size={14} /> {10 + (idx * 5)}m
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${idx % 3 === 0 ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                                        {idx % 3 === 0 ? 'Triage Pending' : 'Wait for Doctor'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => initPatientWorkup(p)}
                                                        className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2 ml-auto"
                                                    >
                                                        {role === 'Nurse' ? <Plus size={14} /> : <Stethoscope size={14} />}
                                                        {role === 'Nurse' ? 'Process Vitals' : 'Consult'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {clinicalQueue.length === 0 && (
                                            <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No patients in the clinical workup queue.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl p-6 text-white shadow-lg">
                            <h3 className="font-bold text-lg mb-2">Nursing Workup Guide</h3>
                            <p className="text-teal-50 text-xs mb-6 leading-relaxed">
                                Ensure all patients have their BP, Pulse, and Visual Acuity recorded before moving them to the specialist's room.
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold">1</div>
                                    <span className="text-sm font-medium">Capture Body Temperature</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold">2</div>
                                    <span className="text-sm font-medium">Record Visual Acuity (OD/OS)</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold">3</div>
                                    <span className="text-sm font-medium">Update Doctor's Room Queue</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="h-[calc(100vh-100px)] flex flex-col gap-4 animate-in fade-in duration-300">
                <div className="flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setPatient(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"><ArrowLeft size={20} /></button>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold">{patient.name.charAt(0)}</div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900">{patient.name}</h1>
                                <p className="text-xs text-slate-500 font-mono">ID: {patient.id} • {patient.age}Y / {patient.gender}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowClinicalSummary(true)}
                            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 shadow-sm flex items-center gap-2"
                        >
                            <ClipboardList size={16} className="text-indigo-600" /> View Clinical Summary
                        </button>
                        {role === 'Nurse' ? (
                            <button onClick={handleNursingSubmit} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm flex items-center gap-2">
                                <CheckCircle size={16} /> Finish Workup
                            </button>
                        ) : (
                            <button onClick={handleFinalize} className="px-6 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700 shadow-sm flex items-center gap-2">
                                <Save size={16} /> Finalize Case
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
                    <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                        <div className="flex border-b border-slate-200 bg-slate-50/50 overflow-x-auto no-scrollbar flex-nowrap">
                            {[
                                { id: 'vitals', label: 'Vitals & VA', roles: ['Nurse', 'Admin', 'Doctor'] },
                                { id: 'refraction', label: 'Refractions', roles: ['Doctor', 'Admin'] },
                                { id: 'visual', label: 'Drawings', roles: ['Doctor', 'Admin'] },
                                { id: 'clinical', label: 'Findings', roles: ['Doctor', 'Admin'] },
                                { id: 'diagnosis', label: 'Prescription', roles: ['Doctor', 'Admin'] }
                            ].filter(tab => tab.roles.includes(role)).map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-6 py-4 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${activeTab === tab.id ? 'border-teal-600 text-teal-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {activeTab === 'vitals' && (
                                <div className="space-y-8">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Biometric & Vision Screening</h3>
                                        <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 cursor-pointer shadow-lg shadow-indigo-100 transition-all">
                                            {isScanningVitals ? <RefreshCw size={14} className="animate-spin" /> : <Camera size={14} />}
                                            {isScanningVitals ? 'AI Extracting...' : 'Scan Vitals (OCR)'}
                                            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleVitalsOCR} disabled={isScanningVitals} />
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><HeartPulse size={12} /> BP (mmHg)</label>
                                            <input className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" value={vitals.bp} onChange={e => setVitals({ ...vitals, bp: e.target.value })} placeholder="120/80" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Activity size={12} /> Pulse</label>
                                            <input className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" value={vitals.pulse} onChange={e => setVitals({ ...vitals, pulse: e.target.value })} placeholder="72" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Thermometer size={12} /> Temp (°F)</label>
                                            <input className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" value={vitals.temp} onChange={e => setVitals({ ...vitals, temp: e.target.value })} placeholder="98.6" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Zap size={12} /> SpO2 (%)</label>
                                            <input className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" value={vitals.spo2} onChange={e => setVitals({ ...vitals, spo2: e.target.value })} placeholder="99" />
                                        </div>
                                    </div>

                                    {/* Visual Acuity Screening Section - Mandatory for Eye Hospital Triage */}
                                    <div className="pt-6 border-t border-slate-100">
                                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Patient Refraction & Visual Acuity (VA)</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {/* Right Eye */}
                                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="w-8 h-8 bg-teal-600 text-white rounded-lg flex items-center justify-center font-black text-xs shadow-sm">RE</div>
                                                    <h4 className="text-sm font-bold text-slate-700 uppercase">Right Eye (OD)</h4>
                                                </div>
                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-black text-slate-400 uppercase">Sphere (SPH)</label>
                                                        <input className="w-full p-2 border rounded-lg font-bold text-center text-sm" value={refraction.od.sph} onChange={e => setRefraction({ ...refraction, od: { ...refraction.od, sph: e.target.value } })} placeholder="0.00" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-black text-slate-400 uppercase">Cylinder (CYL)</label>
                                                        <input className="w-full p-2 border rounded-lg font-bold text-center text-sm" value={refraction.od.cyl} onChange={e => setRefraction({ ...refraction, od: { ...refraction.od, cyl: e.target.value } })} placeholder="0.00" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-black text-slate-400 uppercase">Axis</label>
                                                        <input className="w-full p-2 border rounded-lg font-bold text-center text-sm" value={refraction.od.axis} onChange={e => setRefraction({ ...refraction, od: { ...refraction.od, axis: e.target.value } })} placeholder="0" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-black text-rose-600 uppercase tracking-widest">VA Value</label>
                                                        <input className="w-full p-2 border-2 border-rose-100 rounded-lg font-black text-center text-rose-600 text-sm" value={refraction.od.va} onChange={e => setRefraction({ ...refraction, od: { ...refraction.od, va: e.target.value } })} placeholder="6/6" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Left Eye */}
                                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-black text-xs shadow-sm">LE</div>
                                                    <h4 className="text-sm font-bold text-slate-700 uppercase">Left Eye (OS)</h4>
                                                </div>
                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-black text-slate-400 uppercase">Sphere (SPH)</label>
                                                        <input className="w-full p-2 border rounded-lg font-bold text-center text-sm" value={refraction.os.sph} onChange={e => setRefraction({ ...refraction, os: { ...refraction.os, sph: e.target.value } })} placeholder="0.00" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-black text-slate-400 uppercase">Cylinder (CYL)</label>
                                                        <input className="w-full p-2 border rounded-lg font-bold text-center text-sm" value={refraction.os.cyl} onChange={e => setRefraction({ ...refraction, os: { ...refraction.os, cyl: e.target.value } })} placeholder="0.00" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-black text-slate-400 uppercase">Axis</label>
                                                        <input className="w-full p-2 border rounded-lg font-bold text-center text-sm" value={refraction.os.axis} onChange={e => setRefraction({ ...refraction, os: { ...refraction.os, axis: e.target.value } })} placeholder="0" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-black text-rose-600 uppercase tracking-widest">VA Value</label>
                                                        <input className="w-full p-2 border-2 border-rose-100 rounded-lg font-black text-center text-rose-600 text-sm" value={refraction.os.va} onChange={e => setRefraction({ ...refraction, os: { ...refraction.os, va: e.target.value } })} placeholder="6/6" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'clinical' && (
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Chief Complaints</label>
                                        <textarea className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none resize-none" rows={3} value={clinicalData.chiefComplaint} onChange={e => setClinicalData({ ...clinicalData, chiefComplaint: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Allergies</label>
                                        <textarea className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none resize-none" rows={2} value={clinicalData.allergies} onChange={e => setClinicalData({ ...clinicalData, allergies: e.target.value })} />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'refraction' && (
                                <div className="space-y-6 animate-in fade-in duration-500">
                                    <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-xl border border-slate-800">
                                        <div className="bg-slate-800 px-6 py-3 border-b border-slate-700 flex justify-between items-center text-white">
                                            <h3 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                                <Glasses size={16} className="text-teal-400" /> Glasses Prescription (Advanced Refraction)
                                            </h3>
                                            <span className="text-xs font-bold text-slate-400 uppercase">Refraction Details Entry</span>
                                        </div>

                                        <div className="p-8 space-y-8">
                                            {/* AR Section */}
                                            <div className="relative">
                                                <div className="absolute -left-4 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-black text-slate-500 uppercase tracking-widest hidden lg:block">AR Record</div>
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                                                    <div className="space-y-4">
                                                        <h4 className="text-xs font-black text-teal-400 uppercase tracking-widest flex items-center gap-2">Right Eye <span className="text-slate-500">(OD)</span></h4>
                                                        <div className="grid grid-cols-3 gap-3">
                                                            {['sph', 'cyl', 'axis'].map(f => (
                                                                <div key={f} className="space-y-1">
                                                                    <label className="text-xs font-black text-slate-500 uppercase">{f}</label>
                                                                    <input className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold text-center text-xs focus:border-teal-500 outline-none" value={(glRx.ar?.re as any)[f]} onChange={e => setGlRx({ ...glRx, ar: { ...glRx.ar!, re: { ...glRx.ar!.re, [f]: e.target.value } } })} />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">Left Eye <span className="text-slate-500">(OS)</span></h4>
                                                        <div className="grid grid-cols-3 gap-3">
                                                            {['sph', 'cyl', 'axis'].map(f => (
                                                                <div key={f} className="space-y-1">
                                                                    <label className="text-xs font-black text-slate-500 uppercase">{f}</label>
                                                                    <input className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold text-center text-xs focus:border-blue-500 outline-none" value={(glRx.ar?.le as any)[f]} onChange={e => setGlRx({ ...glRx, ar: { ...glRx.ar!, le: { ...glRx.ar!.le, [f]: e.target.value } } })} />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* ACC Section */}
                                            <div className="relative">
                                                <div className="absolute -left-4 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-black text-slate-500 uppercase tracking-widest hidden lg:block">Subjective</div>
                                                <div className="space-y-4 bg-slate-900 p-6 rounded-2xl border border-slate-700 shadow-inner">
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                                        {/* RE ACC */}
                                                        <div className="space-y-6">
                                                            <div className="space-y-3">
                                                                <div className="flex justify-between items-center text-xs font-black uppercase"><span className="text-teal-400">Right DV</span><span className="text-slate-500">Distance Vision</span></div>
                                                                <div className="grid grid-cols-4 gap-2">
                                                                    {['sph', 'cyl', 'axis', 'va'].map(f => (
                                                                        <input key={f} className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-bold text-center text-xs focus:ring-1 focus:ring-teal-500 outline-none" placeholder={f.toUpperCase()} value={(glRx.acc.re.dv as any)[f]} onChange={e => setGlRx({ ...glRx, acc: { ...glRx.acc, re: { ...glRx.acc.re, dv: { ...glRx.acc.re.dv, [f]: e.target.value } } } })} />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="space-y-3">
                                                                <div className="flex justify-between items-center text-xs font-black uppercase text-amber-400"><span>Right ADD</span><span>Near Vision</span></div>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <input className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-bold text-center text-xs focus:ring-1 focus:ring-amber-500 outline-none" placeholder="SPH" value={glRx.acc.re.add.sph} onChange={e => setGlRx({ ...glRx, acc: { ...glRx.acc, re: { ...glRx.acc.re, add: { ...glRx.acc.re.add, sph: e.target.value } } } })} />
                                                                    <input className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-bold text-center text-xs focus:ring-1 focus:ring-amber-500 outline-none" placeholder="V/A" value={glRx.acc.re.add.va} onChange={e => setGlRx({ ...glRx, acc: { ...glRx.acc, re: { ...glRx.acc.re, add: { ...glRx.acc.re.add, va: e.target.value } } } })} />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* LE ACC */}
                                                        <div className="space-y-6">
                                                            <div className="space-y-3">
                                                                <div className="flex justify-between items-center text-xs font-black uppercase"><span className="text-blue-400">Left DV</span><span className="text-slate-500">Distance Vision</span></div>
                                                                <div className="grid grid-cols-4 gap-2">
                                                                    {['sph', 'cyl', 'axis', 'va'].map(f => (
                                                                        <input key={f} className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-bold text-center text-xs focus:ring-1 focus:ring-blue-500 outline-none" placeholder={f.toUpperCase()} value={(glRx.acc.le.dv as any)[f]} onChange={e => setGlRx({ ...glRx, acc: { ...glRx.acc, le: { ...glRx.acc.le, dv: { ...glRx.acc.le.dv, [f]: e.target.value } } } })} />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="space-y-3">
                                                                <div className="flex justify-between items-center text-xs font-black uppercase text-amber-400"><span>Left ADD</span><span>Near Vision</span></div>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <input className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-bold text-center text-xs focus:ring-1 focus:ring-amber-500 outline-none" placeholder="SPH" value={glRx.acc.le.add.sph} onChange={e => setGlRx({ ...glRx, acc: { ...glRx.acc, le: { ...glRx.acc.le, add: { ...glRx.acc.le.add, sph: e.target.value } } } })} />
                                                                    <input className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-bold text-center text-xs focus:ring-1 focus:ring-amber-500 outline-none" placeholder="V/A" value={glRx.acc.le.add.va} onChange={e => setGlRx({ ...glRx, acc: { ...glRx.acc, le: { ...glRx.acc.le, add: { ...glRx.acc.le.add, va: e.target.value } } } })} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* PD & Lens Section */}
                                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                                                <div className="lg:col-span-1 space-y-4">
                                                    <h4 className="text-xs font-black text-rose-400 uppercase tracking-widest">Pupillary Distance</h4>
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-3">
                                                            <label className="text-xs font-black text-slate-500 uppercase w-12">Dist</label>
                                                            <input className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-bold text-center text-xs" value={glRx.pd?.dist} onChange={e => setGlRx({ ...glRx, pd: { ...glRx.pd!, dist: e.target.value } })} />
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <label className="text-xs font-black text-slate-500 uppercase w-12">Near</label>
                                                            <input className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-bold text-center text-xs" value={glRx.pd?.near} onChange={e => setGlRx({ ...glRx, pd: { ...glRx.pd!, near: e.target.value } })} />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="lg:col-span-3 space-y-4">
                                                    <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest">Lens Characteristics & Features</h4>
                                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                                        {[
                                                            'GLASS', 'CR-39', 'POLYCARBONATE', 'SP2', 'PHOTOCHROMATIC', 'PROGRESSIVE',
                                                            'KRYPTOK BIFOCAL', 'ARC', 'O-BIFOCAL', 'HARD MULTI COAT(HMC)', 'HI-INDEX',
                                                            'SINGLE VISION DIST', 'SINGLE VISION NEAR'
                                                        ].map(lens => (
                                                            <button
                                                                key={lens}
                                                                onClick={() => {
                                                                    const current = glRx.lensTypes || [];
                                                                    const next = current.includes(lens) ? current.filter(l => l !== lens) : [...current, lens];
                                                                    setGlRx({ ...glRx, lensTypes: next });
                                                                }}
                                                                className={`p-2 rounded-lg text-[10px] font-black uppercase tracking-tighter border transition-all ${glRx.lensTypes?.includes(lens) ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-900/20' : 'bg-slate-800 text-slate-500 border-slate-700'}`}
                                                            >
                                                                {lens}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Instructions & Refractionist */}
                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6 border-t border-slate-700">
                                                <div className="lg:col-span-2 space-y-2">
                                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Special Instructions</label>
                                                    <textarea className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white text-xs font-medium focus:ring-1 focus:ring-teal-500 outline-none h-24 resize-none" placeholder="Lens dispensing notes, frame preference, or clinical precautions..." value={glRx.instructions} onChange={e => setGlRx({ ...glRx, instructions: e.target.value })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Refractionist Name</label>
                                                    <input className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white font-bold text-sm focus:ring-1 focus:ring-teal-500 outline-none" value={glRx.refractionist} onChange={e => setGlRx({ ...glRx, refractionist: e.target.value })} placeholder="Technician Name" />
                                                    <div className="mt-4 p-4 bg-teal-900/20 rounded-xl border border-teal-800/50">
                                                        <p className="text-xs font-bold text-teal-400 leading-relaxed uppercase">Validated clinical data will be automatically embedded in the digital prescription ledger once finalized.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                        <h4 className="text-xs font-black text-slate-400 uppercase mb-4 tracking-widest">Intraocular Pressure (IOP)</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-500">IOP Right (OD)</label>
                                                <input className="w-full p-3 border rounded-xl font-bold" value={refraction.iop.od} onChange={e => setRefraction({ ...refraction, iop: { ...refraction.iop, od: e.target.value } })} placeholder="mmHg" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-500">IOP Left (OS)</label>
                                                <input className="w-full p-3 border rounded-xl font-bold" value={refraction.iop.os} onChange={e => setRefraction({ ...refraction, iop: { ...refraction.iop, os: e.target.value } })} placeholder="mmHg" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'visual' && (
                                <div className="flex flex-col h-full">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex gap-2">
                                            <button onClick={() => setVisualTemplate('anterior')} className={`px-4 py-2 rounded-lg text-xs font-bold ${visualTemplate === 'anterior' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Anterior</button>
                                            <button onClick={() => setVisualTemplate('posterior')} className={`px-4 py-2 rounded-lg text-xs font-bold ${visualTemplate === 'posterior' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Fundus</button>
                                        </div>
                                        <button onClick={initCanvases} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"><Eraser size={18} /></button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6 flex-1">
                                        <div className="border-2 border-slate-100 rounded-2xl bg-slate-50 flex items-center justify-center p-4 relative">
                                            <canvas ref={canvasRefOD} width={400} height={400} className="w-full max-w-[350px] aspect-square cursor-crosshair bg-white rounded-full" onMouseDown={(e) => startDrawing(e, canvasRefOD)} onMouseMove={(e) => handleDraw(e, canvasRefOD)} onMouseUp={() => setIsDrawing(false)} />
                                        </div>
                                        <div className="border-2 border-slate-100 rounded-2xl bg-slate-50 flex items-center justify-center p-4 relative">
                                            <canvas ref={canvasRefOS} width={400} height={400} className="w-full max-w-[350px] aspect-square cursor-crosshair bg-white rounded-full" onMouseDown={(e) => startDrawing(e, canvasRefOS)} onMouseMove={(e) => handleDraw(e, canvasRefOS)} onMouseUp={() => setIsDrawing(false)} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'diagnosis' && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Clinical Impression</h3>
                                        <div className="flex gap-2 mb-3">
                                            <input className="flex-1 p-2 border border-slate-200 rounded-lg text-sm" placeholder="Add diagnosis..." value={newDiagnosis} onChange={e => setNewDiagnosis(e.target.value)} onKeyDown={e => e.key === 'Enter' && (setDiagnosisList([...diagnosisList, newDiagnosis]), setNewDiagnosis(''))} />
                                            <button onClick={() => (setDiagnosisList([...diagnosisList, newDiagnosis]), setNewDiagnosis(''))} className="px-4 py-2 bg-slate-800 text-white rounded-lg"><Plus size={14} /></button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {diagnosisList.map((d, i) => (
                                                <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold">
                                                    {d} <button onClick={() => setDiagnosisList(diagnosisList.filter((_, idx) => idx !== i))}><X size={12} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-slate-100">
                                        <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider flex items-center gap-2">
                                            <Pill size={16} className="text-teal-600" /> Prescribe Medications
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                            <input placeholder="Drug Name" className="p-2 text-xs border rounded-lg" value={newMed.name} onChange={e => setNewMed({ ...newMed, name: e.target.value })} />
                                            <input placeholder="Dosage (e.g. 1-0-1)" className="p-2 text-xs border rounded-lg" value={newMed.dosage} onChange={e => setNewMed({ ...newMed, dosage: e.target.value })} />
                                            <input placeholder="Duration (e.g. 7 days)" className="p-2 text-xs border rounded-lg" value={newMed.duration} onChange={e => setNewMed({ ...newMed, duration: e.target.value })} />
                                            <div className="flex gap-2">
                                                <input placeholder="Instruction" className="flex-1 p-2 text-xs border rounded-lg" value={newMed.instruction} onChange={e => setNewMed({ ...newMed, instruction: e.target.value })} />
                                                <button onClick={addMedicine} className="px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"><Plus size={14} /></button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            {medicines.map((m, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-white border rounded-xl shadow-sm">
                                                    <div>
                                                        <span className="font-bold text-slate-800 text-sm">{m.name}</span>
                                                        <span className="text-xs text-slate-500 ml-2 uppercase font-black">{m.dosage} • {m.duration}</span>
                                                        <p className="text-xs text-slate-400 italic">{m.instruction}</p>
                                                    </div>
                                                    <button onClick={() => setMedicines(medicines.filter((_, i) => i !== idx))} className="text-rose-500 p-1 hover:bg-rose-50 rounded"><Trash2 size={14} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-slate-100">
                                        <h3 className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Clinical Advice</h3>
                                        <textarea className="w-full p-3 border border-slate-200 rounded-lg text-sm resize-none" rows={4} value={advice} onChange={e => setAdvice(e.target.value)} placeholder="Taper dose of steroids, cold compresses..." />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="w-full lg:w-96 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col shrink-0">
                        <div className="p-4 bg-slate-900 text-white flex items-center justify-between rounded-t-xl">
                            <div>
                                <h3 className="font-bold flex items-center gap-2"><Sparkles size={16} className="text-teal-400" /> AI Specialist Hub</h3>
                                <p className="text-xs text-slate-400">Gemini 3 Pro Clinical Reasoning</p>
                            </div>
                            {isAiAnalyzing && <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent animate-spin rounded-full"></div>}
                        </div>
                        <div className="flex-1 p-5 overflow-y-auto">
                            {aiSuggestion ? (
                                <div className="prose prose-sm text-xs text-slate-700">
                                    <div dangerouslySetInnerHTML={{ __html: aiSuggestion.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                                </div>
                            ) : (
                                <div className="text-center py-12 text-slate-400">
                                    <BrainCircuit size={40} className="mx-auto mb-4 opacity-10" />
                                    <p className="text-xs px-6 font-medium leading-relaxed">Enter chief complaints and vitals data, then click analyze for AI insights.</p>
                                </div>
                            )}
                        </div>
                        {role !== 'Nurse' && (
                            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                                <button onClick={runAiAnalysis} disabled={isAiAnalyzing || !clinicalData.chiefComplaint} className="w-full py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-md">Run Analysis</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Clinical Summary Modal */}
            {showClinicalSummary && patient && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
                        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/10 rounded-xl">
                                    <ClipboardList size={20} className="text-teal-400" />
                                </div>
                                <div>
                                    <h3 className="font-black text-lg">Clinical Summary</h3>
                                    <p className="text-xs text-slate-400 uppercase tracking-widest">Patient: {patient.name} ({patient.id})</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => downloadPDF('emr-clinical-summary', `ClinicalSummary_${patient.name}.pdf`)}
                                    className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-colors"
                                    title="Export PDF"
                                >
                                    <Download size={18} />
                                </button>
                                <button
                                    onClick={() => shareToWhatsApp('emr-clinical-summary', `Clinical Summary for ${patient.name} (${patient.id})`)}
                                    className="p-2 hover:bg-white/10 rounded-lg text-green-400 transition-colors"
                                    title="Share to WhatsApp"
                                >
                                    <Mail size={18} />
                                </button>
                                <button
                                    onClick={() => setShowClinicalSummary(false)}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar" id="emr-clinical-summary">
                            <div className="space-y-3">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <BrainCircuit size={14} className="text-teal-600" /> Primary Diagnosis
                                </h4>
                                <div className="p-4 bg-teal-50 border border-teal-100 rounded-2xl">
                                    <p className="text-sm font-bold text-teal-900">
                                        {diagnosisList.length > 0 ? diagnosisList.join(', ') : (patient.diagnosis || 'No diagnosis recorded yet.')}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Activity size={14} className="text-indigo-600" /> Chief Complaint
                                </h4>
                                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                                    <p className="text-sm font-bold text-indigo-900 leading-relaxed">
                                        {clinicalData.chiefComplaint || 'No chief complaint recorded.'}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <FileText size={14} className="text-amber-600" /> Current Prescription Notes
                                </h4>
                                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                                    <p className="text-sm font-bold text-amber-900 leading-relaxed">
                                        {patient.prescriptionNotes || 'No prescription notes available.'}
                                    </p>
                                </div>
                            </div>

                            {medicines.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Pill size={14} className="text-rose-600" /> Current Medications (Draft)
                                    </h4>
                                    <div className="space-y-2">
                                        {medicines.map((m, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                                <div>
                                                    <span className="font-bold text-slate-800 text-sm">{m.name}</span>
                                                    <span className="text-xs text-slate-500 ml-2 uppercase font-black">{m.dosage} • {m.duration}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setShowClinicalSummary(false)}
                                className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
                            >
                                Close Summary
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default EMR;
