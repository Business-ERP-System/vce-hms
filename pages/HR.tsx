
import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import {
    User, Briefcase, Calendar, Clock, Phone, Mail, Plus, Shield, Users,
    FileText, CheckCircle, Fingerprint, LogOut, Coffee,
    Settings, Trash2, Edit3, Eye, Search, AlertCircle, Check, X,
    MapPin, Cpu, TrendingUp, Download, Printer, Filter, Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Employee, AttendanceRecord, LeaveRequest, PayrollRecord, BiometricMachine, UserRole } from '../types';
import { BdtIcon } from '../components/BdtIcon';

const HR = () => {
    const navigate = useNavigate();
    const {
        employees, attendance, leaves, payroll, biometricMachines,
        addEmployee, updateEmployee, deleteEmployee,
        addAttendance, addLeave, updateLeave,
        addPayroll, updatePayroll, deletePayroll,
        testBiometricMachine, hasPermission, formatCurrency
    } = useData();

    const [activeTab, setActiveTab] = useState<'staff' | 'attendance' | 'leave' | 'payroll' | 'machines'>('staff');
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [viewingItem, setViewingItem] = useState<any>(null);

    const canAdd = hasPermission('HR & Staff', 'add');
    const canEdit = hasPermission('HR & Staff', 'edit');
    const canDelete = hasPermission('HR & Staff', 'delete');

    const filteredEmployees = employees.filter(e =>
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.department.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderStaffTab = () => (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search employees..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => { setEditingItem(null); setShowAddModal(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700 transition-colors shadow-lg shadow-teal-100"
                >
                    <Plus size={18} /> Add New Staff
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEmployees.map((emp) => (
                    <div key={emp.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-4 group hover:border-teal-200 transition-all hover:shadow-md relative">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                                    {emp.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">{emp.name}</h3>
                                    <p className="text-xs text-slate-400 uppercase font-black tracking-widest">{emp.id}</p>
                                </div>
                            </div>
                            <span className={`text-xs uppercase font-black px-2 py-1 rounded-lg border ${emp.status === 'Active' ? 'bg-green-50 text-green-700 border-green-100' :
                                emp.status === 'Leave' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                    'bg-red-50 text-red-700 border-red-100'
                                }`}>
                                {emp.status}
                            </span>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400 group-hover:text-teal-500 transition-colors"><Briefcase size={14} /></div>
                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Position</p>
                                    <p className="font-bold text-slate-700 text-xs">{emp.role}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400 group-hover:text-teal-500 transition-colors"><Shield size={14} /></div>
                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Department</p>
                                    <p className="font-bold text-slate-700 text-xs">{emp.department}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400 group-hover:text-teal-500 transition-colors"><Clock size={14} /></div>
                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Default Shift</p>
                                    <p className="font-bold text-slate-700 text-xs">{emp.shift}</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-50 flex gap-2 overflow-hidden">
                            <button
                                onClick={() => setViewingItem(emp)}
                                className="flex-1 py-2 text-xs font-black uppercase tracking-widest bg-slate-50 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                            >
                                Profile
                            </button>
                            {canEdit && (
                                <button
                                    onClick={() => { setEditingItem(emp); setShowAddModal(true); }}
                                    className="flex-1 py-2 text-xs font-black uppercase tracking-widest bg-slate-50 rounded-lg hover:bg-teal-50 hover:text-teal-600 transition-colors"
                                >
                                    Edit
                                </button>
                            )}
                            {canDelete && (
                                <button
                                    onClick={() => deleteEmployee(emp.id)}
                                    className="p-2 bg-slate-50 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderAttendanceTab = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Users size={20} /></div>
                        <div className="text-right">
                            <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Expected Today</p>
                            <h3 className="text-2xl font-black text-slate-900">{employees.filter(e => e.shift !== 'Off').length}</h3>
                        </div>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: '85%' }}></div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-xl"><Briefcase size={20} /></div>
                        <div className="text-right">
                            <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Present</p>
                            <h3 className="text-2xl font-black text-slate-900">{attendance.filter(a => a.date === new Date().toISOString().split('T')[0]).length}</h3>
                        </div>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: '70%' }}></div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-red-50 text-red-600 rounded-xl"><LogOut size={20} /></div>
                        <div className="text-right">
                            <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Absent</p>
                            <h3 className="text-2xl font-black text-slate-900">2</h3>
                        </div>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500" style={{ width: '10%' }}></div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Clock size={20} /></div>
                        <div className="text-right">
                            <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Late Arrival</p>
                            <h3 className="text-2xl font-black text-slate-900">{attendance.filter(a => a.status === 'Late').length}</h3>
                        </div>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500" style={{ width: '15%' }}></div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-black text-slate-900 uppercase tracking-tighter">Live Biometric Logs</h3>
                    <div className="flex gap-2">
                        <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"><Printer size={18} /></button>
                        <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"><Download size={18} /></button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-xs font-black uppercase tracking-widest text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Employee</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Check In</th>
                                <th className="px-6 py-4">Check Out</th>
                                <th className="px-6 py-4">Machine</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {attendance.map((record) => (
                                <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-700">{record.employeeName}</td>
                                    <td className="px-6 py-4 text-slate-500 font-medium">{record.date}</td>
                                    <td className="px-6 py-4 font-bold text-teal-600">{record.checkIn}</td>
                                    <td className="px-6 py-4 font-bold text-rose-600">{record.checkOut || '--:--'}</td>
                                    <td className="px-6 py-4 text-slate-500">
                                        <div className="flex items-center gap-2">
                                            <Fingerprint size={12} className="text-teal-500" />
                                            <span className="text-xs font-bold">{record.machineId}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs font-black uppercase px-2 py-1 rounded-lg ${record.status === 'Present' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                                            }`}>
                                            {record.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderLeaveTab = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Coffee size={100} /></div>
                        <h3 className="font-black text-lg tracking-tighter mb-1 relative z-10">Leave Policy</h3>
                        <p className="text-xs text-slate-400 mb-6 font-bold uppercase tracking-widest relative z-10">Bangladesh Labor Law 2006</p>

                        <div className="space-y-4 relative z-10">
                            <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5">
                                <span className="text-xs font-bold text-slate-300">Casual Leave</span>
                                <span className="text-sm font-black text-teal-400">10 Days</span>
                            </div>
                            <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5">
                                <span className="text-xs font-bold text-slate-300">Sick Leave</span>
                                <span className="text-sm font-black text-rose-400">14 Days</span>
                            </div>
                            <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5">
                                <span className="text-xs font-bold text-slate-300">Annual Leave</span>
                                <span className="text-sm font-black text-blue-400">1/11 Days</span>
                            </div>
                            <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5">
                                <span className="text-xs font-bold text-slate-300">Festival Leave</span>
                                <span className="text-sm font-black text-amber-400">11 Days</span>
                            </div>
                        </div>

                        <button className="w-full mt-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all">
                            Apply for Leave
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-3">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-black text-slate-900 uppercase tracking-tighter">Recent Leave Requests</h3>
                            <div className="flex gap-2">
                                <select className="bg-slate-50 border border-slate-200 text-slate-500 py-2 px-3 rounded-lg text-xs font-bold focus:outline-none">
                                    <option>All Requests</option>
                                    <option>Pending</option>
                                    <option>Approved</option>
                                </select>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-xs font-black uppercase tracking-widest text-slate-500">
                                    <tr>
                                        <th className="px-6 py-4">Employee</th>
                                        <th className="px-6 py-4">Type</th>
                                        <th className="px-6 py-4">Duration</th>
                                        <th className="px-6 py-4">Reason</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {leaves.map((leave) => (
                                        <tr key={leave.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-700">{leave.employeeName}</td>
                                            <td className="px-6 py-4">
                                                <span className={`text-xs font-black uppercase px-2 py-1 rounded-lg border ${leave.type === 'Casual' ? 'bg-teal-50 text-teal-700 border-teal-100' :
                                                    leave.type === 'Sick' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                                        'bg-blue-50 text-blue-700 border-blue-100'
                                                    }`}>
                                                    {leave.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-bold text-slate-500">
                                                <div className="flex flex-col">
                                                    <span>{leave.startDate}</span>
                                                    <span className="text-xs text-slate-300">to {leave.endDate}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-medium text-slate-500 max-w-xs truncate">{leave.reason}</td>
                                            <td className="px-6 py-4">
                                                <span className={`flex items-center gap-1.5 text-xs font-black uppercase ${leave.status === 'Approved' ? 'text-green-600' :
                                                    leave.status === 'Rejected' ? 'text-rose-600' : 'text-amber-600'
                                                    }`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${leave.status === 'Approved' ? 'bg-green-500' :
                                                        leave.status === 'Rejected' ? 'bg-rose-500' : 'bg-amber-500'
                                                        }`}></div>
                                                    {leave.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right flex gap-2 justify-end">
                                                {leave.status === 'Pending' && (
                                                    <>
                                                        <button className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"><Check size={14} /></button>
                                                        <button className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"><X size={14} /></button>
                                                    </>
                                                )}
                                                <button className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-100 transition-colors"><Eye size={14} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderPayrollTab = () => (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-teal-50 text-teal-600 rounded-2xl"><BdtIcon size={24} /></div>
                    <div>
                        <h3 className="font-black text-xl tracking-tighter text-slate-900 border-b-2 border-teal-500 w-fit">Payroll Management</h3>
                        <p className="text-xs text-slate-400 font-black uppercase tracking-widest mt-1">Cycle: Monthly (Current Feb 2026)</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="px-5 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
                        Generate All Slips
                    </button>
                    <button className="px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                        Custom Payment
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {payroll.map((pay) => (
                    <div key={pay.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-teal-200 transition-all group">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h4 className="font-black text-slate-900 leading-tight">{pay.employeeName}</h4>
                                <p className="text-xs text-slate-400 font-black uppercase tracking-widest mt-1">{pay.month} {pay.year}</p>
                            </div>
                            <span className={`text-xs font-black uppercase px-2 py-1 rounded-lg ${pay.paymentStatus === 'Paid' ? 'bg-green-50 text-green-700' : 'bg-rose-50 text-rose-700'
                                }`}>
                                {pay.paymentStatus}
                            </span>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400 font-bold">Basic Salary</span>
                                <span className="font-black text-slate-900">{formatCurrency(pay.basicPaid)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400 font-bold">Allowances</span>
                                <span className="font-black text-teal-600">+{formatCurrency(pay.allowancesPaid)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400 font-bold">Deductions</span>
                                <span className="font-black text-rose-600">-{formatCurrency(pay.deductionsTotal)}</span>
                            </div>
                            <div className="pt-3 border-t border-dashed border-slate-100 flex justify-between items-center">
                                <span className="text-sm font-black text-slate-900 uppercase tracking-tighter">Net Payable</span>
                                <span className="text-lg font-black text-slate-900 underline decoration-teal-400 decoration-2">{formatCurrency(pay.netSalary)}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button className="py-2.5 bg-slate-50 rounded-xl text-xs font-black text-slate-500 uppercase tracking-widest hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
                                <FileText size={14} /> Payslip
                            </button>
                            <button className="py-2.5 bg-slate-50 rounded-xl text-xs font-black text-slate-500 uppercase tracking-widest hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
                                <LogOut size={14} /> Details
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderMachinesTab = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="font-black text-slate-900 uppercase tracking-tighter text-xl">Access Control Machines</h3>
                    <p className="text-xs text-slate-400 font-black uppercase tracking-widest mt-1">Multi-machine biometric network status</p>
                </div>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
                    <Plus size={16} /> Register Device
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {biometricMachines.map((machine) => (
                    <div key={machine.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative group overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full translate-x-12 -translate-y-12 opacity-50 group-hover:scale-110 transition-transform"></div>

                        <div className="flex justify-between items-start mb-8 relative z-10">
                            <div className={`p-4 rounded-2xl ${machine.status === 'Online' ? 'bg-teal-50 text-teal-600' : 'bg-rose-50 text-rose-600'}`}>
                                <Cpu size={28} />
                            </div>
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${machine.status === 'Online' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                                }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${machine.status === 'Online' ? 'bg-green-500' : 'bg-rose-500'} animate-pulse`}></div>
                                {machine.status}
                            </div>
                        </div>

                        <div className="space-y-1 mb-8 relative z-10">
                            <h4 className="font-black text-slate-900 text-lg tracking-tight uppercase">{machine.name}</h4>
                            <div className="flex items-center gap-2 text-slate-400">
                                <MapPin size={12} />
                                <span className="text-xs font-black uppercase tracking-widest">{machine.location}</span>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-2xl mb-6 relative z-10">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-black text-slate-400 uppercase">IP Address</span>
                                <span className="text-xs font-bold text-slate-700">{machine.ip}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-black text-slate-400 uppercase">Serial ID</span>
                                <span className="text-xs font-bold text-slate-700">{machine.id}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 relative z-10">
                            <button
                                onClick={() => testBiometricMachine(machine.id)}
                                className="py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-500 uppercase tracking-widest hover:border-teal-500 hover:text-teal-600 transition-all flex items-center justify-center gap-2"
                            >
                                <Activity size={12} /> Test Link
                            </button>
                            <button className="py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-500 uppercase tracking-widest hover:border-slate-900 hover:text-slate-900 transition-all flex items-center justify-center gap-2">
                                <Settings size={12} /> Configure
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Dynamic Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Human Resources</h1>
                    <p className="text-sm text-slate-500 font-medium">Manage workforce, attendance, and payroll operations.</p>
                </div>
                <div className="flex gap-2 items-center bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                    <button
                        onClick={() => navigate('/reports')}
                        className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center gap-2"
                    >
                        <TrendingUp size={16} /> Advanced Analytics
                    </button>
                    <button className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"><Settings size={20} /></button>
                </div>
            </div>

            {/* Tabs Control */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {[
                    { id: 'staff', label: 'Staff Directory', icon: Users },
                    { id: 'attendance', label: 'Attendance Logs', icon: Fingerprint },
                    { id: 'leave', label: 'Leave & Holidays', icon: Calendar },
                    { id: 'payroll', label: 'Payroll Center', icon: BdtIcon },
                    { id: 'machines', label: 'Access Control', icon: Cpu }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === tab.id
                            ? 'bg-teal-600 text-white shadow-xl shadow-teal-100'
                            : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100'
                            }`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[500px]">
                {activeTab === 'staff' && renderStaffTab()}
                {activeTab === 'attendance' && renderAttendanceTab()}
                {activeTab === 'leave' && renderLeaveTab()}
                {activeTab === 'payroll' && renderPayrollTab()}
                {activeTab === 'machines' && renderMachinesTab()}
            </div>

            {/* Profile / View Modal */}
            {viewingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 animate-in zoom-in duration-300">
                        <div className="p-10 bg-gradient-to-br from-slate-900 to-slate-800 text-white relative">
                            <div className="absolute top-0 right-0 p-8 opacity-10"><User size={150} /></div>
                            <div className="flex items-center gap-6 relative z-10">
                                <div className="w-24 h-24 rounded-3xl bg-teal-500 flex items-center justify-center text-3xl font-black">{viewingItem.name.charAt(0)}</div>
                                <div>
                                    <h2 className="text-3xl font-black tracking-tighter uppercase">{viewingItem.name}</h2>
                                    <p className="text-teal-400 font-black uppercase tracking-widest text-xs mt-1">{viewingItem.role} • {viewingItem.department}</p>
                                    <div className="flex gap-4 mt-6">
                                        <div className="flex items-center gap-2 text-slate-300 text-xs font-bold"><Phone size={14} className="text-teal-500" /> {viewingItem.contact}</div>
                                        <div className="flex items-center gap-2 text-slate-300 text-xs font-bold"><Mail size={14} className="text-teal-500" /> {viewingItem.name.toLowerCase().replace(' ', '.')}@visionary.com</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-10 grid grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <h3 className="font-black text-slate-900 uppercase tracking-tighter border-b-2 border-slate-100 pb-2">Professional Info</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><p className="text-xs text-slate-400 font-black uppercase tracking-widest">Employee ID</p><p className="font-bold text-slate-700">{viewingItem.id}</p></div>
                                    <div><p className="text-xs text-slate-400 font-black uppercase tracking-widest">Joined On</p><p className="font-bold text-slate-700">{viewingItem.joiningDate}</p></div>
                                    <div><p className="text-xs text-slate-400 font-black uppercase tracking-widest">Shift</p><p className="font-bold text-slate-700">{viewingItem.shift}</p></div>
                                    <div><p className="text-xs text-slate-400 font-black uppercase tracking-widest">Status</p><p className="font-bold text-teal-600">{viewingItem.status}</p></div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <h3 className="font-black text-slate-900 uppercase tracking-tighter border-b-2 border-slate-100 pb-2">Salary Structure</h3>
                                <div className="bg-slate-50 p-6 rounded-3xl space-y-3">
                                    <div className="flex justify-between text-xs font-bold text-slate-500"><span>Basic Salary</span><span className="text-slate-900 font-black">{formatCurrency(viewingItem.salaryStructure.basic)}</span></div>
                                    <div className="flex justify-between text-xs font-bold text-slate-500"><span>House Rent</span><span className="text-slate-900 font-black">{formatCurrency(viewingItem.salaryStructure.houseRent)}</span></div>
                                    <div className="flex justify-between text-xs font-bold text-slate-500"><span>Allowances</span><span className="text-slate-900 font-black">{formatCurrency(viewingItem.salaryStructure.medical + viewingItem.salaryStructure.transport)}</span></div>
                                    <div className="pt-3 border-t border-slate-200 flex justify-between font-black text-slate-900"><span>Monthly Gross</span><span className="underline decoration-teal-400 underline-offset-4 decoration-2">{formatCurrency(viewingItem.salaryStructure.basic + viewingItem.salaryStructure.houseRent + viewingItem.salaryStructure.medical + viewingItem.salaryStructure.transport)}</span></div>
                                </div>
                            </div>
                        </div>
                        <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button onClick={() => setViewingItem(null)} className="px-8 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Close Profile</button>
                            <button className="px-10 py-3 bg-teal-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-teal-700 transition-all shadow-xl shadow-teal-100">Download Payslips</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add / Edit Modal - Skeleton */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl p-8 border border-slate-100 animate-in zoom-in duration-300">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{editingItem ? 'Edit Staff Details' : 'Onboard New Staff'}</h3>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X size={24} /></button>
                        </div>

                        <form className="space-y-6" onSubmit={(e: any) => {
                            e.preventDefault();
                            const target = e.target;
                            const employeeData: any = {
                                id: target.empId.value || `EMP-${Math.floor(Math.random() * 1000)}`,
                                name: target.fullName.value,
                                role: target.role.value,
                                department: target.dept.value,
                                contact: editingItem?.contact || '555-0000',
                                shift: editingItem?.shift || 'Morning',
                                status: editingItem?.status || 'Active',
                                joiningDate: editingItem?.joiningDate || new Date().toISOString().split('T')[0],
                                salaryStructure: {
                                    basic: Number(target.basic.value) || 0,
                                    houseRent: Number(target.houseRent.value) || 0,
                                    medical: Number(target.medical.value) || 0,
                                    transport: editingItem?.salaryStructure?.transport || 2000
                                }
                            };

                            if (editingItem) {
                                updateEmployee(editingItem.id, employeeData);
                            } else {
                                addEmployee(employeeData);
                            }
                            setShowAddModal(false);
                        }}>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                                    <input name="fullName" type="text" required className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="e.g. Dr. Salim Ahmed" defaultValue={editingItem?.name} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Employee ID</label>
                                    <input name="empId" type="text" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="e.g. EMP-101" defaultValue={editingItem?.id} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Role / Designation</label>
                                    <input name="role" type="text" required className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="e.g. Surgeon" defaultValue={editingItem?.role} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Department</label>
                                    <select name="dept" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-500" defaultValue={editingItem?.department}>
                                        <option>Clinical</option>
                                        <option>Pharmacy</option>
                                        <option>Front Office</option>
                                        <option>Finance</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Salary Configuration</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase text-slate-400">Basic</label>
                                        <input name="basic" type="number" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="0.00" defaultValue={editingItem?.salaryStructure?.basic} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase text-slate-400">House Rent</label>
                                        <input name="houseRent" type="number" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="0.00" defaultValue={editingItem?.salaryStructure?.houseRent} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase text-slate-400">Medical</label>
                                        <input name="medical" type="number" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="0.00" defaultValue={editingItem?.salaryStructure?.medical} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
                                <button type="submit" className="flex-1 py-4 bg-teal-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-teal-700 shadow-xl shadow-teal-100 transition-all active:scale-95">
                                    {editingItem ? 'Save Changes' : 'Confirm Onboarding'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HR;
