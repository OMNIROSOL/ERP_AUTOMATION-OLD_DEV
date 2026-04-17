import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockSalesQuotes, mockSalesOrders, mockInvoices, getDeliveryNotes, mockReceipts, getInvoices } from '../mockData';
import { Eye, Edit, Copy, FileText, Search, MoreVertical, ChevronDown, Filter, Trash2, X, ChevronUp, ArrowUpDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Calendar, Printer } from 'lucide-react';
import { cn } from '../utils/cn';

const SalesHistoryView = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const [sortColumn, setSortColumn] = useState<string>('date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [pageSize, setPageSize] = useState(50);
    const [currentPage, setCurrentPage] = useState(1);
    const [isBatchOpsOpen, setIsBatchOpsOpen] = useState(false);
    const batchOpsRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        const handleRefresh = () => setRefreshTrigger(prev => prev + 1);
        window.addEventListener('storage', handleRefresh);
        window.addEventListener('invoices_updated', handleRefresh);
        return () => {
            window.removeEventListener('storage', handleRefresh);
            window.removeEventListener('invoices_updated', handleRefresh);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdownId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const allHistory = useMemo(() => {
        const history: any[] = [];
        const deliveryNotes = getDeliveryNotes();
        const deliveredRefs = new Set(
            deliveryNotes.map((dn: any) => dn.reference || dn.invoiceNumber).filter(Boolean)
        );

        mockSalesQuotes.forEach(q => {
            let status = q.status;
            if (status === 'Active' && q.issueDate && q.expiryDays) {
                const [d, m, y] = q.issueDate.split('.');
                const expDate = new Date(`${y}-${m}-${d}`);
                expDate.setHours(23, 59, 59, 999);
                expDate.setDate(expDate.getDate() + parseInt(q.expiryDays));
                if (new Date() > expDate) status = 'Expired';
            }
            history.push({
                id: q.id,
                date: q.issueDate,
                customer: q.customer,
                amount: q.amount,
                type: 'Quote',
                reference: q.reference || '—',
                status: status,
                timestamp: q.timestamp || '—'
            });
        });

        mockSalesOrders.forEach(o => {
            history.push({
                id: o.id,
                date: o.orderDate,
                customer: o.customer,
                amount: o.amount,
                type: 'Order',
                reference: o.reference || '—',
                status: o.status,
                timestamp: o.timestamp || '—'
            });
        });

        getInvoices().forEach(i => {
            const isDelivered = deliveredRefs.has(i.reference) || deliveredRefs.has(i.id);
            history.push({
                id: i.id,
                date: i.issueDate,
                customer: i.customer,
                amount: i.invoiceAmount,
                type: 'Invoiced',
                reference: i.reference || '—',
                status: i.status,
                dueDate: i.dueDate,
                balanceDue: i.balanceDue,
                timestamp: i.timestamp || '—'
            });
        });

        mockReceipts.forEach(r => {
            history.push({
                id: r.id,
                date: r.date,
                customer: r.paidByContact,
                amount: r.amount,
                type: 'Receipt',
                reference: r.reference || '—',
                status: r.status,
                timestamp: r.timestamp || '—'
            });
        });

        deliveryNotes.forEach(dn => {
            history.push({
                id: dn.id,
                date: dn.deliveryDate,
                customer: dn.customer,
                amount: 0,
                type: 'Delivery',
                reference: dn.reference || '—',
                status: dn.status,
                timestamp: dn.timestamp || '—'
            });
        });

        return history;
    }, [refreshTrigger]);

    const getComputedStatus = (item: any): string => {
        if (item.type === 'Delivery' && !item.status) return 'Pending';
        if (item.type !== 'Invoiced') return item.status || '—';
        const balance = item.balanceDue !== undefined && item.balanceDue !== null
            ? parseFloat(item.balanceDue)
            : parseFloat(item.amount ?? 0);
        if (balance < 0) return 'Overpaid';
        if (balance === 0) return 'Paid in full';
        if (!item.dueDate) return 'Unpaid';
        const parts = item.dueDate.split('.');
        if (parts.length !== 3) return 'Unpaid';
        const due = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        const today = new Date(); today.setHours(0, 0, 0, 0); due.setHours(0, 0, 0, 0);
        const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
        if (diff === -1) return 'Yesterday due';
        if (diff === 0) return 'Today due';
        if (diff === 1) return 'Tomorrow due';
        if (diff > 1) return 'Unpaid';
        return 'Overdue';
    };

    const filteredHistory = useMemo(() => {
        const result = allHistory.filter(item => {
            const itemStatus = getComputedStatus(item);
            const matchesSearch =
                item.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.customer.toLowerCase().includes(searchQuery.toLowerCase());
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

            if (sortColumn === 'status') {
                valA = getComputedStatus(a);
                valB = getComputedStatus(b);
            }

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [allHistory, searchQuery, typeFilter, statusFilter, sortColumn, sortDirection]);

    const totalPages = Math.ceil(filteredHistory.length / pageSize);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredHistory.slice(start, start + pageSize);
    }, [filteredHistory, currentPage, pageSize]);

    const handleCopyToClipboard = () => {
        const header = "Date\tReference\tCustomer\tType\tAmount\tStatus";
        const rows = filteredHistory.map(item =>
            `${item.date}\t${item.reference || ''}\t${item.customer}\t${item.type}\t${item.amount}\t${getComputedStatus(item)}`
        ).join('\n');
        const fullText = `${header}\n${rows}`;

        const textArea = document.createElement("textarea");
        textArea.value = fullText;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            alert('Data copied to clipboard');
        } catch (err) {
            console.error('Fallback: Oops, unable to copy', err);
        }
        document.body.removeChild(textArea);
    };

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const SortIcon = ({ column }: { column: string }) => {
        if (sortColumn !== column) return <ArrowUpDown size={12} className="ml-1 opacity-20 group-hover:opacity-50" />;
        return sortDirection === 'asc' ? <ChevronUp size={12} className="ml-1 text-blue-500" /> : <ChevronDown size={12} className="ml-1 text-blue-500" />;
    };

    const statusOptions = useMemo(() => {
        const statuses = new Set<string>();
        allHistory.forEach(item => {
            statuses.add(getComputedStatus(item));
        });
        return Array.from(statuses).sort();
    }, [allHistory]);

    return (
        <div className="p-8 space-y-8 w-full animate-in fade-in duration-700 relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center space-x-2 text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">
                        <FileText size={14} />
                        <span className="text-gray-400">Commercial Operations</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 leading-tight">Sales History</h1>
                    <p className="text-gray-500 text-sm">Unified lifecycle tracking for quotes, orders, and invoices</p>
                </div>
            </div>

            <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-6 pb-2">
                <div className="flex items-center gap-4 flex-1 w-full">
                    <div className="relative flex-1 group max-w-xl">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-blue-500" size={14} />
                        <input
                            type="text"
                            placeholder="Search by reference or customer..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="bg-white border border-gray-300 text-slate-600 text-[11px] font-black uppercase tracking-wider rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all shadow-sm"
                        >
                            <option value="All">All Types</option>
                            <option value="Quote">Quote</option>
                            <option value="Order">Order</option>
                            <option value="Invoiced">Invoiced</option>
                            <option value="Receipt">Receipt</option>
                            <option value="Delivery">Delivery Note</option>
                        </select>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-white border border-gray-300 text-slate-600 text-[11px] font-black uppercase tracking-wider rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all shadow-sm"
                        >
                            <option value="All">All Statuses</option>
                            {statusOptions.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                        <button onClick={() => { setSearchQuery(''); setTypeFilter('All'); setStatusFilter('All'); }} className="flex items-center justify-center w-9 h-9 rounded-md bg-white border border-gray-300 text-gray-400 hover:text-red-500 hover:border-red-300 transition-all shadow-sm" title="Clear Filters">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                <div className="hidden lg:flex flex-col items-end border-l border-slate-100 pl-8">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Total History</span>
                    <span className="text-[18px] font-bold text-gray-900 leading-none">
                        {filteredHistory.length}
                    </span>
                </div>
            </div>

            <div className="w-full mb-8 overflow-x-auto rounded-2xl border border-slate-100 shadow-sm shadow-indigo-50/50 bg-white">
                <table className="w-full text-left border-collapse">
                    <thead className="z-20">
                        <tr className="border-b border-slate-200">
                            <th className="sticky top-[-1rem] lg:top-[-2rem] z-10 bg-slate-50/95 backdrop-blur-sm px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-24 border-b border-slate-200/50">Actions</th>
                            <th onClick={() => handleSort('date')} className="sticky top-[-1rem] lg:top-[-2rem] z-10 bg-slate-50/95 backdrop-blur-sm px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer group hover:bg-slate-100 transition-colors border-b border-slate-200/50">
                                <div className="flex items-center gap-2">Date <SortIcon column="date" /></div>
                            </th>
                            <th className="sticky top-[-1rem] lg:top-[-2rem] z-10 bg-slate-50/95 backdrop-blur-sm px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200/50">
                                Type
                            </th>
                            <th onClick={() => handleSort('reference')} className="sticky top-[-1rem] lg:top-[-2rem] z-10 bg-slate-50/95 backdrop-blur-sm px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer group hover:bg-slate-100 transition-colors border-b border-slate-200/50">
                                <div className="flex items-center gap-2">Reference <SortIcon column="reference" /></div>
                            </th>
                            <th onClick={() => handleSort('customer')} className="sticky top-[-1rem] lg:top-[-2rem] z-10 bg-slate-50/95 backdrop-blur-sm px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer group hover:bg-slate-100 transition-colors border-b border-slate-200/50">
                                <div className="flex items-center gap-2">Customer <SortIcon column="customer" /></div>
                            </th>
                            <th onClick={() => handleSort('amount')} className="sticky top-[-1rem] lg:top-[-2rem] z-10 bg-slate-50/95 backdrop-blur-sm px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer group hover:bg-slate-100 transition-colors border-b border-slate-200/50 text-right">
                                <div className="flex items-center justify-end gap-2">Amount <SortIcon column="amount" /></div>
                            </th>
                            <th className="sticky top-[-1rem] lg:top-[-2rem] z-10 bg-slate-50/95 backdrop-blur-sm px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border-b border-slate-200/50">
                                Status
                            </th>
                            <th onClick={() => handleSort('timestamp')} className="sticky top-[-1rem] lg:top-[-2rem] z-10 bg-slate-50/95 backdrop-blur-sm px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer group hover:bg-slate-100 transition-colors border-b border-slate-200/50">
                                <div className="flex items-center gap-2">Timestamp <SortIcon column="timestamp" /></div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {paginatedData.length > 0 ? (
                            paginatedData.map((item) => (
                                <tr key={`${item.type}-${item.id}`} className="group bg-white hover:bg-[#F7F9FC] transition-colors duration-150">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-4">
                                            <button
                                                onClick={() => {
                                                    let route = '';
                                                    if (item.type === 'Quote') route = `/sales-quotes/view/${item.id}`;
                                                    else if (item.type === 'Order') route = `/sales-orders/view/${item.id}`;
                                                    else if (item.type === 'Invoiced') route = `/sales-invoices/view/${item.id}`;
                                                    else if (item.type === 'Receipt') route = `/receipts/view/${item.id}`;
                                                    else if (item.type === 'Delivery') route = `/delivery-notes/view/${item.id}`;
                                                    if (route) navigate(route);
                                                }}
                                                className="text-slate-400 hover:text-indigo-600 transition-colors hover:scale-110 active:scale-95"
                                                title="View"
                                            >
                                                <Eye size={14} />
                                            </button>

                                            <button
                                                onClick={() => {
                                                    let editRoute = '';
                                                    if (item.type === 'Quote') editRoute = `/sales-quotes/edit/${item.id}`;
                                                    else if (item.type === 'Order') editRoute = `/sales-orders/edit/${item.id}`;
                                                    else if (item.type === 'Invoiced') editRoute = `/sales-invoices/edit/${item.id}`;
                                                    if (editRoute) navigate(editRoute);
                                                }}
                                                className="text-slate-400 hover:text-blue-600 transition-colors hover:scale-110 active:scale-95"
                                                title="Edit"
                                            >
                                                <Edit size={14} />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-[13px] font-medium text-slate-800 tracking-normal">{item.date}</td>
                                    <td className="px-6 py-4 text-left">
                                        <span className={cn(
                                            "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border inline-block",
                                            item.type === 'Quote' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                item.type === 'Order' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                    item.type === 'Invoiced' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                        item.type === 'Receipt' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                            item.type === 'Delivery' ? 'bg-slate-50 text-slate-600 border-slate-100' :
                                                                'bg-emerald-50 text-emerald-600 border-emerald-100'
                                        )}>
                                            {item.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100/50">
                                                <FileText size={14} />
                                            </div>
                                            <span className="font-medium text-[13px] text-slate-900 tracking-tight">{item.reference}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-medium text-[13px] text-slate-600">{item.customer}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="text-right">
                                            <span className="text-[10px] text-slate-400 font-bold mr-1">ZMW</span>
                                            <span className="font-black text-[13px] text-slate-900">
                                                {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {(() => {
                                            const ds = getComputedStatus(item);
                                            const color =
                                                ds === 'Paid in full' || ds === 'Delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    ds === 'Overpaid' || ds === 'Shipped' || ds === 'Packed' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                        ds === 'Overdue' || ds === 'Yesterday due' || ds === 'Rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                            ds === 'Unpaid' || ds === 'Active' || ds === 'Ordered' || ds === 'Pending' || ds === 'To Deliver' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                                'bg-slate-100 text-slate-600 border-slate-200';
                                            return (
                                                <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border whitespace-nowrap", color)}>
                                                    {ds}
                                                </span>
                                            );
                                        })()}
                                    </td>
                                    <td className="px-6 py-4 text-[10px] font-medium text-slate-400 font-sans tracking-tight whitespace-nowrap">
                                        {item.timestamp}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={8} className="px-6 py-12 text-center text-slate-400 italic">
                                    No transaction history available for the current filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Management Card - Standard Style */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm mt-4 ml-0 mr-auto max-w-[1200px]">
                <div className="flex flex-col items-center space-y-2">
                    <div className="flex items-center space-x-2 text-[12px] text-slate-500 font-medium whitespace-nowrap">
                        <button
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="p-1 rounded-md hover:bg-slate-100 disabled:opacity-30 transition-all active:scale-90"
                        >
                            <ChevronsLeft size={16} />
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="p-1 rounded-md hover:bg-slate-100 disabled:opacity-30 transition-all active:scale-90"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="mx-2 text-slate-700">Page {currentPage} of {totalPages || 1}</span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="p-1 rounded-md hover:bg-slate-100 disabled:opacity-30 transition-all active:scale-90"
                        >
                            <ChevronRight size={16} />
                        </button>
                        <button
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="p-1 rounded-md hover:bg-slate-100 disabled:opacity-30 transition-all active:scale-90"
                        >
                            <ChevronsRight size={16} />
                        </button>
                    </div>

                    <div className="flex items-center space-x-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Show per page:</span>
                        <div className="flex items-center gap-4">
                            {[25, 50, 100, 250].map(size => (
                                <button
                                    key={size}
                                    onClick={() => { setPageSize(size); setCurrentPage(1); }}
                                    className={`text-[10px] font-black transition-all ${pageSize === size ? 'text-indigo-600 underline underline-offset-4 decoration-2' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleCopyToClipboard}
                        className="px-4 py-2 bg-slate-50 text-[11px] font-black text-slate-500 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-200/50 uppercase tracking-widest flex items-center gap-2 shadow-sm"
                    >
                        <Copy size={12} /> Export Data
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SalesHistoryView;
