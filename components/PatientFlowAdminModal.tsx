import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import {
  X, Settings, Check, RotateCcw, Plus, Trash2, Power, Eye, Stethoscope,
  Building, CreditCard, Shuffle, FlaskConical, Sliders, ShieldCheck, AlertCircle
} from 'lucide-react';
import { SpecializedClinicMapping, PostOpFollowupMapping, InvestigationRoomMapping } from '../types';

interface PatientFlowAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PatientFlowAdminModal: React.FC<PatientFlowAdminModalProps> = ({ isOpen, onClose }) => {
  const {
    flowConfig,
    updateFlowConfig,
    resetFlowConfig,
    rooms,
    toggleRoomActive,
    addRoom
  } = useData();

  const [activeTab, setActiveTab] = useState<
    'vat' | 'consultation' | 'specialized' | 'postop' | 'billing' | 'refraction' | 'investigation' | 'allrooms'
  >('vat');

  // Form states for adding items
  const [newConsultRoom, setNewConsultRoom] = useState('');
  const [newBillingCounter, setNewBillingCounter] = useState('');
  const [newRefractionRoom, setNewRefractionRoom] = useState('');
  
  // Investigation editing
  const [newInvTest, setNewInvTest] = useState('');
  const [selectedInvRoom, setSelectedInvRoom] = useState<string>('16');

  // New room master modal
  const [customRoomNo, setCustomRoomNo] = useState('');
  const [customRoomName, setCustomRoomName] = useState('');

  if (!isOpen) return null;

  const handleUpdateVat = (gender: 'male' | 'female', roomNo: string) => {
    updateFlowConfig({
      vatRooms: {
        ...flowConfig.vatRooms,
        [gender]: roomNo.trim()
      }
    });
  };

