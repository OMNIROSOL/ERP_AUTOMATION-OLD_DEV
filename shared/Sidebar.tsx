import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Database, 
  ShoppingCart, 
  CheckCircle2, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  ClipboardList,
  Flower2,
  Sprout,
  BarChart3,
  Search,
  Users,
  Building2,
  FileSpreadsheet,
  Receipt,
  History,
  CheckCircle
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  path: string;
  isCollapsed: boolean;
  count?: number;
  submenu?: { label: string; path: string }[];
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, path, isCollapsed, count, submenu }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="px-3 py-1">
      <NavLink
        to={path}
        className={({ isActive }) => cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
          isActive 
            ? "bg-primary/20 text-white" 
            : "text-slate-400 hover:bg-slate-800 hover:text-white"
        )}
        onClick={() => submenu && setIsOpen(!isOpen)}
      >
        <Icon size={20} className={cn("shrink-0", !isCollapsed && "group-hover:scale-110 transition-transform")} />
        {!isCollapsed && (
          <div className="flex-1 flex items-center justify-between overflow-hidden">
            <span className="font-medium whitespace-nowrap">{label}</span>
            <div className="flex items-center gap-1">
              {count !== undefined && count > 0 && (
                <span className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full font-bold",
                  path === '/approvals' ? "bg-red-500/10 text-red-400" : "bg-primary/10 text-primary"
                )}>
                  {count}
                </span>
              )}
              {submenu && (
                <ChevronRight size={14} className={cn("transition-transform opacity-50", isOpen && "rotate-90")} />
              )}
            </div>
          </div>
        )}
      </NavLink>
      
      {!isCollapsed && submenu && isOpen && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="ml-9 mt-1 flex flex-col gap-1 overflow-hidden"
        >
          {submenu.map((item, index) => (
            <NavLink
              key={index}
              to={item.path}
              className={({ isActive }) => cn(
                "text-sm py-1.5 px-3 rounded-md transition-colors",
                isActive ? "text-white font-medium bg-primary/20" : "text-slate-500 hover:text-white hover:bg-slate-800"
              )}
            >
              {item.label}
            </NavLink>
          ))}
        </motion.div>
      )}
    </div>
  );
};

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { 
      label: 'Master Data', 
      icon: Database, 
      path: '/accounts',
      submenu: [
        { label: 'Chart of Accounts', path: '/accounts' },
        { label: 'Customers', path: '/customers' },
        { label: 'Bank Accounts', path: '/account' },
      ]
    },
    { label: 'Transactions', icon: FileSpreadsheet, path: '/transactions' },
    { label: 'Receipts', icon: Receipt, path: '/receipts' },
    { 
      label: 'Sales & Orders', 
      icon: ShoppingCart, 
      path: '/sales-history',
      submenu: [
        { label: 'Sales History', path: '/sales-history' },
        { label: 'Sales Quotes', path: '/sales-quotes' },
        { label: 'Sales Orders', path: '/sales-orders' },
        { label: 'Sales Invoices', path: '/sales-invoices' },
        { label: 'Delivery Notes', path: '/delivery-notes' },
      ]
    },
    { label: 'Approvals', icon: CheckCircle, path: '/approvals', count: 3 },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 80 : 260 }}
      className="h-full bg-slate-900 border-r border-slate-800 flex flex-col z-20 relative"
    >
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 shrink-0">
        {!isCollapsed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20">
              E
            </div>
            <span className="font-bold text-xl tracking-tight text-white">ERP <span className="text-primary">Pro</span></span>
          </motion.div>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl mx-auto shadow-lg shadow-primary/20">
            E
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-colors absolute -right-4 top-14 bg-slate-900 border border-slate-800 shadow-sm z-30"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        {menuItems.map((item, index) => (
          <SidebarItem 
            key={index} 
            {...item} 
            isCollapsed={isCollapsed} 
          />
        ))}
      </div>

      <div className="p-4 border-t border-slate-800">
        <div className={cn(
          "bg-slate-800/50 rounded-xl p-3 flex items-center gap-3 border border-slate-800",
          isCollapsed && "justify-center"
        )}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold shadow-sm">
            JD
          </div>
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-white truncate">John Doe</p>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider truncate">Administrator</p>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
