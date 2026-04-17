import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { mockPurchaseOrders, mockPurchaseInvoices, getCurrentUser } from '../mockData';
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

const PurchaseOrdersView = () => {
    const navigate = useNavigate();
    const { supplierName } = useParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [pageSize, setPageSize] = useState(50);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortColumn, setSortColumn] = useState<string>('Order Date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const filteredData = useMemo(() => {
        let result = [...mockPurchaseOrders];

        if (supplierName) {
            result = result.filter(o => o.supplier.toLowerCase() === supplierName.toLowerCase());
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
            accessor: (o: any) => <span className="font-medium text-[13px] text-slate-800">{o.orderDate}</span>
        },
        {
            id: 'Reference',
            header: 'Reference',
            accessor: (o: any) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100/50">
                        <FileText size={14} />
                    </div>
                    <span className="font-bold text-slate-900">{o.reference}</span>
                </div>
            )
        },
        {
            id: 'Supplier',
            header: 'Supplier',
            accessor: (o: any) => <span className="font-medium text-slate-600">{o.supplier}</span>
        },
        {
            id: 'Amount',
            header: 'Amount',
            className: 'text-right',
            accessor: (o: any) => (
                <div className="text-right font-black text-slate-900">
                    <span className="text-[10px] text-slate-400 mr-1">{o.currency}</span>
                    {o.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
            )
        },
        {
            id: 'Status',
            header: 'Status',
            accessor: (o: any) => (
                <Badge variant={o.status === 'Received' ? 'success' : 'warning'} className="text-[9px] uppercase tracking-widest font-black">
                    {o.status}
                </Badge>
            )
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
                    columns={columns as any}
                    tableClassName="min-w-[1000px]"
                    hideDefaultPagination={true}
                />
            </div>

            <div className="flex items-center justify-between bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                 <div className="flex gap-4 items-center text-sm font-medium text-slate-500">
                    <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="disabled:opacity-30"><ChevronLeft size={20} /></button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="disabled:opacity-30"><ChevronRight size={20} /></button>
                </div>
            </div>
        </div>
    );
};

export default PurchaseOrdersView;
