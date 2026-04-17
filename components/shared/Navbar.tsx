import React from 'react';
import { 
  Search, 
  Bell, 
  Moon, 
  Sun, 
  User,
  Settings,
  LogOut,
  HelpCircle,
  Menu,
  ChevronDown
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { getCurrentUser, getUsers } from '../../mockData';
import { AppUser } from '../../types';
import { useState, useEffect } from 'react';

interface NavbarProps {
  onMenuClick?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const [currentUser, setCurrentUserLocal] = useState<AppUser>(getCurrentUser());
  const [users, setUsers] = useState<AppUser[]>(getUsers());
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setCurrentUserLocal(getCurrentUser());
      setUsers(getUsers());
    };
    window.addEventListener('user_sim_updated', handleUpdate);
    window.addEventListener('users_updated', handleUpdate);
    return () => {
      window.removeEventListener('user_sim_updated', handleUpdate);
      window.removeEventListener('users_updated', handleUpdate);
    };
  }, []);

  const handleRoleSwitch = (user: AppUser) => {
    import('../../mockData').then(m => {
      m.setCurrentUser(user);
      setShowUserMenu(false);
    });
  };

  return (
    <header className="h-16 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-6 z-10 sticky top-0">
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-[#F3F4F6] text-[#4B5563] transition-colors"
        >
          <Menu size={20} />
        </button>
        
        <div className="max-w-md w-full relative group hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] group-focus-within:text-[#4F46E5] transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search transactions, customers, or reports..." 
            className="w-full bg-[#F9FAFB] border border-[#E5E7EB] focus:border-[#4F46E5]/50 rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-4 focus:ring-[#4F46E5]/5 transition-all outline-none"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-white px-1.5 font-mono text-[10px] font-medium text-slate-400 opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-4">
        <div className="flex items-center gap-1 border-r border-slate-200 pr-2 sm:pr-4">
          <button className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-error rounded-full border-2 border-white"></span>
          </button>
          <button className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors hidden sm:flex">
            <Moon size={20} />
          </button>
          <button className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors hidden sm:flex">
            <HelpCircle size={20} />
          </button>
          <a href="#/settings" className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors">
            <Settings size={20} />
          </a>
        </div>

        <div 
          className="flex items-center gap-3 pl-2 cursor-pointer group relative"
          onClick={() => setShowUserMenu(!showUserMenu)}
        >
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-sm font-bold text-slate-800 leading-none">{currentUser.name}</span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">{currentUser.role}</span>
          </div>
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
              <span className="font-bold">{currentUser.avatar}</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-success border-2 border-white"></div>
          </div>
          <ChevronDown size={16} className={cn("text-slate-400 transition-transform", showUserMenu && "rotate-180")} />

          {/* User Switcher Dropdown */}
          {showUserMenu && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
              <div className="px-4 py-2 border-b border-slate-100 mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Switch User Simulation</span>
              </div>
              {users.map((user: AppUser) => (
                <button
                  key={user.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRoleSwitch(user);
                  }}
                  className={cn(
                    "w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left",
                    currentUser.id === user.id && "bg-primary/5 border-r-2 border-primary"
                  )}
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                    {user.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900 leading-tight">{user.name}</p>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">{user.role}</p>
                  </div>
                  {currentUser.id === user.id && (
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                  )}
                </button>
              ))}
              <div className="mt-2 pt-2 border-t border-slate-100 px-4 pb-2">
                <p className="text-[9px] text-slate-400 italic leading-tight">Simulation affects sidebar links and dashboard data.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
