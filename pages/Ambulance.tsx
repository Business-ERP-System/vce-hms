import React from 'react';
import { MOCK_AMBULANCES } from '../constants';
import { Ambulance, Phone, MapPin, Wrench, CheckCircle, Navigation } from 'lucide-react';

const AmbulancePage = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">Ambulance Management</h1>
           <p className="text-sm text-slate-500">Fleet tracking and emergency booking.</p>
        </div>
        <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm transition-colors">
            <Phone size={16} /> Emergency Book
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_AMBULANCES.map((amb) => (
            <div key={amb.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                            <Ambulance className="text-red-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">{amb.vehicleNumber}</h3>
                            <p className="text-xs text-slate-500">ID: {amb.id}</p>
                        </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                        amb.status === 'Available' ? 'bg-green-100 text-green-700' :
                        amb.status === 'On Trip' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                        {amb.status}
                    </span>
                </div>

                <div className="p-5 space-y-4">
                    <div className="flex items-center gap-3 text-sm text-slate-700">
                        <UserIcon className="text-slate-400 w-4 h-4" />
                        <span className="font-medium">Driver:</span> {amb.driverName}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-700">
                        <Phone className="text-slate-400 w-4 h-4" />
                        <span className="font-medium">Contact:</span> {amb.contact}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-700">
                        <MapPin className="text-slate-400 w-4 h-4" />
                        <span className="font-medium">Location:</span> {amb.location}
                    </div>

                    <div className="flex gap-2 mt-4">
                        {amb.status === 'Available' ? (
                            <button className="flex-1 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors">
                                Assign Trip
                            </button>
                        ) : (
                            <button className="flex-1 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors">
                                View Route
                            </button>
                        )}
                        <button className="p-2 bg-slate-50 text-slate-500 rounded-lg hover:bg-slate-100">
                            <Wrench size={16} />
                        </button>
                    </div>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

const UserIcon = ({className}:{className?:string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
)

export default AmbulancePage;