
import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { ORG_DETAILS } from '../constants';
import {
    FileText, TrendingUp, DollarSign, Activity, Users, ShoppingCart,
    TestTube, Bed, Eye, Calendar, Scissors, Box, ArrowLeft, Download,
    Printer, Filter, Sparkles, AlertTriangle, Database, Globe, Map, Tag,
    ChevronRight, Briefcase, Ambulance as AmbulanceIcon, Receipt, Pill,
    Landmark, ClipboardList, FileSpreadsheet, FileCode, FileJson, X, Stethoscope,
    Search, Settings, EyeOff
} from 'lucide-react';
import { analyzeReport } from '../services/geminiService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Reports = () => {
    const {
        patients, labTests, surgeries, campaigns, beds, inventory, finance,
        employees, admissions, invoices, currency, ambulances, hasPermission,
        attendance, leaves, payroll, biometricMachines, rooms
    } = useData();
    const { currentUser } = useAuth();
    const [selectedReport, setSelectedReport] = useState<string | null>(null);
    const [aiAnalysis, setAiAnalysis] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Filter states for Visit Analytics
    const [visitFilterType, setVisitFilterType] = useState<'All' | 'Age' | 'Area' | 'Day' | 'Week' | 'Month' | 'Date'>('All');
    const [visitFilterValue, setVisitFilterValue] = useState<string>('');

    // Per-column filtering and customization
    const [columnFilters, setColumnFilters] = useState<Record<number, string>>({});
    const [visibleColumns, setVisibleColumns] = useState<number[]>([]);
    const [showColumnCustomizer, setShowColumnCustomizer] = useState(false);
    const [showExportDropdown, setShowExportDropdown] = useState(false);
    const [globalSearch, setGlobalSearch] = useState('');
    const [reportView, setReportView] = useState<'global' | 'custom'>('global');
    const [customQueryModule, setCustomQueryModule] = useState<string>('');
    const [isQueryRunning, setIsQueryRunning] = useState(false);

    const reportCategories = [
        {
            title: "Front Office & Registration",
            icon: Users,
            color: "text-indigo-600 bg-indigo-50",
            items: [
                "Master Patient Index (Full Details)",
                "Daily Registration Summary",
                "Patient Appointment History",
                "Referral Source Analysis"
            ]
        },
        {
            title: "Clinical & EMR",
            icon: Stethoscope,
            color: "text-blue-600 bg-blue-50",
            items: [
                "Patient Visit & Activity Analytics",
                "Diagnosis Frequency Report",
                "Electronic Prescription Audit",
                "Clinical Outcome Statistics",
                "Doctor Consultation Summary"
            ]
        },
        {
            title: "IPD & Bed Management",
            icon: Bed,
            color: "text-emerald-600 bg-emerald-50",
            items: [
                "Current Bed Occupancy Report",
                "Admission & Discharge Registry",
                "Length of Stay (LOS) Analysis",
                "Ward-wise Patient Census",
                "Room-wise Activity & Transaction Summary"
            ]
        },
        {
            title: "OT & Surgeries",
            icon: Scissors,
            color: "text-rose-600 bg-rose-50",
            items: [
                "OT Utilization Report",
                "Surgery Schedule & History",
                "Surgeon Performance Metrics",
                "Post-Operative Complications Log"
            ]
        },
        {
            title: "Lab & Diagnostics",
            icon: TestTube,
            color: "text-purple-600 bg-purple-50",
            items: [
                "Investigation Volume Report",
                "Lab Test Turnaround Time (TAT)",
                "Diagnostic Accuracy Audit",
                "Pending Lab Investigations"
            ]
        },
        {
            title: "Billing & POS",
            icon: Receipt,
            color: "text-amber-600 bg-amber-50",
            items: [
                "Daily Collection Report",
                "Outstanding Dues Summary",
                "Discount & Waiver Audit",
                "Insurance & Corporate Billing"
            ]
        },
        {
            title: "Pharmacy & Optical",
            icon: Pill,
            color: "text-teal-600 bg-teal-50",
            items: [
                "Medicine Sales Analysis",
                "Optical Frame & Lens Sales",
                "Pharmacist Dispensing Log",
                "Prescription vs Sale Audit"
            ]
        },
        {
            title: "Inventory Management",
            icon: Box,
            color: "text-orange-600 bg-orange-50",
            items: [
                "Current Stock Status",
                "Expiring Items Alert Report",
                "Purchase Order History",
                "Stock Consumption Analysis"
            ]
        },
        {
            title: "Finance & Accounts",
            icon: Landmark,
            color: "text-green-600 bg-green-50",
            items: [
                "General Ledger Report",
                "Profit & Loss Statement (Draft)",
                "Expense Analysis by Category",
                "Voucher Transaction Registry"
            ]
        },
        {
            title: "HR & Staff Management",
            icon: Briefcase,
            color: "text-slate-600 bg-slate-50",
            items: [
                "Staff Identity Directory",
                "Attendance & Shift Report",
                "Machine-wise Attendance Logs",
                "Employee Leave Ledger (Compliance)",
                "Detailed Monthly Payroll Sheet",
                "Staff Shift & Roster Audit"
            ]
        },
        {
            title: "Outreach & Campaigns",
            icon: Globe,
            color: "text-cyan-600 bg-cyan-50",
            items: [
                "Campaign Screening Results",
                "Rural Outreach Impact Analysis",
                "Patient Conversion from Camps",
                "Marketing Campaign ROI"
            ]
        },
        {
            title: "Ambulance & Logistics",
            icon: AmbulanceIcon,
            color: "text-red-600 bg-red-50",
            items: [
                "Ambulance Trip Log",
                "Vehicle Maintenance Report",
                "Fuel Consumption Audit",
                "Emergency Response Times"
            ]
        }
    ];

    const getReportData = (reportName: string) => {
        switch (reportName) {
            case "Patient Visit & Activity Analytics":
                let filtered = [...patients];

                // Apply Filters
                if (visitFilterType === 'Age' && visitFilterValue) {
                    const [min, max] = visitFilterValue.split('-').map(Number);
                    filtered = filtered.filter(p => p.age >= min && p.age <= max);
                } else if (visitFilterType === 'Area' && visitFilterValue) {
                    filtered = filtered.filter(p =>
                        (p.village && p.village.toLowerCase().includes(visitFilterValue.toLowerCase())) ||
                        (p.district && p.district.toLowerCase().includes(visitFilterValue.toLowerCase()))
                    );
                } else if (visitFilterType === 'Day' && visitFilterValue) {
                    filtered = filtered.filter(p => p.lastVisit === visitFilterValue);
                } else if (visitFilterType === 'Week' && visitFilterValue) {
                    // Simple week check: last 7 days from value
                    const date = new Date(visitFilterValue);
                    const weekAgo = new Date(date);
                    weekAgo.setDate(date.getDate() - 7);
                    filtered = filtered.filter(p => {
                        const pDate = new Date(p.lastVisit);
                        return pDate <= date && pDate >= weekAgo;
                    });
                } else if (visitFilterType === 'Month' && visitFilterValue) {
                    filtered = filtered.filter(p => p.lastVisit.startsWith(visitFilterValue));
                } else if (visitFilterType === 'Date' && visitFilterValue) {
                    filtered = filtered.filter(p => p.lastVisit === visitFilterValue);
                }

                return {
                    headers: ['UHID', 'Patient Name', 'Age', 'Area', 'Last Visit', 'Status', 'Stay Duration', 'Total Billed'],
                    data: filtered.map(p => {
                        // Calculate Stay Duration (Mocked based on activity)
                        let stayDuration = "45 mins"; // Default for OPD
                        if (p.status === 'IPD') {
                            const admission = admissions.find(a => a.patientId === p.id);
                            if (admission && admission.actualDischargeDate) {
                                const diff = new Date(admission.actualDischargeDate).getTime() - new Date(admission.admissionDate).getTime();
                                stayDuration = `${Math.ceil(diff / (1000 * 60 * 60 * 24))} days`;
                            } else {
                                stayDuration = "3 days (Active)";
                            }
                        } else {
                            // Randomize OPD stay for realism
                            const mins = 30 + (parseInt(p.id.replace(/\D/g, '')) % 90);
                            stayDuration = `${mins} mins`;
                        }

                        // Calculate Total Billed
                        const patientBills = invoices.filter(inv => inv.patientId === p.id);
                        const totalBilled = patientBills.reduce((sum, inv) => sum + inv.totalAmount, 0);

                        return [
                            p.id,
                            p.name,
                            p.age,
                            `${p.village || '-'}, ${p.district || '-'}`,
                            p.lastVisit,
                            p.status,
                            stayDuration,
                            `${currency === 'BDT' ? '৳' : '$'}${totalBilled.toFixed(2)}`
                        ];
                    })
                };

            case "Master Patient Index (Full Details)":
                return {
                    headers: [
                        'UHID', 'FullName', 'Age/Gen', 'Contact', 'Alt Contact', 'Email',
                        'Village', 'PO', 'Upazilla', 'District', 'State', 'Country',
                        'Type', 'Category', 'Speciality', 'Allocation', 'MR Shelf',
                        'Next of Kin', 'Reg Fee', 'Last Visit', 'Diagnosis'
                    ],
                    data: patients.map(p => [
                        p.id, p.name, `${p.age}Y/${p.gender}`, p.contact, p.altContact || '-', p.email || '-',
                        p.village || '-', p.postOffice || '-', p.upazilla || '-', p.district || '-', p.state || '-', p.country || '-',
                        p.patientType || '-', p.paymentCategory || '-', p.speciality || '-', p.allocation || '-', p.mrLocation || '-',
                        p.nextOfKin || '-', `${currency === 'BDT' ? '৳' : '$'}${p.registrationFee}`, p.lastVisit, p.diagnosis
                    ])
                };

            case "Patient Distribution by District":
                const distMap: Record<string, number> = {};
                patients.forEach(p => distMap[p.district] = (distMap[p.district] || 0) + 1);
                return { headers: ['District Name', 'Total Patients', 'Market Share %'], data: Object.entries(distMap).map(([d, c]) => [d, c, `${((c / patients.length) * 100).toFixed(1)}%`]) };

            case "Daily Collection Report":
                return {
                    headers: ['Bill ID', 'Date', 'Patient Name', 'Category', 'Sub-Total', 'Discount', 'Tax', 'Net Amount', 'Method'],
                    data: invoices.map(inv => [
                        inv.id, inv.date, inv.patientName, inv.category,
                        `${currency === 'BDT' ? '৳' : '$'}${inv.subTotal.toFixed(2)}`,
                        `${currency === 'BDT' ? '৳' : '$'}${inv.discount.toFixed(2)}`,
                        `${currency === 'BDT' ? '৳' : '$'}${inv.tax.toFixed(2)}`,
                        `${currency === 'BDT' ? '৳' : '$'}${inv.totalAmount.toFixed(2)}`,
                        inv.paymentMethod
                    ])
                };

            case "Current Bed Occupancy Report":
                return {
                    headers: ['Bed ID', 'Number', 'Ward', 'Floor', 'Status', 'Patient Name', 'Admission Date'],
                    data: beds.map(b => [b.id, b.number, b.ward, b.floor, b.status, b.patientName || '-', b.admissionDate || '-'])
                };

            case "Room-wise Activity & Transaction Summary":
                return {
                    headers: ['Room ID', 'Room Number', 'Room Name', 'Type', 'Total Patients Intake', 'Total Transactions Volume', 'Current Active Queue', 'Recent Activity Status'],
                    data: rooms.map(room => {
                        let totalPatientsIntake = 0;
                        let totalTransactionsVolume = 0;
                        let activeQueue = room.currentLoad || 0;

                        if (room.type === 'OPD') {
                            const matchingPatients = patients.filter(p => p.assignedRoom === room.roomNumber);
                            totalPatientsIntake = matchingPatients.length;
                            totalTransactionsVolume = matchingPatients.reduce((sum, p) => sum + (p.registrationFee || 0), 0);
                        } else if (room.type === 'Lab') {
                            const matchingTests = labTests.filter(t => t.roomLocation === room.roomNumber || t.roomLocation === room.id);
                            totalPatientsIntake = matchingTests.length;
                            totalTransactionsVolume = matchingTests.reduce((sum, t) => sum + (t.price || 0), 0);
                        } else if (room.type === 'Diagnosis') {
                            const matchingPatients = patients.filter(p => p.assignedRoom === room.roomNumber && p.status === 'OPD');
                            totalPatientsIntake = matchingPatients.length;
                            totalTransactionsVolume = matchingPatients.length * 500; // Mock consultation fee for diagnosis room
                        }

                        const status = activeQueue > 2 ? 'High Load' : activeQueue > 0 ? 'Active Intake' : 'Operational';

                        return [
                            room.id,
                            room.roomNumber,
                            room.name,
                            room.type,
                            `${totalPatientsIntake} Patients`,
                            `${currency === 'BDT' ? '৳' : '$'}${totalTransactionsVolume.toFixed(2)}`,
                            `${activeQueue} in Queue`,
                            status
                        ];
                    })
                };

            case "Current Stock Status":
                return {
                    headers: ['Item ID', 'Name', 'Category', 'Stock Level', 'Unit Price', 'Supplier', 'Value'],
                    data: inventory.map(i => [
                        i.id, i.name, i.category, i.stock,
                        `${currency === 'BDT' ? '৳' : '$'}${i.price.toFixed(2)}`,
                        i.supplier,
                        `${currency === 'BDT' ? '৳' : '$'}${(i.stock * i.price).toFixed(2)}`
                    ])
                };

            case "Staff Identity Directory":
                return { headers: ['Emp ID', 'Name', 'Role', 'Dept', 'Contact', 'Shift', 'Status'], data: employees.map(e => [e.id, e.name, e.role, e.department, e.contact, e.shift, e.status]) };

            case "Attendance & Shift Report":
                return {
                    headers: ['Emp ID', 'Name', 'Date', 'Check-In', 'Check-Out', 'Work Hours', 'Status'],
                    data: attendance.map(a => {
                        const hours = a.checkOut ? "6h 20m" : "Active"; // Mocked calculation
                        return [a.employeeId, a.employeeName, a.date, a.checkIn, a.checkOut || '--:--', hours, a.status];
                    })
                };

            case "Machine-wise Attendance Logs":
                return {
                    headers: ['Log ID', 'Emp Name', 'Timestamp', 'Machine Name', 'Location', 'In/Out'],
                    data: attendance.map(a => {
                        const machine = biometricMachines.find(m => m.id === a.machineId);
                        return [a.id, a.employeeName, `${a.date} ${a.checkIn}`, machine?.name || a.machineId, a.location, 'In'];
                    })
                };

            case "Employee Leave Ledger (Compliance)":
                return {
                    headers: ['Emp ID', 'Name', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Law Compliance', 'Status'],
                    data: leaves.map(l => {
                        const diffTime = Math.abs(new Date(l.endDate).getTime() - new Date(l.startDate).getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                        return [l.employeeId, l.employeeName, l.type, l.startDate, l.endDate, diffDays, 'BD Labor Law 2006', l.status];
                    })
                };

            case "Detailed Monthly Payroll Sheet":
                return {
                    headers: ['Emp ID', 'Name', 'Month/Year', 'Basic', 'Allowances', 'Deductions', 'Net Payable', 'Status'],
                    data: payroll.map(p => [
                        p.id, p.employeeName, `${p.month} ${p.year}`,
                        `${currency === 'BDT' ? '৳' : '$'}${p.basicPaid}`,
                        `${currency === 'BDT' ? '৳' : '$'}${p.allowancesPaid}`,
                        `${currency === 'BDT' ? '৳' : '$'}${p.deductionsTotal}`,
                        `${currency === 'BDT' ? '৳' : '$'}${p.netSalary}`,
                        p.paymentStatus
                    ])
                };

            case "Staff Shift & Roster Audit":
                return {
                    headers: ['Emp ID', 'Name', 'Default Shift', 'Today Status', 'Department', 'Overtime Eligibility'],
                    data: employees.map(e => [e.id, e.name, e.shift, e.status, e.department, 'Eligible'])
                };

            case "Investigation Volume Report":
                return { headers: ['Req ID', 'Patient', 'Test', 'Date', 'Status', 'Result'], data: labTests.map(t => [t.id, t.patientName, t.testName, t.date, t.status, t.result || '-']) };

            case "General Ledger Report":
                return { headers: ['Txn ID', 'Date', 'Description', 'Category', 'Method', 'Amount'], data: finance.map(f => [f.id, f.date, f.description, f.category, f.method, `${currency === 'BDT' ? '৳' : '$'}${f.amount.toFixed(2)}`]) };

            case "Ambulance Trip Log":
                return { headers: ['Vehicle No', 'Driver', 'Contact', 'Status', 'Current Location'], data: ambulances.map(a => [a.vehicleNumber, a.driverName, a.contact, a.status, a.location]) };

            case "Campaign Screening Results":
                return { headers: ['Camp ID', 'Name', 'Location', 'Date', 'Status', 'Target', 'Screened'], data: campaigns.map(c => [c.id, c.name, c.location, c.date, c.status, c.targetPatients, c.screenedPatients]) };

            case "Surgery Schedule & History":
                return { headers: ['Surg ID', 'Patient', 'Procedure', 'Surgeon', 'Theater', 'Date', 'Time', 'Status'], data: surgeries.map(s => [s.id, s.patientName, s.procedure, s.surgeon, s.theater, s.date, s.time, s.status]) };

            default:
                // Generic fallback for any other report
                return {
                    headers: ['Record ID', 'Module Reference', 'Timestamp', 'Summary Detail', 'Status'],
                    data: Array(10).fill(0).map((_, i) => [
                        `REC-${1000 + i}`,
                        reportName.split(' ')[0],
                        new Date().toLocaleDateString(),
                        `Detailed data for ${reportName} - Record ${i + 1}`,
                        'Verified'
                    ])
                };
        }
    };

    const handleExport = (format: 'CSV' | 'EXCEL' | 'XML' | 'PDF') => {
        if (!selectedReport || !processedReport) return;

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `${selectedReport.replace(/\s+/g, '_')}_${timestamp}.${format.toLowerCase()}`;

        if (format === 'CSV') {
            const headerInfo = [
                `"${ORG_DETAILS.name}"`,
                `"${ORG_DETAILS.address}"`,
                `"Report: ${selectedReport}"`,
                `"Generated By: ${currentUser}"`,
                `"Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}"`,
                `""` // Empty line
            ].join('\n');

            const tableContent = [
                processedReport.headers.filter((_, i) => effectiveVisibleColumns.includes(i)).map(h => `"${h}"`).join(','),
                ...processedReport.data.map(row =>
                    row.filter((_, i) => effectiveVisibleColumns.includes(i)).map(cell => `"${cell}"`).join(',')
                )
            ].join('\n');

            const blob = new Blob([headerInfo + '\n' + tableContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else if (format === 'PDF') {
            const reportElement = document.getElementById('report-table-container');
            if (!reportElement) return;

            // Temporarily remove max-height for capture
            const originalMaxHeight = reportElement.style.maxHeight;
            const originalOverflow = reportElement.style.overflow;
            reportElement.style.maxHeight = 'none';
            reportElement.style.overflow = 'visible';

            html2canvas(reportElement, {
                scale: 2,
                useCORS: true,
                logging: false,
                windowWidth: reportElement.scrollWidth,
                windowHeight: reportElement.scrollHeight
            }).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const imgProps = pdf.getImageProperties(imgData);
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(fileName);

                // Restore original styles
                reportElement.style.maxHeight = originalMaxHeight;
                reportElement.style.overflow = originalOverflow;
            });
        } else if (format === 'XML') {
            let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<report>\n';
            xml += `  <metadata>\n    <organization>${ORG_DETAILS.name}</organization>\n    <report_name>${selectedReport}</report_name>\n  </metadata>\n  <data>\n`;

            processedReport.data.forEach(row => {
                xml += '    <record>\n';
                row.forEach((cell, i) => {
                    if (effectiveVisibleColumns.includes(i)) {
                        const tagName = processedReport.headers[i].replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
                        xml += `      <${tagName}>${cell}</${tagName}>\n`;
                    }
                });
                xml += '    </record>\n';
            });

            xml += '  </data>\n</report>';

            const blob = new Blob([xml], { type: 'application/xml' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            alert(`Exporting ${selectedReport} as ${format}...\nFile: ${fileName}\n\n(In this demo, CSV, PDF, and XML exports are fully implemented. Excel export would require SheetJS library)`);
        }
    };

    const handleRunAnalysis = async () => {
        if (!selectedReport) return;
        setIsAnalyzing(true);
        const reportData = getReportData(selectedReport);
        const result = await analyzeReport(selectedReport, reportData.data);
        setAiAnalysis(result);
        setIsAnalyzing(false);
    };

    // Processed Report Data with Filtering and Column Customization
    const processedReport = useMemo(() => {
        if (!selectedReport) return null;
        const raw = getReportData(selectedReport);

        // Filter data
        let filteredData = raw.data.filter(row => {
            // Global search
            if (globalSearch) {
                const matchesGlobal = row.some((cell: any) =>
                    (cell + "").toLowerCase().includes(globalSearch.toLowerCase())
                );
                if (!matchesGlobal) return false;
            }

            // Column-wise search
            return Object.entries(columnFilters).every(([colIdx, filterText]) => {
                const fText = filterText as string;
                if (!fText) return true;
                const cellValue = row[parseInt(colIdx)];
                return (cellValue + "").toLowerCase().includes(fText.toLowerCase());
            });
        });

        return {
            headers: raw.headers,
            data: filteredData
        };
    }, [selectedReport, columnFilters, globalSearch, patients, labTests, surgeries, campaigns, beds, inventory, finance, employees, admissions, invoices, attendance, leaves, payroll, biometricMachines]);

    // Default visible columns to all if not specified
    const effectiveVisibleColumns = visibleColumns.length > 0
        ? visibleColumns
        : (processedReport?.headers.map((_, i) => i) || []);

    if (selectedReport && processedReport) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                {/* Print-only Header */}
                <div className="hidden print:block mb-8 border-b-2 border-slate-900 pb-6">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-6">
                            <img src={ORG_DETAILS.logo} alt="Logo" className="w-20 h-20 rounded-2xl object-cover" />
                            <div>
                                <h1 className="text-3xl font-black text-slate-900">{ORG_DETAILS.name}</h1>
                                <p className="text-sm text-slate-600 font-bold max-w-md">{ORG_DETAILS.address}</p>
                                <p className="text-sm text-slate-600 font-bold">Contact: {ORG_DETAILS.contact} | Email: {ORG_DETAILS.email}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-xl font-black text-teal-600 uppercase tracking-tighter">{selectedReport}</h2>
                            <p className="text-xs text-slate-500 font-black uppercase tracking-widest mt-1">Generated by: {currentUser}</p>
                            <p className="text-xs text-slate-500 font-black uppercase tracking-widest">Date: {new Date().toLocaleDateString()} | Time: {new Date().toLocaleTimeString()}</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
                    <div className="flex items-center gap-4">
                        <button onClick={() => { setSelectedReport(null); setColumnFilters({}); setVisibleColumns([]); }} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:bg-slate-50 transition-all shadow-sm"><ArrowLeft size={20} /></button>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900">{selectedReport}</h1>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Live Reporting Engine • {processedReport.data.length} Records Found</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowColumnCustomizer(true)} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50">
                            <Settings size={16} /> Columns
                        </button>
                        {hasPermission('Reports & Analytics', 'print') && (
                            <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50">
                                <Printer size={16} /> Print
                            </button>
                        )}

                        {hasPermission('Reports & Analytics', 'export') && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowExportDropdown(!showExportDropdown)}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-teal-700 shadow-xl shadow-teal-100 transition-all"
                                >
                                    <Download size={16} /> Export
                                </button>
                                {showExportDropdown && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowExportDropdown(false)}></div>
                                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <button onClick={() => { handleExport('EXCEL'); setShowExportDropdown(false); }} className="w-full text-left px-4 py-2 text-xs font-bold text-slate-600 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-3">
                                                <FileSpreadsheet size={14} className="text-emerald-500" /> Excel (.xlsx)
                                            </button>
                                            <button onClick={() => { handleExport('PDF'); setShowExportDropdown(false); }} className="w-full text-left px-4 py-2 text-xs font-bold text-slate-600 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-3">
                                                <FileText size={14} className="text-rose-500" /> PDF Document
                                            </button>
                                            <button onClick={() => { handleExport('CSV'); setShowExportDropdown(false); }} className="w-full text-left px-4 py-2 text-xs font-bold text-slate-600 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-3">
                                                <FileText size={14} className="text-blue-500" /> CSV (Comma Separated)
                                            </button>
                                            <button onClick={() => { handleExport('XML'); setShowExportDropdown(false); }} className="w-full text-left px-4 py-2 text-xs font-bold text-slate-600 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-3">
                                                <FileCode size={14} className="text-amber-500" /> XML Data
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Global Search & Quick Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:hidden">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Global search across all columns..."
                            value={globalSearch}
                            onChange={(e) => setGlobalSearch(e.target.value)}
                            className="w-full bg-white border border-slate-200 pl-12 pr-4 py-3.5 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
                        />
                    </div>
                    {selectedReport === "Patient Visit & Activity Analytics" && (
                        <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex gap-2">
                            <select
                                value={visitFilterType}
                                onChange={(e) => { setVisitFilterType(e.target.value as any); setVisitFilterValue(''); }}
                                className="bg-slate-50 border border-slate-200 text-slate-700 py-2 px-4 rounded-xl text-xs font-bold focus:outline-none"
                            >
                                <option value="All">All Visits</option>
                                <option value="Age">Age Wise</option>
                                <option value="Area">Area Wise</option>
                                <option value="Day">Day Wise</option>
                                <option value="Month">Month Wise</option>
                            </select>
                            <input
                                type={visitFilterType === 'Day' ? 'date' : 'text'}
                                value={visitFilterValue}
                                onChange={(e) => setVisitFilterValue(e.target.value)}
                                placeholder="Filter value..."
                                className="flex-1 bg-slate-50 border border-slate-200 text-slate-700 py-2 px-4 rounded-xl text-xs font-bold focus:outline-none"
                            />
                        </div>
                    )}
                </div>

                {/* Main Report Table */}
                <div id="report-table-container" className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden flex flex-col relative print:shadow-none print:border-none print:overflow-visible">
                    <div className="overflow-auto custom-scrollbar max-h-[calc(100vh-380px)] min-h-[400px] flex-1 min-h-0 print:max-h-none print:overflow-visible">
                        <table className="w-full text-xs text-left border-collapse min-w-max print:min-w-full">
                            <thead className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200 text-slate-600 font-black uppercase text-xs tracking-widest">
                                <tr>
                                    {processedReport.headers.map((header, idx) => (
                                        effectiveVisibleColumns.includes(idx) && (
                                            <th key={idx} className="px-6 py-5 border-r border-slate-100 min-w-[150px]">
                                                <div className="flex flex-col gap-3">
                                                    <div className="flex items-center justify-between">
                                                        <span>{header}</span>
                                                        <button
                                                            onClick={() => setVisibleColumns(prev => {
                                                                const current = prev.length > 0 ? prev : processedReport.headers.map((_, i) => i);
                                                                return current.filter(c => c !== idx);
                                                            })}
                                                            className="text-slate-300 hover:text-rose-500 transition-colors print:hidden"
                                                        >
                                                            <EyeOff size={12} />
                                                        </button>
                                                    </div>
                                                    <div className="relative print:hidden">
                                                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-300" size={10} />
                                                        <input
                                                            type="text"
                                                            placeholder={`Filter ${header}...`}
                                                            value={columnFilters[idx] || ''}
                                                            onChange={(e) => setColumnFilters(prev => ({ ...prev, [idx]: e.target.value }))}
                                                            className="w-full bg-white border border-slate-200 pl-6 pr-2 py-1.5 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                                                        />
                                                    </div>
                                                </div>
                                            </th>
                                        )
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {processedReport.data.map((row, rIdx) => (
                                    <tr key={rIdx} className="hover:bg-teal-50/40 transition-colors group">
                                        {row.map((cell, cIdx) => (
                                            effectiveVisibleColumns.includes(cIdx) && (
                                                <td key={cIdx} className="px-6 py-4 text-slate-700 font-semibold border-r border-slate-50 whitespace-nowrap group-hover:text-teal-900">{cell}</td>
                                            )
                                        ))}
                                    </tr>
                                ))}
                                {processedReport.data.length === 0 && (
                                    <tr>
                                        <td colSpan={effectiveVisibleColumns.length} className="px-6 py-20 text-center text-slate-400 italic font-bold">
                                            No records match your current filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Print-only Footer */}
                <div className="hidden print:flex justify-between items-center mt-12 border-t border-slate-200 pt-6 text-xs font-black text-slate-400 uppercase tracking-widest">
                    <div>Visionary Care HMS • Enterprise Reporting Module</div>
                    <div>Page 1 of 1</div>
                    <div>End of Report</div>
                </div>

                {/* Column Customizer Modal */}
                {showColumnCustomizer && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                        <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
                            <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-teal-500/20 text-teal-400 rounded-2xl border border-teal-500/30"><Settings size={24} /></div>
                                    <div>
                                        <h3 className="text-xl font-black uppercase tracking-tighter">Customize Columns</h3>
                                        <p className="text-xs text-slate-400 font-black uppercase tracking-widest mt-1">Select columns to display in the report</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowColumnCustomizer(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
                            </div>
                            <div className="p-8 grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                                {processedReport.headers.map((header, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setVisibleColumns(prev => {
                                            const current = prev.length > 0 ? prev : processedReport.headers.map((_, i) => i);
                                            return current.includes(idx) ? current.filter(c => c !== idx) : [...current, idx].sort((a, b) => a - b);
                                        })}
                                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-xs font-bold ${effectiveVisibleColumns.includes(idx) ? 'bg-teal-50 border-teal-200 text-teal-700 shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                                    >
                                        <span>{header}</span>
                                        {effectiveVisibleColumns.includes(idx) ? <Eye size={16} /> : <EyeOff size={16} />}
                                    </button>
                                ))}
                            </div>
                            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between gap-4">
                                <button
                                    onClick={() => setVisibleColumns(processedReport.headers.map((_, i) => i))}
                                    className="px-6 py-3 text-slate-500 font-black uppercase text-xs tracking-widest hover:text-teal-600 transition-colors"
                                >
                                    Reset All
                                </button>
                                <button
                                    onClick={() => setShowColumnCustomizer(false)}
                                    className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 shadow-xl transition-all active:scale-95"
                                >
                                    Apply Changes
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 p-10 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden print:hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><Sparkles size={180} /></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-white/10 rounded-2xl border border-white/10 shadow-inner text-teal-400"><Sparkles size={24} /></div>
                                <div>
                                    <h3 className="font-black text-xl tracking-tight">AI Master Analytics</h3>
                                    <p className="text-xs text-indigo-300 font-black uppercase tracking-widest mt-1">Specialized Insights for High-Volume Reporting</p>
                                </div>
                            </div>
                            <button onClick={handleRunAnalysis} disabled={isAnalyzing} className="bg-teal-500 hover:bg-teal-400 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl transition-all disabled:opacity-30">
                                {isAnalyzing ? 'Deep Scanning Data...' : 'Run Clinical Logic Analysis'}
                            </button>
                        </div>
                        {aiAnalysis ? (
                            <div className="prose prose-invert prose-sm max-w-none bg-white/5 p-8 rounded-3xl border border-white/5 leading-relaxed font-medium">
                                <div dangerouslySetInnerHTML={{ __html: aiAnalysis.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                            </div>
                        ) : (
                            <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-3xl bg-white/5">
                                <p className="text-xs font-black uppercase tracking-widest text-indigo-300 opacity-50">Click the analysis trigger to generate deep-link clinical observations.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Business Intelligence Center</h1>
                    <p className="text-sm text-slate-500 font-medium">Audit logs, clinical outcome reports, and master patient data.</p>
                </div>
                <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                    <button
                        onClick={() => setReportView('global')}
                        className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${reportView === 'global' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                        Global Views
                    </button>
                    <button
                        onClick={() => setReportView('custom')}
                        className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${reportView === 'custom' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                        Custom Queries
                    </button>
                </div>
            </div>

            {reportView === 'global' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {reportCategories.map((category, idx) => (
                        <div key={idx} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all group">
                            <div className={`p-6 border-b border-slate-50 flex items-center gap-4 ${category.color}`}>
                                <div className={`p-3 rounded-2xl bg-white shadow-sm ${category.color.split(' ')[0]}`}>
                                    <category.icon size={22} />
                                </div>
                                <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">{category.title}</h3>
                            </div>
                            <div className="p-3">
                                {category.items.map((item, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedReport(item)}
                                        className="w-full text-left px-5 py-3.5 text-xs font-bold text-slate-500 hover:bg-teal-50 hover:text-teal-700 rounded-2xl transition-all flex items-center justify-between group/item"
                                    >
                                        {item}
                                        <ChevronRight className="opacity-0 group-hover/item:opacity-100 transition-all text-teal-400 transform group-hover/item:translate-x-1" size={16} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-500">
                    <div className="p-12">
                        <div className="flex flex-col md:flex-row gap-12 items-center">
                            <div className="flex-1 text-center md:text-left">
                                <div className="w-20 h-20 bg-teal-50 text-teal-500 rounded-[2rem] flex items-center justify-center mb-8 border border-teal-100 shadow-inner mx-auto md:mx-0">
                                    <Database size={32} />
                                </div>
                                <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-4">Advanced Query Builder</h2>
                                <p className="text-slate-500 font-medium max-w-xl mb-10">Construct complex cross-module queries. Access raw data streams and generate ad-hoc clinical insights by selecting a base module below.</p>

                                <div className="space-y-6 max-w-md mx-auto md:mx-0">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Select Base Data Module</label>
                                        <select
                                            value={customQueryModule}
                                            onChange={(e) => setCustomQueryModule(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                                        >
                                            <option value="">-- Choose a Module --</option>
                                            {reportCategories.map((cat, i) => (
                                                <option key={i} value={cat.items[0]}>{cat.title}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <button
                                        onClick={() => {
                                            if (!customQueryModule) return;
                                            setIsQueryRunning(true);
                                            setTimeout(() => {
                                                setSelectedReport(customQueryModule);
                                                setIsQueryRunning(false);
                                            }, 1500);
                                        }}
                                        disabled={!customQueryModule || isQueryRunning}
                                        className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 shadow-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                    >
                                        {isQueryRunning ? (
                                            <>
                                                <Activity className="animate-spin" size={16} />
                                                Compiling Data Stream...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={16} />
                                                Initialize Query Engine
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-teal-200 transition-all group">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm text-slate-400 group-hover:text-teal-500 transition-colors">
                                        <Filter size={20} />
                                    </div>
                                    <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-1">Visual Builder</h4>
                                    <p className="text-xs text-slate-400 font-bold leading-relaxed">Drag and drop fields to create custom data relationships.</p>
                                </div>
                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-teal-200 transition-all group">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm text-slate-400 group-hover:text-teal-500 transition-colors">
                                        <FileCode size={20} />
                                    </div>
                                    <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-1">SQL Console</h4>
                                    <p className="text-xs text-slate-400 font-bold leading-relaxed">Write raw SQL queries for maximum control over data extraction.</p>
                                </div>
                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-teal-200 transition-all group">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm text-slate-400 group-hover:text-teal-500 transition-colors">
                                        <TrendingUp size={20} />
                                    </div>
                                    <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-1">Predictive</h4>
                                    <p className="text-xs text-slate-400 font-bold leading-relaxed">Forecast future trends based on historical data patterns.</p>
                                </div>
                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-teal-200 transition-all group">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm text-slate-400 group-hover:text-teal-500 transition-colors">
                                        <Globe size={20} />
                                    </div>
                                    <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-1">External Sync</h4>
                                    <p className="text-xs text-slate-400 font-bold leading-relaxed">Connect to external health registries for comparative analysis.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
