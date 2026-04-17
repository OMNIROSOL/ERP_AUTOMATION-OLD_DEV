import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
    Eye, Edit, ChevronRight, LayoutGrid, Search, Filter, Plus, UserPlus,
    Download, UserX, UserCheck, Users, Check, Copy, ChevronLeft,
    ChevronsLeft, ChevronsRight, ChevronDown, ChevronUp, Printer, HelpCircle,
    Building2
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { getSuppliers, mockPurchaseInvoices, mockPurchaseOrders, mockGoodsReceivedNotes } from '../mockData';
import { Supplier } from '../types';

const SuppliersView = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedNotification, setCopiedNotification] = useState(false);
    const [selectedSupplierIds, setSelectedSupplierIds] = useState<Set<string>>(new Set());
    const [isBatchViewMode, setIsBatchViewMode] = useState(() => localStorage.getItem('is_supplier_batch_view_mode') === 'true');
    const [isBatchOpsOpen, setIsBatchOpsOpen] = useState(false);
    const batchOpsRef = useRef<HTMLDivElement>(null);
    const [pageSize, setPageSize] = useState(50);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{ key: string | null, direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });
    const [showInactive, setShowInactive] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (batchOpsRef.current && !batchOpsRef.current.contains(event.target as Node)) {
                setIsBatchOpsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const [refreshTrigger, setRefreshTrigger] = useState(0);
    useEffect(() => {
        const handleFocus = () => setRefreshTrigger(prev => prev + 1);
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    useEffect(() => {
        localStorage.setItem('is_supplier_batch_view_mode', isBatchViewMode.toString());
    }, [isBatchViewMode]);

    const suppliers = useMemo(() => getSuppliers(), [refreshTrigger]);

    const defaultColumns = [
        { id: 'name', label: 'Supplier Name', visible: true },
        { id: 'division', label: 'Division', visible: true },
        { id: 'email', label: 'Email address', visible: false },
        { id: 'billingAddress', label: 'Billing address', visible: false },
        { id: 'purchaseOrders', label: 'Purchase Orders', visible: true },
        { id: 'purchaseInvoices', label: 'Purchase Invoices', visible: true },
        { id: 'goodsReceivedNotes', label: 'GRNs', visible: true },
        { id: 'status', label: 'Status', visible: true },
        { id: 'tpin', label: 'TPIN', visible: true },
        { id: 'balance', label: 'Accounts Payable', visible: true },
    ];

    const [columns, setColumns] = useState(() => {
        const saved = localStorage.getItem('supplier_column_settings');
        return saved ? JSON.parse(saved) : defaultColumns;
    });

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const sortedSuppliers = useMemo(() => {
        const query = searchQuery.toLowerCase();
        let result = suppliers.filter(s => {
            if (showInactive) {
                if (!s.inactive) return false;
            } else {
                if (s.inactive) return false;
            }
            const searchStr = `${s.name} ${s.code} ${s.division} ${s.status} ${s.tpin}`.toLowerCase();
            return searchStr.includes(query);
        });

        if (sortConfig.key) {
            result.sort((a: any, b: any) => {
                let aVal = a[sortConfig.key!] ?? '';
                let bVal = b[sortConfig.key!] ?? '';
                if (['balance', 'accountsPayable'].includes(sortConfig.key!)) {
                    aVal = Number(aVal) || 0;
                    bVal = Number(bVal) || 0;
                } else {
                    aVal = String(aVal).toLowerCase();
                    bVal = String(bVal).toLowerCase();
                }
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [suppliers, searchQuery, sortConfig, showInactive]);

    const currentSlice = sortedSuppliers.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const totalPages = Math.ceil(sortedSuppliers.length / pageSize) || 1;

    const totals = useMemo<Record<string, { balance: number }>>(() => {
        const res: Record<string, { balance: number }> = {};
        sortedSuppliers.forEach(s => {
            const curCode = String(s.currency || 'ZMW').split(' ')[0] || 'ZMW';
            if (!res[curCode]) res[curCode] = { balance: 0 };
            res[curCode].balance += Number(s.balance || 0);
        });
        return res;
    }, [sortedSuppliers]);

    const handleCopyToClipboard = () => {
        const header = columns.filter((c: any) => c.visible).map((c: any) => c.label).join('\t');
        const rows = sortedSuppliers.map((s: any) =>
            columns.filter((col: any) => col.visible).map((col: any) => s[col.id] || '').join('\t')
        ).join('\n');
        const fullText = `${header}\n${rows}`;

        if (navigator.clipboard) {
            navigator.clipboard.writeText(fullText).then(() => {
                setCopiedNotification(true);
                setTimeout(() => setCopiedNotification(false), 2000);
            });
        }
    };

    return (
        <div className="p-8 space-y-10 relative font-sans">
            {copiedNotification && (
                <div className="fixed top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-8 py-4 rounded-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-[9999] animate-in slide-in-from-top-4 fade-in duration-500 border border-white/10 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
                            <Check size={18} strokeWidth={3} />
                        </div>
                        <div>
                            <p className="font-black uppercase tracking-[0.2em] text-[11px] text-white">Export Successful</p>
                            <p className="text-[10px] text-slate-400 font-bold">Table data copied to system clipboard</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center space-x-2 text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">
                        <Building2 size={14} />
                        <span className="text-gray-400">Procurement Management</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
                    <p className="text-gray-500 text-sm">Directory of your vendors and supply chain partners</p>
                </div>

                <div className="flex space-x-4 items-center mb-1">
                    <button
                        onClick={() => navigate('/suppliers/new')}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-indigo-700 transition-all shadow-sm flex items-center"
                    >
                        <UserPlus size={16} className="mr-2" /> REGISTER SUPPLIER
                    </button>
                </div>
            </div>

            {/* Search & Stats */}
            <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4 flex-1">
                    <div className="relative flex-1 group max-w-2xl">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            type="text"
                            placeholder="Search by supplier name, TPIN, or division..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                        />
                    </div>
                </div>

                <div className="flex items-center space-x-8">
                    <div className="flex flex-col items-end border-l border-slate-100 pl-8">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Suppliers</span>
                        <span className="text-[18px] font-bold text-gray-900">{sortedSuppliers.length}</span>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-x-auto min-w-full mb-8">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-200">
                            <th className="px-6 py-4 text-[11px] font-black text-gray-500 uppercase tracking-wider text-center">Actions</th>
                            {columns.filter((c: any) => c.visible).map((col: any) => (
                                <th
                                    key={col.id}
                                    className="px-6 py-4 text-[11px] font-black text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort(col.id)}
                                >
                                    <div className="flex items-center gap-2">
                                        {col.label}
                                        <ChevronDown size={12} className={sortConfig.key === col.id ? 'text-indigo-600' : 'opacity-20'} />
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {currentSlice.map((supplier: any) => (
                            <tr key={supplier.id} className="group hover:bg-indigo-50/30 transition-all duration-200">
                                <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center space-x-1">
                                        <button
                                            onClick={() => navigate(`/suppliers/view/${supplier.id}`)}
                                            className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-100 transition-all"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        <button
                                            onClick={() => navigate(`/suppliers/edit/${supplier.id}`)}
                                            className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-100 transition-all"
                                        >
                                            <Edit size={16} />
                                        </button>
                                    </div>
                                </td>
                                {columns.filter((c: any) => c.visible).map((col: any) => {
                                    const val = supplier[col.id];

                                    if (col.id === 'balance') {
                                        return (
                                            <td key={col.id} className="px-6 py-4">
                                                <span className="text-[13px] font-black text-slate-900">
                                                    {supplier.currency || 'ZMW'} {Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </span>
                                            </td>
                                        );
                                    }

                                    if (col.id === 'status') {
                                        const isPaid = val === 'Paid';
                                        return (
                                            <td key={col.id} className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${isPaid ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                                    {val}
                                                </span>
                                            </td>
                                        );
                                    }

                                    if (['purchaseOrders', 'purchaseInvoices', 'goodsReceivedNotes'].includes(col.id)) {
                                        let count = 0;
                                        if (col.id === 'purchaseOrders') count = mockPurchaseOrders.filter(o => o.supplier === supplier.name).length;
                                        if (col.id === 'purchaseInvoices') count = mockPurchaseInvoices.filter(i => i.supplier === supplier.name).length;
                                        if (col.id === 'goodsReceivedNotes') count = mockGoodsReceivedNotes.filter(g => g.supplier === supplier.name).length;

                                        return (
                                            <td key={col.id} className="px-6 py-4">
                                                <span className={`text-[13px] font-bold ${count > 0 ? 'text-indigo-600 underline' : 'text-slate-300'}`}>
                                                    {count}
                                                </span>
                                            </td>
                                        );
                                    }

                                    return (
                                        <td key={col.id} className="px-6 py-4">
                                            <span className="text-[13px] font-medium text-slate-600">{val || '—'}</span>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-50/50 border-t border-gray-200">
                        <tr>
                            <td className="px-6 py-4"></td>
                            {columns.filter((c: any) => c.visible).map((col: any) => {
                                if (col.id === 'balance') {
                                    return (
                                        <td key={`total-${col.id}`} className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                {(Object.entries(totals) as [string, { balance: number }][]).map(([cur, t]) => (
                                                    <div key={cur} className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black text-slate-400">{cur}</span>
                                                        <span className="text-[13px] font-black text-slate-900">{t.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                    );
                                }
                                if (col.id === 'name') {
                                    return <td key={`total-${col.id}`} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Grand Totals</td>;
                                }
                                return <td key={`total-${col.id}`} className="px-6 py-4"></td>;
                            })}
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Pagination & Export */}
            <div className="flex items-center justify-between pb-20">
                <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
                    <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={handleCopyToClipboard}
                        className="px-6 py-2 bg-white border border-gray-300 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2"
                    >
                        <Copy size={14} /> Copy to Clipboard
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SuppliersView;
