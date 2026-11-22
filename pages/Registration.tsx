
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Save, User, Phone, MapPin, Calendar, FileText, CreditCard,
    Activity, Upload, Printer, CheckCircle, Eye, Info, UserCheck,
    ShieldCheck, DollarSign, Stethoscope, Briefcase, Map as MapIcon,
    FlaskConical, Microscope, Users, Home, Archive, Mail, Tag,
    ChevronRight, ArrowLeft, UserPlus, Plus, Trash2, Edit3, Check, X, Settings, Tent, ChevronDown, Globe, Search, Hash,
    ShieldAlert, SlidersHorizontal, Building2, Lock, CheckCircle2, RefreshCw, AlertTriangle
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Patient, PreviousVisionHistory, RoomMaster, UserRole } from '../types';
import { useNavigate, useLocation } from 'react-router-dom';
import { MOCK_EMPLOYEES } from '../constants';
import { SearchableSelect } from '../components/SearchableSelect';
import { CustomDatePicker } from '../components/CustomDatePicker';
import { BANGLADESH_DIVISIONS, BANGLADESH_DISTRICTS, BANGLADESH_UPAZILLAS } from '../data/bangladeshGeo';

const getNextSequencePid = (patientList: Patient[]): string => {
    let max = 0;
    try {
        const stored = localStorage.getItem('vce_pid_seq6');
        if (stored) {
            const parsed = parseInt(stored, 10);
            if (!isNaN(parsed) && parsed > max) {
                max = parsed;
            }
        }
    } catch { }

    if (patientList && Array.isArray(patientList)) {
        patientList.forEach(p => {
            if (p.id) {
                const match = p.id.match(/^PID-0*(\d+)$/i);
                if (match) {
                    const n = parseInt(match[1], 10);
                    // Filter out legacy random numbers (e.g. 851541 or 999244)
                    if (!isNaN(n) && n > max && n < 100000) {
                        max = n;
                    }
                }
            }
        });
    }

    const nextNum = max + 1;
    return `PID-${String(nextNum).padStart(6, '0')}`;
};

