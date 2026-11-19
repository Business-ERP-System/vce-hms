
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Save, User, Phone, MapPin, Calendar, FileText, CreditCard,
    Activity, Upload, Printer, CheckCircle, Eye, Info, UserCheck,
    ShieldCheck, DollarSign, Stethoscope, Briefcase, Map as MapIcon,
    FlaskConical, Microscope, Users, Home, Archive, Mail, Tag,
    ChevronRight, ArrowLeft, UserPlus, Plus, Trash2, Edit3, Check, X, Settings, Tent, ChevronDown, Globe
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Patient, PreviousVisionHistory, RoomMaster } from '../types';
import { useNavigate, useLocation } from 'react-router-dom';
import { MOCK_EMPLOYEES } from '../constants';
import { SearchableSelect } from '../components/SearchableSelect';
import { CustomDatePicker } from '../components/CustomDatePicker';
import { BANGLADESH_DIVISIONS, BANGLADESH_DISTRICTS, BANGLADESH_UPAZILLAS } from '../data/bangladeshGeo';

const Registration = () => {
    const { addPatient, updatePatient, getRecommendedOPDRoom, rooms, addRoom, deleteRoom, updateRoom, addTransaction, currency, hasPermission, campaigns } = useData();
    const { activeBranchId } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSuccess, setIsSuccess] = useState(false);
    const [registeredPatient, setRegisteredPatient] = useState<Patient | null>(null);
    const [registeredRoom, setRegisteredRoom] = useState<RoomMaster | null>(null);
    const [registeredToken, setRegisteredToken] = useState<string>('');
    const [registrationTimestamp, setRegistrationTimestamp] = useState<string>('');

    const handleResetForNewPatient = () => {
        setFormData({
            name: '', dob: '', ageYrs: '', ageMns: '0', ageDays: '0', gender: '',
            paymentCategory: 'Pay', speciality: 'Ophthalmology', patientType: 'New Patient',
            allocation: '', mrLocation: '', nextOfKin: '',
            emergencyName: '', emergencyRelation: '', emergencyPhone: '',
            village: '', postOffice: '', postCode: '', upazilla: '', district: '',
            state: '', country: 'Bangladesh', contact: '', altContact: '', email: '',
            remarks: '', registrationFee: '100', diagnosis: '', assignedDoctor: '', campaignId: '',
            passportNumber: '', passportCountry: '', passportIssueDate: '', passportExpiryDate: '',
            visaType: '', visaNumber: '', visaExpiryDate: ''
        });
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
        name: '', dob: '', ageYrs: '', ageMns: '0', ageDays: '0', gender: '',
        paymentCategory: 'Pay', speciality: 'Ophthalmology', patientType: 'New Patient',
        allocation: '', mrLocation: '', nextOfKin: '',
        emergencyName: '', emergencyRelation: '', emergencyPhone: '',
        village: '', postOffice: '', postCode: '', upazilla: '', district: '',
        state: '', country: 'Bangladesh', contact: '', altContact: '', email: '',
        remarks: '', registrationFee: '100', diagnosis: '', assignedDoctor: '', campaignId: '',
        passportNumber: '', passportCountry: '', passportIssueDate: '', passportExpiryDate: '',
        visaType: '', visaNumber: '', visaExpiryDate: ''
    });

    const isForeign = isForeignPatient || formData.patientType === 'Foreign Patient';

    const handleToggleForeign = () => {
        setIsForeignPatient(prev => {
            const next = !prev;
            setFormData(f => ({
                ...f,
                country: next ? (f.country === 'Bangladesh' ? '' : f.country) : 'Bangladesh',
                patientType: next ? 'Foreign Patient' : 'New Patient'
            }));
            return next;
        });
    };

    const [selectedRoomId, setSelectedRoomId] = useState<string>('');
    const targetRoomRef = useRef<HTMLSelectElement>(null);

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
                name: p.name, dob: p.dob || '', ageYrs: p.age.toString(), ageMns: (p.ageMonths || 0).toString(), ageDays: (p.ageDays || 0).toString(),
                gender: p.gender || '', paymentCategory: p.paymentCategory || '', speciality: p.speciality,
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
            const isF = value === 'Foreign Patient';
            setIsForeignPatient(isF);
            setFormData(prev => ({
                ...prev,
                patientType: value,
                country: isF ? (prev.country === 'Bangladesh' ? '' : prev.country) : 'Bangladesh'
            }));
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
            alert("Please select a Target Room before saving.");
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
        if (isForeignPatient) {
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
        const newId = location.state?.patient?.id || `PID-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
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

        if (isEditMode) {
            updatePatient(newId, newPatient);
        } else {
            addPatient(newPatient);
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
                <Home size={18} className="text-emerald-600" /> Residential Address Details
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
                                        Visionary Care Eye Hospital
                                    </h1>
                                    <p className="text-xs font-semibold text-teal-700 tracking-wide mt-1 uppercase">
                                        Specialist Ophthalmology & Microsurgery Center
                                    </p>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        North Wing, Chittagong, Bangladesh • Hotline: +880 1800-000000 • visionarycare.health
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
                                    {registeredPatient.age} Yrs {registeredPatient.ageMonths || 0} Mos {registeredPatient.ageDays ? `${registeredPatient.ageDays} Days ` : ''}/ {registeredPatient.gender || 'Not specified'}
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
                                    {[2,1,3,1,2,1,1,3,2,1,2,3,1,2,3,1,1,2,3,1,2,1,3,2,1,1,3,2,1,2,3,1,2].map((w, i) => (
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
                                <p>• Please wait in the waiting lounge near your assigned room.</p>
                                <p>• Keep this slip handy during preliminary vision testing & consultation.</p>
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
                            Visionary Care Eye Hospital • Computer Generated Patient Registration & Queue Token • Valid for Visit Date
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
                                            setServiceType(type.id as any);
                                            setSelectedRoomId('');
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
                            <span className="text-white font-semibold truncate max-w-xs">{rooms.find(r => r.id === selectedRoomId)?.name || 'Select a counter room'}</span>
                        </div>

                        <div className="flex items-center gap-2 ml-auto">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[14px] font-bold text-cyan-200 uppercase tracking-wider whitespace-nowrap">Target Room <span className="text-red-400">*</span></span>
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
                                        <option value="" className="text-slate-400 bg-white font-semibold py-1">Select Room</option>
                                        {rooms.filter(r => r.type === serviceType).map(r => (
                                            <option key={r.id} value={r.id} className="text-slate-900 bg-white font-semibold py-1">
                                                {r.roomNumber} - {r.name}
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
                                title="Manage Rooms"
                            >
                                <Settings size={14} />
                                <span className="hidden sm:inline">Rooms</span>
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
                                <h3 className="font-bold text-slate-900 text-[16px] flex items-center gap-1.5 border-b border-slate-100 pb-1.5 mb-0.5">
                                    <UserCheck size={18} className="text-teal-600" /> Patient Information
                                </h3>
                                <div className="grid grid-cols-1 gap-2">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        <div className="space-y-0.5">
                                            <label className="text-[15px] font-semibold text-slate-600">Full Legal Name <span className="text-red-500">*</span></label>
                                            <input required name="name" className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-[16px] font-medium text-slate-900 focus:ring-1 focus:ring-teal-500 outline-none transition-all" value={formData.name} onChange={handleInputChange} placeholder="Enter full name as per ID" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <label className="text-[15px] font-semibold text-slate-600">Patient Category <span className="text-red-500">*</span></label>
                                            <select
                                                required
                                                name="patientType"
                                                className="w-full px-2.5 py-1 border border-slate-200 rounded-md text-[16px] font-medium text-slate-900 bg-white focus:ring-1 focus:ring-teal-500 outline-none"
                                                value={formData.patientType}
                                                onChange={handleInputChange}
                                            >
                                                <option value="New Patient">New Patient</option>
                                                <option value="Returning / Old Patient">Returning / Old Patient</option>
                                                <option value="Referral">Referral</option>
                                                <option value="Camp Referral">Camp Referral</option>
                                                <option value="Corporate Account">Corporate Account</option>
                                                <option value="Foreign Patient">Foreign Patient</option>
                                            </select>
                                        </div>
                                    </div>
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
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="grid grid-cols-2 gap-1.5">
                                                <div className="space-y-0.5">
                                                    <label className="text-[15px] font-semibold text-slate-600">Years <span className="text-red-500">*</span></label>
                                                    <input required name="ageYrs" type="number" min="0" max="150" placeholder="Years" className="w-full px-2 py-1 border border-slate-200 rounded-md text-[16px] font-medium text-slate-900 bg-white focus:ring-1 focus:ring-teal-500 outline-none" value={formData.ageYrs} onChange={handleInputChange} />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <label className="text-[15px] font-semibold text-slate-600">Months</label>
                                                    <input name="ageMns" type="number" min="0" max="11" placeholder="Months" className="w-full px-2 py-1 border border-slate-200 rounded-md text-[16px] font-medium text-slate-900 bg-white focus:ring-1 focus:ring-teal-500 outline-none" value={formData.ageMns} onChange={handleInputChange} />
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
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-0.5">
                                            <label className="text-[15px] font-semibold text-slate-600">Gender <span className="text-red-500">*</span></label>
                                            <select required name="gender" className="w-full px-2.5 py-1 border border-slate-200 rounded-md text-[16px] font-medium text-slate-900 bg-white focus:ring-1 focus:ring-teal-500 outline-none" value={formData.gender} onChange={handleInputChange}>
                                                <option value="">Select Gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div className="space-y-0.5">
                                            <label className="text-[15px] font-semibold text-slate-600">Payment Category <span className="text-red-500">*</span></label>
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
                                        <input required name="contact" className="w-full px-2.5 py-1 border border-slate-200 rounded-md text-[16px] font-medium text-slate-900" value={formData.contact} onChange={handleInputChange} placeholder="Primary mobile" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <label className="text-[15px] font-semibold text-slate-600">Secondary Phone Number</label>
                                        <input name="altContact" className="w-full px-2.5 py-1 border border-slate-200 rounded-md text-[16px] font-medium text-slate-900" value={formData.altContact} onChange={handleInputChange} placeholder="Alternative mobile" />
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
                                                placeholder="Emergency mobile"
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
                    <div className="relative z-10 flex items-center gap-4 flex-1 min-w-[200px]">
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
                    </div>
                    <div className="relative z-10 flex items-center gap-2">
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
        </div >
    );
};

export default Registration;
