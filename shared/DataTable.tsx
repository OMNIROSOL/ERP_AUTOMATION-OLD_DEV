import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Filter, 
  Download,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  Check,
  ChevronDown
} from 'lucide-react';
import { cn } from '../../utils/cn';
import Button from './Button';

interface Column<T> {
  header: React.ReactNode;
  accessor: keyof T | ((item: T) => React.ReactNode);
  sortable?: boolean;
  className?: string; // Add optional className for custom column styling
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  onSearch?: (value: string) => void;
  onFilter?: () => void;
  onExport?: () => void;
  footer?: React.ReactNode;
  hideDefaultPagination?: boolean;
}

const DataTable = <T extends { id?: string | number }>({
  data,
  columns,
  title,
  subtitle,
  actions,
  onSearch,
  onFilter,
  onExport,
  footer,
  hideDefaultPagination,
}: DataTableProps<T>) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(data.length / itemsPerPage);
  
  const paginatedData = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-[0_2px_8px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col h-full">
      {/* Table Header Area */}
      <div className="px-6 py-4 border-b border-[#F3F4F6] bg-white flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          {title && (
            <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              {title}
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-widest leading-none">
                {data.length} total
              </span>
            </h3>
          )}
          {subtitle && <p className="text-sm font-medium text-slate-500 mt-1">{subtitle}</p>}
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group flex-1 min-w-[240px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] group-focus-within:text-[#4F46E5] transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search everything..." 
              onChange={(e) => onSearch?.(e.target.value)}
              className="w-full bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg py-2 pl-11 pr-4 text-sm focus:ring-4 focus:ring-[#4F46E5]/5 focus:border-[#4F46E5] transition-all outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="md" icon={Filter} onClick={onFilter} className="rounded-2xl border-slate-200 px-4">Filter</Button>
            <Button variant="outline" size="md" icon={Download} onClick={onExport} className="rounded-2xl border-slate-200 px-4 hover:bg-slate-50">Export</Button>
            {actions}
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse table-auto">
          <thead>
            <tr className="bg-[#F1F3F5]">
              {columns.map((column, idx) => (
                <th key={idx} className="px-6 py-3.5 text-xs font-semibold text-[#374151] uppercase tracking-wider border-b border-[#E5E7EB]">
                  <div className="flex items-center gap-2 group cursor-pointer hover:text-[#111827] transition-colors">
                    {column.header}
                    {column.sortable && <ChevronDown size={14} className="opacity-0 group-hover:opacity-50 transition-all" />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIdx) => (
                <tr key={row.id || rowIdx} className="bg-white hover:bg-[#F7F9FC] transition-colors duration-150">
                  {columns.map((column, colIdx) => (
                    <td key={colIdx} className={cn(
                      "px-6 py-4 text-sm text-[#4B5563] transition-all border-b border-[#F3F4F6]",
                      column.className || "whitespace-normal"
                    )}>
                      {typeof column.accessor === 'function' 
                        ? column.accessor(row) 
                        : (row[column.accessor as keyof T] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + 1} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3 opacity-40">
                    <Search size={48} className="text-slate-300" />
                    <p className="text-lg font-bold text-slate-400">No matching records found</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Container or Footer */}
      {footer ? (
        footer
      ) : (
        !hideDefaultPagination && (
          <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-between bg-white">
            <div className="hidden sm:block">
              <p className="text-sm text-slate-400 font-bold tracking-tight">
                Showing <span className="text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-900 font-black">{Math.min(currentPage * itemsPerPage, data.length)}</span> of <span className="text-slate-900 font-black">{data.length}</span> entries
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                icon={ChevronLeft} 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="rounded-xl px-2 h-9 border-none hover:bg-slate-100 disabled:opacity-30"
              />
              <div className="flex items-center gap-1.5 mx-2">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={cn(
                      "min-w-[36px] h-9 rounded-xl text-sm font-black transition-all duration-200",
                      currentPage === i + 1 
                        ? "bg-primary text-white shadow-lg shadow-primary/30 scale-110" 
                        : "text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                icon={ChevronRight} 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="rounded-xl px-2 h-9 border-none hover:bg-slate-100 disabled:opacity-30"
              />
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default DataTable;
