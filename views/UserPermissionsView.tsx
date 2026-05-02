import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Shield, 
  UserCircle, 
  LogIn, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  ArrowRight
} from 'lucide-react';
import { AppUser, UserRole } from '../types';
import apiService from '../services/apiService';
import { cn } from '../utils/cn';

const UserPermissionsView: React.FC = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [currentUser, setCurrentUserLocal] = useState<AppUser>(apiService.getCurrentUser());
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [newUser, setNewUser] = useState<Partial<AppUser>>({
    name: '',
    email: '',
    role: 'Staff',
    roleId: 'r-staff',
    avatar: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const uData = await apiService.getUsers();
        const rData = await apiService.getRoles();
        setUsers(uData);
        setRoles(rData);
      } catch (err) {
        console.error('Failed to fetch user/role data:', err);
      }
    };
    fetchData();

    const handleUpdate = () => {
      fetchData();
      setCurrentUserLocal(apiService.getCurrentUser());
    };
    window.addEventListener('user_sim_updated', handleUpdate);
    window.addEventListener('users_updated', handleUpdate);
    window.addEventListener('roles_updated', handleUpdate);
    return () => {
      window.removeEventListener('user_sim_updated', handleUpdate);
      window.removeEventListener('users_updated', handleUpdate);
      window.removeEventListener('roles_updated', handleUpdate);
    };
  }, []);

  const handleSwitchUser = (user: AppUser) => {
    apiService.setCurrentUser(user);
    setCurrentUserLocal(user);
    setToastMsg(`Simulated login as ${user.name} (${user.role})`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleAddNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;

    const selectedRole = roles.find(r => r.id === newUser.roleId) || roles[0];

    const userData = {
      name: newUser.name,
      email: newUser.email,
      role: selectedRole.name as any,
      roleId: selectedRole.id,
      avatar: newUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    };

    try {
      await apiService.createUser(userData);
      const updatedUsers = await apiService.getUsers();
      setUsers(updatedUsers);
      setShowNewUserModal(false);
      setNewUser({ name: '', email: '', role: 'Staff', roleId: 'r-staff', avatar: '' });
      
      setToastMsg(`User ${userData.name} added successfully`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error('Failed to create user:', err);
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'Admin': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Manager': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Staff': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'Admin': return <ShieldCheck size={16} />;
      case 'Manager': return <Shield size={16} />;
      case 'Staff': return <UserCircle size={16} />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-inner">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Permissions & Roles</h1>
            <p className="text-slate-500 text-sm">Simulate role-based access control and manage user accounts.</p>
          </div>
        </div>
        <button 
          onClick={() => setShowNewUserModal(true)}
          className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-md shadow-slate-200"
        >
          <UserPlus size={18} />
          ADD NEW USER
        </button>
      </div>

      {/* Current Session Info */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-2xl text-white shadow-xl shadow-blue-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <LogIn size={120} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl font-bold border border-white/30 shadow-lg">
              {currentUser.avatar}
            </div>
            <div>
              <p className="text-blue-100 text-sm font-medium uppercase tracking-wider mb-1">Current Active Session</p>
              <h2 className="text-2xl font-bold">{currentUser.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md",
                  currentUser.role === 'Admin' ? "bg-white/20 border-white/30" : "bg-black/10 border-black/10 text-white/90"
                )}>
                  {currentUser.role}
                </span>
                <span className="text-blue-100 text-xs">• {currentUser.email}</span>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 flex flex-col gap-1 min-w-[200px]">
            <span className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Simulation Mode</span>
            <p className="text-sm">Application currently reflects roles and permissions for <strong>{currentUser.role}</strong>.</p>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-8">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">Available User Profiles</h2>
          <span className="text-xs font-medium text-slate-400">SELECT A USER TO SIMULATE LOGIN</span>
        </div>
        <div className="divide-y divide-slate-100">
          {users.map((user) => (
            <div 
              key={user.id} 
              className={cn(
                "p-4 hover:bg-slate-50 transition-all flex items-center justify-between group",
                currentUser.id === user.id && "bg-blue-50/50"
              )}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200 group-hover:bg-white group-hover:shadow-sm transition-all md:text-sm">
                  {user.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{user.name}</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 uppercase tracking-tighter",
                      getRoleBadgeColor(user.role)
                    )}>
                      {getRoleIcon(user.role)}
                      {user.role}
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs mt-0.5">{user.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {currentUser.id === user.id ? (
                  <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs bg-blue-100/50 px-3 py-1.5 rounded-lg border border-blue-200">
                    <CheckCircle2 size={14} />
                    CURRENTLY LOGGED IN
                  </div>
                ) : (
                  <button 
                    onClick={() => handleSwitchUser(user)}
                    className="flex items-center gap-1.5 text-slate-600 font-bold text-xs bg-white border border-slate-200 px-4 py-1.5 rounded-lg hover:bg-primary hover:border-primary hover:text-white hover:shadow-lg hover:shadow-primary/20 transition-all translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0"
                  >
                    LOGIN AS
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Permissions Grid Section (Placeholder for visual premium feel) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {[
          { title: 'Admin Permissions', desc: 'Full access to all system modules, settings, and user management.', icon: ShieldCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
          { title: 'Manager Permissions', desc: 'Access to sales and inventory views, reporting, and approvals.', icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50' },
          { title: 'Staff Permissions', desc: 'Limited access to daily transactions and data entry only.', icon: UserCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' }
        ].map((perm, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4 shadow-sm", perm.bg, perm.color)}>
              <perm.icon size={20} />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">{perm.title}</h3>
            <p className="text-slate-500 text-xs leading-relaxed">{perm.desc}</p>
          </div>
        ))}
      </div>

      {/* New User Modal */}
      {showNewUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Add New User</h2>
              <button onClick={() => setShowNewUserModal(false)} className="text-slate-400 hover:text-slate-600">
                <AlertCircle size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddNewUser} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <input 
                  required
                  type="text" 
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="e.g. Alice Johnson"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary/40 focus:bg-white transition-all outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <input 
                  required
                  type="email" 
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="e.g. alice@erppro.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary/40 focus:bg-white transition-all outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assign Defined Role</label>
                <select 
                  value={newUser.roleId}
                  onChange={(e) => setNewUser({ ...newUser, roleId: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary/40 focus:bg-white transition-all outline-none appearance-none"
                >
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1 italic font-medium px-1">Rights are defined in the Role Management section.</p>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowNewUserModal(false)}
                  className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-8 right-8 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-300 z-50 border border-white/10">
          <div className="w-8 h-8 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center shadow-inner">
            <CheckCircle2 size={18} />
          </div>
          <span className="font-bold text-sm">{toastMsg}</span>
        </div>
      )}
    </div>
  );
};

export default UserPermissionsView;
