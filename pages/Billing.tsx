
import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { Patient, Invoice, InvoiceItem, Appointment, Bed, BillingItem } from '../types';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Search, Plus, Trash2, Printer, CheckCircle, CreditCard, User,
    FileText, Download, ReceiptText, ArrowLeft, Stethoscope, Bed as BedIcon,
    TestTube, Pill, Filter, Eye, AlertCircle, ScanLine, Calendar, Save, X,
    Edit, RefreshCw, TrendingUp, PieChart as PieIcon, BarChart3, Link as LinkIcon,
    CheckSquare, Square, ChevronRight, Hash, ClipboardList, Info, Settings, Coins, Mail
} from 'lucide-react';
import { MOCK_EMPLOYEES } from '../constants';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { downloadPDF, shareToWhatsApp } from '../services/exportService';
import { CustomDatePicker } from '../components/CustomDatePicker';

const Billing = () => {
    const {
        patients, invoices, billingItems, addBillingItem, updateBillingItem, deleteBillingItem,
        addInvoice, updateInvoice, deleteInvoice, addPatient, addAppointment,
        updateBed, beds, formatCurrency, currency, hasPermission, admissions, updateAdmission, updatePatient,
        addLabTest, labTestDefinitions } = useData();

    const canAdd = hasPermission('Billing & POS', 'add');
    const canEdit = hasPermission('Billing & POS', 'edit');
    const canDelete = hasPermission('Billing & POS', 'delete');
    const canPrint = hasPermission('Billing & POS', 'print');
    const canExport = hasPermission('Billing & POS', 'export');
    const canView = hasPermission('Billing & POS', 'view');
    const canManageMaster = hasPermission('Billing & POS', 'edit');
    const location = useLocation();
    const navigate = useNavigate();

    const [view, setView] = useState<'dashboard' | 'department_select' | 'create_bill' | 'invoice_view' | 'service_master'>('dashboard');
    const [dashboardSearch, setDashboardSearch] = useState('');

    const [dateRange, setDateRange] = useState({
        start: '2023-01-01',
        end: new Date().toISOString().split('T')[0]
    });

    const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<string>>(new Set());
    const [selectedDept, setSelectedDept] = useState<string>('');
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [patientSearch, setPatientSearch] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [billItems, setBillItems] = useState<InvoiceItem[]>([]);
    const [serviceDeptFilter, setServiceDeptFilter] = useState<string>('All');
    const [selectedServiceId, setSelectedServiceId] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Insurance' | 'Dues/Later'>('Cash');
    const [discount, setDiscount] = useState(0);
    const [showQuickReg, setShowQuickReg] = useState(false);
    const [newPatientData, setNewPatientData] = useState({
        name: '', age: '', gender: 'Male', contact: '',
        address: '', registrationType: 'OPD', referringDoctor: '', diagnosis: ''
    });
    const [quickAction, setQuickAction] = useState<'None' | 'Appointment' | 'Bed'>('None');
    const [quickActionTarget, setQuickActionTarget] = useState('');
    const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
    const [paperSize, setPaperSize] = useState<'A4' | 'A5' | 'Letter' | 'Legal'>('A4');
    const [paymentGateway, setPaymentGateway] = useState<Invoice['paymentGateway']>('SSL Commerz');
    const [transactionId, setTransactionId] = useState('');
    const [deliveryTiming, setDeliveryTiming] = useState('24 Hours');

    const paperConfigs = {
        A4: { w: '210mm', minH: '297mm' },
        A5: { w: '148mm', minH: '210mm' },
        Letter: { w: '215.9mm', minH: '279.4mm' },
        Legal: { w: '215.9mm', minH: '355.6mm' }
    };

    // Handle dynamic print page size
    useEffect(() => {
        const styleId = 'invoice-print-size-style';
        let style = document.getElementById(styleId);
        if (!style) {
            style = document.createElement('style');
            style.id = styleId;
            document.head.appendChild(style);
        }
        if (view === 'invoice_view') {
            style.innerHTML = `@media print { @page { size: ${paperSize.toLowerCase()} portrait; margin: 0; } }`;
        } else {
            style.innerHTML = '';
        }
        return () => {
            const currentStyle = document.getElementById(styleId);
            if (currentStyle) currentStyle.innerHTML = '';
        };
    }, [paperSize, view]);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showItemModal, setShowItemModal] = useState(false);
    const [editingItem, setEditingItem] = useState<BillingItem | null>(null);
    const [itemFormData, setItemFormData] = useState<Partial<BillingItem>>({ name: '', department: 'OPD', price: 0 });
    const [masterSearch, setMasterSearch] = useState('');
    const [masterFilter, setMasterFilter] = useState('All');

    useEffect(() => {
        if (location.state) {
            if (location.state.view) setView(location.state.view);
            if (location.state.department) {
                setSelectedDept(location.state.department);
                setServiceDeptFilter(location.state.department);
            }
            if (location.state.patient) {
                const p = location.state.patient;
                setSelectedPatient(p);
                setPatientSearch(p.name);
                setDashboardSearch(p.name);
            }
            if (location.state.items) {
                setBillItems([...location.state.items]);
            }
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const filteredInvoices = invoices.filter(inv =>
        inv.date >= dateRange.start && inv.date <= dateRange.end &&
        (inv.patientName.toLowerCase().includes(dashboardSearch.toLowerCase()) ||
            inv.patientId.toLowerCase().includes(dashboardSearch.toLowerCase()) ||
            inv.id.toLowerCase().includes(dashboardSearch.toLowerCase()))
    );

    const subtotal = billItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const tax = subtotal * 0.05;
    const total = subtotal + tax - discount;

    const totalRevenue = filteredInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
    const pendingInvoices = filteredInvoices.filter(i => i.paymentStatus === 'Pending' || i.paymentStatus === 'Overdue');
    const pendingAmount = pendingInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0);

    const filteredServices = serviceDeptFilter === 'All' ? billingItems : billingItems.filter(s => s.department === serviceDeptFilter);
    const doctors = MOCK_EMPLOYEES.filter(e => e.role.includes('Doctor'));
    const availableBeds = beds.filter(b => b.status === 'Available');

    const startNewBill = () => { resetForm(); setView('department_select'); };
    const selectDepartment = (dept: string) => { setSelectedDept(dept); setServiceDeptFilter(dept); setView('create_bill'); };
    const resetForm = () => { setSelectedDept(''); setSelectedPatient(null); setPatientSearch(''); setBillItems([]); setDiscount(0); setPaymentMethod('Cash'); setServiceDeptFilter('All'); setIsEditMode(false); };

    const handleEditInvoice = (inv: Invoice) => {
        const patient = patients.find(p => p.id === inv.patientId) || null;
        setSelectedPatient(patient); if (patient) setPatientSearch(patient.name);
        setSelectedDept(inv.department); setServiceDeptFilter(inv.department);
        setBillItems([...inv.items]); setDiscount(inv.discount); setPaymentMethod(inv.paymentMethod);
        setIsEditMode(true); setViewInvoice(inv); setView('create_bill');
    };

    const handleSelectAll = () => {
        if (selectedInvoiceIds.size === filteredInvoices.length) setSelectedInvoiceIds(new Set());
        else setSelectedInvoiceIds(new Set(filteredInvoices.map(inv => inv.id)));
    };

    const handleSelectRow = (id: string) => {
        const newSelected = new Set(selectedInvoiceIds);
        if (newSelected.has(id)) newSelected.delete(id); else newSelected.add(id);
        setSelectedInvoiceIds(newSelected);
    };

    // Fix: Implemented missing handler for patient search input
    const handlePatientSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPatientSearch(e.target.value);
        setSelectedPatient(null);
        setShowSuggestions(true);
    };

    // Fix: Implemented missing handler for selecting a patient from suggestions
    const selectPatient = (p: Patient) => {
        setSelectedPatient(p);
        setPatientSearch(p.name);
        setShowSuggestions(false);
    };

    // Fix: Implemented missing handler for adding a service to the bill
    const addService = () => {
        const service = billingItems.find(s => s.id === selectedServiceId);
        if (service) {
            const existing = billItems.find(i => i.id === service.id);
            if (existing) {
                setBillItems(billItems.map(i => i.id === service.id ? { ...i, qty: i.qty + 1 } : i));
            } else {
                setBillItems([...billItems, { id: service.id, description: service.name, price: service.price, qty: 1 }]);
            }
            setSelectedServiceId('');
        }
    };

    // Fix: Implemented missing handler for updating quantity of an item in the bill
    const updateQty = (id: string, qty: number) => {
        setBillItems(billItems.map(i => i.id === id ? { ...i, qty: Math.max(1, qty) } : i));
    };

    // Fix: Implemented missing handler for removing a service from the bill
    const removeService = (id: string) => {
        setBillItems(billItems.filter(i => i.id !== id));
    };

    const handleSubmitInvoice = () => {
        if (!selectedPatient || billItems.length === 0) return;

        const invoiceId = isEditMode && viewInvoice ? viewInvoice.id : `INV-${Date.now().toString().slice(-6)}`;
        const pStatus = paymentMethod === 'Dues/Later' ? 'Pending' : (isEditMode && viewInvoice ? viewInvoice.paymentStatus : 'Paid');

        const invoiceData: Invoice = {
            id: invoiceId,
            patientId: selectedPatient.id, patientName: selectedPatient.name, patientContact: selectedPatient.contact,
            date: new Date().toISOString().split('T')[0], department: selectedDept as any, items: billItems,
            subtotal, tax, discount, totalAmount: total, currency,
            paymentMethod: paymentMethod === 'Dues/Later' ? 'Cash' : paymentMethod as any,
            paymentGateway: paymentMethod === 'Online' ? paymentGateway : undefined,
            transactionId: paymentMethod === 'Online' ? transactionId : undefined,
            paymentStatus: pStatus,
            workflowStatus: isEditMode && viewInvoice ? viewInvoice.workflowStatus : (selectedDept === 'Lab' ? 'Sample Pending' : 'Completed'),
            reportDeliverySlot: deliveryTiming
        };

        if (isEditMode && viewInvoice) updateInvoice(viewInvoice.id, invoiceData); else addInvoice(invoiceData);

        // Automation: If Lab Bill, propagate to Lab Module
        if (!isEditMode) {
            billItems.forEach(item => {
                const masterService = billingItems.find(s => s.id === item.id || s.name === item.description);
                if (masterService?.department === 'Lab' || selectedDept === 'Lab') {
                    const testDef = labTestDefinitions.find(td => td.name === item.description || (masterService && td.code === masterService.code));
                    addLabTest({
                        id: `LAB-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 999)}`,
                        patientId: selectedPatient.id,
                        patientName: selectedPatient.name,
                        testName: item.description,
                        date: invoiceData.date,
                        status: 'Pending',
                        price: item.price,
                        referenceRange: testDef?.referenceRange || 'N/A',
                        deliveryTiming: deliveryTiming,
                        invoiceId: invoiceId,
                        paymentStatus: pStatus
                    });
                }
            });
        }

        // Automation: If IPD Bill, handle discharge
        if (selectedDept === 'IPD' && selectedPatient) {
            const activeAdmission = admissions.find(a => a.patientId === selectedPatient.id && a.status === 'Active');
            if (activeAdmission) {
                updateAdmission(activeAdmission.id, { status: 'Discharged', actualDischargeDate: new Date().toISOString().split('T')[0] });
                updateBed(activeAdmission.bedId, { status: 'Cleaning', patientId: undefined, admissionId: undefined });
            }
        }

        setViewInvoice(invoiceData); setView('invoice_view'); setIsEditMode(false);
    };

    if (view === 'dashboard') {
        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Billing & Invoices</h1>
                        <p className="text-sm text-slate-500">Manage billing, invoices, and payment collection.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1.5 shadow-sm">
                            <CustomDatePicker
                                value={dateRange.start}
                                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                className="!text-sm !py-0.5 !border-0 w-32"
                                placeholder="Start Date"
                            />
                            <span className="text-slate-300">-</span>
                            <CustomDatePicker
                                value={dateRange.end}
                                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                className="!text-sm !py-0.5 !border-0 w-32"
                                placeholder="End Date"
                            />
                        </div>
                        <div className="flex gap-2">
                            {canManageMaster && <button onClick={() => setView('service_master')} className="bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2 justify-center"><Settings size={16} /> Master</button>}
                            {canAdd && <button onClick={startNewBill} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors flex items-center gap-2 shadow-sm justify-center"><Plus size={16} /> New Bill</button>}
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between"><div><p className="text-xs font-bold text-slate-500 uppercase">Revenue</p><h3 className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalRevenue)}</h3></div><div className="p-3 bg-teal-50 rounded-full text-teal-600 font-bold text-xl w-12 h-12 flex items-center justify-center">৳</div></div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between"><div><p className="text-xs font-bold text-slate-500 uppercase">Dues</p><h3 className="text-2xl font-bold text-amber-600 mt-1">{formatCurrency(pendingAmount)}</h3></div><div className="p-3 bg-amber-50 rounded-full text-amber-600"><AlertCircle size={24} /></div></div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between"><div><p className="text-xs font-bold text-slate-500 uppercase">Invoices</p><h3 className="text-2xl font-bold text-slate-900 mt-1">{filteredInvoices.length}</h3></div><div className="p-3 bg-blue-50 rounded-full text-blue-600"><FileText size={24} /></div></div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input type="text" placeholder="Filter by Name, ID or Invoice No..." className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500" value={dashboardSearch} onChange={(e) => setDashboardSearch(e.target.value)} />
                        </div>
                        <div className="flex gap-2"><button onClick={() => setDashboardSearch('')} className="text-xs text-teal-600 font-bold px-2 py-1 underline">Clear Filters</button></div>
                    </div>
                    <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-white text-slate-500 font-medium border-b border-slate-100"><tr><th className="px-6 py-4 w-10"><button onClick={handleSelectAll} className="flex items-center justify-center text-slate-400">{selectedInvoiceIds.size === filteredInvoices.length && filteredInvoices.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}</button></th><th className="px-6 py-4">Invoice ID</th><th className="px-6 py-4">Patient</th><th className="px-6 py-4">Amount</th><th className="px-6 py-4">Payment</th><th className="px-6 py-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-50">{filteredInvoices.map((inv) => (<tr key={inv.id} className={`hover:bg-slate-50 ${selectedInvoiceIds.has(inv.id) ? 'bg-indigo-50' : ''}`}><td className="px-6 py-4"><button onClick={() => handleSelectRow(inv.id)} className="flex items-center justify-center text-slate-400">{selectedInvoiceIds.has(inv.id) ? <CheckSquare size={18} className="text-indigo-600" /> : <Square size={18} />}</button></td><td className="px-6 py-4 font-mono text-slate-600">{inv.id}</td><td className="px-6 py-4 font-medium text-slate-900">{inv.patientName}<div className="text-xs text-slate-400">{inv.patientId}</div></td><td className="px-6 py-4 font-bold text-slate-800">{formatCurrency(inv.totalAmount)}</td><td className="px-6 py-4">{inv.paymentStatus === 'Paid' ? <span className="text-green-600 font-bold text-xs flex items-center gap-1"><CheckCircle size={14} /> Paid</span> : <span className="text-amber-600 font-bold text-xs">{inv.paymentStatus}</span>}</td><td className="px-6 py-4 text-right"><div className="flex justify-end gap-1"><button onClick={() => { setViewInvoice(inv); setView('invoice_view'); }} className="p-1.5 text-slate-500 hover:text-blue-600"><Eye size={16} /></button>{canEdit && <button onClick={() => handleEditInvoice(inv)} className="p-1.5 text-slate-500 hover:text-teal-600"><Edit size={16} /></button>}</div></td></tr>))}</tbody></table></div>
                </div>
            </div>
        );
    }

    if (view === 'department_select') {
        return (
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in duration-300">
                <button onClick={() => setView('dashboard')} className="text-slate-500 hover:text-slate-800 flex items-center gap-2 mb-4"><ArrowLeft size={20} /> Back to Dashboard</button>
                <div className="text-center mb-8"><h2 className="text-2xl font-bold text-slate-900">Select Billing Department</h2></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[{ id: 'OPD', name: 'OPD Billing', icon: Stethoscope, color: 'text-blue-600', bg: 'bg-blue-50' }, { id: 'IPD', name: 'IPD / Admission', icon: BedIcon, color: 'text-amber-600', bg: 'bg-amber-50' }, { id: 'Lab', name: 'Lab & Path', icon: TestTube, color: 'text-purple-600', bg: 'bg-purple-50' }, { id: 'Pharmacy', name: 'Pharmacy', icon: Pill, color: 'text-green-600', bg: 'bg-green-50' }].map(dept => (
                        <div key={dept.id} onClick={() => selectDepartment(dept.id)} className={`cursor-pointer rounded-2xl p-6 border-2 transition-all hover:shadow-lg flex flex-col items-center justify-center gap-4 h-48 bg-white hover:border-teal-500`}>
                            <div className={`p-4 rounded-full bg-white shadow-sm ${dept.color}`}><dept.icon size={32} /></div>
                            <h3 className="font-bold text-lg text-slate-800">{dept.name}</h3>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (view === 'create_bill') {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300 relative">
                <div className="flex items-center gap-4 mb-4"><button onClick={() => setView('department_select')} className="p-2 rounded-full hover:bg-slate-100"><ArrowLeft size={20} className="text-slate-600" /></button><div><h2 className="text-xl font-bold text-slate-900">{isEditMode ? 'Edit Bill' : 'New Bill'}: {selectedDept}</h2></div></div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                            <div className="flex justify-between items-center mb-4"><h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><User size={16} className="text-teal-600" /> Patient Details</h3><button onClick={() => setShowQuickReg(true)} className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded border border-teal-200 flex items-center gap-1"><Plus size={12} /> New Patient</button></div>
                            <div className="relative flex gap-2">
                                <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" /><input type="text" placeholder="Search by UHID, Name, or Mobile..." className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" value={patientSearch} onChange={handlePatientSearch} onFocus={() => setShowSuggestions(true)} /></div>
                                {showSuggestions && patientSearch && !selectedPatient && (
                                    <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-100 rounded-lg shadow-xl py-2 z-20 max-h-60 overflow-y-auto">
                                        {patients.filter(p => p.name.toLowerCase().includes(patientSearch.toLowerCase()) || p.id.toLowerCase().includes(patientSearch.toLowerCase())).map(p => (
                                            <div key={p.id} onClick={() => selectPatient(p)} className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm">
                                                <div className="font-medium text-slate-800">{p.name}</div>
                                                <div className="text-xs text-slate-400">{p.id}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {selectedPatient && <div className="mt-4 p-3 bg-teal-50 border border-teal-100 rounded-lg flex justify-between"><div><div className="font-bold text-teal-900">{selectedPatient.name}</div><div className="text-xs text-teal-700">{selectedPatient.id}</div></div><button onClick={() => setSelectedPatient(null)} className="text-xs text-teal-700 underline">Change</button></div>}
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><ReceiptText size={16} className="text-teal-600" /> Services & Items</h3>
                            <div className="flex flex-col md:flex-row gap-2 mb-4">
                                <select className="w-full md:w-1/3 p-2 border border-slate-200 rounded-lg text-sm bg-slate-50" value={serviceDeptFilter} onChange={(e) => setServiceDeptFilter(e.target.value)}><option value="All">All Departments</option><option value="OPD">OPD</option><option value="IPD">IPD</option><option value="Lab">Lab</option><option value="Surgery">Surgery</option></select>
                                <div className="flex-1 flex gap-2"><select className="flex-1 p-2 border border-slate-200 rounded-lg text-sm" value={selectedServiceId} onChange={(e) => setSelectedServiceId(e.target.value)}><option value="">-- Select Service --</option>{filteredServices.map(s => <option key={s.id} value={s.id}>{s.name} - {formatCurrency(s.price)}</option>)}</select><button onClick={addService} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700"><Plus size={18} /></button></div>
                            </div>
                            <table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-500 font-medium"><tr><th className="px-4 py-2">Item</th><th className="px-4 py-2 w-20 text-center">Qty</th><th className="px-4 py-2 text-right">Price</th><th className="px-4 py-2 text-right">Total</th><th className="px-4 py-2"></th></tr></thead><tbody className="divide-y divide-slate-100">{billItems.map(item => (<tr key={item.id}><td className="px-4 py-2">{item.description}</td><td className="px-4 py-2"><input type="number" min="1" value={item.qty} onChange={(e) => updateQty(item.id, parseInt(e.target.value))} className="w-12 text-center border rounded p-1 mx-auto block" /></td><td className="px-4 py-2 text-right">{formatCurrency(item.price)}</td><td className="px-4 py-2 text-right font-medium">{formatCurrency(item.price * item.qty)}</td><td className="px-4 py-2 text-center"><button onClick={() => removeService(item.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button></td></tr>))}</tbody></table>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit space-y-6">
                        <div>
                            <h3 className="text-xs font-black uppercase text-slate-400 mb-3 tracking-widest">Payment Configuration</h3>
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                {['Cash', 'Card', 'Online', 'Dues/Later'].map(m => (
                                    <button key={m} onClick={() => setPaymentMethod(m as any)} className={`py-2 px-3 rounded-lg text-xs font-black uppercase tracking-tight border transition-all ${paymentMethod === m ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-500 border-slate-200'}`}>{m}</button>
                                ))}
                            </div>

                            {paymentMethod === 'Online' && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                    <select className="w-full p-2 border rounded-lg text-xs font-bold text-slate-700" value={paymentGateway} onChange={e => setPaymentGateway(e.target.value as any)}>
                                        <option value="SSL Commerz">SSL Commerz</option>
                                        <option value="bKash">bKash</option>
                                        <option value="Nagad">Nagad</option>
                                        <option value="Rocket">Rocket</option>
                                        <option value="Visa/MasterCard">Visa / MasterCard</option>
                                    </select>
                                    <input type="text" placeholder="Transaction ID / Mobile" className="w-full p-2 border rounded-lg text-xs font-medium" value={transactionId} onChange={e => setTransactionId(e.target.value)} />
                                </div>
                            )}

                            {selectedDept === 'Lab' && (
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Report Delivery Slot</label>
                                    <select className="w-full p-2 border rounded-lg text-xs font-bold text-slate-700" value={deliveryTiming} onChange={e => setDeliveryTiming(e.target.value)}>
                                        <option>4 Hours (Urgent)</option>
                                        <option>24 Hours (Standard)</option>
                                        <option>48 Hours</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <div className="space-y-2 mb-4 text-xs">
                                <div className="flex justify-between text-slate-500 font-bold"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                                <div className="flex justify-between text-slate-500 font-bold"><span>Tax (5%)</span><span>{formatCurrency(tax)}</span></div>
                                <div className="flex justify-between items-center pt-2">
                                    <span className="font-black text-slate-900 uppercase text-xs">Total Payable</span>
                                    <span className="font-black text-xl text-teal-700">{formatCurrency(total)}</span>
                                </div>
                            </div>
                            <button onClick={handleSubmitInvoice} disabled={!selectedPatient || billItems.length === 0} className="w-full py-4 bg-teal-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-teal-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-100"><CheckCircle size={16} /> Finalize & Print</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (view === 'invoice_view' && viewInvoice) {
        return (
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex justify-between items-center print:hidden">
                    <button onClick={() => setView('dashboard')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors"><ArrowLeft size={20} /> Back</button>
                    <div className="flex gap-2 items-center">
                        <select
                            className="text-xs font-black uppercase tracking-widest bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 shadow-sm mr-2"
                            value={paperSize}
                            onChange={(e) => setPaperSize(e.target.value as any)}
                        >
                            <option value="A4">A4 Size</option>
                            <option value="A5">A5 Size</option>
                            <option value="Letter">Letter</option>
                            <option value="Legal">Legal</option>
                        </select>
                        {canPrint && (
                            <button
                                onClick={() => downloadPDF('invoice-sheet', `Invoice_${viewInvoice.id}.pdf`)}
                                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold flex items-center gap-2 hover:text-teal-600 transition-all border-dashed"
                            >
                                <Download size={16} /> Export
                            </button>
                        )}
                        {canPrint && (
                            <button
                                onClick={() => shareToWhatsApp('invoice-sheet', `Hello, find the Invoice ${viewInvoice.id} for ${viewInvoice.patientName} attached.`)}
                                className="px-4 py-2 bg-white border border-slate-200 text-green-600 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-green-50 transition-all"
                            >
                                <Mail size={16} /> WhatsApp
                            </button>
                        )}
                        {canEdit && <button onClick={() => setShowStatusModal(true)} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg">Update Status</button>}
                        {canPrint && <button onClick={() => window.print()} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-all"><Printer size={16} /> Print</button>}
                    </div>
                </div>
                <div
                    className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden p-10 print:shadow-none print:border-none print:m-0 mx-auto"
                    id="invoice-sheet"
                    style={{
                        maxWidth: paperConfigs[paperSize].w,
                        minHeight: paperConfigs[paperSize].minH
                    }}
                >
                    <div className="flex justify-between items-start mb-10"><div className="flex items-center gap-3"><div className="p-3 bg-teal-600 rounded-2xl text-white shadow-lg"><Eye size={32} /></div><div><h1 className="text-2xl font-bold text-slate-900 uppercase">Visionary Care</h1><p className="text-xs text-slate-500">Specialist Eye Hospital</p></div></div><div className="text-right font-bold text-slate-800 font-mono">#{viewInvoice.id}</div></div>
                    <div className="grid grid-cols-2 gap-10 mb-10 p-6 bg-slate-50 rounded-2xl"><div><p className="text-xs font-black uppercase text-slate-400 mb-2">Patient Details</p><p className="font-bold text-slate-900">{viewInvoice.patientName}</p><p className="text-xs text-slate-500 font-mono">UHID: {viewInvoice.patientId}</p></div><div className="text-right"> <p className="text-xs font-black uppercase text-slate-400 mb-2">Invoice Info</p><p className="text-sm font-bold">Date: {viewInvoice.date}</p><p className="text-xs font-bold text-teal-600">{viewInvoice.department} Dept</p></div></div>
                    <table className="w-full text-left mb-10"><thead className="border-b-2 border-slate-100"><tr><th className="py-4 text-xs font-bold text-slate-400 uppercase">Service</th><th className="py-4 text-xs font-bold text-slate-400 uppercase text-center">Qty</th><th className="py-4 text-xs font-bold text-slate-400 uppercase text-right">Price</th><th className="py-4 text-xs font-bold text-slate-400 uppercase text-right">Total</th></tr></thead><tbody className="divide-y divide-slate-50">{viewInvoice.items.map((item, idx) => (<tr key={idx}><td className="py-5 font-bold text-slate-800 text-sm">{item.description}</td><td className="py-5 text-center text-sm">{item.qty}</td><td className="py-5 text-right text-sm">{formatCurrency(item.price)}</td><td className="py-5 text-right font-bold text-slate-900 text-sm">{formatCurrency(item.price * item.qty)}</td></tr>))}</tbody></table>
                    <div className="flex justify-end"><div className="w-64 space-y-2 border-t-2 border-slate-100 pt-4"><div className="flex justify-between text-sm text-slate-500 font-bold"><span>Subtotal</span><span>{formatCurrency(viewInvoice.subtotal)}</span></div><div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-xl mt-4"><span className="text-xs font-black uppercase">Grand Total</span><span className="text-xl font-black">{formatCurrency(viewInvoice.totalAmount)}</span></div></div></div>
                </div>
            </div>
        );
    }

    if (view === 'service_master') {
        const filteredMaster = billingItems.filter(item =>
            (masterFilter === 'All' || item.department === masterFilter) &&
            (item.name.toLowerCase().includes(masterSearch.toLowerCase()) || item.id.toLowerCase().includes(masterSearch.toLowerCase()))
        );

        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Settings className="text-teal-600" /> MASTER <span className="text-teal-600">CONFIGURATION</span>
                        </h1>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Global Service Catalog & Price Management</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setView('dashboard')} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-2 hover:border-teal-600 transition-all">
                            <ArrowLeft size={14} /> Back
                        </button>
                        <button
                            onClick={() => {
                                setEditingItem(null);
                                setItemFormData({ name: '', department: 'OPD', price: 0 });
                                setShowItemModal(true);
                            }}
                            className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-slate-200 hover:bg-teal-600 transition-all"
                        >
                            <Plus size={16} /> Inject Service
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search inventory (ID, Service Name)..."
                                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-tight focus:ring-2 focus:ring-teal-500 outline-none"
                                value={masterSearch}
                                onChange={(e) => setMasterSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex bg-white p-1 rounded-xl border border-slate-200 w-fit shrink-0">
                            {['All', 'OPD', 'IPD', 'Lab', 'Pharmacy', 'Surgery'].map(dept => (
                                <button
                                    key={dept}
                                    onClick={() => setMasterFilter(dept)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${masterFilter === dept ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {dept}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-[#fbfcff] text-slate-400 font-black uppercase tracking-[0.2em] border-b border-slate-100">
                                <tr>
                                    <th className="px-8 py-5">Internal UID</th>
                                    <th className="px-8 py-5">Service Descriptor</th>
                                    <th className="px-8 py-5">Domain</th>
                                    <th className="px-8 py-5 text-right">Standard Fee</th>
                                    <th className="px-8 py-5 text-right">Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredMaster.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-6 font-mono font-black text-teal-600">{item.id}</td>
                                        <td className="px-8 py-6">
                                            <div className="font-black text-slate-900 uppercase tracking-tight">{item.name}</div>
                                            <div className="text-[10px] font-bold text-slate-400 mt-0.5">Automated SKU Resolution Active</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-100">{item.department}</span>
                                        </td>
                                        <td className="px-8 py-6 text-right font-black text-slate-900 text-sm">{formatCurrency(item.price)}</td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingItem(item);
                                                        setItemFormData({ ...item });
                                                        setShowItemModal(true);
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => deleteBillingItem(item.id)}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Service Item Modal */}
                {showItemModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                        <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/20">
                            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                                <div>
                                    <h3 className="font-black uppercase tracking-widest text-xs flex items-center gap-2">
                                        <RefreshCw size={16} className="text-teal-400" /> Catalog Synchronization
                                    </h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">{editingItem ? 'Modification Phase' : 'Injection Phase'}</p>
                                </div>
                                <button onClick={() => setShowItemModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X size={20} /></button>
                            </div>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (editingItem) {
                                        updateBillingItem(editingItem.id, itemFormData);
                                    } else {
                                        addBillingItem({
                                            id: `SI-${Date.now().toString().slice(-4)}`,
                                            ...itemFormData as BillingItem
                                        });
                                    }
                                    setShowItemModal(false);
                                }}
                                className="p-8 space-y-5"
                            >
                                <div className="space-y-2">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Service Descriptor</label>
                                    <input
                                        required
                                        placeholder="e.g. CONSULTATION FEE"
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase tracking-tight focus:ring-2 focus:ring-teal-500 outline-none"
                                        value={itemFormData.name}
                                        onChange={e => setItemFormData({ ...itemFormData, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Domain / Dept</label>
                                        <select
                                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-teal-500 outline-none appearance-none"
                                            value={itemFormData.department}
                                            onChange={e => setItemFormData({ ...itemFormData, department: e.target.value as any })}
                                        >
                                            <option value="OPD">OPD</option>
                                            <option value="IPD">IPD</option>
                                            <option value="Lab">Lab</option>
                                            <option value="Pharmacy">Pharmacy</option>
                                            <option value="Surgery">Surgery</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Standard Fee</label>
                                        <input
                                            required
                                            type="number"
                                            placeholder="0.00"
                                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black focus:ring-2 focus:ring-teal-500 outline-none"
                                            value={itemFormData.price}
                                            onChange={e => setItemFormData({ ...itemFormData, price: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:bg-teal-600 transition-all mt-4">
                                    {editingItem ? 'Commit Modifications' : 'Initialize Injection'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return null;
};

export default Billing;
