import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Calendar, Clock, User, CheckCircle, XCircle, MoreVertical, ChevronLeft, ChevronRight, Plus, Grid, List, X, Save, Download } from 'lucide-react';
import { Appointment } from '../types';
import { MOCK_EMPLOYEES } from '../constants';

const Appointments = () => {
  const { appointments, patients, addAppointment, updateAppointment } = useData();
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'tiles'>('calendar');
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month'>('week');
  
  // New Appointment Modal State
  const [showModal, setShowModal] = useState(false);
  const [newAppt, setNewAppt] = useState<{patientId: string, doctorName: string, date: string, time: string, type: string}>({
      patientId: '', doctorName: '', date: new Date().toISOString().split('T')[0], time: '09:00', type: 'Consultation'
  });

  // Helpers
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const timeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
  
  const doctors = MOCK_EMPLOYEES.filter(e => e.role === 'Doctor' || e.role === 'Chief Ophthalmologist');

  const handleCreate = (e: React.FormEvent) => {
      e.preventDefault();
      const patient = patients.find(p => p.id === newAppt.patientId);
      if(!patient) return alert("Please select a patient");

      const appt: Appointment = {
          id: `APT-${Date.now()}`,
          patientId: patient.id,
          patientName: patient.name,
          doctorName: newAppt.doctorName,
          date: newAppt.date,
          time: newAppt.time,
          type: newAppt.type as any,
          status: 'Scheduled'
      };
      addAppointment(appt);
      setShowModal(false);
      setNewAppt({ patientId: '', doctorName: '', date: new Date().toISOString().split('T')[0], time: '09:00', type: 'Consultation' });
  };

  const handleStatusChange = (id: string, status: Appointment['status']) => {
    updateAppointment(id, { status });
  };

  const handleExport = () => {
      const csv = [
          ['ID', 'Patient', 'Doctor', 'Date', 'Time', 'Type', 'Status'],
          ...appointments.map(a => [a.id, a.patientName, a.doctorName, a.date, a.time, a.type, a.status])
      ].map(e => e.join(',')).join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'appointments.csv';
      a.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-900">Appointment Scheduling</h1>
            <p className="text-sm text-slate-500">Manage doctor schedules and patient visits.</p>
        </div>
        <div className="flex gap-2">
            <button onClick={handleExport} className="bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2">
                <Download size={16} /> Export
            </button>
            <button onClick={() => setShowModal(true)} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm transition-colors">
                <Plus size={16} /> New Appointment
            </button>
        </div>
      </div>

      {/* View Switcher */}
      <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex gap-1">
              <button onClick={() => setViewMode('calendar')} className={`p-2 rounded-lg transition-colors ${viewMode === 'calendar' ? 'bg-slate-100 text-teal-700' : 'text-slate-400 hover:text-slate-600'}`} title="Calendar View"><Calendar size={18} /></button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-slate-100 text-teal-700' : 'text-slate-400 hover:text-slate-600'}`} title="List View"><List size={18} /></button>
              <button onClick={() => setViewMode('tiles')} className={`p-2 rounded-lg transition-colors ${viewMode === 'tiles' ? 'bg-slate-100 text-teal-700' : 'text-slate-400 hover:text-slate-600'}`} title="Tiles View"><Grid size={18} /></button>
          </div>
          {viewMode === 'calendar' && (
              <div className="flex bg-slate-100 rounded-lg p-1 text-xs font-bold">
                  <button onClick={() => setCalendarView('day')} className={`px-3 py-1 rounded ${calendarView === 'day' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Day</button>
                  <button onClick={() => setCalendarView('week')} className={`px-3 py-1 rounded ${calendarView === 'week' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Week</button>
                  <button onClick={() => setCalendarView('month')} className={`px-3 py-1 rounded ${calendarView === 'month' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Month</button>
              </div>
          )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Content Area based on View Mode */}
        <div className="xl:col-span-3 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col min-h-[600px]">
             
             {viewMode === 'calendar' && (
                 <div className="flex flex-col h-full">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <div className="flex items-center gap-4">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </h3>
                            <div className="flex gap-1">
                                <button className="p-1 hover:bg-slate-200 rounded"><ChevronLeft size={16} /></button>
                                <button className="p-1 hover:bg-slate-200 rounded"><ChevronRight size={16} /></button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Calendar Grid */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="grid grid-cols-8 border-b border-slate-100">
                            <div className="p-4 border-r border-slate-50 bg-slate-50"></div>
                            {weekDays.map(day => (
                                <div key={day} className="p-4 text-center font-medium text-slate-500 text-sm border-r border-slate-50 bg-slate-50">
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-8">
                            {/* Time Column */}
                            <div className="flex flex-col">
                                {timeSlots.map(time => (
                                    <div key={time} className="h-24 border-b border-r border-slate-100 p-2 text-xs text-slate-400 text-center bg-slate-50/30">
                                        {time}
                                    </div>
                                ))}
                            </div>
                            
                            {/* Days Columns */}
                            {weekDays.map((day, colIdx) => (
                                <div key={day} className="flex flex-col relative border-r border-slate-100">
                                    {timeSlots.map((time, rowIdx) => (
                                        <div key={time} className="h-24 border-b border-slate-50 relative hover:bg-slate-50/50 transition-colors p-1">
                                            {/* Mapping appointments visually */}
                                            {appointments
                                                .filter(a => a.time.startsWith(time.split(':')[0]) && a.status === 'Scheduled' && (colIdx % 3 === 0 ? true : false)) // Mock distribution
                                                .slice(0,1)
                                                .map(apt => (
                                                <div key={apt.id} className="bg-teal-100 border-l-4 border-teal-500 rounded p-1.5 text-xs cursor-pointer hover:shadow-md transition-shadow h-full overflow-hidden">
                                                    <div className="font-bold text-teal-900 truncate">{apt.patientName}</div>
                                                    <div className="text-teal-700 truncate">{apt.type}</div>
                                                    <div className="text-teal-600 mt-1">{apt.doctorName.split(' ').pop()}</div>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                 </div>
             )}

             {viewMode === 'list' && (
                 <div className="p-4 overflow-x-auto">
                     <table className="w-full text-sm text-left">
                         <thead className="bg-slate-50 text-slate-500 font-medium">
                             <tr>
                                 <th className="px-4 py-3">Date & Time</th>
                                 <th className="px-4 py-3">Patient</th>
                                 <th className="px-4 py-3">Doctor</th>
                                 <th className="px-4 py-3">Type</th>
                                 <th className="px-4 py-3">Status</th>
                                 <th className="px-4 py-3 text-right">Actions</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100">
                             {appointments.map(apt => (
                                 <tr key={apt.id} className="hover:bg-slate-50 group">
                                     <td className="px-4 py-3">
                                         <div className="font-medium text-slate-900">{apt.date}</div>
                                         <div className="text-xs text-slate-500">{apt.time}</div>
                                     </td>
                                     <td className="px-4 py-3 font-medium text-slate-800">{apt.patientName}</td>
                                     <td className="px-4 py-3 text-slate-600">{apt.doctorName}</td>
                                     <td className="px-4 py-3"><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold">{apt.type}</span></td>
                                     <td className="px-4 py-3">
                                         <span className={`px-2 py-1 rounded text-xs font-bold ${
                                           apt.status === 'Scheduled' ? 'bg-yellow-50 text-yellow-700' : 
                                           apt.status === 'Completed' ? 'bg-green-50 text-green-700' : 
                                           'bg-red-50 text-red-700'
                                         }`}>
                                             {apt.status}
                                         </span>
                                     </td>
                                     <td className="px-4 py-3 text-right">
                                         <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                           {apt.status === 'Scheduled' && (
                                             <>
                                                <button 
                                                  onClick={() => handleStatusChange(apt.id, 'Completed')}
                                                  className="p-1.5 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-lg transition-all"
                                                  title="Mark Completed"
                                                >
                                                  <CheckCircle size={14} />
                                                </button>
                                                <button 
                                                  onClick={() => handleStatusChange(apt.id, 'Cancelled')}
                                                  className="p-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all"
                                                  title="Cancel Appointment"
                                                >
                                                  <XCircle size={14} />
                                                </button>
                                             </>
                                           )}
                                           <button className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg">
                                             <MoreVertical size={14} />
                                           </button>
                                         </div>
                                     </td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                 </div>
             )}

             {viewMode === 'tiles' && (
                 <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto">
                     {appointments.map(apt => (
                         <div key={apt.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow bg-white relative">
                             <div className={`absolute top-0 right-0 w-2 h-full rounded-r-xl ${
                               apt.status === 'Scheduled' ? 'bg-yellow-400' : 
                               apt.status === 'Completed' ? 'bg-green-400' : 'bg-red-400'
                             }`}></div>
                             <div className="flex justify-between items-start mb-2">
                                 <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">{apt.time}</span>
                                 <span className="text-xs text-slate-400">{apt.date}</span>
                             </div>
                             <h4 className="font-bold text-slate-900 text-lg mb-1">{apt.patientName}</h4>
                             <p className="text-sm text-slate-500 mb-3 flex items-center gap-1"><User size={12}/> {apt.doctorName}</p>
                             <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                 <span className="text-xs font-medium text-teal-600">{apt.type}</span>
                                 <div className="flex gap-2">
                                   {apt.status === 'Scheduled' && (
                                     <button 
                                      onClick={() => handleStatusChange(apt.id, 'Completed')}
                                      className="text-xs font-bold bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                                     >
                                       Complete
                                     </button>
                                   )}
                                   <button className="text-xs font-bold bg-slate-900 text-white px-2 py-1 rounded hover:bg-slate-800">View</button>
                                 </div>
                             </div>
                         </div>
                     ))}
                 </div>
             )}
        </div>

        {/* Sidebar: Doctor Status & Upcoming */}
        <div className="xl:col-span-1 space-y-6">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-4">Doctor Availability</h3>
                <div className="space-y-3">
                    {doctors.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-2 rounded-lg border border-slate-50 hover:border-slate-100 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-bold">
                                    {doc.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-slate-900">{doc.name}</div>
                                    <div className="text-xs text-slate-500">{doc.department}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${doc.status === 'Active' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                                <span className="text-xs text-slate-400">{doc.status === 'Active' ? 'In OPD' : 'Off'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>

      {/* New Appointment Modal */}
      {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                      <h3 className="font-bold text-lg text-slate-900">Schedule Appointment</h3>
                      <button onClick={() => setShowModal(false)}><X size={20} className="text-slate-400" /></button>
                  </div>
                  <form onSubmit={handleCreate} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Select Patient</label>
                          <select 
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                            value={newAppt.patientId}
                            onChange={(e) => setNewAppt({...newAppt, patientId: e.target.value})}
                            required
                          >
                              <option value="">-- Choose Patient --</option>
                              {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Doctor</label>
                          <select 
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                            value={newAppt.doctorName}
                            onChange={(e) => setNewAppt({...newAppt, doctorName: e.target.value})}
                            required
                          >
                              <option value="">-- Choose Doctor --</option>
                              {doctors.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                          </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                              <input type="date" className="w-full p-2 border border-slate-200 rounded-lg text-sm" value={newAppt.date} onChange={(e) => setNewAppt({...newAppt, date: e.target.value})} required />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
                              <input type="time" className="w-full p-2 border border-slate-200 rounded-lg text-sm" value={newAppt.time} onChange={(e) => setNewAppt({...newAppt, time: e.target.value})} required />
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                          <select className="w-full p-2 border border-slate-200 rounded-lg text-sm" value={newAppt.type} onChange={(e) => setNewAppt({...newAppt, type: e.target.value})}>
                              <option>Consultation</option>
                              <option>Surgery</option>
                              <option>Follow-up</option>
                              <option>Emergency</option>
                          </select>
                      </div>
                      <div className="pt-4 flex gap-3">
                          <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border border-slate-200 rounded-lg text-slate-600">Cancel</button>
                          <button type="submit" className="flex-1 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center justify-center gap-2"><Save size={16} /> Schedule</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Appointments;