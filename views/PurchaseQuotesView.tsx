import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockPurchaseQuotes, mockPurchaseOrders, savePurchaseQuotes, getCurrentUser, getRoleById, initialRoleDefinitions } from '../mockData';
import { PurchaseQuote, ScreenPermission } from '../types';
import { useEffect } from 'react';
import Button from '../components/shared/Button';
import Badge from '../components/shared/Badge';
import Card from '../components/shared/Card';
import DataTable from '../components/shared/DataTable';
import {
    Plus, Copy, FileText, Check, X, Eye, Edit, Printer, ChevronRight, ChevronLeft, Search, Share2,
    ChevronsLeft, ChevronsRight, ChevronDown, ChevronUp, LayoutGrid, HelpCircle, ArrowUpDown
} from 'lucide-react';
import { cn } from '../utils/cn';

const PurchaseQuotesView = () => {
    const navigate = useNavigate();
    const { supplierName } = useParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [pageSize, setPageSize] = useState(50);
    const [currentPage, setCurrentPage] = useState(1);
    const [copiedNotification, setCopiedNotification] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [sortColumn, setSortColumn] = useState<string>('Issue Date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [isBatchOpsOpen, setIsBatchOpsOpen] = useState(false);
    const batchOpsRef = React.useRef<HTMLDivElement>(null);
    const [currentUser, setCurrentUser] = useState(getCurrentUser());
    const [perms, setPerms] = useState<ScreenPermission | null>(null);

    useEffect(() => {
        const handleUserUpdate = () => setCurrentUser(getCurrentUser());
        window.addEventListener('user_sim_updated', handleUserUpdate);

        const role = getRoleById(currentUser.roleId || '') || initialRoleDefinitions.find(r => r.name === currentUser.role);
        const screenPerm = role?.permissions.find(p => p.screenId === 'purchase-quotes');
        setPerms(screenPerm || null);

        return () => window.removeEventListener('user_sim_updated', handleUserUpdate);
    }, [currentUser]);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (batchOpsRef.current && !batchOpsRef.current.contains(event.target as Node)) {
                setIsBatchOpsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
        const defaultVisible: Record<string, boolean> = {
            'Actions': true,
            'Issue Date': true,
            'Expiry Date': true,
            'Reference': true,
            'Supplier': true,
            'Description': true,
            'Amount': true,
            'Status': true,
            'Timestamp': true
        };

        const saved = localStorage.getItem('purchase_quote_column_settings');
        if (saved) {
            const parsed = JSON.parse(saved);
            const record: Record<string, boolean> = { 'Actions': true };

            parsed.forEach((col: any) => {
                const mapping: Record<string, string> = {
                    'issuedate': 'Issue Date',
                    'expirydate': 'Expiry Date',
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

    const toggleColumnVisibility = (id: string) => {
        const newVisible = { ...visibleColumns, [id]: !visibleColumns[id] };
        setVisibleColumns(newVisible);

        const columnsToSave = [
            { id: 'Issue Date', label: 'Issue date', visible: newVisible['Issue Date'] ?? true },
            { id: 'Expiry Date', label: 'Expiry date', visible: newVisible['Expiry Date'] ?? true },
            { id: 'Reference', label: 'Reference', visible: newVisible['Reference'] ?? true },
            { id: 'Supplier', label: 'Supplier', visible: newVisible['Supplier'] ?? true },
            { id: 'Description', label: 'Description', visible: newVisible['Description'] ?? true },
            { id: 'Amount', label: 'Amount', visible: newVisible['Amount'] ?? true },
            { id: 'Status', label: 'Status', visible: newVisible['Status'] ?? true },
            { id: 'Timestamp', label: 'Timestamp', visible: newVisible['Timestamp'] ?? false },
        ];
        localStorage.setItem('purchase_quote_column_settings', JSON.stringify(columnsToSave));
        window.dispatchEvent(new Event('storage'));
    };

    const handleStatusChange = (id: string, newStatus: PurchaseQuote['status']) => {
        const index = mockPurchaseQuotes.findIndex(q => q.id === id);
        if (index !== -1) {
            const quote = mockPurchaseQuotes[index];
            quote.status = newStatus;
            if (newStatus === 'Accepted') {
                const newOrder = {
                    id: `po-${Date.now()}`,
                    orderDate: new Date().toLocaleDateString('en-GB').replace(/\//g, '.'),
                    reference: quote.reference,
                    supplier: quote.supplier,
                    description: quote.description || `Converted from Quote ${quote.reference}`,
                    currency: quote.currency,
                    amount: quote.amount,
                    status: 'Ordered',
                    billingAddress: quote.billingAddress || '',
                    timestamp: new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).replace(/\//g, '.').replace(',', '').toUpperCase(),
                    items: quote.items ? [...quote.items] : []
                };
                mockPurchaseOrders.unshift(newOrder);
                savePurchaseQuotes(mockPurchaseQuotes);
                navigate('/purchase-orders');
                return;
            }
            savePurchaseQuotes(mockPurchaseQuotes);
            setRefreshTrigger(prev => prev + 1);
        }
    };

    const copyToClipboard = (data: PurchaseQuote[]) => {
        const header = "Issue Date\tReference\tSupplier\tDescription\tAmount\tStatus\tTimestamp";
        const rows = data.map(q =>
            `${q.issueDate}\t${q.reference}\t${q.supplier}\t${q.description || ''}\t${q.amount}\t${q.status}\t${q.timestamp || ''}`
        ).join('\n');
        const fullText = `${header}\n${rows}`;

        if (navigator.clipboard) {
            navigator.clipboard.writeText(fullText).then(() => {
                setCopiedNotification(true);
                setTimeout(() => setCopiedNotification(false), 2000);
            });
        }
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
        return sortDirection === 'asc' ? <ChevronUp size={12} className="ml-1 text-indigo-500" /> : <ChevronDown size={12} className="ml-1 text-indigo-500" />;
    };

    const handleCopyToClipboard = () => copyToClipboard(filteredData);

    const handleBatchCopy = () => {
        const selectedQuotes = mockPurchaseQuotes.filter(q => selectedIds.includes(q.id));
        copyToClipboard(selectedQuotes);
    };

    const filteredData = useMemo(() => {
        let result = [...mockPurchaseQuotes].filter(q => {
            if (q.status === 'Accepted' || q.status === 'Rejected') return false;
            return true;
        });
        if (supplierName) {
            result = result.filter(q => q.supplier.toLowerCase() === supplierName.toLowerCase());
        }
        if (statusFilter !== 'All') {
            result = result.filter(q => q.status === statusFilter);
        }
        const query = searchQuery.toLowerCase();
        if (query) {
            result = result.filter(q =>
                q.supplier.toLowerCase().includes(query) ||
                q.reference.toLowerCase().includes(query) ||
                q.status.toLowerCase().includes(query) ||
                q.issueDate.toLowerCase().includes(query)
            );
        }
        return result.sort((a, b) => {
            let valA: any = a[sortColumn as keyof PurchaseQuote] || '';
            let valB: any = b[sortColumn as keyof PurchaseQuote] || '';
            if (sortColumn === 'Issue Date') {
                valA = (a.issueDate || '').split('.').reverse().join('-');
                valB = (b.issueDate || '').split('.').reverse().join('-');
            } else if (sortColumn === 'Amount') {
                valA = parseFloat(a.amount as any || 0);
                valB = parseFloat(b.amount as any || 0);
            }
            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [searchQuery, mockPurchaseQuotes, supplierName, statusFilter, sortColumn, sortDirection]);

    const currencyTotals = useMemo(() => {
        const totals: Record<string, number> = {};
        filteredData.forEach(q => {
            const curr = q.currency || 'ZMW';
            totals[curr] = (totals[curr] || 0) + (parseFloat(q.amount as any) || 0);
        });
        return totals;
    }, [filteredData]);

    const paginatedData = useMemo(() => {
        return filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    }, [filteredData, currentPage, pageSize]);

    const totalPages = Math.ceil(filteredData.length / pageSize) || 1;

    const allColumns = [
        {
            id: 'Selection',
            header: (
                <div className="flex items-center justify-center">
                    <input
                        type="checkbox"
                        checked={selectedIds.length === paginatedData.length && paginatedData.length > 0}
                        onChange={(e) => {
                            if (e.target.checked) setSelectedIds(paginatedData.map(o => o.id));
                            else setSelectedIds([]);
                        }}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                </div>
            ),
            accessor: (o: any) => (
                <div className="flex items-center justify-center">
                    <div className="relative flex items-center justify-center w-4 h-4">
                        <input
                            type="checkbox"
                            checked={selectedIds.includes(o.id)}
                            onChange={() => {
                                setSelectedIds(prev =>
                                    prev.includes(o.id) ? prev.filter(id => id !== o.id) : [...prev, o.id]
                                );
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer transition-all appearance-none border checked:bg-indigo-600 checked:border-indigo-600"
                        />
                        {selectedIds.includes(o.id) && <Check size={10} className="absolute inset-0 m-auto text-white pointer-events-none" strokeWidth={4} />}
                    </div>
                </div>
            )
        },
        {
            id: 'Actions',
            header: 'Actions',
            accessor: (o: any) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate(`/purchase-quotes/view/${o.id}`)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                        title="View Details"
                    >
                        <Eye size={14} />
                    </button>
                    {perms?.edit !== false && (
                        <button
                            onClick={() => navigate(`/purchase-quotes/edit/${o.id}`)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all font-bold"
                            title="Edit Quote"
                        >
                            <Edit size={14} />
                        </button>
                    )}
                </div>
            )
        },
        {
            id: 'Issue Date',
            header: <div className="flex items-center cursor-pointer group hover:text-indigo-600 transition-colors" onClick={() => handleSort('Issue Date')}>Issue Date <SortIcon column="Issue Date" /></div>,
            className: 'whitespace-nowrap',
            accessor: (o: any) => (
                <span className="font-medium text-[13px] text-slate-800 tracking-normal">{o.issueDate}</span>
            )
        },
        {
            id: 'Reference',
            header: <div className="flex items-center cursor-pointer group hover:text-indigo-600 transition-colors" onClick={() => handleSort('Reference')}>Reference <SortIcon column="Reference" /></div>,
            className: 'whitespace-nowrap min-w-[140px]',
            accessor: (o: any) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100/50">
                        <FileText size={14} />
                    </div>
                    <span className="font-medium text-slate-900 tracking-tight">{o.reference}</span>
                </div>
            )
        },
        {
            id: 'Supplier',
            header: <div className="flex items-center cursor-pointer group hover:text-indigo-600 transition-colors" onClick={() => handleSort('Supplier')}>Supplier <SortIcon column="Supplier" /></div>,
            className: 'min-w-[200px]',
            accessor: (o: any) => (
                <span className="font-medium text-slate-600">{o.supplier || 'Unknown'}</span>
            )
        },
        {
            id: 'Description',
            header: <div className="flex items-center cursor-pointer group hover:text-indigo-600 transition-colors" onClick={() => handleSort('Description')}>Description <SortIcon column="Description" /></div>,
            accessor: (o: any) => (
                <span className="text-[11px] text-slate-400 font-medium tracking-tight truncate max-w-[200px] block" title={o.description}>
                    {o.description || '—'}
                </span>
            )
        },
        {
            id: 'Amount',
            header: <div className="flex items-center justify-end cursor-pointer group hover:text-indigo-600 transition-colors" onClick={() => handleSort('Amount')}>Amount <SortIcon column="Amount" /></div>,
            className: 'whitespace-nowrap text-right',
            accessor: (o: any) => (
                <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold mr-1">{o.currency || 'ZMW'}</span>
                    <span className="font-black text-slate-900">
                        {parseFloat(o.amount as any || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                </div>
            )
        },
        {
            id: 'Status',
            header: <div className="flex items-center cursor-pointer group hover:text-indigo-600 transition-colors" onClick={() => handleSort('Status')}>Status <SortIcon column="Status" /></div>,
            className: 'whitespace-nowrap',
            accessor: (o: any) => {
                let displayStatus = o.status || 'Draft';
                let isExpired = false;
                return (
                    <div className="flex items-center gap-4">
                        <Badge variant={
                            isExpired ? 'danger' :
                            displayStatus === 'Active' || displayStatus === 'Accepted' ? 'success' : 
                            displayStatus === 'Pending Approval' ? 'warning' : 
                            displayStatus === 'Rejected' ? 'error' : 
                            'default'
                        } className="text-[10px]">
                            {displayStatus.toUpperCase()}
                        </Badge>
                        {(displayStatus === 'Active' || displayStatus === 'Pending Approval') && perms?.edit !== false && !isExpired && (
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => handleStatusChange(o.id, 'Accepted')}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50 hover:border-emerald-500 transition-all shadow-sm"
                                    title="Accept Quote"
                                >
                                    <Check size={13} strokeWidth={3} />
                                </button>
                                <button
                                    onClick={() => handleStatusChange(o.id, 'Rejected')}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 hover:border-rose-500 transition-all shadow-sm"
                                    title="Reject Quote"
                                >
                                    <X size={13} strokeWidth={3} />
                                </button>
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            id: 'Timestamp',
            header: <div className="flex items-center cursor-pointer group hover:text-indigo-600 transition-colors" onClick={() => handleSort('Timestamp')}>Timestamp <SortIcon column="Timestamp" /></div>,
            className: 'whitespace-nowrap',
            accessor: (o: any) => {
                const dateObj = o.timestamp ? new Date(o.timestamp) : null;
                const displayVal = dateObj ? dateObj.toLocaleString('en-GB', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', second: '2-digit',
                    hour12: true
                }).replace(/\//g, '.').replace(',', '').toUpperCase() : '—';
                return <span className="text-[10px] text-slate-400 font-medium font-sans tracking-tight whitespace-nowrap">{displayVal}</span>;
            }
        }
    ];

    const columns = useMemo(() => {
        let cols = allColumns.filter(col => visibleColumns[col.id]);
        if (isSelectionMode) cols = [allColumns.find(c => c.id === 'Selection')!, ...cols.filter(c => c.id !== 'Selection')];
        return cols;
    }, [visibleColumns, isSelectionMode, selectedIds, paginatedData]);

    return (
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-700 font-sans">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center space-x-2 text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-2">
                        <FileText size={14} />
                        <span className="text-gray-400">Procurement Module</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Purchase Quotes</h1>
                    <p className="text-gray-500 text-sm font-medium">Manage and track supplier proposals</p>
                </div>
                {perms?.add !== false && (
                    <button onClick={() => navigate('/purchase-quotes/new')} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-[12px] font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 flex items-center uppercase tracking-widest">
                        <Plus size={16} className="mr-2" /> REQUEST QUOTE
                    </button>
                )}
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4 flex-1">
                    <div className="relative flex-1 group max-w-xl">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input type="text" placeholder="Search by supplier, reference..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 transition-all" />
                    </div>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-white border border-slate-200 text-slate-600 text-[11px] font-black uppercase rounded-xl px-5 py-2.5 shadow-sm">
                        <option value="All">All Statuses</option>
                        <option value="Active">Active</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Pending Approval">Pending</option>
                    </select>
                </div>
                <div className="flex flex-col items-end border-l border-slate-100 pl-8">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Requests</span>
                    <span className="text-[18px] font-black text-gray-900">{filteredData.length}</span>
                </div>
            </div>

            {isSelectionMode && (
                <div className="bg-indigo-600 px-8 py-4 rounded-[24px] flex items-center justify-between shadow-xl shadow-indigo-200/50 animate-in slide-in-from-top-4 duration-500 border border-white/10 backdrop-blur-md mb-8 max-w-[1200px]">
                    <div className="flex items-center space-x-8">
                        <div className="flex flex-col">
                            <span className="text-white font-black text-[14px] leading-tight tracking-tight">{selectedIds.length}</span>
                            <span className="text-indigo-200 font-bold text-[9px] uppercase tracking-widest whitespace-nowrap">Selected</span>
                        </div>
                        <div className="h-8 w-px bg-white/20"></div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate(`/purchase-quotes/print-batch?ids=${selectedIds.join(',')}`)}
                                disabled={selectedIds.length === 0}
                                className="text-white/90 hover:text-white flex items-center space-x-2 text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-40"
                            >
                                <Printer size={14} /> <span>Print Quotes</span>
                            </button>
                            <button
                                onClick={handleBatchCopy}
                                disabled={selectedIds.length === 0}
                                className="text-white/90 hover:text-white flex items-center space-x-2 text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-40"
                            >
                                <Copy size={14} /> <span>Copy Details</span>
                            </button>
                        </div>
                    </div>
                    <button onClick={() => { setIsSelectionMode(false); setSelectedIds([]); }} className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border border-white/20">Cancel Batch Mode</button>
                </div>
            )}

            <div className="w-fit min-w-full overflow-hidden bg-white border border-slate-100 rounded-2xl shadow-sm">
                <DataTable
                    data={paginatedData}
                    columns={columns as any}
                    hideDefaultPagination={true}
                    tableFooter={
                        <tr className="bg-slate-50/50">
                            {columns.map(col => (
                                <td key={col.id} className="px-6 py-4 text-right font-black">
                                    {col.id === 'Amount' && Object.keys(currencyTotals).map(cur => (
                                        <div key={cur} className="flex items-center justify-end gap-1.5">
                                            <span className="text-[9px] text-slate-400 uppercase">{cur}</span>
                                            <span className="text-[12px] underline decoration-slate-200 underline-offset-4">{currencyTotals[cur].toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    ))}
                                </td>
                            ))}
                        </tr>
                    }
                />
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm">
                <div className="flex flex-col items-center space-y-2">
                    <div className="flex items-center space-x-2 text-[12px] text-slate-500 font-medium">
                        <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-1 disabled:opacity-30"><ChevronsLeft size={16} /></button>
                        <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="p-1 disabled:opacity-30"><ChevronLeft size={16} /></button>
                        <span>Page {currentPage} of {totalPages}</span>
                        <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="p-1 disabled:opacity-30"><ChevronRight size={16} /></button>
                        <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-1 disabled:opacity-30"><ChevronsRight size={16} /></button>
                    </div>
                    <div className="flex items-center space-x-4">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Show:</span>
                        {[50, 100, 250, 500].map(size => (<button key={size} onClick={() => { setPageSize(size); setCurrentPage(1); }} className={`text-[10px] font-black ${pageSize === size ? 'text-indigo-600 underline decoration-2' : 'text-slate-400'}`}>{size}</button>))}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleCopyToClipboard} className="px-4 py-2 bg-slate-50 text-[11px] font-black text-slate-500 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200/50 uppercase tracking-widest flex items-center gap-2"><Copy size={12} /> Export</button>
                    <div className="relative" ref={batchOpsRef}>
                        <button onClick={() => setIsBatchOpsOpen(!isBatchOpsOpen)} className="px-4 py-2 bg-indigo-600 text-[11px] font-bold text-white rounded-md uppercase flex items-center">Management {isBatchOpsOpen ? <ChevronDown size={14} className="ml-2" /> : <ChevronUp size={14} className="ml-2" />}</button>
                        {isBatchOpsOpen && (
                            <div className="absolute bottom-full right-0 mb-2 w-56 bg-white border border-gray-200 shadow-xl rounded-md py-1 z-[100] animate-in slide-in-from-bottom-2">
                                <button onClick={() => { setIsSelectionMode(!isSelectionMode); setIsBatchOpsOpen(false); }} className="w-full text-left px-4 py-2 text-[12px] font-medium text-gray-700 hover:bg-gray-100">{isSelectionMode ? 'Disable Batch Mode' : 'Enable Batch Actions'}</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PurchaseQuotesView;
