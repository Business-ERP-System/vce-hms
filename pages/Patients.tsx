
import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Patient, PreviousVisionHistory } from '../types';
import { MOCK_EMPLOYEES } from '../constants';
import { BdtIcon } from '../components/BdtIcon';
import {
    Search, Plus, Filter, FileText, Trash2, X, Save, ArrowUpDown, Sparkles,
    BrainCircuit, AlertTriangle, Edit, RefreshCw, ChevronDown, Download,
    Upload, ScanLine, FileCheck, CheckSquare, Square, UserMinus, UserCheck,
    Stethoscope, Eye, Clock, Activity, FilePlus, Printer, DollarSign,
    CreditCard, Scissors, Bed as BedIcon, ArrowRight, FileJson,
    FileSpreadsheet, FileCode, FileType, Phone, ExternalLink, MapPin,
    Home, CreditCard as CardIcon, UserPlus, Info, Tag, Clipboard, Copy,
    Users, Mail, Archive, User, Calendar, Map as MapIcon, Briefcase, Building2,
    Settings, RotateCcw, Globe
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { SettingsModal } from '../components/SettingsModal';
import { PrintSettingsModal } from '../components/PrintSettingsModal';

const fuzzyMatch = (text?: string, query?: string): boolean => {
    if (!text || !query) return false;
    const t = text.toLowerCase();
    const q = query.toLowerCase();
    if (t.includes(q)) return true;
    let qIdx = 0;
    for (let tIdx = 0; tIdx < t.length && qIdx < q.length; tIdx++) {
        if (t[tIdx] === q[qIdx]) qIdx++;
    }
    return qIdx === q.length;
};

const Patients = () => {
    const { patients, updatePatient, deletePatient: removePatient, finance, beds, updateBed, hasPermission, formatCurrency, currency } = useData();
    const navigate = useNavigate();

    const hospitalInfo = useMemo(() => {
        try {
            const saved = localStorage.getItem('hospital_info_settings');
            if (saved) return JSON.parse(saved);
        } catch (e) { }
        return {
            name: 'VISIONARY CARE HMS',
            tagline: 'SPECIALIST OPHTHALMOLOGY & MICROSURGERY CENTER',
            address: 'Main Campus - Dhaka',
            hotline: '+880 1800-000000',
            notice: '• Please wait in the waiting lounge near your assigned room.\n• Keep this slip handy during preliminary vision testing & consultation.'
        };
    }, []);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setSearchFilter] = useState<string>('All');

    // Column Filter States
    const [activeFilterPopover, setActiveFilterPopover] = useState<string | null>(null);
    const [colFilterPid, setColFilterPid] = useState('');
    const [colFilterGender, setColFilterGender] = useState<'All' | 'Male' | 'Female'>('All');
    const [colFilterAgeGroup, setColFilterAgeGroup] = useState<'All' | '<18' | '18-35' | '36-50' | '51+'>('All');
    const [colFilterDistrict, setColFilterDistrict] = useState('All');
    const [colFilterClass, setColFilterClass] = useState('All');
    const [colFilterSpeciality, setColFilterSpeciality] = useState('All');
    const [colFilterStatus, setColFilterStatus] = useState('All');

    const canAdd = hasPermission('Patient List', 'add');
    const canEdit = hasPermission('Patient List', 'edit');
    const canDelete = hasPermission('Patient List', 'delete');
    const canPrint = hasPermission('Patient List', 'print');
    const canExport = hasPermission('Patient List', 'export');
    const canView = hasPermission('Patient List', 'view');

    const [sortConfig, setSortConfig] = useState<{ key: keyof Patient | null; direction: 'asc' | 'desc' }>({
        key: null, direction: 'desc'
    });

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [patientToDelete, setPatientToDelete] = useState<string | null>(null);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [detailsTab, setDetailsTab] = useState<'Overview' | 'Clinical' | 'Vision' | 'Financials'>('Overview');
    const [expandedVisitIdx, setExpandedVisitIdx] = useState<number | null>(null);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

    // Close popovers, modals or go back on escape key
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.column-filter-container')) {
                setActiveFilterPopover(null);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;

            // 1. If print modal is open, close it
            if (isPrintModalOpen) {
                e.preventDefault();
                e.stopPropagation();
                setIsPrintModalOpen(false);
                return;
            }

            // 2. If delete modal is open, close it
            if (isDeleteModalOpen) {
                e.preventDefault();
                e.stopPropagation();
                setIsDeleteModalOpen(false);
                return;
            }

            // 3. If settings modal is open, close it
            if (isSettingsOpen) {
                e.preventDefault();
                e.stopPropagation();
                setIsSettingsOpen(false);
                return;
            }

            // 4. If export dropdown menu is open, close it
            if (showExportMenu) {
                e.preventDefault();
                e.stopPropagation();
                setShowExportMenu(false);
                return;
            }

            // 5. If column filter popover is open, close it
            if (activeFilterPopover !== null) {
                e.preventDefault();
                e.stopPropagation();
                setActiveFilterPopover(null);
                return;
            }

            // 6. If patient details modal/dossier is open, close it
            if (selectedPatient) {
                e.preventDefault();
                e.stopPropagation();
                setSelectedPatient(null);
                return;
            }

            // 7. Otherwise, trigger Go Back (matches browser Back button ←)
            e.preventDefault();
            e.stopPropagation();

            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }

            const canGoBack = window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0;
            if (canGoBack) {
                navigate(-1);
            } else {
                navigate('/dashboard');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [
        isPrintModalOpen,
        isDeleteModalOpen,
        isSettingsOpen,
        showExportMenu,
        activeFilterPopover,
        selectedPatient,
        navigate
    ]);

    // Status counts for segmented status filter tabs
    const statusCounts = useMemo(() => {
        return {
            all: patients.length,
            opd: patients.filter(p => p.status === 'OPD').length,
            ipd: patients.filter(p => p.status === 'IPD').length,
            discharged: patients.filter(p => p.status === 'Discharged').length,
        };
    }, [patients]);

    // Dynamic Unique Options for Filters
    const uniqueDistricts = useMemo(() => {
        const set = new Set<string>();
        patients.forEach(p => {
            if (p.district) set.add(p.district);
        });
        return Array.from(set).sort();
    }, [patients]);

    const uniqueSpecialties = useMemo(() => {
        const set = new Set<string>();
        patients.forEach(p => {
            if (p.speciality) set.add(p.speciality);
        });
        return Array.from(set).sort();
    }, [patients]);

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (searchTerm.trim()) count++;
        if (statusFilter !== 'All') count++;
        if (colFilterPid.trim()) count++;
        if (colFilterGender !== 'All') count++;
        if (colFilterAgeGroup !== 'All') count++;
        if (colFilterDistrict !== 'All') count++;
        if (colFilterClass !== 'All') count++;
        if (colFilterSpeciality !== 'All') count++;
        if (colFilterStatus !== 'All') count++;
        return count;
    }, [searchTerm, statusFilter, colFilterPid, colFilterGender, colFilterAgeGroup, colFilterDistrict, colFilterClass, colFilterSpeciality, colFilterStatus]);

    const resetAllFilters = () => {
        setSearchTerm('');
        setSearchFilter('All');
        setColFilterPid('');
        setColFilterGender('All');
        setColFilterAgeGroup('All');
        setColFilterDistrict('All');
        setColFilterClass('All');
        setColFilterSpeciality('All');
        setColFilterStatus('All');
    };

    const handleExportPatientList = () => {
        const headers = ['Patient ID', 'Name', 'Age', 'Gender', 'Contact', 'Status', 'Diagnosis', 'Doctor', 'Registration Fee'];
        const rows = sortedPatients.map(p => [
            p.id,
            p.name,
            `${p.age}Y`,
            p.gender,
            p.contact,
            p.status,
            p.diagnosis || 'N/A',
            p.assignedDoctor || 'N/A',
            p.registrationFee || 0
        ]);
        const csvContent = [headers, ...rows].map(e => e.map(val => `"${val}"`).join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Patient_Master_Registry_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSort = (key: keyof Patient) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const filteredPatients = useMemo(() => {
        return patients.filter(p => {
            // 1. Global search
            if (searchTerm.trim()) {
                const q = searchTerm.trim().toLowerCase();
                const matchesSearch =
                    fuzzyMatch(p.name, q) ||
                    (p.id && p.id.toLowerCase().includes(q)) ||
                    (p.contact && p.contact.includes(q)) ||
                    (p.village && fuzzyMatch(p.village, q)) ||
                    (p.district && fuzzyMatch(p.district, q)) ||
                    (p.diagnosis && fuzzyMatch(p.diagnosis, q)) ||
                    (p.speciality && fuzzyMatch(p.speciality, q));
                if (!matchesSearch) return false;
            }

            // 2. Global Status dropdown
            if (statusFilter !== 'All' && p.status !== statusFilter) {
                return false;
            }

            // 3. Column: PID / Name
            if (colFilterPid.trim()) {
                const qPid = colFilterPid.trim().toLowerCase();
                const matchesPid =
                    (p.id && p.id.toLowerCase().includes(qPid)) ||
                    (p.name && p.name.toLowerCase().includes(qPid));
                if (!matchesPid) return false;
            }

            // 4. Column: Demographics (Gender)
            if (colFilterGender !== 'All' && p.gender !== colFilterGender) {
                return false;
            }

            // 5. Column: Demographics (Age Group)
            if (colFilterAgeGroup !== 'All') {
                const age = p.age || 0;
                if (colFilterAgeGroup === '<18' && age >= 18) return false;
                if (colFilterAgeGroup === '18-35' && (age < 18 || age > 35)) return false;
                if (colFilterAgeGroup === '36-50' && (age < 36 || age > 50)) return false;
                if (colFilterAgeGroup === '51+' && age < 51) return false;
            }

            // 6. Column: Contact & Location (District / Village)
            if (colFilterDistrict !== 'All') {
                const dist = (p.district || '').toLowerCase();
                const vill = (p.village || '').toLowerCase();
                const target = colFilterDistrict.toLowerCase();
                if (!dist.includes(target) && !vill.includes(target)) return false;
            }

            // 7. Column: Classification (Type or Account)
            if (colFilterClass !== 'All') {
                const pt = (p.patientType || '').toLowerCase();
                const pc = (p.paymentCategory || '').toLowerCase();
                const target = colFilterClass.toLowerCase();
                if (!pt.includes(target) && !pc.includes(target)) return false;
            }

            // 8. Column: File Location / Speciality
            if (colFilterSpeciality !== 'All') {
                const spec = (p.speciality || '').toLowerCase();
                const loc = (p.mrLocation || '').toLowerCase();
                const target = colFilterSpeciality.toLowerCase();
                if (!spec.includes(target) && !loc.includes(target)) return false;
            }

            // 9. Column: Clinical Case Status
            if (colFilterStatus !== 'All' && p.status !== colFilterStatus) {
                return false;
            }

            return true;
        });
    }, [patients, searchTerm, statusFilter, colFilterPid, colFilterGender, colFilterAgeGroup, colFilterDistrict, colFilterClass, colFilterSpeciality, colFilterStatus]);

    const sortedPatients = useMemo(() => {
        return [...filteredPatients].sort((a, b) => {
            // 1. If explicit column sort is requested by user
            if (sortConfig.key) {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                if (aValue === undefined || bValue === undefined) return 0;
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            }

            // 2. Default: New registrations always shown at the top
            if (a.createdAt && b.createdAt) {
                const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                if (diff !== 0) return diff;
            } else if (a.createdAt && !b.createdAt) {
                return -1; // Newly registered patient always on top
            } else if (!a.createdAt && b.createdAt) {
                return 1;
            }

            // Fallback: Preserve array insertion order (DataContext prepends newly registered patients)
            return 0;
        });
    }, [filteredPatients, sortConfig]);

    const confirmDelete = () => {
        if (patientToDelete) {
            removePatient(patientToDelete);
            setIsDeleteModalOpen(false);
            setPatientToDelete(null);
        }
    };

    const openPatientDetails = (patient: Patient) => {
        if (!canView) {
            alert("Access Denied: You do not have permission to view patient details.");
            return;
        }
        setSelectedPatient(patient);
        setDetailsTab('Overview');
        setAiAnalysis('');
    };

    const runAiAnalysis = async () => {
        if (!selectedPatient) return;
        setIsAnalyzing(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Provide a specialist clinical summary for patient ${selectedPatient.name}. Primary Diagnosis: ${selectedPatient.diagnosis}. Provide professional advice in bullet points. Use pure medical English.`;
            const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt });
            setAiAnalysis(response.text || "No clinical insights available.");
        } catch (error) { setAiAnalysis("AI clinical engine timeout."); }
        setIsAnalyzing(false);
    };

    const patientFinancials = selectedPatient ? finance.filter(f => f.description.includes(selectedPatient.id) || f.description.includes(selectedPatient.name)) : [];

    const hasValue = (val: any): boolean => {
        if (val === undefined || val === null) return false;
        if (typeof val === 'string') {
            const trimmed = val.trim();
            return trimmed !== '' &&
                trimmed !== '-' &&
                trimmed.toLowerCase() !== 'n/a' &&
                trimmed.toLowerCase() !== 'not recorded' &&
                trimmed.toLowerCase() !== 'not assigned' &&
                trimmed.toLowerCase() !== 'standard hospital record';
        }
        if (typeof val === 'number') return !isNaN(val);
        if (Array.isArray(val)) return val.length > 0;
        return true;
    };

    const renderPatientSlipContent = (patient: Patient) => {
        const addressParts = [
            patient.village,
            patient.upazilla,
            patient.district,
            patient.state,
            patient.country
        ].filter(hasValue).join(', ');

        const emergencyContactText = patient.emergencyName
            ? `${patient.emergencyName}${hasValue(patient.emergencyRelation) ? ` (${patient.emergencyRelation})` : ''}${hasValue(patient.emergencyPhone) ? ` - ${patient.emergencyPhone}` : ''}`
            : hasValue(patient.nextOfKin)
                ? patient.nextOfKin
                : '';

        const hasVisionData = Boolean(
            patient.previousVisionHistory && (
                (patient.previousVisionHistory.re &&
                    Object.values(patient.previousVisionHistory.re).some(v => hasValue(v))) ||
                (patient.previousVisionHistory.le &&
                    Object.values(patient.previousVisionHistory.le).some(v => hasValue(v))) ||
                hasValue(patient.previousVisionHistory.notes)
            )
        );

        const validVisits = patient.visitHistory?.filter(v =>
            hasValue(v.date) && (hasValue((v as any).doctor) || hasValue(v.doctorName) || hasValue(v.diagnosis) || hasValue(v.treatment))
        ) || [];

        const hasForeignDetails = Boolean(
            (patient.patientType === 'Foreign Patient' || hasValue(patient.passportNumber)) &&
            (hasValue(patient.passportNumber) || hasValue(patient.passportCountry) || hasValue(patient.visaType))
        );

        const hasAddressSection = hasValue(addressParts) || hasValue(emergencyContactText) || hasValue(patient.upazilla) || hasValue(patient.district) || hasValue(patient.postOffice) || hasValue(patient.postCode) || hasValue(patient.country);

        const hasAdminSection = hasValue(patient.mrLocation) || hasValue(patient.paymentCategory) || hasValue(patient.status) || hasValue(patient.assignedDoctor) || hasValue(patient.remarks) || hasValue(patient.allocation) || hasValue(patient.assignedRoom) || patient.registrationFee !== undefined;

        const hasClinicalSection = hasValue(patient.diagnosis) || hasValue(patient.speciality) || hasValue(patient.prescriptionNotes);

        return (
            <div className="bg-white text-slate-900 p-3 sm:p-5">
                {/* 1. Header */}
                <div className="border-b-2 border-slate-900 pb-2.5 mb-3">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-teal-800 text-white rounded-xl flex items-center justify-center shadow-md print:bg-teal-800 print:text-white shrink-0">
                                <Eye size={24} />
                            </div>
                            <div>
                                <h1 className="text-lg font-black uppercase tracking-tight text-slate-900 leading-none">
                                    {hospitalInfo.name}
                                </h1>
                                <p className="text-[11px] font-bold text-teal-800 tracking-wide mt-0.5 uppercase">
                                    {hospitalInfo.tagline}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                    {hospitalInfo.address} • Hotline: {hospitalInfo.hotline}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="inline-block bg-slate-900 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded tracking-wider">
                                PATIENT RECORD
                            </div>
                            <div className="text-[11px] font-bold text-slate-700 mt-1">
                                {new Date().toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                })}
                            </div>
                            <div className="text-[10px] font-mono text-slate-500">
                                Receipt: TXN-{patient.id ? (patient.id.replace(/\D/g, '').slice(-6) || '300846') : '300846'}{hasValue(patient.mrLocation) ? ` • File: ${patient.mrLocation}` : ''}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Routing, Token & Quick Status Box */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 border border-slate-300 rounded-lg p-2.5 mb-2.5 text-xs">
                    <div className="border-r border-slate-200 pr-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-teal-800">Token Number</p>
                        <p className="text-xl font-black text-teal-900 mt-0.5">
                            {patient.tokenNumber || `OPD-${patient.id ? (patient.id.replace(/\D/g, '').slice(-3) || '001') : '001'}`}
                        </p>
                    </div>
                    <div className="border-r border-slate-200 pr-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-teal-800">Assigned Room</p>
                        <p className="text-[14px] font-extrabold text-slate-900 mt-0.5">
                            {patient.assignedRoom || patient.allocation || '101'}
                        </p>
                        {hasValue(patient.allocation) && (
                            <p className="text-[10px] text-slate-600 truncate">{patient.allocation}</p>
                        )}
                    </div>
                    <div className="border-r border-slate-200 pr-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-teal-800">Department</p>
                        <p className="text-[13px] font-bold text-slate-900 mt-0.5">{patient.department || 'OPD'} Service</p>
                        {hasValue(patient.speciality) && (
                            <p className="text-[10px] text-slate-600 truncate">{patient.speciality}</p>
                        )}
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-teal-800">Fee Status</p>
                        <p className="text-[14px] font-extrabold text-emerald-700 mt-0.5">
                            {currency} {patient.registrationFee || 200}
                        </p>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase">Paid (Cash)</p>
                    </div>
                </div>

                {/* 3. Patient Demographics & Profile (Only Input Fields) */}
                <div className="border border-slate-300 rounded-lg p-2.5 mb-2 bg-white text-xs">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-1.5 mb-2">
                        <h3 className="font-bold text-slate-900 text-[11px] flex items-center gap-1.5 uppercase tracking-wide">
                            <User size={13} className="text-teal-700" /> Patient Demographics & Identification
                        </h3>
                        <span className="font-mono text-[11px] font-bold text-teal-900 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            UHID: {patient.id}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-2 gap-x-3 text-[11px]">
                        <div>
                            <span className="text-[9px] font-bold uppercase text-slate-400 block">Full Legal Name</span>
                            <span className="font-bold text-slate-900 text-[13px]">{patient.name}</span>
                        </div>
                        <div>
                            <span className="text-[9px] font-bold uppercase text-slate-400 block">Age & Gender</span>
                            <span className="font-semibold text-slate-800">
                                {patient.age} Yrs {patient.ageMonths ? `${patient.ageMonths} Mos ` : ''}{patient.ageDays ? `${patient.ageDays} Days ` : ''}/ {patient.gender}
                            </span>
                        </div>
                        {hasValue(patient.dob) && (
                            <div>
                                <span className="text-[9px] font-bold uppercase text-slate-400 block">Date of Birth</span>
                                <span className="font-medium text-slate-800">{patient.dob}</span>
                            </div>
                        )}
                        {hasValue(patient.bloodGroup) && (
                            <div>
                                <span className="text-[9px] font-bold uppercase text-slate-400 block">Blood Group</span>
                                <span className="font-semibold text-rose-700">{patient.bloodGroup}</span>
                            </div>
                        )}
                        {hasValue(patient.patientType) && (
                            <div>
                                <span className="text-[9px] font-bold uppercase text-slate-400 block">Patient Category</span>
                                <span className="font-semibold text-slate-800">{patient.patientType}</span>
                            </div>
                        )}
                        {hasValue(patient.maritalStatus) && (
                            <div>
                                <span className="text-[9px] font-bold uppercase text-slate-400 block">Marital Status</span>
                                <span className="font-medium text-slate-800">{patient.maritalStatus}</span>
                            </div>
                        )}
                        {hasValue(patient.contact) && (
                            <div>
                                <span className="text-[9px] font-bold uppercase text-slate-400 block">Primary Contact</span>
                                <span className="font-bold text-slate-900">{patient.contact}</span>
                            </div>
                        )}
                        {hasValue(patient.altContact) && (
                            <div>
                                <span className="text-[9px] font-bold uppercase text-slate-400 block">Alt Contact</span>
                                <span className="font-medium text-slate-700">{patient.altContact}</span>
                            </div>
                        )}
                        {hasValue(patient.email) && (
                            <div>
                                <span className="text-[9px] font-bold uppercase text-slate-400 block">Email Address</span>
                                <span className="font-medium text-slate-700 truncate block">{patient.email}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. Complete Address & Emergency Contact */}
                {hasAddressSection && (
                    <div className="border border-slate-300 rounded-lg p-2.5 mb-2 bg-white text-xs">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-1.5 mb-2">
                            <h3 className="font-bold text-slate-900 text-[11px] flex items-center gap-1.5 uppercase tracking-wide">
                                <MapPin size={13} className="text-teal-700" /> Address & Emergency Contact
                            </h3>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-2 gap-x-3 text-[11px]">
                            {hasValue(addressParts) && (
                                <div className="col-span-2">
                                    <span className="text-[9px] font-bold uppercase text-slate-400 block">Full Residential Address</span>
                                    <span className="font-medium text-slate-800">{addressParts}</span>
                                </div>
                            )}
                            {hasValue(patient.upazilla) && (
                                <div>
                                    <span className="text-[9px] font-bold uppercase text-slate-400 block">Sub-District / Upazilla</span>
                                    <span className="font-medium text-slate-800">{patient.upazilla}</span>
                                </div>
                            )}
                            {(hasValue(patient.district) || hasValue(patient.state)) && (
                                <div>
                                    <span className="text-[9px] font-bold uppercase text-slate-400 block">District / State</span>
                                    <span className="font-medium text-slate-800">
                                        {[patient.district, patient.state].filter(hasValue).join(', ')}
                                    </span>
                                </div>
                            )}
                            {hasValue(emergencyContactText) && (
                                <div className="col-span-2">
                                    <span className="text-[9px] font-bold uppercase text-slate-400 block">Emergency Contact / Next of Kin</span>
                                    <span className="font-semibold text-slate-800">{emergencyContactText}</span>
                                </div>
                            )}
                            {(hasValue(patient.postOffice) || hasValue(patient.postCode)) && (
                                <div>
                                    <span className="text-[9px] font-bold uppercase text-slate-400 block">Post Office / Postal Code</span>
                                    <span className="font-medium text-slate-800">
                                        {[patient.postOffice, patient.postCode ? `(${patient.postCode})` : ''].filter(hasValue).join(' ')}
                                    </span>
                                </div>
                            )}
                            {hasValue(patient.country) && (
                                <div>
                                    <span className="text-[9px] font-bold uppercase text-slate-400 block">Country</span>
                                    <span className="font-medium text-slate-800">{patient.country}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 5. Hospital Administrative & Archive Records */}
                {hasAdminSection && (
                    <div className="border border-slate-300 rounded-lg p-2.5 mb-2 bg-white text-xs">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-1.5 mb-2">
                            <h3 className="font-bold text-slate-900 text-[11px] flex items-center gap-1.5 uppercase tracking-wide">
                                <Archive size={13} className="text-teal-700" /> Hospital Administration & Records
                            </h3>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-2 gap-x-3 text-[11px]">
                            {hasValue(patient.mrLocation) && (
                                <div>
                                    <span className="text-[9px] font-bold uppercase text-slate-400 block">Physical File Location</span>
                                    <span className="font-bold text-slate-900">{patient.mrLocation}</span>
                                </div>
                            )}
                            {hasValue(patient.paymentCategory) && (
                                <div>
                                    <span className="text-[9px] font-bold uppercase text-slate-400 block">Financial Category</span>
                                    <span className="font-semibold text-slate-800">{patient.paymentCategory} Account</span>
                                </div>
                            )}
                            {hasValue(patient.status) && (
                                <div>
                                    <span className="text-[9px] font-bold uppercase text-slate-400 block">Clinical Status</span>
                                    <span className="font-bold text-teal-800">
                                        {patient.status === 'OPD' ? 'Active Out-Patient (OPD)' : patient.status === 'IPD' ? 'In-Patient Resident (IPD)' : patient.status}
                                    </span>
                                </div>
                            )}
                            {hasValue(patient.assignedDoctor) && (
                                <div>
                                    <span className="text-[9px] font-bold uppercase text-slate-400 block">Assigned Doctor</span>
                                    <span className="font-semibold text-slate-900">{patient.assignedDoctor}</span>
                                </div>
                            )}
                            {(hasValue(patient.allocation) || hasValue(patient.assignedRoom)) && (
                                <div>
                                    <span className="text-[9px] font-bold uppercase text-slate-400 block">Assigned Counter / Room</span>
                                    <span className="font-medium text-slate-800">{patient.allocation || patient.assignedRoom}</span>
                                </div>
                            )}
                            {patient.registrationFee !== undefined && (
                                <div>
                                    <span className="text-[9px] font-bold uppercase text-slate-400 block">Registration Fee</span>
                                    <span className="font-bold text-emerald-700">{currency} {patient.registrationFee}</span>
                                </div>
                            )}
                            {hasValue(patient.remarks) && (
                                <div className="col-span-2">
                                    <span className="text-[9px] font-bold uppercase text-slate-400 block">Internal Remarks</span>
                                    <span className="font-medium text-slate-700">{patient.remarks}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 6. Clinical Findings & Diagnoses */}
                {hasClinicalSection && (
                    <div className="border border-slate-300 rounded-lg p-2.5 mb-2 bg-white text-xs">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-1.5 mb-2">
                            <h3 className="font-bold text-slate-900 text-[11px] flex items-center gap-1.5 uppercase tracking-wide">
                                <Stethoscope size={13} className="text-teal-700" /> Clinical Case & Routing
                            </h3>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-3 text-[11px]">
                            {hasValue(patient.diagnosis) && (
                                <div className={hasValue(patient.speciality) ? 'col-span-2' : 'col-span-3'}>
                                    <span className="text-[9px] font-bold uppercase text-slate-400 block">Primary Clinical Diagnosis / Concern</span>
                                    <span className="font-bold text-slate-900 text-[12px]">{patient.diagnosis}</span>
                                </div>
                            )}
                            {hasValue(patient.speciality) && (
                                <div>
                                    <span className="text-[9px] font-bold uppercase text-slate-400 block">Medical Specialty</span>
                                    <span className="font-semibold text-slate-800">{patient.speciality}</span>
                                </div>
                            )}
                            {hasValue(patient.prescriptionNotes) && (
                                <div className="col-span-full bg-slate-50 p-2 rounded border border-slate-200 mt-1">
                                    <span className="text-[9px] font-bold uppercase text-slate-500 block">Consultation Advice / Protocol Notes</span>
                                    <p className="text-[11px] text-slate-700 italic">{patient.prescriptionNotes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 7. Ophthalmic Refraction & Vision History */}
                {hasVisionData && (
                    <div className="border border-slate-300 rounded-lg p-2.5 mb-2 bg-white text-xs">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-1.5 mb-2">
                            <h3 className="font-bold text-slate-900 text-[11px] flex items-center gap-1.5 uppercase tracking-wide">
                                <Eye size={13} className="text-teal-700" /> Ophthalmic Refractive Examination Record
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                            {/* Right Eye OD */}
                            {patient.previousVisionHistory?.re && (
                                <div className="border border-teal-200 bg-teal-50/30 rounded p-2">
                                    <span className="font-bold text-teal-900 text-[10px] block mb-1">RIGHT EYE (OD)</span>
                                    <div className="grid grid-cols-4 gap-1 text-center">
                                        <div className="bg-white p-1 rounded border border-slate-200">
                                            <span className="text-[8px] text-slate-400 block font-bold">SPH</span>
                                            <span className="font-bold text-slate-900 text-[10px]">{patient.previousVisionHistory.re.sph || '-'}</span>
                                        </div>
                                        <div className="bg-white p-1 rounded border border-slate-200">
                                            <span className="text-[8px] text-slate-400 block font-bold">CYL</span>
                                            <span className="font-bold text-slate-900 text-[10px]">{patient.previousVisionHistory.re.cyl || '-'}</span>
                                        </div>
                                        <div className="bg-white p-1 rounded border border-slate-200">
                                            <span className="text-[8px] text-slate-400 block font-bold">AXIS</span>
                                            <span className="font-bold text-slate-900 text-[10px]">{patient.previousVisionHistory.re.axis || '-'}</span>
                                        </div>
                                        <div className="bg-white p-1 rounded border border-slate-200">
                                            <span className="text-[8px] text-slate-400 block font-bold">VA</span>
                                            <span className="font-bold text-slate-900 text-[10px]">{patient.previousVisionHistory.re.va || '-'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Left Eye OS */}
                            {patient.previousVisionHistory?.le && (
                                <div className="border border-blue-200 bg-blue-50/30 rounded p-2">
                                    <span className="font-bold text-blue-900 text-[10px] block mb-1">LEFT EYE (OS)</span>
                                    <div className="grid grid-cols-4 gap-1 text-center">
                                        <div className="bg-white p-1 rounded border border-slate-200">
                                            <span className="text-[8px] text-slate-400 block font-bold">SPH</span>
                                            <span className="font-bold text-slate-900 text-[10px]">{patient.previousVisionHistory.le.sph || '-'}</span>
                                        </div>
                                        <div className="bg-white p-1 rounded border border-slate-200">
                                            <span className="text-[8px] text-slate-400 block font-bold">CYL</span>
                                            <span className="font-bold text-slate-900 text-[10px]">{patient.previousVisionHistory.le.cyl || '-'}</span>
                                        </div>
                                        <div className="bg-white p-1 rounded border border-slate-200">
                                            <span className="text-[8px] text-slate-400 block font-bold">AXIS</span>
                                            <span className="font-bold text-slate-900 text-[10px]">{patient.previousVisionHistory.le.axis || '-'}</span>
                                        </div>
                                        <div className="bg-white p-1 rounded border border-slate-200">
                                            <span className="text-[8px] text-slate-400 block font-bold">VA</span>
                                            <span className="font-bold text-slate-900 text-[10px]">{patient.previousVisionHistory.le.va || '-'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        {hasValue(patient.previousVisionHistory?.notes) && (
                            <p className="text-[10px] text-slate-500 italic mt-1.5">Note: {patient.previousVisionHistory.notes}</p>
                        )}
                    </div>
                )}

                {/* 8. Clinical Visit History Table */}
                {validVisits.length > 0 && (
                    <div className="border border-slate-300 rounded-lg p-2.5 mb-2 bg-white text-xs">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-1 mb-1.5">
                            <h3 className="font-bold text-slate-900 text-[11px] flex items-center gap-1.5 uppercase tracking-wide">
                                <Clock size={13} className="text-teal-700" /> Clinical Consultations & Visit History ({validVisits.length})
                            </h3>
                        </div>
                        <table className="w-full text-left text-[10px] border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                                    <th className="py-1 px-1.5">Date</th>
                                    <th className="py-1 px-1.5">Doctor</th>
                                    <th className="py-1 px-1.5">Diagnosis</th>
                                    <th className="py-1 px-1.5">Notes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {validVisits.map((v, i) => (
                                    <tr key={i}>
                                        <td className="py-1 px-1.5 font-mono text-slate-600">{v.date}</td>
                                        <td className="py-1 px-1.5 font-semibold text-slate-800">{v.doctorName || (v as any).doctor || '-'}</td>
                                        <td className="py-1 px-1.5 font-medium text-slate-800">{v.diagnosis || '-'}</td>
                                        <td className="py-1 px-1.5 text-slate-600">{v.treatment || v.notes || (v as any).department || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* 9. Foreign Patient Details */}
                {hasForeignDetails && (
                    <div className="border border-slate-300 rounded-lg p-2.5 mb-2 bg-teal-50/30 text-xs">
                        <div className="flex items-center gap-1.5 text-teal-800 font-bold text-[11px] mb-1.5 uppercase tracking-wide">
                            <Globe size={13} /> Foreign Patient Passport & Visa Details
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                            {hasValue(patient.passportNumber) && (
                                <div>
                                    <span className="text-[8px] font-bold uppercase text-slate-500 block">Passport Number</span>
                                    <span className="font-mono font-bold text-slate-900">{patient.passportNumber}</span>
                                </div>
                            )}
                            {(hasValue(patient.passportCountry) || hasValue(patient.country)) && (
                                <div>
                                    <span className="text-[8px] font-bold uppercase text-slate-500 block">Country</span>
                                    <span className="font-bold text-slate-800">{patient.passportCountry || patient.country}</span>
                                </div>
                            )}
                            {hasValue(patient.passportExpiryDate) && (
                                <div>
                                    <span className="text-[8px] font-bold uppercase text-slate-500 block">Passport Expiry</span>
                                    <span className="font-medium text-slate-700">{patient.passportExpiryDate}</span>
                                </div>
                            )}
                            {hasValue(patient.visaType) && (
                                <div>
                                    <span className="text-[8px] font-bold uppercase text-slate-500 block">Visa Type / Expiry</span>
                                    <span className="font-medium text-slate-700">
                                        {patient.visaType} {hasValue(patient.visaExpiryDate) ? `(${patient.visaExpiryDate})` : ''}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 10. Footer with Barcode, Patient Notice & Signatures */}
                <div className="border-t-2 border-slate-900 pt-2.5 mt-2">
                    <div className="flex justify-between items-center gap-3">
                        <div className="flex flex-col items-start">
                            <div className="flex items-center gap-[2px] h-7 px-1 py-0.5 bg-white">
                                {[2, 1, 3, 1, 2, 1, 1, 3, 2, 1, 2, 3, 1, 2, 3, 1, 1, 2, 3, 1, 2, 1, 3, 2, 1, 1, 3, 2, 1, 2, 3, 1, 2].map((w, i) => (
                                    <div key={i} className="bg-slate-900 h-full" style={{ width: `${w}px` }} />
                                ))}
                            </div>
                            <span className="font-mono text-[10px] font-bold text-slate-700 tracking-wider">
                                *{patient.id}*
                            </span>
                        </div>

                        <div className="text-[9px] text-slate-500 max-w-sm space-y-0.5">
                            <p className="font-bold text-slate-700">Notice for Patient & Medical Staff:</p>
                            <p>• This official patient dossier contains verified clinical and demographic hospital records.</p>
                            <p>• Keep this document preserved for follow-up ophthalmology visits and billing verification.</p>
                        </div>

                        <div className="flex gap-6 text-center text-[9px] text-slate-500">
                            <div>
                                <div className="w-20 border-b border-slate-400 mb-1 mt-4"></div>
                                <span>Receptionist</span>
                            </div>
                            <div>
                                <div className="w-24 border-b border-slate-400 mb-1 mt-4"></div>
                                <span>Attending Consultant</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-2 text-center border-t border-slate-200 pt-1 text-[9px] text-slate-400 font-medium">
                        {hospitalInfo.name} • Official Comprehensive Clinical Record & Patient Dossier • Valid Across All Departments
                    </div>
                </div>
            </div>
        );
    };

    const exportToPDF = async () => {
        if (!selectedPatient) return;
        const element = document.getElementById('patient-details-modal-content');
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#f8fafc'
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Patient_Report_${selectedPatient.id}.pdf`);
        } catch (error) {
            console.error('PDF Export Error:', error);
            alert('Failed to export PDF. Please try again.');
        }
    };

    const exportToExcel = () => {
        if (!selectedPatient) return;
        const headers = ['Field', 'Value'];
        const rows = [
            ['Patient ID', selectedPatient.id],
            ['Name', selectedPatient.name],
            ['Age', `${selectedPatient.age}Y ${selectedPatient.ageMonths || 0}M`],
            ['Gender', selectedPatient.gender],
            ['Contact', selectedPatient.contact],
            ['Email', selectedPatient.email || 'N/A'],
            ['DOB', selectedPatient.dob || 'N/A'],
            ['Address', `${selectedPatient.village}, ${selectedPatient.district}, ${selectedPatient.state}, ${selectedPatient.country}`],
            ['Diagnosis', selectedPatient.diagnosis],
            ['Status', selectedPatient.status],
            ['Doctor', selectedPatient.assignedDoctor || 'N/A'],
            ['Speciality', selectedPatient.speciality],
            ['MR Location', selectedPatient.mrLocation],
            ['Payment Category', selectedPatient.paymentCategory],
            ['Registration Fee', selectedPatient.registrationFee],
            ['Next of Kin', selectedPatient.nextOfKin || 'N/A'],
            ['Remarks', selectedPatient.remarks || 'N/A']
        ];

        const csvContent = [headers, ...rows].map(e => e.map(val => `"${val}"`).join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Patient_Data_${selectedPatient.id}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToXML = () => {
        if (!selectedPatient) return;
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<PatientReport>\n';
        xml += `  <GeneratedAt>${new Date().toISOString()}</GeneratedAt>\n`;
        xml += '  <PatientDetails>\n';

        const exportData = {
            ID: selectedPatient.id,
            Name: selectedPatient.name,
            Age: selectedPatient.age,
            Gender: selectedPatient.gender,
            Contact: selectedPatient.contact,
            Email: selectedPatient.email,
            Address: `${selectedPatient.village}, ${selectedPatient.district}, ${selectedPatient.state}, ${selectedPatient.country}`,
            Diagnosis: selectedPatient.diagnosis,
            Status: selectedPatient.status,
            Doctor: selectedPatient.assignedDoctor,
            Speciality: selectedPatient.speciality,
            MRLocation: selectedPatient.mrLocation,
            PaymentCategory: selectedPatient.paymentCategory,
            RegistrationFee: selectedPatient.registrationFee
        };

        Object.entries(exportData).forEach(([key, value]) => {
            xml += `    <${key}>${value || ''}</${key}>\n`;
        });

        xml += '  </PatientDetails>\n';
        xml += '</PatientReport>';

        const blob = new Blob([xml], { type: 'text/xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Patient_Data_${selectedPatient.id}.xml`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const InfoBlock = ({ label, value, icon: Icon, isFull = false }: { label: string, value?: string | number, icon?: any, isFull?: boolean }) => (
        <div className={`${isFull ? 'col-span-full' : ''} bg-white p-4 rounded-xl border border-slate-100 flex items-start gap-4 hover:border-teal-200 transition-colors shadow-sm`}>
            {Icon && <div className="mt-0.5 text-slate-400 group-hover:text-teal-600"><Icon size={16} /></div>}
            <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">{label}</p>
                <p className="text-sm font-medium text-slate-900 leading-tight truncate" title={String(value)}>{value || 'Not Recorded'}</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-2.5 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">Patient Master Registry</h1>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200 shadow-2xs">
                            {filteredPatients.length} Patients
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Detailed access to all demographic and clinical hospital records.</p>
                </div>
                <div className="flex gap-2 items-center">
                    <button
                        type="button"
                        onClick={() => setIsSettingsOpen(true)}
                        className="bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold hover:bg-slate-50 hover:text-teal-700 hover:border-teal-200 transition-colors shadow-2xs cursor-pointer"
                        title="System Settings (Hospital Info, Fees, PID Sequence, Rooms & Roles)"
                    >
                        <Settings size={15} className="text-slate-500" />
                        <span>Settings</span>
                    </button>
                    {canExport && (
                        <button
                            type="button"
                            onClick={handleExportPatientList}
                            className="bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                            title="Export Patient Master Registry to CSV"
                        >
                            <Download size={15} /> Export List
                        </button>
                    )}
                    {canAdd && (
                        <button
                            type="button"
                            onClick={() => navigate('/patients/register')}
                            className="bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
                        >
                            <Plus size={15} /> New Patient Entry
                        </button>
                    )}
                </div>
            </div>

            {/* Unified Table Container with Seamless Attractive Teal Top Controls */}
            <div className="bg-white rounded-2xl shadow-md border border-slate-200 relative z-20">
                {/* Top Teal Command Center: Search & Filter Options */}
                <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-cyan-800 text-white px-4 py-2 rounded-t-2xl border-b border-white/25 flex flex-wrap lg:flex-nowrap items-center justify-between gap-2.5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
                    <div className="relative z-10 w-full sm:w-80 md:w-96 flex-shrink-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-200 w-4 h-4 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search by PID, Name, Contact, Area, Doctor..."
                            className="w-full pl-9.5 pr-8 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 focus:bg-white text-white focus:text-slate-900 placeholder-teal-200 focus:placeholder-slate-400 text-[14px] font-semibold border border-white/20 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/50 shadow-inner transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-cyan-200 hover:text-white cursor-pointer"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <div className="relative z-10 flex flex-wrap gap-2 items-center justify-end w-full lg:w-auto">
                        {/* Quick Status Segmented Controls */}
                        <div className="inline-flex p-0.5 bg-black/25 backdrop-blur-md rounded-lg border border-white/15 text-[14px] font-bold">
                            <button
                                type="button"
                                onClick={() => { setSearchFilter('All'); setColFilterStatus('All'); }}
                                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${statusFilter === 'All' && colFilterStatus === 'All'
                                    ? 'bg-white text-teal-900 shadow-xs font-bold'
                                    : 'text-white/80 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                All ({statusCounts.all})
                            </button>
                            <button
                                type="button"
                                onClick={() => { setSearchFilter('OPD'); setColFilterStatus('OPD'); }}
                                className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${statusFilter === 'OPD' || colFilterStatus === 'OPD'
                                    ? 'bg-emerald-500 text-white shadow-xs font-bold'
                                    : 'text-white/80 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
                                OPD ({statusCounts.opd})
                            </button>
                            <button
                                type="button"
                                onClick={() => { setSearchFilter('IPD'); setColFilterStatus('IPD'); }}
                                className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${statusFilter === 'IPD' || colFilterStatus === 'IPD'
                                    ? 'bg-purple-500 text-white shadow-xs font-bold'
                                    : 'text-white/80 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                <span className="w-2 h-2 rounded-full bg-purple-300"></span>
                                IPD ({statusCounts.ipd})
                            </button>
                            <button
                                type="button"
                                onClick={() => { setSearchFilter('Discharged'); setColFilterStatus('Discharged'); }}
                                className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${statusFilter === 'Discharged' || colFilterStatus === 'Discharged'
                                    ? 'bg-slate-700 text-white shadow-xs font-bold'
                                    : 'text-white/80 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                Discharged ({statusCounts.discharged})
                            </button>
                        </div>

                        {activeFilterCount > 0 && (
                            <button
                                type="button"
                                onClick={resetAllFilters}
                                className="px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-[14px] font-bold shadow-sm"
                                title="Reset All Filters"
                            >
                                <RotateCcw size={13} />
                                <span>Reset ({activeFilterCount})</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Active Filter Chips Summary */}
                {activeFilterCount > 0 && (
                    <div className="bg-teal-50/80 border-b border-teal-100 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs animate-in fade-in">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-teal-900 flex items-center gap-1">
                                <Filter size={12} className="text-teal-600" />
                                Active Filters ({activeFilterCount}):
                            </span>
                            {colFilterPid && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white text-teal-800 border border-teal-200 rounded-full font-semibold shadow-2xs">
                                    PID/Name: "{colFilterPid}"
                                    <X size={12} className="cursor-pointer hover:text-rose-600 ml-0.5" onClick={() => setColFilterPid('')} />
                                </span>
                            )}
                            {colFilterGender !== 'All' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white text-teal-800 border border-teal-200 rounded-full font-semibold shadow-2xs">
                                    Gender: {colFilterGender}
                                    <X size={12} className="cursor-pointer hover:text-rose-600 ml-0.5" onClick={() => setColFilterGender('All')} />
                                </span>
                            )}
                            {colFilterAgeGroup !== 'All' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white text-teal-800 border border-teal-200 rounded-full font-semibold shadow-2xs">
                                    Age: {colFilterAgeGroup}
                                    <X size={12} className="cursor-pointer hover:text-rose-600 ml-0.5" onClick={() => setColFilterAgeGroup('All')} />
                                </span>
                            )}
                            {colFilterDistrict !== 'All' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white text-teal-800 border border-teal-200 rounded-full font-semibold shadow-2xs">
                                    District: {colFilterDistrict}
                                    <X size={12} className="cursor-pointer hover:text-rose-600 ml-0.5" onClick={() => setColFilterDistrict('All')} />
                                </span>
                            )}
                            {colFilterClass !== 'All' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white text-teal-800 border border-teal-200 rounded-full font-semibold shadow-2xs">
                                    Classification: {colFilterClass}
                                    <X size={12} className="cursor-pointer hover:text-rose-600 ml-0.5" onClick={() => setColFilterClass('All')} />
                                </span>
                            )}
                            {colFilterSpeciality !== 'All' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white text-teal-800 border border-teal-200 rounded-full font-semibold shadow-2xs">
                                    Specialty: {colFilterSpeciality}
                                    <X size={12} className="cursor-pointer hover:text-rose-600 ml-0.5" onClick={() => setColFilterSpeciality('All')} />
                                </span>
                            )}
                            {colFilterStatus !== 'All' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white text-teal-800 border border-teal-200 rounded-full font-semibold shadow-2xs">
                                    Status: {colFilterStatus}
                                    <X size={12} className="cursor-pointer hover:text-rose-600 ml-0.5" onClick={() => setColFilterStatus('All')} />
                                </span>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={resetAllFilters}
                            className="text-rose-600 hover:text-rose-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
                        >
                            <RotateCcw size={12} />
                            Reset All Filters
                        </button>
                    </div>
                )}
                <div className="overflow-x-auto min-h-[460px]">
                    <table className="w-full table-fixed text-sm text-left border-collapse">
                        <thead className="bg-gradient-to-r from-teal-700 via-teal-800 to-cyan-800 text-white font-bold text-xs lg:text-[13px] xl:text-[14px] border-b border-teal-900/30 shadow-xs">
                            <tr>
                                {/* 1. Patient Identity (PID) */}
                                <th className="w-[18%] px-2 lg:px-2.5 py-2 font-bold relative column-filter-container text-white">
                                    <div className="flex items-center gap-1 min-w-0">
                                        <span className="text-white font-bold truncate">Patient Identity (PID)</span>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveFilterPopover(activeFilterPopover === 'pid' ? null : 'pid');
                                            }}
                                            className={`p-1 rounded-md border transition-all cursor-pointer flex-shrink-0 ${colFilterPid.trim()
                                                ? 'bg-cyan-400 text-teal-950 border-cyan-300 shadow-sm ring-2 ring-cyan-300/40 font-black'
                                                : 'border-white/20 bg-white/10 text-teal-100 hover:text-white hover:bg-white/20 hover:border-white/40'
                                                }`}
                                            title="Filter Patient Identity"
                                        >
                                            <Filter size={11} />
                                        </button>
                                    </div>

                                    {/* PID Filter Popover */}
                                    {activeFilterPopover === 'pid' && (
                                        <div
                                            onClick={(e) => e.stopPropagation()}
                                            className="absolute top-full left-4 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 normal-case font-normal text-slate-800 animate-in fade-in zoom-in-95 duration-150"
                                        >
                                            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                                                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                                                    <User size={14} className="text-teal-600" />
                                                    Filter PID / Name
                                                </span>
                                                {colFilterPid && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setColFilterPid('')}
                                                        className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                                                    >
                                                        Clear
                                                    </button>
                                                )}
                                            </div>
                                            <div className="relative mb-3">
                                                <Search size={13} className="text-slate-400 absolute left-2.5 top-2.5" />
                                                <input
                                                    type="text"
                                                    value={colFilterPid}
                                                    onChange={(e) => setColFilterPid(e.target.value)}
                                                    placeholder="Type PID (e.g. PID-1) or Name..."
                                                    autoFocus
                                                    className="w-full pl-8 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                                                />
                                                {colFilterPid && (
                                                    <X
                                                        size={13}
                                                        className="text-slate-400 hover:text-slate-700 absolute right-2.5 top-2.5 cursor-pointer"
                                                        onClick={() => setColFilterPid('')}
                                                    />
                                                )}
                                            </div>
                                            <div className="flex items-center justify-end pt-2 border-t border-slate-100 text-xs">
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveFilterPopover(null)}
                                                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-3 py-1 rounded-lg cursor-pointer"
                                                >
                                                    Done
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </th>

                                {/* 2. Demographics */}
                                <th className="w-[12%] px-2 lg:px-2.5 py-2 font-bold relative column-filter-container text-white">
                                    <div className="flex items-center gap-1 min-w-0">
                                        <span className="text-white font-bold truncate">Demographics</span>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveFilterPopover(activeFilterPopover === 'demographics' ? null : 'demographics');
                                            }}
                                            className={`p-1 rounded-md border transition-all cursor-pointer flex-shrink-0 ${colFilterGender !== 'All' || colFilterAgeGroup !== 'All'
                                                ? 'bg-cyan-400 text-teal-950 border-cyan-300 shadow-sm ring-2 ring-cyan-300/40 font-black'
                                                : 'border-white/20 bg-white/10 text-teal-100 hover:text-white hover:bg-white/20 hover:border-white/40'
                                                }`}
                                            title="Filter Demographics"
                                        >
                                            <Filter size={11} />
                                        </button>
                                    </div>

                                    {/* Demographics Filter Popover */}
                                    {activeFilterPopover === 'demographics' && (
                                        <div
                                            onClick={(e) => e.stopPropagation()}
                                            className="absolute top-full left-4 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 normal-case font-normal text-slate-800 animate-in fade-in zoom-in-95 duration-150"
                                        >
                                            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                                                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Users size={14} className="text-teal-600" />
                                                    Filter Demographics
                                                </span>
                                                {(colFilterGender !== 'All' || colFilterAgeGroup !== 'All') && (
                                                    <button
                                                        type="button"
                                                        onClick={() => { setColFilterGender('All'); setColFilterAgeGroup('All'); }}
                                                        className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                                                    >
                                                        Clear
                                                    </button>
                                                )}
                                            </div>

                                            {/* Gender Selector */}
                                            <div className="mb-3">
                                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Gender</label>
                                                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
                                                    {(['All', 'Male', 'Female'] as const).map(g => (
                                                        <button
                                                            key={g}
                                                            type="button"
                                                            onClick={() => setColFilterGender(g)}
                                                            className={`py-1.5 rounded-lg text-center transition-all cursor-pointer ${colFilterGender === g
                                                                ? 'bg-white text-teal-800 shadow-xs font-bold'
                                                                : 'text-slate-600 hover:text-slate-900'
                                                                }`}
                                                        >
                                                            {g}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Age Bracket Selector */}
                                            <div className="mb-3">
                                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Age Group</label>
                                                <div className="grid grid-cols-3 gap-1.5">
                                                    {(['All', '<18', '18-35', '36-50', '51+'] as const).map(ag => (
                                                        <button
                                                            key={ag}
                                                            type="button"
                                                            onClick={() => setColFilterAgeGroup(ag)}
                                                            className={`px-2 py-1.5 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${colFilterAgeGroup === ag
                                                                ? 'bg-teal-50 border-teal-500 text-teal-800 font-bold'
                                                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                                                }`}
                                                        >
                                                            {ag === 'All' ? 'All Ages' : ag + ' Yrs'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-end pt-2 border-t border-slate-100 text-xs">
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveFilterPopover(null)}
                                                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-3 py-1 rounded-lg cursor-pointer"
                                                >
                                                    Done
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </th>

                                {/* 3. Contact & Location */}
                                <th className="w-[18%] px-2 lg:px-2.5 py-2 font-bold relative column-filter-container text-white">
                                    <div className="flex items-center gap-1 min-w-0">
                                        <span className="text-white font-bold truncate">Contact & Location</span>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveFilterPopover(activeFilterPopover === 'location' ? null : 'location');
                                            }}
                                            className={`p-1 rounded-md border transition-all cursor-pointer flex-shrink-0 ${colFilterDistrict !== 'All'
                                                ? 'bg-cyan-400 text-teal-950 border-cyan-300 shadow-sm ring-2 ring-cyan-300/40 font-black'
                                                : 'border-white/20 bg-white/10 text-teal-100 hover:text-white hover:bg-white/20 hover:border-white/40'
                                                }`}
                                            title="Filter Location / District"
                                        >
                                            <Filter size={11} />
                                        </button>
                                    </div>

                                    {/* Location Filter Popover */}
                                    {activeFilterPopover === 'location' && (
                                        <div
                                            onClick={(e) => e.stopPropagation()}
                                            className="absolute top-full left-4 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 normal-case font-normal text-slate-800 animate-in fade-in zoom-in-95 duration-150"
                                        >
                                            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                                                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                                                    <MapPin size={14} className="text-teal-600" />
                                                    Filter District / Area
                                                </span>
                                                {colFilterDistrict !== 'All' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setColFilterDistrict('All')}
                                                        className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                                                    >
                                                        Clear
                                                    </button>
                                                )}
                                            </div>

                                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setColFilterDistrict('All')}
                                                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${colFilterDistrict === 'All'
                                                        ? 'bg-teal-50 text-teal-800 font-bold border border-teal-200'
                                                        : 'text-slate-600 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    All Districts & Areas
                                                </button>
                                                {uniqueDistricts.map(dist => (
                                                    <button
                                                        key={dist}
                                                        type="button"
                                                        onClick={() => setColFilterDistrict(dist)}
                                                        className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${colFilterDistrict === dist
                                                            ? 'bg-teal-50 text-teal-800 font-bold border border-teal-200'
                                                            : 'text-slate-600 hover:bg-slate-50'
                                                            }`}
                                                    >
                                                        <span>{dist}</span>
                                                        <span className="text-[10px] text-slate-400 font-mono">
                                                            ({patients.filter(p => p.district === dist).length})
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="flex items-center justify-end pt-3 mt-2 border-t border-slate-100 text-xs">
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveFilterPopover(null)}
                                                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-3 py-1 rounded-lg cursor-pointer"
                                                >
                                                    Done
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </th>

                                {/* 4. Classification */}
                                <th className="w-[13%] px-2 lg:px-2.5 py-2 font-bold relative column-filter-container text-white">
                                    <div className="flex items-center gap-1 min-w-0">
                                        <span className="text-white font-bold truncate">Classification</span>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveFilterPopover(activeFilterPopover === 'classification' ? null : 'classification');
                                            }}
                                            className={`p-1 rounded-md border transition-all cursor-pointer flex-shrink-0 ${colFilterClass !== 'All'
                                                ? 'bg-cyan-400 text-teal-950 border-cyan-300 shadow-sm ring-2 ring-cyan-300/40 font-black'
                                                : 'border-white/20 bg-white/10 text-teal-100 hover:text-white hover:bg-white/20 hover:border-white/40'
                                                }`}
                                            title="Filter Classification"
                                        >
                                            <Filter size={11} />
                                        </button>
                                    </div>

                                    {/* Classification Filter Popover */}
                                    {activeFilterPopover === 'classification' && (
                                        <div
                                            onClick={(e) => e.stopPropagation()}
                                            className="absolute top-full left-4 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 normal-case font-normal text-slate-800 animate-in fade-in zoom-in-95 duration-150"
                                        >
                                            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                                                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Tag size={14} className="text-teal-600" />
                                                    Filter Classification
                                                </span>
                                                {colFilterClass !== 'All' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setColFilterClass('All')}
                                                        className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                                                    >
                                                        Clear
                                                    </button>
                                                )}
                                            </div>

                                            <div className="space-y-1.5">
                                                {[
                                                    { label: 'All Classifications', val: 'All' },
                                                    { label: 'New Patient Registration', val: 'New' },
                                                    { label: 'Old / Re-visit Patient', val: 'Old' },
                                                    { label: 'Pay Account', val: 'Pay' },
                                                    { label: 'Free / Subsidized Account', val: 'Free' }
                                                ].map(item => (
                                                    <button
                                                        key={item.val}
                                                        type="button"
                                                        onClick={() => setColFilterClass(item.val)}
                                                        className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${colFilterClass === item.val
                                                            ? 'bg-teal-50 text-teal-800 font-bold border border-teal-200'
                                                            : 'text-slate-600 hover:bg-slate-50'
                                                            }`}
                                                    >
                                                        {item.label}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="flex items-center justify-end pt-3 mt-2 border-t border-slate-100 text-xs">
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveFilterPopover(null)}
                                                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-3 py-1 rounded-lg cursor-pointer"
                                                >
                                                    Done
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </th>

                                {/* 5. File Location */}
                                <th className="w-[14%] px-2 lg:px-2.5 py-2 font-bold relative column-filter-container text-white">
                                    <div className="flex items-center gap-1 min-w-0">
                                        <span className="text-white font-bold truncate">File Location</span>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveFilterPopover(activeFilterPopover === 'file' ? null : 'file');
                                            }}
                                            className={`p-1 rounded-md border transition-all cursor-pointer flex-shrink-0 ${colFilterSpeciality !== 'All'
                                                ? 'bg-cyan-400 text-teal-950 border-cyan-300 shadow-sm ring-2 ring-cyan-300/40 font-black'
                                                : 'border-white/20 bg-white/10 text-teal-100 hover:text-white hover:bg-white/20 hover:border-white/40'
                                                }`}
                                            title="Filter File Location / Specialty"
                                        >
                                            <Filter size={11} />
                                        </button>
                                    </div>

                                    {/* File Location Filter Popover */}
                                    {activeFilterPopover === 'file' && (
                                        <div
                                            onClick={(e) => e.stopPropagation()}
                                            className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 normal-case font-normal text-slate-800 animate-in fade-in zoom-in-95 duration-150"
                                        >
                                            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                                                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Archive size={14} className="text-teal-600" />
                                                    Filter Specialty & Location
                                                </span>
                                                {colFilterSpeciality !== 'All' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setColFilterSpeciality('All')}
                                                        className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                                                    >
                                                        Clear
                                                    </button>
                                                )}
                                            </div>

                                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setColFilterSpeciality('All')}
                                                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${colFilterSpeciality === 'All'
                                                        ? 'bg-teal-50 text-teal-800 font-bold border border-teal-200'
                                                        : 'text-slate-600 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    All Specialties & Files
                                                </button>
                                                {uniqueSpecialties.map(spec => (
                                                    <button
                                                        key={spec}
                                                        type="button"
                                                        onClick={() => setColFilterSpeciality(spec)}
                                                        className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${colFilterSpeciality === spec
                                                            ? 'bg-teal-50 text-teal-800 font-bold border border-teal-200'
                                                            : 'text-slate-600 hover:bg-slate-50'
                                                            }`}
                                                    >
                                                        <span>{spec}</span>
                                                        <span className="text-[10px] text-slate-400 font-mono">
                                                            ({patients.filter(p => p.speciality === spec).length})
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="flex items-center justify-end pt-3 mt-2 border-t border-slate-100 text-xs">
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveFilterPopover(null)}
                                                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-3 py-1 rounded-lg cursor-pointer"
                                                >
                                                    Done
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </th>

                                {/* 6. Clinical Case */}
                                <th className="w-[14%] px-2 lg:px-2.5 py-2 font-bold relative column-filter-container text-white">
                                    <div className="flex items-center gap-1 min-w-0">
                                        <span className="text-white font-bold truncate">Clinical Case</span>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveFilterPopover(activeFilterPopover === 'clinical' ? null : 'clinical');
                                            }}
                                            className={`p-1 rounded-md border transition-all cursor-pointer flex-shrink-0 ${colFilterStatus !== 'All'
                                                ? 'bg-cyan-400 text-teal-950 border-cyan-300 shadow-sm ring-2 ring-cyan-300/40 font-black'
                                                : 'border-white/20 bg-white/10 text-teal-100 hover:text-white hover:bg-white/20 hover:border-white/40'
                                                }`}
                                            title="Filter Clinical Case Status"
                                        >
                                            <Filter size={11} />
                                        </button>
                                    </div>

                                    {/* Clinical Case Filter Popover */}
                                    {activeFilterPopover === 'clinical' && (
                                        <div
                                            onClick={(e) => e.stopPropagation()}
                                            className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 normal-case font-normal text-slate-800 animate-in fade-in zoom-in-95 duration-150"
                                        >
                                            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                                                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Activity size={14} className="text-teal-600" />
                                                    Filter Clinical Status
                                                </span>
                                                {colFilterStatus !== 'All' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setColFilterStatus('All')}
                                                        className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                                                    >
                                                        Clear
                                                    </button>
                                                )}
                                            </div>

                                            <div className="space-y-1.5">
                                                {[
                                                    { label: 'All Case Statuses', val: 'All', badge: 'bg-slate-100 text-slate-700', count: statusCounts.all },
                                                    { label: 'Out-Patient (OPD)', val: 'OPD', badge: 'bg-emerald-100 text-emerald-800', count: statusCounts.opd },
                                                    { label: 'In-Patient (IPD)', val: 'IPD', badge: 'bg-purple-100 text-purple-800', count: statusCounts.ipd },
                                                    { label: 'Discharged Record', val: 'Discharged', badge: 'bg-slate-100 text-slate-600', count: statusCounts.discharged },
                                                ].map(item => (
                                                    <button
                                                        key={item.val}
                                                        type="button"
                                                        onClick={() => setColFilterStatus(item.val)}
                                                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${colFilterStatus === item.val
                                                            ? 'bg-teal-50 text-teal-800 font-bold border border-teal-200'
                                                            : 'text-slate-600 hover:bg-slate-50'
                                                            }`}
                                                    >
                                                        <span>{item.label}</span>
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.badge}`}>
                                                            {item.count}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="flex items-center justify-end pt-3 mt-2 border-t border-slate-100 text-xs">
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveFilterPopover(null)}
                                                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-3 py-1 rounded-lg cursor-pointer"
                                                >
                                                    Done
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </th>

                                {/* 7. Actions */}
                                <th className="w-[11%] px-2 lg:px-2.5 py-2 text-right font-bold text-white">
                                    <span className="text-white font-bold whitespace-nowrap">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sortedPatients.map((patient) => (
                                <tr key={patient.id} onClick={() => openPatientDetails(patient)} className="hover:bg-teal-50/20 cursor-pointer group transition-all">
                                    <td className="px-2 lg:px-2.5 py-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-6.5 h-6.5 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-normal text-xs shadow-xs border border-teal-100 flex-shrink-0">
                                                {patient.name.charAt(0)}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <span className="font-normal text-slate-900 text-xs lg:text-sm leading-tight truncate block" title={patient.name}>{patient.name}</span>
                                                <div className="text-[10px] lg:text-[11px] font-mono font-normal text-slate-400 mt-0.5 uppercase truncate">ID: {patient.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-2 lg:px-2.5 py-2">
                                        <div className="text-xs lg:text-sm font-normal text-slate-700 truncate">{patient.age}Y / {patient.gender}</div>
                                        <div className="text-[10px] lg:text-[11px] text-slate-400 font-normal uppercase truncate">{patient.dob || 'DOB Not Set'}</div>
                                    </td>
                                    <td className="px-2 lg:px-2.5 py-2">
                                        <div className="text-xs lg:text-sm font-normal text-slate-700 truncate">{patient.contact}</div>
                                        <div className="text-[10px] lg:text-[11px] text-slate-400 font-normal uppercase truncate" title={`${patient.village || 'Area N/A'}, ${patient.district || 'District N/A'}`}>{patient.village || 'Area N/A'}, {patient.district || 'District N/A'}</div>
                                    </td>
                                    <td className="px-2 lg:px-2.5 py-2">
                                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] lg:text-[11px] bg-indigo-50 text-indigo-700 font-normal uppercase border border-indigo-100 truncate max-w-full">{patient.patientType}</span>
                                        <div className="text-[10px] lg:text-[11px] text-slate-400 font-normal mt-0.5 uppercase truncate">{patient.paymentCategory} ACCOUNT</div>
                                    </td>
                                    <td className="px-2 lg:px-2.5 py-2">
                                        <div className="flex items-center gap-1 min-w-0">
                                            <Archive size={12} className="text-slate-400 flex-shrink-0" />
                                            <span className="text-xs lg:text-sm font-normal text-slate-700 truncate" title={patient.mrLocation}>{patient.mrLocation}</span>
                                        </div>
                                        <div className="text-[10px] lg:text-[11px] text-slate-400 font-normal uppercase mt-0.5 truncate">{patient.speciality}</div>
                                    </td>
                                    <td className="px-2 lg:px-2.5 py-2">
                                        <div className="text-xs lg:text-sm font-normal text-slate-800 truncate" title={patient.diagnosis}>{patient.diagnosis}</div>
                                        <span className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] lg:text-[11px] font-normal mt-0.5 ${patient.status === 'IPD' ? 'bg-purple-100 text-purple-700' :
                                            patient.status === 'Discharged' ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-700'
                                            }`}>{patient.status}</span>
                                    </td>
                                    <td className="px-2 lg:px-2.5 py-2 text-right">
                                        <div className="flex items-center justify-end gap-1 flex-nowrap">
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); openPatientDetails(patient); }}
                                                className="p-1 text-teal-600 hover:text-white bg-teal-50 hover:bg-teal-600 border border-teal-200 rounded-md transition-all shadow-xs cursor-pointer flex-shrink-0"
                                                title="View Clinical Dossier"
                                            >
                                                <Eye size={13} />
                                            </button>
                                            {canEdit && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); navigate('/patients/register', { state: { patient } }); }}
                                                    className="p-1 text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 border border-indigo-200 rounded-md transition-all shadow-xs cursor-pointer flex-shrink-0"
                                                    title="Modify Patient Record"
                                                >
                                                    <Edit size={13} />
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); navigate('/e-prescription', { state: { patientId: patient.id } }); }}
                                                className="p-1 text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-200 rounded-md transition-all shadow-xs cursor-pointer flex-shrink-0"
                                                title="Create E-Prescription"
                                            >
                                                <FileText size={13} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); navigate('/billing', { state: { patient } }); }}
                                                className="p-1 text-emerald-700 hover:text-white bg-emerald-50 hover:bg-emerald-600 border border-emerald-200 rounded-md transition-all shadow-xs cursor-pointer flex-shrink-0"
                                                title="Patient Billing & Invoicing"
                                            >
                                                <CreditCard size={13} />
                                            </button>
                                            {canDelete && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); setPatientToDelete(patient.id); setIsDeleteModalOpen(true); }}
                                                    className="p-1 text-rose-500 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 rounded-md transition-all shadow-xs cursor-pointer flex-shrink-0"
                                                    title="Delete Patient Record"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedPatient && (
                <>
                    {/* Patient Comprehensive Master Record & Information Slip */}
                    <div
                        id="printable-slip"
                        className="hidden print:block bg-white text-slate-900 print:shadow-none print:border-none print:p-0 print:m-0"
                    >
                        {renderPatientSlipContent(selectedPatient)}
                    </div>

                    {/* On-Screen Patient Dossier Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in zoom-in-95 overflow-y-auto print:hidden">
                        <div className="bg-slate-50 rounded-[2.5rem] shadow-2xl w-full max-w-6xl flex flex-col min-h-[85vh] max-h-[90vh] overflow-hidden">
                            {/* Patient Dossier Header */}
                            <div className="bg-white px-8 py-6 border-b border-slate-200 flex justify-between items-center shrink-0">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-bold text-3xl shadow-lg">{selectedPatient.name.charAt(0)}</div>
                                    <div>
                                        <div className="flex items-center gap-4">
                                            <h2 className="text-2xl font-bold text-slate-900">{selectedPatient.name}</h2>
                                            <span className={`px-4 py-1 rounded-lg text-xs font-bold border uppercase tracking-wider ${selectedPatient.status === 'IPD' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                                selectedPatient.status === 'Discharged' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                                    'bg-emerald-100 text-emerald-700 border-emerald-200'
                                                }`}>
                                                {selectedPatient.status === 'OPD' ? 'Active Out-Patient' : selectedPatient.status === 'IPD' ? 'In-Patient Resident' : 'Case Finalized'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-slate-500 mt-1 font-medium">
                                            <span className="flex items-center gap-1.5"><Tag size={14} className="text-teal-600" /> Patient ID: {selectedPatient.id}</span>
                                            <span className="flex items-center gap-1.5"><UserCheck size={14} className="text-teal-600" /> {selectedPatient.age} Years {selectedPatient.ageMonths || 0} Months {selectedPatient.ageDays ? `${selectedPatient.ageDays} Days ` : ''}/ {selectedPatient.gender}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {canExport && (
                                        <div className="relative">
                                            <button
                                                onClick={() => setShowExportMenu(!showExportMenu)}
                                                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-all"
                                            >
                                                <Download size={16} className="text-teal-600" /> Export Data <ChevronDown size={14} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                                            </button>
                                            {showExportMenu && (
                                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-[60] animate-in fade-in slide-in-from-top-2">
                                                    <button onClick={() => { exportToPDF(); setShowExportMenu(false); }} className="w-full px-4 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors">
                                                        <FileType size={16} className="text-rose-500" /> Export as PDF
                                                    </button>
                                                    <button onClick={() => { exportToExcel(); setShowExportMenu(false); }} className="w-full px-4 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors">
                                                        <FileSpreadsheet size={16} className="text-emerald-500" /> Export as Excel (CSV)
                                                    </button>
                                                    <button onClick={() => { exportToXML(); setShowExportMenu(false); }} className="w-full px-4 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors">
                                                        <FileCode size={16} className="text-amber-500" /> Export as XML
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {canPrint && (
                                        <button
                                            onClick={() => setIsPrintModalOpen(true)}
                                            className="px-3.5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:text-teal-600 hover:border-teal-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                                            title="Print Patient Record (Format & Settings)"
                                        >
                                            <Printer size={16} className="text-teal-600" />
                                            <span>Print</span>
                                        </button>
                                    )}
                                    <div className="w-px h-10 bg-slate-200 mx-2"></div>
                                    <button onClick={() => navigate('/e-prescription', { state: { patientId: selectedPatient.id } })} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-md"><FileText size={16} /> Clinical Records</button>
                                    <button onClick={() => navigate('/billing', { state: { patient: selectedPatient } })} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-all"><span className="font-bold">{currency === 'BDT' ? '৳' : '$'}</span> Billing Account</button>
                                    <div className="w-px h-10 bg-slate-200 mx-2"></div>
                                    <button onClick={() => setSelectedPatient(null)} className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 rounded-xl transition-all"><X size={24} /></button>
                                </div>
                            </div>

                            <div className="bg-white px-8 border-b border-slate-200 flex gap-10 shrink-0">
                                {['Overview', 'Clinical', 'Vision', 'Financials'].map(tab => (
                                    <button key={tab} onClick={() => setDetailsTab(tab as any)} className={`py-5 text-sm font-bold border-b-2 transition-all ${detailsTab === tab ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>{tab} Dossier</button>
                                ))}
                            </div>

                            <div id="patient-details-modal-content" className="flex-1 overflow-y-auto p-8 bg-slate-50/50 custom-scrollbar print:bg-white print:p-0">
                                {detailsTab === 'Overview' && (
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        <div className="lg:col-span-2 space-y-8">
                                            {/* Core Demographics */}
                                            <section>
                                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 border-b border-slate-100 pb-2"><User size={16} className="text-teal-600" /> Patient Demographics</h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    <InfoBlock label="Full Name" value={selectedPatient.name} icon={User} />
                                                    <InfoBlock label="Age" value={`${selectedPatient.age} Years ${selectedPatient.ageMonths || 0} Months${selectedPatient.ageDays ? ` ${selectedPatient.ageDays} Days` : ''}`} icon={Calendar} />
                                                    <InfoBlock label="Gender" value={selectedPatient.gender} icon={Users} />
                                                    <InfoBlock label="Marital Status" value={selectedPatient.maritalStatus || 'Not Recorded'} icon={UserCheck} />
                                                    <InfoBlock label="Blood Group" value={selectedPatient.bloodGroup || 'Not Recorded'} icon={Activity} />
                                                    <InfoBlock label="Contact Number" value={selectedPatient.contact} icon={Phone} />
                                                    <InfoBlock label="Full Address" value={`${selectedPatient.village}, ${selectedPatient.district}, ${selectedPatient.state}, ${selectedPatient.country}`} icon={MapPin} isFull={true} />
                                                </div>
                                            </section>

                                            {/* Personal & Contact Details */}
                                            <section>
                                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 border-b border-slate-100 pb-2"><UserCheck size={16} className="text-teal-600" /> Personal & Contact Profile</h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    <InfoBlock label="Full Legal Name" value={selectedPatient.name} icon={User} />
                                                    <InfoBlock label="Internal Patient ID" value={selectedPatient.id} icon={Tag} />
                                                    <InfoBlock label="Date of Birth" value={selectedPatient.dob} icon={Calendar} />
                                                    <InfoBlock label="Primary Phone Number" value={selectedPatient.contact} icon={Phone} />
                                                    <InfoBlock label="Secondary Phone Number" value={selectedPatient.altContact} icon={Phone} />
                                                    <InfoBlock label="Electronic Mailing Email" value={selectedPatient.email} icon={Mail} />
                                                    <InfoBlock label="Emergency Contact Person" value={selectedPatient.nextOfKin} icon={Users} />
                                                    <InfoBlock label="Patient Nationality" value={selectedPatient.country} icon={MapPin} />
                                                </div>
                                            </section>

                                            {/* Geographic Address Data */}
                                            <section>
                                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 border-b border-slate-100 pb-2"><MapIcon size={16} className="text-indigo-600" /> Geographic Address Mapping</h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    <InfoBlock label="Village / Street / Area" value={selectedPatient.village} icon={Home} />
                                                    <InfoBlock label="Mailing Office" value={selectedPatient.postOffice} icon={Mail} />
                                                    <InfoBlock label="Postal / ZIP Code" value={selectedPatient.postCode} icon={Tag} />
                                                    <InfoBlock label="Sub-District (Upazilla)" value={selectedPatient.upazilla} icon={MapPin} />
                                                    <InfoBlock label="Primary Home District" value={selectedPatient.district} icon={MapPin} />
                                                    <InfoBlock label="State / Province" value={selectedPatient.state} icon={MapPin} />
                                                </div>
                                            </section>

                                            {/* Hospital Administrative Section */}
                                            <section>
                                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 border-b border-slate-100 pb-2"><Briefcase size={16} className="text-amber-600" /> Hospital Administrative Records</h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    <InfoBlock label="Physical File Location" value={selectedPatient.mrLocation} icon={Archive} />
                                                    <InfoBlock label="Patient Classification" value={selectedPatient.patientType} icon={UserPlus} />
                                                    <InfoBlock label="Assigned Booth / Counter" value={selectedPatient.allocation} icon={Building2} />
                                                    <InfoBlock label="Consultant In-Charge" value={selectedPatient.assignedDoctor} icon={Stethoscope} />
                                                    <InfoBlock label="Medical Specialty Track" value={selectedPatient.speciality} icon={Activity} />
                                                    <InfoBlock label="Financial Category" value={selectedPatient.paymentCategory} icon={CardIcon} />
                                                    <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center gap-4 group hover:border-teal-200 transition-all">
                                                        <div className="p-2.5 bg-slate-50 text-slate-400 rounded-lg group-hover:bg-teal-50 group-hover:text-teal-600 transition-all font-bold">
                                                            {currency === 'BDT' ? '৳' : '$'}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Registration Fee Paid</p>
                                                            <p className="text-sm font-bold text-slate-700">{formatCurrency(selectedPatient.registrationFee)}</p>
                                                        </div>
                                                    </div>
                                                    <InfoBlock label="Internal Admin Remarks" value={selectedPatient.remarks} icon={Info} isFull={true} />
                                                </div>
                                            </section>
                                        </div>

                                        {/* Sidebar: AI Summary & Visit Timeline */}
                                        <div className="space-y-6">
                                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm group">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Sparkles className="text-teal-600" size={18} /> Specialist Clinical Summary</h3>
                                                    <button onClick={runAiAnalysis} disabled={isAnalyzing} className="text-xs font-bold text-teal-600 hover:text-teal-800 uppercase transition-all disabled:opacity-30">
                                                        {isAnalyzing ? 'Analyzing...' : 'Generate Summary'}
                                                    </button>
                                                </div>
                                                {aiAnalysis ? (
                                                    <div className="prose prose-sm text-xs text-slate-700 leading-relaxed font-medium"><div dangerouslySetInnerHTML={{ __html: aiAnalysis.replace(/\n/g, '<br/>') }} /></div>
                                                ) : (
                                                    <p className="text-xs text-slate-400 italic font-medium leading-relaxed">Initiate the AI clinical assessment protocol to generate a professional summary of the patient's medical history.</p>
                                                )}
                                            </div>

                                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                                <div className="flex items-center justify-between mb-6 border-b border-slate-50 pb-2">
                                                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Clock size={16} className="text-blue-600" /> Clinical Visit History</h3>
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{selectedPatient.visitHistory?.length || 0} Visits</span>
                                                </div>
                                                <div className="space-y-4">
                                                    {selectedPatient.visitHistory?.map((visit, i) => (
                                                        <div key={i} className="border border-slate-100 rounded-xl overflow-hidden transition-all hover:border-teal-100">
                                                            <button
                                                                onClick={() => setExpandedVisitIdx(expandedVisitIdx === i ? null : i)}
                                                                className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors text-left"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xs">
                                                                        {i + 1}
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-xs font-bold text-slate-400 uppercase">{visit.date}</div>
                                                                        <div className="text-xs font-bold text-slate-800 truncate max-w-[150px]">{visit.diagnosis}</div>
                                                                    </div>
                                                                </div>
                                                                <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${expandedVisitIdx === i ? 'rotate-180' : ''}`} />
                                                            </button>

                                                            {expandedVisitIdx === i && (
                                                                <div className="px-4 pb-4 pt-0 bg-slate-50/50 animate-in slide-in-from-top-2 duration-200">
                                                                    <div className="h-px bg-slate-100 mb-4 mx-2"></div>
                                                                    <div className="grid grid-cols-1 gap-4">
                                                                        <div className="space-y-1">
                                                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Consulting Doctor</p>
                                                                            <p className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                                                                                <Stethoscope size={12} className="text-teal-600" />
                                                                                {visit.doctorName}
                                                                            </p>
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Clinical Diagnosis</p>
                                                                            <p className="text-xs font-medium text-slate-600 leading-relaxed">{visit.diagnosis}</p>
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Treatment Protocol</p>
                                                                            <div className="p-3 bg-white rounded-lg border border-slate-100 text-xs font-medium text-slate-700 leading-relaxed shadow-sm">
                                                                                {visit.treatment || 'No specific treatment protocol recorded for this visit.'}
                                                                            </div>
                                                                        </div>
                                                                        {visit.notes && (
                                                                            <div className="space-y-1">
                                                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Additional Clinical Notes</p>
                                                                                <p className="text-xs text-slate-500 italic leading-relaxed">{visit.notes}</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {(!selectedPatient.visitHistory || selectedPatient.visitHistory.length === 0) && (
                                                        <div className="text-xs text-slate-400 font-medium italic py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                                            No historical visits logged in system.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {detailsTab === 'Financials' && (
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in duration-300">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="font-bold text-slate-800 flex items-center gap-2 uppercase tracking-widest text-xs"><BdtIcon size={16} className="text-green-600" /> Patient Billing Records</h3>
                                            <button onClick={() => navigate('/billing', { state: { patient: selectedPatient } })} className="text-xs text-teal-600 hover:underline font-bold uppercase transition-all">Open Full Financial Ledger</button>
                                        </div>
                                        <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs"><tr><th className="px-6 py-4">Transaction Date</th><th className="px-6 py-4">Service Description</th><th className="px-6 py-4 text-right">Settled Amount</th></tr></thead><tbody className="divide-y divide-slate-100">{patientFinancials.map(txn => (<tr key={txn.id} className="hover:bg-slate-50 transition-colors"><td className="px-6 py-4 text-slate-500 font-mono text-xs">{txn.date}</td><td className="px-6 py-4 font-bold text-slate-700">{txn.description}</td><td className="px-6 py-4 text-right font-bold text-slate-900">{formatCurrency(txn.amount)}</td></tr>))}</tbody></table></div>
                                    </div>
                                )}

                                {detailsTab === 'Clinical' && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex justify-between items-start">
                                            <div className="flex items-center gap-6">
                                                <div className="p-4 bg-teal-50 text-teal-600 rounded-2xl shadow-inner"><Stethoscope size={32} /></div>
                                                <div>
                                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Primary Clinical Impression</h3>
                                                    <p className="text-2xl font-bold text-slate-900">{selectedPatient.diagnosis}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => navigate('/e-prescription', { state: { patientId: selectedPatient.id } })} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 uppercase tracking-widest"><FileText size={16} /> Electronic Rx Module</button>
                                        </div>
                                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-50 pb-2">Active Clinical Advice</h3>
                                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 italic font-medium text-slate-600 leading-relaxed min-h-[150px]">
                                                {selectedPatient.prescriptionNotes || 'No active clinical advice or consultation notes have been recorded in this file.'}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {detailsTab === 'Vision' && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Eye size={120} className="text-teal-600" /></div>
                                                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-8 border-b border-slate-50 pb-2">
                                                    <div className="w-8 h-8 bg-teal-600 text-white rounded-lg flex items-center justify-center font-bold text-xs">OD</div>
                                                    RIGHT EYE REFRACTION (OD)
                                                </h3>
                                                <div className="grid grid-cols-2 gap-6 relative z-10">
                                                    <InfoBlock label="SPHERE (SPH)" value={selectedPatient.previousVisionHistory?.re.sph} />
                                                    <InfoBlock label="CYLINDER (CYL)" value={selectedPatient.previousVisionHistory?.re.cyl} />
                                                    <InfoBlock label="AXIS" value={selectedPatient.previousVisionHistory?.re.axis} />
                                                    <InfoBlock label="VISUAL ACUITY (VA)" value={selectedPatient.previousVisionHistory?.re.va} />
                                                </div>
                                            </div>
                                            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Eye size={120} className="text-blue-600" /></div>
                                                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-8 border-b border-slate-50 pb-2">
                                                    <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-xs">OS</div>
                                                    LEFT EYE REFRACTION (OS)
                                                </h3>
                                                <div className="grid grid-cols-2 gap-6 relative z-10">
                                                    <InfoBlock label="SPHERE (SPH)" value={selectedPatient.previousVisionHistory?.le.sph} />
                                                    <InfoBlock label="CYLINDER (CYL)" value={selectedPatient.previousVisionHistory?.le.cyl} />
                                                    <InfoBlock label="AXIS" value={selectedPatient.previousVisionHistory?.le.axis} />
                                                    <InfoBlock label="VISUAL ACUITY (VA)" value={selectedPatient.previousVisionHistory?.le.va} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                                            <h3 className="font-bold text-slate-400 text-xs uppercase tracking-[0.2em] mb-4 border-b border-slate-50 pb-2">Vision History Notes</h3>
                                            <p className="text-sm font-medium text-slate-700 leading-relaxed italic">{selectedPatient.previousVisionHistory?.notes || 'No historical vision data or refractive notes available.'}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Print Settings Modal */}
                    <PrintSettingsModal
                        isOpen={isPrintModalOpen}
                        onClose={() => setIsPrintModalOpen(false)}
                        previewContent={selectedPatient ? renderPatientSlipContent(selectedPatient) : null}
                        defaultPaperSize="A4"
                        documentTitle={selectedPatient ? `Patient Record - ${selectedPatient.name} (${selectedPatient.id})` : 'Patient Record'}
                    />
                </>
            )}

            {/* Delete Confirmation Modal */}
            {
                isDeleteModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-10 text-center">
                            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle size={32} /></div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Permanent Deletion</h3>
                            <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">This action will completely and irreversibly wipe the patient's clinical and demographic record from the database.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-3.5 text-slate-600 bg-slate-100 rounded-xl font-bold hover:bg-slate-200 transition-all">Cancel</button>
                                <button onClick={confirmDelete} className="flex-1 py-3.5 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 shadow-xl shadow-rose-200 transition-all">Confirm Wipe</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Global & Hospital Settings Modal */}
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />
        </div >
    );
};

export default Patients;
