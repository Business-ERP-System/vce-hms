
import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Surgery, Patient } from '../types';
import { 
    Scissors, Clock, User, Calendar, CheckCircle, Activity, Plus, 
    X, Save, Search, Monitor, MoreVertical, Trash2, Edit, AlertCircle,
    ChevronRight, MapPin, Stethoscope, Briefcase, LayoutGrid, List,
    // Fixed: DoneAll is not exported from lucide-react, replaced with CheckCheck
    Settings, PlayCircle, CheckCheck, RotateCcw
} from 'lucide-react';

const OT = () => {
  const { surgeries, addSurgery, updateSurgery, deleteSurgery, patients, employees, hasPermission } = useData();
  
  // View/Filter States
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  // Form States
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [editingSurgery, setEditingSurgery] = useState<Surgery | null>(null);
  const [formData, setFormData] = useState<Partial<Surgery>>({
      procedure: 'Phacoemulsification + IOL', 
      surgeon: '', 
      theater: 'OT-1', 
      date: new Date().toISOString().split('T')[0],
      time: '09:00 AM', 
      status: 'Scheduled'
  });

  // Permission Checks
  const canAdd = hasPermission('OT & Surgeries', 'add');
  const canEdit = hasPermission('OT & Surgeries', 'edit');
  const canDelete = hasPermission('OT & Surgeries', 'delete');

  const theaters = ['OT-1 (Main)', 'OT-2 (Lasik)', 'OT-3 (Minor)'];
  const surgicalProcedures = [
      'Phacoemulsification + IOL', 
      'Lasik Vision Correction', 
      'Pterygium Excision', 
      'DCR (Dacryocystorhinostomy)', 
      'Trabeculectomy', 
      'Vitrectomy',
      'Squint Correction',
      'Evisceration'
  ];
  
  // Use employees from context for surgeons
  const surgeons = employees.filter(e => e.role.toLowerCase().includes('doctor') || e.role.toLowerCase().includes('ophthalmologist'));

  const handleOpenModal = (surg: Surgery | null = null) => {
      if (!canAdd && !surg) return;
      if (!canEdit && surg) return;

      if (surg) {
          setEditingSurgery(surg);
          const p = patients.find(pat => pat.id === surg.patientId);
          setSelectedPatient(p || null);
          setFormData(surg);
      } else {
          setEditingSurgery(null);
          setSelectedPatient(null);
          setFormData({ 
            procedure: 'Phacoemulsification + IOL', 
            surgeon: surgeons[0]?.name || '', 
            theater: 'OT-1', 
            date: new Date().toISOString().split('T')[0], 
            time: '09:00 AM', 
            status: 'Scheduled' 
          });
      }
      setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedPatient) return alert("Please select a patient from the list.");
      if (!formData.surgeon) return alert("Please assign a lead surgeon.");

      const submission: Surgery = {
          id: editingSurgery?.id || `SURG-${Date.now().toString().slice(-6)}`,
          patientId: selectedPatient.id,
          patientName: selectedPatient.name,
          procedure: formData.procedure!,
          surgeon: formData.surgeon!,
          theater: formData.theater!,
          date: formData.date!,
          time: formData.time!,
          status: formData.status as any || 'Scheduled'
      };

      if (editingSurgery) updateSurgery(editingSurgery.id, submission);
      else addSurgery(submission);
      
      setShowModal(false);
  };

  const updateSurgeryStatus = (id: string, status: Surgery['status']) => {
      if (!canEdit) return;
      updateSurgery(id, { status });
  };

  const filteredSurgeries = surgeries.filter(s => 
    (s.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || s.procedure.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterStatus === 'All' || s.status === filterStatus)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-tighter flex items-center gap-3">
               <Scissors className="text-teal-600" /> Surgical Operations Hub
           </h1>
           <p className="text-sm text-slate-500">Scheduled ophthalmic procedures and real-time theater tracking.</p>
        </div>
        <div className="flex items-center gap-2">
            <div className="bg-white border border-slate-200 p-1 rounded-xl flex gap-1 shadow-sm">
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-teal-50 text-teal-700' : 'text-slate-400 hover:text-slate-600'}`}><List size={18} /></button>
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-teal-50 text-teal-700' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={18} /></button>
            </div>
            {canAdd && (
                <button onClick={() => handleOpenModal()} className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold shadow-lg shadow-teal-100 transition-all active:scale-95">
                    <Plus size={18} /> Schedule New Case
                </button>
            )}
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="relative flex-1 w-full max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500 transition-all" 
                    placeholder="Search by patient or procedure..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                  />
              </div>
              <div className="flex gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-inner overflow-x-auto w-full md:w-auto">
                  {['All', 'Scheduled', 'In Progress', 'Recovery', 'Completed'].map(s => (
                      <button 
                        key={s} 
                        onClick={() => setFilterStatus(s)} 
                        className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterStatus === s ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                      >
                        {s}
                      </button>
                  ))}
              </div>
          </div>
          
          {/* Content Views */}
          {viewMode === 'list' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-400 font-black uppercase text-xs tracking-widest border-b border-slate-100">
                      <tr>
                          <th className="px-8 py-5">Surgical Procedure</th>
                          <th className="px-8 py-5">Operating Surgeon</th>
                          <th className="px-8 py-5">Time & Theater</th>
                          <th className="px-8 py-5">Workflow Stage</th>
                          <th className="px-8 py-5 text-right">Action Panel</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {filteredSurgeries.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                              <td className="px-8 py-5">
                                  <div className="font-black text-slate-900 leading-tight group-hover:text-teal-700 transition-colors">{s.procedure}</div>
                                  <div className="text-xs font-bold text-slate-400 uppercase mt-1 flex items-center gap-1">
                                      <User size={10} /> {s.patientName} <span className="text-slate-300 font-mono">({s.patientId})</span>
                                  </div>
                              </td>
                              <td className="px-8 py-5">
                                  <div className="flex items-center gap-2 font-bold text-slate-700">
                                      <div className="w-6 h-6 rounded bg-teal-500 text-white flex items-center justify-center text-xs font-black">DR</div>
                                      {s.surgeon}
                                  </div>
                              </td>
                              <td className="px-8 py-5">
                                  <div className="flex items-center gap-2 text-slate-500 font-bold">
                                      <Clock size={14} className="text-teal-500"/> {s.time}
                                  </div>
                                  <div className="text-xs font-black text-slate-400 uppercase mt-0.5 flex items-center gap-1">
                                      <MapPin size={10}/> {s.theater}
                                  </div>
                              </td>
                              <td className="px-8 py-5">
                                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase border flex items-center gap-1.5 w-fit ${
                                      s.status === 'In Progress' ? 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse' :
                                      s.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                      s.status === 'Recovery' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                      'bg-slate-50 text-slate-600 border-slate-100'
                                  }`}>
                                      {s.status === 'In Progress' && <Activity size={10} />}
                                      {s.status === 'Completed' && <CheckCircle size={10} />}
                                      {s.status}
                                  </span>
                              </td>
                              <td className="px-8 py-5 text-right">
                                  <div className="flex justify-end gap-2">
                                      {s.status === 'Scheduled' && (
                                          <button 
                                            onClick={() => updateSurgeryStatus(s.id, 'In Progress')}
                                            className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-sm"
                                            title="Start Procedure"
                                          >
                                              <PlayCircle size={16} />
                                          </button>
                                      )}
                                      {s.status === 'In Progress' && (
                                          <button 
                                            onClick={() => updateSurgeryStatus(s.id, 'Recovery')}
                                            className="p-2 bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white rounded-xl transition-all shadow-sm"
                                            title="Move to Recovery"
                                          >
                                              <Activity size={16} />
                                          </button>
                                      )}
                                      {s.status === 'Recovery' && (
                                          <button 
                                            onClick={() => updateSurgeryStatus(s.id, 'Completed')}
                                            className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm"
                                            title="Mark as Completed"
                                          >
                                              {/* Fixed: Replaced DoneAll with CheckCheck */}
                                              <CheckCheck size={16} />
                                          </button>
                                      )}
                                      <div className="w-px h-8 bg-slate-100 mx-1"></div>
                                      <button onClick={() => handleOpenModal(s)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Edit Case"><Edit size={16} /></button>
                                      {canDelete && (
                                          <button onClick={() => { if(confirm("Cancel and delete this surgical entry?")) deleteSurgery(s.id); }} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Delete Case"><Trash2 size={16} /></button>
                                      )}
                                  </div>
                              </td>
                          </tr>
                      ))}
                      {filteredSurgeries.length === 0 && (
                          <tr><td colSpan={5} className="px-8 py-20 text-center text-slate-400 italic font-medium">No surgeries match your current filters.</td></tr>
                      )}
                  </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredSurgeries.map((s) => (
                    <div key={s.id} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-2 h-full ${
                            s.status === 'In Progress' ? 'bg-rose-500 animate-pulse' :
                            s.status === 'Completed' ? 'bg-emerald-500' :
                            s.status === 'Recovery' ? 'bg-amber-500' :
                            'bg-slate-200'
                        }`}></div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-slate-50 text-teal-600 rounded-2xl group-hover:bg-teal-600 group-hover:text-white transition-all"><Scissors size={20}/></div>
                            <span className="text-xs font-black text-slate-300 font-mono">#{s.id.split('-').pop()}</span>
                        </div>
                        <h3 className="font-black text-slate-900 mb-1 leading-tight">{s.procedure}</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mb-4">{s.patientName}</p>
                        
                        <div className="space-y-2 border-t border-slate-50 pt-4">
                            <div className="flex items-center justify-between text-xs font-bold">
                                <span className="text-slate-400 uppercase">Theater</span>
                                <span className="text-slate-700">{s.theater}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-bold">
                                <span className="text-slate-400 uppercase">Surgeon</span>
                                <span className="text-slate-700">{s.surgeon}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-bold">
                                <span className="text-slate-400 uppercase">Schedule</span>
                                <span className="text-teal-600">{s.time}</span>
                            </div>
                        </div>

                        <button 
                            onClick={() => handleOpenModal(s)}
                            className="w-full mt-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0"
                        >
                            Manage Case
                        </button>
                    </div>
                ))}
                {canAdd && (
                    <div 
                        onClick={() => handleOpenModal()}
                        className="border-2 border-dashed border-slate-100 rounded-3xl p-6 flex flex-col items-center justify-center text-slate-300 hover:border-teal-500 hover:text-teal-500 transition-all cursor-pointer group"
                    >
                        <div className="p-4 bg-slate-50 rounded-full mb-3 group-hover:bg-teal-50"><Plus size={32}/></div>
                        <span className="text-xs font-black uppercase tracking-widest">Plan Surgery</span>
                    </div>
                )}
            </div>
          )}
      </div>

      {/* Stats Summary Sidebar or Bottom Row could go here */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
              { label: 'Today\'s Total', value: surgeries.length, icon: Calendar, color: 'bg-blue-50 text-blue-600' },
              { label: 'Active In OT', value: surgeries.filter(s=>s.status==='In Progress').length, icon: Activity, color: 'bg-rose-50 text-rose-600' },
              { label: 'Post-Op Recovery', value: surgeries.filter(s=>s.status==='Recovery').length, icon: RotateCcw, color: 'bg-amber-50 text-amber-600' },
              // Fixed: Replaced DoneAll with CheckCheck
              { label: 'Completed Cases', value: surgeries.filter(s=>s.status==='Completed').length, icon: CheckCheck, color: 'bg-emerald-50 text-emerald-600' },
          ].map((stat, i) => (
              <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                  <div>
                      <p className="text-xs font-black uppercase text-slate-400 tracking-widest">{stat.label}</p>
                      <h3 className="text-2xl font-black text-slate-900 mt-1">{stat.value}</h3>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.color}`}><stat.icon size={20}/></div>
              </div>
          ))}
      </div>

      {/* Booking Modal */}
      {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
                  <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                      <div className="flex items-center gap-3">
                          <Scissors size={20} className="text-teal-400" />
                          <h3 className="font-bold text-lg">{editingSurgery ? 'Modify Surgical Entry' : 'Plan New Surgical Session'}</h3>
                      </div>
                      <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-all"><X size={20}/></button>
                  </div>
                  <form onSubmit={handleSubmit} className="p-8 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1">
                              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Select Patient Profile *</label>
                              <select 
                                required 
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-teal-500 outline-none" 
                                value={selectedPatient?.id} 
                                onChange={e=>setSelectedPatient(patients.find(p=>p.id===e.target.value)||null)}
                              >
                                  <option value="">-- Search Registry --</option>
                                  {patients.map(p=><option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
                              </select>
                          </div>
                          <div className="space-y-1">
                              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Procedural Code *</label>
                              <select 
                                required 
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-teal-500 outline-none" 
                                value={formData.procedure} 
                                onChange={e=>setFormData({...formData, procedure:e.target.value})}
                              >
                                  {surgicalProcedures.map(p=><option key={p} value={p}>{p}</option>)}
                              </select>
                          </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1">
                              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Operating Lead Surgeon *</label>
                              <select 
                                required 
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-teal-500 outline-none" 
                                value={formData.surgeon} 
                                onChange={e=>setFormData({...formData, surgeon:e.target.value})}
                              >
                                  <option value="">-- Assign Specialist --</option>
                                  {surgeons.map(s=><option key={s.id} value={s.name}>{s.name} ({s.department})</option>)}
                              </select>
                          </div>
                          <div className="space-y-1">
                              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Assigned OT Theater</label>
                              <select 
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-teal-500 outline-none" 
                                value={formData.theater} 
                                onChange={e=>setFormData({...formData, theater:e.target.value})}
                              >
                                  {theaters.map(t=><option key={t} value={t.split(' ')[0]}>{t}</option>)}
                              </select>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Date of Session</label>
                              <input 
                                required 
                                type="date" 
                                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-black focus:ring-2 focus:ring-teal-500 outline-none" 
                                value={formData.date} 
                                onChange={e=>setFormData({...formData, date:e.target.value})} 
                              />
                          </div>
                          <div>
                              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Start Time</label>
                              <input 
                                required 
                                type="time" 
                                className="w-full p-3 border border-slate-200 rounded-xl font-black text-sm focus:ring-2 focus:ring-teal-500 outline-none" 
                                value={formData.time} 
                                onChange={e=>setFormData({...formData, time:e.target.value})} 
                              />
                          </div>
                          <div>
                              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Initial Status</label>
                              <select 
                                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-black focus:ring-2 focus:ring-teal-500 outline-none" 
                                value={formData.status} 
                                onChange={e=>setFormData({...formData, status:e.target.value as any})}
                              >
                                  <option>Scheduled</option>
                                  <option>In Progress</option>
                                  <option>Recovery</option>
                                  <option>Completed</option>
                              </select>
                          </div>
                      </div>
                      
                      <button 
                        type="submit" 
                        className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-teal-700 shadow-xl shadow-teal-900/20 transition-all active:scale-95"
                      >
                          {editingSurgery ? 'Confirm Procedural Updates' : 'Deploy OT Schedule Entry'}
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default OT;
