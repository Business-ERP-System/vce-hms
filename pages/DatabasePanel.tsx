
import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { DatabaseInstance, SavedQuery } from '../types';
import { 
    Database, Server, Plus, Edit, Trash2, CheckCircle, 
    Search, ShieldCheck, Activity, Terminal, Save, X, 
    Code, Copy, Table as TableIcon, PlayCircle, Lock, 
    Unlock, Key, ChevronRight, Download, Filter, FileJson, 
    Monitor, Layout, Settings, Wand2, Hash, Eye // Added Eye icon
} from 'lucide-react';
import { FULL_SQL_SCHEMA } from '../services/databaseService';

const DatabasePanel = () => {
  const data = useData();
  const { 
    databases, savedQueries, addDatabase, updateDatabase, deleteDatabase, 
    saveSqlQuery, deleteSqlQuery, formatCurrency 
  } = data;

  const [activeTab, setActiveTab] = useState<'instances' | 'lab' | 'vault' | 'schema'>('instances');
  const [sqlInput, setSqlInput] = useState('SELECT * FROM Patients WHERE Status = \'OPD\'');
  const [queryResult, setQueryResult] = useState<any[] | null>(null);
  const [executionLog, setExecutionLog] = useState<string[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  
  const [showDbModal, setShowDbModal] = useState(false);
  const [editingDb, setEditingDb] = useState<DatabaseInstance | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [queryToSave, setQueryToSave] = useState<Partial<SavedQuery>>({ title: '', category: 'Report', isLocked: false });
  
  const [unlockId, setUnlockId] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState('');

  // SQL "Engine" Simulation logic
  const executeSql = () => {
      setIsExecuting(true);
      setExecutionLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Executing: ${sqlInput}`]);
      
      setTimeout(() => {
          const upperSql = sqlInput.toUpperCase();
          let result: any[] = [];
          
          try {
            if (upperSql.includes('FROM PATIENTS')) result = data.patients;
            else if (upperSql.includes('FROM INVENTORY')) result = data.inventory;
            else if (upperSql.includes('FROM INVOICES')) result = data.invoices;
            else if (upperSql.includes('FROM EMPLOYEES')) result = data.employees;
            else if (upperSql.includes('FROM FINANCE')) result = data.finance;
            else if (upperSql.includes('FROM BEDS')) result = data.beds;
            else throw new Error("Object not found in local mock environment.");

            // Simple mock filter
            if (upperSql.includes('WHERE')) {
                const parts = upperSql.split('WHERE')[1].split('=');
                if (parts.length === 2) {
                    const key = parts[0].trim().toLowerCase();
                    const val = parts[1].trim().replace(/'/g, '');
                    result = result.filter(item => String(item[key]).toUpperCase() === val.toUpperCase());
                }
            }

            setQueryResult(result);
            setExecutionLog(prev => [...prev, `[SUCCESS] Query returned ${result.length} rows.`]);
          } catch (err: any) {
            setExecutionLog(prev => [...prev, `[ERROR] ${err.message}`]);
            setQueryResult(null);
          }
          setIsExecuting(false);
      }, 600);
  };

  const handleSaveQuery = (e: React.FormEvent) => {
      e.preventDefault();
      saveSqlQuery({
          ...queryToSave,
          id: `Q-${Date.now()}`,
          sql: sqlInput,
          createdAt: new Date().toISOString()
      } as SavedQuery);
      setShowSaveModal(false);
  };

  const openSavedQuery = (q: SavedQuery) => {
      if (q.isLocked) {
          setUnlockId(q.id);
          setPasswordInput('');
      } else {
          setSqlInput(q.sql);
          setActiveTab('lab');
      }
  };

  const verifyPassword = () => {
      const q = savedQueries.find(x => x.id === unlockId);
      if (q && q.password === passwordInput) {
          setSqlInput(q.sql);
          setActiveTab('lab');
          setUnlockId(null);
      } else {
          alert("Invalid Security Key.");
      }
  };

  const resultColumns = useMemo(() => {
      if (!queryResult || queryResult.length === 0) return [];
      return Object.keys(queryResult[0]);
  }, [queryResult]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
               <Database className="text-indigo-600" /> System Control Engine
           </h1>
           <p className="text-sm text-slate-500">SuperAdmin T-SQL Lab & Dynamic UI Configuration</p>
        </div>
        <div className="flex gap-2">
            {activeTab === 'lab' && (
                <button onClick={() => setShowSaveModal(true)} className="bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-slate-50 shadow-sm transition-all">
                    <Save size={18} /> Save Logic
                </button>
            )}
            <button onClick={() => { setEditingDb(null); setShowDbModal(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95">
                <Plus size={18} /> New DB Connection
            </button>
        </div>
      </div>

      <div className="flex bg-white p-1 rounded-2xl border border-slate-200 w-fit shadow-sm overflow-x-auto max-w-full">
             <button onClick={() => setActiveTab('instances')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'instances' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>SQL Instances</button>
             <button onClick={() => setActiveTab('lab')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'lab' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>SQL Query Lab</button>
             <button onClick={() => setActiveTab('vault')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'vault' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Logic Vault</button>
             <button onClick={() => setActiveTab('schema')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'schema' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Deployment Script</button>
      </div>

      {activeTab === 'instances' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {databases.map((db) => (
                <div key={db.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all group">
                    <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500 rounded-lg shadow-lg"><Server size={20}/></div>
                            <h3 className="font-bold">{db.name}</h3>
                        </div>
                        <span className={`text-xs font-black uppercase px-2 py-1 rounded-full ${db.status === 'Connected' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {db.status}
                        </span>
                    </div>
                    <div className="p-6 space-y-4 text-xs">
                        <div className="grid grid-cols-2 gap-4">
                            <div><p className="text-slate-400 font-bold uppercase mb-0.5 tracking-tighter">Host</p><p className="font-mono text-slate-800 font-bold">{db.host}</p></div>
                            <div><p className="text-slate-400 font-bold uppercase mb-0.5 tracking-tighter">Port</p><p className="font-mono text-slate-800 font-bold">{db.port}</p></div>
                        </div>
                        <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400 font-bold">
                            <span className="flex items-center gap-1"><Activity size={10}/> Last Sync: {new Date(db.lastSync).toLocaleTimeString()}</span>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditingDb(db); setShowDbModal(true); }} className="p-1.5 bg-slate-100 rounded-lg text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all"><Edit size={14}/></button>
                                <button onClick={() => deleteDatabase(db.id)} className="p-1.5 bg-slate-100 rounded-lg text-rose-600 hover:bg-rose-600 hover:text-white transition-all"><Trash2 size={14}/></button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
            <div onClick={() => setShowDbModal(true)} className="border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center p-8 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-all cursor-pointer group h-full min-h-[180px]">
                <Plus size={32} className="mb-2 group-hover:scale-110 transition-transform"/>
                <p className="font-black text-xs uppercase tracking-widest text-center leading-relaxed px-4">Link New SQL Engine Instance</p>
            </div>
        </div>
      )}

      {activeTab === 'lab' && (
          <div className="flex flex-col h-[800px] gap-6 animate-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                  {/* Editor Side */}
                  <div className="lg:col-span-2 flex flex-col bg-slate-900 rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
                      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-800/50">
                          <div className="flex items-center gap-3">
                              <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg"><Code size={18}/></div>
                              <span className="text-white font-bold text-sm">Query Lab v2.0 (T-SQL)</span>
                          </div>
                          <button 
                            onClick={executeSql}
                            disabled={isExecuting}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-900/40 transition-all active:scale-95 disabled:opacity-50"
                          >
                              {isExecuting ? <Activity className="animate-spin" size={16}/> : <PlayCircle size={16}/>}
                              Execute Query
                          </button>
                      </div>
                      <div className="flex-1 relative font-mono text-sm leading-relaxed p-4 flex gap-4">
                          <div className="w-8 text-right text-slate-600 select-none border-r border-white/5 pr-4 flex flex-col pt-1">
                              {[...Array(20)].map((_, i) => <div key={i}>{i+1}</div>)}
                          </div>
                          <textarea 
                            className="flex-1 bg-transparent border-none outline-none text-indigo-300 resize-none custom-scrollbar placeholder:text-slate-700"
                            spellCheck={false}
                            value={sqlInput}
                            onChange={(e) => setSqlInput(e.target.value)}
                            placeholder="-- Write your SQL query here..."
                          />
                      </div>
                      {/* Console Output */}
                      <div className="h-40 border-t border-white/10 bg-black/50 p-4 overflow-y-auto custom-scrollbar">
                           <div className="flex items-center gap-2 mb-2 text-xs font-black text-slate-500 uppercase tracking-widest"><Terminal size={12}/> Console Output</div>
                           {executionLog.map((log, i) => (
                               <div key={i} className={`text-xs font-mono mb-1 ${log.includes('ERROR') ? 'text-rose-400' : log.includes('SUCCESS') ? 'text-emerald-400' : 'text-slate-400'}`}>
                                   {log}
                               </div>
                           ))}
                           {executionLog.length === 0 && <div className="text-xs font-mono text-slate-700">Ready to execute. Select objects from right-pane schema for quick input.</div>}
                      </div>
                  </div>

                  {/* Schema Browser Side */}
                  <div className="lg:col-span-1 bg-white rounded-3xl shadow-sm border border-slate-100 p-6 overflow-y-auto custom-scrollbar flex flex-col">
                      <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tighter">
                          <Layout size={18} className="text-teal-600" /> Object Browser
                      </h3>
                      <div className="space-y-6">
                           {[
                               { group: 'Tables', icon: TableIcon, items: ['Patients', 'Inventory', 'Invoices', 'Employees', 'Finance', 'Beds'] },
                               { group: 'Stored Procs', icon: PlayCircle, items: ['sp_GetRoomLoad', 'sp_UpdateStock', 'sp_DailyRevenue'] },
                               { group: 'Views', icon: Eye, items: ['v_ActiveOPD', 'v_PendingLabs', 'v_FinanceSummary'] }
                           ].map((obj, idx) => (
                               <div key={idx}>
                                   <div className="flex items-center gap-2 mb-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                                       <obj.icon size={12}/> {obj.group}
                                   </div>
                                   <div className="space-y-1">
                                       {obj.items.map(item => (
                                           <button 
                                                key={item}
                                                onClick={() => setSqlInput(`SELECT * FROM ${item}`)}
                                                className="w-full text-left px-3 py-2 text-xs text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors flex items-center justify-between group"
                                           >
                                               {item}
                                               <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                                           </button>
                                       ))}
                                   </div>
                               </div>
                           ))}
                      </div>
                  </div>
              </div>

              {/* Crystal View Result Grid */}
              <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col h-[500px] shrink-0">
                  <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl"><Wand2 size={20}/></div>
                          <div>
                            <h3 className="font-bold text-slate-900 leading-tight">Crystal View™ Result Engine</h3>
                            <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Virtualized Dynamic Column Grid</p>
                          </div>
                      </div>
                      {queryResult && (
                          <div className="flex gap-2">
                              <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 shadow-sm" title="Export Result"><Download size={16}/></button>
                              <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 shadow-sm" title="Print Grid"><Download size={16}/></button>
                          </div>
                      )}
                  </div>
                  <div className="flex-1 overflow-auto custom-scrollbar">
                      {queryResult ? (
                          <table className="w-full text-xs text-left border-collapse min-w-max">
                              <thead className="sticky top-0 z-10 bg-slate-900 text-white font-black uppercase tracking-tighter">
                                  <tr>
                                      <th className="px-4 py-3 border-r border-white/5 w-10 text-center">#</th>
                                      {resultColumns.map(col => (
                                          <th key={col} className="px-6 py-4 border-r border-white/5">{col.replace(/([A-Z])/g, ' $1').trim()}</th>
                                      ))}
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                  {queryResult.map((row, i) => (
                                      <tr key={i} className="hover:bg-indigo-50/30 transition-colors group">
                                          <td className="px-4 py-3 text-center text-slate-400 bg-slate-50 font-bold">{i + 1}</td>
                                          {resultColumns.map(col => {
                                              const val = row[col];
                                              const isCurrency = typeof val === 'number' && (col.toLowerCase().includes('price') || col.toLowerCase().includes('amount'));
                                              return (
                                                  <td key={col} className={`px-6 py-4 font-medium border-r border-slate-50 ${isCurrency ? 'text-emerald-700 font-bold' : 'text-slate-700'}`}>
                                                      {isCurrency ? formatCurrency(val) : String(val)}
                                                  </td>
                                              );
                                          })}
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      ) : (
                          <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 opacity-50">
                              <Terminal size={48} />
                              <p className="font-bold text-sm uppercase tracking-widest">Execute a query to see crystal grid results</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'vault' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-left-4 duration-300">
              {savedQueries.map(q => (
                  <div key={q.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col group hover:shadow-xl transition-all">
                      <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                          <div className="flex gap-4">
                            <div className={`p-3 rounded-2xl ${q.isLocked ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                {q.isLocked ? <Lock size={20}/> : <Unlock size={20}/>}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{q.title}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-black uppercase text-slate-400 tracking-widest">{q.category}</span>
                                    <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                                    <span className="text-xs font-mono text-slate-400">Deployed {new Date(q.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                          </div>
                          <button onClick={() => deleteSqlQuery(q.id)} className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                      </div>
                      <div className="p-6 flex-1 bg-slate-50/30">
                          <div className="bg-slate-900 rounded-2xl p-4 h-24 overflow-hidden relative border border-white/5">
                              {q.isLocked && <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center text-amber-500 gap-2 font-black text-xs uppercase tracking-widest"><Lock size={12}/> Security Active</div>}
                              <code className="text-xs text-indigo-400 font-mono break-all">{q.sql}</code>
                          </div>
                      </div>
                      <div className="p-4 border-t border-slate-100 bg-white">
                          <button 
                            onClick={() => openSavedQuery(q)}
                            className="w-full py-3 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
                          >
                              {q.isLocked ? <Key size={14}/> : <PlayCircle size={14}/>}
                              {q.isLocked ? 'Verify Key & Open' : 'Open in Lab'}
                          </button>
                      </div>
                  </div>
              ))}
          </div>
      )}

      {activeTab === 'schema' && (
          <div className="bg-slate-900 rounded-3xl shadow-2xl border border-white/5 overflow-hidden flex flex-col h-[700px]">
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-800">
                  <div className="flex items-center gap-4">
                      <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30"><Code size={20}/></div>
                      <div>
                          <h3 className="text-white font-bold">SQL Server Deployment Script</h3>
                          <p className="text-xs text-slate-400 font-black uppercase tracking-widest mt-0.5">Automated T-SQL Schema Provisioning</p>
                      </div>
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(FULL_SQL_SCHEMA); alert("Copied to SSMS clipboard."); }} className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-900/40 transition-all"><Copy size={16}/> Copy Script</button>
              </div>
              <div className="flex-1 overflow-auto p-8 custom-scrollbar">
                  <pre className="font-mono text-sm leading-relaxed text-indigo-300 whitespace-pre">
                      {FULL_SQL_SCHEMA}
                  </pre>
              </div>
          </div>
      )}

      {/* Save Query Modal */}
      {showSaveModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                  <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                      <h3 className="font-bold text-lg">Save System Logic</h3>
                      <button onClick={() => setShowSaveModal(false)}><X/></button>
                  </div>
                  <form onSubmit={handleSaveQuery} className="p-8 space-y-6">
                      <div>
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Query Title / Purpose</label>
                          <input required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none" value={queryToSave.title} onChange={e=>setQueryToSave({...queryToSave, title: e.target.value})} placeholder="e.g. Monthly Cataract Revenue" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Category</label>
                            <select className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-sm" value={queryToSave.category} onChange={e=>setQueryToSave({...queryToSave, category: e.target.value as any})}>
                                <option>Report</option><option>Utility</option><option>Module-Logic</option>
                            </select>
                          </div>
                          <div className="flex flex-col">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-3">Security</label>
                            <button type="button" onClick={()=>setQueryToSave({...queryToSave, isLocked: !queryToSave.isLocked})} className={`w-full p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all ${queryToSave.isLocked ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-inner' : 'bg-white border-slate-200 text-slate-500'}`}>
                                {queryToSave.isLocked ? <Lock size={14}/> : <Unlock size={14}/>} {queryToSave.isLocked ? 'PASSWORD PROTECT' : 'UNSECURED'}
                            </button>
                          </div>
                      </div>
                      {queryToSave.isLocked && (
                          <div className="animate-in slide-in-from-top-2">
                             <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Set Security Key</label>
                             <div className="relative">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                                <input required type="password" className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl font-mono text-sm outline-none" value={queryToSave.password} onChange={e=>setQueryToSave({...queryToSave, password: e.target.value})} placeholder="••••••••" />
                             </div>
                          </div>
                      )}
                      <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 shadow-xl transition-all">Save to System Vault</button>
                  </form>
              </div>
          </div>
      )}

      {/* Unlock Password Modal */}
      {unlockId && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-sm p-8 text-center flex flex-col items-center">
                  <div className="p-4 bg-amber-50 text-amber-600 rounded-full mb-4 animate-bounce"><Lock size={32}/></div>
                  <h3 className="font-bold text-xl text-slate-900 mb-2">Vault Security Access</h3>
                  <p className="text-sm text-slate-500 mb-6">Enter the Security Key assigned to this logic block to reveal and execute.</p>
                  <input autoFocus type="password" className="w-full p-4 border border-slate-200 rounded-2xl text-center font-black tracking-[0.5em] text-lg focus:ring-2 focus:ring-amber-500 outline-none mb-4" value={passwordInput} onChange={e=>setPasswordInput(e.target.value)} onKeyDown={e=>e.key === 'Enter' && verifyPassword()} placeholder="••••" />
                  <div className="flex gap-2 w-full">
                      <button onClick={() => setUnlockId(null)} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-500">Cancel</button>
                      <button onClick={verifyPassword} className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-all">Unlock</button>
                  </div>
              </div>
          </div>
      )}

      {/* Database Connection Modal */}
      {showDbModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden">
                  <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                      <div className="flex items-center gap-3">
                          <Database size={20}/>
                          <h3 className="font-bold text-lg">SQL Cluster Node Configuration</h3>
                      </div>
                      <button onClick={() => setShowDbModal(false)}><X/></button>
                  </div>
                  <form className="p-8 space-y-6">
                      <div className="space-y-2">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Instance Label</label>
                          <input required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none" placeholder="e.g. CLINICAL_RECORDS_SERVER" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                             <label className="text-xs font-black text-slate-400 uppercase tracking-widest">IP / Host</label>
                             <input required className="w-full p-3 border border-slate-200 rounded-xl font-mono text-sm" placeholder="127.0.0.1" />
                         </div>
                         <div className="space-y-2">
                             <label className="text-xs font-black text-slate-400 uppercase tracking-widest">TCP Port</label>
                             <input required className="w-full p-3 border border-slate-200 rounded-xl font-mono text-sm" placeholder="1433" />
                         </div>
                      </div>
                      <button type="button" onClick={() => setShowDbModal(false)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 shadow-xl transition-all">Deploy Connection Profile</button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default DatabasePanel;
