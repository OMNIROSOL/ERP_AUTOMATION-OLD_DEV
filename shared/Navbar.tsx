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

interface NavbarProps {
  onMenuClick?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
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
        </div>

        <div className="flex items-center gap-3 pl-2 cursor-pointer group">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-sm font-bold text-slate-800 leading-none">John Doe</span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Super Admin</span>
          </div>
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
              <User size={20} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-success border-2 border-white"></div>
          </div>
          <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-800 transition-colors" />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
