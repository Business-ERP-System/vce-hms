
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ShieldCheck, UserCog, Lock, Save, LayoutDashboard, Monitor, 
    Search, UserPlus, Key, EyeOff, UserMinus, ShieldAlert, 
    History, Fingerprint, Clock, Smartphone, Globe, AlertTriangle,
    CheckCircle, MoreVertical, Shield, X, Trash2, Edit, Plus,
    List, Eye, PlusCircle, PenTool, Eraser, Download, Settings as CogIcon,
    ChevronDown, ChevronUp, Layers, CheckSquare, Square, Copy, RefreshCcw,
    Info, Users, Sparkles, ArrowRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Employee, ActionPermission, ModulePermissions, UserRole } from '../types';
import { MENU_GROUPS, ALL_PERMISSION_ENTITIES } from '../constants';

const Settings = () => {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('roles');
  const { 
    employees, addEmployee, updateEmployee, deleteEmployee, 
    rolesPermissions, updateRolePermissions, updateEmployeeCustomPermissions,
    addRole, deleteRole, availableRoles, hasPermission 
  } = useData();

  // Access Control: Only SuperAdmin or users with 'System Settings' edit permission can manage settings
  const canManage = role === UserRole.SUPER_ADMIN || hasPermission('System Settings', 'edit');

  if (!canManage) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="p-6 bg-rose-50 rounded-full text-rose-500">
          <ShieldAlert size={64} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Access Restricted</h2>
        <p className="text-slate-500 text-center max-w-md">
          You do not have the necessary permissions to access the System Control Panel. 
          Please contact your SuperAdmin for authorization.
        </p>
      </div>
    );
  }
  
  const [searchTerm, setSearchTerm] = useState('');
  const [permissionSearch, setPermissionSearch] = useState('');
  
  // Modals
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPermOverrideModal, setShowPermOverrideModal] = useState(false);
  
  // Form States
  const [editingUser, setEditingUser] = useState<Employee | null>(null);
  const [userFormData, setUserFormData] = useState<Partial<Employee>>({
      name: '', role: 'Receptionist', department: 'Front Office', contact: '', shift: 'Morning', status: 'Active'
  });
  const [overrideUser, setOverrideUser] = useState<Employee | null>(null);
  const [newRoleName, setNewRoleName] = useState('');

  const filteredUsers = employees.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleAction = (roleOrUser: string, entityName: string, action: keyof ActionPermission, isUserOverride = false) => {
      let currentPerms: ModulePermissions;
      if (isUserOverride) {
          const user = employees.find(e => e.id === roleOrUser);
          currentPerms = JSON.parse(JSON.stringify(user?.customPermissions || rolesPermissions[user?.role || 'Receptionist']));
      } else {
          currentPerms = JSON.parse(JSON.stringify(rolesPermissions[roleOrUser]));
      }

        if (!currentPerms[entityName]) {
            currentPerms[entityName] = { list: false, view: false, add: false, edit: false, delete: false, export: false, print: false };
        }

      currentPerms[entityName] = {
          ...currentPerms[entityName],
          [action]: !currentPerms[entityName][action]
      };

      if (isUserOverride) {
          updateEmployeeCustomPermissions(roleOrUser, currentPerms);
      } else {
          updateRolePermissions(roleOrUser, currentPerms);
      }
  };

  const toggleRow = (roleOrUser: string, entityName: string, enable: boolean, isUserOverride = false) => {
      let currentPerms: ModulePermissions;
      if (isUserOverride) {
          const user = employees.find(e => e.id === roleOrUser);
          currentPerms = JSON.parse(JSON.stringify(user?.customPermissions || rolesPermissions[user?.role || 'Receptionist']));
      } else {
          currentPerms = JSON.parse(JSON.stringify(rolesPermissions[roleOrUser]));
      }

        currentPerms[entityName] = {
            list: enable, view: enable, add: enable, edit: enable, delete: enable, export: enable, print: enable
        };

      if (isUserOverride) {
          updateEmployeeCustomPermissions(roleOrUser, currentPerms);
      } else {
          updateRolePermissions(roleOrUser, currentPerms);
      }
  };

  const handleUserSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingUser) {
          updateEmployee(editingUser.id, userFormData);
      } else {
          addEmployee({
              id: `EMP-${Date.now()}`,
              name: userFormData.name || '',
              role: userFormData.role || 'Receptionist',
              department: userFormData.department || 'Clinical',
              contact: userFormData.contact || '',
              shift: userFormData.shift as any || 'Morning',
              status: userFormData.status as any || 'Active'
          });
      }
      setShowUserModal(false);
      setEditingUser(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">System Control Panel</h1>
           <p className="text-sm text-slate-500">Configure roles, granular module permissions, and staff access levels.</p>
        </div>
        <div className="flex gap-2">
            <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-slate-50 transition-all">
                <History size={18} /> Audit Log
            </button>
            <button className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold shadow-md shadow-teal-100 transition-all active:scale-95">
                <Save size={18} /> Save & Deploy
            </button>
        </div>
      </div>

      {/* Enterprise System Control Panel Redesign Demo Callout */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-5 rounded-3xl shadow-lg border border-teal-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-500/20 rounded-2xl text-teal-300 border border-teal-400/30">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-white">System Settings Demo Available</span>
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">New Redesign</span>
            </div>
            <p className="text-xs text-teal-200/80 mt-0.5">Test the new enterprise hospital governance center with 18+ configuration modules, 3-way RBAC matrix, and live telemetry.</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/system-settings-demo')}
          className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 cursor-pointer shadow-md"
        >
          <span>Launch System Settings Demo</span>
          <ArrowRight size={14} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="col-span-1 space-y-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 h-fit">
                <nav className="space-y-1">
                    {[
                        { id: 'roles', label: 'Role Permissions', icon: ShieldCheck, sub: 'L/V/A/E/D/X Matrix' },
                        { id: 'users', label: 'Staff Accounts', icon: UserCog, sub: 'Assignments & Overrides' },
                        { id: 'security', label: 'Security Policy', icon: Lock, sub: 'Auth & Encryption' }
                    ].map((tab) => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full text-left p-4 rounded-xl transition-all ${
                                activeTab === tab.id 
                                ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' 
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <tab.icon size={18} />
                                <div>
                                    <div className="text-sm font-bold">{tab.label}</div>
                                    <div className={`text-xs uppercase font-black tracking-widest ${activeTab === tab.id ? 'text-teal-400' : 'text-slate-400'}`}>{tab.sub}</div>
                                </div>
                            </div>
                        </button>
                    ))}
                </nav>
            </div>

            {activeTab === 'roles' && (
                <div className="bg-gradient-to-br from-teal-600 to-teal-800 p-5 rounded-2xl text-white shadow-lg">
                    <h3 className="font-bold flex items-center gap-2 mb-2"><Info size={16}/> Matrix Guide</h3>
                        <div className="grid grid-cols-2 gap-2 text-xs font-bold uppercase tracking-tighter">
                            <div className="bg-white/10 p-2 rounded">L: List Records</div>
                            <div className="bg-white/10 p-2 rounded">V: View Details</div>
                            <div className="bg-white/10 p-2 rounded">A: Add New</div>
                            <div className="bg-white/10 p-2 rounded">E: Edit Existing</div>
                            <div className="bg-white/10 p-2 rounded">D: Delete Entry</div>
                            <div className="bg-white/10 p-2 rounded">X: Export Data</div>
                            <div className="bg-white/10 p-2 rounded">P: Print Report</div>
                        </div>
                </div>
            )}
        </div>

        {/* Dynamic Content Area */}
        <div className="col-span-1 lg:col-span-3 space-y-6">
            
            {activeTab === 'roles' && (
                <div className="space-y-6">
                    {/* Role Creator */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row items-center gap-4">
                        <div className="flex-1 text-center md:text-left">
                            <h3 className="font-bold text-slate-900">Role Engine</h3>
                            <p className="text-xs text-slate-500 font-medium">Create custom profiles to match hospital hierarchy.</p>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <input 
                                type="text" placeholder="Enter Role Name (e.g. Intern)" 
                                className="px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500 w-full md:w-56"
                                value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)}
                            />
                            <button onClick={() => { if(newRoleName) { addRole(newRoleName); setNewRoleName(''); } }} className="bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 whitespace-nowrap hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
                                <PlusCircle size={16} /> New Role
                            </button>
                        </div>
                    </div>

                    {/* Permission Matrix */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div>
                                <h3 className="font-bold text-slate-900 flex items-center gap-2"><Shield size={20} className="text-teal-600"/> Granular Rights Matrix</h3>
                                <p className="text-xs text-slate-400 font-black uppercase tracking-widest mt-1">Cross-Functional Permission Management</p>
                            </div>
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input 
                                    type="text" 
                                    placeholder="Search modules or features..." 
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-white outline-none focus:ring-2 focus:ring-teal-500 transition-all" 
                                    value={permissionSearch}
                                    onChange={(e) => setPermissionSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left border-collapse">
                                <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider sticky top-0 z-20">
                                    <tr>
                                        <th className="px-6 py-5 border-r border-white/10 bg-slate-900 sticky left-0 z-30 min-w-[220px]">Menu / Modules / Features</th>
                                        {availableRoles.map(role => (
                                                <th key={role} colSpan={7} className="px-2 py-4 text-center border-r border-white/10 bg-slate-800">
                                                <div className="flex items-center justify-center gap-2 mb-2">
                                                    <span className="text-xs truncate max-w-[90px]" title={role}>{role}</span>
                                                    {!Object.values(UserRole).includes(role as any) && (
                                                        <button onClick={() => deleteRole(role)} className="text-rose-400 hover:text-rose-200 transition-colors"><Trash2 size={12} /></button>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-7 gap-0 text-[10px] font-black text-slate-400">
                                                    <span>L</span><span>V</span><span>A</span><span>E</span><span>D</span><span>X</span><span>P</span>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {ALL_PERMISSION_ENTITIES.filter(item => item.name.toLowerCase().includes(permissionSearch.toLowerCase())).map((item) => (
                                        <tr key={item.name} className="hover:bg-teal-50/30 group transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-700 bg-white group-hover:bg-teal-50/50 sticky left-0 z-10 border-r border-slate-100 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <item.icon size={16} className="text-slate-400 group-hover:text-teal-600 transition-colors shrink-0" />
                                                    <span className="text-sm">{item.name}</span>
                                                </div>
                                            </td>
                                            {availableRoles.map(role => {
                                                const perm = rolesPermissions[role]?.[item.name] || { list: false, view: false, add: false, edit: false, delete: false, export: false, print: false };
                                                const allEnabled = Object.values(perm).every(v => v);
                                                return (
                                                    <React.Fragment key={role}>
                                                        <td className="px-1 py-3 text-center"><input type="checkbox" checked={perm.list} onChange={() => toggleAction(role, item.name, 'list')} className="w-3.5 h-3.5 rounded border-slate-300 text-teal-600 focus:ring-0 cursor-pointer" /></td>
                                                        <td className="px-1 py-3 text-center"><input type="checkbox" checked={perm.view} onChange={() => toggleAction(role, item.name, 'view')} className="w-3.5 h-3.5 rounded border-slate-300 text-teal-600 focus:ring-0 cursor-pointer" /></td>
                                                        <td className="px-1 py-3 text-center"><input type="checkbox" checked={perm.add} onChange={() => toggleAction(role, item.name, 'add')} className="w-3.5 h-3.5 rounded border-slate-300 text-teal-600 focus:ring-0 cursor-pointer" /></td>
                                                        <td className="px-1 py-3 text-center"><input type="checkbox" checked={perm.edit} onChange={() => toggleAction(role, item.name, 'edit')} className="w-3.5 h-3.5 rounded border-slate-300 text-teal-600 focus:ring-0 cursor-pointer" /></td>
                                                        <td className="px-1 py-3 text-center"><input type="checkbox" checked={perm.delete} onChange={() => toggleAction(role, item.name, 'delete')} className="w-3.5 h-3.5 rounded border-slate-300 text-teal-600 focus:ring-0 cursor-pointer" /></td>
                                                        <td className="px-1 py-3 text-center"><input type="checkbox" checked={perm.export} onChange={() => toggleAction(role, item.name, 'export')} className="w-3.5 h-3.5 rounded border-slate-300 text-teal-600 focus:ring-0 cursor-pointer" /></td>
                                                        <td className="px-1 py-3 text-center border-r border-slate-200/50 bg-slate-50/30">
                                                            <div className="flex items-center justify-center gap-1.5">
                                                                <input type="checkbox" checked={perm.print} onChange={() => toggleAction(role, item.name, 'print')} className="w-3.5 h-3.5 rounded border-slate-300 text-teal-600 focus:ring-0 cursor-pointer" />
                                                                <button 
                                                                    onClick={() => toggleRow(role, item.name, !allEnabled)}
                                                                    className="p-1 hover:bg-slate-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    title={allEnabled ? "Disable All Actions" : "Enable All Actions"}
                                                                >
                                                                    {allEnabled ? <CheckSquare size={10} className="text-teal-600" /> : <Square size={10} className="text-slate-300" />}
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </React.Fragment>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'users' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50">
                        <div>
                            <h3 className="font-bold text-slate-900 flex items-center gap-2"><Users size={20} className="text-teal-600" /> System Staff Inventory</h3>
                            <p className="text-xs text-slate-400 font-black uppercase tracking-widest mt-1">Manage Personnel Access</p>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input type="text" placeholder="Filter by name or role..." className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                            <button onClick={() => { setEditingUser(null); setUserFormData({ name: '', role: 'Receptionist', status: 'Active' }); setShowUserModal(true); }} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"><Plus size={16}/> Register Staff</button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-[0.1em] text-xs">
                                <tr>
                                    <th className="px-6 py-4">Employee Identity</th>
                                    <th className="px-6 py-4">Current Role</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Privilege Type</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50 group transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold shadow-sm">{user.name.charAt(0)}</div>
                                                <div>
                                                    <div className="font-bold text-slate-900 text-sm">{user.name}</div>
                                                    <div className="text-xs text-slate-400 font-mono">UHID-EMP: {user.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4"><span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-black text-xs border border-indigo-100 uppercase tracking-tighter">{user.role}</span></td>
                                        <td className="px-6 py-4">
                                            <span className={`flex items-center gap-1.5 font-bold text-xs uppercase ${user.status === 'Active' ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                                                {user.status === 'Active' ? 'Active Duty' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.customPermissions ? (
                                                <span className="inline-flex items-center gap-1.5 text-amber-600 font-black text-xs uppercase bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 shadow-sm"><ShieldAlert size={10}/> Custom Override</span>
                                            ) : (
                                                <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Inherited (Default)</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => { setOverrideUser(user); setShowPermOverrideModal(true); }} className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg border border-transparent hover:border-teal-100 shadow-sm transition-all" title="Manage Specific Rights"><ShieldCheck size={16}/></button>
                                                <button onClick={() => { setEditingUser(user); setUserFormData(user); setShowUserModal(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-100 transition-all shadow-sm"><Edit size={16}/></button>
                                                <button onClick={() => deleteEmployee(user.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-100 transition-all shadow-sm"><Trash2 size={16}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'security' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Key size={18} className="text-blue-600"/> Authentication Protocols</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                <div><p className="text-sm font-bold text-slate-800">Two-Factor Auth (2FA)</p><p className="text-xs text-slate-500">Requires mobile OTP for login</p></div>
                                <div className="w-12 h-6 bg-slate-200 rounded-full relative"><div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5 shadow-sm"></div></div>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                <div><p className="text-sm font-bold text-slate-800">Biometric Sign-on</p><p className="text-xs text-slate-500">Enable Windows Hello/TouchID</p></div>
                                <div className="w-12 h-6 bg-teal-500 rounded-full relative shadow-inner"><div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow-md"></div></div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Monitor size={18} className="text-purple-600"/> Session Management</h3>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Auto-Logout Timer</label>
                                <select className="w-full p-2.5 border border-slate-200 rounded-xl text-sm bg-white outline-none">
                                    <option>After 15 Minutes</option>
                                    <option>After 30 Minutes</option>
                                    <option>After 1 Hour</option>
                                    <option>Manual Only</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* User Register/Edit Modal */}
      {showUserModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                  <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                      <h3 className="font-bold text-lg text-slate-800">{editingUser ? 'Update Staff Identity' : 'Register New Employee'}</h3>
                      <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-white rounded-lg transition-all"><X size={20}/></button>
                  </div>
                  <form onSubmit={handleUserSubmit} className="p-6 space-y-5">
                      <div className="space-y-1.5">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Full Legal Name</label>
                          <div className="relative">
                            <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                            <input required className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all font-medium text-sm" value={userFormData.name} onChange={e=>setUserFormData({...userFormData, name: e.target.value})} placeholder="Dr. Jane Smith" />
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Functional Role</label>
                            <select className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-teal-500 outline-none text-sm font-medium" value={userFormData.role} onChange={e=>setUserFormData({...userFormData, role: e.target.value})}>
                                {availableRoles.map(r=><option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Primary Department</label>
                            <select className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-teal-500 outline-none text-sm font-medium" value={userFormData.department} onChange={e=>setUserFormData({...userFormData, department: e.target.value})}>
                                <option>Clinical</option>
                                <option>Pharmacy</option>
                                <option>Front Office</option>
                                <option>Administration</option>
                                <option>OT Services</option>
                                <option>Logistics</option>
                            </select>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Shift Schedule</label>
                          <select className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-teal-500 outline-none text-sm font-medium" value={userFormData.shift} onChange={e=>setUserFormData({...userFormData, shift: e.target.value as any})}>
                              <option value="Morning">Morning (8am - 2pm)</option>
                              <option value="Evening">Evening (2pm - 8pm)</option>
                              <option value="Night">Night (8pm - 8am)</option>
                          </select>
                      </div>
                      <button type="submit" className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl mt-4 flex items-center justify-center gap-2 shadow-2xl hover:bg-slate-800 transition-all active:scale-95">
                          <CheckCircle size={18}/> {editingUser ? 'Sync Identity Profile' : 'Complete Registration'}
                      </button>
                  </form>
              </div>
          </div>
      )}

      {/* User Specific Granular Permission Override Modal */}
      {showPermOverrideModal && overrideUser && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden h-[90vh] flex flex-col">
                  {/* Modal Header */}
                  <div className="p-6 border-b border-slate-100 bg-slate-900 text-white flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-teal-500/20 text-teal-400 rounded-2xl shadow-inner border border-teal-500/30"><Shield size={28}/></div>
                          <div>
                            <h3 className="font-bold text-xl leading-tight">Advanced Privilege Override</h3>
                            <p className="text-xs text-teal-300 font-black uppercase tracking-[0.2em] flex items-center gap-2 mt-0.5">
                                User: {overrideUser.name} <span className="opacity-30">•</span> Base Role: {overrideUser.role} <span className="opacity-30">•</span> ID: {overrideUser.id}
                            </p>
                          </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                            onClick={() => { updateEmployeeCustomPermissions(overrideUser.id, undefined); setShowPermOverrideModal(false); }} 
                            className="px-5 py-2.5 bg-rose-500/10 text-rose-300 text-xs font-black uppercase tracking-widest rounded-xl border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all flex items-center gap-2"
                        >
                            <RefreshCcw size={14}/> Reset to Default
                        </button>
                        <button onClick={() => setShowPermOverrideModal(false)} className="p-2.5 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white"><X size={20}/></button>
                      </div>
                  </div>
                  
                  {/* Modal Content - Scrollable Matrix */}
                  <div className="flex-1 overflow-y-auto bg-slate-50/30 p-2">
                      <table className="w-full text-xs text-left border-collapse bg-white rounded-2xl overflow-hidden shadow-sm">
                            <thead className="bg-slate-50 text-slate-500 font-black uppercase tracking-widest sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-6 py-5 border-r border-slate-100 bg-slate-50 min-w-[250px]">Module / Capability Name</th>
                                    {['list', 'view', 'add', 'edit', 'delete', 'export', 'print'].map(action => (
                                        <th key={action} className="px-4 py-5 text-center border-r border-slate-100 last:border-0">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-xs uppercase font-black">{action}</span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {ALL_PERMISSION_ENTITIES.map((item) => {
                                    const user = employees.find(e => e.id === overrideUser.id);
                                    const userPerms = user?.customPermissions || rolesPermissions[user?.role || 'Receptionist'];
                                    const p = userPerms[item.name] || { list: false, view: false, add: false, edit: false, delete: false, export: false, print: false };
                                    const allChecked = Object.values(p).every(v => v);
                                    return (
                                        <tr key={item.name} className="hover:bg-slate-50 group">
                                            <td className="px-6 py-4 font-bold text-slate-700">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <item.icon size={18} className="text-slate-300 group-hover:text-teal-600 transition-colors" />
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold">{item.name}</span>
                                                            <span className="text-xs font-normal text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">Entity ID: {item.name.replace(/\s+/g, '_').toLowerCase()}</span>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => toggleRow(overrideUser.id, item.name, !allChecked, true)}
                                                        className="p-1.5 hover:bg-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm border border-transparent hover:border-slate-200"
                                                        title={allChecked ? "Deactivate Entity" : "Activate Entity"}
                                                    >
                                                        {allChecked ? <CheckSquare size={14} className="text-teal-600" /> : <Square size={14} className="text-slate-300" />}
                                                    </button>
                                                </div>
                                            </td>
                                            {['list', 'view', 'add', 'edit', 'delete', 'export', 'print'].map((action) => (
                                                <td key={action} className="px-4 py-4 text-center border-r border-slate-50 last:border-0">
                                                    <label className="flex items-center justify-center cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={p[action as keyof ActionPermission]} 
                                                            onChange={() => toggleAction(overrideUser.id, item.name, action as keyof ActionPermission, true)} 
                                                            className="w-5 h-5 rounded-md border-slate-300 text-teal-600 focus:ring-0 cursor-pointer transition-all hover:scale-110" 
                                                        />
                                                    </label>
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                      </table>
                  </div>
                  
                  {/* Modal Footer */}
                  <div className="p-6 bg-white border-t border-slate-100 flex items-center justify-between shrink-0">
                      <p className="text-xs text-slate-400 font-bold uppercase flex items-center gap-2"><AlertTriangle size={14} className="text-amber-500"/> Overrides are immediate and log a system audit entry.</p>
                      <button onClick={() => setShowPermOverrideModal(false)} className="px-10 py-4 bg-slate-900 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-2xl shadow-slate-300 hover:bg-slate-800 transition-all active:scale-95">Finalize Active Rights</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Settings;
