import React, { useState, useEffect } from 'react';
import {
    Settings, X, ShieldAlert, CheckCircle2, SlidersHorizontal,
    Building2, Printer, Hash, Plus, Edit3, Trash2,
    Check, ExternalLink, Save, Building, Users, RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { UserRole, RoomMaster } from '../types';
import { useNavigate } from 'react-router-dom';
import { BdtIcon } from './BdtIcon';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSettingsSaved?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSettingsSaved }) => {
    const { role } = useAuth();
    const { rooms, addRoom, updateRoom, deleteRoom, patients, currency, hasPermission, resetToDefaultPatients } = useData();
    const navigate = useNavigate();

    const isAuthorized = role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN || hasPermission('Patient Registration', 'edit') || hasPermission('System Settings', 'edit');

    const [settingsTab, setSettingsTab] = useState<'general' | 'hospital' | 'rooms' | 'admin'>('general');
    const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);

    // General & Fee states
    const [defaultFee, setDefaultFee] = useState<string>(() => {
        return localStorage.getItem('vce_default_reg_fee') || '100';
    });
    const [modalNextPid, setModalNextPid] = useState<string>('');

    // Hospital / Facility states
    const [hospitalInfo, setHospitalInfo] = useState({
        name: localStorage.getItem('vce_hospital_name') || 'Visionary Care HMS',
        address: localStorage.getItem('vce_hospital_address') || 'Main Campus - Dhaka',
        tagline: localStorage.getItem('vce_hospital_tagline') || 'Specialist Ophthalmology & Microsurgery Center',
        hotline: localStorage.getItem('vce_hospital_hotline') || '+880 1800-000000',
        notice: localStorage.getItem('vce_hospital_notice') || '• Please wait in the waiting lounge near your assigned room.\n• Keep this slip handy during preliminary vision testing & consultation.'
    });

    // Room management states
    const [roomDept, setRoomDept] = useState<'OPD' | 'Camp' | 'Lab' | 'Diagnosis'>('OPD');
    const [newRoomNum, setNewRoomNum] = useState('');
    const [newRoomName, setNewRoomName] = useState('');
    const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
    const [editingRoomNumber, setEditingRoomNumber] = useState('');
    const [editingRoomName, setEditingRoomName] = useState('');

    // Close Settings modal on Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Re-initialize state whenever modal opens
    useEffect(() => {
        if (isOpen) {
            setDefaultFee(localStorage.getItem('vce_default_reg_fee') || '100');
            setHospitalInfo({
                name: localStorage.getItem('vce_hospital_name') || 'Visionary Care HMS',
                address: localStorage.getItem('vce_hospital_address') || 'Main Campus - Dhaka',
                tagline: localStorage.getItem('vce_hospital_tagline') || 'Specialist Ophthalmology & Microsurgery Center',
                hotline: localStorage.getItem('vce_hospital_hotline') || '+880 1800-000000',
                notice: localStorage.getItem('vce_hospital_notice') || '• Please wait in the waiting lounge near your assigned room.\n• Keep this slip handy during preliminary vision testing & consultation.'
            });

            // Calculate current next PID
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
            setModalNextPid(String(max + 1));
            setSettingsSuccess(null);
        }
    }, [isOpen, patients]);

    if (!isOpen) return null;

    // Unauthorized Access Gate
    if (!isAuthorized) {
        return (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden p-6 text-center space-y-4">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shadow-xs">
                        <ShieldAlert size={30} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Access Restricted</h3>
                        <p className="text-xs text-slate-500 mt-1">
                            Administrator authorization required to configure system and hospital settings.
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
                            Please contact your system administrator or SuperAdmin to adjust hospital name, address, fees, or routing rooms.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                    >
                        Understood
                    </button>
                </div>
            </div>
        );
    }

    const handleSaveGeneral = (e: React.FormEvent) => {
        e.preventDefault();
        const cleanFee = defaultFee.trim() || '100';
        localStorage.setItem('vce_default_reg_fee', cleanFee);
        setDefaultFee(cleanFee);

        const parsedPid = parseInt(modalNextPid, 10);
        if (!isNaN(parsedPid) && parsedPid > 0) {
            localStorage.setItem('vce_pid_seq6', String(parsedPid - 1));
        }

        window.dispatchEvent(new CustomEvent('vce_settings_updated'));
        setSettingsSuccess('Registration fee & PID sequence counter updated successfully!');
        onSettingsSaved?.();
        setTimeout(() => setSettingsSuccess(null), 3500);
    };

    const handleSaveHospitalInfo = (e: React.FormEvent) => {
        e.preventDefault();
        const cleanName = hospitalInfo.name.trim() || 'Visionary Care HMS';
        const cleanAddress = hospitalInfo.address.trim() || 'Main Campus';

        localStorage.setItem('vce_hospital_name', cleanName);
        localStorage.setItem('vce_hospital_address', cleanAddress);
        localStorage.setItem('vce_hospital_tagline', hospitalInfo.tagline);
        localStorage.setItem('vce_hospital_hotline', hospitalInfo.hotline);
        localStorage.setItem('vce_hospital_notice', hospitalInfo.notice);

        // Dispatch global events so Patient Portal, Registration, TopBar, etc. update immediately in real-time
        window.dispatchEvent(new CustomEvent('vce_hospital_info_updated', {
            detail: { name: cleanName, address: cleanAddress }
        }));
        window.dispatchEvent(new Event('storage'));

        setSettingsSuccess('Hospital name & address updated! Changes are now automatically reflected across all pages and the Patient Portal.');
        onSettingsSaved?.();
        setTimeout(() => setSettingsSuccess(null), 3500);
    };

    const handleAddRoomSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRoomNum.trim() || !newRoomName.trim()) return;
        const newRoom: RoomMaster = {
            id: `R-${Date.now()}`,
            roomNumber: newRoomNum.trim(),
            name: newRoomName.trim(),
            type: roomDept,
            currentLoad: 0
        };
        addRoom(newRoom);
        setNewRoomNum('');
        setNewRoomName('');
        setSettingsSuccess(`Room ${newRoom.roomNumber} (${newRoom.name}) created for ${roomDept}!`);
        setTimeout(() => setSettingsSuccess(null), 3000);
    };

    const handleStartEditRoom = (room: RoomMaster) => {
        setEditingRoomId(room.id);
        setEditingRoomNumber(room.roomNumber);
        setEditingRoomName(room.name);
    };

    const handleSaveEditRoom = (id: string) => {
        if (!editingRoomNumber.trim() || !editingRoomName.trim()) return;
        updateRoom(id, {
            roomNumber: editingRoomNumber.trim(),
            name: editingRoomName.trim()
        });
        setEditingRoomId(null);
        setSettingsSuccess('Room details updated!');
        setTimeout(() => setSettingsSuccess(null), 2500);
    };

    const handleDeleteRoomClick = (id: string) => {
        if (confirm("Are you sure you want to delete this counter room?")) {
            deleteRoom(id);
            setSettingsSuccess('Room deleted successfully!');
            setTimeout(() => setSettingsSuccess(null), 2500);
        }
    };

    return (
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
                                <h3 className="font-bold text-slate-900 text-[16px] sm:text-[18px]">System & Hospital Settings</h3>
                                <span className="bg-teal-100 text-teal-800 text-[11px] font-extrabold px-2 py-0.5 rounded-full border border-teal-200">
                                    {role}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium">Configure hospital name, address, fees, rooms & automatic portal headers</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
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

                {/* Settings Navigation Tabs */}
                <div className="flex border-b border-slate-200 px-4 sm:px-6 pt-2 bg-slate-50/70 gap-2 overflow-x-auto">
                    <button
                        type="button"
                        onClick={() => setSettingsTab('hospital')}
                        className={`pb-2.5 px-3 font-bold text-xs sm:text-sm flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${settingsTab === 'hospital'
                            ? 'border-teal-600 text-teal-700 bg-white rounded-t-lg -mb-px'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                    >
                        <Building size={14} />
                        <span>Hospital Name & Address</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setSettingsTab('general')}
                        className={`pb-2.5 px-3 font-bold text-xs sm:text-sm flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${settingsTab === 'general'
                            ? 'border-teal-600 text-teal-700 bg-white rounded-t-lg -mb-px'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                    >
                        <SlidersHorizontal size={14} />
                        <span>Fees & PID Sequence</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setSettingsTab('rooms')}
                        className={`pb-2.5 px-3 font-bold text-xs sm:text-sm flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${settingsTab === 'rooms'
                            ? 'border-teal-600 text-teal-700 bg-white rounded-t-lg -mb-px'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                    >
                        <Building2 size={14} />
                        <span>Counter Rooms ({rooms.length})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setSettingsTab('admin')}
                        className={`pb-2.5 px-3 font-bold text-xs sm:text-sm flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${settingsTab === 'admin'
                            ? 'border-teal-600 text-teal-700 bg-white rounded-t-lg -mb-px'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                    >
                        <ExternalLink size={14} />
                        <span>User Roles & Permissions</span>
                    </button>
                </div>

                {/* Tab Content */}
                <div className="p-4 sm:p-6 max-h-[65vh] overflow-y-auto">
                    {/* Hospital Name & Address Tab */}
                    {settingsTab === 'hospital' && (
                        <form onSubmit={handleSaveHospitalInfo} className="space-y-4">
                            <div className="bg-teal-50/60 border border-teal-200/80 rounded-xl p-3.5 text-xs text-teal-900 flex items-start gap-2.5 mb-2">
                                <Building size={18} className="text-teal-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold">Automatic Multi-Screen Synchronization</p>
                                    <p className="text-[11px] text-teal-700 mt-0.5">
                                        Changing the hospital name or address here automatically updates the <strong>Patient Portal Header</strong>, <strong>Registration Card</strong>, <strong>Printed Slips</strong>, and <strong>Reports</strong> across the entire system.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700">
                                        Hospital / Institution Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={hospitalInfo.name}
                                        onChange={(e) => setHospitalInfo(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                                        placeholder="Visionary Care HMS"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700">
                                        Campus / Branch Address <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={hospitalInfo.address}
                                        onChange={(e) => setHospitalInfo(prev => ({ ...prev, address: e.target.value }))}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                                        placeholder="Main Campus - Dhaka"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700">Speciality / Tagline</label>
                                    <input
                                        type="text"
                                        value={hospitalInfo.tagline}
                                        onChange={(e) => setHospitalInfo(prev => ({ ...prev, tagline: e.target.value }))}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                                        placeholder="Specialist Ophthalmology & Microsurgery Center"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700">24/7 Hotline / Contact Phone</label>
                                    <input
                                        type="text"
                                        value={hospitalInfo.hotline}
                                        onChange={(e) => setHospitalInfo(prev => ({ ...prev, hotline: e.target.value }))}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                                        placeholder="+880 1800-000000"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700">Token Slip Instructions / Notice</label>
                                <textarea
                                    rows={2}
                                    value={hospitalInfo.notice}
                                    onChange={(e) => setHospitalInfo(prev => ({ ...prev, notice: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                                    placeholder="Notice displayed at the bottom of the registration slip..."
                                />
                            </div>

                            <div className="flex justify-end pt-3 border-t border-slate-100">
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-md cursor-pointer active:scale-95"
                                >
                                    <Save size={15} /> Save Hospital Name & Address
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Fees & PID Sequence Tab */}
                    {settingsTab === 'general' && (
                        <form onSubmit={handleSaveGeneral} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                                        <BdtIcon size={18} className="text-teal-600" />
                                        <span>Default Registration Fee</span>
                                    </div>
                                    <p className="text-[12px] text-slate-500">
                                        Amount automatically prefilled for new patient registrations.
                                    </p>
                                    <div className="flex items-center gap-2 pt-1">
                                        <span className="font-bold text-slate-700 bg-slate-200 px-3 py-2 rounded-lg text-sm">{currency}</span>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={defaultFee}
                                            onChange={(e) => setDefaultFee(e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                                            placeholder="100"
                                        />
                                    </div>
                                </div>

                                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                                        <Hash size={16} className="text-teal-600" />
                                        <span>Next PID Sequence Counter</span>
                                    </div>
                                    <p className="text-[12px] text-slate-500">
                                        Next auto-generated PID: <span className="font-mono font-bold text-teal-700">PID-{String(parseInt(modalNextPid, 10) || 1).padStart(6, '0')}</span>
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

                            {/* Patient Registry Master Sync */}
                            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                                        <Users size={16} className="text-teal-600" />
                                        <span>Hospital Patient Master Registry</span>
                                    </div>
                                    <p className="text-[12px] text-slate-500 mt-0.5">
                                        Sync or restore clean, unique Bangladeshi hospital patient records.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (resetToDefaultPatients) {
                                            resetToDefaultPatients();
                                            setSettingsSuccess('Patient list has been restored to unique hospital master records!');
                                            setTimeout(() => setSettingsSuccess(null), 3000);
                                        }
                                    }}
                                    className="px-3.5 py-2 bg-white border border-slate-300 text-slate-700 hover:text-teal-700 hover:border-teal-300 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                                >
                                    <RefreshCw size={13} />
                                    <span>Sync Hospital Patients</span>
                                </button>
                            </div>

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

                    {/* Counter Rooms Tab */}
                    {settingsTab === 'rooms' && (
                        <div className="space-y-5">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                                    {(['OPD', 'Camp', 'Lab', 'Diagnosis'] as const).map(dept => (
                                        <button
                                            key={dept}
                                            type="button"
                                            onClick={() => setRoomDept(dept)}
                                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${roomDept === dept
                                                ? 'bg-teal-600 text-white shadow-xs'
                                                : 'text-slate-600 hover:text-slate-900'
                                                }`}
                                        >
                                            {dept.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                                <span className="text-xs text-slate-400 font-medium">
                                    Showing {rooms.filter(r => r.type === roomDept).length} counter(s)
                                </span>
                            </div>

                            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                {rooms.filter(r => r.type === roomDept).map(room => (
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
                                                        onClick={() => handleDeleteRoomClick(room.id)}
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
                                {rooms.filter(r => r.type === roomDept).length === 0 && (
                                    <p className="text-xs text-slate-400 italic text-center py-4">No rooms configured for {roomDept}.</p>
                                )}
                            </div>

                            <form onSubmit={handleAddRoomSubmit} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                                    Add New Counter Room to <span className="text-teal-700">{roomDept}</span>
                                </p>
                                <div className="flex gap-2">
                                    <input
                                        required
                                        type="text"
                                        placeholder="Room No (e.g. 105)"
                                        value={newRoomNum}
                                        onChange={(e) => setNewRoomNum(e.target.value)}
                                        className="w-24 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-1 focus:ring-teal-500 outline-none"
                                    />
                                    <input
                                        required
                                        type="text"
                                        placeholder="Counter Name (e.g. Consultation Booth 5)"
                                        value={newRoomName}
                                        onChange={(e) => setNewRoomName(e.target.value)}
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

                    {/* Admin Roles Tab */}
                    {settingsTab === 'admin' && (
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h4 className="font-bold text-slate-900 text-sm">Full System Roles & Permissions Control Panel</h4>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Configure employee role permissions, user creation, module access overrides, and security policies.
                                    </p>
                                </div>
                                <span className="px-2.5 py-1 bg-teal-100 text-teal-800 font-bold text-xs rounded-lg">
                                    System Module
                                </span>
                            </div>
                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        onClose();
                                        navigate('/settings');
                                    }}
                                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                                >
                                    <ExternalLink size={15} /> Open System Roles & Security Manager
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

