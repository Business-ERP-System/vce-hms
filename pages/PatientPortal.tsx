
import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Search, Download, ShieldCheck, Phone, FileText, Calendar, Lock, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { downloadPDF } from '../services/exportService';
import { useNavigate } from 'react-router-dom';
import { CustomDatePicker } from '../components/CustomDatePicker';

const PatientPortal = () => {
    const { labTests, invoices, patients } = useData();
    const navigate = useNavigate();
    const [step, setStep] = useState<'validate' | 'results'>('validate');
    const [formData, setFormData] = useState({
        patientId: '',
        invoiceNo: '',
        mobile: '',
        date: ''
    });
    const [error, setError] = useState('');
    const [foundTests, setFoundTests] = useState<any[]>([]);

    const handleValidate = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // 1. Find Invoice
        const invoice = invoices.find(inv =>
            inv.id === formData.invoiceNo &&
            inv.patientId === formData.patientId &&
            inv.date === formData.date &&
            inv.patientContact.includes(formData.mobile.slice(-10))
        );

        if (!invoice) {
            setError('Verification failed. Please check your Details (UHID, Invoice No, Date, and Mobile).');
            return;
        }

        // 2. Check Payment Status
        if (invoice.paymentStatus !== 'Paid') {
            setError('Reports are locked. Please clear your outstanding balance of ' + invoice.totalAmount + ' to download.');
            return;
        }

        // 3. Find Lab Tests
        const tests = labTests.filter(t => t.patientId === formData.patientId && t.date === formData.date);

        if (tests.length === 0) {
            setError('No investigation records found for the specified date.');
            return;
        }

        setFoundTests(tests);
        setStep('results');
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 font-sans">
            <div className="max-w-md w-full">
                {/* Branding */}
                <div className="text-center mb-10">
                    <div className="inline-flex p-4 bg-slate-900 text-white rounded-3xl shadow-xl mb-4">
                        <ShieldCheck size={40} />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Visionary <span className="text-indigo-600">Care</span></h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Secure Patient Diagnostic Portal</p>
                </div>

                {step === 'validate' ? (
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-white relative overflow-hidden animate-in fade-in zoom-in duration-500">
                        <div className="absolute top-0 right-0 p-8 opacity-5"><Lock size={120} /></div>

                        <div className="relative z-10">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 border-b border-slate-100 pb-4">Validate Identity</h2>

                            <form onSubmit={handleValidate} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Patient UHID</label>
                                    <div className="relative">
                                        <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                        <input required type="text" placeholder="e.g. PAT-123456" className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none transition-all" value={formData.patientId} onChange={e => setFormData({ ...formData, patientId: e.target.value })} />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Invoice Number</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                        <input required type="text" placeholder="e.g. INV-123456" className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none transition-all" value={formData.invoiceNo} onChange={e => setFormData({ ...formData, invoiceNo: e.target.value })} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Bill Date</label>
                                        <CustomDatePicker
                                            required
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                            className="!py-3 !rounded-2xl !bg-slate-50 !border-slate-100 !text-xs !font-bold"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Mobile No</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                            <input required type="tel" placeholder="01XXX-XXXXXX" className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none transition-all" value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} />
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 animate-pulse">
                                        <AlertCircle className="text-rose-500 shrink-0" size={16} />
                                        <p className="text-xs font-black text-rose-600 uppercase tracking-tight leading-relaxed">{error}</p>
                                    </div>
                                )}

                                <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 mt-4">
                                    Verify & Access Reports
                                </button>
                            </form>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-white animate-in slide-in-from-bottom-8 duration-500">
                        <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
                            <button onClick={() => setStep('validate')} className="p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-400 hover:text-slate-900"><ArrowLeft size={18} /></button>
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Available Reports</h2>
                        </div>

                        <div className="space-y-4">
                            {foundTests.map(test => (
                                <div key={test.id} className="p-5 rounded-3xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-50/50 transition-all transition-duration-300 group">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{test.testName}</p>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${test.status === 'Completed' || test.status === 'Delivered' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{test.status}</span>
                                                <span className="text-xs font-bold text-slate-400">ID: {test.id}</span>
                                            </div>
                                        </div>

                                        {test.status === 'Completed' || test.status === 'Delivered' ? (
                                            <div id={`report-${test.id}`}>
                                                <button
                                                    onClick={() => downloadPDF(`report-${test.id}`, `Report_${test.testName}_${test.id}.pdf`)}
                                                    className="p-3 bg-white text-indigo-600 rounded-xl shadow-sm border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:scale-110"
                                                >
                                                    <Download size={18} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="p-3 text-slate-200">
                                                <Download size={18} />
                                            </div>
                                        )}
                                    </div>
                                    {test.status !== 'Completed' && test.status !== 'Delivered' && (
                                        <p className="text-xs font-bold text-slate-400 italic mt-3 flex items-center gap-1"><AlertCircle size={10} /> Automated Status: {test.status}. Estimation: {test.deliveryTiming || '24h'}</p>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-100 text-center">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Need Assistance?</p>
                            <p className="text-xs font-black text-slate-900 mt-1 uppercase tracking-tight">+880 1XXX-XXXXXX</p>
                        </div>
                    </div>
                )}

                <button onClick={() => navigate('/login')} className="mt-8 text-xs font-black text-slate-400 uppercase tracking-[0.2em] hover:text-indigo-600 transition-all flex items-center justify-center gap-2 w-full">
                    <ArrowLeft size={12} /> Return to Hospital Portal
                </button>
            </div>
        </div>
    );
};

export default PatientPortal;
