
import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { Prescription } from '../types';
import {
    Search, FileText, Printer, Mail, Download, Calendar,
    Eye, User, Clock, Edit, Plus, ArrowLeft, X, MapPin, Phone, AlertTriangle, Activity,
    Info, Pill, ClipboardList, PenTool, Glasses
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Barcode from 'react-barcode';
import { downloadPDF, shareToWhatsApp, shareToEmail } from '../services/exportService';

const EPrescription = () => {
    const { prescriptions, patients } = useData();
    const navigate = useNavigate();
    const location = useLocation();
    const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Auto-select and filter if navigating from Patient module
    useEffect(() => {
        if (location.state?.patientId || location.state?.patientName) {
            const filterVal = location.state.patientId || location.state.patientName;
            setSearchTerm(filterVal);
            const autoSelect = prescriptions.find(r => r.patientId === location.state.patientId || r.patientName === location.state.patientName);
            if (autoSelect) setSelectedRx(autoSelect);
        } else if (!selectedRx && prescriptions.length > 0) {
            setSelectedRx(prescriptions[0]);
        }
    }, [prescriptions, selectedRx, location.state]);


    const filteredRx = prescriptions.filter(rx =>
        rx.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rx.patientId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handlePrint = () => {
        if (!selectedRx) return;
        window.print();
    };

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col gap-4 animate-in fade-in duration-300">
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Digital Prescription Ledger</h1>
                    <p className="text-sm text-slate-500">Historical E-Prescription records and clinical advice database.</p>
                </div>
                <div className="flex gap-2">
                    {location.state && <button onClick={() => navigate('/patients')} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors"><ArrowLeft size={16} /> Back to Registry</button>}
                    <button onClick={() => navigate('/opd')} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm transition-colors">
                        <Plus size={16} /> Create New Prescription
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
                <div className="w-full lg:w-1/3 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden print:hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search by UHID or Patient Name..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {filteredRx.length > 0 ? (
                            filteredRx.map(rx => (
                                <div
                                    key={rx.id}
                                    onClick={() => setSelectedRx(rx)}
                                    className={`p-5 border-b border-slate-50 cursor-pointer transition-all hover:bg-slate-50 ${selectedRx?.id === rx.id ? 'bg-teal-50 border-l-4 border-l-teal-600' : 'border-l-4 border-l-transparent'}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-black text-slate-900 text-sm uppercase tracking-tighter">{rx.patientName}</span>
                                        <span className="text-xs font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-lg uppercase">{rx.date}</span>
                                    </div>
                                    <div className="text-xs text-slate-500 mb-3 flex justify-between items-center">
                                        <span>{rx.patientGender}, {rx.patientAge}Y • {rx.doctorName}</span>
                                        <span className="font-mono text-xs text-teal-600">{rx.id}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 truncate max-w-full">
                                            {rx.diagnosis}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-4">
                                <AlertTriangle size={40} className="opacity-20" />
                                <p className="text-sm font-medium">No prescription records match your search.</p>
                                <button onClick={() => setSearchTerm('')} className="text-teal-600 font-bold text-xs underline">Clear Search</button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 bg-slate-100 rounded-xl overflow-y-auto p-4 lg:p-8 flex justify-center print:p-0 print:bg-white print:m-0 custom-scrollbar">
                    {selectedRx ? (
                        <div
                            className="bg-white shadow-2xl print:shadow-none p-10 md:p-16 print:p-16 flex flex-col relative text-slate-900 border border-slate-200 print:border-none"
                            id="printable-rx"
                            style={{
                                width: '210mm',
                                height: '297mm'
                            }}
                        >
                            <div className="absolute top-6 right-6 flex items-center gap-2 print:hidden backdrop-blur-md bg-white/50 p-2 rounded-2xl border border-white/50 shadow-xl">
                                <button
                                    onClick={handlePrint}
                                    title="Print Prescription"
                                    className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                                >
                                    <Printer size={18} />
                                </button>
                                <button
                                    onClick={() => downloadPDF('printable-rx', `Prescription_${selectedRx.patientName}_${selectedRx.id}.pdf`)}
                                    title="Download PDF"
                                    className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-teal-600 rounded-xl transition-all shadow-md active:scale-95"
                                >
                                    <Download size={18} />
                                </button>
                                <button
                                    onClick={() => shareToWhatsApp('printable-rx', `Hello, find the E-Prescription for ${selectedRx.patientName} (ID: ${selectedRx.id}) attached.`)}
                                    title="Share to WhatsApp"
                                    className="p-2.5 bg-white border border-slate-200 text-green-600 hover:bg-green-50 rounded-xl transition-all shadow-md active:scale-95"
                                >
                                    <Mail size={18} />
                                </button>
                                <button
                                    onClick={() => shareToEmail('printable-rx', `E-Prescription: ${selectedRx.patientName}`, `Please find the digital prescription details for ${selectedRx.patientName}.`)}
                                    title="Send via Email"
                                    className="p-2.5 bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-md active:scale-95"
                                >
                                    <X size={18} className="rotate-45" />
                                </button>
                                <div className="w-px bg-slate-200 mx-1 lg:h-8"></div>
                                <button
                                    onClick={() => setSelectedRx(null)}
                                    title="Close"
                                    className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 rounded-xl transition-all shadow-md active:scale-95"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Header Section */}
                            <div className="flex justify-between items-start border-b-2 border-slate-100 pb-5 mb-5 print-no-break">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-teal-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-teal-100">
                                        <Eye size={32} />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">Visionary Care</h1>
                                        <p className="text-xs font-black text-teal-600 uppercase tracking-[0.2em] mt-1">Specialist Eye Hospital</p>
                                        <div className="text-xs text-slate-400 font-bold uppercase mt-1 leading-tight">
                                            Retina & Glaucoma Center • Downtown Plaza<br />
                                            Ph: +1 555-0199 • visionarycare.com
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-base font-black text-slate-900 leading-none">{selectedRx.doctorName}</div>
                                    <div className="text-xs text-teal-700 font-bold uppercase tracking-widest mt-1">Consultant Ophthalmologist</div>
                                    <div className="text-xs text-slate-400 font-bold uppercase mt-1">BMDC: {selectedRx.id.replace('RX-', 'DR')}</div>
                                </div>
                            </div>

                            {/* Patient Infobar - Optimized Density */}
                            <div className="bg-slate-50 border-y border-slate-200 py-3 px-6 mb-5 grid grid-cols-4 gap-4 items-center rounded-xl print-no-break">
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] block mb-0.5">Patient Name</span>
                                    <span className="font-bold text-sm text-slate-900">{selectedRx.patientName}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] block mb-0.5">UHID / Gender / Age</span>
                                    <span className="font-bold text-sm text-slate-900">{selectedRx.patientId} • {selectedRx.patientGender} • {selectedRx.patientAge}Y</span>
                                </div>
                                <div className="text-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] block mb-0.5">Date</span>
                                    <span className="font-bold text-sm text-slate-800">{selectedRx.date}</span>
                                </div>
                                <div className="flex justify-end">
                                    <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                                        <Barcode value={selectedRx.id} width={0.8} height={20} fontSize={8} margin={0} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row print:flex-row gap-8 mb-6 flex-1 overflow-hidden">
                                <div className="md:w-1/3 print:w-1/3 border-r-2 border-slate-50 pr-8 space-y-6">
                                    <div>
                                        <h3 className="text-xs font-black text-slate-400 uppercase mb-3 border-b-2 border-teal-50 pb-1 tracking-widest">Final Diagnosis</h3>
                                        <p className="text-sm font-black text-teal-900 bg-teal-50/50 p-4 rounded-2xl border border-teal-100">{selectedRx.diagnosis}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-black text-slate-400 uppercase mb-3 border-b-2 border-teal-50 pb-1 tracking-widest">Physiological Vitals</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex justify-between items-center px-4">
                                                <span className="text-xs font-bold text-slate-400 uppercase">BP</span>
                                                <b className="text-xs text-slate-700">{selectedRx.vitals?.bp || '--'}</b>
                                            </div>
                                            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex justify-between items-center px-4">
                                                <span className="text-xs font-bold text-slate-400 uppercase">HR</span>
                                                <b className="text-xs text-slate-700">{selectedRx.vitals?.pulse || '--'}</b>
                                            </div>
                                            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex justify-between items-center px-4">
                                                <span className="text-xs font-bold text-slate-400 uppercase">TEMP</span>
                                                <b className="text-xs text-slate-700">{selectedRx.vitals?.temp || '--'}</b>
                                            </div>
                                            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex justify-between items-center px-4">
                                                <span className="text-xs font-bold text-slate-400 uppercase">WT</span>
                                                <b className="text-xs text-slate-700">{selectedRx.vitals?.weight || '--'}</b>
                                            </div>
                                        </div>
                                    </div>
                                    {selectedRx.glassPrescription && (
                                        <div className="space-y-4">
                                            <h3 className="text-xs font-black text-rose-500 uppercase mb-3 border-b-2 border-rose-50 pb-1 tracking-widest flex items-center gap-2">
                                                <Glasses size={14} /> Spectacles Prescription
                                            </h3>

                                            {/* Sub-section: Subjective Refraction (ACC) */}
                                            <div className="bg-rose-50/30 rounded-2xl border border-rose-100 overflow-hidden">
                                                <div className="bg-rose-100/50 px-4 py-1.5 text-xs font-black text-rose-600 uppercase tracking-widest">Subjective Refraction</div>
                                                <table className="w-full text-xs text-center">
                                                    <thead>
                                                        <tr className="font-bold text-rose-400 uppercase text-[10px] bg-white/50 border-b border-rose-50">
                                                            <th className="py-1">Eye</th>
                                                            <th className="py-1">SPH</th>
                                                            <th className="py-1">CYL</th>
                                                            <th className="py-1">AXIS</th>
                                                            <th className="py-1">V/A</th>
                                                            <th className="py-1">ADD</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-rose-100/30">
                                                        <tr>
                                                            <td className="py-2 mb-0 font-black text-rose-700">RE</td>
                                                            <td className="py-2 font-bold">{selectedRx.glassPrescription.acc.re.dv.sph}</td>
                                                            <td className="py-2 font-bold">{selectedRx.glassPrescription.acc.re.dv.cyl}</td>
                                                            <td className="py-2 font-bold">{selectedRx.glassPrescription.acc.re.dv.axis}</td>
                                                            <td className="py-2 font-bold text-rose-600">{selectedRx.glassPrescription.acc.re.dv.va}</td>
                                                            <td className="py-2 font-bold bg-amber-50/50">{selectedRx.glassPrescription.acc.re.add.sph}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="py-2 font-black text-rose-700">LE</td>
                                                            <td className="py-2 font-bold">{selectedRx.glassPrescription.acc.le.dv.sph}</td>
                                                            <td className="py-2 font-bold">{selectedRx.glassPrescription.acc.le.dv.cyl}</td>
                                                            <td className="py-2 font-bold">{selectedRx.glassPrescription.acc.le.dv.axis}</td>
                                                            <td className="py-2 font-bold text-rose-600">{selectedRx.glassPrescription.acc.le.dv.va}</td>
                                                            <td className="py-2 font-bold bg-amber-50/50">{selectedRx.glassPrescription.acc.le.add.sph}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* PD & Lens Extras */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">PD (Pupillary Dist.)</p>
                                                    <div className="flex justify-between text-xs font-bold">
                                                        <span>Dist: <b className="text-slate-900">{selectedRx.glassPrescription.pd?.dist || '--'}</b></span>
                                                        <span>Near: <b className="text-slate-900">{selectedRx.glassPrescription.pd?.near || '--'}</b></span>
                                                    </div>
                                                </div>
                                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Refractionist</p>
                                                    <p className="text-xs font-black text-slate-800 uppercase">{selectedRx.glassPrescription.refractionist || 'Clinical Staff'}</p>
                                                </div>
                                            </div>

                                            {selectedRx.glassPrescription.lensTypes && selectedRx.glassPrescription.lensTypes.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {selectedRx.glassPrescription.lensTypes.map(l => (
                                                        <span key={l} className="px-2 py-0.5 bg-rose-600 text-white rounded-md text-[10px] font-black uppercase tracking-tighter">
                                                            {l}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {selectedRx.vision && (
                                        <div>
                                            <h3 className="text-xs font-black text-slate-400 uppercase mb-3 border-b-2 border-teal-50 pb-1 tracking-widest">Refraction (VA)</h3>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center bg-teal-50/30 p-3 rounded-xl border border-teal-100 px-5">
                                                    <span className="text-xs font-black text-teal-800">RIGHT (OD)</span>
                                                    <b className="text-sm font-black text-teal-900">{selectedRx.vision.re}</b>
                                                </div>
                                                <div className="flex justify-between items-center bg-teal-50/30 p-3 rounded-xl border border-teal-100 px-5">
                                                    <span className="text-xs font-black text-teal-800">LEFT (OS)</span>
                                                    <b className="text-sm font-black text-teal-900">{selectedRx.vision.le}</b>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 print:flex-1">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="text-4xl font-serif text-slate-200 italic font-black select-none leading-none">Rx</div>
                                        <div className="h-px bg-slate-100 flex-1"></div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        {selectedRx.medicines.map((med, idx) => (
                                            <div key={idx} className="p-4 rounded-xl border border-slate-100 hover:border-teal-100 transition-colors group print-no-break">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="font-black text-slate-900 text-sm uppercase tracking-tight">{med.name}</div>
                                                    <div className="text-xs font-black text-slate-300 uppercase shrink-0">#{idx + 1}</div>
                                                </div>
                                                <div className="flex items-center gap-6 mb-2">
                                                    <div className="bg-teal-50 px-3 py-1 rounded-lg">
                                                        <span className="text-[10px] font-black text-teal-600 uppercase block tracking-widest leading-none mb-0.5">Dose</span>
                                                        <span className="text-xs font-black text-teal-900">{med.dosage}</span>
                                                    </div>
                                                    <div className="bg-blue-50 px-3 py-1 rounded-lg">
                                                        <span className="text-[10px] font-black text-blue-600 uppercase block tracking-widest leading-none mb-0.5">Duration</span>
                                                        <span className="text-xs font-black text-blue-900">{med.duration}</span>
                                                    </div>
                                                </div>
                                                <div className="text-xs text-slate-500 font-bold italic flex items-center gap-2">
                                                    <Info size={12} className="text-teal-400" /> {med.instruction}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {selectedRx.notes && (
                                        <div className="mt-12 bg-amber-50 border-l-8 border-amber-400 p-6 rounded-3xl shadow-lg shadow-amber-900/5">
                                            <h4 className="text-xs font-black text-amber-900 uppercase mb-2 tracking-[0.2em] flex items-center gap-2"><ClipboardList size={16} /> Clinical Advice</h4>
                                            <p className="text-sm text-amber-900 leading-relaxed font-medium">{selectedRx.notes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] space-y-1">
                                    <p className="text-teal-600 font-black">Digital Verification Enabled</p>
                                    <p>Ref: Visionary System • Rx Ledger ID: {selectedRx.id}</p>
                                </div>
                                <div className="w-56 text-center">
                                    <div className="h-10 border-b border-slate-200 mb-2 relative flex items-center justify-center">
                                        <PenTool className="text-slate-100 -rotate-12 absolute" size={24} />
                                    </div>
                                    <p className="text-xs font-black text-slate-800 uppercase tracking-[0.3em]">Authorized Signature</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400 max-w-sm text-center"><div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-slate-200 mb-6"><FileText size={40} /></div><h3 className="text-lg font-black text-slate-900 mb-2 uppercase">Prescription Viewer</h3><p className="text-sm font-medium leading-relaxed">Select a patient record from the sidebar to view their digital prescription.</p></div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EPrescription;
