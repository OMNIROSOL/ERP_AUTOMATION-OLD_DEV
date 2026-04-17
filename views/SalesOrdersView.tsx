import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link, useParams } from 'react-router-dom';
import { mockSalesOrders, mockInvoices, saveSalesOrders, saveInvoices, getCurrentUser, getRoleById, initialRoleDefinitions } from '../mockData';
import { SalesOrder, Invoice, ScreenPermission } from '../types';
import DataTable from '../components/shared/DataTable';
import Badge from '../components/shared/Badge';
import BatchActionBar from '../components/shared/BatchActionBar';
import {
    ChevronRight, ChevronLeft, Search, Plus,
    ShoppingCart, FileText, Check, X, MoreHorizontal,
    Copy, Trash2, Printer, ChevronDown, ChevronUp,
    ChevronsLeft, ChevronsRight, Eye, Edit, ArrowUpDown, Calendar
} from 'lucide-react';
import { cn } from '../utils/cn';

const SalesOrdersView = () => {
    const navigate = useNavigate();
    const { customerName } = useParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [isBatchOpsOpen, setIsBatchOpsOpen] = useState(false);
    const [showEditColumns, setShowEditColumns] = useState(false);
    const [pageSize, setPageSize] = useState(50);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortColumn, setSortColumn] = useState<string>('Order Date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const batchOpsRef = useRef<HTMLDivElement>(null);
    const [currentUser, setCurrentUser] = useState(getCurrentUser());
    const [perms, setPerms] = useState<ScreenPermission | null>(null);

    useEffect(() => {
        const handleUserUpdate = () => setCurrentUser(getCurrentUser());
        window.addEventListener('user_sim_updated', handleUserUpdate);

        const role = getRoleById(currentUser.roleId || '') || initialRoleDefinitions.find(r => r.name === currentUser.role);
        const screenPerm = role?.permissions.find(p => p.screenId === 'sales-orders');
        setPerms(screenPerm || null);

        return () => window.removeEventListener('user_sim_updated', handleUserUpdate);
    }, [currentUser]);

    const handleStatusChange = (id: string, newStatus: string, shouldNavigate: boolean = false) => {
        const index = mockSalesOrders.findIndex(o => o.id === id);
        if (index !== -1) {
            const order = mockSalesOrders[index];
            const finalStatus = shouldNavigate ? 'Invoiced' : newStatus;
            (mockSalesOrders[index] as any).status = finalStatus;
            
            // If moved to invoice, create a record in mockInvoices
            if (shouldNavigate) {
                const newInvoice: Invoice = {
                    id: `INV-${Date.now()}`,
                    issueDate: new Date().toLocaleDateString('en-GB').replace(/\//g, '.'),
                    dueDate: '30 Days',
                    reference: order.reference,
                    salesOrder: order.reference,
                    customer: order.customer,
                    description: order.description,
                    currency: order.currency,
                    invoiceAmount: order.amount as number,
                    balanceDue: order.amount as number,
                    status: 'Coming due',
                    items: order.items || [],
                    timestamp: new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).replace(/\//g, '.').replace(',', '').toUpperCase()
                };
                mockInvoices.unshift(newInvoice);
                saveInvoices(mockInvoices);
                saveSalesOrders(mockSalesOrders);
                setRefreshTrigger(prev => prev + 1);
                navigate('/sales-invoices');
            } else {
                saveSalesOrders(mockSalesOrders);
                setRefreshTrigger(prev => prev + 1);
                alert(`Order ${newStatus} successfully.`);
            }
        }
    };

    // Default visibility settings
    const defaultVisibility = {
        'Actions': true,
        'Order Date': true,
        'Reference': true,
        'Customer': true,
        'Description': false,
        'Amount': true,
        'Timestamp': true,
        'Approval': true
    };

    // Column Visibility State - Loaded from localStorage
    const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
        const saved = localStorage.getItem('sales_order_column_visibility_settings');
        return saved ? JSON.parse(saved) : defaultVisibility;
    });

    // Strategy for updating and saving visibility
    const toggleColumnVisibility = (id: string) => {
        setVisibleColumns(prev => {
            const next = { ...prev, [id]: !prev[id] };
            localStorage.setItem('sales_order_column_visibility_settings', JSON.stringify(next));
            return next;
        });
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (batchOpsRef.current && !batchOpsRef.current.contains(event.target as Node)) {
                setIsBatchOpsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredData = useMemo(() => {
        let result = [...mockSalesOrders].filter(o => (o as any).status !== 'Invoiced' && (o as any).status !== 'Rejected');

        // 1. Exact Customer Filter from URL Path
        if (customerName) {
            result = result.filter(o => o.customer.toLowerCase() === customerName.toLowerCase());
        }

        // 2. Search Query Filter
        const query = searchQuery.toLowerCase();
        if (query) {
            result = result.filter(o =>
                o.customer.toLowerCase().includes(query) ||
                o.reference.toLowerCase().includes(query) ||
                o.description?.toLowerCase().includes(query)
            );
        }

        // 3. Implement Sorting
        return result.sort((a, b) => {
            let valA: any = (a as any)[sortColumn] || '';
            let valB: any = (b as any)[sortColumn] || '';

            if (sortColumn === 'Order Date') {
                valA = (a.orderDate || '').split('.').reverse().join('-');
                valB = (b.orderDate || '').split('.').reverse().join('-');
            } else if (sortColumn === 'Amount') {
                valA = parseFloat(a.amount as any || 0);
                valB = parseFloat(b.amount as any || 0);
            } else if (sortColumn === 'Reference') {
                valA = a.reference;
                valB = b.reference;
            } else if (sortColumn === 'Customer') {
                valA = a.customer;
                valB = b.customer;
            }

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [searchQuery, customerName, refreshTrigger, sortColumn, sortDirection]);

    const totalPages = Math.ceil(filteredData.length / pageSize);
    const displayData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredData.slice(start, start + pageSize);
    }, [filteredData, currentPage, pageSize]);

    const copyToClipboard = (data: any[]) => {
        const header = `Order Date\tReference\tCustomer\tDescription\tAmount\tTimestamp`;
        const rows = data.map(o =>
            `${o.orderDate}\t${o.reference}\t${o.customer}\t${o.description || ''}\t${o.amount}\t${o.timestamp || ''}`
        ).join('\n');
        const fullText = `${header}\n${rows}`;

        if (!navigator.clipboard) {
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
                alert('Copied to clipboard');
            } catch (err) {
                console.error('Fallback: Oops, unable to copy', err);
            }
            document.body.removeChild(textArea);
            return;
        }

        navigator.clipboard.writeText(fullText).then(() => {
            alert('Copied to clipboard');
        }).catch(() => {
            alert('Failed to copy');
        });
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

    const handleCopyToClipboard = () => copyToClipboard(filteredData);

    const handleBatchCopy = () => {
        const selectedOrders = mockSalesOrders.filter(o => selectedIds.includes(o.id));
        copyToClipboard(selectedOrders);
    };

    const allColumns = [
        {
            id: 'Selection',
            header: (
                <div className="flex items-center justify-center -ml-1">
                    <div className="relative flex items-center">
                        <input
                            type="checkbox"
                            checked={selectedIds.length === displayData.length && displayData.length > 0}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setSelectedIds(displayData.map((o: any) => o.id));
                                } else {
                                    setSelectedIds([]);
                                }
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer transition-all appearance-none border checked:bg-indigo-600 checked:border-indigo-600"
                        />
                        {selectedIds.length === displayData.length && displayData.length > 0 && <Check size={10} className="absolute inset-0 m-auto text-white pointer-events-none" strokeWidth={4} />}
                    </div>
                </div>
            ),
            accessor: (o: any) => (
                <div className="flex items-center justify-center">
                    <div className="relative flex items-center">
                        <input
                            type="checkbox"
                            checked={selectedIds.includes(o.id)}
                            onChange={() => {
                                setSelectedIds(prev =>
                                    prev.includes(o.id)
                                        ? prev.filter(id => id !== o.id)
                                        : [...prev, o.id]
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
                        onClick={() => navigate(`/sales-orders/view/${o.id}`)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                        title="View Details"
                      >
                        <Eye size={14} />
                    </button>
                    {perms?.edit !== false && (
                        <button
                            onClick={() => navigate(`/sales-orders/edit/${o.id}`)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all font-bold"
                            title="Edit Order"
                        >
                            <Edit size={14} />
                        </button>
                    )}
                </div>
            )
        },
        {
            id: 'Order Date',
            header: <div className="flex items-center cursor-pointer group hover:text-blue-600 transition-colors" onClick={() => handleSort('Order Date')}>Order Date <SortIcon column="Order Date" /></div>,
            className: 'whitespace-nowrap',
            accessor: (o: any) => (
                <span className="font-medium text-[13px] text-slate-800 tracking-normal">{o.orderDate}</span>
            ),
            sortable: false
        },
        {
            id: 'Reference',
            header: <div className="flex items-center cursor-pointer group hover:text-blue-600 transition-colors" onClick={() => handleSort('Reference')}>Reference <SortIcon column="Reference" /></div>,
            className: 'whitespace-nowrap min-w-[140px]',
            accessor: (o: any) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100/50">
                        <FileText size={14} />
                    </div>
                    <span className="font-medium text-slate-900 tracking-tight">{o.reference}</span>
                </div>
            ),
            sortable: false
        },

        {
            id: 'Customer',
            header: <div className="flex items-center cursor-pointer group hover:text-blue-600 transition-colors" onClick={() => handleSort('Customer')}>Customer <SortIcon column="Customer" /></div>,
            className: 'min-w-[200px]',
            accessor: (o: any) => (
                <span className="font-medium text-slate-600">{o.customer || 'Unknown'}</span>
            ),
            sortable: false
        },
        {
            id: 'Description',
            header: 'Description',
            className: 'min-w-[200px]',
            accessor: (o: any) => (
                <span className="text-slate-400 font-medium tracking-tight truncate max-w-[200px]" title={o.description}>{o.description || ''}</span>
            ),
            sortable: false
        },
        {
            id: 'Amount',
            header: <div className="flex items-center justify-end cursor-pointer group hover:text-blue-600 transition-colors" onClick={() => handleSort('Amount')}>Amount <SortIcon column="Amount" /></div>,
            className: 'whitespace-nowrap text-right',
            accessor: (o: any) => (
                <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold mr-1">{o.currency || 'ZMW'}</span>
                    <span className="font-black text-slate-900">
                        {parseFloat(o.amount as any || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                </div>
            ),
            sortable: false
        },
        {
            id: 'Timestamp',
            header: 'Timestamp',
            className: 'whitespace-nowrap',
            accessor: (o: any) => (
                <span className="text-[10px] text-slate-400 font-medium">{o.timestamp || ''}</span>
            ),
            sortable: false
        },
        {
            id: 'Approval',
            header: 'Approval',
            className: 'whitespace-nowrap',
            accessor: (o: any) => (
                        <div className="flex items-center gap-1.5 justify-center">
                            {(o.status === 'Draft' || o.status === 'Pending' || o.status === 'Ordered') ? (
                                <>
                                    {perms?.edit !== false && (
                                        <>
                                            <button
                                                onClick={() => handleStatusChange(o.id, 'Confirmed', true)}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg border border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50 hover:border-emerald-500 transition-all shadow-sm"
                                                title="Confirm & Invoice"
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
                                    )}
                                </>
                            ) : (
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                                    {o.status}
                                </span>
                            )}
                        </div>
            )
        }
    ];

    const columns = useMemo(() => {
        let cols = allColumns.filter(col => visibleColumns[col.id]);

        // Always show Selection column if in selection mode, at the very beginning
        if (isSelectionMode) {
            const selectionCol = allColumns.find(c => c.id === 'Selection');
            if (selectionCol && !cols.some(c => c.id === 'Selection')) {
                cols = [selectionCol, ...cols];
            }
        } else {
            cols = cols.filter(c => c.id !== 'Selection');
        }

        return cols;
    }, [visibleColumns, isSelectionMode, selectedIds, displayData]);

    return (
        <div className="p-8 space-y-6 max-w-[1400px] ml-0 mr-auto animate-in fade-in duration-500 font-sans">
            {customerName && (
                <div className="flex items-center space-x-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    <span
                        onClick={() => navigate('/customers')}
                        className="text-indigo-500 hover:underline cursor-pointer"
                    >
                        Customers
                    </span>
                    <ChevronRight size={10} className="opacity-30" />
                    <span className="text-slate-600 italic">“{customerName}”</span>
                </div>
            )}

            {/* Page Header Area - Synchronized with Quotations */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center space-x-2 text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">
                        <ShoppingCart size={14} />
                        <span className="text-gray-400">Order Management</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 leading-tight tracking-tight">Sales Orders</h1>
                    <p className="text-gray-500 text-sm">Manage and track your customer sales orders.</p>
                </div>

                <div className="flex items-center gap-3">
                    {perms?.add !== false && (
                        <button
                            onClick={() => navigate('/sales-orders/new')}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-blue-700 transition-all shadow-sm flex items-center shadow-lg shadow-blue-500/20"
                        >
                            <Plus size={16} className="mr-2" /> CREATE NEW ORDER
                        </button>
                    )}
                </div>
            </div>

            <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-6 pb-2">
                <div className="flex items-center gap-4 flex-1">
                    <div className="relative flex-1 group max-w-xl">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-blue-500" size={14} />
                        <input
                            type="text"
                            placeholder="Search by name, reference, or description..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm transition-all"
                        />
                    </div>
                </div>

                <div className="flex items-center space-x-8">
                    <div className="flex flex-col items-end border-l border-slate-100 pl-8">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Total Orders</span>
                        <span className="text-[18px] font-bold text-gray-900 leading-none">
                            {filteredData.length}
                        </span>
                    </div>
                </div>
            </div>

            <BatchActionBar
                isVisible={isSelectionMode}
                selectedCount={selectedIds.length}
                onReset={() => {
                    setIsSelectionMode(false);
                    setSelectedIds([]);
                }}
                actions={[
                    {
                        icon: <Printer size={16} strokeWidth={3} />,
                        label: 'Print Orders',
                        onClick: () => {
                            if (selectedIds.length === 0) { alert('No orders selected'); return; }
                            navigate(`/sales-orders/print-batch?ids=${selectedIds.join(',')}`);
                        }
                    },
                    {
                        icon: <Copy size={16} strokeWidth={3} />,
                        label: 'Copy Details',
                        onClick: () => {
                            if (selectedIds.length === 0) { alert('No orders selected'); return; }
                            const selectedOrders = displayData.filter(o => selectedIds.includes(o.id));
                            const text = selectedOrders.map(o => `${o.reference}\t${o.customer}\t${o.amount}`).join('\n');
                            navigator.clipboard.writeText(text);
                            alert('Copied to clipboard');
                        }
                    }
                ]}
            />

            <div className="w-fit min-w-full overflow-visible mb-8 custom-scrollbar rounded-2xl border border-slate-100 shadow-sm shadow-indigo-50/50">
                <DataTable
                    data={displayData}
                    columns={columns as any}
                    tableClassName="min-w-[1440px]"
                    className="border-none shadow-none bg-transparent"
                    hideDefaultPagination={true}
                    stickyHeader={true}
                    disableInternalScroll={true}
                    tableFooter={
                        <tr>
                            {columns.map((col: any) => {
                                if (col.id === 'Customer') {
                                    return (
                                        <td key={`total-label-${col.id}`} className="px-6 py-4 text-left">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Grand Totals:</span>
                                        </td>
                                    );
                                }

                                if (col.id === 'Amount') {
                                    const total = filteredData.reduce((sum, o) => sum + (o.amount || 0), 0);
                                    return (
                                        <td key={`total-${col.id}`} className="px-6 py-3 whitespace-nowrap text-right bg-slate-50/50">
                                            <div className="flex flex-col items-end gap-1">
                                                <div className="flex items-center gap-1.5 justify-end">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">ZMW</span>
                                                    <span className="text-[12px] font-black tracking-tight text-slate-900 underline decoration-slate-200 decoration-2 underline-offset-4 pointer-events-none">
                                                        {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                    );
                                }

                                return <td key={`total-empty-${col.id}`} className="px-6 py-4"></td>;
                            })}
                        </tr>
                    }
                />
            </div>

            {/* Management Card - Left-aligned as requested */}
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
                            {[50, 100, 250, 500].map(size => (
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

                    <div className="relative" ref={batchOpsRef}>
                        <button
                            onClick={() => setIsBatchOpsOpen(!isBatchOpsOpen)}
                            className="px-4 py-2 bg-blue-600 text-[11px] font-bold text-white rounded-md hover:bg-blue-700 transition-all uppercase tracking-wider flex items-center shadow-sm"
                        >
                            Management {isBatchOpsOpen ? <ChevronDown size={14} className="ml-2" /> : <ChevronUp size={14} className="ml-2" />}
                        </button>

                        {isBatchOpsOpen && (
                            <div className="absolute bottom-full right-0 mb-2 w-56 bg-white border border-gray-200 shadow-xl rounded-md py-1 z-[100] animate-in slide-in-from-bottom-2 duration-300 overflow-hidden text-left">
                                <button
                                    onClick={() => { navigate('/sales-orders/edit-columns'); setIsBatchOpsOpen(false); }}
                                    className="w-full text-left px-4 py-2 text-[12px] font-medium text-gray-700 hover:bg-gray-100 transition-colors capitalize"
                                >
                                    Column Settings
                                </button>
                                <button
                                    onClick={() => {
                                        if (!isSelectionMode) {
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                            document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
                                        }
                                        setIsSelectionMode(!isSelectionMode);
                                        setIsBatchOpsOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-2 text-[12px] font-medium text-gray-700 hover:bg-gray-100 transition-colors border-t border-gray-100 capitalize"
                                >
                                    {isSelectionMode ? 'Disable Batch Mode' : 'Enable Batch Actions'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
};

export default SalesOrdersView;
