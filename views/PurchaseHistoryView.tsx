import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockPurchaseOrders, mockPurchaseInvoices, mockGoodsReceivedNotes, getPurchaseInvoices } from '../mockData';
import { Eye, Edit, Copy, FileText, Search, MoreVertical, ChevronDown, Filter, Trash2, X, ChevronUp, ArrowUpDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Calendar, Printer, ShoppingCart } from 'lucide-react';
import { cn } from '../utils/cn';

const PurchaseHistoryView = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [sortColumn, setSortColumn] = useState<string>('date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [pageSize, setPageSize] = useState(50);
    const [currentPage, setCurrentPage] = useState(1);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        const handleRefresh = () => setRefreshTrigger(prev => prev + 1);
        window.addEventListener('storage', handleRefresh);
        return () => window.removeEventListener('storage', handleRefresh);
    }, []);

    const allHistory = useMemo(() => {
        const history: any[] = [];
        
        mockPurchaseOrders.forEach(o => {
            history.push({
                id: o.id,
                date: o.orderDate,
                supplier: o.supplier,
                amount: o.amount,
                type: 'Order',
                reference: o.reference || '—',
                status: o.status,
                timestamp: o.timestamp || '—'
            });
        });

        getPurchaseInvoices().forEach(i => {
            history.push({
                id: i.id,
                date: i.issueDate,
                supplier: i.supplier,
                amount: i.invoiceAmount,
                type: 'Invoiced',
                reference: i.reference || '—',
                status: i.status,
                dueDate: i.dueDate,
                balanceDue: i.balanceDue,
                timestamp: i.timestamp || '—'
            });
        });

        mockGoodsReceivedNotes.forEach(g => {
            history.push({
                id: g.id,
                date: g.receivedDate,
                supplier: g.supplier,
                amount: 0,
                type: 'GRN',
                reference: g.reference || '—',
                status: g.status,
                timestamp: g.timestamp || '—'
            });
        });

        return history;
    }, [refreshTrigger]);

    const getComputedStatus = (item: any): string => {
        if (item.type !== 'Invoiced') return item.status || '—';
        const balance = item.balanceDue ?? item.amount;
        if (balance === 0) return 'Paid in full';
        if (!item.dueDate) return 'Unpaid';
        const parts = item.dueDate.split('.');
        if (parts.length !== 3) return 'Unpaid';
        const due = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        const today = new Date(); today.setHours(0,0,0,0); due.setHours(0,0,0,0);
        if (due < today && balance > 0) return 'Overdue';
        return item.status || 'Unpaid';
    };

    const filteredHistory = useMemo(() => {
        const result = allHistory.filter(item => {
            const itemStatus = getComputedStatus(item);
            const matchesSearch =
                item.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.supplier.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = typeFilter === 'All' || item.type === typeFilter;
            const matchesStatus = statusFilter === 'All' || itemStatus === statusFilter;
            return matchesSearch && matchesType && matchesStatus;
        });

        return result.sort((a, b) => {
            let valA = a[sortColumn];
            let valB = b[sortColumn];

            if (sortColumn === 'date') {
                valA = (valA || '').split('.').reverse().join('-');
                valB = (valB || '').split('.').reverse().join('-');
            }

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [allHistory, searchQuery, typeFilter, statusFilter, sortColumn, sortDirection]);

    const totalPages = Math.ceil(filteredHistory.length / pageSize) || 1;
    const paginatedData = filteredHistory.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    return (
        <div className="p-8 space-y-8 w-full animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center space-x-2 text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">
                        <ShoppingCart size={14} />
                        <span className="text-gray-400">Procurement Operations</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 leading-tight">Purchase History</h1>
                    <p className="text-gray-500 text-sm">Unified lifecycle tracking for purchase orders and invoices</p>
                </div>
            </div>

            <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4 flex-1 w-full">
                    <div className="relative flex-1 group max-w-xl">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            type="text"
                            placeholder="Search by reference or supplier..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                        />
                    </div>

                    <div className="flex gap-3">
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="bg-white border border-gray-300 text-[11px] font-black uppercase tracking-wider rounded-md px-4 py-2 shadow-sm"
                        >
                            <option value="All">All Types</option>
                            <option value="Order">Order</option>
                            <option value="Invoiced">Invoiced</option>
                            <option value="GRN">GRN</option>
                        </select>
                        <button onClick={() => { setSearchQuery(''); setTypeFilter('All'); setStatusFilter('All'); }} className="p-2 border border-gray-300 rounded-md text-gray-400 hover:text-red-500 bg-white shadow-sm">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                <div className="hidden lg:flex flex-col items-end border-l border-slate-100 pl-8">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total History</span>
                    <span className="text-[18px] font-bold text-gray-900">{filteredHistory.length}</span>
                </div>
            </div>

            <div className="w-full mb-8 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-24">Actions</th>
                            <th onClick={() => handleSort('date')} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100">
                                Date
                            </th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                            <th onClick={() => handleSort('reference')} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100">
                                Reference
                            </th>
                            <th onClick={() => handleSort('supplier')} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100">
                                Supplier
                            </th>
                            <th onClick={() => handleSort('amount')} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right cursor-pointer hover:bg-slate-100">
                                Amount
                            </th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {paginatedData.map((item) => (
                            <tr key={`${item.type}-${item.id}`} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 text-center">
                                    <div className="flex justify-center gap-2">
                                        <button className="text-slate-400 hover:text-indigo-600 transition-colors"><Eye size={14} /></button>
                                        <button className="text-slate-400 hover:text-blue-600 transition-colors"><Edit size={14} /></button>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-[13px] font-medium text-slate-700">{item.date}</td>
                                <td className="px-6 py-4">
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                        item.type === 'Order' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                        item.type === 'Invoiced' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                        'bg-slate-50 text-slate-600 border-slate-100'
                                    )}>
                                        {item.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-[13px] font-bold text-slate-900">{item.reference}</td>
                                <td className="px-6 py-4 text-[13px] font-medium text-slate-600">{item.supplier}</td>
                                <td className="px-6 py-4 text-right font-black text-[13px] text-slate-900">
                                    {item.amount > 0 ? `ZMW ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={cn(
                                        "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border whitespace-nowrap",
                                        getComputedStatus(item) === 'Paid in full' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                        getComputedStatus(item) === 'Overdue' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                        'bg-amber-50 text-amber-600 border-amber-100'
                                    )}>
                                        {getComputedStatus(item)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-[11px] text-slate-400">{item.timestamp}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between bg-white p-6 rounded-xl border border-slate-200">
                <div className="flex gap-4 items-center text-sm font-medium text-slate-500">
                    <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="disabled:opacity-30"><ChevronLeft size={20} /></button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="disabled:opacity-30"><ChevronRight size={20} /></button>
                </div>
            </div>
        </div>
    );
};

export default PurchaseHistoryView;
