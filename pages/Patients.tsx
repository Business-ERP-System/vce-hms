
import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Patient, PreviousVisionHistory } from '../types';
import { MOCK_EMPLOYEES } from '../constants';
import { 
    Search, Plus, Filter, FileText, Trash2, X, Save, ArrowUpDown, Sparkles, 
    BrainCircuit, AlertTriangle, Edit, RefreshCw, ChevronDown, Download, 
    Upload, ScanLine, FileCheck, CheckSquare, Square, UserMinus, UserCheck, 
    Stethoscope, Eye, Clock, Activity, FilePlus, Printer, DollarSign, 
    CreditCard, Scissors, Bed as BedIcon, ArrowRight, FileJson, 
    FileSpreadsheet, FileCode, FileType, Phone, ExternalLink, MapPin, 
    Home, CreditCard as CardIcon, UserPlus, Info, Tag, Clipboard, Copy,
    Users, Mail, Archive, User, Calendar, Map as MapIcon, Briefcase, Building2
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const fuzzyMatch = (text: string, query: string): boolean => {
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

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setSearchFilter] = useState<string>('All');
  
  const canAdd = hasPermission('Patient List', 'add');
  const canEdit = hasPermission('Patient List', 'edit');
  const canDelete = hasPermission('Patient List', 'delete');
  const canPrint = hasPermission('Patient List', 'print');
  const canExport = hasPermission('Patient List', 'export');
  const canView = hasPermission('Patient List', 'view');

  const [sortConfig, setSortConfig] = useState<{ key: keyof Patient; direction: 'asc' | 'desc' }>({
    key: 'name', direction: 'asc'
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [detailsTab, setDetailsTab] = useState<'Overview' | 'Clinical' | 'Vision' | 'Financials'>('Overview');
  const [expandedVisitIdx, setExpandedVisitIdx] = useState<number | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSort = (key: keyof Patient) => {
    setSortConfig({ key, direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc' });
  };

  const filteredPatients = patients.filter(p => (
    fuzzyMatch(p.name, searchTerm) || 
    p.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.contact.includes(searchTerm) ||
    (p.village && fuzzyMatch(p.village, searchTerm)) ||
    (p.district && fuzzyMatch(p.district, searchTerm))
  ) && (statusFilter === 'All' || p.status === statusFilter));

  const sortedPatients = [...filteredPatients].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (aValue === undefined || bValue === undefined) return 0;
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
  });

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

  const handlePrint = () => {
    window.print();
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
        {Icon && <div className="mt-0.5 text-slate-400 group-hover:text-teal-600"><Icon size={16}/></div>}
        <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">{label}</p>
            <p className="text-sm font-medium text-slate-900 leading-tight truncate" title={String(value)}>{value || 'Not Recorded'}</p>
        </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Patient Master Registry</h1>
            <p className="text-sm text-slate-500 font-medium">Detailed access to all demographic and clinical hospital records.</p>
        </div>
        <div className="flex gap-2">
            {canExport && <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold hover:bg-slate-50 transition-colors"><Download size={18} /> Export List</button>}
            {canAdd && <button onClick={() => navigate('/registration')} className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold shadow-lg transition-all"><Plus size={18} /> New Patient Entry</button>}
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between z-20 relative">
        <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input type="text" placeholder="Search by name, patient ID, phone or area..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex gap-2">
            <select value={statusFilter} onChange={(e) => setSearchFilter(e.target.value)} className="bg-white border border-slate-200 text-slate-700 py-2.5 px-4 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer transition-all">
              <option value="All">All Case Statuses</option><option value="OPD">Out-Patient</option><option value="IPD">In-Patient</option><option value="Discharged">Discharged</option>
            </select>
            <button className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 transition-colors"><Filter size={20}/></button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative z-10">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase tracking-wider border-b border-slate-200">
                    <tr>
                        <th className="px-8 py-5 font-bold">Patient Identity (PID)</th>
                        <th className="px-8 py-5 font-bold">Demographics</th>
                        <th className="px-8 py-5 font-bold">Contact & Location</th>
                        <th className="px-8 py-5 font-bold">Classification</th>
                        <th className="px-8 py-5 font-bold">File Location</th>
                        <th className="px-8 py-5 font-bold">Clinical Case</th>
                        <th className="px-8 py-5 text-right font-bold">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {sortedPatients.map((patient) => (
                        <tr key={patient.id} onClick={() => openPatientDetails(patient)} className="hover:bg-teal-50/20 cursor-pointer group transition-all">
                            <td className="px-8 py-5">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm shadow-sm border border-teal-100">
                                        {patient.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900 text-sm leading-tight">{patient.name}</div>
                                        <div className="text-xs font-mono font-bold text-slate-400 mt-1 uppercase">ID: {patient.id}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-8 py-5">
                                <div className="text-sm font-semibold text-slate-700">{patient.age}Y / {patient.gender}</div>
                                <div className="text-xs text-slate-400 font-medium uppercase">{patient.dob || 'DOB Not Set'}</div>
                            </td>
                            <td className="px-8 py-5">
                                <div className="text-sm font-semibold text-slate-700">{patient.contact}</div>
                                <div className="text-xs text-slate-400 font-medium uppercase">{patient.village || 'Area N/A'}, {patient.district || 'District N/A'}</div>
                            </td>
                            <td className="px-8 py-5">
                                <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs uppercase border border-indigo-100">{patient.patientType}</span>
                                <div className="text-xs text-slate-400 font-bold mt-1 uppercase">{patient.paymentCategory} ACCOUNT</div>
                            </td>
                            <td className="px-8 py-5">
                                <div className="flex items-center gap-2">
                                    <Archive size={14} className="text-slate-400"/>
                                    <span className="text-sm font-bold text-slate-700">{patient.mrLocation}</span>
                                </div>
                                <div className="text-xs text-slate-400 font-medium uppercase mt-0.5">{patient.speciality}</div>
                            </td>
                            <td className="px-8 py-5">
                                <div className="text-sm font-semibold text-slate-800">{patient.diagnosis}</div>
                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold mt-1 ${
                                    patient.status === 'IPD' ? 'bg-purple-100 text-purple-700' : 
                                    patient.status === 'Discharged' ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-700'
                                }`}>{patient.status}</span>
                            </td>
                            <td className="px-8 py-5 text-right">
                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    {canEdit && <button onClick={(e) => { e.stopPropagation(); navigate('/registration', { state: { patient } }) }} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Modify Patient Data"><Edit size={16} /></button>}
                                    {canDelete && <button onClick={(e) => { e.stopPropagation(); setPatientToDelete(patient.id); setIsDeleteModalOpen(true); }} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Wipe Clinical Record"><Trash2 size={16} /></button>}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in zoom-in-95 overflow-y-auto">
           <div className="bg-slate-50 rounded-[2.5rem] shadow-2xl w-full max-w-6xl flex flex-col min-h-[85vh] max-h-[90vh] overflow-hidden">
              {/* Patient Dossier Header */}
              <div className="bg-white px-8 py-6 border-b border-slate-200 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-bold text-3xl shadow-lg">{selectedPatient.name.charAt(0)}</div>
                      <div>
                          <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-bold text-slate-900">{selectedPatient.name}</h2>
                            <span className={`px-4 py-1 rounded-lg text-xs font-bold border uppercase tracking-wider ${
                                selectedPatient.status === 'IPD' ? 'bg-purple-100 text-purple-700 border-purple-200' : 
                                selectedPatient.status === 'Discharged' ? 'bg-slate-100 text-slate-600 border-slate-200' : 
                                'bg-emerald-100 text-emerald-700 border-emerald-200'
                            }`}>
                                {selectedPatient.status === 'OPD' ? 'Active Out-Patient' : selectedPatient.status === 'IPD' ? 'In-Patient Resident' : 'Case Finalized'}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-500 mt-1 font-medium">
                              <span className="flex items-center gap-1.5"><Tag size={14} className="text-teal-600"/> Patient ID: {selectedPatient.id}</span>
                              <span className="flex items-center gap-1.5"><UserCheck size={14} className="text-teal-600"/> {selectedPatient.age} Years {selectedPatient.ageMonths || 0} Months / {selectedPatient.gender}</span>
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
                                   <Download size={16} className="text-teal-600"/> Export Data <ChevronDown size={14} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`}/>
                               </button>
                               {showExportMenu && (
                                   <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-[60] animate-in fade-in slide-in-from-top-2">
                                       <button onClick={() => { exportToPDF(); setShowExportMenu(false); }} className="w-full px-4 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors">
                                           <FileType size={16} className="text-rose-500"/> Export as PDF
                                       </button>
                                       <button onClick={() => { exportToExcel(); setShowExportMenu(false); }} className="w-full px-4 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors">
                                           <FileSpreadsheet size={16} className="text-emerald-500"/> Export as Excel (CSV)
                                       </button>
                                       <button onClick={() => { exportToXML(); setShowExportMenu(false); }} className="w-full px-4 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors">
                                           <FileCode size={16} className="text-amber-500"/> Export as XML
                                       </button>
                                   </div>
                               )}
                           </div>
                       )}
                       {canPrint && <button onClick={handlePrint} className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-teal-600 rounded-xl transition-all" title="Print Dossier"><Printer size={20}/></button>}
                       <div className="w-px h-10 bg-slate-200 mx-2"></div>
                       <button onClick={() => navigate('/e-prescription', { state: { patientId: selectedPatient.id } })} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-md"><FileText size={16}/> Clinical Records</button>
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
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 border-b border-slate-100 pb-2"><User size={16} className="text-teal-600"/> Patient Demographics</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <InfoBlock label="Full Name" value={selectedPatient.name} icon={User} />
                                    <InfoBlock label="Age" value={`${selectedPatient.age} Years ${selectedPatient.ageMonths || 0} Months`} icon={Calendar} />
                                    <InfoBlock label="Gender" value={selectedPatient.gender} icon={Users} />
                                    <InfoBlock label="Contact Number" value={selectedPatient.contact} icon={Phone} />
                                    <InfoBlock label="Full Address" value={`${selectedPatient.village}, ${selectedPatient.district}, ${selectedPatient.state}, ${selectedPatient.country}`} icon={MapPin} isFull={true} />
                                </div>
                            </section>

                            {/* Personal & Contact Details */}
                            <section>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 border-b border-slate-100 pb-2"><UserCheck size={16} className="text-teal-600"/> Personal & Contact Profile</h3>
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
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 border-b border-slate-100 pb-2"><MapIcon size={16} className="text-indigo-600"/> Geographic Address Mapping</h3>
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
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 border-b border-slate-100 pb-2"><Briefcase size={16} className="text-amber-600"/> Hospital Administrative Records</h3>
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
                                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Sparkles className="text-teal-600" size={18}/> Specialist Clinical Summary</h3>
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
                                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Clock size={16} className="text-blue-600"/> Clinical Visit History</h3>
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
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 uppercase tracking-widest text-xs"><DollarSign size={16} className="text-green-600" /> Patient Billing Records</h3>
                            <button onClick={() => navigate('/billing', { state: { patient: selectedPatient } })} className="text-xs text-teal-600 hover:underline font-bold uppercase transition-all">Open Full Financial Ledger</button>
                        </div>
                        <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs"><tr><th className="px-6 py-4">Transaction Date</th><th className="px-6 py-4">Service Description</th><th className="px-6 py-4 text-right">Settled Amount</th></tr></thead><tbody className="divide-y divide-slate-100">{patientFinancials.map(txn => (<tr key={txn.id} className="hover:bg-slate-50 transition-colors"><td className="px-6 py-4 text-slate-500 font-mono text-xs">{txn.date}</td><td className="px-6 py-4 font-bold text-slate-700">{txn.description}</td><td className="px-6 py-4 text-right font-bold text-slate-900">{formatCurrency(txn.amount)}</td></tr>))}</tbody></table></div>
                     </div>
                 )}

                 {detailsTab === 'Clinical' && (
                     <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex justify-between items-start">
                             <div className="flex items-center gap-6">
                                <div className="p-4 bg-teal-50 text-teal-600 rounded-2xl shadow-inner"><Stethoscope size={32}/></div>
                                <div>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Primary Clinical Impression</h3>
                                    <p className="text-2xl font-bold text-slate-900">{selectedPatient.diagnosis}</p>
                                </div>
                             </div>
                             <button onClick={() => navigate('/e-prescription', { state: { patientId: selectedPatient.id } })} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 uppercase tracking-widest"><FileText size={16}/> Electronic Rx Module</button>
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
                                 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Eye size={120} className="text-teal-600"/></div>
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
                                 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Eye size={120} className="text-blue-600"/></div>
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
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
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
      )}
    </div>
  );
};

export default Patients;
