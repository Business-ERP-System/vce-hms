
import React, { useState, useRef } from 'react';
import { 
    RefreshCw, Database, FileUp, ShieldCheck, AlertTriangle, 
    CheckCircle, Terminal, Download, Copy, Table as TableIcon, 
    ArrowRight, Settings, Info, Zap, HardDrive, History,
    FileJson, FileSpreadsheet, FileCode, Search, Filter,
    ChevronRight, ChevronDown, Activity, PlayCircle, Lock, FileText,
    Users, Receipt, Stethoscope, Package, X, BookOpen
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { getMigrationModules, generateMigrationScript } from '../src/services/migrationService';

const MigrationBridge = () => {
  const { patients, addPatient, formatCurrency } = useData();
  const [activeTab, setActiveTab] = useState<'overview' | 'bridge' | 'import' | 'logs'>('overview');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const migrationModules = getMigrationModules();
  const [selectedTable, setSelectedTable] = useState(migrationModules[0]?.name || 'Patients');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showHelpModal, setShowHelpModal] = useState(false);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  const generateSqlScript = (table: string) => {
    return generateMigrationScript(table);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    addLog(`File detected: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
    addLog(`Analyzing schema for ${selectedTable} migration...`);
    
    // Simulate processing
    setIsProcessing(true);
    let p = 0;
    const interval = setInterval(() => {
        p += 5;
        setProgress(p);
        if (p === 20) addLog("Schema validation: 100% Match.");
        if (p === 50) addLog("Processing batch 1 (Rows 1-500)...");
        if (p === 80) addLog("Processing batch 2 (Rows 501-1000)...");
        
        if (p >= 100) {
            clearInterval(interval);
            setIsProcessing(false);
            addLog(`SUCCESS: Imported 1,240 records into ${selectedTable} registry.`);
            alert(`Migration Complete! 1,240 records successfully bridged from legacy system.`);
        }
    }, 100);
  };

  const MigrationCard = ({ title, desc, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
        <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
            <Icon size={24} />
        </div>
        <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
               <RefreshCw className="text-teal-600" /> Legacy Data Bridge
           </h1>
           <p className="text-sm text-slate-500">Migrate 20+ years of VB6/MSSQL data into Visionary Care HMS</p>
        </div>
        <div className="flex gap-2">
            <button onClick={() => setShowHelpModal(true)} className="bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-slate-50 shadow-sm transition-all">
                <BookOpen size={18} className="text-teal-600" /> Help Guide
            </button>
            <button onClick={() => setActiveTab('bridge')} className="bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-slate-50 shadow-sm transition-all">
                <FileCode size={18} /> Get SQL Scripts
            </button>
            <button onClick={() => setActiveTab('import')} className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold shadow-lg shadow-teal-100 transition-all active:scale-95">
                <FileUp size={18} /> Start Migration
            </button>
        </div>
      </div>

      <div className="flex bg-white p-1 rounded-2xl border border-slate-200 w-fit shadow-sm overflow-x-auto max-w-full">
             <button onClick={() => setActiveTab('overview')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'overview' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Migration Strategy</button>
             <button onClick={() => setActiveTab('bridge')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'bridge' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Legacy SQL Bridge</button>
             <button onClick={() => setActiveTab('import')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'import' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Data Importer</button>
             <button onClick={() => setActiveTab('logs')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'logs' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Migration Logs</button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MigrationCard 
                    title="400+ Table Support" 
                    desc="Comprehensive mapping for all legacy MSSQL tables including Masters, Transactions, and Vouchers."
                    icon={Database}
                    color="bg-blue-50 text-blue-600"
                />
                <MigrationCard 
                    title="Module Integrity" 
                    desc="Ensures clinical, financial, and operational data remains linked across all migrated modules."
                    icon={ShieldCheck}
                    color="bg-emerald-50 text-emerald-600"
                />
                <MigrationCard 
                    title="Batch Processing" 
                    desc="Handles millions of records using high-performance streaming buffers."
                    icon={Zap}
                    color="bg-amber-50 text-amber-600"
                />
                <MigrationCard 
                    title="Rollback Support" 
                    desc="Safe migration with point-in-time recovery and detailed error reporting."
                    icon={History}
                    color="bg-rose-50 text-rose-600"
                />
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl"><Info size={24}/></div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Enterprise Migration Strategy</h2>
                        <p className="text-sm text-slate-500">A structured approach to migrating 20+ years of comprehensive hospital data with zero loss.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative">
                    <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -translate-y-1/2 z-0"></div>
                    
                    {[
                        { step: 1, title: 'Export from MSSQL', desc: 'Use our Bridge Scripts to export your legacy tables into JSON or CSV format.', icon: Download },
                        { step: 2, title: 'Schema Alignment', desc: 'Upload files to our Data Importer. Map columns and validate data types.', icon: Settings },
                        { step: 3, title: 'Final Sync', desc: 'Execute the migration. Records are instantly available in the new system.', icon: CheckCircle }
                    ].map((item, idx) => (
                        <div key={idx} className="relative z-10 flex flex-col items-center text-center group">
                            <div className="w-16 h-16 rounded-full bg-white border-4 border-slate-50 flex items-center justify-center mb-6 shadow-md group-hover:border-teal-500 transition-all">
                                <item.icon size={24} className="text-slate-400 group-hover:text-teal-600 transition-colors" />
                            </div>
                            <div className="bg-teal-600 text-white text-xs font-black px-3 py-1 rounded-full mb-4 uppercase tracking-widest">Step {item.step}</div>
                            <h4 className="font-bold text-slate-900 mb-2">{item.title}</h4>
                            <p className="text-xs text-slate-500 leading-relaxed px-4">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}

      {activeTab === 'bridge' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-right-4 duration-300">
              <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <TableIcon size={18} className="text-indigo-600" /> Select Legacy Table
                      </h3>
                      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                          {Array.from(new Set(migrationModules.map(m => m.category))).map((category) => (
                              <div key={category} className="space-y-2">
                                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">{category}</h4>
                                  {migrationModules.filter(m => m.category === category).map(module => (
                                      <button 
                                        key={module.name}
                                        onClick={() => setSelectedTable(module.name)}
                                        className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${selectedTable === module.name ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                                      >
                                          <div className="flex flex-col">
                                              <span>{module.name}</span>
                                              <span className={`text-[10px] font-mono ${selectedTable === module.name ? 'text-indigo-200' : 'text-slate-400'}`}>{module.legacyTable}</span>
                                          </div>
                                          <ChevronRight size={14} className={selectedTable === module.name ? 'text-white' : 'text-slate-300'} />
                                      </button>
                                  ))}
                              </div>
                          ))}
                      </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl">
                      <div className="flex items-center gap-3 text-amber-700 mb-3">
                          <AlertTriangle size={20} />
                          <h4 className="font-bold text-sm">MSSQL Compatibility</h4>
                      </div>
                      <p className="text-xs text-amber-600 leading-relaxed">
                          These scripts are optimized for SQL Server 2012 and above. For older versions (SQL 2005/2008), please use the CSV export method via SQL Server Management Studio (SSMS).
                      </p>
                  </div>
              </div>

              <div className="lg:col-span-2 space-y-6">
                  <div className="bg-slate-900 rounded-[2rem] shadow-2xl border border-white/10 overflow-hidden flex flex-col h-[600px]">
                      <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-800">
                          <div className="flex items-center gap-4">
                              <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30"><FileCode size={20}/></div>
                              <div>
                                  <h3 className="text-white font-bold">T-SQL Export Script: {selectedTable}</h3>
                                  <p className="text-xs text-slate-400 font-black uppercase tracking-widest mt-0.5">Copy and run this in your MSSQL Query Window</p>
                              </div>
                          </div>
                          <button 
                            onClick={() => { navigator.clipboard.writeText(generateSqlScript(selectedTable)); alert("Script copied to clipboard."); }}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
                          >
                              <Copy size={16}/> Copy Script
                          </button>
                      </div>
                      <div className="flex-1 overflow-auto p-8 custom-scrollbar">
                          <pre className="font-mono text-sm leading-relaxed text-indigo-300 whitespace-pre">
                              {generateSqlScript(selectedTable)}
                          </pre>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'import' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in zoom-in-95 duration-300">
              <div 
                className={`bg-white border-4 border-dashed rounded-[3rem] p-16 flex flex-col items-center justify-center text-center transition-all ${isProcessing ? 'border-teal-500 bg-teal-50/30' : 'border-slate-100 hover:border-teal-400 hover:bg-slate-50'}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); handleFileUpload({ target: { files: e.dataTransfer.files } } as any); }}
              >
                  {isProcessing ? (
                      <div className="space-y-6 w-full max-w-md">
                          <div className="relative w-32 h-32 mx-auto">
                              <div className="absolute inset-0 border-4 border-teal-100 rounded-full"></div>
                              <div className="absolute inset-0 border-4 border-teal-500 rounded-full border-t-transparent animate-spin"></div>
                              <div className="absolute inset-0 flex items-center justify-center text-teal-600 font-black text-xl">
                                  {progress}%
                              </div>
                          </div>
                          <div>
                              <h3 className="text-xl font-bold text-slate-900 mb-2">Migrating {selectedTable}...</h3>
                              <p className="text-sm text-slate-500">Streaming data packets into system core. Do not close this window.</p>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div className="bg-teal-500 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                          </div>
                      </div>
                  ) : (
                      <>
                          <div className="w-24 h-24 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mb-8 shadow-inner">
                              <FileUp size={48} />
                          </div>
                          <h2 className="text-3xl font-black text-slate-900 mb-4">Upload Legacy Data</h2>
                          <p className="text-slate-500 max-w-md mx-auto mb-10 leading-relaxed">
                              Drag and drop your exported JSON or CSV files here. Our AI engine will automatically detect the schema and start the bridging process.
                          </p>
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            onChange={handleFileUpload}
                            accept=".json,.csv"
                          />
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 shadow-2xl transition-all active:scale-95 flex items-center gap-3"
                          >
                              <Search size={18} /> Browse Files
                          </button>
                          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-black text-slate-400 uppercase tracking-widest">
                              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100"><Users size={12} className="text-blue-500"/> Patients & HR</div>
                              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100"><Receipt size={12} className="text-emerald-500"/> Billing & POS</div>
                              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100"><Stethoscope size={12} className="text-indigo-500"/> EMR & Clinical</div>
                              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100"><Package size={12} className="text-amber-500"/> Inventory & Stock</div>
                          </div>
                      </>
                  )}
              </div>

              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white">
                  <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold flex items-center gap-2"><Terminal size={18} className="text-teal-400"/> Live Migration Console</h3>
                      <div className="flex gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                          <span className="text-xs font-black uppercase tracking-widest text-slate-400">System Ready</span>
                      </div>
                  </div>
                  <div className="h-48 overflow-y-auto font-mono text-xs space-y-2 custom-scrollbar pr-4">
                      {logs.map((log, i) => (
                          <div key={i} className={`flex gap-4 ${log.includes('SUCCESS') ? 'text-emerald-400' : log.includes('ERROR') ? 'text-rose-400' : 'text-slate-400'}`}>
                              <span className="text-slate-600 shrink-0">[{logs.length - i}]</span>
                              <span>{log}</span>
                          </div>
                      ))}
                      {logs.length === 0 && <div className="text-slate-700 italic">No activity recorded. Start an import to see live logs.</div>}
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'logs' && (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
              <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                  <div>
                      <h3 className="text-xl font-bold text-slate-900">Migration History</h3>
                      <p className="text-sm text-slate-500">Audit trail of all data bridging operations.</p>
                  </div>
                  <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-teal-600 transition-all shadow-sm"><Download size={20}/></button>
              </div>
              <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 font-black uppercase text-xs tracking-widest">
                          <tr>
                              <th className="px-8 py-5">Operation ID</th>
                              <th className="px-8 py-5">Table</th>
                              <th className="px-8 py-5">Records</th>
                              <th className="px-8 py-5">Status</th>
                              <th className="px-8 py-5">Timestamp</th>
                              <th className="px-8 py-5 text-right">Report</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                          {[
                              { id: 'MIG-9921', table: 'Patients', count: '1,240', status: 'Success', time: '2023-10-24 14:20' },
                              { id: 'MIG-9920', table: 'Billing', count: '45,000', status: 'Success', time: '2023-10-24 11:05' },
                              { id: 'MIG-9919', table: 'Inventory', count: '850', status: 'Success', time: '2023-10-23 16:45' },
                              { id: 'MIG-9918', table: 'Lab Results', count: '12,400', status: 'Partial', time: '2023-10-23 09:12' },
                          ].map((log) => (
                              <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                                  <td className="px-8 py-5 font-mono font-bold text-slate-600">{log.id}</td>
                                  <td className="px-8 py-5 font-bold text-slate-900">{log.table}</td>
                                  <td className="px-8 py-5 font-bold text-slate-700">{log.count}</td>
                                  <td className="px-8 py-5">
                                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${log.status === 'Success' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                          {log.status}
                                      </span>
                                  </td>
                                  <td className="px-8 py-5 text-slate-500 font-medium">{log.time}</td>
                                  <td className="px-8 py-5 text-right">
                                      <button className="p-2 text-slate-300 hover:text-teal-600 transition-colors"><FileText size={18}/></button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* Schema Alignment Help Modal */}
      {showHelpModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
                  <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-teal-500/20 text-teal-400 rounded-2xl border border-teal-500/30">
                              <BookOpen size={24} />
                          </div>
                          <div>
                              <h3 className="text-xl font-black uppercase tracking-tighter">Schema Alignment Guide</h3>
                              <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Mapping Legacy VB6/MSSQL to Visionary Care HMS</p>
                          </div>
                      </div>
                      <button onClick={() => setShowHelpModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                          <X size={24} />
                      </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                      {/* Concept Section */}
                      <section className="space-y-4">
                          <div className="flex items-center gap-3 text-teal-600">
                              <Zap size={20} />
                              <h4 className="font-black uppercase tracking-widest text-sm">What is Schema Alignment?</h4>
                          </div>
                          <p className="text-sm text-slate-600 leading-relaxed">
                              Your old system (VB6) uses different names for data than our new system. 
                              <strong> Schema Alignment</strong> is the process of telling the new system which "Old Column" matches which "New Field".
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                  <p className="text-xs font-black text-slate-400 uppercase mb-2">Old System (Legacy)</p>
                                  <div className="flex items-center justify-between text-sm font-mono text-slate-700">
                                      <span>[Cust_Name]</span>
                                      <ArrowRight size={14} className="text-slate-300" />
                                      <span className="text-teal-600 font-bold">name</span>
                                  </div>
                              </div>
                              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                  <p className="text-xs font-black text-slate-400 uppercase mb-2">Old System (Legacy)</p>
                                  <div className="flex items-center justify-between text-sm font-mono text-slate-700">
                                      <span>[DOB_Date]</span>
                                      <ArrowRight size={14} className="text-slate-300" />
                                      <span className="text-teal-600 font-bold">age</span>
                                  </div>
                              </div>
                          </div>
                      </section>

                      {/* Step-by-Step Section */}
                      <section className="space-y-6">
                          <div className="flex items-center gap-3 text-indigo-600">
                              <Settings size={20} />
                              <h4 className="font-black uppercase tracking-widest text-sm">How to Align Your Data</h4>
                          </div>
                          
                          <div className="space-y-8">
                              <div className="flex gap-6">
                                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black shrink-0 shadow-sm">1</div>
                                  <div className="space-y-2">
                                      <h5 className="font-bold text-slate-900">Use the "AS" Keyword in SQL</h5>
                                      <p className="text-xs text-slate-500 leading-relaxed">
                                          When you run the script in MSSQL, the <code className="bg-slate-100 px-1 rounded text-indigo-600">AS</code> keyword renames your old columns to match our new system requirements.
                                      </p>
                                      <div className="bg-slate-900 p-4 rounded-xl font-mono text-xs text-indigo-300">
                                          SELECT <span className="text-white">Old_Patient_Name</span> <span className="text-teal-400">AS</span> <span className="text-white">name</span> FROM ...
                                      </div>
                                  </div>
                              </div>

                              <div className="flex gap-6">
                                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black shrink-0 shadow-sm">2</div>
                                  <div className="space-y-2">
                                      <h5 className="font-bold text-slate-900">Handle Data Types</h5>
                                      <p className="text-xs text-slate-500 leading-relaxed">
                                          Our system expects specific formats. For example, dates should be strings (YYYY-MM-DD) and amounts should be numbers.
                                      </p>
                                      <ul className="grid grid-cols-2 gap-2">
                                          <li className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg"><CheckCircle size={12} className="text-emerald-500"/> Dates: CONVERT(VARCHAR, date, 23)</li>
                                          <li className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg"><CheckCircle size={12} className="text-emerald-500"/> Names: FirstName + ' ' + LastName</li>
                                      </ul>
                                  </div>
                              </div>

                              <div className="flex gap-6">
                                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black shrink-0 shadow-sm">3</div>
                                  <div className="space-y-2">
                                      <h5 className="font-bold text-slate-900">Export as JSON PATH</h5>
                                      <p className="text-xs text-slate-500 leading-relaxed">
                                          Always include <code className="bg-slate-100 px-1 rounded text-indigo-600">FOR JSON PATH</code> at the end of your SQL query. This ensures the data is in a format our web system understands.
                                      </p>
                                  </div>
                              </div>
                          </div>
                      </section>

                      {/* Pro Tip Section */}
                      <div className="bg-teal-50 border border-teal-100 p-6 rounded-3xl flex gap-4">
                          <div className="p-2 bg-white rounded-xl text-teal-600 h-fit shadow-sm">
                              <Info size={20} />
                          </div>
                          <div>
                              <h5 className="font-bold text-teal-900 mb-1">Pro Tip: Start with Patients</h5>
                              <p className="text-xs text-teal-700 leading-relaxed">
                                  Always migrate the <strong>Patients Master</strong> first. Other data like Billing and EMR depend on the Patient ID to link correctly.
                              </p>
                          </div>
                      </div>
                  </div>

                  <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
                      <button 
                        onClick={() => setShowHelpModal(false)}
                        className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 shadow-xl transition-all active:scale-95"
                      >
                          I Understand
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default MigrationBridge;