const Registration = () => {
    const { patients, addPatient, updatePatient, getRecommendedOPDRoom, rooms, addRoom, deleteRoom, updateRoom, addTransaction, currency, hasPermission, campaigns } = useData();
    const { activeBranchId, role } = useAuth();
    const isAuthorizedToEdit = role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN || hasPermission('Patient Registration', 'edit') || hasPermission('System Settings', 'edit');

    // Registration Settings States
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showAccessDeniedModal, setShowAccessDeniedModal] = useState(false);
    const [settingsTab, setSettingsTab] = useState<'general' | 'rooms' | 'slip'>('general');
    const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);

    const [defaultRegFee, setDefaultRegFee] = useState<string>(() => {
        return localStorage.getItem('vce_default_reg_fee') || '100';
    });

    const [hospitalInfo, setHospitalInfo] = useState({
        name: localStorage.getItem('vce_hospital_name') || 'Visionary Care HMS',
        tagline: localStorage.getItem('vce_hospital_tagline') || 'Specialist Ophthalmology & Microsurgery Center',
        address: localStorage.getItem('vce_hospital_address') || 'Main Campus - Dhaka',
        hotline: localStorage.getItem('vce_hospital_hotline') || '+880 1800-000000',
        notice: localStorage.getItem('vce_hospital_notice') || '• Please wait in the waiting lounge near your assigned room.\n• Keep this slip handy during preliminary vision testing & consultation.'
    });

    useEffect(() => {
        const syncHospitalInfo = () => {
            setHospitalInfo({
                name: localStorage.getItem('vce_hospital_name') || 'Visionary Care HMS',
                tagline: localStorage.getItem('vce_hospital_tagline') || 'Specialist Ophthalmology & Microsurgery Center',
                address: localStorage.getItem('vce_hospital_address') || 'Main Campus - Dhaka',
                hotline: localStorage.getItem('vce_hospital_hotline') || '+880 1800-000000',
                notice: localStorage.getItem('vce_hospital_notice') || '• Please wait in the waiting lounge near your assigned room.\n• Keep this slip handy during preliminary vision testing & consultation.'
            });
        };
        window.addEventListener('vce_hospital_info_updated', syncHospitalInfo);
        window.addEventListener('storage', syncHospitalInfo);
        return () => {
            window.removeEventListener('vce_hospital_info_updated', syncHospitalInfo);
            window.removeEventListener('storage', syncHospitalInfo);
        };
    }, []);

    const [modalFee, setModalFee] = useState(defaultRegFee);
    const [modalNextPid, setModalNextPid] = useState<string>('');
    const [modalHospital, setModalHospital] = useState({ ...hospitalInfo });
    const [settingsRoomDept, setSettingsRoomDept] = useState<'OPD' | 'Camp' | 'Lab' | 'Diagnosis'>('OPD');
    const [settingsNewRoomNum, setSettingsNewRoomNum] = useState('');
    const [settingsNewRoomName, setSettingsNewRoomName] = useState('');

    const handleOpenSettings = () => {
        if (isAuthorizedToEdit) {
            let max = 0;
            try {
                const stored = localStorage.getItem('vce_pid_seq6');
                if (stored) {
                    const parsed = parseInt(stored, 10);
                    if (!isNaN(parsed) && parsed > max) max = parsed;
                }
            } catch { }
            if (patients && Array.isArray(patients)) {
                patients.forEach(p => {
                    if (p.id) {
                        const match = p.id.match(/^PID-0*(\d+)$/i);
                        if (match) {
                            const n = parseInt(match[1], 10);
                            if (!isNaN(n) && n > max && n < 100000) max = n;
                        }
                    }
                });
            }
            const nextPidNum = max + 1;
            setModalNextPid(String(nextPidNum));
            setModalFee(defaultRegFee);
            setModalHospital({ ...hospitalInfo });
            setSettingsSuccess(null);
            setShowSettingsModal(true);
        } else {
            setShowAccessDeniedModal(true);
        }
    };

    const handleSaveGeneralSettings = (e: React.FormEvent) => {
        e.preventDefault();
        const cleanFee = modalFee.trim() || '100';
        localStorage.setItem('vce_default_reg_fee', cleanFee);
        setDefaultRegFee(cleanFee);
        setFormData(prev => ({ ...prev, registrationFee: cleanFee }));

        const parsedPid = parseInt(modalNextPid, 10);
        if (!isNaN(parsedPid) && parsedPid > 0) {
            localStorage.setItem('vce_pid_seq6', String(parsedPid - 1));
            const newPid = `PID-${String(parsedPid).padStart(6, '0')}`;
            setAutoGeneratedId(newPid);
        }

        setSettingsSuccess('Registration fee & PID sequence updated successfully!');
        setTimeout(() => setSettingsSuccess(null), 3500);
    };

    const handleSaveSlipSettings = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem('vce_hospital_name', modalHospital.name);
        localStorage.setItem('vce_hospital_tagline', modalHospital.tagline);
        localStorage.setItem('vce_hospital_address', modalHospital.address);
        localStorage.setItem('vce_hospital_hotline', modalHospital.hotline);
        localStorage.setItem('vce_hospital_notice', modalHospital.notice);
        setHospitalInfo({ ...modalHospital });
        window.dispatchEvent(new CustomEvent('vce_hospital_info_updated', { detail: modalHospital }));
        window.dispatchEvent(new Event('storage'));
        setSettingsSuccess('Slip & Header information saved successfully!');
        setTimeout(() => setSettingsSuccess(null), 3500);
    };

    const handleAddSettingsRoom = (e: React.FormEvent) => {
        e.preventDefault();
        if (!settingsNewRoomNum.trim() || !settingsNewRoomName.trim()) return;
        const newRoom: RoomMaster = {
            id: `R-${Date.now()}`,
            roomNumber: settingsNewRoomNum.trim(),
            name: settingsNewRoomName.trim(),
            type: settingsRoomDept,
            currentLoad: 0
        };
        addRoom(newRoom);
        setSettingsNewRoomNum('');
        setSettingsNewRoomName('');
        setSettingsSuccess(`Room ${newRoom.roomNumber} (${newRoom.name}) created for ${settingsRoomDept}!`);
        setTimeout(() => setSettingsSuccess(null), 3000);
    };

    const navigate = useNavigate();
    const location = useLocation();
    const [isSuccess, setIsSuccess] = useState(false);
    const [registeredPatient, setRegisteredPatient] = useState<Patient | null>(null);
    const [registeredRoom, setRegisteredRoom] = useState<RoomMaster | null>(null);
    const [registeredToken, setRegisteredToken] = useState<string>('');
    const [registrationTimestamp, setRegistrationTimestamp] = useState<string>('');

    const [autoGeneratedId, setAutoGeneratedId] = useState<string>(() => {
        return location.state?.patient?.id || getNextSequencePid(patients);
    });

    const handleResetForNewPatient = () => {
        setAutoGeneratedId(getNextSequencePid(patients));
        setFormData({
            uhid: '',
            name: '', dob: '', ageYrs: '', ageMns: '0', ageDays: '0', gender: '', bloodGroup: '', maritalStatus: '',
            paymentCategory: 'Pay', speciality: 'Ophthalmology', patientType: 'New Patient',
            allocation: '', mrLocation: '', nextOfKin: '',
            emergencyName: '', emergencyRelation: '', emergencyPhone: '',
            village: '', postOffice: '', postCode: '', upazilla: '', district: '',
            state: '', country: 'Bangladesh', contact: '', altContact: '', email: '',
            remarks: '', registrationFee: localStorage.getItem('vce_default_reg_fee') || '100', diagnosis: '', assignedDoctor: '', campaignId: '',
            passportNumber: '', passportCountry: '', passportIssueDate: '', passportExpiryDate: '',
            visaType: '', visaNumber: '', visaExpiryDate: ''
        });
        setMatchedPatient(null);
        setShowUhidSuggestions(false);
        setIsForeignPatient(false);
        setRegisteredPatient(null);
        setRegisteredRoom(null);
        setRegisteredToken('');
        setRegistrationTimestamp('');
        setIsSuccess(false);
        setTimeout(() => {
            targetRoomRef.current?.focus();
        }, 60);
    };

    const canAdd = hasPermission('Patient Registration', 'add');

    const [serviceType, setServiceType] = useState<'OPD' | 'Camp' | 'Lab' | 'Diagnosis'>('OPD');
    const doctors = MOCK_EMPLOYEES.filter(e => e.role.includes('Doctor'));

    const [isForeignPatient, setIsForeignPatient] = useState(false);

    const [formData, setFormData] = useState({
        uhid: '',
        name: '', dob: '', ageYrs: '', ageMns: '0', ageDays: '0', gender: '', bloodGroup: '', maritalStatus: '',
        paymentCategory: 'Pay', speciality: 'Ophthalmology', patientType: 'New Patient',
        allocation: '', mrLocation: '', nextOfKin: '',
        emergencyName: '', emergencyRelation: '', emergencyPhone: '',
        village: '', postOffice: '', postCode: '', upazilla: '', district: '',
        state: '', country: 'Bangladesh', contact: '', altContact: '', email: '',
        remarks: '', registrationFee: localStorage.getItem('vce_default_reg_fee') || '100', diagnosis: '', assignedDoctor: '', campaignId: '',
        passportNumber: '', passportCountry: '', passportIssueDate: '', passportExpiryDate: '',
        visaType: '', visaNumber: '', visaExpiryDate: ''
    });

    const [matchedPatient, setMatchedPatient] = useState<Patient | null>(null);
    const [showUhidSuggestions, setShowUhidSuggestions] = useState(false);
    const [selectedUhidIndex, setSelectedUhidIndex] = useState(0);

    const handleSelectExistingPatient = (p: Patient) => {
        setMatchedPatient(p);
        setShowUhidSuggestions(false);
        if (p.patientType === 'Foreign Patient' || p.passportNumber || (p.country && p.country !== 'Bangladesh')) {
            setIsForeignPatient(true);
        }
        setFormData(prev => ({
            ...prev,
            uhid: p.id,
            name: p.name || prev.name,
            dob: p.dob || prev.dob,
            ageYrs: p.age ? p.age.toString() : prev.ageYrs,
            ageMns: (p.ageMonths || 0).toString(),
            ageDays: (p.ageDays || 0).toString(),
            gender: p.gender || prev.gender,
            bloodGroup: p.bloodGroup || prev.bloodGroup || '',
            maritalStatus: p.maritalStatus || prev.maritalStatus || '',
            paymentCategory: p.paymentCategory || prev.paymentCategory,
            contact: p.contact || prev.contact,
            altContact: p.altContact || prev.altContact,
            email: p.email || prev.email,
            village: p.village || prev.village,
            upazilla: p.upazilla || prev.upazilla,
            district: p.district || prev.district,
            postCode: p.postCode || prev.postCode,
            state: p.state || prev.state,
            country: p.country || prev.country,
            emergencyName: p.emergencyName || prev.emergencyName,
            emergencyRelation: p.emergencyRelation || prev.emergencyRelation,
            emergencyPhone: p.emergencyPhone || prev.emergencyPhone,
            remarks: p.remarks || prev.remarks
        }));
    };

    const handleUhidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setFormData(prev => ({ ...prev, uhid: val }));
        setShowUhidSuggestions(true);
        setSelectedUhidIndex(0);

        if (!val.trim()) {
            setMatchedPatient(null);
            return;
        }

        const clean = val.trim().toLowerCase();
        const found = patients.find(p => p.id.toLowerCase() === clean || (clean && p.id.replace(/\D/g, '') === clean));
        if (found) {
            handleSelectExistingPatient(found);
        } else {
            setMatchedPatient(null);
        }
    };

    const uhidMatches = useMemo(() => {
        if (!formData.uhid || !formData.uhid.trim() || formData.patientType !== 'Returning / Old Patient') {
            return [];
        }
        const q = formData.uhid.trim().toLowerCase();
        const numOnly = q.replace(/\D/g, '');
        return patients
            .filter(p => {
                const idLower = p.id.toLowerCase();
                const idNum = p.id.replace(/\D/g, '');
                return (
                    idLower.includes(q) ||
                    (numOnly.length >= 1 && (idNum === numOnly || (numOnly.length >= 2 && idNum.includes(numOnly)))) ||
                    (p.name && p.name.toLowerCase().includes(q)) ||
                    (p.contact && p.contact.includes(q))
                );
            })
            .slice(0, 5);
    }, [patients, formData.uhid, formData.patientType]);

    const handleUhidKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (uhidMatches.length > 0) {
                setShowUhidSuggestions(true);
                setSelectedUhidIndex(prev => (prev < uhidMatches.length - 1 ? prev + 1 : 0));
            }
            return;
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (uhidMatches.length > 0) {
                setShowUhidSuggestions(true);
                setSelectedUhidIndex(prev => (prev > 0 ? prev - 1 : uhidMatches.length - 1));
            }
            return;
        }

        if (e.key === 'Escape') {
            setShowUhidSuggestions(false);
            setSelectedUhidIndex(-1);
            return;
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();

            let targetPatient: Patient | null = null;
            if (uhidMatches.length > 0) {
                targetPatient = (selectedUhidIndex >= 0 && selectedUhidIndex < uhidMatches.length)
                    ? uhidMatches[selectedUhidIndex]
                    : uhidMatches[0];
            } else if (formData.uhid?.trim()) {
                const clean = formData.uhid.trim().toLowerCase();
                const cleanDigits = clean.replace(/\D/g, '');
                targetPatient = patients.find(p =>
                    p.id.toLowerCase() === clean ||
                    (cleanDigits && p.id.replace(/\D/g, '') === cleanDigits) ||
                    (p.contact && p.contact === clean)
                ) || null;
            }

            if (targetPatient) {
                handleSelectExistingPatient(targetPatient);
                setShowUhidSuggestions(false);
                setSelectedUhidIndex(-1);
            }

            // Move focus to next form field
            const form = (e.target as HTMLElement).closest('form');
            if (form) {
                const selector = 'input:not([disabled]):not([type="hidden"]):not([type="button"]):not([type="submit"]), select:not([disabled]), textarea:not([disabled]), button[type="submit"]';
                const focusable = Array.from(form.querySelectorAll<HTMLElement>(selector)).filter(el => el.offsetParent !== null && !el.hasAttribute('disabled'));
                const idx = focusable.indexOf(e.target as HTMLElement);
                if (idx !== -1 && idx < focusable.length - 1) {
                    focusable[idx + 1].focus();
                }
            }
        }
    };

    const isForeign = isForeignPatient || formData.patientType === 'Foreign Patient';
    const currentUhid = (formData.patientType === 'Returning / Old Patient')
        ? (formData.uhid?.trim() || '')
        : (location.state?.patient?.id || autoGeneratedId);

    const handleToggleForeign = () => {
        setIsForeignPatient(prev => {
            const next = !prev;
            setFormData(f => ({
                ...f,
                country: next ? (f.country === 'Bangladesh' ? '' : f.country) : 'Bangladesh',
                patientType: 'New Patient'
            }));
            return next;
        });
    };

    const [selectedRoomId, setSelectedRoomId] = useState<string>('');
    const targetRoomRef = useRef<HTMLSelectElement>(null);

    const currentTokenNumber = useMemo(() => {
        const activeRoom = selectedRoomId
            ? rooms.find(r => r.id === selectedRoomId)
            : (rooms.find(r => r.type === serviceType) || null);
        const currentLoad = activeRoom?.currentLoad || 0;
        return `${serviceType.toUpperCase()}-${String(currentLoad + 1).padStart(3, '0')}`;
    }, [selectedRoomId, rooms, serviceType]);

    const systemDate = useMemo(() => {
        const now = new Date();
        const d = String(now.getDate()).padStart(2, '0');
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const y = now.getFullYear();
        return `${d}-${m}-${y}`;
    }, []);

    // Auto-focus Target Room when registration form opens
    useEffect(() => {
        if (!isSuccess) {
            const timer = setTimeout(() => {
                targetRoomRef.current?.focus();
            }, 80);
            return () => clearTimeout(timer);
        }
    }, [isSuccess]);

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
        if (location.state?.patient) {
            const p = location.state.patient as Patient;
            if (p.assignedRoom) {
                const found = rooms.find(r => r.roomNumber === p.assignedRoom);
                if (found) {
                    setSelectedRoomId(found.id);
                    setServiceType(found.type);
                }
            }
        }
    }, [location.state, rooms]);

    useEffect(() => {
        if (location.state?.patient) {
            const p = location.state.patient as Patient;
            setFormData({
                uhid: p.id,
                name: p.name, dob: p.dob || '', ageYrs: p.age.toString(), ageMns: (p.ageMonths || 0).toString(), ageDays: (p.ageDays || 0).toString(),
                gender: p.gender || '', bloodGroup: p.bloodGroup || '', maritalStatus: p.maritalStatus || '', paymentCategory: p.paymentCategory || '', speciality: p.speciality,
                patientType: p.patientType, allocation: p.allocation, mrLocation: p.mrLocation,
                nextOfKin: p.nextOfKin || '',
                emergencyName: p.emergencyName || p.nextOfKin || '',
                emergencyRelation: p.emergencyRelation || '',
                emergencyPhone: p.emergencyPhone || '',
                village: p.village, postOffice: p.postOffice,
                postCode: p.postCode, upazilla: p.upazilla, district: p.district,
                state: p.state, country: p.country, contact: p.contact,
                altContact: p.altContact || '', email: p.email || '',
                remarks: p.remarks, registrationFee: p.registrationFee.toString(),
                diagnosis: p.diagnosis, assignedDoctor: p.assignedDoctor || '',
                campaignId: p.campaignId || '',
                passportNumber: p.passportNumber || '',
                passportCountry: p.passportCountry || '',
                passportIssueDate: p.passportIssueDate || '',
                passportExpiryDate: p.passportExpiryDate || '',
                visaType: p.visaType || '',
                visaNumber: p.visaNumber || '',
                visaExpiryDate: p.visaExpiryDate || ''
            });
        }
    }, [location.state]);

    // Helper function to calculate Date of Birth from Age (Years, Months & Days)
    const calculateDobFromAge = (years: number, months: number, days: number = 0): string => {
        const y = isNaN(years) || years < 0 ? 0 : years;
        const m = isNaN(months) || months < 0 ? 0 : months;
        const d = isNaN(days) || days < 0 ? 0 : days;
        if (y === 0 && m === 0 && d === 0) {
            return '';
        }

        const today = new Date();
        const targetDate = new Date(today.getFullYear() - y, today.getMonth() - m, today.getDate() - d);

        const yyyy = targetDate.getFullYear();
        const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
        const dd = String(targetDate.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    // Helper function to calculate Age from Date of Birth
    const calculateAgeFromDob = (dobStr: string) => {
        if (!dobStr) return { years: '', months: '0', days: '0' };
        const parts = dobStr.split('-');
        if (parts.length !== 3) return { years: '', months: '0', days: '0' };
        const birthYear = parseInt(parts[0], 10);
        const birthMonth = parseInt(parts[1], 10) - 1;
        const birthDay = parseInt(parts[2], 10);
        if (isNaN(birthYear) || isNaN(birthMonth) || isNaN(birthDay)) return { years: '', months: '0', days: '0' };

        const today = new Date();
        let years = today.getFullYear() - birthYear;
        let months = today.getMonth() - birthMonth;
        let days = today.getDate() - birthDay;

        if (days < 0) {
            months--;
            const prevMonthLastDay = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
            days += prevMonthLastDay;
        }
        if (months < 0) {
            years--;
            months += 12;
        }
        if (years < 0) years = 0;
        if (months < 0) months = 0;
        if (days < 0) days = 0;

        return { years: years.toString(), months: months.toString(), days: days.toString() };
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name === 'ageYrs') {
            const yNum = value.trim() === '' ? NaN : parseInt(value, 10);
            const mNum = parseInt(formData.ageMns, 10) || 0;
            const dNum = parseInt(formData.ageDays || '0', 10) || 0;
            let newDob = formData.dob;
            if (!isNaN(yNum) || mNum > 0 || dNum > 0) {
                newDob = calculateDobFromAge(isNaN(yNum) ? 0 : yNum, mNum, dNum);
            } else if (value.trim() === '' && (!formData.ageMns || formData.ageMns === '0') && (!formData.ageDays || formData.ageDays === '0')) {
                newDob = '';
            }
            setFormData(prev => ({
                ...prev,
                ageYrs: value,
                dob: newDob
            }));
            return;
        }

        if (name === 'ageMns') {
            const mNum = value.trim() === '' ? NaN : parseInt(value, 10);
            const yNum = parseInt(formData.ageYrs, 10) || 0;
            const dNum = parseInt(formData.ageDays || '0', 10) || 0;
            let newDob = formData.dob;
            if (!isNaN(mNum) || yNum > 0 || dNum > 0) {
                newDob = calculateDobFromAge(yNum, isNaN(mNum) ? 0 : mNum, dNum);
            } else if (value.trim() === '' && (!formData.ageYrs || formData.ageYrs === '0') && (!formData.ageDays || formData.ageDays === '0')) {
                newDob = '';
            }
            setFormData(prev => ({
                ...prev,
                ageMns: value,
                dob: newDob
            }));
            return;
        }

        if (name === 'ageDays') {
            const dNum = value.trim() === '' ? NaN : parseInt(value, 10);
            const yNum = parseInt(formData.ageYrs, 10) || 0;
            const mNum = parseInt(formData.ageMns, 10) || 0;
            let newDob = formData.dob;
            if (!isNaN(dNum) || yNum > 0 || mNum > 0) {
                newDob = calculateDobFromAge(yNum, mNum, isNaN(dNum) ? 0 : dNum);
            } else if (value.trim() === '' && (!formData.ageYrs || formData.ageYrs === '0') && (!formData.ageMns || formData.ageMns === '0')) {
                newDob = '';
            }
            setFormData(prev => ({
                ...prev,
                ageDays: value,
                dob: newDob
            }));
            return;
        }

        if (name === 'dob') {
            if (value) {
                const { years, months, days } = calculateAgeFromDob(value);
                setFormData(prev => ({
                    ...prev,
                    dob: value,
                    ageYrs: years,
                    ageMns: months,
                    ageDays: days
                }));
                return;
            } else {
                setFormData(prev => ({ ...prev, dob: '', ageYrs: '', ageMns: '0', ageDays: '0' }));
                return;
            }
        }

        if (name === 'paymentCategory') {
            setFormData(prev => ({
                ...prev,
                paymentCategory: value,
                registrationFee: value === 'Free' ? '0' : (prev.registrationFee === '0' ? '100' : prev.registrationFee)
            }));
            return;
        }

        if (name === 'patientType') {
            if (value === 'Foreign Patient') {
                setIsForeignPatient(true);
            }
            if (value === 'Camp Referral') {
                setServiceType('Camp');
                setSelectedRoomId('');
                const activeCamps = campaigns.filter(c => c.status !== 'Completed');
                setFormData(prev => ({
                    ...prev,
                    patientType: value,
                    campaignId: prev.campaignId || (activeCamps.length > 0 ? activeCamps[0].id : ''),
                    uhid: '',
                    country: 'Bangladesh'
                }));
            } else {
                setFormData(prev => ({
                    ...prev,
                    patientType: value,
                    campaignId: '',
                    uhid: value === 'Returning / Old Patient' ? prev.uhid : '',
                    country: (value === 'Foreign Patient' || isForeignPatient)
                        ? (prev.country === 'Bangladesh' ? '' : prev.country)
                        : 'Bangladesh'
                }));
                if (serviceType === 'Camp') {
                    setServiceType('OPD');
                    setSelectedRoomId('');
                }
            }
            if (value !== 'Returning / Old Patient') {
                setMatchedPatient(null);
                setShowUhidSuggestions(false);
            }
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleUpazillaChange = (val: string) => {
        if (!val || !val.trim()) {
            setFormData(prev => ({
                ...prev,
                upazilla: '',
                district: '',
                state: ''
            }));
            return;
        }
        const cleanVal = val.replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
        const found = BANGLADESH_UPAZILLAS.find(u =>
            u.name.toLowerCase() === val.toLowerCase() ||
            u.name.toLowerCase() === cleanVal
        );
        setFormData(prev => ({
            ...prev,
            upazilla: val,
            district: found ? found.district : prev.district,
            state: found ? found.division : prev.state
        }));
    };

    const handleDistrictChange = (val: string) => {
        if (!val || !val.trim()) {
            setFormData(prev => ({
                ...prev,
                district: '',
                upazilla: ''
            }));
            return;
        }
        const found = BANGLADESH_DISTRICTS.find(d => d.name.toLowerCase() === val.toLowerCase());
        setFormData(prev => {
            const upazillaMatches = BANGLADESH_UPAZILLAS.some(u => u.name.toLowerCase() === prev.upazilla.toLowerCase() && u.district.toLowerCase() === val.toLowerCase());
            return {
                ...prev,
                district: val,
                state: found ? found.division : prev.state,
                upazilla: upazillaMatches ? prev.upazilla : ''
            };
        });
    };

    const handleDivisionChange = (val: string) => {
        if (!val || !val.trim()) {
            setFormData(prev => ({
                ...prev,
                state: '',
                district: '',
                upazilla: ''
            }));
            return;
        }
        setFormData(prev => {
            const districtMatches = BANGLADESH_DISTRICTS.some(d => d.name.toLowerCase() === prev.district.toLowerCase() && d.division.toLowerCase() === val.toLowerCase());
            return {
                ...prev,
                state: val,
                district: districtMatches ? prev.district : '',
                upazilla: districtMatches ? prev.upazilla : ''
            };
        });
    };

    const upazillaOptions = useMemo(() => {
        // Show all thanas and upazillas so users can search across the whole country
        const list = (!formData.district && !formData.state)
            ? BANGLADESH_UPAZILLAS
            : [
                ...BANGLADESH_UPAZILLAS.filter(u => (!formData.district || u.district.toLowerCase() === formData.district.toLowerCase()) && (!formData.state || u.division.toLowerCase() === formData.state.toLowerCase())),
                ...BANGLADESH_UPAZILLAS.filter(u => !((!formData.district || u.district.toLowerCase() === formData.district.toLowerCase()) && (!formData.state || u.division.toLowerCase() === formData.state.toLowerCase())))
            ];

        return list.map(u => ({
            value: u.name,
            label: `${u.name}${u.type ? ` (${u.type})` : ''}`,
            subText: `${u.district}, ${u.division}`
        }));
    }, [formData.district, formData.state]);

    const districtOptions = useMemo(() => {
        return BANGLADESH_DISTRICTS
            .filter(d => !formData.state || d.division.toLowerCase() === formData.state.toLowerCase())
            .map(d => ({
                value: d.name,
                label: d.name,
                subText: d.division
            }));
    }, [formData.state]);

    const divisionOptions = useMemo(() => {
        return BANGLADESH_DIVISIONS.map(d => ({
            value: d,
            label: d
        }));
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRoomId) {
            alert(serviceType === 'Camp' ? "Please select a Target Counter before saving." : "Please select a Target Room before saving.");
            return;
        }
        if (!formData.patientType) {
            alert("Please select a Patient Category.");
            return;
        }
        if (!formData.village.trim()) {
            alert("Please enter Street / Village / Area.");
            return;
        }
        if (!formData.upazilla.trim()) {
            alert("Please enter Sub-District (Upazilla).");
            return;
        }
        if (isForeign) {
            if (!formData.passportNumber.trim()) {
                alert("Please enter Passport Number for Foreign Patient.");
                return;
            }
            if (!formData.passportCountry.trim()) {
                alert("Please enter Issuing Country / Nationality.");
                return;
            }
            if (!formData.passportExpiryDate) {
                alert("Please enter Passport Expiry Date.");
                return;
            }
        }
        const isEditMode = !!location.state?.patient;
        const returningPatientId = (formData.patientType === 'Returning / Old Patient' && formData.uhid?.trim())
            ? formData.uhid.trim()
            : null;
        const newId = returningPatientId || location.state?.patient?.id || autoGeneratedId;
        const branchToAssign = location.state?.patient?.branchId || ((activeBranchId && activeBranchId !== 'consolidated') ? activeBranchId : 'BR001');
        const room = rooms.find(r => r.id === selectedRoomId);

        const emergencyCombined = formData.emergencyName
            ? `${formData.emergencyName}${formData.emergencyRelation ? ` (${formData.emergencyRelation})` : ''}${formData.emergencyPhone ? ` - ${formData.emergencyPhone}` : ''}`
            : formData.nextOfKin;

        const newPatient: Patient = {
            id: newId,
            branchId: branchToAssign,
            createdAt: location.state?.patient?.createdAt || new Date().toISOString(),
            name: formData.name,
            age: parseInt(formData.ageYrs) || 0,
            ageMonths: parseInt(formData.ageMns) || 0,
            ageDays: parseInt(formData.ageDays || '0') || 0,
            dob: formData.dob,
            gender: (formData.gender as any) || 'Other',
            bloodGroup: formData.bloodGroup || '',
            maritalStatus: formData.maritalStatus || '',
            contact: formData.contact,
            altContact: formData.altContact,
            email: formData.email,
            lastVisit: new Date().toISOString().split('T')[0],
            diagnosis: formData.diagnosis || 'New Registration',
            status: 'OPD',
            assignedRoom: room?.roomNumber,
            assignedDoctor: formData.assignedDoctor,
            paymentCategory: (formData.paymentCategory as any) || 'Pay',
            speciality: formData.speciality,
            patientType: formData.patientType,
            allocation: formData.allocation || room?.name || '',
            mrLocation: formData.mrLocation,
            nextOfKin: emergencyCombined,
            emergencyName: formData.emergencyName,
            emergencyRelation: formData.emergencyRelation,
            emergencyPhone: formData.emergencyPhone,
            village: formData.village,
            postOffice: formData.postOffice,
            postCode: formData.postCode,
            upazilla: formData.upazilla,
            district: formData.district,
            state: formData.state,
            country: formData.country,
            passportNumber: formData.passportNumber,
            passportCountry: formData.passportCountry,
            passportIssueDate: formData.passportIssueDate,
            passportExpiryDate: formData.passportExpiryDate,
            visaType: formData.visaType,
            visaNumber: formData.visaNumber,
            visaExpiryDate: formData.visaExpiryDate,
            remarks: formData.remarks,
            registrationFee: parseFloat(formData.registrationFee) || 0,
            visitHistory: location.state?.patient?.visitHistory || [],
            campaignId: formData.campaignId
        };

        const existingRecord = returningPatientId ? patients.find(p => p.id.toLowerCase() === returningPatientId.toLowerCase()) : null;

        if (isEditMode || existingRecord) {
            updatePatient(newId, {
                ...newPatient,
                visitHistory: [
                    {
                        date: new Date().toISOString().split('T')[0],
                        department: serviceType,
                        doctor: formData.assignedDoctor || 'OPD Doctor',
                        diagnosis: formData.diagnosis || 'Re-visit / Consultation',
                        room: room?.roomNumber,
                        type: serviceType
                    },
                    ...(existingRecord?.visitHistory || location.state?.patient?.visitHistory || [])
                ]
            });
        } else {
            addPatient(newPatient);
            try {
                const num = parseInt(newId.replace(/\D/g, ''), 10);
                if (!isNaN(num) && num < 100000) {
                    localStorage.setItem('vce_pid_seq6', num.toString());
                }
            } catch { }
        }
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
        let activeRoom = room;
        if (selectedRoomId) {
            const targetRoom = rooms.find(r => r.id === selectedRoomId);
            if (targetRoom) {
                updateRoom(selectedRoomId, { currentLoad: targetRoom.currentLoad + 1 });
                activeRoom = targetRoom;
            }
        }
        const currentLoad = activeRoom?.currentLoad || 0;
        const token = `${serviceType.toUpperCase()}-${String(currentLoad + 1).padStart(3, '0')}`;
        const timestamp = new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        setRegisteredPatient(newPatient);
        setRegisteredRoom(activeRoom || null);
        setRegisteredToken(token);
        setRegistrationTimestamp(timestamp);
        setAutoGeneratedId(getNextSequencePid([...patients, newPatient]));
        setIsSuccess(true);
    };

    const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
        if (e.key !== 'Enter') return;

        const target = e.target as HTMLElement;

        // Allow default button click or textarea linebreaks
        if (target.tagName === 'BUTTON' && (target as HTMLButtonElement).type === 'submit') {
            return;
        }
        if (target.tagName === 'TEXTAREA') {
            return;
        }
        if (target instanceof HTMLInputElement && target.name === 'uhid') {
            return;
        }

        // Prevent default submission
        e.preventDefault();

        const form = e.currentTarget;
        const selector = 'input:not([disabled]):not([type="hidden"]):not([type="button"]):not([type="submit"]), select:not([disabled]), textarea:not([disabled]), button[type="submit"]';
        const focusableElements = Array.from(form.querySelectorAll<HTMLElement>(selector)).filter(el => {
            return el.offsetParent !== null && !el.hasAttribute('disabled');
        });

        const currentIndex = focusableElements.indexOf(target);

        if (e.shiftKey) {
            // Shift + Enter -> Navigate to previous field
            if (target instanceof HTMLSelectElement && target.name === 'gender' && isForeign) {
                const dobField = form.querySelector<HTMLElement>('input[name="dob"]');
                if (dobField) {
                    dobField.focus();
                    return;
                }
            }

            if (currentIndex > 0) {
                const prev = focusableElements[currentIndex - 1];
                prev.focus();
                if (prev instanceof HTMLInputElement && prev.type !== 'date') {
                    prev.select?.();
                }
            }
        } else {
            // Enter -> Navigate to next field
            // When Date of Birth is filled for Foreign Patient, jump straight to Gender
            if (target instanceof HTMLInputElement && target.name === 'dob' && isForeign) {
                const genderField = form.querySelector<HTMLElement>('select[name="gender"]');
                if (genderField) {
                    genderField.focus();
                    return;
                }
            }

            if (currentIndex > -1 && currentIndex < focusableElements.length - 1) {
                const next = focusableElements[currentIndex + 1];
                next.focus();
                if (next instanceof HTMLInputElement && next.type !== 'date') {
                    next.select?.();
                }
            } else if (currentIndex === focusableElements.length - 1) {
                // If on submit button or last element, submit
                handleSubmit(e);
            }
        }
    };

    const renderResidentialAddress = (isInsideColumn: boolean) => (
        <div className="bg-white rounded-lg shadow-xs border border-slate-200/90 p-2.5 md:p-3 space-y-2 animate-in fade-in duration-200">
            <h3 className="font-bold text-slate-900 text-[16px] flex items-center gap-1.5 border-b border-slate-100 pb-1.5 mb-0.5">
                <Home size={18} className="text-emerald-600" /> {isForeign ? 'Present Address Details' : 'Residential Address Details'}
            </h3>
            <div className={`grid grid-cols-1 ${isInsideColumn ? 'sm:grid-cols-2' : 'md:grid-cols-3'} gap-2`}>
                <div className="space-y-0.5">
                    <label className="text-[15px] font-semibold text-slate-600">Street / Village / Area <span className="text-red-500">*</span></label>
                    <input required name="village" className="w-full px-2.5 py-1 border border-slate-200 rounded-md text-[16px] font-medium text-slate-900 focus:ring-1 focus:ring-teal-500 outline-none" value={formData.village} onChange={handleInputChange} placeholder="Street / Village / Area" />
                </div>
                <div className="space-y-0.5">
                    <label className="text-[15px] font-semibold text-slate-600">Upazilla/Thana <span className="text-red-500">*</span></label>
                    <SearchableSelect
                        name="upazilla"
                        required
                        value={formData.upazilla}
                        onChange={handleUpazillaChange}
                        options={upazillaOptions}
                        placeholder="Search or select Upazilla / Thana"
                    />
                </div>
                <div className="space-y-0.5">
                    <label className="text-[15px] font-semibold text-slate-600">District</label>
                    <SearchableSelect
                        name="district"
                        value={formData.district}
                        onChange={handleDistrictChange}
                        options={districtOptions}
                        placeholder="Search or select District"
                    />
                </div>
                <div className="space-y-0.5">
                    <label className="text-[15px] font-semibold text-slate-600">Postal Code</label>
                    <input name="postCode" className="w-full px-2.5 py-1 border border-slate-200 rounded-md text-[16px] font-medium text-slate-900 focus:ring-1 focus:ring-teal-500 outline-none" value={formData.postCode} onChange={handleInputChange} placeholder="Postal Code" />
                </div>
                <div className="space-y-0.5">
                    <label className="text-[15px] font-semibold text-slate-600">Division</label>
                    <SearchableSelect
                        name="state"
                        value={formData.state}
                        onChange={handleDivisionChange}
                        options={divisionOptions}
                        placeholder="Search or select Division"
                    />
                </div>
                <div className="space-y-0.5">
                    <label className="text-[15px] font-semibold text-slate-600">
                        Country {isForeign && <span className="text-red-500">*</span>}
                    </label>
                    <input
                        disabled={!isForeign}
                        required={isForeign}
                        name="country"
                        className={`w-full px-2.5 py-1 border rounded-md text-[16px] font-medium transition-all ${isForeign
                            ? 'border-teal-400 bg-teal-50/40 ring-1 ring-teal-200 text-slate-900 focus:ring-1 focus:ring-teal-500 outline-none'
                            : 'border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed select-none'
                            }`}
                        value={formData.country}
                        onChange={handleInputChange}
                        placeholder={isForeign ? "Enter country" : "Bangladesh"}
                    />
                </div>
            </div>
        </div>
    );

    if (isSuccess && registeredPatient) {
        return (
            <div className="min-h-screen pb-12 -mt-2 px-2 sm:px-4 max-w-4xl mx-auto animate-in fade-in duration-300">
                {/* Top Action Toolbar (Hidden during print) */}
                <div className="mb-4 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-md p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shadow-xs">
                            <CheckCircle size={22} className="text-teal-600" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-[16px] font-bold text-slate-900 leading-tight">Registration Completed</h2>
                                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full">Active</span>
                            </div>
                            <p className="text-[12px] text-slate-500 font-medium">
                                Print Preview & Patient Token • UHID: <span className="font-mono font-bold text-slate-700">{registeredPatient.id}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-bold text-[13px] rounded-xl flex items-center gap-2 shadow-md shadow-teal-700/20 active:scale-95 transition-all cursor-pointer"
                            title="Print Token Slip (Ctrl+P)"
                        >
                            <Printer size={16} />
                            <span>Print Slip</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleResetForNewPatient}
                            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-bold text-[13px] rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                            title="Register another patient"
                        >
                            <UserPlus size={16} className="text-teal-600" />
                            <span>Register Another</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/patients')}
                            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[13px] rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                            title="Go to Patient Directory"
                        >
                            <Users size={16} />
                            <span>Patient List</span>
                        </button>
                    </div>
                </div>

                {/* Printable Token / Slip Card */}
                <div
                    id="printable-slip"
                    className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8 text-slate-900 print:shadow-none print:border-none print:p-0 print:m-0"
                >
                    {/* Header */}
                    <div className="border-b-2 border-slate-800 pb-3 mb-4">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-teal-700 text-white rounded-xl flex items-center justify-center shadow-md print:bg-teal-700 print:text-white">
                                    <Eye size={28} />
                                </div>
                                <div>
                                    <h1 className="text-xl font-extrabold uppercase tracking-tight text-slate-900 leading-none">
                                        {hospitalInfo.name}
                                    </h1>
                                    <p className="text-xs font-semibold text-teal-700 tracking-wide mt-1 uppercase">
                                        {hospitalInfo.tagline}
                                    </p>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        {hospitalInfo.address} • Hotline: {hospitalInfo.hotline}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="inline-block bg-slate-900 text-white text-[11px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider">
                                    Registration Slip
                                </div>
                                <div className="text-[12px] font-bold text-slate-700 mt-1.5">
                                    {registrationTimestamp}
                                </div>
                                <div className="text-[11px] font-mono text-slate-500">
                                    Receipt: TXN-{Date.now().toString().slice(-6)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Routing & Token High-Priority Box */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gradient-to-r from-teal-50 via-teal-50/60 to-cyan-50/60 border border-teal-200 rounded-xl p-3 mb-4 print:bg-slate-50 print:border-slate-300">
                        <div className="border-r border-teal-200/80 pr-2">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-teal-800">Token Number</p>
                            <p className="text-2xl font-black text-teal-900 mt-0.5">{registeredToken}</p>
                        </div>
                        <div className="border-r border-teal-200/80 pr-2">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-teal-800">Assigned Room</p>
                            <p className="text-[16px] font-extrabold text-slate-900 mt-1">
                                {registeredRoom?.roomNumber || registeredPatient.assignedRoom || 'Room 101'}
                            </p>
                            <p className="text-[11px] text-slate-600 font-medium truncate">{registeredRoom?.name || 'OPD Counter'}</p>
                        </div>
                        <div className="border-r border-teal-200/80 pr-2">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-teal-800">Department</p>
                            <p className="text-[15px] font-bold text-slate-900 mt-1">{serviceType} Service</p>
                            <p className="text-[11px] text-slate-600 font-medium">{registeredPatient.speciality}</p>
                        </div>
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-teal-800">Fee Status</p>
                            <p className="text-[16px] font-extrabold text-emerald-700 mt-1">
                                {currency} {registeredPatient.registrationFee}
                            </p>
                            <p className="text-[11px] font-bold text-emerald-600 uppercase">Paid (Cash)</p>
                        </div>
                    </div>

                    {/* Patient Information Section */}
                    <div className="border border-slate-200 rounded-xl p-3.5 mb-3 bg-white">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-2.5">
                            <h3 className="font-bold text-slate-900 text-[13px] flex items-center gap-1.5 uppercase tracking-wide">
                                <User size={15} className="text-teal-600" /> Patient Demographics
                            </h3>
                            <span className="font-mono text-[12px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                                UHID: {registeredPatient.id}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2.5 gap-x-4 text-[13px]">
                            <div>
                                <span className="text-[11px] font-bold uppercase text-slate-400 block">Full Legal Name</span>
                                <span className="font-extrabold text-slate-900 text-[15px]">{registeredPatient.name}</span>
                            </div>
                            <div>
                                <span className="text-[11px] font-bold uppercase text-slate-400 block">Age & Gender</span>
                                <span className="font-bold text-slate-800">
                                    {registeredPatient.age} Yrs {registeredPatient.ageMonths || 0} Mos {registeredPatient.ageDays ? `${registeredPatient.ageDays} Days ` : ''}/ {registeredPatient.gender || 'Not specified'}{registeredPatient.bloodGroup ? ` • Blood: ${registeredPatient.bloodGroup}` : ''}{registeredPatient.maritalStatus ? ` • ${registeredPatient.maritalStatus}` : ''}
                                </span>
                            </div>
                            <div>
                                <span className="text-[11px] font-bold uppercase text-slate-400 block">Patient Category</span>
                                <span className="font-bold text-slate-800">{registeredPatient.patientType}</span>
                            </div>

                            <div>
                                <span className="text-[11px] font-bold uppercase text-slate-400 block">Primary Contact</span>
                                <span className="font-bold text-slate-800">{registeredPatient.contact}</span>
                            </div>
                            <div>
                                <span className="text-[11px] font-bold uppercase text-slate-400 block">Alt Contact / Email</span>
                                <span className="font-medium text-slate-700">
                                    {registeredPatient.altContact || registeredPatient.email || 'N/A'}
                                </span>
                            </div>
                            <div>
                                <span className="text-[11px] font-bold uppercase text-slate-400 block">Date of Birth</span>
                                <span className="font-medium text-slate-700">{registeredPatient.dob || 'N/A'}</span>
                            </div>

                            <div className="sm:col-span-2">
                                <span className="text-[11px] font-bold uppercase text-slate-400 block">Residential Address</span>
                                <span className="font-medium text-slate-800">
                                    {[registeredPatient.village, registeredPatient.upazilla, registeredPatient.district, registeredPatient.state, registeredPatient.country].filter(Boolean).join(', ')}
                                </span>
                            </div>
                            <div>
                                <span className="text-[11px] font-bold uppercase text-slate-400 block">Emergency Contact / Kin</span>
                                <span className="font-medium text-slate-800">{registeredPatient.nextOfKin || 'N/A'}</span>
                            </div>
                        </div>

                        {/* Foreign Patient Details if applicable */}
                        {(registeredPatient.patientType === 'Foreign Patient' || registeredPatient.passportNumber) && (
                            <div className="mt-3 pt-3 border-t border-slate-100 bg-teal-50/40 -mx-3.5 -mb-3.5 p-3 px-3.5 rounded-b-xl">
                                <div className="flex items-center gap-1.5 text-teal-800 font-bold text-[12px] mb-2 uppercase tracking-wide">
                                    <Globe size={14} /> Passport & Visa Verification (Foreign Patient)
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[12px]">
                                    <div>
                                        <span className="text-[10px] font-bold uppercase text-slate-500 block">Passport Number</span>
                                        <span className="font-mono font-bold text-slate-900">{registeredPatient.passportNumber || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold uppercase text-slate-500 block">Country / Nationality</span>
                                        <span className="font-bold text-slate-800">{registeredPatient.passportCountry || registeredPatient.country || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold uppercase text-slate-500 block">Passport Expiry</span>
                                        <span className="font-medium text-slate-700">{registeredPatient.passportExpiryDate || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold uppercase text-slate-500 block">Visa Type / Valid Until</span>
                                        <span className="font-medium text-slate-700">
                                            {registeredPatient.visaType || 'N/A'} {registeredPatient.visaExpiryDate ? `(${registeredPatient.visaExpiryDate})` : ''}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Consultation & Doctor Routing */}
                    <div className="border border-slate-200 rounded-xl p-3.5 mb-3 bg-white">
                        <h3 className="font-bold text-slate-900 text-[13px] flex items-center gap-1.5 uppercase tracking-wide border-b border-slate-100 pb-2 mb-2">
                            <Stethoscope size={15} className="text-teal-600" /> Clinical Routing & Service Details
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[13px]">
                            <div>
                                <span className="text-[11px] font-bold uppercase text-slate-400 block">Assigned Doctor</span>
                                <span className="font-bold text-slate-900">
                                    {registeredPatient.assignedDoctor || 'On-Duty Consultant Ophthalmologist'}
                                </span>
                            </div>
                            <div>
                                <span className="text-[11px] font-bold uppercase text-slate-400 block">Speciality</span>
                                <span className="font-medium text-slate-800">{registeredPatient.speciality}</span>
                            </div>
                            <div>
                                <span className="text-[11px] font-bold uppercase text-slate-400 block">Primary Concern / Complaint</span>
                                <span className="font-medium text-slate-800">{registeredPatient.diagnosis || 'Eye Examination'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Patient Notice & Barcode Footer */}
                    <div className="border-t-2 border-slate-800 pt-3 mt-3">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            {/* Barcode & UHID */}
                            <div className="flex flex-col items-center sm:items-start">
                                <div className="flex items-center gap-[2px] h-8 px-1 py-1 bg-white">
                                    {[2, 1, 3, 1, 2, 1, 1, 3, 2, 1, 2, 3, 1, 2, 3, 1, 1, 2, 3, 1, 2, 1, 3, 2, 1, 1, 3, 2, 1, 2, 3, 1, 2].map((w, i) => (
                                        <div key={i} className="bg-slate-900 h-full" style={{ width: `${w}px` }} />
                                    ))}
                                </div>
                                <span className="font-mono text-[11px] font-bold text-slate-700 tracking-wider">
                                    *{registeredPatient.id}*
                                </span>
                            </div>

                            {/* Patient Instructions */}
                            <div className="text-[11px] text-slate-500 max-w-sm text-center sm:text-left space-y-0.5">
                                <p className="font-semibold text-slate-700">Notice for Patient:</p>
                                {hospitalInfo.notice.split('\n').map((line, idx) => (
                                    <p key={idx}>{line}</p>
                                ))}
                            </div>

                            {/* Signatures */}
                            <div className="flex gap-6 text-center text-[10px] text-slate-500">
                                <div>
                                    <div className="w-24 border-b border-slate-400 mb-1 mt-5"></div>
                                    <span>Receptionist</span>
                                </div>
                                <div>
                                    <div className="w-24 border-b border-slate-400 mb-1 mt-5"></div>
                                    <span>Authorized Seal</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-2.5 text-center border-t border-slate-100 pt-2 text-[10px] text-slate-400 font-medium">
                            {hospitalInfo.name} • Computer Generated Patient Registration & Queue Token • Valid for Visit Date
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-mesh-gradient -mt-4 lg:-mt-5 pt-0 px-1 sm:px-2 md:px-3 pb-2 max-w-[1600px] mx-auto animate-in fade-in duration-300">
            <form id="regForm" onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-slate-200/90 overflow-hidden">
                {/* Form Header */}
                <div className="flex flex-wrap justify-between items-center gap-2 py-2 px-4 md:px-5 border-b border-slate-200/80 bg-white">
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg shadow-xs"><UserPlus size={20} /></div>
                        <div className="flex items-baseline gap-2">
                            <h1 className="text-[18px] md:text-[20px] font-bold text-slate-900 tracking-tight">Patient Registration</h1>
                            <span className="hidden sm:inline text-[15px] text-slate-400 font-medium">| Electronic Medical Record</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            tabIndex={-1}
                            onClick={handleOpenSettings}
                            className="px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all text-[15px] border bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-teal-700 hover:border-teal-300 shadow-xs cursor-pointer"
                            title="Registration Settings (Authorized Users Only)"
                        >
                            <Settings size={16} className="text-teal-600" />
                            <span>Settings</span>
                        </button>
                        <button
                            type="button"
                            tabIndex={-1}
                            onClick={handleToggleForeign}
                            className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all text-[16px] border ${isForeignPatient
                                ? 'bg-teal-600 text-white border-teal-600 shadow-xs ring-1 ring-teal-200'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs'
                                }`}
                        >
                            <Globe size={16} className={isForeignPatient ? 'text-white' : 'text-teal-600'} />
                            <span>Foreign Patient</span>
                            {isForeignPatient && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Department Information Banner */}
                <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-cyan-800 text-white py-2 px-4 md:px-5 relative overflow-hidden border-b border-teal-900/30">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
                    <div className="relative z-10 flex flex-wrap lg:flex-nowrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <span className="font-black text-teal-200 text-[14px] uppercase tracking-wider hidden sm:inline">Dept:</span>
                            <div className="flex items-center gap-1.5">
                                {[
                                    { id: 'OPD', label: 'OPD', icon: Stethoscope },
                                    { id: 'Camp', label: 'CAMP', icon: Tent },
                                    { id: 'Lab', label: 'LAB', icon: Microscope },
                                    { id: 'Diagnosis', label: 'DIAG', icon: Eye }
                                ].map(type => (
                                    <button
                                        key={type.id}
                                        type="button"
                                        tabIndex={-1}
                                        onClick={() => {
                                            const newService = type.id as any;
                                            setServiceType(newService);
                                            setSelectedRoomId('');
                                            if (newService === 'Camp') {
                                                const activeCamps = campaigns.filter(c => c.status !== 'Completed');
                                                setFormData(prev => ({
                                                    ...prev,
                                                    patientType: 'Camp Referral',
                                                    campaignId: prev.campaignId || (activeCamps.length > 0 ? activeCamps[0].id : '')
                                                }));
                                            } else if (formData.patientType === 'Camp Referral') {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    patientType: 'New Patient',
                                                    campaignId: ''
                                                }));
                                            }
                                            setTimeout(() => targetRoomRef.current?.focus(), 50);
                                        }}
                                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-[15px] transition-all ${serviceType === type.id
                                            ? 'bg-white text-teal-900 border-white shadow-xs font-bold'
                                            : 'bg-black/20 border-white/20 text-white/90 hover:bg-black/30 hover:border-white/40 font-medium'
                                            }`}
                                    >
                                        <type.icon size={15} />
                                        <span>{type.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="hidden md:flex items-center gap-2 text-[16px] text-teal-50">
                            <span className="text-[14px] font-bold text-cyan-200 uppercase tracking-wider">Routing:</span>
                            <span className="text-white font-semibold truncate max-w-xs">{rooms.find(r => r.id === selectedRoomId)?.name || (serviceType === 'Camp' ? 'Select a counter' : 'Select a counter room')}</span>
                        </div>

                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-between sm:justify-end mt-1 sm:mt-0 ml-auto">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[14px] font-bold text-cyan-200 uppercase tracking-wider whitespace-nowrap">{serviceType === 'Camp' ? 'Target Counter' : 'Target Room'} <span className="text-red-400">*</span></span>
                                <div className="relative">
                                    <select
                                        ref={targetRoomRef}
                                        autoFocus
                                        required
                                        tabIndex={1}
                                        name="selectedRoomId"
                                        className="bg-white/10 hover:bg-white/15 backdrop-blur-md text-white font-bold text-[16px] pl-2.5 pr-7 py-1 rounded-md border border-white/30 hover:border-white/50 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300 focus:bg-teal-900/90 cursor-pointer outline-none transition-all appearance-none truncate ring-offset-1 ring-offset-teal-800"
                                        value={selectedRoomId}
                                        onChange={(e) => setSelectedRoomId(e.target.value)}
                                    >
                                        <option value="" className="text-slate-400 bg-white font-semibold py-1">{serviceType === 'Camp' ? 'Select Counter' : 'Select Room'}</option>
                                        {rooms.filter(r => r.type === serviceType).map(r => (
                                            <option key={r.id} value={r.id} className="text-slate-900 bg-white font-semibold py-1">
                                                {serviceType === 'Camp' ? `Counter ${r.roomNumber}` : r.roomNumber} - {r.name}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/80 pointer-events-none" />
                                </div>
                            </div>
                            <div className="w-8 h-8 bg-white text-teal-800 rounded-md flex items-center justify-center font-black text-[18px] shadow-xs">
                                {rooms.find(r => r.id === selectedRoomId)?.roomNumber || '--'}
                            </div>
                            <button
                                type="button"
                                tabIndex={-1}
                                onClick={() => setShowRoomModal(true)}
                                className="px-2 py-1 bg-white/15 hover:bg-white/25 text-white rounded-md text-[13px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 border border-white/20"
                                title={serviceType === 'Camp' ? "Manage Counters" : "Manage Rooms"}
                            >
                                <Settings size={14} />
                                <span className="hidden sm:inline">{serviceType === 'Camp' ? 'Counters' : 'Rooms'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Form Body Sections */}
                <div className="p-2.5 md:p-3 space-y-2.5 bg-slate-50/40">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 md:gap-3">
                        {/* Left Column: Personal Profile (+ Residential Address when Foreign Patient) */}
                        <div className="space-y-2.5">
                            <div className="bg-white rounded-lg shadow-xs border border-slate-200/90 p-2.5 md:p-3 space-y-2">
                                <h3 className="font-bold text-slate-900 text-[16px] flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-1.5 mb-0.5">
                                    <span className="flex items-center gap-1.5">
                                        <UserCheck size={18} className="text-teal-600" /> Patient Information
                                    </span>
                                    {currentUhid ? (
                                        <span className="text-teal-700 font-mono font-bold text-[15px] select-all">
                                            ({currentUhid})
                                        </span>
                                    ) : (
                                        <span className="text-slate-400 font-normal text-[13px]">
                                            (Pending UHID)
                                        </span>
                                    )}
                                </h3>
                                <div className="grid grid-cols-1 gap-2">
                                    {formData.patientType === 'Returning / Old Patient' ? (
                                        <>
                                            {/* Row 1: Patient Category (1st) and UHID / Patient ID (2nd, after Patient Category on same row, NOT below) */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                <div className="space-y-0.5">
                                                    <label className="text-[15px] font-semibold text-slate-600">Patient Category <span className="text-red-500">*</span></label>
                                                    <select
                                                        required
                                                        name="patientType"
                                                        className="w-full px-2.5 py-1 border border-slate-200 rounded-md text-[16px] font-medium text-slate-900 bg-white focus:ring-1 focus:ring-teal-500 outline-none"
                                                        value={formData.patientType === 'Foreign Patient' ? 'New Patient' : formData.patientType}
                                                        onChange={handleInputChange}
                                                    >
                                                        {isForeign ? (
                                                            <>
                                                                <option value="New Patient">New Patient</option>
                                                                <option value="Returning / Old Patient">Returning / Old Patient</option>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <option value="New Patient">New Patient</option>
                                                                <option value="Returning / Old Patient">Returning / Old Patient</option>
                                                                <option value="Referral">Referral</option>
                                                                <option value="Camp Referral">Camp Referral</option>
                                                                <option value="Corporate Account">Corporate Account</option>
                                                            </>
                                                        )}
                                                    </select>
                                                </div>

                                                <div className="space-y-0.5 animate-in slide-in-from-right-2 duration-200">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-[15px] font-bold text-teal-900 flex items-center gap-1.5">
                                                            <Hash size={16} className="text-teal-600" /> UHID / Patient ID <span className="text-red-500">*</span>
                                                        </label>
                                                        {matchedPatient ? (
                                                            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                                                                <CheckCircle size={11} className="text-emerald-600" /> Patient Found: {matchedPatient.name}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[11px] text-slate-500 truncate">
                                                                Enter UHID to auto-fill
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="relative">
                                                        <input
                                                            required
                                                            autoFocus
                                                            name="uhid"
                                                            placeholder="Enter UHID (e.g. PID-000001)"
                                                            className="w-full pl-8 pr-16 py-1 bg-white border border-teal-300 focus:border-teal-600 rounded-md text-[16px] font-bold text-slate-900 focus:ring-1 focus:ring-teal-500 outline-none uppercase placeholder:normal-case placeholder:font-normal"
                                                            value={formData.uhid || ''}
                                                            onChange={handleUhidChange}
                                                            onKeyDown={handleUhidKeyDown}
                                                            onFocus={() => {
                                                                if (formData.uhid?.trim() && uhidMatches.length > 0 && !matchedPatient) {
                                                                    setShowUhidSuggestions(true);
                                                                }
                                                            }}
                                                        />
                                                        <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-teal-600 pointer-events-none" />
                                                        {matchedPatient && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setMatchedPatient(null);
                                                                    setSelectedUhidIndex(-1);
                                                                    setFormData(prev => ({ ...prev, uhid: '' }));
                                                                }}
                                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-[12px] text-slate-400 hover:text-slate-700 bg-slate-100 px-2 py-0.5 rounded cursor-pointer"
                                                            >
                                                                Clear
                                                            </button>
                                                        )}

                                                        {/* Suggestions dropdown if searching */}
                                                        {showUhidSuggestions && uhidMatches.length > 0 && !matchedPatient && (
                                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-teal-300 z-50 overflow-hidden divide-y divide-slate-100 animate-in fade-in duration-150">
                                                                <div className="px-3 py-1 bg-teal-50 text-[11px] font-bold uppercase text-teal-800 tracking-wider flex justify-between items-center">
                                                                    <span>Matching Patients (Hit Enter or Click to Auto-Fill)</span>
                                                                    <span className="text-[10px] text-teal-600 font-normal">↑↓ to navigate</span>
                                                                </div>
                                                                {uhidMatches.map((p, idx) => {
                                                                    const isSelected = idx === selectedUhidIndex;
                                                                    return (
                                                                        <button
                                                                            key={p.id}
                                                                            type="button"
                                                                            onMouseEnter={() => setSelectedUhidIndex(idx)}
                                                                            onMouseDown={(e) => e.preventDefault()}
                                                                            onClick={() => {
                                                                                handleSelectExistingPatient(p);
                                                                                setSelectedUhidIndex(-1);
                                                                            }}
                                                                            className={`w-full px-3 py-2 text-left flex items-center justify-between transition-colors cursor-pointer ${isSelected ? 'bg-teal-100/90 ring-1 ring-inset ring-teal-400' : 'hover:bg-teal-50/80'
                                                                                }`}
                                                                        >
                                                                            <div>
                                                                                <div className="text-[14px] font-bold text-slate-900 flex items-center gap-2">
                                                                                    <span className="text-teal-700 font-mono">{p.id}</span>
                                                                                    <span>{p.name}</span>
                                                                                </div>
                                                                                <div className="text-[12px] text-slate-500">
                                                                                    {p.age} Yrs / {p.gender} • Phone: {p.contact || 'N/A'} • {p.village || ''}
                                                                                </div>
                                                                            </div>
                                                                            <span className={`text-[12px] font-bold px-2 py-1 rounded border shadow-2xs ${isSelected
                                                                                ? 'bg-teal-600 text-white border-teal-600'
                                                                                : 'text-teal-600 bg-white border-teal-200'
                                                                                }`}>
                                                                                Auto-Fill {isSelected ? '↵' : ''}
                                                                            </span>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Row 2: Full Legal Name Below Row 1 */}
                                            <div className="space-y-0.5">
                                                <label className="text-[15px] font-semibold text-slate-600">Full Legal Name <span className="text-red-500">*</span></label>
                                                <input
                                                    required
                                                    name="name"
                                                    className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-[16px] font-medium text-slate-900 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                                                    value={formData.name}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter full name as per ID"
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            <div className="space-y-0.5">
                                                <label className="text-[15px] font-semibold text-slate-600">Patient Category <span className="text-red-500">*</span></label>
                                                <select
                                                    required
                                                    name="patientType"
                                                    className="w-full px-2.5 py-1 border border-slate-200 rounded-md text-[16px] font-medium text-slate-900 bg-white focus:ring-1 focus:ring-teal-500 outline-none"
                                                    value={formData.patientType === 'Foreign Patient' ? 'New Patient' : formData.patientType}
                                                    onChange={handleInputChange}
                                                >
                                                    {isForeign ? (
                                                        <>
                                                            <option value="New Patient">New Patient</option>
                                                            <option value="Returning / Old Patient">Returning / Old Patient</option>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <option value="New Patient">New Patient</option>
                                                            <option value="Returning / Old Patient">Returning / Old Patient</option>
                                                            <option value="Referral">Referral</option>
                                                            <option value="Camp Referral">Camp Referral</option>
                                                            <option value="Corporate Account">Corporate Account</option>
                                                        </>
                                                    )}
                                                </select>
                                            </div>
                                            <div className="space-y-0.5">
                                                <label className="text-[15px] font-semibold text-slate-600">Full Legal Name <span className="text-red-500">*</span></label>
                                                <input required name="name" className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-[16px] font-medium text-slate-900 focus:ring-1 focus:ring-teal-500 outline-none transition-all" value={formData.name} onChange={handleInputChange} placeholder="Enter full name as per ID" />
                                            </div>
                                        </div>
                                    )}
                                    {formData.patientType === 'Camp Referral' && (
                                        <div className="space-y-0.5 animate-in slide-in-from-left-2 duration-200">
                                            <label className="text-[15px] font-semibold text-slate-600">Select Campaign / Camp <span className="text-red-500">*</span></label>
                                            <div className="relative">
                                                <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 text-teal-500" size={14} />
                                                <select required name="campaignId" className="w-full pl-7 pr-2.5 py-1 bg-teal-50 border border-teal-100 rounded-md text-[16px] font-bold text-teal-900 focus:ring-1 focus:ring-teal-500 outline-none transition-all appearance-none" value={formData.campaignId} onChange={handleInputChange}>
                                                    <option value="">-- Select Active Camp --</option>
                                                    {campaigns.filter(c => c.status !== 'Completed').map(c => (
                                                        <option key={c.id} value={c.id}>{c.name} ({c.location})</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                    {isForeign ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <div className="space-y-0.5">
                                                <label className="text-[15px] font-semibold text-slate-600">Date of Birth</label>
                                                <CustomDatePicker
                                                    name="dob"
                                                    value={formData.dob}
                                                    onChange={handleInputChange}
                                                    placeholder="dd-mm-yyyy"
                                                />
                                            </div>
                                            <div className="grid grid-cols-3 gap-1.5">
                                                <div className="space-y-0.5">
                                                    <label className="text-[15px] font-semibold text-slate-600">Years <span className="text-red-500">*</span></label>
                                                    <input
                                                        required
                                                        name="ageYrs"
                                                        type="number"
                                                        min="0"
                                                        max="150"
                                                        placeholder="Years"
                                                        className="w-full px-2 py-1 border border-slate-200 rounded-md text-[16px] font-medium text-slate-900 bg-white focus:ring-1 focus:ring-teal-500 outline-none"
                                                        value={formData.ageYrs}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <label className="text-[15px] font-semibold text-slate-600">Months</label>
                                                    <input
                                                        name="ageMns"
                                                        type="number"
                                                        min="0"
                                                        max="11"
                                                        placeholder="Months"
                                                        className="w-full px-2 py-1 border border-slate-200 rounded-md text-[16px] font-medium text-slate-900 bg-white focus:ring-1 focus:ring-teal-500 outline-none"
                                                        value={formData.ageMns}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <label className="text-[15px] font-semibold text-slate-600">Day</label>
                                                    <input
                                                        name="ageDays"
                                                        type="number"
                                                        min="0"
                                                        max="31"
                                                        placeholder="Day"
                                                        className="w-full px-2 py-1 border border-slate-200 rounded-md text-[16px] font-medium text-slate-900 bg-white focus:ring-1 focus:ring-teal-500 outline-none"
                                                        value={formData.ageDays}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <div className="grid grid-cols-3 gap-1.5">
                                                <div className="space-y-0.5">
                                                    <label className="text-[15px] font-semibold text-slate-600">Years <span className="text-red-500">*</span></label>
                                                    <input required name="ageYrs" type="number" min="0" max="150" placeholder="Years" className="w-full px-2 py-1 border border-slate-200 rounded-md text-[16px] font-medium text-slate-900 bg-white focus:ring-1 focus:ring-teal-500 outline-none" value={formData.ageYrs} onChange={handleInputChange} />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <label className="text-[15px] font-semibold text-slate-600">Months</label>
                                                    <input name="ageMns" type="number" min="0" max="11" placeholder="Months" className="w-full px-2 py-1 border border-slate-200 rounded-md text-[16px] font-medium text-slate-900 bg-white focus:ring-1 focus:ring-teal-500 outline-none" value={formData.ageMns} onChange={handleInputChange} />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <label className="text-[15px] font-semibold text-slate-600">Day</label>
                                                    <input name="ageDays" type="number" min="0" max="31" placeholder="Day" className="w-full px-2 py-1 border border-slate-200 rounded-md text-[16px] font-medium text-slate-900 bg-white focus:ring-1 focus:ring-teal-500 outline-none" value={formData.ageDays} onChange={handleInputChange} />
                                                </div>
                                            </div>
                                            <div className="space-y-0.5">
                                                <label className="text-[15px] font-semibold text-slate-600">Date of Birth</label>
                                                <CustomDatePicker
                                                    name="dob"
                                                    value={formData.dob}
                                                    onChange={handleInputChange}
                                                    placeholder="dd-mm-yyyy"
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <div className="space-y-0.5">
                                            <label className="text-[15px] font-semibold text-slate-600 block">Gender <span className="text-red-500">*</span></label>
                                            <select required name="gender" className="w-full px-2.5 py-1 border border-slate-200 rounded-md text-[16px] font-medium text-slate-900 bg-white focus:ring-1 focus:ring-teal-500 outline-none" value={formData.gender} onChange={handleInputChange}>
                                                <option value="">Select Gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div className="space-y-0.5">
                                            <label className="text-[15px] font-semibold text-slate-600 block">Marital Status</label>
                                            <select name="maritalStatus" className="w-full px-2.5 py-1 border border-slate-200 rounded-md text-[16px] font-medium text-slate-900 bg-white focus:ring-1 focus:ring-teal-500 outline-none" value={formData.maritalStatus} onChange={handleInputChange}>
                                                <option value="">Select Marital Status</option>
                                                <option value="Single">Single</option>
                                                <option value="Married">Married</option>
                                                <option value="Widowed">Widowed</option>
                                                <option value="Divorced">Divorced</option>
                                                <option value="Separated">Separated</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <div className="space-y-0.5">
                                            <label className="text-[15px] font-semibold text-slate-600 block">Blood Group</label>
                                            <select name="bloodGroup" className="w-full px-2.5 py-1 border border-slate-200 rounded-md text-[16px] font-medium text-slate-900 bg-white focus:ring-1 focus:ring-teal-500 outline-none" value={formData.bloodGroup} onChange={handleInputChange}>
                                                <option value="">Select Blood Group</option>
                                                <option value="A+">A+</option>
                                                <option value="A-">A-</option>
                                                <option value="B+">B+</option>
                                                <option value="B-">B-</option>
                                                <option value="O+">O+</option>
                                                <option value="O-">O-</option>
                                                <option value="AB+">AB+</option>
                                                <option value="AB-">AB-</option>
                                                <option value="Unknown">Unknown</option>
                                            </select>
                                        </div>
                                        <div className="space-y-0.5">
                                            <label className="text-[15px] font-semibold text-slate-600 block">Payment Category <span className="text-red-500">*</span></label>
                                            <select required name="paymentCategory" className="w-full px-2.5 py-1 border border-slate-200 rounded-md text-[16px] font-medium text-slate-900 bg-white focus:ring-1 focus:ring-teal-500 outline-none" value={formData.paymentCategory} onChange={handleInputChange}>
                                                <option value="Pay">Regular Fee</option>
                                                <option value="Free">Charity</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* When Foreign Patient, Residential Address Details appears here under Patient Information */}
                            {isForeign && renderResidentialAddress(true)}
                        </div>

                        {/* Contact Details */}
                        <div className="bg-white rounded-lg shadow-xs border border-slate-200/90 p-2.5 md:p-3 space-y-2">
                            <h3 className="font-bold text-slate-900 text-[16px] flex items-center gap-1.5 border-b border-slate-100 pb-1.5 mb-0.5">
                                <Phone size={18} className="text-indigo-600" /> Contact Information
                            </h3>
                            <div className="grid grid-cols-1 gap-2">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-0.5">
                                        <label className="text-[15px] font-semibold text-slate-600">Primary Phone Number <span className="text-red-500">*</span></label>
                                        <input required name="contact" className="w-full px-2.5 py-1 border border-slate-200 rounded-md text-[16px] font-medium text-slate-900" value={formData.contact} onChange={handleInputChange} placeholder="01805567271" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <label className="text-[15px] font-semibold text-slate-600">Secondary Phone Number</label>
                                        <input name="altContact" className="w-full px-2.5 py-1 border border-slate-200 rounded-md text-[16px] font-medium text-slate-900" value={formData.altContact} onChange={handleInputChange} placeholder="01805567271" />
                                    </div>
                                </div>
                                <div className="space-y-0.5">
                                    <label className="text-[15px] font-semibold text-slate-600">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                        <input name="email" type="email" className="w-full pl-7 pr-2.5 py-1 border border-slate-200 rounded-md text-[16px] font-medium text-slate-900" value={formData.email} onChange={handleInputChange} placeholder="patient@example.com" />
                                    </div>
                                </div>

                                {isForeign && (
                                    <div className="pt-2 pb-1 border-t border-teal-100 bg-teal-50/40 -mx-1 px-2.5 py-2 rounded-lg space-y-2 border border-teal-100 animate-in fade-in duration-200">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[15px] font-bold text-teal-800 flex items-center gap-1.5">
                                                <Globe size={16} className="text-teal-600" /> Passport & Visa Details
                                            </span>
                                            <span className="text-[13px] font-bold px-2 py-0.5 bg-teal-100/90 text-teal-800 rounded-full border border-teal-200">Foreign National</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            <div className="space-y-0.5">
                                                <label className="text-[15px] font-semibold text-slate-600">Passport Number <span className="text-red-500">*</span></label>
                                                <input
                                                    required={isForeign}
                                                    name="passportNumber"
                                                    className="w-full px-2.5 py-1 border border-teal-200 bg-white rounded-md text-[16px] font-medium text-slate-900 focus:ring-1 focus:ring-teal-500 outline-none uppercase placeholder:normal-case"
                                                    value={formData.passportNumber}
                                                    onChange={handleInputChange}
                                                    placeholder="e.g. A12345678"
                                                />
                                            </div>
                                            <div className="space-y-0.5">
                                                <label className="text-[15px] font-semibold text-slate-600">Issuing Country / Nationality <span className="text-red-500">*</span></label>
                                                <input
                                                    required={isForeign}
                                                    name="passportCountry"
                                                    className="w-full px-2.5 py-1 border border-teal-200 bg-white rounded-md text-[16px] font-medium text-slate-900 focus:ring-1 focus:ring-teal-500 outline-none"
                                                    value={formData.passportCountry}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            passportCountry: val,
                                                            country: (!prev.country || prev.country === 'Bangladesh') ? val : prev.country
                                                        }));
                                                    }}
                                                    placeholder="e.g. India, USA, Nepal, UK"
                                                />
                                            </div>
                                            <div className="space-y-0.5">
                                                <label className="text-[15px] font-semibold text-slate-600">Passport Issue Date</label>
                                                <CustomDatePicker
                                                    name="passportIssueDate"
                                                    value={formData.passportIssueDate}
                                                    onChange={handleInputChange}
                                                    placeholder="dd-mm-yyyy"
                                                />
                                            </div>
                                            <div className="space-y-0.5">
                                                <label className="text-[15px] font-semibold text-slate-600">Passport Expiry Date <span className="text-red-500">*</span></label>
                                                <CustomDatePicker
                                                    required={isForeign}
                                                    name="passportExpiryDate"
                                                    value={formData.passportExpiryDate}
                                                    onChange={handleInputChange}
                                                    placeholder="dd-mm-yyyy"
                                                />
                                            </div>
                                            <div className="space-y-0.5">
                                                <label className="text-[15px] font-semibold text-slate-600">Visa Type / Number</label>
                                                <input
                                                    name="visaNumber"
                                                    className="w-full px-2.5 py-1 border border-slate-200 bg-white rounded-md text-[16px] font-medium text-slate-900 focus:ring-1 focus:ring-teal-500 outline-none"
                                                    value={formData.visaNumber}
                                                    onChange={handleInputChange}
                                                    placeholder="e.g. Medical Visa / V-12345"
                                                />
                                            </div>
                                            <div className="space-y-0.5">
                                                <label className="text-[15px] font-semibold text-slate-600">Visa Valid Until</label>
                                                <CustomDatePicker
                                                    name="visaExpiryDate"
                                                    value={formData.visaExpiryDate}
                                                    onChange={handleInputChange}
                                                    placeholder="dd-mm-yyyy"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-1.5 border-t border-slate-100">
                                    <label className="text-[15px] font-bold text-slate-700 mb-1 block">
                                        Emergency Contact Details <span className="text-red-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                        <div className="space-y-0.5">
                                            <label className="text-[14px] font-semibold text-slate-600">Name</label>
                                            <input
                                                required
                                                name="emergencyName"
                                                className="w-full px-2.5 py-1 border border-slate-200 rounded-md text-[16px] font-medium text-slate-900 focus:ring-1 focus:ring-teal-500 outline-none"
                                                value={formData.emergencyName}
                                                onChange={handleInputChange}
                                                placeholder="Contact name"
                                            />
                                        </div>
                                        <div className="space-y-0.5">
                                            <label className="text-[14px] font-semibold text-slate-600">Relationship</label>
                                            <select
                                                required
                                                name="emergencyRelation"
                                                className="w-full px-2.5 py-1 border border-slate-200 rounded-md text-[16px] font-medium text-slate-900 bg-white focus:ring-1 focus:ring-teal-500 outline-none"
                                                value={formData.emergencyRelation}
                                                onChange={handleInputChange}
                                            >
                                                <option value="">Select Relation</option>
                                                <option value="Father">Father</option>
                                                <option value="Mother">Mother</option>
                                                <option value="Spouse">Spouse</option>
                                                <option value="Husband">Husband</option>
                                                <option value="Wife">Wife</option>
                                                <option value="Son">Son</option>
                                                <option value="Daughter">Daughter</option>
                                                <option value="Brother">Brother</option>
                                                <option value="Sister">Sister</option>
                                                <option value="Guardian">Guardian</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div className="space-y-0.5">
                                            <label className="text-[14px] font-semibold text-slate-600">Phone Number</label>
                                            <input
                                                required
                                                name="emergencyPhone"
                                                type="tel"
                                                className="w-full px-2.5 py-1 border border-slate-200 rounded-md text-[16px] font-medium text-slate-900 focus:ring-1 focus:ring-teal-500 outline-none"
                                                value={formData.emergencyPhone}
                                                onChange={handleInputChange}
                                                placeholder="01805567271"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* When NOT Foreign Patient, Residential Address Details is rendered full width below the two cards */}
                    {!isForeign && renderResidentialAddress(false)}
                </div>

                {/* Registration Payment & Actions */}
                <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-cyan-800 text-white py-2 px-4 md:px-5 border-t border-teal-900/30 relative overflow-hidden flex flex-wrap gap-4 items-center justify-between">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
                    <div className="relative z-10 flex flex-wrap items-center gap-4 sm:gap-6 flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2">
                            <span className="text-[14px] font-black uppercase tracking-wider text-teal-200">Registration Fee:</span>
                            <div className="flex items-center">
                                <span className="text-[18px] font-black text-cyan-200 mr-1">{currency === 'BDT' ? '৳' : '$'}</span>
                                <input
                                    name="registrationFee"
                                    type="number"
                                    className="bg-black/20 hover:bg-black/30 border border-white/20 focus:border-cyan-300 rounded px-2 py-0.5 text-[16px] font-bold text-white focus:ring-1 focus:ring-cyan-300 w-20 outline-none transition-all shadow-inner"
                                    value={formData.registrationFee}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        {/* Current Token Number Display (After Registration Fee) */}
                        <div className="flex items-center gap-2">
                            <span className="text-[14px] font-black uppercase tracking-wider text-teal-200">Token Number:</span>
                            <span className="bg-black/20 border border-white/20 rounded px-2.5 py-0.5 text-[16px] font-mono font-bold text-cyan-200 tracking-wider shadow-inner">
                                {currentTokenNumber}
                            </span>
                        </div>

                        {/* Current System Date Display (After Token Number) */}
                        <div className="flex items-center gap-2">
                            <span className="text-[14px] font-black uppercase tracking-wider text-teal-200">Date:</span>
                            <span className="bg-black/20 border border-white/20 rounded px-2.5 py-0.5 text-[16px] font-mono font-bold text-cyan-200 tracking-wider shadow-inner flex items-center gap-1.5">
                                <Calendar size={14} className="text-cyan-300" />
                                {systemDate}
                            </span>
                        </div>
                    </div>
                    <div className="relative z-10 flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                            type="button"
                            onClick={() => navigate('/patients')}
                            className="px-3.5 py-1.5 bg-black/20 hover:bg-black/30 border border-white/20 text-white/90 hover:text-white rounded-lg font-bold text-[16px] transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-1.5 bg-black/20 hover:bg-black/30 border border-white/20 text-white hover:text-white rounded-lg font-bold text-[16px] transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                            <Printer size={16} />
                            <span>Save & Print</span>
                        </button>
                    </div>
                </div>
            </form>

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

            {/* Access Denied Modal */}
            {showAccessDeniedModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden p-6 text-center space-y-4">
                        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shadow-xs">
                            <ShieldAlert size={30} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Access Restricted</h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Administrator authorization required to configure registration settings.
                            </p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 border border-slate-200/80 text-left space-y-1.5">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-slate-500">Your Current Role:</span>
                                <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">{role || 'User'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-slate-500">Required Role:</span>
                                <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">Admin / SuperAdmin</span>
                            </div>
                            <p className="text-[11px] text-slate-400 pt-1">
                                Contact your system administrator to adjust registration fees, PID counter sequences, routing counters, or slip headers.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowAccessDeniedModal(false)}
                            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                        >
                            Understood
                        </button>
                    </div>
                </div>
            )}

            {/* Registration Settings Modal */}
            {showSettingsModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
                    <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
                        {/* Modal Header */}
                        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl border border-teal-100 shadow-xs">
                                    <Settings size={22} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-slate-900 text-[16px] sm:text-[18px]">Registration Configuration & Settings</h3>
                                        <span className="bg-teal-100 text-teal-800 text-[11px] font-extrabold px-2 py-0.5 rounded-full border border-teal-200">
                                            {role}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium">Manage default registration fees, PID sequence, counter routing & slip headers</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowSettingsModal(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Success Notification Alert */}
                        {settingsSuccess && (
                            <div className="mx-4 sm:mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
                                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                                <span>{settingsSuccess}</span>
                            </div>
                        )}

                        {/* Settings Tabs */}
                        <div className="flex border-b border-slate-200 px-4 sm:px-6 pt-2 bg-slate-50/70 gap-2">
                            <button
                                type="button"
                                onClick={() => setSettingsTab('general')}
                                className={`pb-2.5 px-3 font-bold text-xs sm:text-sm flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${settingsTab === 'general'
                                    ? 'border-teal-600 text-teal-700 bg-white rounded-t-lg -mb-px'
                                    : 'border-transparent text-slate-500 hover:text-slate-800'
                                    }`}
                            >
                                <SlidersHorizontal size={14} />
                                <span>General & Fees</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setSettingsTab('rooms')}
                                className={`pb-2.5 px-3 font-bold text-xs sm:text-sm flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${settingsTab === 'rooms'
                                    ? 'border-teal-600 text-teal-700 bg-white rounded-t-lg -mb-px'
                                    : 'border-transparent text-slate-500 hover:text-slate-800'
                                    }`}
                            >
                                <Building2 size={14} />
                                <span>Counter Rooms ({rooms.length})</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setSettingsTab('slip')}
                                className={`pb-2.5 px-3 font-bold text-xs sm:text-sm flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${settingsTab === 'slip'
                                    ? 'border-teal-600 text-teal-700 bg-white rounded-t-lg -mb-px'
                                    : 'border-transparent text-slate-500 hover:text-slate-800'
                                    }`}
                            >
                                <Printer size={14} />
                                <span>Slip & Print Header</span>
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="p-4 sm:p-6 max-h-[65vh] overflow-y-auto">
                            {settingsTab === 'general' && (
                                <form onSubmit={handleSaveGeneralSettings} className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Default Fee */}
                                        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2">
                                            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                                                <DollarSign size={16} className="text-teal-600" />
                                                <span>Default Registration Fee</span>
                                            </div>
                                            <p className="text-[12px] text-slate-500">
                                                Amount charged to new patients upon OPD registration.
                                            </p>
                                            <div className="flex items-center gap-2 pt-1">
                                                <span className="font-bold text-slate-700 bg-slate-200 px-3 py-2 rounded-lg text-sm">{currency}</span>
                                                <input
                                                    type="number"
                                                    required
                                                    min="0"
                                                    value={modalFee}
                                                    onChange={(e) => setModalFee(e.target.value)}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                                                    placeholder="100"
                                                />
                                            </div>
                                        </div>

                                        {/* PID Sequence Adjustment */}
                                        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2">
                                            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                                                <Hash size={16} className="text-teal-600" />
                                                <span>Next PID Sequence Counter</span>
                                            </div>
                                            <p className="text-[12px] text-slate-500">
                                                Next auto-generated PID will be: <span className="font-mono font-bold text-teal-700">PID-{String(parseInt(modalNextPid, 10) || 1).padStart(6, '0')}</span>
                                            </p>
                                            <div className="flex items-center gap-2 pt-1">
                                                <span className="font-mono font-bold text-slate-700 bg-slate-200 px-3 py-2 rounded-lg text-sm">PID-</span>
                                                <input
                                                    type="number"
                                                    required
                                                    min="1"
                                                    value={modalNextPid}
                                                    onChange={(e) => setModalNextPid(e.target.value)}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none bg-white font-mono"
                                                    placeholder="1"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="flex justify-end pt-3 border-t border-slate-100">
                                        <button
                                            type="submit"
                                            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-md cursor-pointer active:scale-95"
                                        >
                                            <Save size={15} /> Save General Settings
                                        </button>
                                    </div>
                                </form>
                            )}

                            {settingsTab === 'rooms' && (
                                <div className="space-y-5">
                                    {/* Filter / Dept Tabs */}
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                                            {(['OPD', 'Camp', 'Lab', 'Diagnosis'] as const).map(dept => (
                                                <button
                                                    key={dept}
                                                    type="button"
                                                    onClick={() => setSettingsRoomDept(dept)}
                                                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${settingsRoomDept === dept
                                                        ? 'bg-teal-600 text-white shadow-xs'
                                                        : 'text-slate-600 hover:text-slate-900'
                                                        }`}
                                                >
                                                    {dept.toUpperCase()}
                                                </button>
                                            ))}
                                        </div>
                                        <span className="text-xs text-slate-400 font-medium">
                                            Showing {rooms.filter(r => r.type === settingsRoomDept).length} counter(s)
                                        </span>
                                    </div>

                                    {/* Rooms List */}
                                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                        {rooms.filter(r => r.type === settingsRoomDept).map(room => (
                                            <div key={room.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-xl hover:border-slate-300 transition-all">
                                                {editingRoomId === room.id ? (
                                                    <div className="flex items-center gap-2 flex-1 mr-3">
                                                        <input
                                                            type="text"
                                                            value={editingRoomNumber}
                                                            onChange={(e) => setEditingRoomNumber(e.target.value)}
                                                            className="w-20 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-1 focus:ring-teal-500 outline-none"
                                                            placeholder="No."
                                                        />
                                                        <input
                                                            type="text"
                                                            value={editingRoomName}
                                                            onChange={(e) => setEditingRoomName(e.target.value)}
                                                            className="flex-1 px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-1 focus:ring-teal-500 outline-none"
                                                            placeholder="Room Name"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-12 h-7 bg-teal-50 border border-teal-200 text-teal-700 rounded-md flex items-center justify-center font-bold text-xs font-mono">
                                                            {room.roomNumber}
                                                        </span>
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-800">{room.name}</p>
                                                            <p className="text-[11px] text-slate-400">Current load: {room.currentLoad || 0} patient(s)</p>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-1.5">
                                                    {editingRoomId === room.id ? (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSaveEditRoom(room.id)}
                                                                className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 border border-emerald-200 transition-all cursor-pointer"
                                                                title="Save"
                                                            >
                                                                <Check size={14} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditingRoomId(null)}
                                                                className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer"
                                                                title="Cancel"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleStartEditRoom(room)}
                                                                className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 border border-indigo-200 transition-all cursor-pointer"
                                                                title="Edit Room"
                                                            >
                                                                <Edit3 size={13} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteRoom(room.id)}
                                                                className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer"
                                                                title="Delete Room"
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {rooms.filter(r => r.type === settingsRoomDept).length === 0 && (
                                            <p className="text-xs text-slate-400 italic text-center py-4">No rooms configured for {settingsRoomDept}.</p>
                                        )}
                                    </div>

                                    {/* Add New Room Form */}
                                    <form onSubmit={handleAddSettingsRoom} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                                        <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                                            Add New Counter Room to <span className="text-teal-700">{settingsRoomDept}</span>
                                        </p>
                                        <div className="flex gap-2">
                                            <input
                                                required
                                                type="text"
                                                placeholder="Room No (e.g. 105)"
                                                value={settingsNewRoomNum}
                                                onChange={(e) => setSettingsNewRoomNum(e.target.value)}
                                                className="w-24 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-1 focus:ring-teal-500 outline-none"
                                            />
                                            <input
                                                required
                                                type="text"
                                                placeholder="Counter Name (e.g. Consultation Booth 5)"
                                                value={settingsNewRoomName}
                                                onChange={(e) => setSettingsNewRoomName(e.target.value)}
                                                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-1 focus:ring-teal-500 outline-none"
                                            />
                                            <button
                                                type="submit"
                                                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                                            >
                                                <Plus size={14} /> Add
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {settingsTab === 'slip' && (
                                <form onSubmit={handleSaveSlipSettings} className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-700">Hospital Legal Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={modalHospital.name}
                                            onChange={(e) => setModalHospital(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                                            placeholder="Visionary Care Eye Hospital"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-700">Speciality / Tagline</label>
                                        <input
                                            type="text"
                                            required
                                            value={modalHospital.tagline}
                                            onChange={(e) => setModalHospital(prev => ({ ...prev, tagline: e.target.value }))}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                                            placeholder="Specialist Ophthalmology & Microsurgery Center"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-700">Campus / Address</label>
                                            <input
                                                type="text"
                                                required
                                                value={modalHospital.address}
                                                onChange={(e) => setModalHospital(prev => ({ ...prev, address: e.target.value }))}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                                                placeholder="North Wing, Chittagong, Bangladesh"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-700">Hotline / Contact</label>
                                            <input
                                                type="text"
                                                required
                                                value={modalHospital.hotline}
                                                onChange={(e) => setModalHospital(prev => ({ ...prev, hotline: e.target.value }))}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                                                placeholder="+880 1800-000000"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-700">Patient Instructions / Slip Notice</label>
                                        <textarea
                                            rows={3}
                                            value={modalHospital.notice}
                                            onChange={(e) => setModalHospital(prev => ({ ...prev, notice: e.target.value }))}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                                            placeholder="Notice displayed at the bottom of the registration slip..."
                                        />
                                    </div>

                                    {/* Action Button */}
                                    <div className="flex justify-end pt-3 border-t border-slate-100">
                                        <button
                                            type="submit"
                                            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-md cursor-pointer active:scale-95"
                                        >
                                            <Save size={15} /> Save Header & Slip Information
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default Registration;
