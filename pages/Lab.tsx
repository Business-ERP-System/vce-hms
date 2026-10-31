
import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { LabTest, LabEquipment, LabTestDefinition } from '../types';
import { Search, TestTube, FileText, CheckCircle, Clock, Upload, Download, Wrench, Plus, Printer, Settings, Save, X, FlaskConical, Trash2, Mail, Sparkles, Database, AlertCircle } from 'lucide-react';
import { downloadPDF, shareToWhatsApp } from '../services/exportService';
import { useNavigate } from 'react-router-dom';

const Lab = () => {
    const { labTests, labTestDefinitions, patients, addLabTest, addLabTestDefinition, updateLabTest } = useData();
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState<'tests' | 'equipment' | 'master'>('tests');
    const [searchTerm, setSearchTerm] = useState('');
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [showTestDefModal, setShowTestDefModal] = useState(false);
    const [showResultModal, setShowResultModal] = useState(false);
    const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
    const [testResult, setTestResult] = useState({ result: '', technician: currentUser || '', range: '' });

    // Forms
    const [newRequest, setNewRequest] = useState({ patientId: '', testDefId: '' });
    const [newTestDef, setNewTestDef] = useState({ name: '', code: '', price: '', range: '', dept: 'Pathology' });

    // Mock Equipment Data
    const [equipment] = useState<LabEquipment[]>([
        { id: 'LE001', name: 'OCT Machine', model: 'Zeiss Cirrus 500', purchaseDate: '2022-05-15', value: 45000, status: 'Operational', nextService: '2024-05-15' },
        { id: 'LE002', name: 'Humphrey Field Analyzer', model: 'HFA3', purchaseDate: '2021-11-20', value: 28000, status: 'Operational', nextService: '2024-02-10' },
        { id: 'LE003', name: 'Blood Gas Analyzer', model: 'Radiometer ABL800', purchaseDate: '2023-01-10', value: 12000, status: 'Operational', nextService: '2024-07-10' },
    ]);

    const filteredTests = labTests.filter(test =>
        test.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const updateStatus = (id: string, newStatus: LabTest['status'], extraData: Partial<LabTest> = {}) => {
        const updateObj: Partial<LabTest> = { status: newStatus, ...extraData };
        if (newStatus === 'Sample Collected') updateObj.sampleCollectedAt = new Date().toLocaleString();
        if (newStatus === 'Processing') updateObj.processedAt = new Date().toLocaleString();
        if (newStatus === 'Completed') updateObj.processedAt = new Date().toLocaleString();
        if (newStatus === 'Delivered') updateObj.deliveredAt = new Date().toLocaleString();

        updateLabTest(id, updateObj);
    };

    const handleOpenResultModal = (test: LabTest) => {
        const def = labTestDefinitions.find(d => d.name === test.testName);
        setSelectedTest(test);
        setTestResult({
            result: test.result || '',
            technician: currentUser || '',
            range: test.referenceRange || def?.referenceRange || 'N/A'
        });
        setShowResultModal(true);
    };

    const handleSaveResult = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedTest) {
            updateStatus(selectedTest.id, 'Completed', {
                result: testResult.result,
                technicianName: testResult.technician,
                referenceRange: testResult.range
            });
            setShowResultModal(false);
            setSelectedTest(null);
        }
    };

    const handleCreateRequest = (e: React.FormEvent) => {
        e.preventDefault();
        const patient = patients.find(p => p.id === newRequest.patientId);
        const testDef = labTestDefinitions.find(t => t.id === newRequest.testDefId);

        if (patient && testDef) {
            addLabTest({
                id: `LAB-${Date.now().toString().slice(-6)}`,
                patientId: patient.id,
                patientName: patient.name,
                testName: testDef.name,
                date: new Date().toISOString().split('T')[0],
                status: 'Pending',
                price: testDef.price,
                referenceRange: testDef.referenceRange,
                deliveryTiming: '24 Hours'
            });
            setShowRequestModal(false);
            setNewRequest({ patientId: '', testDefId: '' });
        }
    };

    const handleAddTestDef = (e: React.FormEvent) => {
        e.preventDefault();
        addLabTestDefinition({
            id: `TD-${Date.now().toString().slice(-4)}`,
            name: newTestDef.name,
            code: newTestDef.code,
            price: parseFloat(newTestDef.price) || 0,
            referenceRange: newTestDef.range,
            department: newTestDef.dept
        });
        setShowTestDefModal(false);
        setNewTestDef({ name: '', code: '', price: '', range: '', dept: 'Pathology' });
    };

    const StatusStepper = ({ status, test }: { status: string, test: LabTest }) => {
        const steps = ['Pending', 'Sample Collected', 'Processing', 'Completed', 'Delivered'];
        const currentIdx = steps.indexOf(status);

        return (
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                    {steps.map((step, idx) => (
                        <div key={step} className="flex items-center">
                            <div
                                className={`w-2 h-2 rounded-full ${idx <= currentIdx ? (status === 'Delivered' ? 'bg-emerald-500' : 'bg-indigo-600') : 'bg-slate-200'}`}
                                title={step}
                            />
                            {idx < steps.length - 1 && (
                                <div className={`w-3 h-0.5 ${idx < currentIdx ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
                            )}
                        </div>
                    ))}
                </div>
                {test.sampleCollectedAt && status !== 'Pending' && (
                    <span className="text-[10px] font-black text-slate-400 uppercase">Coll: {test.sampleCollectedAt.split(',')[1]}</span>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <FlaskConical className="text-indigo-600" /> LAB <span className="text-indigo-600">DIAGNOSTICS</span>
                    </h1>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Samples, Results & Automated Reporting</p>
                </div>
                <div className="flex gap-2 items-center">
                    <button onClick={() => setActiveTab('master')} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-2 hover:border-indigo-600 transition-all">
                        <Settings size={14} /> Catalog
                    </button>
                    <button onClick={() => setShowRequestModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
                        <Plus size={16} /> New Request
                    </button>
                </div>
            </div>

            <div className="flex bg-white p-1 rounded-xl border border-slate-200 w-fit">
                <button onClick={() => setActiveTab('tests')} className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'tests' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}>Tests & Workflow</button>
                <button onClick={() => setActiveTab('equipment')} className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'equipment' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}>Lab Assets</button>
            </div>

            {activeTab === 'tests' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full sm:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search by UHID, Patient or Test..."
                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-600 outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto text-xs">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-widest border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4">UID</th>
                                    <th className="px-6 py-4">Subject</th>
                                    <th className="px-6 py-4">Metric</th>
                                    <th className="px-6 py-4">Bill Status</th>
                                    <th className="px-6 py-4">Workflow Progress</th>
                                    <th className="px-6 py-4 text-right">Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredTests.map((test) => (
                                    <tr key={test.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4 font-mono font-bold text-indigo-600">{test.id}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-black text-slate-900 uppercase">{test.patientName}</div>
                                            <div className="text-xs font-bold text-slate-400">{test.patientId}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800">{test.testName}</div>
                                            <div className="text-xs font-bold text-indigo-400 uppercase">{test.date}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {test.paymentStatus ? (
                                                <div className="flex flex-col gap-1">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-black uppercase tracking-tighter border ${test.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse'}`}>
                                                        {test.paymentStatus === 'Paid' ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                                                        {test.paymentStatus}
                                                    </span>
                                                    {test.invoiceId && <span className="text-[10px] font-mono text-slate-400">#{test.invoiceId}</span>}
                                                </div>
                                            ) : (
                                                <span className="text-xs font-bold text-slate-300 uppercase italic">Walk-in / Direct</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-2">
                                                <span className={`inline-flex w-fit items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-tighter
                                                    ${test.status === 'Completed' || test.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                                        test.status === 'Processing' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                                                            test.status === 'Sample Collected' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-slate-100 text-slate-500'}`}>
                                                    {test.status}
                                                </span>
                                                <StatusStepper status={test.status} test={test} />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {test.status === 'Pending' && (
                                                    <button
                                                        onClick={() => {
                                                            if (test.paymentStatus === 'Pending') {
                                                                if (window.confirm(`WARNING: This bill is UNPAID (Invoice ${test.invoiceId}). Do you want to proceed with sample collection anyway? (Emergency/Special Case)`)) {
                                                                    updateStatus(test.id, 'Sample Collected');
                                                                }
                                                            } else {
                                                                updateStatus(test.id, 'Sample Collected');
                                                            }
                                                        }}
                                                        className={`px-3 py-1.5 rounded-lg font-bold shadow-lg transition-all ${test.paymentStatus === 'Paid' ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100' : 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-100'}`}
                                                    >
                                                        {test.paymentStatus === 'Paid' ? 'Collect Sample' : 'Collect (Unpaid)'}
                                                    </button>
                                                )}
                                                {test.status === 'Sample Collected' && (
                                                    <button onClick={() => updateStatus(test.id, 'Processing')} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all">Process</button>
                                                )}
                                                {test.status === 'Processing' && (
                                                    <button onClick={() => handleOpenResultModal(test)} className="bg-teal-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-teal-700 shadow-lg shadow-teal-100 transition-all">Complete</button>
                                                )}
                                                {(test.status === 'Completed' || test.status === 'Delivered') && (
                                                    <div className="flex gap-2 justify-end" id={`lab-report-${test.id}`}>
                                                        <button
                                                            onClick={() => downloadPDF(`lab-report-${test.id}`, `LabReport_${test.patientName}_${test.id}.pdf`)}
                                                            className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
                                                            title="Download PDF"
                                                        >
                                                            <Download size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => shareToWhatsApp(`lab-report-${test.id}`, `Lab report for ${test.patientName} is ready.`)}
                                                            className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-green-600 hover:text-white transition-all"
                                                            title="Share Report"
                                                        >
                                                            <Mail size={14} />
                                                        </button>
                                                        {test.status === 'Completed' && (
                                                            <button onClick={() => updateStatus(test.id, 'Delivered')} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all" title="Mark Delivered">
                                                                <CheckCircle size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Equipment Tab */}
            {activeTab === 'equipment' && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <h3 className="font-black text-slate-900 text-sm flex items-center gap-3 uppercase tracking-tight"><Wrench className="text-indigo-600" /> Infrastructure Maintenance</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Manage Diagnostic Equipment and Service Intervals</p>
                        </div>
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                            <input
                                type="text"
                                placeholder="Search assets (Name, Model, ID)..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-tight focus:ring-2 focus:ring-indigo-600 transition-all outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                        {equipment
                            .filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()) || e.model.toLowerCase().includes(searchTerm.toLowerCase()) || e.id.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map(e => (
                                <div key={e.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-indigo-50/50 transition-all duration-500">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><FlaskConical size={100} /></div>
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{e.name}</h3>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">{e.model}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${e.status === 'Operational' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>{e.status}</span>
                                    </div>
                                    <div className="space-y-4 mb-8">
                                        <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
                                            <span className="text-slate-400">Inventory UID</span>
                                            <span className="text-slate-900 font-mono">#{e.id}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
                                            <span className="text-slate-400">Valuation</span>
                                            <span className="text-slate-900">${e.value.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
                                            <span className="text-slate-400">Maintenance</span>
                                            <span className="text-indigo-600">Next: {e.nextService}</span>
                                        </div>
                                    </div>
                                    <button className="w-full py-3 bg-slate-50 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-slate-900 hover:text-white transition-all">Schedule Diagnostic Service</button>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Test Master Tab */}
            {activeTab === 'master' && (
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center bg-slate-50/20 gap-6">
                        <div className="flex-1">
                            <h3 className="font-black text-slate-900 text-sm flex items-center gap-3 uppercase tracking-tight"><Settings className="text-indigo-600" /> Advanced Investigative Catalog</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Manage Test Definitions and Reference Intervals</p>

                            <div className="relative w-full max-w-sm mt-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                                <input
                                    type="text"
                                    placeholder="Search catalog (Test Name, Code)..."
                                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-tight focus:ring-2 focus:ring-indigo-600 transition-all outline-none"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <button onClick={() => setShowTestDefModal(true)} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 shadow-xl shadow-slate-200 hover:bg-indigo-600 transition-all">
                            <Plus size={14} /> Inject New Definition
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-[#fbfcff] text-slate-400 font-black uppercase tracking-[0.2em] border-b border-slate-100">
                                <tr>
                                    <th className="px-8 py-5">Internal Code</th>
                                    <th className="px-8 py-5">Investigation</th>
                                    <th className="px-8 py-5">Department</th>
                                    <th className="px-8 py-5">Physiological Range</th>
                                    <th className="px-8 py-5 text-right">Standard Fee</th>
                                    <th className="px-8 py-5 text-right">Administrative</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {labTestDefinitions
                                    .filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.code.toLowerCase().includes(searchTerm.toLowerCase()))
                                    .map(def => (
                                        <tr key={def.id} className="hover:bg-slate-50/50 transition-colors border-transparent border-l-4 hover:border-l-indigo-600 group">
                                            <td className="px-8 py-6 font-mono font-black text-indigo-400">{def.code}</td>
                                            <td className="px-8 py-6 font-black text-slate-900 uppercase tracking-tight">{def.name}</td>
                                            <td className="px-8 py-6">
                                                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-100">{def.department}</span>
                                            </td>
                                            <td className="px-8 py-6 text-slate-500 font-bold uppercase tracking-widest italic">{def.referenceRange}</td>
                                            <td className="px-8 py-6 text-right font-black text-slate-900 text-sm">${def.price.toFixed(2)}</td>
                                            <td className="px-8 py-6 text-right">
                                                <button className="p-2.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Settings size={16} /></button>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Result Entry Modal - CRITICAL NEW FEATURE */}
            {showResultModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-white/20">
                        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                            <div>
                                <h3 className="font-black uppercase tracking-widest text-xs flex items-center gap-2">
                                    <FileText size={16} className="text-teal-400" /> Clinical Result Matrix
                                </h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Verification Phase</p>
                            </div>
                            <button onClick={() => setShowResultModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSaveResult} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Subject</p>
                                    <p className="text-xs font-black text-slate-900 uppercase">{selectedTest?.patientName}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Investigation</p>
                                    <p className="text-xs font-black text-indigo-600 uppercase">{selectedTest?.testName}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Diagnostic Findings (Result)</label>
                                <textarea
                                    required
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-teal-500 outline-none min-h-[120px]"
                                    placeholder="Enter precise clinical findings..."
                                    value={testResult.result}
                                    onChange={e => setTestResult({ ...testResult, result: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Physiological Range</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-teal-500 outline-none"
                                        value={testResult.range}
                                        onChange={e => setTestResult({ ...testResult, range: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Technician Sign-off</label>
                                    <input
                                        type="text"
                                        readOnly
                                        className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs font-black text-slate-500 uppercase"
                                        value={testResult.technician}
                                    />
                                </div>
                            </div>

                            <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3">
                                <Save size={16} /> Finalize Diagnostic Report
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Request Modal */}
            {showRequestModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/20">
                        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                            <div>
                                <h3 className="font-black uppercase tracking-widest text-xs flex items-center gap-2">
                                    <Sparkles size={16} className="text-amber-400" /> Investigative Deployment
                                </h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Acquisition Phase</p>
                            </div>
                            <button onClick={() => setShowRequestModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreateRequest} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Subject Identification (UHID)</label>
                                <select required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none appearance-none" value={newRequest.patientId} onChange={e => setNewRequest({ ...newRequest, patientId: e.target.value })}>
                                    <option value="">-- RESOLVE SUBJECT --</option>
                                    {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Investigation Modality</label>
                                <select required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none appearance-none" value={newRequest.testDefId} onChange={e => setNewRequest({ ...newRequest, testDefId: e.target.value })}>
                                    <option value="">-- SELECT PROTOCOL --</option>
                                    {labTestDefinitions.map(t => <option key={t.id} value={t.id}>{t.name} (Code: {t.code})</option>)}
                                </select>
                            </div>
                            <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-slate-900 transition-all shadow-2xl shadow-indigo-200/50 flex items-center justify-center gap-3">
                                <Plus size={16} /> Deploy Diagnostic Request
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Test Def Modal */}
            {showTestDefModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/20">
                        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                            <div>
                                <h3 className="font-black uppercase tracking-widest text-xs flex items-center gap-2">
                                    <Database size={16} className="text-teal-400" /> Knowledge Injection
                                </h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Catalog Expansion</p>
                            </div>
                            <button onClick={() => setShowTestDefModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddTestDef} className="p-8 space-y-4">
                            <div className="space-y-2">
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Test Descriptor</label>
                                <input placeholder="e.g. COMPLETE BLOOD COUNT" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase tracking-tight focus:ring-2 focus:ring-indigo-600 outline-none" value={newTestDef.name} onChange={e => setNewTestDef({ ...newTestDef, name: e.target.value })} required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Internal Code</label>
                                    <input placeholder="e.g. CBC-101" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase tracking-tight focus:ring-2 focus:ring-indigo-600 outline-none" value={newTestDef.code} onChange={e => setNewTestDef({ ...newTestDef, code: e.target.value })} required />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Standard Fee ($)</label>
                                    <input placeholder="0.00" type="number" step="0.01" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none" value={newTestDef.price} onChange={e => setNewTestDef({ ...newTestDef, price: e.target.value })} required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Physiological Reference Range</label>
                                <input placeholder="e.g. 13.5 - 17.5 g/dL" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none" value={newTestDef.range} onChange={e => setNewTestDef({ ...newTestDef, range: e.target.value })} />
                            </div>
                            <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:bg-indigo-600 transition-all mt-4">Commit Definition to Catalog</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Lab;
