import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { mockPurchaseOrders, mockPurchaseInvoices, savePurchaseOrders, savePurchaseInvoices, getCurrentUser } from '../mockData';
import { PurchaseOrder, ScreenPermission } from '../types';
import DataTable from '../components/shared/DataTable';
import Badge from '../components/shared/Badge';
import {
    ChevronRight, ChevronLeft, Search, Plus,
    ShoppingCart, FileText, Check, X, MoreHorizontal,
    Copy, Trash2, Printer, ChevronDown, ChevronUp,
    ChevronsLeft, ChevronsRight, Eye, Edit, ArrowUpDown, Calendar
} from 'lucide-react';
import { cn } from '../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Settings } from 'lucide-react';

const PurchaseOrdersView = () => {
    const navigate = useNavigate();
    const { supplierName } = useParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [pageSize, setPageSize] = useState(50);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortColumn, setSortColumn] = useState<string>('Order Date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isBatchOpsOpen, setIsBatchOpsOpen] = useState(false);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const batchOpsRef = useRef<HTMLDivElement>(null);

    const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
        const defaultVisible: Record<string, boolean> = {
            'Actions': true,
            'Order Date': true,
            'Reference': true,
            'Supplier': true,
            'Description': true,
            'Amount': true,
            'Status': true,
            'Timestamp': true
        };
        const saved = localStorage.getItem('purchase_order_column_settings');
        if (saved) {
            const parsed = JSON.parse(saved);
            const record: Record<string, boolean> = { 'Actions': true };
            parsed.forEach((col: any) => {
                const mapping: Record<string, string> = {
                    'orderdate': 'Order Date',
                    'reference': 'Reference',
                    'supplier': 'Supplier',
                    'description': 'Description',
                    'amount': 'Amount',
                    'status': 'Status',
                    'timestamp': 'Timestamp'
                };
                const normalizedId = mapping[col.id.toLowerCase()] || col.id;
                record[normalizedId] = col.visible;
            });
            return { ...defaultVisible, ...record };
        }
        return defaultVisible;
    });

    useEffect(() => {
        const updateVisibility = () => {
            const saved = localStorage.getItem('purchase_order_column_settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                const record: Record<string, boolean> = { 'Actions': true };
                parsed.forEach((col: any) => {
                    const mapping: Record<string, string> = {
                        'orderdate': 'Order Date',
                        'reference': 'Reference',
                        'supplier': 'Supplier',
                        'description': 'Description',
                        'amount': 'Amount',
                        'status': 'Status',
                        'timestamp': 'Timestamp'
                    };
                    const normalizedId = mapping[col.id.toLowerCase()] || col.id;
                    record[normalizedId] = col.visible;
                });
                setVisibleColumns(prev => ({ ...prev, ...record }));
            }
        };
        window.addEventListener('storage', updateVisibility);
        return () => window.removeEventListener('storage', updateVisibility);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (batchOpsRef.current && !batchOpsRef.current.contains(event.target as Node)) {
                setIsBatchOpsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const handleRefresh = () => setRefreshTrigger(prev => prev + 1);
        window.addEventListener('purchase_orders_updated', handleRefresh);
        window.addEventListener('storage', handleRefresh);
        return () => {
            window.removeEventListener('purchase_orders_updated', handleRefresh);
            window.removeEventListener('storage', handleRefresh);
        };
    }, []);

    const handleStatusChange = (id: string, newStatus: string, shouldNavigate: boolean = false) => {
        const orders = [...mockPurchaseOrders];
        const index = orders.findIndex(o => o.id === id);
        if (index !== -1) {
            const order = orders[index];
            const finalStatus = shouldNavigate ? 'Invoiced' : newStatus;
            (orders[index] as any).status = finalStatus;

            if (shouldNavigate) {
                const newInvoice = {
                    id: `PINV-${Date.now()}`,
                    issueDate: new Date().toLocaleDateString('en-GB').replace(/\//g, '.'),
                    dueDate: '30 Days',
                    reference: order.reference,
                    purchaseOrder: order.reference,
                    supplier: order.supplier,
                    description: order.description,
                    currency: order.currency,
                    invoiceAmount: order.amount as number,
                    balanceDue: order.amount as number,
                    status: 'Coming due',
                    items: order.items || [],
                    timestamp: new Date().toISOString()
                };
                mockPurchaseInvoices.unshift(newInvoice as any);
                savePurchaseInvoices(mockPurchaseInvoices);
                savePurchaseOrders(orders);
                setRefreshTrigger(prev => prev + 1);
                navigate('/purchase-invoices');
            } else {
                savePurchaseOrders(orders);
                setRefreshTrigger(prev => prev + 1);
            }
        }
    };

    const filteredData = useMemo(() => {
        let result = [...mockPurchaseOrders].filter(o => (o as any).status !== 'Invoiced' && (o as any).status !== 'Rejected');

        if (supplierName) {
            result = result.filter(o => (o.supplier || '').trim().toLowerCase() === supplierName.trim().toLowerCase());
        }

        const query = searchQuery.toLowerCase();
        if (query) {
            result = result.filter(o =>
                o.supplier.toLowerCase().includes(query) ||
                o.reference.toLowerCase().includes(query) ||
                o.description?.toLowerCase().includes(query)
            );
        }

        return result.sort((a, b) => {
            let valA: any = (a as any)[sortColumn] || '';
            let valB: any = (b as any)[sortColumn] || '';

            if (sortColumn === 'Order Date') {
                valA = (a.orderDate || '').split('.').reverse().join('-');
                valB = (b.orderDate || '').split('.').reverse().join('-');
            } else if (sortColumn === 'Timestamp') {
                const getSortTime = (ts?: string) => {
                    if (!ts) return 0;
                    const d = new Date(ts);
                    if (!isNaN(d.getTime())) return d.getTime();
                    return 0;
                };
                valA = getSortTime(a.timestamp);
                valB = getSortTime(b.timestamp);
            }

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [searchQuery, supplierName, refreshTrigger, sortColumn, sortDirection]);

    const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
    const displayData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const columns = [
        {
            id: 'Actions',
            header: 'Actions',
            accessor: (o: any) => (
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate(`/purchase-orders/view/${o.id}`)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Eye size={14} /></button>
                    <button onClick={() => navigate(`/purchase-orders/edit/${o.id}`)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={14} /></button>
                </div>
            )
        },
        {
            id: 'Order Date',
            header: 'Order Date',
            accessor: (o: any) => <span className="font-medium text-[13px] text-slate-800 whitespace-nowrap">{o.orderDate}</span>
        },
        {
            id: 'Reference',
            header: 'Reference',
            accessor: (o: any) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100/50">
                        <FileText size={14} />
                    </div>
                    <span className="font-bold text-slate-900 whitespace-nowrap">{o.reference}</span>
                </div>
            )
        },
        {
            id: 'Supplier',
            header: 'Supplier',
            accessor: (o: any) => <span className="font-medium text-slate-600 truncate max-w-[150px]" title={o.supplier}>{o.supplier}</span>
        },
        {
            id: 'Description',
            header: 'Description',
            accessor: (o: any) => <span className="text-xs text-slate-500 truncate max-w-[200px]" title={o.description}>{o.description || '—'}</span>
        },
        {
            id: 'Amount',
            header: 'Amount',
            className: 'text-right',
            accessor: (o: any) => (
                <div className="text-right font-black text-slate-900 whitespace-nowrap">
                    <span className="text-[10px] text-slate-400 mr-1">{o.currency}</span>
                    {o.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
            )
        },
        {
            id: 'Approval',
            header: 'Approval',
            accessor: (o: any) => (
                <div className="flex items-center gap-1.5 justify-center">
                    {(o.status === 'Draft' || o.status === 'Pending' || o.status === 'Ordered' || o.status === 'Pending Approval') ? (
                        <>
                            <button
                                onClick={() => handleStatusChange(o.id, 'Ordered', true)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg border border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50 hover:border-emerald-500 transition-all shadow-sm"
                                title="Approve & Invoice"
                            >
                                <Check size={14} strokeWidth={3} />
                            </button>
                            <button
                                onClick={() => handleStatusChange(o.id, 'Rejected')}
                                className="w-7 h-7 flex items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 hover:border-rose-500 transition-all shadow-sm"
                                title="Reject Order"
                            >
                                <X size={14} strokeWidth={3} />
                            </button>
                        </>
                    ) : (
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                            {o.status}
                        </span>
                    )}
                </div>
            )
        },
        {
            id: 'Timestamp',
            header: <div onClick={() => handleSort('Timestamp')} className="cursor-pointer hover:text-indigo-600 transition-colors flex items-center gap-1">Timestamp <ArrowUpDown size={10} /></div>,
            accessor: (o: any) => {
                if (!o.timestamp) return <span className="text-[10px] text-slate-300">—</span>;
                const d = new Date(o.timestamp);
                const display = !isNaN(d.getTime())
                    ? d.toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).replace(/\//g, '.').replace(',', '').toUpperCase()
                    : o.timestamp;
                return <span className="text-[10px] text-slate-400 font-medium font-sans whitespace-nowrap">{display}</span>;
            }
        }
    ];

    return (
        <div className="p-8 space-y-6 max-w-[1400px] animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center space-x-2 text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">
                        <ShoppingCart size={14} />
                        <span className="text-gray-400">Order Management</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 leading-tight">Purchase Orders</h1>
                    <p className="text-gray-500 text-sm">Issue and track orders sent to your suppliers.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/purchase-orders/new')}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 flex items-center"
                    >
                        <Plus size={16} className="mr-2" /> CREATE NEW PO
                    </button>
                </div>
            </div>

            <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4 flex-1">
                    <div className="relative flex-1 group max-w-xl">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            type="text"
                            placeholder="Search by supplier, reference, or description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-all"
                        />
                    </div>
                </div>

                <div className="flex flex-col items-end border-l border-slate-100 pl-8">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Orders</span>
                    <span className="text-[18px] font-bold text-gray-900">{filteredData.length}</span>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <DataTable
                    data={displayData}
                    columns={columns.filter(c => visibleColumns[c.id]) as any}
                    tableClassName="min-w-[1000px]"
                    hideDefaultPagination={true}
                />
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between bg-white px-8 py-6 rounded-[32px] border border-slate-100 shadow-sm gap-8 mt-8">
                <div className="flex flex-col items-start gap-1">
                    <div className="flex items-center gap-2 text-slate-400">
                        <button
                            onClick={() => { setCurrentPage(1); document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            disabled={currentPage === 1}
                            className="p-1 hover:text-indigo-600 disabled:opacity-20 transition-all"
                        >
                            <ChevronsLeft size={18} strokeWidth={1.5} />
                        </button>
                        <button
                            onClick={() => { setCurrentPage(prev => Math.max(1, prev - 1)); document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            disabled={currentPage === 1}
                            className="p-1 hover:text-indigo-600 disabled:opacity-20 transition-all mr-2"
                        >
                            <ChevronLeft size={18} strokeWidth={1.5} />
                        </button>
                        <span className="text-[13px] font-semibold text-slate-600 tracking-tight">Page {currentPage} of {totalPages || 1}</span>
                        <button
                            onClick={() => { setCurrentPage(prev => Math.min(totalPages, prev + 1)); document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="p-1 hover:text-indigo-600 disabled:opacity-20 transition-all ml-2"
                        >
                            <ChevronRight size={18} strokeWidth={1.5} />
                        </button>
                        <button
                            onClick={() => { setCurrentPage(totalPages); document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="p-1 hover:text-indigo-600 disabled:opacity-20 transition-all"
                        >
                            <ChevronsRight size={18} strokeWidth={1.5} />
                        </button>
                    </div>
                    <div className="flex items-center gap-6 mt-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">SHOW PER PAGE:</span>
                        <div className="flex items-center gap-4">
                            {[50, 100, 250, 500].map(size => (
                                <button
                                    key={size}
                                    onClick={() => { setPageSize(size); setCurrentPage(1); document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                    className={cn(
                                        "text-[11px] font-black transition-all relative py-1",
                                        pageSize === size ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    {size}
                                    {pageSize === size && <motion.div layoutId="activeOrderPageSize" className="absolute -bottom-1 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => {
                            const header = "Order Date\tReference\tSupplier\tDescription\tAmount\tStatus";
                            const rows = filteredData.map(o => 
                                `${o.orderDate}\t${o.reference}\t${o.supplier}\t${o.description || ''}\t${o.amount}\t${o.status}`
                            ).join('\n');
                            navigator.clipboard.writeText(`${header}\n${rows}`);
                            alert('Data copied to clipboard!');
                        }}
                        className="px-8 py-3.5 bg-white border border-slate-200 rounded-full text-[11px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-3 shadow-sm"
                    >
                        <Copy size={16} className="text-slate-400" /> EXPORT DATA
                    </button>
                    <div className="relative group" ref={batchOpsRef}>
                        <button 
                            onClick={() => setIsBatchOpsOpen(!isBatchOpsOpen)}
                            className="px-10 py-3.5 bg-indigo-600 text-white rounded-[20px] text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 flex items-center gap-4"
                        >
                            MANAGEMENT <ChevronUp size={16} className={cn("transition-transform", isBatchOpsOpen && "rotate-180")} />
                        </button>
                        {isBatchOpsOpen && (
                            <div className="absolute bottom-full right-0 mb-4 w-56 bg-white border border-gray-100 shadow-2xl rounded-2xl py-3 z-[100] animate-in slide-in-from-bottom-2 duration-200 overflow-hidden">
                                <button 
                                    onClick={() => { setIsSelectionMode(!isSelectionMode); setIsBatchOpsOpen(false); }} 
                                    className="w-full text-left px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                                >
                                    {isSelectionMode ? 'Disable Batch Mode' : 'Enable Batch Actions'}
                                </button>
                                <button 
                                    onClick={() => { navigate('/purchase-orders/edit-columns'); setIsBatchOpsOpen(false); }}
                                    className="w-full text-left px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                                >
                                    Column Setting
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PurchaseOrdersView;
