import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData, normalizeRoomCategory, ROOM_CATEGORIES } from '../contexts/DataContext';
import { 
    LayoutDashboard, ShieldCheck, Users, Landmark, Stethoscope, SlidersHorizontal, 
    Settings, Database, Activity, Lock, Key, Eye, EyeOff, Search, Plus, Trash2, 
    Edit, Copy, RefreshCw, CheckCircle, AlertTriangle, AlertCircle, Clock, Save, 
    FileText, Check, X, ChevronRight, ChevronDown, Download, Printer, Shield, 
    Server, Terminal, Laptop, Smartphone, Mail, MessageSquare, Receipt, 
    DollarSign, Pill, Scissors, Compass, List, Grid, ShieldAlert, Sparkles, 
    Filter, ExternalLink, ArrowRight, ArrowLeft, History, RotateCcw, UserPlus, 
    UserCheck, Layers, BookOpen, GitBranch, FolderTree, FileSpreadsheet, Globe, 
    CheckSquare, Square, Share2, HelpCircle, HardDrive, Cpu, Radio, Wrench, Building,
    MoreVertical, LogOut, Phone, Power
} from 'lucide-react';
import { MENU_GROUPS, ALL_PERMISSION_ENTITIES } from '../constants';
import { UserRole, ModulePermissions, ActionPermission, RoomMaster, Employee } from '../types';

