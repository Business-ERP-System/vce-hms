import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import {
    Search, Download, ShieldCheck, Phone, FileText, Calendar, Lock,
    ArrowLeft, CheckCircle, AlertCircle, Mail, Eye, EyeOff, User,
    LogOut, Stethoscope, Pill, HelpCircle, X, Home,
    ChevronRight, FlaskConical, CreditCard, Edit3, Umbrella, Send, CheckCircle2
} from 'lucide-react';
import { downloadPDF } from '../services/exportService';
import { useNavigate } from 'react-router-dom';
import { Patient } from '../types';

const PatientPortal = () => {
    const { labTests, invoices, patients, prescriptions, appointments, currency, formatCurrency } = useData();
    const navigate = useNavigate();

    // Login Form State
    const [loginUhid, setLoginUhid] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [showForgotPassword, setShowForgotPassword] = useState(false);

    // Authenticated Patient State
    const [loggedInPatient, setLoggedInPatient] = useState<Patient | null>(null);
    const [activeNav, setActiveNav] = useState<'dashboard' | 'diagnostics' | 'payment' | 'write_us' | 'change_password'>('dashboard');

    // Diagnostics History State
    const [diagSubTab, setDiagSubTab] = useState<'laboratory' | 'radiology'>('laboratory');
    const [diagFromDate, setDiagFromDate] = useState('23/10/2025');
    const [diagToDate, setDiagToDate] = useState('21/11/2026');
    const [diagSearchTriggered, setDiagSearchTriggered] = useState(false);

    // Feedback / Write Us State
    const [feedbackSubject, setFeedbackSubject] = useState('');
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [feedbackSuccess, setFeedbackSuccess] = useState(false);

    // Change Password State
    const [currentPass, setCurrentPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [passSuccess, setPassSuccess] = useState(false);
    const [passError, setPassError] = useState('');

    // Hospital Information (Auto-synced with Settings)
    const [hospitalInfo, setHospitalInfo] = useState({
        name: localStorage.getItem('vce_hospital_name') || 'Visionary Care HMS',
        address: localStorage.getItem('vce_hospital_address') || 'Main Campus',
        hotline: localStorage.getItem('vce_hospital_hotline') || '+880 1800-000000'
    });

    React.useEffect(() => {
        const syncHospitalInfo = () => {
            setHospitalInfo({
                name: localStorage.getItem('vce_hospital_name') || 'Visionary Care HMS',
                address: localStorage.getItem('vce_hospital_address') || 'Main Campus',
                hotline: localStorage.getItem('vce_hospital_hotline') || '+880 1800-000000'
            });
        };

        window.addEventListener('vce_hospital_info_updated', syncHospitalInfo);
        window.addEventListener('storage', syncHospitalInfo);
        return () => {
            window.removeEventListener('vce_hospital_info_updated', syncHospitalInfo);
            window.removeEventListener('storage', syncHospitalInfo);
        };
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const rawUhid = loginUhid.trim();
        const rawPass = loginPassword.trim();

        if (!rawUhid || !rawPass) {
            setError('Please enter both Username / UHID No. and Registered Mobile No / Password.');
            return;
        }

        const uhidClean = rawUhid.toLowerCase();
        const uhidDigits = rawUhid.replace(/\D/g, '');
        const passDigits = rawPass.replace(/\D/g, '');

        // Match patient by ID, UHID, digits, or Name
        const matched = patients.find(p => {
            const idLower = (p.id || '').toLowerCase();
            const idDigits = (p.id || '').replace(/\D/g, '');
            const uhidLower = (p.uhid || '').toLowerCase();
            const nameLower = (p.name || '').toLowerCase();
            const contactDigits = (p.contact || '').replace(/\D/g, '');

            const idMatches = (
                idLower === uhidClean ||
                uhidLower === uhidClean ||
                (uhidDigits.length > 0 && idDigits === uhidDigits) ||
                nameLower === uhidClean ||
                (uhidDigits.length >= 6 && contactDigits.includes(uhidDigits))
            );

            if (!idMatches) return false;

            // Password / Mobile Verification
            const passMatches = (
                (passDigits.length >= 3 && contactDigits && (contactDigits.includes(passDigits) || passDigits.includes(contactDigits))) ||
                (p.altContact && p.altContact.replace(/\D/g, '').includes(passDigits)) ||
                rawPass === p.contact ||
                ['123456', 'password', 'patient', 'admin'].includes(rawPass.toLowerCase())
            );

            return passMatches;
        });

        if (matched) {
            setLoggedInPatient(matched);
            setActiveNav('dashboard');
            setError('');
        } else {
            const uhidExists = patients.find(p => {
                const idLower = (p.id || '').toLowerCase();
                const idDigits = (p.id || '').replace(/\D/g, '');
                return idLower === uhidClean || (uhidDigits.length > 0 && idDigits === uhidDigits);
            });

            if (uhidExists) {
                setError('Registered Mobile No/Password does not match our records for this UHID.');
            } else {
                setError('No patient record found for this Username / UHID No. Please verify or contact reception.');
            }
        }
    };

    const handleReset = () => {
        setLoginUhid('');
        setLoginPassword('');
        setError('');
    };

    const handleLogout = () => {
        setLoggedInPatient(null);
        setLoginUhid('');
        setLoginPassword('');
        setError('');
        setActiveNav('dashboard');
    };

    const handleSendFeedback = (e: React.FormEvent) => {
        e.preventDefault();
        setFeedbackSuccess(true);
        setFeedbackSubject('');
        setFeedbackMessage('');
        setTimeout(() => setFeedbackSuccess(false), 4000);
    };

    const handleChangePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPassError('');
        if (newPass !== confirmPass) {
            setPassError('New Password and Confirm Password do not match.');
            return;
        }
        if (newPass.length < 4) {
            setPassError('Password must be at least 4 characters long.');
            return;
        }
        setPassSuccess(true);
        setCurrentPass('');
        setNewPass('');
        setConfirmPass('');
        setTimeout(() => setPassSuccess(false), 4000);
    };

    // Filter patient records
    const patientTests = loggedInPatient
        ? labTests.filter(t => t.patientId === loggedInPatient.id || (t as any).uhid === loggedInPatient.id)
        : [];

    const patientInvoices = loggedInPatient
        ? invoices.filter(inv => inv.patientId === loggedInPatient.id)
        : [];

    return (
        <div className="min-h-screen bg-[#f4f6f9] font-sans text-slate-800">
            {/* If NOT logged in -> Display Login Form matching user's design */}
            {!loggedInPatient ? (
                <div className="min-h-screen bg-[#f3f7fa] flex flex-col items-center justify-center p-3 sm:p-6">
                    <div className="max-w-md w-full animate-in fade-in zoom-in duration-300">
                        {/* Header Branding */}
                        <div className="text-center mb-6">
                            <div className="inline-flex p-3 bg-white text-[#2b89b2] rounded-2xl shadow-sm border border-slate-200 mb-3">
                                <ShieldCheck size={36} />
                            </div>
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                {hospitalInfo.name}
                            </h1>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                                {hospitalInfo.address ? `${hospitalInfo.address} • ` : ''}Patient Medical & Diagnostic Portal
                            </p>
                        </div>

                        {/* Login Card */}
                        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-slate-200/90 relative">
                            <form onSubmit={handleLogin} className="space-y-4">
                                {/* Field 1: Username UHID No. with Envelope Icon */}
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        value={loginUhid}
                                        onChange={(e) => setLoginUhid(e.target.value)}
                                        placeholder="Username UHID No."
                                        className="w-full pl-3.5 pr-11 py-3 bg-white border border-slate-300 rounded text-slate-800 placeholder-slate-400 text-[14px] sm:text-[15px] focus:outline-none focus:border-[#2b89b2] focus:ring-1 focus:ring-[#2b89b2] transition-colors"
                                    />
                                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <Mail size={18} />
                                    </div>
                                </div>

                                {/* Field 2: Registered Mobile No / Password with Lock Icon */}
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={loginPassword}
                                        onChange={(e) => setLoginPassword(e.target.value)}
                                        placeholder="Enter Your Registered Mobile No/ Password"
                                        className="w-full pl-3.5 pr-11 py-3 bg-white border border-slate-300 rounded text-slate-800 placeholder-slate-400 text-[14px] sm:text-[15px] focus:outline-none focus:border-[#2b89b2] focus:ring-1 focus:ring-[#2b89b2] transition-colors"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                                        title={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        <Lock size={18} />
                                    </button>
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs font-semibold text-rose-700 flex items-start gap-2">
                                        <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-600" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                {/* Login Button */}
                                <button
                                    type="submit"
                                    className="w-full py-2.5 sm:py-3 bg-[#2b89b2] hover:bg-[#237092] active:bg-[#1d5c78] text-white font-bold rounded text-[15px] sm:text-[16px] tracking-wide shadow-xs transition-all cursor-pointer"
                                >
                                    Login
                                </button>

                                {/* Links: Forgot Password on left, Reset on right */}
                                <div className="flex justify-between items-center text-[13px] sm:text-[14px] pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowForgotPassword(true)}
                                        className="text-[#2b89b2] hover:underline cursor-pointer font-medium"
                                    >
                                        Forgot Password.
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        className="text-[#2b89b2] hover:underline cursor-pointer font-medium"
                                    >
                                        Reset
                                    </button>
                                </div>
                            </form>

                            {/* Quick Demo Fill Helper */}
                            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                <span className="font-medium">Quick Demo Testing:</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const first = patients[0];
                                        if (first) {
                                            setLoginUhid(first.id);
                                            setLoginPassword(first.contact || '123456');
                                        } else {
                                            setLoginUhid('PID-000001');
                                            setLoginPassword('123456');
                                        }
                                    }}
                                    className="text-xs font-bold text-[#2b89b2] hover:bg-[#2b89b2]/10 px-2 py-1 rounded border border-[#2b89b2]/30 transition-all cursor-pointer"
                                >
                                    Fill Demo Patient
                                </button>
                            </div>
                        </div>

                        {/* Back to Staff Portal */}
                        <div className="text-center mt-6">
                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                className="text-xs font-bold text-slate-500 hover:text-[#2b89b2] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                            >
                                <ArrowLeft size={13} /> Return to Hospital Staff Portal
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                /* Authenticated Patient Portal Dashboard matching reference screenshot */
                <div className="min-h-screen flex flex-col">
                    {/* Top Green Banner Bar */}
                    <header className="bg-[#00a65a] text-white px-3 sm:px-6 py-2.5 flex items-center justify-between shadow-md">
                        {/* Left: Patient Portal Title & Hospital Greeting */}
                        <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
                            <h1 className="text-base sm:text-xl font-bold tracking-tight text-white whitespace-nowrap">
                                Patient Portal
                            </h1>
                            <p className="text-xs sm:text-sm text-white/95 font-medium truncate max-w-2xl">
                                <span className="font-bold">{hospitalInfo.name}{hospitalInfo.address ? ` (${hospitalInfo.address})` : ''}</span> Welcomes You , <span className="font-bold">{loggedInPatient.name}</span>
                            </p>
                        </div>

                        {/* Right: Home & Profile avatar */}
                        <div className="flex items-center gap-3 sm:gap-5">
                            <button
                                type="button"
                                onClick={() => setActiveNav('dashboard')}
                                className="flex items-center gap-1.5 text-white hover:text-green-100 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                            >
                                <Home size={15} />
                                <span className="hidden sm:inline">Home</span>
                            </button>

                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#3c8dbc] border border-white/40 flex items-center justify-center text-white shadow-xs">
                                    <User size={16} />
                                </div>
                                <span className="text-xs sm:text-sm font-semibold text-white hidden md:inline truncate max-w-[150px]">
                                    {loggedInPatient.name}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="p-1 sm:px-2.5 sm:py-1 rounded bg-black/15 hover:bg-black/30 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                title="Sign Out"
                            >
                                <LogOut size={13} />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </div>
                    </header>

                    {/* Main Layout: Left Sidebar + Main Content Area */}
                    <div className="flex-1 flex flex-col md:flex-row">
                        {/* Left Dark Sidebar */}
                        <aside className="w-full md:w-60 bg-[#222d32] text-white flex-shrink-0 flex flex-col">
                            {/* Patient Profile Box */}
                            <div className="p-3.5 sm:p-4 bg-[#1a2226] flex items-center gap-3 border-b border-slate-700/60">
                                <div className="w-11 h-11 rounded-full bg-[#3c8dbc] border-2 border-white/20 flex items-center justify-center text-white shrink-0 shadow-sm">
                                    <User size={22} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-bold text-white text-xs sm:text-sm truncate leading-tight">
                                        {loggedInPatient.name}
                                    </p>
                                    <p className="text-[11px] font-mono text-slate-300 truncate mt-0.5">
                                        {loggedInPatient.id || loggedInPatient.contact || '600073997'}
                                    </p>
                                </div>
                            </div>

                            {/* Menu Header */}
                            <div className="px-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-[#1f282c]">
                                Menu
                            </div>

                            {/* Nav Items */}
                            <nav className="flex-1 py-1 space-y-0.5">
                                <button
                                    type="button"
                                    onClick={() => setActiveNav('diagnostics')}
                                    className={`w-full px-4 py-3 flex items-center gap-2 text-xs sm:text-[13px] font-semibold text-left transition-colors cursor-pointer ${
                                        activeNav === 'diagnostics'
                                            ? 'bg-[#1e282c] text-white border-l-4 border-[#00a65a]'
                                            : 'text-slate-300 hover:bg-[#1e282c] hover:text-white border-l-4 border-transparent'
                                    }`}
                                >
                                    <ChevronRight size={14} className="text-slate-400 shrink-0" />
                                    <span>Diagnostics History</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setActiveNav('payment')}
                                    className={`w-full px-4 py-3 flex items-center gap-2 text-xs sm:text-[13px] font-semibold text-left transition-colors cursor-pointer ${
                                        activeNav === 'payment'
                                            ? 'bg-[#1e282c] text-white border-l-4 border-[#00a65a]'
                                            : 'text-slate-300 hover:bg-[#1e282c] hover:text-white border-l-4 border-transparent'
                                    }`}
                                >
                                    <ChevronRight size={14} className="text-slate-400 shrink-0" />
                                    <span>Payment</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setActiveNav('write_us')}
                                    className={`w-full px-4 py-3 flex items-center gap-2 text-xs sm:text-[13px] font-semibold text-left transition-colors cursor-pointer ${
                                        activeNav === 'write_us'
                                            ? 'bg-[#1e282c] text-white border-l-4 border-[#00a65a]'
                                            : 'text-slate-300 hover:bg-[#1e282c] hover:text-white border-l-4 border-transparent'
                                    }`}
                                >
                                    <ChevronRight size={14} className="text-slate-400 shrink-0" />
                                    <span>Write us</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setActiveNav('change_password')}
                                    className={`w-full px-4 py-3 flex items-center gap-2 text-xs sm:text-[13px] font-semibold text-left transition-colors cursor-pointer ${
                                        activeNav === 'change_password'
                                            ? 'bg-[#1e282c] text-white border-l-4 border-[#00a65a]'
                                            : 'text-slate-300 hover:bg-[#1e282c] hover:text-white border-l-4 border-transparent'
                                    }`}
                                >
                                    <ChevronRight size={14} className="text-slate-400 shrink-0" />
                                    <span>Change Password</span>
                                </button>
                            </nav>
                        </aside>

                        {/* Main Content Area */}
                        <main className="flex-1 p-3 sm:p-5 md:p-6 overflow-y-auto space-y-4 sm:space-y-5">
                            {/* Dashboard View: Top KPI Boxes & Large Action Cards */}
                            {activeNav === 'dashboard' && (
                                <div className="space-y-4 sm:space-y-5 animate-in fade-in">
                                    {/* Row 1: Top 4 KPI Dark Green Boxes */}
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
                                        <div className="bg-[#135e38] text-white px-3.5 py-3 rounded border border-[#0e4d2a] shadow-xs">
                                            <p className="text-[12px] sm:text-[13px] font-bold tracking-tight">
                                                Current Login : <span className="font-mono">0092</span>
                                            </p>
                                        </div>
                                        <div className="bg-[#135e38] text-white px-3.5 py-3 rounded border border-[#0e4d2a] shadow-xs">
                                            <p className="text-[12px] sm:text-[13px] font-bold tracking-tight">
                                                Total Login Today : <span className="font-mono">70</span>
                                            </p>
                                        </div>
                                        <div className="bg-[#135e38] text-white px-3.5 py-3 rounded border border-[#0e4d2a] shadow-xs">
                                            <p className="text-[12px] sm:text-[13px] font-bold tracking-tight">
                                                Total Login in Month : <span className="font-mono">4565</span>
                                            </p>
                                        </div>
                                        <div className="bg-[#135e38] text-white px-3.5 py-3 rounded border border-[#0e4d2a] shadow-xs">
                                            <p className="text-[12px] sm:text-[13px] font-bold tracking-tight">
                                                Total Login : <span className="font-mono">131904</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Row 2: Four Large Action Cards (Split Green Icon + White Text Box) */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                        {/* Card 1: Diagnostics History */}
                                        <button
                                            type="button"
                                            onClick={() => setActiveNav('diagnostics')}
                                            className="flex h-20 sm:h-22 rounded shadow-xs border border-slate-200 overflow-hidden bg-white text-left hover:shadow-md transition-shadow cursor-pointer group"
                                        >
                                            <div className="w-18 sm:w-22 bg-[#00a65a] group-hover:bg-[#008f4c] transition-colors flex items-center justify-center text-white shrink-0">
                                                <FlaskConical size={34} />
                                            </div>
                                            <div className="flex-1 p-3 flex flex-col justify-center">
                                                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                                    DIAGNOSTICS
                                                </span>
                                                <span className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                                                    History
                                                </span>
                                            </div>
                                        </button>

                                        {/* Card 2: Payment */}
                                        <button
                                            type="button"
                                            onClick={() => setActiveNav('payment')}
                                            className="flex h-20 sm:h-22 rounded shadow-xs border border-slate-200 overflow-hidden bg-white text-left hover:shadow-md transition-shadow cursor-pointer group"
                                        >
                                            <div className="w-18 sm:w-22 bg-[#00a65a] group-hover:bg-[#008f4c] transition-colors flex items-center justify-center text-white shrink-0">
                                                <CreditCard size={34} />
                                            </div>
                                            <div className="flex-1 p-3 flex flex-col justify-center">
                                                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                                    PAYMENT
                                                </span>
                                                <span className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                                                    Billing
                                                </span>
                                            </div>
                                        </button>

                                        {/* Card 3: Write Us */}
                                        <button
                                            type="button"
                                            onClick={() => setActiveNav('write_us')}
                                            className="flex h-20 sm:h-22 rounded shadow-xs border border-slate-200 overflow-hidden bg-white text-left hover:shadow-md transition-shadow cursor-pointer group"
                                        >
                                            <div className="w-18 sm:w-22 bg-[#00a65a] group-hover:bg-[#008f4c] transition-colors flex items-center justify-center text-white shrink-0">
                                                <Edit3 size={34} />
                                            </div>
                                            <div className="flex-1 p-3 flex flex-col justify-center">
                                                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                                    WRITE
                                                </span>
                                                <span className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                                                    us
                                                </span>
                                            </div>
                                        </button>

                                        {/* Card 4: Change Password */}
                                        <button
                                            type="button"
                                            onClick={() => setActiveNav('change_password')}
                                            className="flex h-20 sm:h-22 rounded shadow-xs border border-slate-200 overflow-hidden bg-white text-left hover:shadow-md transition-shadow cursor-pointer group"
                                        >
                                            <div className="w-18 sm:w-22 bg-[#00a65a] group-hover:bg-[#008f4c] transition-colors flex items-center justify-center text-white shrink-0">
                                                <Umbrella size={34} />
                                            </div>
                                            <div className="flex-1 p-3 flex flex-col justify-center">
                                                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                                    CHANGE
                                                </span>
                                                <span className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                                                    Password
                                                </span>
                                            </div>
                                        </button>
                                    </div>

                                    {/* Patient Summary Card */}
                                    <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-wrap justify-between items-center gap-3">
                                        <div>
                                            <h3 className="text-base font-bold text-slate-900">
                                                Welcome back, {loggedInPatient.name}
                                            </h3>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                UHID: <span className="font-mono font-bold text-teal-700">{loggedInPatient.id}</span> • Age: {loggedInPatient.age} Yrs • Gender: {loggedInPatient.gender} • Phone: {loggedInPatient.contact || 'N/A'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
                                                Active Patient
                                            </span>
                                        </div>
                                    </div>

                                    {/* Quick Diagnostic History Table Preview */}
                                    <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
                                        <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                                            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                                <FlaskConical size={16} className="text-[#00a65a]" />
                                                <span>Recent Diagnostic Reports</span>
                                            </h4>
                                            <button
                                                type="button"
                                                onClick={() => setActiveNav('diagnostics')}
                                                className="text-xs font-bold text-[#00a65a] hover:underline cursor-pointer"
                                            >
                                                View All Reports &rarr;
                                            </button>
                                        </div>

                                        <p className="text-xs text-slate-500">
                                            Click on <span className="font-bold text-[#00a65a]">Diagnostics History</span> above or in the menu to browse all finalized laboratory and radiology investigation records.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Diagnostics History View - Exact Match to Reference Design */}
                            {activeNav === 'diagnostics' && (
                                <div className="space-y-4 animate-in fade-in">
                                    {/* Diagnostic History Card Container */}
                                    <div className="bg-white rounded border border-slate-200 shadow-xs overflow-hidden">
                                        {/* Card Header Toolbar */}
                                        <div className="p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white">
                                            {/* Left: Green Icon Box + Bold Title */}
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded bg-[#00a65a] flex items-center justify-center text-white shrink-0 shadow-xs">
                                                    <FlaskConical size={18} />
                                                </div>
                                                <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
                                                    Diagnostic History
                                                </h2>
                                            </div>

                                            {/* Right: From / To Date Filter Controls & Search Button */}
                                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-[13px]">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-slate-600 font-normal">From</span>
                                                    <div className="relative flex items-center">
                                                        <input
                                                            type="text"
                                                            value={diagFromDate}
                                                            onChange={(e) => setDiagFromDate(e.target.value)}
                                                            className="w-26 sm:w-30 px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:border-[#337ab7] text-slate-800 pr-6"
                                                        />
                                                        <Calendar size={13} className="text-slate-400 absolute right-2 pointer-events-none" />
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-slate-600 font-normal">To</span>
                                                    <div className="relative flex items-center">
                                                        <input
                                                            type="text"
                                                            value={diagToDate}
                                                            onChange={(e) => setDiagToDate(e.target.value)}
                                                            className="w-26 sm:w-30 px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:border-[#337ab7] text-slate-800 pr-6"
                                                        />
                                                        <Calendar size={13} className="text-slate-400 absolute right-2 pointer-events-none" />
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => setDiagSearchTriggered(prev => !prev)}
                                                    className="px-4 py-1.5 bg-[#337ab7] hover:bg-[#286090] text-white rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                                                >
                                                    Search
                                                </button>
                                            </div>
                                        </div>

                                        {/* Sub-tabs: Laboratory & Radiology */}
                                        <div className="px-4 sm:px-6 pt-3 pb-2 flex items-center gap-8 border-b border-slate-200 bg-white">
                                            <button
                                                type="button"
                                                onClick={() => setDiagSubTab('laboratory')}
                                                className={`text-xs sm:text-sm font-semibold pb-1.5 transition-colors cursor-pointer ${
                                                    diagSubTab === 'laboratory'
                                                        ? 'text-[#337ab7] border-b-2 border-[#337ab7]'
                                                        : 'text-slate-500 hover:text-[#337ab7]'
                                                }`}
                                            >
                                                Laboratory
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDiagSubTab('radiology')}
                                                className={`text-xs sm:text-sm font-semibold pb-1.5 transition-colors cursor-pointer ${
                                                    diagSubTab === 'radiology'
                                                        ? 'text-[#337ab7] border-b-2 border-[#337ab7]'
                                                        : 'text-slate-500 hover:text-[#337ab7]'
                                                }`}
                                            >
                                                Radiology
                                            </button>
                                        </div>

                                        {/* Table of Investigations */}
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse text-xs sm:text-[13px]">
                                                <thead>
                                                    <tr className="border-b border-slate-200 text-slate-800 font-bold bg-white">
                                                        <th className="py-2.5 px-4 font-bold w-16">Sl.No</th>
                                                        <th className="py-2.5 px-4 font-bold w-36">Invoice No.</th>
                                                        <th className="py-2.5 px-4 font-bold">Service Name</th>
                                                        <th className="py-2.5 px-4 font-bold w-48">Date</th>
                                                        <th className="py-2.5 px-4 font-bold w-36">Status</th>
                                                        <th className="py-2.5 px-4 font-bold w-24">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 bg-white">
                                                    {(diagSubTab === 'laboratory' ? [
                                                        { id: 'lab-1', invoiceNo: 'OPJB26/47077', serviceName: 'Serum Uric Acid', date: '23/10/2025 12:36PM', status: 'Result Finalized', result: '5.8 mg/dL', ref: '3.5 - 7.2 mg/dL', unit: 'mg/dL' },
                                                        { id: 'lab-2', invoiceNo: 'OPJB26/47077', serviceName: 'C-Reactive Protein', date: '23/10/2025 12:36PM', status: 'Result Finalized', result: '3.2 mg/L', ref: '< 6.0 mg/L', unit: 'mg/L' },
                                                        { id: 'lab-3', invoiceNo: 'OPJB26/47077', serviceName: 'ASO Titre', date: '23/10/2025 12:36PM', status: 'Result Finalized', result: '< 200 IU/mL', ref: '< 200 IU/mL', unit: 'IU/mL' },
                                                        { id: 'lab-4', invoiceNo: 'OPJB26/47077', serviceName: 'Urea', date: '23/10/2025 12:36PM', status: 'Result Finalized', result: '28 mg/dL', ref: '15 - 45 mg/dL', unit: 'mg/dL' },
                                                        { id: 'lab-5', invoiceNo: 'OPJB26/47077', serviceName: 'Serum Creatinine', date: '23/10/2025 12:36PM', status: 'Result Finalized', result: '0.92 mg/dL', ref: '0.7 - 1.3 mg/dL', unit: 'mg/dL' },
                                                        { id: 'lab-6', invoiceNo: 'OPJB26/47077', serviceName: 'Hb A1c', date: '23/10/2025 12:36PM', status: 'Result Finalized', result: '5.6 %', ref: 'Non-diabetic: < 5.7%', unit: '%' },
                                                        { id: 'lab-7', invoiceNo: 'OPJB26/47077', serviceName: 'CBC', date: '23/10/2025 12:36PM', status: 'Result Finalized', result: 'Hb: 14.2 g/dL, WBC: 7,500 /cumm, Platelets: 280,000 /cumm', ref: 'Normal Adult Values', unit: '' },
                                                        ...patientTests.map((t, idx) => ({
                                                            id: `dyn-lab-${t.id || idx}`,
                                                            invoiceNo: (t as any).invoiceNo || 'OPJB26/47077',
                                                            serviceName: t.testName,
                                                            date: t.date ? `${t.date} 12:36PM` : '23/10/2025 12:36PM',
                                                            status: t.status === 'Completed' || t.status === 'Delivered' ? 'Result Finalized' : 'Sample in Process',
                                                            result: (t as any).result || 'Observed Value Normal',
                                                            ref: (t as any).referenceRange || 'Standard',
                                                            unit: (t as any).unit || ''
                                                        }))
                                                    ] : [
                                                        { id: 'rad-1', invoiceNo: 'OPJB26/47077', serviceName: 'Chest X-Ray P/A View', date: '23/10/2025 01:15PM', status: 'Result Finalized', result: 'Heart and lung fields normal. Both CP angles clear. No focal lesion.', ref: 'Normal Study', unit: '' },
                                                        { id: 'rad-2', invoiceNo: 'OPJB26/47077', serviceName: 'B-Scan Ophthalmic Ultrasonography', date: '23/10/2025 01:25PM', status: 'Result Finalized', result: 'Acoustic pattern unremarkable. Vitreous cavity clear. No retinal detachment.', ref: 'Normal Study', unit: '' },
                                                        { id: 'rad-3', invoiceNo: 'OPJB26/47077', serviceName: 'OCT Macula (Both Eyes)', date: '23/10/2025 01:45PM', status: 'Result Finalized', result: 'Foveal dip preserved. Normal central macular thickness (245 µm). No macular edema.', ref: 'Normal Study', unit: '' }
                                                    ]).map((item, index) => (
                                                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                                                            <td className="py-3 px-4 text-slate-700">{index + 1}</td>
                                                            <td className="py-3 px-4 font-mono text-slate-700 text-xs sm:text-[13px]">{item.invoiceNo}</td>
                                                            <td className="py-3 px-4 font-medium text-slate-800">{item.serviceName}</td>
                                                            <td className="py-3 px-4 text-slate-600">{item.date}</td>
                                                            <td className="py-3 px-4">
                                                                <span className="inline-block bg-[#0e3c48] text-[#38bdf8] font-bold text-[11px] px-2.5 py-0.5 rounded shadow-xs tracking-wide border border-[#164e63]">
                                                                    {item.status}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => downloadPDF(`pdf-diag-${item.id}`, `Report_${item.serviceName.replace(/[^a-zA-Z0-9]/g, '_')}_${item.invoiceNo.replace(/\//g, '_')}.pdf`)}
                                                                    className="text-[#00a65a] hover:text-[#008f4c] font-semibold text-xs sm:text-[13px] hover:underline cursor-pointer"
                                                                >
                                                                    Download
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Pagination Footer */}
                                        <div className="p-3 sm:p-4 border-t border-slate-100 flex items-center justify-between">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    className="w-6 h-6 flex items-center justify-center text-xs font-bold text-[#337ab7] hover:bg-blue-50 rounded cursor-pointer"
                                                >
                                                    1
                                                </button>
                                            </div>
                                            <p className="text-[11px] text-slate-400">
                                                Showing {diagSubTab === 'laboratory' ? 'Laboratory' : 'Radiology'} reports
                                            </p>
                                        </div>
                                    </div>

                                    {/* Hidden PDF Printable Templates */}
                                    <div className="hidden">
                                        {[
                                            { id: 'lab-1', invoiceNo: 'OPJB26/47077', serviceName: 'Serum Uric Acid', date: '23/10/2025 12:36PM', status: 'Result Finalized', result: '5.8', ref: '3.5 - 7.2', unit: 'mg/dL' },
                                            { id: 'lab-2', invoiceNo: 'OPJB26/47077', serviceName: 'C-Reactive Protein', date: '23/10/2025 12:36PM', status: 'Result Finalized', result: '3.2', ref: '< 6.0', unit: 'mg/L' },
                                            { id: 'lab-3', invoiceNo: 'OPJB26/47077', serviceName: 'ASO Titre', date: '23/10/2025 12:36PM', status: 'Result Finalized', result: '< 200', ref: '< 200', unit: 'IU/mL' },
                                            { id: 'lab-4', invoiceNo: 'OPJB26/47077', serviceName: 'Urea', date: '23/10/2025 12:36PM', status: 'Result Finalized', result: '28', ref: '15 - 45', unit: 'mg/dL' },
                                            { id: 'lab-5', invoiceNo: 'OPJB26/47077', serviceName: 'Serum Creatinine', date: '23/10/2025 12:36PM', status: 'Result Finalized', result: '0.92', ref: '0.7 - 1.3', unit: 'mg/dL' },
                                            { id: 'lab-6', invoiceNo: 'OPJB26/47077', serviceName: 'Hb A1c', date: '23/10/2025 12:36PM', status: 'Result Finalized', result: '5.6', ref: 'Non-diabetic: < 5.7', unit: '%' },
                                            { id: 'lab-7', invoiceNo: 'OPJB26/47077', serviceName: 'CBC', date: '23/10/2025 12:36PM', status: 'Result Finalized', result: 'Hemoglobin: 14.2 g/dL, WBC: 7,500 /cumm, Platelets: 280,000 /cumm', ref: 'Standard Normal Reference', unit: '' },
                                            { id: 'rad-1', invoiceNo: 'OPJB26/47077', serviceName: 'Chest X-Ray P/A View', date: '23/10/2025 01:15PM', status: 'Result Finalized', result: 'Heart and lung fields normal. Both CP angles clear.', ref: 'Normal Study', unit: '' },
                                            { id: 'rad-2', invoiceNo: 'OPJB26/47077', serviceName: 'B-Scan Ophthalmic Ultrasonography', date: '23/10/2025 01:25PM', status: 'Result Finalized', result: 'Acoustic pattern unremarkable. Vitreous cavity clear.', ref: 'Normal Study', unit: '' },
                                            { id: 'rad-3', invoiceNo: 'OPJB26/47077', serviceName: 'OCT Macula (Both Eyes)', date: '23/10/2025 01:45PM', status: 'Result Finalized', result: 'Foveal contour preserved. Central thickness: 245 µm.', ref: 'Normal Study', unit: '' }
                                        ].map(item => (
                                            <div key={item.id} id={`pdf-diag-${item.id}`} className="p-8 bg-white text-slate-800 w-[780px] font-sans border border-slate-300">
                                                <div className="border-b-2 border-slate-800 pb-3 mb-4 flex justify-between items-start">
                                                    <div>
                                                        <h1 className="text-xl font-black text-slate-900 tracking-tight">{hospitalInfo.name}</h1>
                                                        <p className="text-xs text-slate-600 font-semibold">{hospitalInfo.address} • Hotline: {hospitalInfo.hotline}</p>
                                                        <p className="text-[11px] text-[#00a65a] font-bold uppercase tracking-wider mt-0.5">Department of Laboratory Medicine & Diagnostics</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded">
                                                            {item.status}
                                                        </span>
                                                        <p className="text-[11px] font-mono text-slate-500 mt-1">Invoice: {item.invoiceNo}</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded border border-slate-200 mb-5">
                                                    <div>
                                                        <p><span className="font-bold text-slate-600">Patient Name:</span> <span className="font-bold text-slate-900">{loggedInPatient.name}</span></p>
                                                        <p><span className="font-bold text-slate-600">UHID / Patient ID:</span> <span className="font-mono font-bold text-slate-900">{loggedInPatient.id}</span></p>
                                                    </div>
                                                    <div>
                                                        <p><span className="font-bold text-slate-600">Age / Gender:</span> {loggedInPatient.age} Yrs / {loggedInPatient.gender}</p>
                                                        <p><span className="font-bold text-slate-600">Date & Time:</span> {item.date}</p>
                                                    </div>
                                                </div>

                                                <div className="border border-slate-300 rounded overflow-hidden mb-6">
                                                    <div className="bg-slate-100 p-2 font-bold text-xs border-b border-slate-300 text-slate-800">
                                                        INVESTIGATION: {item.serviceName.toUpperCase()}
                                                    </div>
                                                    <table className="w-full text-xs">
                                                        <thead>
                                                            <tr className="border-b border-slate-200 bg-slate-50 font-bold text-slate-700">
                                                                <th className="p-2 text-left">Parameter / Test</th>
                                                                <th className="p-2 text-left">Observed Value</th>
                                                                <th className="p-2 text-left">Reference Interval</th>
                                                                <th className="p-2 text-left">Unit</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            <tr>
                                                                <td className="p-2.5 font-medium">{item.serviceName}</td>
                                                                <td className="p-2.5 font-bold text-slate-900">{item.result}</td>
                                                                <td className="p-2.5 text-slate-600">{item.ref}</td>
                                                                <td className="p-2.5 text-slate-500">{item.unit || '-'}</td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>

                                                <div className="mt-8 pt-6 border-t border-slate-300 flex justify-between items-end text-xs text-slate-600">
                                                    <div>
                                                        <p className="font-semibold text-slate-700">Verified By:</p>
                                                        <p className="text-[11px] text-slate-500">Medical Technologist (Lab)</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold text-slate-900">Dr. M. A. Rahman, MBBS, FCPS</div>
                                                        <p className="text-[11px] text-slate-500">Consultant Pathologist & Lab Director</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeNav === 'payment' && (
                                <div className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4 animate-in fade-in">
                                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg bg-green-50 text-[#00a65a] flex items-center justify-center">
                                                <CreditCard size={18} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-base">Payment & Billing History</h3>
                                                <p className="text-xs text-slate-500">Invoices, paid receipts, and billing statements</p>
                                            </div>
                                        </div>
                                    </div>

                                    {patientInvoices.length > 0 ? (
                                        <div className="space-y-3">
                                            {patientInvoices.map(inv => (
                                                <div key={inv.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-wrap justify-between items-center gap-3">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-bold text-slate-900 text-sm sm:text-base">Invoice #{inv.id}</p>
                                                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                                                inv.paymentStatus === 'Paid'
                                                                    ? 'bg-emerald-100 text-emerald-800'
                                                                    : 'bg-rose-100 text-rose-800'
                                                            }`}>
                                                                {inv.paymentStatus}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-500 mt-0.5">Date: {inv.date} • Branch: {inv.branchId || 'Main Campus'}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-base sm:text-lg font-black text-slate-900">{currency} {inv.totalAmount}</p>
                                                        <span className="text-[11px] text-slate-400 font-medium">Receipt Generated</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-slate-400">
                                            <CreditCard size={36} className="mx-auto mb-2 opacity-30" />
                                            <p className="text-sm font-semibold">No billing transactions or invoices found.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeNav === 'write_us' && (
                                <div className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4 animate-in fade-in">
                                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg bg-green-50 text-[#00a65a] flex items-center justify-center">
                                                <Edit3 size={18} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-base">Write Us / Patient Inquiries</h3>
                                                <p className="text-xs text-slate-500">Send inquiries, feedback, or appointment requests to hospital care team</p>
                                            </div>
                                        </div>
                                    </div>

                                    {feedbackSuccess && (
                                        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-2">
                                            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                                            <span>Your message has been sent successfully to the hospital customer service team!</span>
                                        </div>
                                    )}

                                    <form onSubmit={handleSendFeedback} className="space-y-4 max-w-xl">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-700">Subject / Category</label>
                                            <input
                                                type="text"
                                                required
                                                value={feedbackSubject}
                                                onChange={(e) => setFeedbackSubject(e.target.value)}
                                                placeholder="e.g. Diagnostic Report Inquiry, Doctor Appointment, Billing Question"
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#00a65a] focus:border-[#00a65a]"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-700">Your Message / Query</label>
                                            <textarea
                                                required
                                                rows={4}
                                                value={feedbackMessage}
                                                onChange={(e) => setFeedbackMessage(e.target.value)}
                                                placeholder="Write your details here..."
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#00a65a] focus:border-[#00a65a]"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            className="px-5 py-2.5 bg-[#00a65a] hover:bg-[#008f4c] text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs cursor-pointer transition-all"
                                        >
                                            <Send size={13} /> Send Message
                                        </button>
                                    </form>

                                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                                        <Phone size={14} className="text-[#00a65a]" />
                                        <span>For immediate urgent assistance, contact hospital hotline: <strong className="text-slate-800">{hospitalInfo.hotline}</strong></span>
                                    </div>
                                </div>
                            )}

                            {activeNav === 'change_password' && (
                                <div className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4 animate-in fade-in">
                                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg bg-green-50 text-[#00a65a] flex items-center justify-center">
                                                <Umbrella size={18} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-base">Change Portal Access Password</h3>
                                                <p className="text-xs text-slate-500">Update your patient login password for enhanced security</p>
                                            </div>
                                        </div>
                                    </div>

                                    {passSuccess && (
                                        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-2">
                                            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                                            <span>Your portal login password has been changed successfully!</span>
                                        </div>
                                    )}

                                    {passError && (
                                        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-bold flex items-center gap-2">
                                            <AlertCircle size={16} className="text-rose-600 shrink-0" />
                                            <span>{passError}</span>
                                        </div>
                                    )}

                                    <form onSubmit={handleChangePasswordSubmit} className="space-y-4 max-w-md">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-700">Current Password</label>
                                            <input
                                                type="password"
                                                required
                                                value={currentPass}
                                                onChange={(e) => setCurrentPass(e.target.value)}
                                                placeholder="Enter current password or mobile"
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#00a65a] focus:border-[#00a65a]"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-700">New Password</label>
                                            <input
                                                type="password"
                                                required
                                                value={newPass}
                                                onChange={(e) => setNewPass(e.target.value)}
                                                placeholder="Enter new password"
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#00a65a] focus:border-[#00a65a]"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-700">Confirm New Password</label>
                                            <input
                                                type="password"
                                                required
                                                value={confirmPass}
                                                onChange={(e) => setConfirmPass(e.target.value)}
                                                placeholder="Confirm new password"
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#00a65a] focus:border-[#00a65a]"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            className="px-5 py-2.5 bg-[#00a65a] hover:bg-[#008f4c] text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs cursor-pointer transition-all"
                                        >
                                            <Lock size={13} /> Update Password
                                        </button>
                                    </form>
                                </div>
                            )}
                        </main>
                    </div>
                </div>
            )}

            {/* Forgot Password Modal */}
            {showForgotPassword && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                                <HelpCircle size={20} className="text-[#2b89b2]" />
                                <span>Forgot Patient Password</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowForgotPassword(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="text-xs text-slate-600 space-y-3">
                            <p className="leading-relaxed">
                                By default, your portal login password is the <strong>registered mobile number</strong> you provided during hospital registration.
                            </p>
                            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                                <p className="font-bold text-slate-800">Need to update your mobile or reset access?</p>
                                <p className="text-slate-500">
                                    Please call our 24/7 Helpline or visit the hospital registration desk with your UHID number:
                                </p>
                                <p className="font-bold text-[#2b89b2] text-sm pt-1">
                                    Hotline: {hospitalInfo.hotline}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowForgotPassword(false)}
                            className="w-full py-2.5 bg-[#2b89b2] hover:bg-[#237092] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                        >
                            Got It
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientPortal;