  const handleAddConsultRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConsultRoom.trim()) return;
    const room = newConsultRoom.trim();
    if (!flowConfig.generalConsultationRooms.includes(room)) {
      updateFlowConfig({
        generalConsultationRooms: [...flowConfig.generalConsultationRooms, room]
      });
      // also ensure room exists in rooms master
      if (!rooms.some(r => r.roomNumber === room)) {
        addRoom({
          id: `R-${room}`,
          roomNumber: room,
          name: `Consultation Room ${room}`,
          type: 'OPD',
          currentLoad: 0,
          category: 'General Consultation',
          isActive: true
        });
      }
    }
    setNewConsultRoom('');
  };

  const handleRemoveConsultRoom = (roomNo: string) => {
    updateFlowConfig({
      generalConsultationRooms: flowConfig.generalConsultationRooms.filter(r => r !== roomNo)
    });
  };

  const handleUpdateSpecializedRoom = (index: number, newRoomNo: string) => {
    const updated = [...flowConfig.specializedClinics];
    updated[index] = { ...updated[index], roomNumber: newRoomNo.trim() };
    updateFlowConfig({ specializedClinics: updated });
  };

  const handleUpdatePostOpRoom = (index: number, newRoomNo: string) => {
    const updated = [...flowConfig.postOpFollowupRooms];
    updated[index] = { ...updated[index], roomNumber: newRoomNo.trim() };
    updateFlowConfig({ postOpFollowupRooms: updated });
  };

  const handleAddBillingCounter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBillingCounter.trim()) return;
    const counter = newBillingCounter.trim();
    if (!flowConfig.billingCounters.includes(counter)) {
      updateFlowConfig({
        billingCounters: [...flowConfig.billingCounters, counter]
      });
      if (!rooms.some(r => r.roomNumber === counter)) {
        addRoom({
          id: `R-${counter}`,
          roomNumber: counter,
          name: `Billing Counter ${counter}`,
          type: 'OPD',
          currentLoad: 0,
          category: 'Billing Counter',
          isActive: true
        });
      }
    }
    setNewBillingCounter('');
  };

  const handleRemoveBillingCounter = (counterNo: string) => {
    updateFlowConfig({
      billingCounters: flowConfig.billingCounters.filter(c => c !== counterNo)
    });
  };

  const handleAddRefractionRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRefractionRoom.trim()) return;
    const room = newRefractionRoom.trim();
    if (!flowConfig.refractionRooms.includes(room)) {
      updateFlowConfig({
        refractionRooms: [...flowConfig.refractionRooms, room]
      });
      if (!rooms.some(r => r.roomNumber === room)) {
        addRoom({
          id: `R-${room}`,
          roomNumber: room,
          name: `Refraction Room ${room}`,
          type: 'OPD',
          currentLoad: 0,
          category: 'Refraction',
          isActive: true
        });
      }
    }
    setNewRefractionRoom('');
  };

  const handleRemoveRefractionRoom = (roomNo: string) => {
    updateFlowConfig({
      refractionRooms: flowConfig.refractionRooms.filter(r => r !== roomNo)
    });
  };

  const handleAddTestToInvestigationRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvTest.trim() || !selectedInvRoom) return;
    const test = newInvTest.trim();
    const updated = flowConfig.investigationRooms.map(inv => {
      if (inv.roomNumber === selectedInvRoom) {
        if (!inv.tests.includes(test)) {
          return { ...inv, tests: [...inv.tests, test] };
        }
      }
      return inv;
    });
    updateFlowConfig({ investigationRooms: updated });
    setNewInvTest('');
  };

  const handleRemoveTestFromInv = (roomNo: string, testName: string) => {
    const updated = flowConfig.investigationRooms.map(inv => {
      if (inv.roomNumber === roomNo) {
        return { ...inv, tests: inv.tests.filter(t => t !== testName) };
      }
      return inv;
    });
    updateFlowConfig({ investigationRooms: updated });
  };

  const handleAddCustomRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRoomNo.trim() || !customRoomName.trim()) return;
    addRoom({
      id: `R-${customRoomNo.trim()}`,
      roomNumber: customRoomNo.trim(),
      name: customRoomName.trim(),
      type: 'OPD',
      currentLoad: 0,
      isActive: true
    });
    setCustomRoomNo('');
    setCustomRoomName('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-cyan-950 text-white p-4 sm:p-5 flex items-center justify-between border-b border-teal-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-400/30">
              <Sliders size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                Eye Hospital Patient Flow & Room Allocation Engine
                <span className="text-[10px] font-bold uppercase bg-teal-400/20 text-teal-200 px-2 py-0.5 rounded-full border border-teal-300/30">
                  Admin Panel
                </span>
              </h2>
              <p className="text-xs text-teal-200/80">
                Dynamically configure VAT, Consultation, Clinics, Follow-ups, Refraction, and Investigation Room mappings.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 pt-2 flex gap-1.5 overflow-x-auto text-xs font-bold scrollbar-none">
          {[
            { id: 'vat', label: '1. VAT Rooms', icon: Eye },
            { id: 'consultation', label: '2. General Consultation', icon: Stethoscope },
            { id: 'specialized', label: '3. Specialized Clinics', icon: Building },
            { id: 'postop', label: '4. Post-Op Follow-up', icon: ShieldCheck },
            { id: 'billing', label: '5. Billing Counters', icon: CreditCard },
            { id: 'refraction', label: '6. Round-Robin Refraction', icon: Shuffle },
            { id: 'investigation', label: '7. Investigations', icon: FlaskConical },
            { id: 'allrooms', label: '8. Room Status (Active/Inactive)', icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-2 rounded-t-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer border-t border-x ${
                  isActive
                    ? 'bg-white text-teal-800 border-slate-200 border-b-transparent shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/60'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-teal-600' : 'text-slate-400'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: VAT ROOMS */}
          {activeTab === 'vat' && (
            <div className="space-y-4">
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-3.5 text-xs text-teal-900 flex items-start gap-2.5">
                <AlertCircle size={18} className="text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Initial Visual Acuity Test (VAT) Gender Allocation</p>
                  <p className="text-teal-700 mt-0.5">
                    Patients are automatically directed to their designated VAT room upon registration based on gender.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Male Patient VAT Room</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 w-32 focus:ring-2 focus:ring-teal-500 outline-none"
                      value={flowConfig.vatRooms.male}
                      onChange={(e) => handleUpdateVat('male', e.target.value)}
                    />
                    <span className="text-xs text-slate-500 font-medium">(Default: Room No. 40)</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Female Patient VAT Room</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 w-32 focus:ring-2 focus:ring-teal-500 outline-none"
                      value={flowConfig.vatRooms.female}
                      onChange={(e) => handleUpdateVat('female', e.target.value)}
                    />
                    <span className="text-xs text-slate-500 font-medium">(Default: Room No. 41)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GENERAL CONSULTATION */}
          {activeTab === 'consultation' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700">
                <p className="font-bold text-slate-900">General Doctor Consultation Rooms</p>
                <p className="text-slate-500 mt-0.5">
                  After Visual Acuity Testing, patients are directed to one of these active rooms: 9-A, 9-B, 10, 12, 13, 20, 28, etc.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {flowConfig.generalConsultationRooms.map(room => (
                  <div
                    key={room}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 shadow-2xs hover:border-slate-300"
                  >
                    <span>Room No. {room}</span>
                    <button
                      onClick={() => handleRemoveConsultRoom(room)}
                      className="p-1 hover:bg-rose-50 hover:text-rose-600 rounded text-slate-400 transition-colors"
                      title="Remove Room"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddConsultRoom} className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Enter Room No (e.g. 9-C, 30)"
                  value={newConsultRoom}
                  onChange={(e) => setNewConsultRoom(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold w-64 focus:ring-2 focus:ring-teal-500 outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-bold hover:bg-teal-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus size={14} /> Add Consultation Room
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: SPECIALIZED CLINICS */}
          {activeTab === 'specialized' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700">
                <p className="font-bold text-slate-900">Specialized Clinic Room Allocation</p>
                <p className="text-slate-500 mt-0.5">
                  Doctors can refer patients directly during general consultation. System transfers patient to the respective clinic queue.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {flowConfig.specializedClinics.map((clinic, idx) => (
                  <div key={clinic.specialty} className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">{clinic.clinic}</p>
                      <p className="text-[11px] text-teal-600 font-semibold">{clinic.specialty} Sub-Specialty</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-400">Room:</span>
                      <input
                        type="text"
                        value={clinic.roomNumber}
                        onChange={(e) => handleUpdateSpecializedRoom(idx, e.target.value)}
                        className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 w-20 text-center focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: POST-OP FOLLOW-UP */}
          {activeTab === 'postop' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700">
                <p className="font-bold text-slate-900">Second Visit / Post-Operative Follow-up Room Allocation</p>
                <p className="text-slate-500 mt-0.5">
                  Identifies patient's past surgery records and automatically routes them to the corresponding follow-up room.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {flowConfig.postOpFollowupRooms.map((p, idx) => (
                  <div key={p.surgeryType} className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">{p.surgeryType} Surgery Follow-up</p>
                      <p className="text-[11px] text-slate-400 font-medium">Post-Op Clinical Examination</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-400">Room:</span>
                      <input
                        type="text"
                        value={p.roomNumber}
                        onChange={(e) => handleUpdatePostOpRoom(idx, e.target.value)}
                        className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 w-20 text-center focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: BILLING COUNTERS */}
          {activeTab === 'billing' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700">
                <p className="font-bold text-slate-900">Refraction & Investigation Billing Counters</p>
                <p className="text-slate-500 mt-0.5">
                  When doctor prescribes refraction or additional investigations, patients are directed to these counters: Room 08, Room 26.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {flowConfig.billingCounters.map(counter => (
                  <div
                    key={counter}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 shadow-2xs hover:border-slate-300"
                  >
                    <span>Counter / Room No. {counter}</span>
                    <button
                      onClick={() => handleRemoveBillingCounter(counter)}
                      className="p-1 hover:bg-rose-50 hover:text-rose-600 rounded text-slate-400 transition-colors"
                      title="Remove Counter"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddBillingCounter} className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Enter Counter No (e.g. 08, 26)"
                  value={newBillingCounter}
                  onChange={(e) => setNewBillingCounter(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold w-64 focus:ring-2 focus:ring-teal-500 outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-bold hover:bg-teal-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus size={14} /> Add Billing Counter
                </button>
              </form>
            </div>
          )}

          {/* TAB 6: ROUND-ROBIN REFRACTION */}
          {activeTab === 'refraction' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-950 flex items-start gap-2.5">
                <Shuffle size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Automatic Refraction Room Allocation (Round-Robin Rotational)</p>
                  <p className="text-emerald-800 mt-0.5">
                    Upon billing payment, the system distributes patients evenly across active refraction rooms in sequential rotation (36 &rarr; 37 &rarr; 21-1 &rarr; 21-2 &rarr; 36...).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {flowConfig.refractionRooms.map((room, idx) => {
                  const isCurrentPointer = flowConfig.lastRefractionRoomIndex === idx;
                  const roomMaster = rooms.find(r => r.roomNumber === room);
                  const isRoomActive = roomMaster?.isActive !== false;

                  return (
                    <div
                      key={room}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isCurrentPointer
                          ? 'bg-teal-50/70 border-teal-400 ring-2 ring-teal-300'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Sequence #{idx + 1}</span>
                        {isCurrentPointer && (
                          <span className="text-[9px] font-black uppercase text-teal-700 bg-teal-100 px-1.5 py-0.5 rounded">
                            Last Allocated
                          </span>
                        )}
                      </div>
                      <p className="text-base font-black text-slate-900">Room {room}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className={`text-[10px] font-bold ${isRoomActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {isRoomActive ? 'Active in Rotation' : 'Deactivated / Skipped'}
                        </span>
                        <button
                          onClick={() => handleRemoveRefractionRoom(room)}
                          className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Remove from Rotation"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleAddRefractionRoom} className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Room No (e.g. 36, 37, 21-1, 21-2)"
                  value={newRefractionRoom}
                  onChange={(e) => setNewRefractionRoom(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold w-64 focus:ring-2 focus:ring-teal-500 outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-bold hover:bg-teal-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus size={14} /> Add Refraction Room
                </button>
              </form>
            </div>
          )}

          {/* TAB 7: INVESTIGATION ROOM MAPPINGS */}
          {activeTab === 'investigation' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700">
                <p className="font-bold text-slate-900">Automatic Investigation Room Allocation</p>
                <p className="text-slate-500 mt-0.5">
                  Predefined test-to-room mappings. When tests are billed, patient is automatically routed to the mapped rooms: 16, 24, 39, 35.
                </p>
              </div>

              <div className="space-y-3">
                {flowConfig.investigationRooms.map(inv => (
                  <div key={inv.roomNumber} className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-black text-xs border border-teal-200">
                          {inv.roomNumber}
                        </span>
                        <div>
                          <p className="text-xs font-extrabold text-slate-900">{inv.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">Mapped Investigation Room No. {inv.roomNumber}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {inv.tests.map(test => (
                        <span
                          key={test}
                          className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-md border border-slate-200 flex items-center gap-1"
                        >
                          {test}
                          <button
                            onClick={() => handleRemoveTestFromInv(inv.roomNumber, test)}
                            className="hover:text-rose-600 p-0.5 rounded cursor-pointer"
                          >
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddTestToInvestigationRoom} className="flex flex-wrap items-center gap-2 pt-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-600">Assign Test to Room:</span>
                <select
                  value={selectedInvRoom}
                  onChange={(e) => setSelectedInvRoom(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                >
                  {flowConfig.investigationRooms.map(r => (
                    <option key={r.roomNumber} value={r.roomNumber}>
                      Room {r.roomNumber} ({r.name})
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Test Name (e.g. Corneal Topography)"
                  value={newInvTest}
                  onChange={(e) => setNewInvTest(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium w-64 focus:ring-2 focus:ring-teal-500 outline-none"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-bold hover:bg-teal-700 flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={13} /> Add Test Mapping
                </button>
              </form>
            </div>
          )}

          {/* TAB 8: ALL ROOMS MASTER & STATUS */}
          {activeTab === 'allrooms' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Room Master Activation & Status</p>
                  <p className="text-slate-500 mt-0.5">Toggle active/inactive status to dynamically include or exclude rooms from automated allocation queues.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[350px] overflow-y-auto p-1">
                {rooms.map(room => {
                  const isActive = room.isActive !== false;
                  return (
                    <div
                      key={room.id}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                        isActive ? 'bg-white border-slate-200' : 'bg-slate-100/80 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-xs text-slate-900">Room {room.roomNumber}</span>
                          {room.category && (
                            <span className="text-[9px] font-bold uppercase bg-slate-100 text-slate-600 px-1 py-0.2 rounded border border-slate-200 truncate">
                              {room.category}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{room.name}</p>
                      </div>
                      <button
                        onClick={() => toggleRoomActive(room.id)}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-200 text-slate-500 border-slate-300 hover:bg-slate-300'
                        }`}
                        title={isActive ? 'Deactivate Room' : 'Activate Room'}
                      >
                        <Power size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Add custom room to master */}
              <form onSubmit={handleAddCustomRoom} className="flex gap-2 pt-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <input
                  type="text"
                  placeholder="Room No (e.g. 42)"
                  value={customRoomNo}
                  onChange={(e) => setCustomRoomNo(e.target.value)}
                  className="w-28 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold focus:ring-2 focus:ring-teal-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="Room Description / Name"
                  value={customRoomName}
                  onChange={(e) => setCustomRoomName(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold focus:ring-2 focus:ring-teal-500 outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-bold hover:bg-teal-700 flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={14} /> Add to Room Master
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3.5 flex items-center justify-between">
          <button
            onClick={() => {
              if (confirm("Reset patient flow and room allocation rules to default hospital standards?")) {
                resetFlowConfig();
              }
            }}
            className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Reset to Standard Defaults</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Check size={14} />
            <span>Apply & Close</span>
          </button>
        </div>
      </div>
    </div>
  );
};