export const SystemSettingsDemo: React.FC = () => {
    const { role: currentUserRole, currentUser } = useAuth();
    const navigate = useNavigate();
    const { 
        employees, updateEmployee, addEmployee, deleteEmployee,
        rolesPermissions, updateRolePermissions, updateEmployeeCustomPermissions,
        availableRoles, addRole, deleteRole,
        rooms, updateRoom, toggleRoomActive, setCategoryRoomsActive, flowConfig, updateFlowConfig,
        billingItems, updateBillingItem, addBillingItem,
        patients, invoices, appointments, currency, formatCurrency
    } = useData();

    // Active Navigation Tab
    const [activeSection, setActiveSection] = useState<'overview' | 'organization' | 'roles_matrix' | 'staff_accounts' | 'rooms_clinics' | 'patient_flow' | 'ophthalmology_clinical' | 'investigations' | 'surgery_ot' | 'financial_billing' | 'pharmacy_optical' | 'documents_printing' | 'communications' | 'security_policy' | 'audit_compliance' | 'backup_database' | 'integrations' | 'general_settings' | 'change_management'>('overview');

    // Sub-view for Permission Matrix: 'role_view' | 'module_view' | 'user_view'
    const [permissionViewMode, setPermissionViewMode] = useState<'role_view' | 'module_view' | 'user_view'>('role_view');
    const [selectedRole, setSelectedRole] = useState<string>(UserRole.DOCTOR);
    const [selectedModule, setSelectedModule] = useState<string>('OPD Queue');
    const [selectedUserId, setSelectedUserId] = useState<string>(employees[0]?.id || '');
    const [permissionSearch, setPermissionSearch] = useState<string>('');
    const [globalSearch, setGlobalSearch] = useState<string>('');

    // Staff Account Administration State & Modals
    const [staffSearch, setStaffSearch] = useState<string>('');
    const [staffDeptFilter, setStaffDeptFilter] = useState<string>('All');
    const [staffRoleFilter, setStaffRoleFilter] = useState<string>('All');
    const [staffStatusFilter, setStaffStatusFilter] = useState<string>('All');
    const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);

    // Modals
    const [showCreateUserModal, setShowCreateUserModal] = useState<boolean>(false);
    const [showResetPasswordModal, setShowResetPasswordModal] = useState<boolean>(false);
    const [showUserDetailsModal, setShowUserDetailsModal] = useState<boolean>(false);
    const [showEditUserModal, setShowEditUserModal] = useState<boolean>(false);
    const [showLoginHistoryModal, setShowLoginHistoryModal] = useState<boolean>(false);
    const [showSelfPasswordChangeModal, setShowSelfPasswordChangeModal] = useState<boolean>(false);
    const [selectedEmployeeForAction, setSelectedEmployeeForAction] = useState<Employee | null>(null);

    // Password visibility toggles
    const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
    const [showResetTempPassword, setShowResetTempPassword] = useState<boolean>(false);

    // Create New User Form State
    const [newUserForm, setNewUserForm] = useState({
        name: '',
        employeeId: '',
        username: '',
        email: '',
        contact: '',
        designation: '',
        department: 'Clinical',
        branchId: 'BR001',
        assignedRoom: 'Room 10 (Consultation)',
        role: 'Doctor',
        additionalRole: '',
        password: '',
        confirmPassword: '',
        status: 'Active' as 'Active' | 'Inactive',
        forcePasswordChange: true,
        linkExisting: false,
        existingEmployeeId: ''
    });

    // Administrator Password Reset Form State
    const [resetPasswordForm, setResetPasswordForm] = useState({
        newPassword: '',
        confirmPassword: '',
        forcePasswordChange: true,
        terminateSessions: true,
        reason: 'User Forgotten Password'
    });

    // Self Password Change Form State
    const [selfPasswordForm, setSelfPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const generateSecurePassword = () => {
        const pool = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
        let pass = 'Vce#Eye2026!';
        for (let i = 0; i < 4; i++) {
            pass += pool.charAt(Math.floor(Math.random() * pool.length));
        }
        return pass;
    };

    const handleCreateUserSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUserForm.name || !newUserForm.username || !newUserForm.email || !newUserForm.role) {
            showNotice("Please fill in all mandatory fields (Name, Username, Email, Role).", "warning");
            return;
        }

        if (newUserForm.password !== newUserForm.confirmPassword) {
            showNotice("Passwords do not match. Please verify and re-enter.", "warning");
            return;
        }

        if (newUserForm.password.length < 8) {
            showNotice("Password must be at least 8 characters long.", "warning");
            return;
        }

        const usernameExists = employees.some(emp => emp.username?.toLowerCase() === newUserForm.username.toLowerCase());
        if (usernameExists) {
            showNotice(`Username '${newUserForm.username}' is already taken. Please choose another.`, "warning");
            return;
        }

        const assignedId = newUserForm.employeeId || `EMP-${Date.now().toString().slice(-4)}`;
        const newEmpRecord: Employee = {
            id: assignedId,
            branchId: newUserForm.branchId,
            name: newUserForm.name,
            username: newUserForm.username.toLowerCase(),
            email: newUserForm.email,
            contact: newUserForm.contact || '01700-000000',
            designation: newUserForm.designation || newUserForm.role,
            role: newUserForm.role,
            additionalRole: newUserForm.additionalRole || undefined,
            department: newUserForm.department,
            assignedRoom: newUserForm.assignedRoom,
            shift: 'Morning',
            status: newUserForm.status,
            joiningDate: new Date().toISOString().split('T')[0],
            lastLogin: 'Never',
            activeSessions: 0,
            forcePasswordChange: newUserForm.forcePasswordChange,
            salaryStructure: { basic: 40000, allowances: [], deductions: [] }
        };

        addEmployee(newEmpRecord);
        setDraftChangesCount(prev => prev + 1);
        setAuditLogs(prev => [
            { id: `AUD-${Date.now().toString().slice(-3)}`, timestamp: new Date().toLocaleTimeString(), user: currentUser?.name || 'SuperAdmin', action: 'USER_ACCOUNT_CREATED', module: 'Staff Administration', details: `Created user @${newUserForm.username} (${newUserForm.name}) with role '${newUserForm.role}'`, ip: '192.168.1.104', severity: 'Success' },
            ...prev
        ]);

        showNotice(`User account @${newUserForm.username} created successfully!`, "success");
        setShowCreateUserModal(false);
        setNewUserForm({
            name: '',
            employeeId: '',
            username: '',
            email: '',
            contact: '',
            designation: '',
            department: 'Clinical',
            branchId: 'BR001',
            assignedRoom: 'Room 10 (Consultation)',
            role: 'Doctor',
            additionalRole: '',
            password: '',
            confirmPassword: '',
            status: 'Active',
            forcePasswordChange: true,
            linkExisting: false,
            existingEmployeeId: ''
        });
    };

    const handleResetPasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmployeeForAction) return;

        if (!resetPasswordForm.newPassword || resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword) {
            showNotice("Passwords do not match or are empty.", "warning");
            return;
        }

        if (resetPasswordForm.newPassword.length < 8) {
            showNotice("Password must be at least 8 characters long.", "warning");
            return;
        }

        updateEmployee(selectedEmployeeForAction.id, {
            forcePasswordChange: resetPasswordForm.forcePasswordChange,
            activeSessions: resetPasswordForm.terminateSessions ? 0 : selectedEmployeeForAction.activeSessions
        });

        setAuditLogs(prev => [
            { id: `AUD-${Date.now().toString().slice(-3)}`, timestamp: new Date().toLocaleTimeString(), user: currentUser?.name || 'SuperAdmin', action: 'PASSWORD_RESET_ADMIN', module: 'Staff Administration', details: `Administrator reset password for ${selectedEmployeeForAction.name} (@${selectedEmployeeForAction.username || selectedEmployeeForAction.id}). Reason: ${resetPasswordForm.reason}`, ip: '192.168.1.104', severity: 'Warning' },
            ...prev
        ]);

        showNotice(`Password for ${selectedEmployeeForAction.name} successfully reset! Temporary credentials dispatched securely.`, "success");
        setShowResetPasswordModal(false);
        setSelectedEmployeeForAction(null);
        setResetPasswordForm({
            newPassword: '',
            confirmPassword: '',
            forcePasswordChange: true,
            terminateSessions: true,
            reason: 'User Forgotten Password'
        });
    };

    const handleSelfPasswordChangeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selfPasswordForm.currentPassword) {
            showNotice("Please enter your current password.", "warning");
            return;
        }
        if (selfPasswordForm.newPassword !== selfPasswordForm.confirmPassword) {
            showNotice("New passwords do not match.", "warning");
            return;
        }
        if (selfPasswordForm.newPassword.length < 8) {
            showNotice("New password must be at least 8 characters long.", "warning");
            return;
        }

        setAuditLogs(prev => [
            { id: `AUD-${Date.now().toString().slice(-3)}`, timestamp: new Date().toLocaleTimeString(), user: currentUser?.name || 'User', action: 'PASSWORD_CHANGED_SELF', module: 'Security', details: 'User updated their personal account password', ip: '192.168.1.104', severity: 'Info' },
            ...prev
        ]);

        showNotice("Your password has been changed successfully!", "success");
        setShowSelfPasswordChangeModal(false);
        setSelfPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    };

    const handleToggleLockAccount = (emp: Employee) => {
        if (emp.role === 'SuperAdmin' || emp.username === 'admin01') {
            showNotice("Protected Account: Super Administrator account cannot be locked.", "warning");
            return;
        }
        const nextStatus = emp.status === 'Locked' ? 'Active' : 'Locked';
        updateEmployee(emp.id, { status: nextStatus as any });
        setAuditLogs(prev => [
            { id: `AUD-${Date.now().toString().slice(-3)}`, timestamp: new Date().toLocaleTimeString(), user: currentUser?.name || 'SuperAdmin', action: nextStatus === 'Locked' ? 'ACCOUNT_LOCKED' : 'ACCOUNT_UNLOCKED', module: 'Staff Administration', details: `${nextStatus === 'Locked' ? 'Locked' : 'Unlocked'} account for ${emp.name}`, ip: '192.168.1.104', severity: 'Warning' },
            ...prev
        ]);
        showNotice(`Account for ${emp.name} is now ${nextStatus}.`, 'info');
        setActiveActionMenuId(null);
    };

    const handleToggleActiveAccount = (emp: Employee) => {
        if (emp.role === 'SuperAdmin' || emp.username === 'admin01') {
            showNotice("Protected Account: Super Administrator account cannot be deactivated.", "warning");
            return;
        }
        const nextStatus = emp.status === 'Active' ? 'Inactive' : 'Active';
        updateEmployee(emp.id, { status: nextStatus as any });
        setAuditLogs(prev => [
            { id: `AUD-${Date.now().toString().slice(-3)}`, timestamp: new Date().toLocaleTimeString(), user: currentUser?.name || 'SuperAdmin', action: 'ACCOUNT_STATUS_CHANGE', module: 'Staff Administration', details: `Changed status of ${emp.name} to ${nextStatus}`, ip: '192.168.1.104', severity: 'Info' },
            ...prev
        ]);
        showNotice(`Account for ${emp.name} is now ${nextStatus}.`, 'info');
        setActiveActionMenuId(null);
    };

    const handleTerminateSessions = (emp: Employee) => {
        updateEmployee(emp.id, { activeSessions: 0 });
        setAuditLogs(prev => [
            { id: `AUD-${Date.now().toString().slice(-3)}`, timestamp: new Date().toLocaleTimeString(), user: currentUser?.name || 'SuperAdmin', action: 'SESSIONS_TERMINATED', module: 'Staff Administration', details: `Terminated all active sessions for ${emp.name} (@${emp.username || emp.id})`, ip: '192.168.1.104', severity: 'Info' },
            ...prev
        ]);
        showNotice(`All active sessions for ${emp.name} have been terminated.`, 'success');
        setActiveActionMenuId(null);
    };

    // Edit User Form State & Handlers
    const [editUserForm, setEditUserForm] = useState({
        name: '',
        username: '',
        email: '',
        contact: '',
        designation: '',
        department: 'Clinical',
        branchId: 'BR001',
        assignedRoom: 'Room 10 (Consultation)',
        role: 'Doctor',
        additionalRole: '',
        status: 'Active' as 'Active' | 'Inactive' | 'Leave' | 'Terminated' | 'Locked',
        shift: 'Morning'
    });

    const openEditUserModal = (emp: Employee) => {
        setSelectedEmployeeForAction(emp);
        setEditUserForm({
            name: emp.name || '',
            username: emp.username || emp.id.toLowerCase(),
            email: emp.email || '',
            contact: emp.contact || '',
            designation: emp.designation || '',
            department: emp.department || 'Clinical',
            branchId: emp.branchId || 'BR001',
            assignedRoom: emp.assignedRoom || 'Room 10 (Consultation)',
            role: emp.role || 'Doctor',
            additionalRole: emp.additionalRole || '',
            status: (emp.status as any) || 'Active',
            shift: emp.shift || 'Morning'
        });
        setShowEditUserModal(true);
        setActiveActionMenuId(null);
    };

    const handleEditUserSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmployeeForAction) return;
        if (!editUserForm.name || !editUserForm.username || !editUserForm.email) {
            showNotice("Please fill in required fields (Name, Username, Email).", "warning");
            return;
        }
        updateEmployee(selectedEmployeeForAction.id, {
            name: editUserForm.name,
            username: editUserForm.username.toLowerCase(),
            email: editUserForm.email,
            contact: editUserForm.contact,
            designation: editUserForm.designation,
            department: editUserForm.department,
            branchId: editUserForm.branchId,
            assignedRoom: editUserForm.assignedRoom,
            role: editUserForm.role,
            additionalRole: editUserForm.additionalRole || undefined,
            status: editUserForm.status,
            shift: editUserForm.shift
        });
        setAuditLogs(prev => [
            { id: `AUD-${Date.now().toString().slice(-3)}`, timestamp: new Date().toLocaleTimeString(), user: currentUser?.name || 'SuperAdmin', action: 'USER_ACCOUNT_UPDATED', module: 'Staff Administration', details: `Updated user profile and credentials for @${editUserForm.username} (${editUserForm.name})`, ip: '192.168.1.104', severity: 'Info' },
            ...prev
        ]);
        showNotice(`User account for ${editUserForm.name} updated successfully!`, "success");
        setShowEditUserModal(false);
        setSelectedEmployeeForAction(null);
    };

    const calculatePasswordStrength = (pass: string) => {
        if (!pass) return { score: 0, label: 'None', color: 'bg-slate-200', text: 'text-slate-400' };
        let score = 0;
        if (pass.length >= 8) score += 1;
        if (pass.length >= 12) score += 1;
        if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
        if (/[0-9]/.test(pass)) score += 1;
        if (/[^A-Za-z0-9]/.test(pass)) score += 1;

        if (score <= 2) return { score, label: 'Weak', color: 'bg-rose-500', text: 'text-rose-600' };
        if (score <= 4) return { score, label: 'Medium', color: 'bg-amber-500', text: 'text-amber-600' };
        return { score, label: 'Strong (Secure)', color: 'bg-emerald-500', text: 'text-emerald-600' };
    };

    const filteredStaff = useMemo(() => {
        return employees.filter(emp => {
            const matchesSearch = !staffSearch || 
                emp.name?.toLowerCase().includes(staffSearch.toLowerCase()) ||
                emp.username?.toLowerCase().includes(staffSearch.toLowerCase()) ||
                emp.id?.toLowerCase().includes(staffSearch.toLowerCase()) ||
                emp.email?.toLowerCase().includes(staffSearch.toLowerCase()) ||
                emp.designation?.toLowerCase().includes(staffSearch.toLowerCase());
                
            const matchesDept = staffDeptFilter === 'All' || emp.department === staffDeptFilter;
            const matchesRole = staffRoleFilter === 'All' || emp.role === staffRoleFilter;
            const matchesStatus = staffStatusFilter === 'All' || 
                (staffStatusFilter === 'Active' && emp.status === 'Active') ||
                (staffStatusFilter === 'Inactive' && emp.status === 'Inactive') ||
                (staffStatusFilter === 'Locked' && emp.status === 'Locked');

            return matchesSearch && matchesDept && matchesRole && matchesStatus;
        });
    }, [employees, staffSearch, staffDeptFilter, staffRoleFilter, staffStatusFilter]);

    // Notification / Toast
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);
    const showNotice = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3500);
    };

    // Staged / Draft changes tracking for Section 19
    const [draftChangesCount, setDraftChangesCount] = useState<number>(0);
    const [showPublishModal, setShowPublishModal] = useState<boolean>(false);
    const [showDiffModal, setShowDiffModal] = useState<boolean>(false);

    // Room Configuration state
    const [roomCategoryFilter, setRoomCategoryFilter] = useState<string>('All');
    const [roomSearch, setRoomSearch] = useState<string>('');
    const [roomStatusFilter, setRoomStatusFilter] = useState<'All' | 'Enabled' | 'Disabled'>('All');
    const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
    const [roomViewMode, setRoomViewMode] = useState<'tile' | 'list'>(() => {
        try {
            const saved = localStorage.getItem('vce_room_view_mode');
            if (saved === 'tile' || saved === 'list') return saved;
        } catch {}
        return 'tile';
    });

    const handleSetRoomViewMode = (mode: 'tile' | 'list') => {
        setRoomViewMode(mode);
        try {
            localStorage.setItem('vce_room_view_mode', mode);
        } catch {}
    };

    const OFFICIAL_ROOM_CATEGORIES = useMemo(() => [
        {
            name: 'Visual Acuity Test (VAT)',
            icon: Eye,
            description: 'Designated initial vision testing rooms with automatic gender allocation (Male: 40, Female: 41)',
            badgeBg: 'bg-teal-50 text-teal-800 border-teal-200',
            iconColor: 'text-teal-600',
            headerBg: 'from-teal-500/10 via-teal-50/40 to-white'
        },
        {
            name: 'General Consultation Rooms',
            icon: Stethoscope,
            description: 'Primary general ophthalmologist consultation and clinical examination rooms',
            badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
            iconColor: 'text-blue-600',
            headerBg: 'from-blue-500/10 via-blue-50/40 to-white'
        },
        {
            name: 'Specialized Clinics',
            icon: Layers,
            description: 'Sub-specialty eye care clinics: Cataract (22), Retina (27), Glaucoma (21), Cornea (15)',
            badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
            iconColor: 'text-indigo-600',
            headerBg: 'from-indigo-500/10 via-indigo-50/40 to-white'
        },
        {
            name: 'Post-Operative Follow-up',
            icon: History,
            description: 'Second visit & surgical follow-up rooms matched to previous surgical procedures',
            badgeBg: 'bg-purple-50 text-purple-800 border-purple-200',
            iconColor: 'text-purple-600',
            headerBg: 'from-purple-500/10 via-purple-50/40 to-white'
        },
        {
            name: 'Billing Counters',
            icon: Receipt,
            description: 'Fee collection counters for refraction testing, diagnostics, and patient billing',
            badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
            iconColor: 'text-amber-600',
            headerBg: 'from-amber-500/10 via-amber-50/40 to-white'
        },
        {
            name: 'Refraction Rooms',
            icon: Compass,
            description: 'Automated round-robin sequence rooms for objective and subjective visual refraction',
            badgeBg: 'bg-cyan-50 text-cyan-800 border-cyan-200',
            iconColor: 'text-cyan-600',
            headerBg: 'from-cyan-500/10 via-cyan-50/40 to-white'
        },
        {
            name: 'Investigation Rooms',
            icon: Activity,
            description: 'Diagnostic investigation suites test-mapped for OCT, FFA, Perimetry, Biometry & B-Scan',
            badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
            iconColor: 'text-emerald-600',
            headerBg: 'from-emerald-500/10 via-emerald-50/40 to-white'
        }
    ], []);

    const toggleCategoryCollapse = (catName: string) => {
        setCollapsedCategories(prev => ({
            ...prev,
            [catName]: !prev[catName]
        }));
    };

    const expandAllCategories = () => setCollapsedCategories({});
    const collapseAllCategories = () => {
        const all: Record<string, boolean> = {};
        OFFICIAL_ROOM_CATEGORIES.forEach(c => { all[c.name] = true; });
        setCollapsedCategories(all);
    };

    // Audit logs state
    const [auditSearch, setAuditSearch] = useState<string>('');
    const [auditLogs, setAuditLogs] = useState([
        { id: 'AUD-901', timestamp: new Date(Date.now() - 1000 * 60 * 12).toLocaleTimeString(), user: 'Dr. Shafiqul Alam (SuperAdmin)', action: 'UPDATE_PERMISSION', module: 'E-Prescription', details: 'Added Finalize action to Consultant Ophthalmologist role', ip: '192.168.1.104', severity: 'Info' },
        { id: 'AUD-902', timestamp: new Date(Date.now() - 1000 * 60 * 45).toLocaleTimeString(), user: 'Dr. Shafiqul Alam (SuperAdmin)', action: 'AUTO_ALLOCATION_RULE', module: 'Patient Flow', details: 'Rotated Refraction Room Round-Robin sequence: 36 -> 37 -> 21-1 -> 21-2', ip: '192.168.1.104', severity: 'Info' },
        { id: 'AUD-903', timestamp: new Date(Date.now() - 1000 * 60 * 120).toLocaleTimeString(), user: 'System Watchdog', action: 'BACKUP_COMPLETED', module: 'Disaster Recovery', details: 'Encrypted snapshot backup vce_snapshot_20261128_auto.sql created (24.8 MB)', ip: '127.0.0.1', severity: 'Success' },
        { id: 'AUD-904', timestamp: new Date(Date.now() - 1000 * 60 * 240).toLocaleTimeString(), user: 'Security Daemon', action: 'LOGIN_FAILED', module: 'Authentication', details: 'Failed password attempt for user "finance_officer" from unrecognized IP', ip: '103.220.45.12', severity: 'Warning' },
        { id: 'AUD-905', timestamp: new Date(Date.now() - 1000 * 60 * 360).toLocaleTimeString(), user: 'Hospital Director', action: 'ROOM_STATUS_CHANGE', module: 'Facility Master', details: 'Room 21-2 (Refraction Unit) marked Active for Afternoon shift', ip: '192.168.1.115', severity: 'Info' },
    ]);

    // Live Metrics derived from real database
    const systemStats = useMemo(() => {
        const totalEmployees = employees.length;
        const activeEmployees = employees.filter(e => e.status !== 'Inactive').length;
        const totalRooms = rooms.length;
        const activeRooms = rooms.filter(r => r.isActive !== false).length;
        const consultRooms = rooms.filter(r => r.category === 'General Consultation' && r.isActive !== false).length;
        const billingCounters = rooms.filter(r => r.category === 'Billing Counter' && r.isActive !== false).length;
        const totalRoles = availableRoles.length;
        const activePatientsToday = patients.length;
        const totalInvoicesToday = invoices.length;

        return {
            totalEmployees,
            activeEmployees,
            totalRooms,
            activeRooms,
            consultRooms,
            billingCounters,
            totalRoles,
            activePatientsToday,
            totalInvoicesToday,
            backupHealth: 'Optimal (Last: 3h ago)',
            apiStatus: 'Online (5/5 Services Operational)'
        };
    }, [employees, rooms, availableRoles, patients, invoices]);

    // Navigation Menu items categorized
    const NAV_CATEGORIES = [
        {
            category: 'Core Management',
            items: [
                { id: 'overview', label: 'Administration Overview', icon: LayoutDashboard, badge: 'Live Telemetry' },
                { id: 'organization', label: 'Organization & Branches', icon: Landmark },
                { id: 'general_settings', label: 'General System Settings', icon: Settings },
            ]
        },
        {
            category: 'Security & Access Control',
            items: [
                { id: 'roles_matrix', label: 'User Roles & Permissions', icon: ShieldCheck, badge: '3-Way Matrix' },
                { id: 'staff_accounts', label: 'Staff Account Management', icon: Users },
                { id: 'security_policy', label: 'Security & Privacy Policy', icon: Lock },
            ]
        },
        {
            category: 'Facility & Patient Flow',
            items: [
                { id: 'rooms_clinics', label: 'Room, Clinic & Counter Master', icon: Building, badge: `${systemStats.activeRooms} Active` },
                { id: 'patient_flow', label: 'Patient Flow & Queue Engine', icon: Compass, badge: 'Round-Robin' },
            ]
        },
        {
            category: 'Ophthalmic Clinical Hub',
            items: [
                { id: 'ophthalmology_clinical', label: 'Ophthalmology Clinical Master', icon: Stethoscope },
                { id: 'investigations', label: 'Diagnostic Investigations', icon: Activity, badge: 'Test-to-Room' },
                { id: 'surgery_ot', label: 'Surgery & OT Configuration', icon: Scissors },
            ]
        },
        {
            category: 'Commercial & Financial',
            items: [
                { id: 'financial_billing', label: 'Billing & Tariff Policies', icon: Receipt },
                { id: 'pharmacy_optical', label: 'Pharmacy & Optical Master', icon: Pill },
            ]
        },
        {
            category: 'Governance & Operations',
            items: [
                { id: 'documents_printing', label: 'Documents & Print Templates', icon: Printer },
                { id: 'communications', label: 'Notifications & Messaging', icon: MessageSquare },
                { id: 'audit_compliance', label: 'Audit Trail & Compliance', icon: History, badge: 'Tamper-Proof' },
                { id: 'backup_database', label: 'Database & Disaster Recovery', icon: Database },
                { id: 'integrations', label: 'Integration & Medical APIs', icon: Server },
                { id: 'change_management', label: 'Change Management & Publishing', icon: GitBranch, badge: draftChangesCount > 0 ? `${draftChangesCount} Staged` : undefined },
            ]
        }
    ];

    // Permission toggle handler
    const handleTogglePermission = (roleName: string, entityName: string, action: keyof ActionPermission) => {
        const currentPerms: ModulePermissions = JSON.parse(JSON.stringify(rolesPermissions[roleName] || {}));
        if (!currentPerms[entityName]) {
            currentPerms[entityName] = { list: false, view: false, add: false, edit: false, delete: false, export: false, print: false };
        }
        currentPerms[entityName][action] = !currentPerms[entityName][action];
        updateRolePermissions(roleName, currentPerms);
        setDraftChangesCount(prev => prev + 1);
        showNotice(`Permission '${action.toUpperCase()}' on '${entityName}' updated for role '${roleName}'.`, 'info');
    };

    // Bulk toggle module
    const handleToggleWholeModule = (roleName: string, entityName: string, enable: boolean) => {
        const currentPerms: ModulePermissions = JSON.parse(JSON.stringify(rolesPermissions[roleName] || {}));
        currentPerms[entityName] = {
            list: enable, view: enable, add: enable, edit: enable, delete: enable, export: enable, print: enable
        };
        updateRolePermissions(roleName, currentPerms);
        setDraftChangesCount(prev => prev + 1);
        showNotice(`All permissions ${enable ? 'granted' : 'revoked'} for '${entityName}' under '${roleName}'.`, 'info');
    };

    // Copy permissions from role
    const handleCopyPermissions = (targetRole: string, sourceRole: string) => {
        if (!rolesPermissions[sourceRole]) return;
        const cloned = JSON.parse(JSON.stringify(rolesPermissions[sourceRole]));
        updateRolePermissions(targetRole, cloned);
        setDraftChangesCount(prev => prev + 1);
        showNotice(`Copied all permissions from '${sourceRole}' to '${targetRole}' successfully!`, 'success');
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-16">
            {/* Top Enterprise Banner & Demo Watermark */}
            <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-teal-500/30 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="p-2.5 bg-teal-500/20 text-teal-300 rounded-2xl border border-teal-400/30 shadow-inner">
                                <ShieldCheck size={26} />
                            </span>
                            <div>
                                <div className="flex items-center gap-2.5">
                                    <h1 className="text-2xl font-black tracking-tight text-white">System Settings & Control Panel</h1>
                                    <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider shadow-sm">
                                        Enterprise Redesign Demo
                                    </span>
                                </div>
                                <p className="text-xs text-teal-200/80 font-medium mt-0.5">
                                    Centralized Hospital Governance, RBAC Matrix, Patient Flow Engine & Security Master
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                        <button
                            onClick={() => {
                                setDraftChangesCount(prev => prev + 1);
                                showNotice("Draft changes saved locally in staging repository.", "info");
                            }}
                            className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold border border-white/20 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                        >
                            <Save size={14} className="text-teal-300" />
                            <span>Save as Draft</span>
                        </button>

                        <button
                            onClick={() => setShowDiffModal(true)}
                            className="px-4 py-2 bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 rounded-xl text-xs font-bold border border-teal-400/30 transition-all flex items-center gap-2 cursor-pointer"
                        >
                            <History size={14} />
                            <span>Compare Diff</span>
                        </button>

                        <button
                            onClick={() => setShowPublishModal(true)}
                            className="px-5 py-2 bg-teal-500 hover:bg-teal-600 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-teal-500/20"
                        >
                            <CheckCircle size={15} />
                            <span>Publish & Deploy</span>
                        </button>
                    </div>
                </div>

                {/* Live Breadcrumb & Environment Telemetry */}
                <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between text-xs text-teal-100/70 gap-2 font-mono">
                    <div className="flex items-center gap-2">
                        <span className="text-teal-400 font-bold">HQ Production Node:</span>
                        <span>VCE-HMS-CORE-01</span>
                        <span>•</span>
                        <span>Cluster: Cumilla & Dhaka Eye Hub</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Synchronized
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span>Active Sessions: <strong>{systemStats.activeEmployees}</strong></span>
                        <span>Rooms Online: <strong>{systemStats.activeRooms} / {systemStats.totalRooms}</strong></span>
                        <span>Operator: <strong>{currentUser?.name || 'SuperAdmin'}</strong></span>
                    </div>
                </div>
            </div>

            {/* Notification Toast */}
            {notification && (
                <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-lg animate-in slide-in-from-top duration-300 ${
                    notification.type === 'success' ? 'bg-teal-50 border-teal-200 text-teal-900' :
                    notification.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-900' :
                    'bg-slate-900 text-white border-slate-700'
                }`}>
                    <div className="flex items-center gap-2.5 text-xs font-bold">
                        <CheckCircle size={16} className={notification.type === 'success' ? 'text-teal-600' : 'text-amber-400'} />
                        <span>{notification.message}</span>
                    </div>
                    <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600 p-1">
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Main Layout: Categorized Sidebar on Left + Content Workspace on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Categorized Left Navigation Panel */}
                <div className="lg:col-span-3 bg-white rounded-3xl p-4 border border-slate-200 shadow-sm space-y-6 sticky top-20">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search configuration..."
                            value={globalSearch}
                            onChange={(e) => setGlobalSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>

                    <div className="space-y-5 max-h-[calc(100vh-220px)] overflow-y-auto custom-scrollbar pr-1">
                        {NAV_CATEGORIES.map((cat, cIdx) => (
                            <div key={cIdx} className="space-y-1.5">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3">
                                    {cat.category}
                                </h3>
                                <div className="space-y-1">
                                    {cat.items
                                        .filter(item => !globalSearch || item.label.toLowerCase().includes(globalSearch.toLowerCase()))
                                        .map(item => {
                                            const Icon = item.icon;
                                            const isActive = activeSection === item.id;
                                            return (
                                                <button
                                                    key={item.id}
                                                    onClick={() => setActiveSection(item.id as any)}
                                                    className={`w-full px-3 py-2.5 rounded-2xl text-left text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                                                        isActive
                                                            ? 'bg-slate-900 text-white shadow-md'
                                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2.5 truncate">
                                                        <Icon size={16} className={isActive ? 'text-teal-400' : 'text-slate-400'} />
                                                        <span className="truncate">{item.label}</span>
                                                    </div>
                                                    {item.badge && (
                                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                                                            isActive ? 'bg-teal-400/20 text-teal-300' : 'bg-slate-100 text-slate-500'
                                                        }`}>
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Workspace Pane */}
                <div className="lg:col-span-9 space-y-6">
                    {/* SECTION 1: ADMINISTRATION OVERVIEW */}
                    {activeSection === 'overview' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            {/* Executive Metric Cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
                                    <div className="flex justify-between items-center text-slate-400">
                                        <span className="text-xs font-bold uppercase tracking-wider">Total Staff</span>
                                        <Users size={18} className="text-teal-600" />
                                    </div>
                                    <div className="text-2xl font-black text-slate-900">{systemStats.totalEmployees}</div>
                                    <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                                        <CheckCircle size={12} /> {systemStats.activeEmployees} Active Accounts
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
                                    <div className="flex justify-between items-center text-slate-400">
                                        <span className="text-xs font-bold uppercase tracking-wider">Active Rooms</span>
                                        <Building size={18} className="text-indigo-600" />
                                    </div>
                                    <div className="text-2xl font-black text-slate-900">{systemStats.activeRooms} <span className="text-xs font-medium text-slate-400">/ {systemStats.totalRooms}</span></div>
                                    <div className="text-[11px] text-indigo-600 font-bold">
                                        {systemStats.consultRooms} Doctors • {systemStats.billingCounters} Billing
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
                                    <div className="flex justify-between items-center text-slate-400">
                                        <span className="text-xs font-bold uppercase tracking-wider">Configured Roles</span>
                                        <ShieldCheck size={18} className="text-purple-600" />
                                    </div>
                                    <div className="text-2xl font-black text-slate-900">{systemStats.totalRoles}</div>
                                    <div className="text-[11px] text-purple-600 font-bold">Granular RBAC Enforced</div>
                                </div>

                                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
                                    <div className="flex justify-between items-center text-slate-400">
                                        <span className="text-xs font-bold uppercase tracking-wider">System Health</span>
                                        <Activity size={18} className="text-emerald-500" />
                                    </div>
                                    <div className="text-2xl font-black text-emerald-600">99.98%</div>
                                    <div className="text-[11px] text-slate-500 font-bold">Backup: 3h ago (Verified)</div>
                                </div>
                            </div>

                            {/* Service Availability Matrix */}
                            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-base font-black text-slate-900">Hospital Microservice & Component Telemetry</h2>
                                        <p className="text-xs text-slate-500">Live operational availability status across eye hospital clusters</p>
                                    </div>
                                    <button 
                                        onClick={() => showNotice("All subsystem heartbeats polled and verified healthy.", "success")}
                                        className="p-2 text-slate-400 hover:text-teal-600 hover:bg-slate-50 rounded-xl"
                                        title="Poll Services"
                                    >
                                        <RefreshCw size={15} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {[
                                        { name: 'PostgreSQL Clinical DB', status: 'Healthy', latency: '4ms', load: '12%' },
                                        { name: 'Patient Queue Engine', status: 'Healthy', latency: '9ms', load: '18%' },
                                        { name: 'Round-Robin Refraction Router', status: 'Active', latency: '2ms', load: '5%' },
                                        { name: 'Thermal Slip Print Server', status: 'Ready', latency: '15ms', load: '8%' },
                                        { name: 'Ophthalmic DICOM/PACS Bridge', status: 'Synchronized', latency: '32ms', load: '21%' },
                                        { name: 'SMS & WhatsApp Gateway', status: 'Connected', latency: '84ms', load: '14%' },
                                    ].map((srv, idx) => (
                                        <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                                            <div>
                                                <div className="font-bold text-xs text-slate-800">{srv.name}</div>
                                                <div className="text-[10px] text-slate-500 font-mono">Ping: {srv.latency} • Load: {srv.load}</div>
                                            </div>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                                                {srv.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recent Governance & Security Activity Audit */}
                            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-base font-black text-slate-900">Recent Administrative Audit Events</h2>
                                        <p className="text-xs text-slate-500">Live tamper-resistant trace of system configuration modifications</p>
                                    </div>
                                    <button
                                        onClick={() => setActiveSection('audit_compliance')}
                                        className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
                                    >
                                        View Full Audit Trail <ArrowRight size={13} />
                                    </button>
                                </div>

                                <div className="divide-y divide-slate-100">
                                    {auditLogs.slice(0, 4).map((log) => (
                                        <div key={log.id} className="py-3 flex items-start justify-between gap-4">
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold">{log.id}</span>
                                                    <span className="font-bold text-xs text-slate-900">{log.action}</span>
                                                    <span className="text-[10px] text-slate-400 font-medium">({log.module})</span>
                                                </div>
                                                <p className="text-xs text-slate-600">{log.details}</p>
                                                <div className="text-[10px] text-slate-400 font-mono">Operator: {log.user} • IP: {log.ip}</div>
                                            </div>
                                            <span className="text-[11px] font-mono text-slate-400 shrink-0">{log.timestamp}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECTION 2: ORGANIZATION & BRANCH MANAGEMENT */}
                    {activeSection === 'organization' && (
                        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-lg font-black text-slate-900">Organization & Multi-Branch Architecture</h2>
                                    <p className="text-xs text-slate-500">Configure hospital entities, campus locations, clinical divisions & operating schedules</p>
                                </div>
                                <button
                                    onClick={() => showNotice("Add New Branch modal opened.", "info")}
                                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-slate-800"
                                >
                                    <Plus size={14} /> Add Campus / Branch
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { id: 'BR001', name: 'Visionary Eye Hospital - Main Campus', code: 'HQ-CUMILLA', address: 'Kandirpar, Cumilla', phone: '+880 1712-451435', depts: 8, doctors: 14, active: true },
                                    { id: 'BR002', name: 'Visionary Eye Center - Dhaka City Clinic', code: 'DHK-DHANMONDI', address: 'Road 8/A, Dhanmondi, Dhaka', phone: '+880 1843-551515', depts: 5, doctors: 7, active: true },
                                    { id: 'BR003', name: 'Visionary Community Vision Center', code: 'OUT-BARISHAL', address: 'Sadar Road, Barishal', phone: '+880 1824-342345', depts: 3, doctors: 3, active: true },
                                ].map((branch) => (
                                    <div key={branch.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="font-mono text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full">{branch.code}</span>
                                                <h3 className="font-black text-sm text-slate-900 mt-1">{branch.name}</h3>
                                                <p className="text-xs text-slate-500">{branch.address}</p>
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                                Active Node
                                            </span>
                                        </div>
                                        <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
                                            <span>{branch.depts} Departments • {branch.doctors} Clinical Staff</span>
                                            <button className="text-teal-600 font-bold hover:underline">Configure Schedules</button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Working Hours & Operating Schedules */}
                            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Hospital Operating Hours & Public Holidays</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                                        <span className="font-bold block text-slate-800">OPD Consultation Shift</span>
                                        <span className="text-slate-500">08:00 AM – 02:00 PM / 03:00 PM – 09:00 PM</span>
                                    </div>
                                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                                        <span className="font-bold block text-slate-800">Emergency & VAT Trauma</span>
                                        <span className="text-emerald-600 font-bold">24 Hours / 7 Days Continuous</span>
                                    </div>
                                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                                        <span className="font-bold block text-slate-800">Operation Theatre Schedule</span>
                                        <span className="text-slate-500">Saturday – Thursday (07:30 AM – 04:30 PM)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECTION 3: USER, ROLE & ACCESS CONTROL (3-WAY GRANULAR RBAC MATRIX) */}
                    {activeSection === 'roles_matrix' && (
                        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-black text-slate-900">Granular Role-Based Access Control (RBAC) Matrix</h2>
                                    <p className="text-xs text-slate-500">Enterprise 3-way permission management (Role-Based, Module-Based, and User Override Views)</p>
                                </div>

                                {/* View Switcher */}
                                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shrink-0">
                                    <button
                                        onClick={() => setPermissionViewMode('role_view')}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                            permissionViewMode === 'role_view' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                                        }`}
                                    >
                                        Role-Based View
                                    </button>
                                    <button
                                        onClick={() => setPermissionViewMode('module_view')}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                            permissionViewMode === 'module_view' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                                        }`}
                                    >
                                        Module Comparison
                                    </button>
                                    <button
                                        onClick={() => setPermissionViewMode('user_view')}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                            permissionViewMode === 'user_view' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                                        }`}
                                    >
                                        User Overrides
                                    </button>
                                </div>
                            </div>

                            {/* View 1: ROLE-BASED VIEW */}
                            {permissionViewMode === 'role_view' && (
                                <div className="space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                        <div className="flex items-center gap-3">
                                            <label className="text-xs font-black uppercase text-slate-500">Selected Role:</label>
                                            <select
                                                value={selectedRole}
                                                onChange={(e) => setSelectedRole(e.target.value)}
                                                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-teal-500"
                                            >
                                                {availableRoles.map(r => (
                                                    <option key={r} value={r}>{r}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    const source = prompt("Copy all permissions from which role?", "Consultant Ophthalmologist");
                                                    if (source && availableRoles.includes(source as any)) {
                                                        handleCopyPermissions(selectedRole, source);
                                                    }
                                                }}
                                                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 flex items-center gap-1.5"
                                            >
                                                <Copy size={13} /> Copy from Role
                                            </button>
                                            <button
                                                onClick={() => {
                                                    MENU_GROUPS.flatMap(g => g.items).forEach(i => handleToggleWholeModule(selectedRole, i.name, true));
                                                }}
                                                className="px-3 py-1.5 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 flex items-center gap-1.5"
                                            >
                                                <CheckSquare size={13} /> Select All
                                            </button>
                                            <button
                                                onClick={() => {
                                                    MENU_GROUPS.flatMap(g => g.items).forEach(i => handleToggleWholeModule(selectedRole, i.name, false));
                                                }}
                                                className="px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold hover:bg-rose-100 flex items-center gap-1.5"
                                            >
                                                <Square size={13} /> Clear All
                                            </button>
                                        </div>
                                    </div>

                                    {/* Granular Permission Table */}
                                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                                        <div className="p-3 bg-slate-100/60 border-b border-slate-200 flex justify-between items-center">
                                            <div className="relative w-64">
                                                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Filter modules..."
                                                    value={permissionSearch}
                                                    onChange={e => setPermissionSearch(e.target.value)}
                                                    className="w-full pl-8 pr-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none"
                                                />
                                            </div>
                                            <div className="text-[11px] text-slate-500 font-bold">
                                                Legend: <span className="font-mono text-teal-700 font-bold">L</span>-List • <span className="font-mono text-teal-700 font-bold">V</span>-View • <span className="font-mono text-teal-700 font-bold">A</span>-Add • <span className="font-mono text-teal-700 font-bold">E</span>-Edit • <span className="font-mono text-teal-700 font-bold">D</span>-Delete • <span className="font-mono text-teal-700 font-bold">X</span>-Export • <span className="font-mono text-teal-700 font-bold">P</span>-Print
                                            </div>
                                        </div>

                                        <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                                            <table className="w-full text-xs text-left">
                                                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 sticky top-0 z-10">
                                                    <tr>
                                                        <th className="px-4 py-3">Module / Subsystem</th>
                                                        <th className="px-2 py-3 text-center">List (L)</th>
                                                        <th className="px-2 py-3 text-center">View (V)</th>
                                                        <th className="px-2 py-3 text-center">Add (A)</th>
                                                        <th className="px-2 py-3 text-center">Edit (E)</th>
                                                        <th className="px-2 py-3 text-center">Delete (D)</th>
                                                        <th className="px-2 py-3 text-center">Export (X)</th>
                                                        <th className="px-2 py-3 text-center">Print (P)</th>
                                                        <th className="px-4 py-3 text-right">Row Quick</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {ALL_PERMISSION_ENTITIES
                                                        .filter(item => !permissionSearch || item.name.toLowerCase().includes(permissionSearch.toLowerCase()))
                                                        .map(entity => {
                                                            const rolePerms = rolesPermissions[selectedRole]?.[entity.name] || {
                                                                list: false, view: false, add: false, edit: false, delete: false, export: false, print: false
                                                            };
                                                            return (
                                                                <tr key={entity.name} className="hover:bg-slate-50/80 transition-colors">
                                                                    <td className="px-4 py-2.5 font-bold text-slate-800 flex items-center gap-2">
                                                                        <span>{entity.name}</span>
                                                                    </td>
                                                                    {(['list', 'view', 'add', 'edit', 'delete', 'export', 'print'] as (keyof ActionPermission)[]).map(act => (
                                                                        <td key={act} className="px-2 py-2.5 text-center">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={!!rolePerms[act]}
                                                                                onChange={() => handleTogglePermission(selectedRole, entity.name, act)}
                                                                                className="accent-teal-600 w-4 h-4 rounded cursor-pointer"
                                                                            />
                                                                        </td>
                                                                    ))}
                                                                    <td className="px-4 py-2.5 text-right">
                                                                        <button
                                                                            onClick={() => handleToggleWholeModule(selectedRole, entity.name, !Object.values(rolePerms).every(Boolean))}
                                                                            className="text-[10px] font-bold text-teal-600 hover:text-teal-800"
                                                                        >
                                                                            {Object.values(rolePerms).every(Boolean) ? 'Revoke All' : 'Grant All'}
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* View 2: MODULE-BASED COMPARISON VIEW */}
                            {permissionViewMode === 'module_view' && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                        <label className="text-xs font-black uppercase text-slate-500">Compare Roles on Module:</label>
                                        <select
                                            value={selectedModule}
                                            onChange={(e) => setSelectedModule(e.target.value)}
                                            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-teal-500"
                                        >
                                            {ALL_PERMISSION_ENTITIES.map(m => (
                                                <option key={m.name} value={m.name}>{m.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                                                <tr>
                                                    <th className="px-4 py-3">Role</th>
                                                    <th className="px-2 py-3 text-center">List</th>
                                                    <th className="px-2 py-3 text-center">View</th>
                                                    <th className="px-2 py-3 text-center">Add</th>
                                                    <th className="px-2 py-3 text-center">Edit</th>
                                                    <th className="px-2 py-3 text-center">Delete</th>
                                                    <th className="px-2 py-3 text-center">Export</th>
                                                    <th className="px-2 py-3 text-center">Print</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {availableRoles.map(r => {
                                                    const perms = rolesPermissions[r]?.[selectedModule] || { list: false, view: false, add: false, edit: false, delete: false, export: false, print: false };
                                                    return (
                                                        <tr key={r} className="hover:bg-slate-50/80">
                                                            <td className="px-4 py-2.5 font-bold text-slate-800">{r}</td>
                                                            {(['list', 'view', 'add', 'edit', 'delete', 'export', 'print'] as (keyof ActionPermission)[]).map(act => (
                                                                <td key={act} className="px-2 py-2.5 text-center">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={!!perms[act]}
                                                                        onChange={() => handleTogglePermission(r, selectedModule, act)}
                                                                        className="accent-teal-600 w-4 h-4 rounded cursor-pointer"
                                                                    />
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* View 3: USER-SPECIFIC OVERRIDE VIEW */}
                            {permissionViewMode === 'user_view' && (
                                <div className="space-y-4">
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <label className="text-xs font-black uppercase text-slate-500">Employee User:</label>
                                            <select
                                                value={selectedUserId}
                                                onChange={(e) => setSelectedUserId(e.target.value)}
                                                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-teal-500"
                                            >
                                                {employees.map(e => (
                                                    <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <button
                                            onClick={() => {
                                                updateEmployeeCustomPermissions(selectedUserId, undefined);
                                                showNotice("User overrides cleared. Reverted to base role permissions.", "info");
                                            }}
                                            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold"
                                        >
                                            Reset to Base Role
                                        </button>
                                    </div>

                                    <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl text-xs text-teal-900">
                                        <strong>User Access Principle:</strong> Individual permissions override base role policies. Changes are highlighted and logged in the security compliance trail.
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* SECTION 4: STAFF ACCOUNT MANAGEMENT */}
                    {activeSection === 'staff_accounts' && (
                        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
                            {/* Section Header */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h2 className="text-lg font-black text-slate-900">Staff Account Administration</h2>
                                    <p className="text-xs text-slate-500">Manage employee accounts, credentials, status, assigned counters, and active sessions</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowSelfPasswordChangeModal(true)}
                                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                                        title="Self-service password update for logged-in user"
                                    >
                                        <Key size={14} className="text-teal-600" /> Change My Password
                                    </button>
                                    <button
                                        onClick={() => setShowCreateUserModal(true)}
                                        className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 hover:bg-teal-700 shadow-lg shadow-teal-600/20 transition-all"
                                    >
                                        <UserPlus size={15} /> + Create New User
                                    </button>
                                </div>
                            </div>

                            {/* Top Summary KPI Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="p-4 bg-gradient-to-br from-indigo-50/80 to-indigo-100/40 rounded-2xl border border-indigo-100 flex items-center justify-between">
                                    <div>
                                        <div className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">Total System Users</div>
                                        <div className="text-2xl font-black text-indigo-950 mt-1">{employees.length}</div>
                                        <div className="text-[10px] text-indigo-700 mt-0.5">Across all branches & departments</div>
                                    </div>
                                    <div className="p-3 bg-white/80 rounded-xl text-indigo-600 shadow-xs">
                                        <Users size={22} />
                                    </div>
                                </div>

                                <div className="p-4 bg-gradient-to-br from-emerald-50/80 to-emerald-100/40 rounded-2xl border border-emerald-100 flex items-center justify-between">
                                    <div>
                                        <div className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">Active User Accounts</div>
                                        <div className="text-2xl font-black text-emerald-950 mt-1">
                                            {employees.filter(e => e.status === 'Active').length}
                                        </div>
                                        <div className="text-[10px] text-emerald-700 mt-0.5">Authorized for immediate system login</div>
                                    </div>
                                    <div className="p-3 bg-white/80 rounded-xl text-emerald-600 shadow-xs">
                                        <UserCheck size={22} />
                                    </div>
                                </div>

                                <div className="p-4 bg-gradient-to-br from-rose-50/80 to-rose-100/40 rounded-2xl border border-rose-100 flex items-center justify-between">
                                    <div>
                                        <div className="text-[11px] font-bold text-rose-900 uppercase tracking-wider">Inactive / Locked Accounts</div>
                                        <div className="text-2xl font-black text-rose-950 mt-1">
                                            {employees.filter(e => e.status !== 'Active').length}
                                        </div>
                                        <div className="text-[10px] text-rose-700 mt-0.5">
                                            {employees.filter(e => e.status === 'Locked').length} locked • {employees.filter(e => e.status === 'Inactive').length} inactive
                                        </div>
                                    </div>
                                    <div className="p-3 bg-white/80 rounded-xl text-rose-600 shadow-xs">
                                        <ShieldAlert size={22} />
                                    </div>
                                </div>
                            </div>

                            {/* Search and Filters Bar */}
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                                <div className="flex flex-col md:flex-row gap-3">
                                    <div className="relative flex-1">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search by name, username, employee ID, or designation..."
                                            value={staffSearch}
                                            onChange={e => setStaffSearch(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        />
                                        {staffSearch && (
                                            <button
                                                onClick={() => setStaffSearch('')}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                <X size={12} />
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <select
                                            value={staffDeptFilter}
                                            onChange={e => setStaffDeptFilter(e.target.value)}
                                            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-teal-500"
                                        >
                                            <option value="All">All Departments</option>
                                            <option value="Clinical">Clinical</option>
                                            <option value="Front Office">Front Office</option>
                                            <option value="Pharmacy">Pharmacy</option>
                                            <option value="Finance">Finance</option>
                                            <option value="Administration">Administration</option>
                                            <option value="HR">HR</option>
                                            <option value="Nursing">Nursing</option>
                                            <option value="Optical">Optical</option>
                                        </select>

                                        <select
                                            value={staffRoleFilter}
                                            onChange={e => setStaffRoleFilter(e.target.value)}
                                            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-teal-500"
                                        >
                                            <option value="All">All Roles</option>
                                            {availableRoles.map(r => (
                                                <option key={r.id} value={r.name}>{r.name}</option>
                                            ))}
                                        </select>

                                        <select
                                            value={staffStatusFilter}
                                            onChange={e => setStaffStatusFilter(e.target.value)}
                                            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-teal-500"
                                        >
                                            <option value="All">All Statuses</option>
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                            <option value="Locked">Locked</option>
                                        </select>

                                        {(staffSearch || staffDeptFilter !== 'All' || staffRoleFilter !== 'All' || staffStatusFilter !== 'All') && (
                                            <button
                                                onClick={() => {
                                                    setStaffSearch('');
                                                    setStaffDeptFilter('All');
                                                    setStaffRoleFilter('All');
                                                    setStaffStatusFilter('All');
                                                }}
                                                className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                                            >
                                                Reset Filters
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium px-1">
                                    <span>Showing <strong>{filteredStaff.length}</strong> of <strong>{employees.length}</strong> staff accounts</span>
                                    <span>Tip: Click the three-dot (<MoreVertical size={11} className="inline" />) menu on any user for actions like Password Reset, Role Assignment, or Session Termination.</span>
                                </div>
                            </div>

                            {/* Staff Accounts Table */}
                            <div className="border border-slate-200 rounded-2xl overflow-x-auto min-h-[360px] pb-12">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                                        <tr>
                                            <th className="px-4 py-3">Employee ID</th>
                                            <th className="px-4 py-3">Full Name & Username</th>
                                            <th className="px-4 py-3">Designation</th>
                                            <th className="px-4 py-3">Department & Branch</th>
                                            <th className="px-4 py-3">Assigned Role</th>
                                            <th className="px-4 py-3">Assigned Room / Counter</th>
                                            <th className="px-4 py-3">Last Login</th>
                                            <th className="px-4 py-3">Account Status</th>
                                            <th className="px-4 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredStaff.length === 0 ? (
                                            <tr>
                                                <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                                                    <Users size={32} className="mx-auto text-slate-300 mb-2" />
                                                    No user accounts match the selected filters or search keyword.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredStaff.map((emp) => {
                                                const isSuperAdmin = emp.role === 'SuperAdmin' || emp.username === 'admin01';
                                                return (
                                                    <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                                                        <td className="px-4 py-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                                                            {emp.id}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                                                {emp.name}
                                                                {isSuperAdmin && (
                                                                    <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[9px] font-black rounded uppercase">Admin</span>
                                                                )}
                                                            </div>
                                                            <div className="text-[11px] text-teal-700 font-mono font-semibold">
                                                                @{emp.username || emp.id.toLowerCase()}
                                                            </div>
                                                            <div className="text-[10px] text-slate-400">
                                                                {emp.email || `${emp.username || 'staff'}@vce-eye.org`}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                                                            {emp.designation || emp.role}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <div className="font-semibold text-slate-800">{emp.department}</div>
                                                            <div className="text-[10px] text-slate-400 font-mono">Branch: {emp.branchId || 'BR001'}</div>
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-mono font-bold text-[10px]">
                                                                {emp.role}
                                                            </span>
                                                            {emp.additionalRole && (
                                                                <span className="ml-1 px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[9px] font-bold">
                                                                    +{emp.additionalRole}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-700 font-mono text-[11px] whitespace-nowrap">
                                                            {emp.assignedRoom || <span className="text-slate-400 italic">Unassigned</span>}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <div className="text-slate-700 font-mono text-[11px]">{emp.lastLogin || 'Never'}</div>
                                                            {typeof emp.activeSessions === 'number' && emp.activeSessions > 0 && (
                                                                <div className="text-[10px] text-emerald-600 font-semibold">
                                                                    ● {emp.activeSessions} active session{emp.activeSessions > 1 ? 's' : ''}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            {emp.status === 'Active' ? (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                                    Active
                                                                </span>
                                                            ) : emp.status === 'Locked' ? (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800">
                                                                    <Lock size={10} /> Locked
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-600">
                                                                    Inactive
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-right whitespace-nowrap relative">
                                                            <div className="inline-block text-left">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setActiveActionMenuId(activeActionMenuId === emp.id ? null : emp.id);
                                                                    }}
                                                                    className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                                                                    title="Open Account Actions Menu"
                                                                >
                                                                    <MoreVertical size={15} />
                                                                </button>

                                                                {/* Dropdown Menu */}
                                                                {activeActionMenuId === emp.id && (
                                                                    <>
                                                                        <div 
                                                                            className="fixed inset-0 z-20" 
                                                                            onClick={() => setActiveActionMenuId(null)} 
                                                                        />
                                                                        <div className="absolute right-0 top-8 z-30 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 text-xs animate-in fade-in zoom-in-95">
                                                                            <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                                                Actions: @{emp.username || emp.id}
                                                                            </div>

                                                                            {/* 1. View User Details */}
                                                                            <button
                                                                                onClick={() => {
                                                                                    setSelectedEmployeeForAction(emp);
                                                                                    setShowUserDetailsModal(true);
                                                                                    setActiveActionMenuId(null);
                                                                                }}
                                                                                className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-semibold"
                                                                            >
                                                                                <Eye size={13} className="text-teal-600" /> View User Details
                                                                            </button>

                                                                            {/* 2. Edit User Account */}
                                                                            <button
                                                                                onClick={() => openEditUserModal(emp)}
                                                                                className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-semibold"
                                                                            >
                                                                                <Edit size={13} className="text-blue-600" /> Edit User Account
                                                                            </button>

                                                                            {/* 3. Manage Roles & Permissions */}
                                                                            <button
                                                                                onClick={() => {
                                                                                    setActiveSection('roles_matrix');
                                                                                    setSelectedUserId(emp.id);
                                                                                    setPermissionViewMode('user_view');
                                                                                    setActiveActionMenuId(null);
                                                                                    showNotice(`Jumped to RBAC Matrix for ${emp.name}`, 'info');
                                                                                }}
                                                                                className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-semibold"
                                                                            >
                                                                                <Shield size={13} className="text-indigo-600" /> Manage Roles & Permissions
                                                                            </button>

                                                                            <div className="my-1 border-t border-slate-100" />

                                                                            {/* 4. Reset Password */}
                                                                            <button
                                                                                onClick={() => {
                                                                                    setSelectedEmployeeForAction(emp);
                                                                                    setResetPasswordForm({
                                                                                        newPassword: '',
                                                                                        confirmPassword: '',
                                                                                        forcePasswordChange: true,
                                                                                        terminateSessions: true,
                                                                                        reason: 'User Forgotten Password'
                                                                                    });
                                                                                    setShowResetPasswordModal(true);
                                                                                    setActiveActionMenuId(null);
                                                                                }}
                                                                                className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-semibold"
                                                                            >
                                                                                <Key size={13} className="text-amber-600" /> Reset Password
                                                                            </button>

                                                                            {/* 5. Unlock / Lock Account */}
                                                                            <button
                                                                                onClick={() => handleToggleLockAccount(emp)}
                                                                                disabled={isSuperAdmin}
                                                                                className={`w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 font-semibold ${
                                                                                    isSuperAdmin ? 'text-slate-300 cursor-not-allowed' : emp.status === 'Locked' ? 'text-emerald-700' : 'text-amber-700'
                                                                                }`}
                                                                            >
                                                                                <Lock size={13} /> {emp.status === 'Locked' ? 'Unlock Account' : 'Lock Account'}
                                                                            </button>

                                                                            {/* 6. Activate / Deactivate Account */}
                                                                            <button
                                                                                onClick={() => handleToggleActiveAccount(emp)}
                                                                                disabled={isSuperAdmin}
                                                                                className={`w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 font-semibold ${
                                                                                    isSuperAdmin ? 'text-slate-300 cursor-not-allowed' : emp.status === 'Active' ? 'text-rose-700' : 'text-emerald-700'
                                                                                }`}
                                                                            >
                                                                                <Power size={13} /> {emp.status === 'Active' ? 'Deactivate Account' : 'Activate Account'}
                                                                            </button>

                                                                            <div className="my-1 border-t border-slate-100" />

                                                                            {/* 7. View Login History */}
                                                                            <button
                                                                                onClick={() => {
                                                                                    setSelectedEmployeeForAction(emp);
                                                                                    setShowLoginHistoryModal(true);
                                                                                    setActiveActionMenuId(null);
                                                                                }}
                                                                                className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-semibold"
                                                                            >
                                                                                <History size={13} className="text-slate-600" /> View Login History
                                                                            </button>

                                                                            {/* 8. Terminate Active Sessions */}
                                                                            <button
                                                                                onClick={() => handleTerminateSessions(emp)}
                                                                                className="w-full px-3 py-2 text-left hover:bg-rose-50 flex items-center gap-2 text-rose-700 font-semibold"
                                                                            >
                                                                                <LogOut size={13} /> Terminate Active Sessions
                                                                            </button>
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* SECTION 5: ROOM, CLINIC & COUNTER MASTER - CATEGORY-WISE */}
                    {activeSection === 'rooms_clinics' && (
                        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
                            {/* Section Header */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-black text-slate-900">Room Configuration – Category-Wise Room Management</h2>
                                    <p className="text-xs text-slate-500">Grouped room hierarchy, category-level controls, individual enable/disable toggles & queue routing integration</p>
                                </div>
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    {/* View Mode Switcher: List View vs Tile View */}
                                    <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
                                        <button
                                            type="button"
                                            onClick={() => handleSetRoomViewMode('list')}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                                roomViewMode === 'list'
                                                    ? 'bg-white text-teal-700 shadow-xs'
                                                    : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                            title="Switch to Category-wise List View"
                                        >
                                            <List size={14} />
                                            <span>List View</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleSetRoomViewMode('tile')}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                                roomViewMode === 'tile'
                                                    ? 'bg-white text-teal-700 shadow-xs'
                                                    : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                            title="Switch to Responsive Tile / Grid View"
                                        >
                                            <Grid size={14} />
                                            <span>Tile View</span>
                                        </button>
                                    </div>

                                    {/* Expand / Collapse Actions */}
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={expandAllCategories}
                                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                                            title="Expand all room categories"
                                        >
                                            Expand All
                                        </button>
                                        <button
                                            type="button"
                                            onClick={collapseAllCategories}
                                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                                            title="Collapse all room categories"
                                        >
                                            Collapse All
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Top Summary KPI Cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100/60 rounded-2xl border border-slate-200">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Rooms</div>
                                    <div className="text-2xl font-black text-slate-900 mt-1">{rooms.length}</div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">Across all departments</div>
                                </div>

                                <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/40 rounded-2xl border border-emerald-200">
                                    <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Enabled Rooms</div>
                                    <div className="text-2xl font-black text-emerald-950 mt-1">
                                        {rooms.filter(r => r.isActive !== false).length}
                                    </div>
                                    <div className="text-[10px] text-emerald-700 mt-0.5 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active in queue allocation
                                    </div>
                                </div>

                                <div className="p-4 bg-gradient-to-br from-rose-50 to-rose-100/40 rounded-2xl border border-rose-200">
                                    <div className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Disabled Rooms</div>
                                    <div className="text-2xl font-black text-rose-950 mt-1">
                                        {rooms.filter(r => r.isActive === false).length}
                                    </div>
                                    <div className="text-[10px] text-rose-700 mt-0.5">Excluded from patient routing</div>
                                </div>

                                <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100/40 rounded-2xl border border-indigo-200">
                                    <div className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">Room Categories</div>
                                    <div className="text-2xl font-black text-indigo-950 mt-1">{OFFICIAL_ROOM_CATEGORIES.length}</div>
                                    <div className="text-[10px] text-indigo-700 mt-0.5">7 specialized categories</div>
                                </div>
                            </div>

                            {/* Search & Filter Toolbar */}
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                                <div className="flex flex-col md:flex-row gap-3">
                                    <div className="relative flex-1">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search by room number (e.g. 40, 9-A), name (e.g. Cataract Clinic), or specialty..."
                                            value={roomSearch}
                                            onChange={e => setRoomSearch(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        />
                                        {roomSearch && (
                                            <button
                                                onClick={() => setRoomSearch('')}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                <X size={12} />
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <select
                                            value={roomCategoryFilter}
                                            onChange={e => setRoomCategoryFilter(e.target.value)}
                                            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-teal-500"
                                        >
                                            <option value="All">All Categories ({OFFICIAL_ROOM_CATEGORIES.length})</option>
                                            {OFFICIAL_ROOM_CATEGORIES.map(c => (
                                                <option key={c.name} value={c.name}>{c.name}</option>
                                            ))}
                                        </select>

                                        <select
                                            value={roomStatusFilter}
                                            onChange={e => setRoomStatusFilter(e.target.value as any)}
                                            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-teal-500"
                                        >
                                            <option value="All">All Statuses</option>
                                            <option value="Enabled">Enabled Only</option>
                                            <option value="Disabled">Disabled Only</option>
                                        </select>

                                        {(roomSearch || roomCategoryFilter !== 'All' || roomStatusFilter !== 'All') && (
                                            <button
                                                onClick={() => {
                                                    setRoomSearch('');
                                                    setRoomCategoryFilter('All');
                                                    setRoomStatusFilter('All');
                                                }}
                                                className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                                            >
                                                Reset Filters
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium px-1">
                                    <span>Hierarchical View: Grouped into 7 designated eye hospital clinical & administrative categories</span>
                                    <span>Changes are saved permanently in database and automatically sync to patient registration and queue allocation</span>
                                </div>
                            </div>

                            {/* Exclusion Policy Information Alert */}
                            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
                                <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <strong>Automatic Queue & Allocation Exclusion:</strong> When any room is <strong>Disabled</strong>, the Patient Flow engine, Registration counter selector, VAT gender auto-assignment, Round-Robin refraction sequence, and specialized clinic routing will automatically bypass that room and distribute patients to remaining active rooms.
                                </div>
                            </div>

                            {/* Category-Wise Hierarchical Room Sections */}
                            <div className="space-y-4">
                                {OFFICIAL_ROOM_CATEGORIES
                                    .filter(cat => roomCategoryFilter === 'All' || cat.name === roomCategoryFilter)
                                    .map(cat => {
                                        const CatIcon = cat.icon;
                                        // Filter rooms belonging to this category
                                        const allCategoryRooms = rooms.filter(r => normalizeRoomCategory(r.category) === cat.name || r.category === cat.name);
                                        const filteredCategoryRooms = allCategoryRooms.filter(r => {
                                            const matchesSearch = !roomSearch ||
                                                (r.name && r.name.toLowerCase().includes(roomSearch.toLowerCase())) ||
                                                (r.roomNumber && r.roomNumber.toLowerCase().includes(roomSearch.toLowerCase())) ||
                                                (r.specialty && r.specialty.toLowerCase().includes(roomSearch.toLowerCase())) ||
                                                (r.genderSpecific && r.genderSpecific.toLowerCase().includes(roomSearch.toLowerCase()));

                                            const matchesStatus = roomStatusFilter === 'All' ||
                                                (roomStatusFilter === 'Enabled' && r.isActive !== false) ||
                                                (roomStatusFilter === 'Disabled' && r.isActive === false);

                                            return matchesSearch && matchesStatus;
                                        });

                                        const enabledCount = allCategoryRooms.filter(r => r.isActive !== false).length;
                                        const totalCount = allCategoryRooms.length;
                                        const isAllCategoryEnabled = totalCount > 0 && enabledCount === totalCount;
                                        const isCollapsed = !!collapsedCategories[cat.name];

                                        if (roomSearch && filteredCategoryRooms.length === 0) {
                                            return null;
                                        }

                                        return (
                                            <div
                                                key={cat.name}
                                                className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs hover:border-slate-300 transition-all"
                                            >
                                                {/* Category Section Header */}
                                                <div
                                                    onClick={() => toggleCategoryCollapse(cat.name)}
                                                    className={`px-5 py-3.5 bg-gradient-to-r ${cat.headerBg} border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            type="button"
                                                            className="p-1 hover:bg-slate-200/60 rounded-lg text-slate-500 transition-colors"
                                                            title={isCollapsed ? "Expand Category" : "Collapse Category"}
                                                        >
                                                            {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                                                        </button>

                                                        <div className={`p-2 rounded-xl bg-white shadow-xs ${cat.iconColor}`}>
                                                            <CatIcon size={18} />
                                                        </div>

                                                        <div>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <h3 className="text-sm font-black text-slate-900 tracking-tight">
                                                                    {cat.name}
                                                                </h3>
                                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cat.badgeBg}`}>
                                                                    {totalCount} {totalCount === 1 ? 'Room' : 'Rooms'} ({enabledCount} Enabled)
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] text-slate-500 mt-0.5">{cat.description}</p>
                                                        </div>
                                                    </div>

                                                    {/* Category-Level Enable / Disable Switch */}
                                                    <div
                                                        className="flex items-center gap-2.5 sm:self-center self-end pl-8 sm:pl-0"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <span className="text-[11px] font-bold text-slate-500">
                                                            Category Control:
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const nextState = !isAllCategoryEnabled;
                                                                if (setCategoryRoomsActive) {
                                                                    setCategoryRoomsActive(cat.name, nextState);
                                                                } else {
                                                                    allCategoryRooms.forEach(r => updateRoom(r.id, { isActive: nextState }));
                                                                }
                                                                showNotice(`${nextState ? 'Enabled' : 'Disabled'} all rooms in ${cat.name}.`, nextState ? 'success' : 'warning');
                                                            }}
                                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                                                                isAllCategoryEnabled
                                                                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                            }`}
                                                            title={`Click to ${isAllCategoryEnabled ? 'Disable' : 'Enable'} all rooms in ${cat.name}`}
                                                        >
                                                            <Power size={13} />
                                                            <span>{isAllCategoryEnabled ? 'Disable All' : 'Enable All'}</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Rooms List / Grid in this Category */}
                                                {!isCollapsed && (
                                                    <div className="p-4 sm:p-5">
                                                        {filteredCategoryRooms.length === 0 ? (
                                                            <div className="py-6 text-center text-xs text-slate-400 italic">
                                                                No rooms in this category match your search criteria.
                                                            </div>
                                                        ) : roomViewMode === 'tile' ? (
                                                            /* 1. TILE VIEW (GRID VIEW) */
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                                                                {filteredCategoryRooms.map(room => {
                                                                    const isEnabled = room.isActive !== false;
                                                                    const roomDisplayNumber = room.roomNumber || room.number || room.id;

                                                                    return (
                                                                        <div
                                                                            key={room.id}
                                                                            className={`p-3.5 rounded-2xl transition-all duration-200 border flex flex-col justify-between min-h-[145px] space-y-3 ${
                                                                                isEnabled
                                                                                    ? 'bg-white border-slate-200 hover:border-teal-400/80 hover:shadow-xs'
                                                                                    : 'bg-slate-50/70 border-slate-200/60 opacity-75'
                                                                            }`}
                                                                        >
                                                                            <div className="space-y-2">
                                                                                <div className="flex items-start justify-between gap-2">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-black text-xs shadow-xs shrink-0 ${
                                                                                            isEnabled
                                                                                                ? 'bg-slate-900 text-teal-300'
                                                                                                : 'bg-slate-200 text-slate-500'
                                                                                        }`}>
                                                                                            {roomDisplayNumber}
                                                                                        </span>
                                                                                        <div className="min-w-0">
                                                                                            <div className="flex items-center gap-1.5">
                                                                                                <div className={`p-1 rounded-md bg-slate-100 ${cat.iconColor} shrink-0`}>
                                                                                                    <CatIcon size={12} />
                                                                                                </div>
                                                                                                <h4 className={`font-bold text-xs leading-tight truncate ${
                                                                                                    isEnabled ? 'text-slate-900' : 'text-slate-500 line-through decoration-slate-300'
                                                                                                }`}>
                                                                                                    {room.name || `Room ${roomDisplayNumber}`}
                                                                                                </h4>
                                                                                            </div>
                                                                                            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                                                                                                ID: {room.id}
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* Room Status Indicator Badge */}
                                                                                    {isEnabled ? (
                                                                                        <span className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                                                            Enabled
                                                                                        </span>
                                                                                    ) : (
                                                                                        <span className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-slate-200 text-slate-600">
                                                                                            Disabled
                                                                                        </span>
                                                                                    )}
                                                                                </div>

                                                                                {/* Metadata Tags */}
                                                                                <div className="flex flex-wrap gap-1 text-[10px]">
                                                                                    {room.genderSpecific && (
                                                                                        <span className="px-1.5 py-0.5 bg-teal-50 text-teal-700 font-semibold rounded">
                                                                                            {room.genderSpecific} Only
                                                                                        </span>
                                                                                    )}
                                                                                    {room.specialty && (
                                                                                        <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 font-semibold rounded">
                                                                                            Specialty: {room.specialty}
                                                                                        </span>
                                                                                    )}
                                                                                    {room.testCodes && room.testCodes.length > 0 && (
                                                                                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-semibold rounded truncate max-w-[170px]" title={room.testCodes.join(', ')}>
                                                                                            Tests: {room.testCodes.slice(0, 2).join(', ')}{room.testCodes.length > 2 ? '...' : ''}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            {/* Card Footer: Location info & Enable/Disable Toggle */}
                                                                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                                                                                <span className="text-slate-400 text-[10px]">
                                                                                    {room.floor || '1st Floor'} • Cap: {room.capacity || 20}
                                                                                </span>

                                                                                {/* Enable / Disable Toggle Switch */}
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <span className={`text-[10px] font-bold ${isEnabled ? 'text-teal-700' : 'text-slate-400'}`}>
                                                                                        {isEnabled ? 'Active' : 'Off'}
                                                                                    </span>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => {
                                                                                            const nextState = !isEnabled;
                                                                                            updateRoom(room.id, { isActive: nextState });
                                                                                            showNotice(`Room ${roomDisplayNumber} (${room.name}) is now ${nextState ? 'Enabled' : 'Disabled'}.`, nextState ? 'success' : 'warning');
                                                                                        }}
                                                                                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                                                            isEnabled ? 'bg-teal-600' : 'bg-slate-300'
                                                                                        }`}
                                                                                        title={isEnabled ? "Click to Disable Room" : "Click to Enable Room"}
                                                                                    >
                                                                                        <span
                                                                                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                                                                                isEnabled ? 'translate-x-4' : 'translate-x-0'
                                                                                            }`}
                                                                                        />
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : (
                                                            /* 2. LIST VIEW (STRUCTURED TABLE / ROWS VIEW) */
                                                            <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
                                                                <table className="w-full text-xs text-left">
                                                                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[10px] uppercase tracking-wider">
                                                                        <tr>
                                                                            <th className="px-4 py-2.5 w-16">Room #</th>
                                                                            <th className="px-4 py-2.5">Room Name</th>
                                                                            <th className="px-4 py-2.5">Department</th>
                                                                            <th className="px-4 py-2.5">Location & Capacity</th>
                                                                            <th className="px-4 py-2.5">Routing Rules & Tests</th>
                                                                            <th className="px-4 py-2.5">Status</th>
                                                                            <th className="px-4 py-2.5 text-right w-32">Enable / Disable</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-slate-100">
                                                                        {filteredCategoryRooms.map(room => {
                                                                            const isEnabled = room.isActive !== false;
                                                                            const roomDisplayNumber = room.roomNumber || room.number || room.id;

                                                                            return (
                                                                                <tr
                                                                                    key={room.id}
                                                                                    className={`transition-colors ${
                                                                                        isEnabled
                                                                                            ? 'hover:bg-slate-50/80 bg-white'
                                                                                            : 'bg-slate-50/50 opacity-75'
                                                                                    }`}
                                                                                >
                                                                                    <td className="px-4 py-3 font-mono font-black text-slate-800 whitespace-nowrap">
                                                                                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-mono font-black text-xs shadow-2xs ${
                                                                                            isEnabled
                                                                                                ? 'bg-slate-900 text-teal-300'
                                                                                                : 'bg-slate-200 text-slate-500'
                                                                                        }`}>
                                                                                            {roomDisplayNumber}
                                                                                        </span>
                                                                                    </td>
                                                                                    <td className="px-4 py-3">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <div className={`p-1.5 rounded-lg bg-slate-100 ${cat.iconColor} shrink-0`}>
                                                                                                <CatIcon size={14} />
                                                                                            </div>
                                                                                            <div>
                                                                                                <div className={`font-bold text-xs ${
                                                                                                    isEnabled ? 'text-slate-900' : 'text-slate-500 line-through decoration-slate-300'
                                                                                                }`}>
                                                                                                    {room.name || `Room ${roomDisplayNumber}`}
                                                                                                </div>
                                                                                                <div className="text-[10px] text-slate-400 font-mono">
                                                                                                    ID: {room.id}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </td>
                                                                                    <td className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                                                                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">
                                                                                            {room.type || 'OPD'}
                                                                                        </span>
                                                                                    </td>
                                                                                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap text-[11px]">
                                                                                        <div>{room.floor || '1st Floor'}</div>
                                                                                        <div className="text-[10px] text-slate-400">Cap: {room.capacity || 20} Patients</div>
                                                                                    </td>
                                                                                    <td className="px-4 py-3">
                                                                                        <div className="flex flex-wrap gap-1">
                                                                                            {room.genderSpecific && (
                                                                                                <span className="px-1.5 py-0.5 bg-teal-50 text-teal-700 font-semibold rounded text-[10px]">
                                                                                                    {room.genderSpecific} Only
                                                                                                </span>
                                                                                            )}
                                                                                            {room.specialty && (
                                                                                                <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 font-semibold rounded text-[10px]">
                                                                                                    {room.specialty}
                                                                                                </span>
                                                                                            )}
                                                                                            {room.testCodes && room.testCodes.length > 0 && (
                                                                                                <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-semibold rounded text-[10px] truncate max-w-[200px]" title={room.testCodes.join(', ')}>
                                                                                                    {room.testCodes.join(', ')}
                                                                                                </span>
                                                                                            )}
                                                                                            {!room.genderSpecific && !room.specialty && (!room.testCodes || room.testCodes.length === 0) && (
                                                                                                <span className="text-slate-400 italic text-[10px]">Standard Queue</span>
                                                                                            )}
                                                                                        </div>
                                                                                    </td>
                                                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                                                        {isEnabled ? (
                                                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                                                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                                                                Enabled
                                                                                            </span>
                                                                                        ) : (
                                                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-200 text-slate-600">
                                                                                                Disabled
                                                                                            </span>
                                                                                        )}
                                                                                    </td>
                                                                                    <td className="px-4 py-3 text-right whitespace-nowrap">
                                                                                        <div className="inline-flex items-center justify-end gap-2">
                                                                                            <span className={`text-[10px] font-bold ${isEnabled ? 'text-teal-700' : 'text-slate-400'}`}>
                                                                                                {isEnabled ? 'Active' : 'Off'}
                                                                                            </span>
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => {
                                                                                                    const nextState = !isEnabled;
                                                                                                    updateRoom(room.id, { isActive: nextState });
                                                                                                    showNotice(`Room ${roomDisplayNumber} (${room.name}) is now ${nextState ? 'Enabled' : 'Disabled'}.`, nextState ? 'success' : 'warning');
                                                                                                }}
                                                                                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                                                                    isEnabled ? 'bg-teal-600' : 'bg-slate-300'
                                                                                                }`}
                                                                                                title={isEnabled ? "Click to Disable Room" : "Click to Enable Room"}
                                                                                            >
                                                                                                <span
                                                                                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                                                                                        isEnabled ? 'translate-x-4' : 'translate-x-0'
                                                                                                    }`}
                                                                                                />
                                                                                            </button>
                                                                                        </div>
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    )}

                    {/* SECTION 6: PATIENT FLOW & QUEUE ENGINE */}
                    {activeSection === 'patient_flow' && (
                        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
                            <div>
                                <h2 className="text-lg font-black text-slate-900">Patient Flow & Queue Management Engine</h2>
                                <p className="text-xs text-slate-500">Configure automatic patient routing, round-robin rotation, gender VAT rules & clinic mappings</p>
                            </div>

                            {/* Section 6.1: Round-Robin Refraction */}
                            <div className="p-5 bg-teal-50/50 rounded-2xl border border-teal-200 space-y-3">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-black text-xs uppercase tracking-wider text-teal-900">1. Refraction Room Allocation (Round-Robin Sequential)</h3>
                                        <p className="text-xs text-teal-700">Distributes post-billing refraction patients sequentially among active rooms</p>
                                    </div>
                                    <span className="font-mono text-xs font-bold text-teal-900 bg-white px-2 py-0.5 rounded border border-teal-300">
                                        Sequence: 36 → 37 → 21-1 → 21-2
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {(flowConfig.refractionRooms || ['36', '37', '21-1', '21-2']).map(rNum => (
                                        <div key={rNum} className="p-3 bg-white rounded-xl border border-teal-200 text-center font-bold text-xs">
                                            <span className="font-mono text-base block text-teal-950 font-black">Room {rNum}</span>
                                            <span className="text-[10px] text-teal-600 font-semibold">Active in Rotation</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Section 6.2: Gender-Wise VAT Allocation */}
                            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                                <h3 className="font-black text-xs uppercase tracking-wider text-slate-800">2. Gender-Wise VAT (Visual Acuity Test) Allocation</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="p-4 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                                        <div>
                                            <span className="text-xs font-bold text-slate-700">Male Patients VAT Room</span>
                                            <p className="text-[11px] text-slate-400">Default entry point for male registrations</p>
                                        </div>
                                        <span className="font-mono font-black text-sm bg-slate-900 text-white px-3 py-1 rounded-lg">Room 40</span>
                                    </div>
                                    <div className="p-4 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                                        <div>
                                            <span className="text-xs font-bold text-slate-700">Female Patients VAT Room</span>
                                            <p className="text-[11px] text-slate-400">Default entry point for female registrations</p>
                                        </div>
                                        <span className="font-mono font-black text-sm bg-slate-900 text-white px-3 py-1 rounded-lg">Room 41</span>
                                    </div>
                                </div>
                            </div>

                            {/* Section 6.3: Specialized Clinic & Post-Op Mapping */}
                            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                                <h3 className="font-black text-xs uppercase tracking-wider text-slate-800">3. Sub-Specialty Clinic & Post-Operative Follow-Up Mappings</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                    {[
                                        { clinic: 'Cataract Clinic', room: '22', postOp: 'Room 14' },
                                        { clinic: 'Retina Clinic', room: '27', postOp: 'Room 27' },
                                        { clinic: 'Glaucoma Clinic', room: '21', postOp: 'Room 21' },
                                        { clinic: 'Cornea Clinic', room: '15', postOp: 'Room 15' },
                                    ].map((m, i) => (
                                        <div key={i} className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                                            <span className="font-bold text-slate-800 block truncate">{m.clinic}</span>
                                            <div className="text-[11px] text-slate-500">Clinic: <strong className="text-slate-900">Room {m.room}</strong></div>
                                            <div className="text-[11px] text-slate-500">Post-Op: <strong className="text-slate-900">{m.postOp}</strong></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECTION 7: OPHTHALMIC CLINICAL MASTER */}
                    {activeSection === 'ophthalmology_clinical' && (
                        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
                            <div>
                                <h2 className="text-lg font-black text-slate-900">Ophthalmic Clinical Master & Examination Templates</h2>
                                <p className="text-xs text-slate-500">Configure visual acuity standards, OD/OS parameters, slit-lamp templates, IOP scales & ICD-10 diagnosis</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                                    <h3 className="text-xs font-black uppercase text-slate-700">Refraction Parameters Matrix</h3>
                                    <p className="text-[11px] text-slate-500">Standardized clinical scale for sphere, cylinder, axis, addition, and visual acuity</p>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between py-1 border-b">
                                            <span className="font-medium text-slate-600">Sphere Range:</span>
                                            <span className="font-mono font-bold">-20.00 D to +20.00 D (0.25 steps)</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b">
                                            <span className="font-medium text-slate-600">Cylinder Range:</span>
                                            <span className="font-mono font-bold">-6.00 D to +6.00 D (0.25 steps)</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b">
                                            <span className="font-medium text-slate-600">Axis Angle:</span>
                                            <span className="font-mono font-bold">1° to 180°</span>
                                        </div>
                                        <div className="flex justify-between py-1">
                                            <span className="font-medium text-slate-600">Distance VA Scale:</span>
                                            <span className="font-mono font-bold">6/60, 6/36, 6/24, 6/18, 6/12, 6/9, 6/6</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                                    <h3 className="text-xs font-black uppercase text-slate-700">Ophthalmic Diagnostic Master (ICD-10)</h3>
                                    <p className="text-[11px] text-slate-500">Eye-specific diagnosis presets linked with EMR records</p>
                                    <div className="space-y-1.5 text-xs">
                                        {[
                                            { code: 'H25.9', name: 'Senile Cataract, Unspecified' },
                                            { code: 'H40.1', name: 'Primary Open-Angle Glaucoma' },
                                            { code: 'H35.3', name: 'Age-Related Macular Degeneration' },
                                            { code: 'H52.1', name: 'Myopia (Compound Astigmatism)' },
                                            { code: 'H16.0', name: 'Corneal Ulcer (Keratitis)' },
                                        ].map((diag, i) => (
                                            <div key={i} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200/80">
                                                <span className="font-bold text-slate-800">{diag.name}</span>
                                                <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">{diag.code}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECTION 8: DIAGNOSTIC INVESTIGATIONS */}
                    {activeSection === 'investigations' && (
                        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-lg font-black text-slate-900">Ophthalmic Diagnostic Investigation Master</h2>
                                    <p className="text-xs text-slate-500">Configure diagnostic test codes, room allocations, service pricing, and equipment requirements</p>
                                </div>
                                <button
                                    onClick={() => showNotice("Add New Investigation modal triggered.", "info")}
                                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-slate-800"
                                >
                                    <Plus size={14} /> Add Diagnostic Test
                                </button>
                            </div>

                            <div className="border border-slate-200 rounded-2xl overflow-hidden">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3">Investigation Name</th>
                                            <th className="px-4 py-3">Assigned Room</th>
                                            <th className="px-4 py-3">Equipment Required</th>
                                            <th className="px-4 py-3 text-right">Fee</th>
                                            <th className="px-4 py-3 text-center">Auto-Route</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {[
                                            { name: 'OCT Scan (Retina & RNFL)', room: '16', equip: 'Heidelberg Spectralis OCT', fee: 2500 },
                                            { name: 'Fluorescein Angiography (FFA)', room: '16', equip: 'Fundus Camera & Digital Angiograph', fee: 3200 },
                                            { name: 'Visual Field Test (HVF 24-2/30-2)', room: '24', equip: 'Humphrey Field Analyzer III', fee: 1800 },
                                            { name: 'Applanation Tonometry', room: '24', equip: 'Goldmann Applanation Tonometer', fee: 350 },
                                            { name: 'Biometry & A-Scan IOL Calculation', room: '39', equip: 'IOLMaster 700 / Optical Biometer', fee: 1500 },
                                            { name: 'Corneal Topography & Pachymetry', room: '39', equip: 'Pentacam HR Tomographer', fee: 2000 },
                                            { name: 'B-Scan Ultrasonography', room: '35', equip: 'Ophthalmic Ultrasound 10-20MHz', fee: 1200 },
                                            { name: 'YAG Laser Capsulotomy', room: '35', equip: 'Q-Switched Nd:YAG Laser', fee: 2800 },
                                        ].map((inv, i) => (
                                            <tr key={i} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 font-bold text-slate-900">{inv.name}</td>
                                                <td className="px-4 py-3">
                                                    <span className="font-mono bg-teal-50 text-teal-800 font-black px-2 py-0.5 rounded border border-teal-200">
                                                        Room {inv.room}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">{inv.equip}</td>
                                                <td className="px-4 py-3 text-right font-black font-mono text-slate-900">{formatCurrency(inv.fee)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                        Active
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* SECTION 9: SURGERY & OPERATION THEATRE CONFIGURATION */}
                    {activeSection === 'surgery_ot' && (
                        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
                            <div>
                                <h2 className="text-lg font-black text-slate-900">Surgery & Operation Theatre Master</h2>
                                <p className="text-xs text-slate-500">Configure ophthalmic OT suites, surgical packages (Phaco, Vitrectomy, Trabeculectomy), checklists & IOL implants</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                                    <h3 className="text-xs font-black uppercase text-slate-800">Ophthalmic Surgery Packages</h3>
                                    <div className="space-y-2 text-xs">
                                        {[
                                            { name: 'Phacoemulsification with Foldable Hydrophobic IOL', ot: 'OT-1', packageFee: 25000 },
                                            { name: 'MICS with Toric / Multifocal Premium IOL', ot: 'OT-1', packageFee: 55000 },
                                            { name: 'Pars Plana Vitrectomy (25G) with Endolaser', ot: 'OT-2', packageFee: 45000 },
                                            { name: 'Trabeculectomy with Mitomycin-C (MMC)', ot: 'OT-2', packageFee: 28000 },
                                        ].map((pkg, i) => (
                                            <div key={i} className="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                                                <div>
                                                    <div className="font-bold text-slate-900">{pkg.name}</div>
                                                    <div className="text-[10px] text-slate-400">Suite: {pkg.ot}</div>
                                                </div>
                                                <span className="font-mono font-bold text-teal-800">{formatCurrency(pkg.packageFee)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                                    <h3 className="text-xs font-black uppercase text-slate-800">WHO Surgical Safety Checklist Enforcements</h3>
                                    <div className="space-y-2 text-xs">
                                        <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200">
                                            <input type="checkbox" defaultChecked className="accent-teal-600 w-4 h-4" />
                                            <span>Sign-In: Patient ID & Operated Eye Marking (Right/Left) Verification</span>
                                        </label>
                                        <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200">
                                            <input type="checkbox" defaultChecked className="accent-teal-600 w-4 h-4" />
                                            <span>Time-Out: Surgeon & Team IOL Power & Sterility Confirmation</span>
                                        </label>
                                        <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200">
                                            <input type="checkbox" defaultChecked className="accent-teal-600 w-4 h-4" />
                                            <span>Sign-Out: Sponge, Instrument Count & Post-Op Drops Protocol</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECTION 10: BILLING & FINANCIAL POLICIES */}
                    {activeSection === 'financial_billing' && (
                        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-lg font-black text-slate-900">Billing & Financial Tariff Configuration</h2>
                                    <p className="text-xs text-slate-500">Service master pricing, registration fees, discount ceilings & cashier counter mapping</p>
                                </div>
                                <button
                                    onClick={() => showNotice("Add New Service Item modal opened.", "info")}
                                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                                >
                                    <Plus size={14} /> Add Service / Tariff
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                                    <span className="font-bold text-slate-700">General Registration Fee</span>
                                    <div className="text-xl font-black text-slate-900">{formatCurrency(100)}</div>
                                    <span className="text-[10px] text-slate-400">Fixed Entry Tariff</span>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                                    <span className="font-bold text-slate-700">Refraction Service Fee</span>
                                    <div className="text-xl font-black text-slate-900">{formatCurrency(300)}</div>
                                    <span className="text-[10px] text-teal-600 font-bold">Auto-routes to Rooms 36/37/21-1/21-2</span>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                                    <span className="font-bold text-slate-700">Designated Billing Counters</span>
                                    <div className="text-xl font-black text-slate-900">Room 08 & Room 26</div>
                                    <span className="text-[10px] text-slate-400">Cash & Card Dual POS</span>
                                </div>
                            </div>

                            <div className="p-5 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-2">
                                <h3 className="text-xs font-black uppercase text-amber-900">Discount Governance & Approval Ceilings</h3>
                                <p className="text-xs text-amber-800">
                                    Receptionists have discount authority up to <strong>10%</strong>. Senior Administrators can approve up to <strong>30%</strong>. Special waivers above 30% require SuperAdmin two-factor authorization.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* SECTION 11: PHARMACY & OPTICAL MASTER */}
                    {activeSection === 'pharmacy_optical' && (
                        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
                            <div>
                                <h2 className="text-lg font-black text-slate-900">Pharmacy & Optical Store Configuration</h2>
                                <p className="text-xs text-slate-500">Configure ophthalmic pharmaceutical formulas, optical lens types, frame inventories & IOL implants</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                                    <span className="text-xs font-bold text-slate-600 uppercase">Optical Lens Catalog</span>
                                    <div className="text-sm font-black text-slate-900">Single Vision, Bifocal, Progressive, Blue-Cut, Photochromic</div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                                    <span className="text-xs font-bold text-slate-600 uppercase">IOL Surgical Implants</span>
                                    <div className="text-sm font-black text-slate-900">Alcon AcrySof, Johnson&Johnson Tecnis, Rayner, Hydrophobic Acrylic</div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                                    <span className="text-xs font-bold text-slate-600 uppercase">Ophthalmic Drops Catalog</span>
                                    <div className="text-sm font-black text-slate-900">Moxifloxacin, Prednisolone, Latanoprost, Timolol, Carboxymethylcellulose</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECTION 12: DOCUMENTS & PRINT TEMPLATES */}
                    {activeSection === 'documents_printing' && (
                        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
                            <div>
                                <h2 className="text-lg font-black text-slate-900">Documents, Printing & Report Templates</h2>
                                <p className="text-xs text-slate-500">Manage patient slips, prescriptions, thermal receipts, surgery consents & A4/A5 layouts</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { name: 'Patient Registration Slip', size: 'Thermal 80mm / A5', header: 'Visionary Care Specialist Eye Hospital', autoPrint: true },
                                    { name: 'Ophthalmology E-Prescription', size: 'Standard A4 / Letter', header: 'Full Clinical Header with Bangladesh BMDC Seal', autoPrint: false },
                                    { name: 'Refraction & Glass Prescription Slip', size: 'A5 Landscape', header: 'Visual Acuity OD/OS Specimen Sheet', autoPrint: true },
                                    { name: 'Surgery & OT Consent Form', size: 'Legal 2-Page', header: 'Informed Surgical Risk Consent (Bengali & English)', autoPrint: false },
                                ].map((tmpl, idx) => (
                                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center">
                                        <div>
                                            <h4 className="font-bold text-xs text-slate-900">{tmpl.name}</h4>
                                            <p className="text-[10px] text-slate-500 font-mono">Format: {tmpl.size}</p>
                                        </div>
                                        <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-100">
                                            Edit Layout
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SECTION 13: NOTIFICATIONS & COMMUNICATIONS */}
                    {activeSection === 'communications' && (
                        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
                            <div>
                                <h2 className="text-lg font-black text-slate-900">Automated Patient Communications & Messaging</h2>
                                <p className="text-xs text-slate-500">Configure automated SMS, WhatsApp, and Email triggers for appointments, surgeries, and report deliveries</p>
                            </div>

                            <div className="space-y-3">
                                {[
                                    { trigger: 'Patient Registration & Token', channel: 'SMS + Display', template: 'Welcome to Visionary Care. Your Token is {TOKEN}, please proceed to VAT Room {ROOM}.' },
                                    { trigger: 'Diagnostic Report Ready', channel: 'SMS + WhatsApp', template: 'Dear {NAME}, your eye investigation report is ready. View online at https://vce-hms.portal' },
                                    { trigger: 'Post-Op Follow-up Reminder', channel: 'WhatsApp / Call', template: 'Reminder: Your post-operative follow-up consultation is scheduled for tomorrow in Room {ROOM}.' },
                                ].map((com, idx) => (
                                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-xs text-slate-900">{com.trigger}</span>
                                            <span className="font-mono text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">{com.channel}</span>
                                        </div>
                                        <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 font-mono">
                                            {com.template}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SECTION 14: SECURITY & PRIVACY POLICY */}
                    {activeSection === 'security_policy' && (
                        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
                            <div>
                                <h2 className="text-lg font-black text-slate-900">Security & Privacy Governance Policy</h2>
                                <p className="text-xs text-slate-500">Enforce enterprise password rules, session timeouts, multi-factor authentication & data privacy masking</p>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                                    <div>
                                        <span className="font-bold text-xs text-slate-800 block">Enforce Strong Password Complexity</span>
                                        <span className="text-[11px] text-slate-500">Requires 10+ characters, numbers, uppercase, and special symbols</span>
                                    </div>
                                    <input type="checkbox" defaultChecked className="accent-teal-600 w-5 h-5 rounded cursor-pointer" />
                                </div>

                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                                    <div>
                                        <span className="font-bold text-xs text-slate-800 block">Session Inactivity Auto-Timeout</span>
                                        <span className="text-[11px] text-slate-500">Automatically terminates idle clinical sessions after 15 minutes</span>
                                    </div>
                                    <select className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold">
                                        <option value="15">15 Minutes</option>
                                        <option value="30">30 Minutes</option>
                                        <option value="60">60 Minutes</option>
                                    </select>
                                </div>

                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                                    <div>
                                        <span className="font-bold text-xs text-slate-800 block">Account Lockout after 5 Failed Attempts</span>
                                        <span className="text-[11px] text-slate-500">Temporarily locks credentials to safeguard against brute-force intrusion</span>
                                    </div>
                                    <input type="checkbox" defaultChecked className="accent-teal-600 w-5 h-5 rounded cursor-pointer" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECTION 15: AUDIT TRAIL & COMPLIANCE */}
                    {activeSection === 'audit_compliance' && (
                        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-black text-slate-900">Tamper-Resistant Audit Trail & Regulatory Compliance</h2>
                                    <p className="text-xs text-slate-500">Complete immutable record of all administrative, clinical, and financial operations</p>
                                </div>
                                <div className="relative">
                                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Filter audit logs..."
                                        value={auditSearch}
                                        onChange={e => setAuditSearch(e.target.value)}
                                        className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                                    />
                                </div>
                            </div>

                            <div className="border border-slate-200 rounded-2xl overflow-hidden">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3">Audit ID</th>
                                            <th className="px-4 py-3">Time</th>
                                            <th className="px-4 py-3">User & Role</th>
                                            <th className="px-4 py-3">Action</th>
                                            <th className="px-4 py-3">Details</th>
                                            <th className="px-4 py-3">IP Address</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {auditLogs
                                            .filter(log => !auditSearch || log.details.toLowerCase().includes(auditSearch.toLowerCase()) || log.action.toLowerCase().includes(auditSearch.toLowerCase()))
                                            .map((log) => (
                                                <tr key={log.id} className="hover:bg-slate-50">
                                                    <td className="px-4 py-3 font-mono font-bold text-slate-600">{log.id}</td>
                                                    <td className="px-4 py-3 font-mono text-slate-500">{log.timestamp}</td>
                                                    <td className="px-4 py-3 font-bold text-slate-800">{log.user}</td>
                                                    <td className="px-4 py-3 font-mono text-[10px] bg-slate-100 rounded px-2 py-0.5 font-black text-slate-700">{log.action}</td>
                                                    <td className="px-4 py-3 text-slate-700 max-w-xs truncate">{log.details}</td>
                                                    <td className="px-4 py-3 font-mono text-slate-400">{log.ip}</td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* SECTION 16: DATABASE & DISASTER RECOVERY */}
                    {activeSection === 'backup_database' && (
                        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-lg font-black text-slate-900">Database Health & Disaster Recovery</h2>
                                    <p className="text-xs text-slate-500">Automated snapshot backups, point-in-time recovery & encryption verification</p>
                                </div>
                                <button
                                    onClick={() => showNotice("Manual snapshot backup initiated. File: vce_manual_snapshot_20261128.sql", "success")}
                                    className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-teal-700 shadow-sm"
                                >
                                    <Database size={14} /> Create Snapshot Now
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Database Size</span>
                                    <div className="text-xl font-black text-slate-900">142.8 MB</div>
                                    <span className="text-[10px] text-emerald-600 font-bold">Storage Health: Optimal</span>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Auto Backup Schedule</span>
                                    <div className="text-xl font-black text-slate-900">Every 6 Hours</div>
                                    <span className="text-[10px] text-slate-400">AES-256 GCM Encrypted</span>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Disaster Recovery RTO</span>
                                    <div className="text-xl font-black text-slate-900">&lt; 15 Minutes</div>
                                    <span className="text-[10px] text-indigo-600 font-bold">Standby Failover Ready</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECTION 17: INTEGRATIONS & APIS */}
                    {activeSection === 'integrations' && (
                        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
                            <div>
                                <h2 className="text-lg font-black text-slate-900">Medical Equipment & External API Integrations</h2>
                                <p className="text-xs text-slate-500">Configure ophthalmic device communication, DICOM/PACS, HL7 endpoints, and payment bridges</p>
                            </div>

                            <div className="space-y-3">
                                {[
                                    { name: 'Heidelberg Eye Explorer (OCT / FFA)', type: 'DICOM 3.0 / C-STORE', status: 'Connected', ip: '192.168.1.180:104' },
                                    { name: 'Humphrey Field Analyzer (Perimetry)', type: 'HL7 / XML File Drop', status: 'Connected', ip: '192.168.1.185' },
                                    { name: 'IOLMaster 700 (Biometer)', type: 'Network Share / DICOM', status: 'Connected', ip: '192.168.1.190' },
                                    { name: 'SSLCommerz Payment Gateway', type: 'REST API v4', status: 'Active (Production)', ip: 'api.sslcommerz.com' },
                                    { name: 'WhatsApp Cloud Business API', type: 'Meta Graph Webhook v21.0', status: 'Verified', ip: 'graph.facebook.com' },
                                ].map((integ, i) => (
                                    <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-xs text-slate-900">{integ.name}</h4>
                                            <p className="text-[10px] text-slate-500 font-mono">Protocol: {integ.type} • Endpoint: {integ.ip}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                                                {integ.status}
                                            </span>
                                            <button
                                                onClick={() => showNotice(`Ping test to ${integ.name} succeeded (Response: 18ms).`, 'success')}
                                                className="px-3 py-1 bg-white border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-100"
                                            >
                                                Test Ping
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SECTION 18: GENERAL SETTINGS */}
                    {activeSection === 'general_settings' && (
                        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
                            <div>
                                <h2 className="text-lg font-black text-slate-900">General System Settings</h2>
                                <p className="text-xs text-slate-500">Configure hospital branding, language localization, currency symbols, and numbering sequences</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                <div className="space-y-2">
                                    <label className="font-bold text-slate-700">Hospital Legal Name</label>
                                    <input type="text" defaultValue="Visionary Care Specialist Eye Hospital Ltd." className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <label className="font-bold text-slate-700">Default Currency</label>
                                    <select defaultValue={currency} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                                        <option value="BDT">BDT (৳) - Bangladeshi Taka</option>
                                        <option value="USD">USD ($) - US Dollar</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="font-bold text-slate-700">Primary System Language</label>
                                    <select defaultValue="en" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                                        <option value="en">English (Clinical Standard)</option>
                                        <option value="bn">বাংলা (Bengali)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="font-bold text-slate-700">Date & Time Format</label>
                                    <select defaultValue="YYYY-MM-DD" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                                        <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-11-28)</option>
                                        <option value="DD-MM-YYYY">DD-MM-YYYY (e.g. 28-11-2026)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECTION 19: CHANGE MANAGEMENT & PUBLISHING */}
                    {activeSection === 'change_management' && (
                        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
                            <div>
                                <h2 className="text-lg font-black text-slate-900">Configuration Change Management & Version Publishing</h2>
                                <p className="text-xs text-slate-500">Track staged draft changes, inspect previous vs new diffs, and deploy authorized releases</p>
                            </div>

                            <div className="p-5 bg-teal-50 rounded-2xl border border-teal-200 flex items-center justify-between">
                                <div>
                                    <span className="font-black text-sm text-teal-950 block">Current Staged Changes: {draftChangesCount}</span>
                                    <span className="text-xs text-teal-700">Changes are currently staged in local working draft. Publishing commits them to all hospital cluster nodes.</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowDiffModal(true)}
                                        className="px-4 py-2 bg-white border border-teal-200 text-teal-800 rounded-xl text-xs font-bold"
                                    >
                                        Inspect Diff
                                    </button>
                                    <button
                                        onClick={() => setShowPublishModal(true)}
                                        className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700"
                                    >
                                        Publish Release
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xs font-black uppercase text-slate-400">Configuration Deployment History</h3>
                                {[
                                    { ver: 'v2.4.1', date: '2026-11-28 17:45', author: 'Dr. Shafiqul Alam', notes: 'Integrated Round-Robin Refraction and Diagnostic Room test mapping.' },
                                    { ver: 'v2.4.0', date: '2026-11-28 10:20', author: 'Dr. Shafiqul Alam', notes: 'Automated VAT Room gender routing (40 Male, 41 Female).' },
                                    { ver: 'v2.3.9', date: '2026-11-27 18:30', author: 'SuperAdmin', notes: 'Configured Glaucoma and Retina Clinic specialized routing.' }
                                ].map((rel, i) => (
                                    <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center text-xs">
                                        <div>
                                            <span className="font-mono font-black text-teal-700 mr-2">{rel.ver}</span>
                                            <span className="text-slate-800 font-bold">{rel.notes}</span>
                                            <div className="text-[10px] text-slate-400 mt-0.5">Deployed: {rel.date} by {rel.author}</div>
                                        </div>
                                        <button
                                            onClick={() => showNotice(`Rollback to ${rel.ver} requires SuperAdmin two-step approval.`, 'warning')}
                                            className="text-xs font-bold text-slate-500 hover:text-rose-600 flex items-center gap-1"
                                        >
                                            <RotateCcw size={12} /> Rollback
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL 1: PUBLISH & DEPLOY MODAL */}
            {showPublishModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-100 shadow-2xl">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="text-teal-600" size={22} />
                                <h3 className="text-base font-black text-slate-900">Publish Configuration Release</h3>
                            </div>
                            <button onClick={() => setShowPublishModal(false)}><X size={18} className="text-slate-400" /></button>
                        </div>
                        <p className="text-xs text-slate-600">
                            You are about to publish configuration changes to the live hospital database. This update will take effect immediately across all client terminals.
                        </p>
                        <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                            <div><strong>Release Tag:</strong> v2.4.2</div>
                            <div><strong>Author:</strong> {currentUser?.name || 'SuperAdmin'}</div>
                            <div><strong>Nodes:</strong> Cumilla HQ, Dhaka Clinic, Outreach</div>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button onClick={() => setShowPublishModal(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold">Cancel</button>
                            <button
                                onClick={() => {
                                    setDraftChangesCount(0);
                                    setShowPublishModal(false);
                                    showNotice("Configuration v2.4.2 successfully published to all hospital nodes!", "success");
                                }}
                                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-teal-600/20"
                            >
                                Confirm & Deploy
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: DIFF COMPARISON MODAL */}
            {showDiffModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 border border-slate-100 shadow-2xl">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <History className="text-indigo-600" size={22} />
                                <h3 className="text-base font-black text-slate-900">Configuration Diff (Staged vs Production)</h3>
                            </div>
                            <button onClick={() => setShowDiffModal(false)}><X size={18} className="text-slate-400" /></button>
                        </div>
                        <div className="p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-2xl max-h-72 overflow-y-auto space-y-1 custom-scrollbar">
                            <div>--- production/roles_permissions.json</div>
                            <div>+++ staging/roles_permissions.json</div>
                            <div className="text-slate-500">@@ -14,6 +14,8 @@ Consultant Ophthalmologist</div>
                            <div className="text-emerald-300">+   "E-Prescription": &#123; "finalize": true, "sign": true &#125;</div>
                            <div className="text-slate-500">@@ -42,3 +44,4 @@ Patient Flow Config</div>
                            <div className="text-emerald-300">+   "refraction_rotation": ["36", "37", "21-1", "21-2"]</div>
                            <div className="text-emerald-300">+   "vat_male": "40", "vat_female": "41"</div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <button onClick={() => setShowDiffModal(false)} className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">
                                Close Diff
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 3: CREATE NEW USER ACCOUNT MODAL */}
            {showCreateUserModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 border border-slate-100 shadow-2xl my-8">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2.5 bg-teal-50 text-teal-700 rounded-xl">
                                    <UserPlus size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900">Create New User Account</h3>
                                    <p className="text-xs text-slate-500">Provision credentials, assign clinical/administrative roles, and configure security policies</p>
                                </div>
                            </div>
                            <button onClick={() => setShowCreateUserModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                                <X size={18} className="text-slate-400" />
                            </button>
                        </div>

                        {/* Optional: Link to Existing Employee */}
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={newUserForm.linkExisting}
                                    onChange={(e) => {
                                        const isChecked = e.target.checked;
                                        setNewUserForm(prev => ({
                                            ...prev,
                                            linkExisting: isChecked,
                                            ...(isChecked ? {} : { existingEmployeeId: '' })
                                        }));
                                    }}
                                    className="rounded text-teal-600 focus:ring-teal-500"
                                />
                                <span>Link to an existing employee record (avoid duplicate employee info)</span>
                            </label>

                            {newUserForm.linkExisting && (
                                <div className="pt-2">
                                    <select
                                        value={newUserForm.existingEmployeeId}
                                        onChange={(e) => {
                                            const selectedId = e.target.value;
                                            const found = employees.find(emp => emp.id === selectedId);
                                            if (found) {
                                                setNewUserForm(prev => ({
                                                    ...prev,
                                                    existingEmployeeId: selectedId,
                                                    name: found.name,
                                                    employeeId: found.id,
                                                    contact: found.contact || '',
                                                    designation: found.designation || found.role,
                                                    department: found.department,
                                                    branchId: found.branchId || 'BR001',
                                                    email: found.email || `${found.username || 'staff'}@vce-eye.org`,
                                                    role: found.role
                                                }));
                                            }
                                        }}
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
                                    >
                                        <option value="">-- Choose Existing Employee Record --</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.name} ({emp.id} • {emp.department} - {emp.role})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleCreateUserSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Full Legal Name *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Dr. Mahmudul Hasan"
                                        value={newUserForm.name}
                                        onChange={e => setNewUserForm(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Employee ID *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. EMP-1048"
                                        value={newUserForm.employeeId}
                                        onChange={e => setNewUserForm(prev => ({ ...prev, employeeId: e.target.value }))}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Username (Login ID) *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. mahmudul.opd"
                                        value={newUserForm.username}
                                        onChange={e => setNewUserForm(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/\s+/g, '') }))}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Email Address *</label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="e.g. m.hasan@vce-eye.org"
                                        value={newUserForm.email}
                                        onChange={e => setNewUserForm(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Mobile Contact Number</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 01711-987654"
                                        value={newUserForm.contact}
                                        onChange={e => setNewUserForm(prev => ({ ...prev, contact: e.target.value }))}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Designation</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Consultant Ophthalmologist"
                                        value={newUserForm.designation}
                                        onChange={e => setNewUserForm(prev => ({ ...prev, designation: e.target.value }))}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Department</label>
                                    <select
                                        value={newUserForm.department}
                                        onChange={e => setNewUserForm(prev => ({ ...prev, department: e.target.value }))}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                                    >
                                        <option value="Clinical">Clinical</option>
                                        <option value="Front Office">Front Office</option>
                                        <option value="Pharmacy">Pharmacy</option>
                                        <option value="Finance">Finance</option>
                                        <option value="Administration">Administration</option>
                                        <option value="HR">HR</option>
                                        <option value="Nursing">Nursing</option>
                                        <option value="Optical">Optical</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Assigned Branch</label>
                                    <select
                                        value={newUserForm.branchId}
                                        onChange={e => setNewUserForm(prev => ({ ...prev, branchId: e.target.value }))}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                                    >
                                        <option value="BR001">BR001 - Cumilla HQ Main Campus</option>
                                        <option value="BR002">BR002 - Dhaka Diagnostic Clinic</option>
                                        <option value="BR003">BR003 - Outreach & Surgical Wing</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Assigned Room / Counter</label>
                                    <select
                                        value={newUserForm.assignedRoom}
                                        onChange={e => setNewUserForm(prev => ({ ...prev, assignedRoom: e.target.value }))}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                                    >
                                        <option value="Room 10 (Consultation)">Room 10 (General Consultation)</option>
                                        <option value="Room 12 (Consultation)">Room 12 (General Consultation)</option>
                                        <option value="Room 13 (Consultation)">Room 13 (General Consultation)</option>
                                        <option value="Room 20 (Consultation)">Room 20 (General Consultation)</option>
                                        <option value="Room 28 (Consultation)">Room 28 (General Consultation)</option>
                                        <option value="Room 09-A (Consultation)">Room 09-A (General Consultation)</option>
                                        <option value="Room 09-B (Consultation)">Room 09-B (General Consultation)</option>
                                        <option value="Room 40 (Male VAT)">Room 40 (Male VAT Room)</option>
                                        <option value="Room 41 (Female VAT)">Room 41 (Female VAT Room)</option>
                                        <option value="Room 22 (Cataract Clinic)">Room 22 (Cataract Clinic)</option>
                                        <option value="Room 27 (Retina Clinic)">Room 27 (Retina Clinic)</option>
                                        <option value="Room 21 (Glaucoma Clinic)">Room 21 (Glaucoma Clinic)</option>
                                        <option value="Room 15 (Cornea Clinic)">Room 15 (Cornea Clinic)</option>
                                        <option value="Room 14 (Cataract Follow-up)">Room 14 (Cataract Post-Op Follow-up)</option>
                                        <option value="Room 08 (Billing Counter 1)">Room 08 (Refraction/Investigation Billing)</option>
                                        <option value="Room 04 (Billing Counter 2)">Room 04 (Refraction/Investigation Billing)</option>
                                        <option value="Counter 1 (Main Cashier)">Counter 1 (Main Cashier)</option>
                                        <option value="Counter 2 (Pharmacy POS)">Counter 2 (Pharmacy POS)</option>
                                        <option value="Room 36 (Refraction 1)">Room 36 (Refraction Unit 1)</option>
                                        <option value="Room 37 (Refraction 2)">Room 37 (Refraction Unit 2)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Assigned Role *</label>
                                    <select
                                        value={newUserForm.role}
                                        onChange={e => setNewUserForm(prev => ({ ...prev, role: e.target.value }))}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                                    >
                                        {availableRoles.map(r => (
                                            <option key={r.id} value={r.name}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Additional Role (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Clinical In-Charge / Audit Officer"
                                        value={newUserForm.additionalRole}
                                        onChange={e => setNewUserForm(prev => ({ ...prev, additionalRole: e.target.value }))}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Account Status</label>
                                    <select
                                        value={newUserForm.status}
                                        onChange={e => setNewUserForm(prev => ({ ...prev, status: e.target.value as any }))}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                                    >
                                        <option value="Active">Active (Permit Login)</option>
                                        <option value="Inactive">Inactive (Provisional)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Password Provisioning Section */}
                            <div className="p-4 bg-teal-50/50 border border-teal-200 rounded-2xl space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-black text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                                        <Lock size={13} /> Initial Password Setup
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const securePass = generateSecurePassword();
                                            setNewUserForm(prev => ({
                                                ...prev,
                                                password: securePass,
                                                confirmPassword: securePass
                                            }));
                                            showNotice("Secure randomized password generated and applied!", "success");
                                        }}
                                        className="px-2.5 py-1 bg-white border border-teal-300 hover:bg-teal-50 text-teal-800 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                                    >
                                        <Sparkles size={12} className="text-teal-600" /> Automatically Generate Secure Password
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="relative">
                                        <label className="font-bold text-slate-700 block mb-1 text-xs">Password *</label>
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            required
                                            placeholder="Min. 8 characters"
                                            value={newUserForm.password}
                                            onChange={e => setNewUserForm(prev => ({ ...prev, password: e.target.value }))}
                                            className="w-full pr-8 pl-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-2.5 top-7 text-slate-400 hover:text-slate-600"
                                        >
                                            {showNewPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                                        </button>
                                    </div>

                                    <div className="relative">
                                        <label className="font-bold text-slate-700 block mb-1 text-xs">Confirm Password *</label>
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            required
                                            placeholder="Re-enter password"
                                            value={newUserForm.confirmPassword}
                                            onChange={e => setNewUserForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                            className="w-full pr-8 pl-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-2.5 top-7 text-slate-400 hover:text-slate-600"
                                        >
                                            {showConfirmPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Strength meter */}
                                {newUserForm.password && (
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center text-[10px] font-bold">
                                            <span className="text-slate-500">Password Strength:</span>
                                            <span className={calculatePasswordStrength(newUserForm.password).text}>
                                                {calculatePasswordStrength(newUserForm.password).label}
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${calculatePasswordStrength(newUserForm.password).color} transition-all duration-300`}
                                                style={{ width: `${(calculatePasswordStrength(newUserForm.password).score / 5) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="pt-1">
                                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                                        <input
                                            type="checkbox"
                                            checked={newUserForm.forcePasswordChange}
                                            onChange={e => setNewUserForm(prev => ({ ...prev, forcePasswordChange: e.target.checked }))}
                                            className="rounded text-teal-600 focus:ring-teal-500"
                                        />
                                        <span>Force Password Change on First Login (Recommended for cybersecurity)</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateUserModal(false)}
                                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-teal-600/20"
                                >
                                    Create User Account
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 4: ADMINISTRATOR PASSWORD RESET MODAL */}
            {showResetPasswordModal && selectedEmployeeForAction && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-100 shadow-2xl">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                                    <Key size={18} />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900">Reset User Password</h3>
                                    <p className="text-xs text-slate-500">Administrator-initiated secure password override</p>
                                </div>
                            </div>
                            <button onClick={() => setShowResetPasswordModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                                <X size={18} className="text-slate-400" />
                            </button>
                        </div>

                        {/* Target Account Summary */}
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                            <div>
                                <div className="font-bold text-slate-900 text-xs">{selectedEmployeeForAction.name}</div>
                                <div className="text-[11px] text-teal-700 font-mono font-semibold">
                                    @{selectedEmployeeForAction.username || selectedEmployeeForAction.id} • {selectedEmployeeForAction.id}
                                </div>
                                <div className="text-[10px] text-slate-500">{selectedEmployeeForAction.department} - {selectedEmployeeForAction.role}</div>
                            </div>
                            <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-mono font-bold rounded">
                                {selectedEmployeeForAction.status}
                            </span>
                        </div>

                        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
                            <strong>Security Principle:</strong> Existing user passwords are encrypted one-way and cannot be viewed or retrieved by administrators. Generating a new temporary password invalidates previous credentials immediately.
                        </div>

                        <form onSubmit={handleResetPasswordSubmit} className="space-y-4 text-xs">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-slate-700">Temporary Password Setup</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const pass = generateSecurePassword();
                                            setResetPasswordForm(prev => ({
                                                ...prev,
                                                newPassword: pass,
                                                confirmPassword: pass
                                            }));
                                            showNotice("Secure temporary password generated!", "info");
                                        }}
                                        className="px-2 py-1 bg-amber-100/70 hover:bg-amber-100 text-amber-900 font-bold rounded-lg text-[10px] flex items-center gap-1 transition-colors"
                                    >
                                        <Sparkles size={11} /> Auto-Generate Secure Password
                                    </button>
                                </div>

                                <div className="relative">
                                    <label className="font-semibold text-slate-600 block mb-1">New Temporary Password *</label>
                                    <input
                                        type={showResetTempPassword ? "text" : "password"}
                                        required
                                        placeholder="Enter or generate temporary password"
                                        value={resetPasswordForm.newPassword}
                                        onChange={e => setResetPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                                        className="w-full pr-8 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowResetTempPassword(!showResetTempPassword)}
                                        className="absolute right-2.5 top-7 text-slate-400 hover:text-slate-600"
                                    >
                                        {showResetTempPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                                    </button>
                                </div>

                                <div>
                                    <label className="font-semibold text-slate-600 block mb-1">Confirm Temporary Password *</label>
                                    <input
                                        type={showResetTempPassword ? "text" : "password"}
                                        required
                                        placeholder="Confirm temporary password"
                                        value={resetPasswordForm.confirmPassword}
                                        onChange={e => setResetPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="font-semibold text-slate-600 block mb-1">Reason for Password Reset *</label>
                                    <select
                                        value={resetPasswordForm.reason}
                                        onChange={e => setResetPasswordForm(prev => ({ ...prev, reason: e.target.value }))}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
                                    >
                                        <option value="User Forgotten Password">User Forgotten Password</option>
                                        <option value="Routine Security Rotation">Routine Security Rotation</option>
                                        <option value="Account Compromise Suspicion">Account Compromise Suspicion</option>
                                        <option value="Initial Provisioning Delivery">Initial Provisioning Delivery</option>
                                        <option value="Administrative Governance Request">Administrative Governance Request</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5 pt-1">
                                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                                        <input
                                            type="checkbox"
                                            checked={resetPasswordForm.forcePasswordChange}
                                            onChange={e => setResetPasswordForm(prev => ({ ...prev, forcePasswordChange: e.target.checked }))}
                                            className="rounded text-amber-600 focus:ring-amber-500"
                                        />
                                        <span>Force Password Change on Next Login (User will be prompted upon login)</span>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                                        <input
                                            type="checkbox"
                                            checked={resetPasswordForm.terminateSessions}
                                            onChange={e => setResetPasswordForm(prev => ({ ...prev, terminateSessions: e.target.checked }))}
                                            className="rounded text-amber-600 focus:ring-amber-500"
                                        />
                                        <span>Terminate All Existing Active Sessions for this User</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowResetPasswordModal(false)}
                                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-600/20"
                                >
                                    Confirm Reset Password
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 5: USER ACCOUNT DETAILS MODAL */}
            {showUserDetailsModal && selectedEmployeeForAction && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-100 shadow-2xl">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-black text-sm">
                                    {selectedEmployeeForAction.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900">{selectedEmployeeForAction.name}</h3>
                                    <p className="text-xs text-teal-700 font-mono">@{selectedEmployeeForAction.username || selectedEmployeeForAction.id} • {selectedEmployeeForAction.id}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowUserDetailsModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                                <X size={18} className="text-slate-400" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="text-[10px] font-bold text-slate-400 uppercase">Designation</div>
                                <div className="font-bold text-slate-800 mt-0.5">{selectedEmployeeForAction.designation || selectedEmployeeForAction.role}</div>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="text-[10px] font-bold text-slate-400 uppercase">Department</div>
                                <div className="font-bold text-slate-800 mt-0.5">{selectedEmployeeForAction.department}</div>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="text-[10px] font-bold text-slate-400 uppercase">Assigned Role</div>
                                <div className="font-bold text-teal-700 font-mono mt-0.5">{selectedEmployeeForAction.role}</div>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="text-[10px] font-bold text-slate-400 uppercase">Assigned Room / Counter</div>
                                <div className="font-bold text-slate-800 mt-0.5">{selectedEmployeeForAction.assignedRoom || 'Unassigned'}</div>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="text-[10px] font-bold text-slate-400 uppercase">Branch Code</div>
                                <div className="font-bold text-slate-800 mt-0.5">{selectedEmployeeForAction.branchId || 'BR001'}</div>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="text-[10px] font-bold text-slate-400 uppercase">Account Status</div>
                                <div className="font-bold text-emerald-700 mt-0.5">{selectedEmployeeForAction.status}</div>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="text-[10px] font-bold text-slate-400 uppercase">Email Address</div>
                                <div className="font-semibold text-slate-800 mt-0.5 truncate">{selectedEmployeeForAction.email || 'N/A'}</div>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="text-[10px] font-bold text-slate-400 uppercase">Contact Number</div>
                                <div className="font-semibold text-slate-800 mt-0.5">{selectedEmployeeForAction.contact || 'N/A'}</div>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="text-[10px] font-bold text-slate-400 uppercase">Last Login Activity</div>
                                <div className="font-semibold text-slate-800 font-mono mt-0.5">{selectedEmployeeForAction.lastLogin || 'Never'}</div>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="text-[10px] font-bold text-slate-400 uppercase">Active Sessions</div>
                                <div className="font-semibold text-slate-800 mt-0.5">{selectedEmployeeForAction.activeSessions || 0} active connection(s)</div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                            <button
                                onClick={() => {
                                    setShowUserDetailsModal(false);
                                    openEditUserModal(selectedEmployeeForAction);
                                }}
                                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5"
                            >
                                <Edit size={13} /> Edit Account
                            </button>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setShowUserDetailsModal(false);
                                        setShowResetPasswordModal(true);
                                    }}
                                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                                >
                                    <Key size={13} /> Reset Password
                                </button>
                                <button
                                    onClick={() => setShowUserDetailsModal(false)}
                                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 6: EDIT USER ACCOUNT MODAL */}
            {showEditUserModal && selectedEmployeeForAction && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
                    <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 border border-slate-100 shadow-2xl my-8">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                    <Edit size={18} />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900">Edit User Account</h3>
                                    <p className="text-xs text-slate-500">Update staff profile, room allocation, shift, and account state</p>
                                </div>
                            </div>
                            <button onClick={() => setShowEditUserModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                                <X size={18} className="text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleEditUserSubmit} className="space-y-4 text-xs">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={editUserForm.name}
                                        onChange={e => setEditUserForm(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Username (Login ID) *</label>
                                    <input
                                        type="text"
                                        required
                                        value={editUserForm.username}
                                        onChange={e => setEditUserForm(prev => ({ ...prev, username: e.target.value.toLowerCase() }))}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Email Address *</label>
                                    <input
                                        type="email"
                                        required
                                        value={editUserForm.email}
                                        onChange={e => setEditUserForm(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Contact Phone</label>
                                    <input
                                        type="text"
                                        value={editUserForm.contact}
                                        onChange={e => setEditUserForm(prev => ({ ...prev, contact: e.target.value }))}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Designation</label>
                                    <input
                                        type="text"
                                        value={editUserForm.designation}
                                        onChange={e => setEditUserForm(prev => ({ ...prev, designation: e.target.value }))}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Department</label>
                                    <select
                                        value={editUserForm.department}
                                        onChange={e => setEditUserForm(prev => ({ ...prev, department: e.target.value }))}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="Clinical">Clinical</option>
                                        <option value="Front Office">Front Office</option>
                                        <option value="Pharmacy">Pharmacy</option>
                                        <option value="Finance">Finance</option>
                                        <option value="Administration">Administration</option>
                                        <option value="HR">HR</option>
                                        <option value="Nursing">Nursing</option>
                                        <option value="Optical">Optical</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Assigned Room / Counter</label>
                                    <input
                                        type="text"
                                        value={editUserForm.assignedRoom}
                                        onChange={e => setEditUserForm(prev => ({ ...prev, assignedRoom: e.target.value }))}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Assigned Role</label>
                                    <select
                                        value={editUserForm.role}
                                        onChange={e => setEditUserForm(prev => ({ ...prev, role: e.target.value }))}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        {availableRoles.map(r => (
                                            <option key={r.id} value={r.name}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Additional Role</label>
                                    <input
                                        type="text"
                                        placeholder="Optional tag"
                                        value={editUserForm.additionalRole}
                                        onChange={e => setEditUserForm(prev => ({ ...prev, additionalRole: e.target.value }))}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Account Status</label>
                                    <select
                                        value={editUserForm.status}
                                        onChange={e => setEditUserForm(prev => ({ ...prev, status: e.target.value as any }))}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                        <option value="Locked">Locked</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowEditUserModal(false)}
                                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-600/20"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 7: LOGIN HISTORY & AUDIT MODAL */}
            {showLoginHistoryModal && selectedEmployeeForAction && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 border border-slate-100 shadow-2xl">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
                                    <History size={18} />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900">Login History & Session Audit</h3>
                                    <p className="text-xs text-slate-500">Security event log for @{selectedEmployeeForAction.username || selectedEmployeeForAction.id}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowLoginHistoryModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                                <X size={18} className="text-slate-400" />
                            </button>
                        </div>

                        <div className="space-y-2 max-h-72 overflow-y-auto">
                            {[
                                { date: 'Today, 08:30 AM', ip: '192.168.1.104', device: 'Chrome on Windows 11 (Main Campus Desk)', status: 'Active (Current)' },
                                { date: 'Yesterday, 08:15 AM', ip: '192.168.1.104', device: 'Chrome on Windows 11 (Main Campus Desk)', status: 'Logged Out Cleanly' },
                                { date: '26 Nov 2026, 02:40 PM', ip: '192.168.1.118', device: 'Firefox on Android (Hospital Tablet)', status: 'Session Expired' },
                                { date: '25 Nov 2026, 08:30 AM', ip: '192.168.1.104', device: 'Chrome on Windows 11 (Main Campus Desk)', status: 'Logged Out Cleanly' }
                            ].map((session, idx) => (
                                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                                    <div className="space-y-0.5">
                                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                            <span>{session.date}</span>
                                            {idx === 0 && <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[9px] font-black rounded uppercase">Current</span>}
                                        </div>
                                        <div className="text-[11px] text-slate-500">{session.device}</div>
                                        <div className="text-[10px] text-slate-400 font-mono">IP: {session.ip}</div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-1 rounded-lg border border-slate-200">
                                        {session.status}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                            <button
                                onClick={() => handleTerminateSessions(selectedEmployeeForAction)}
                                className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                            >
                                <LogOut size={13} /> Terminate All Sessions
                            </button>
                            <button
                                onClick={() => setShowLoginHistoryModal(false)}
                                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 8: USER SELF PASSWORD CHANGE MODAL */}
            {showSelfPasswordChangeModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-100 shadow-2xl">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                                    <Key size={18} />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900">Change My Password</h3>
                                    <p className="text-xs text-slate-500">Update your personal account login credentials</p>
                                </div>
                            </div>
                            <button onClick={() => setShowSelfPasswordChangeModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                                <X size={18} className="text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSelfPasswordChangeSubmit} className="space-y-3 text-xs">
                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Current Password *</label>
                                <input
                                    type="password"
                                    required
                                    placeholder="Enter current password"
                                    value={selfPasswordForm.currentPassword}
                                    onChange={e => setSelfPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="font-bold text-slate-700 block mb-1">New Password * (Min 8 characters)</label>
                                <input
                                    type="password"
                                    required
                                    placeholder="Enter new strong password"
                                    value={selfPasswordForm.newPassword}
                                    onChange={e => setSelfPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Confirm New Password *</label>
                                <input
                                    type="password"
                                    required
                                    placeholder="Confirm new password"
                                    value={selfPasswordForm.confirmPassword}
                                    onChange={e => setSelfPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowSelfPasswordChangeModal(false)}
                                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-teal-600/20"
                                >
                                    Update Password
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SystemSettingsDemo;
