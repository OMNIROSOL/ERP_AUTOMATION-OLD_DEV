import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiService from '../services/apiService';
import Badge from '../components/shared/Badge';
import DataTable from '../components/shared/DataTable';
import {
    Plus, Eye, Edit, FileText, Search,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ChevronDown, ChevronUp, Package, Truck, Loader2
} from 'lucide-react';
import { cn } from '../utils/cn';

const GoodsReceivedNotesView = () => {
    const navigate = useNavigate();
    const { supplierName } = useParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [pageSize, setPageSize] = useState(50);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortColumn, setSortColumn] = useState<string>('Received date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [dbData, setDbData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const data = await apiService.getGoodsReceivedNotes();
                setDbData(data);
            } catch (err) {
                console.error('Failed to load GRNs:', err);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const filteredData = useMemo(() => {
        let result = [...dbData];

        if (supplierName) {
            result = result.filter(grn => (grn.supplier || '').trim().toLowerCase() === supplierName.trim().toLowerCase());
        }

        const query = searchQuery.toLowerCase();
        if (query) {
            result = result.filter(grn =>
                (grn.supplier || '').toLowerCase().includes(query) ||
                (grn.reference || '').toLowerCase().includes(query)
            );
        }

        return result.sort((a, b) => {
            let valA: any;
            let valB: any;

            if (sortColumn === 'Qty received') {
                valA = a.items?.reduce((sum: number, it: any) => sum + parseFloat(it.qty || '0'), 0) || 0;
                valB = b.items?.reduce((sum: number, it: any) => sum + parseFloat(it.qty || '0'), 0) || 0;
            } else if (sortColumn === 'Timestamp') {
                valA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                valB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            } else if (sortColumn === 'Inventory location') {
                valA = a.inventoryLocation || '';
                valB = b.inventoryLocation || '';
            } else if (sortColumn === 'Description') {
                valA = a.description || '';
                valB = b.description || '';
            } else {
                valA = (a as any)[sortColumn] || '';
                valB = (b as any)[sortColumn] || '';
            }

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [dbData, searchQuery, supplierName, sortColumn, sortDirection]);

    const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
    const displayData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const columns = [
        {
            id: 'Actions',
            header: 'Actions',
            accessor: (grn: any) => (
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate(`/goods-received-notes/view/${grn.id}`)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Eye size={14} /></button>
                    <button onClick={() => navigate(`/goods-received-notes/edit/${grn.id}`)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={14} /></button>
                </div>
            )
        },
        {
            id: 'Received date',
            header: 'Received Date',
            accessor: (grn: any) => <span className="font-medium text-[13px] text-slate-800">{grn.receivedDate}</span>
        },
        {
            id: 'Reference',
            header: 'Reference',
            accessor: (grn: any) => (
                <div className="flex items-center gap-3 whitespace-nowrap">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100/50 flex-shrink-0">
                        <Truck size={14} />
                    </div>
                    <span className="font-bold text-slate-900 whitespace-nowrap">{grn.reference}</span>
                </div>
            )
        },
        {
            id: 'Supplier',
            header: 'Supplier',
            accessor: (grn: any) => <span className="font-medium text-slate-600 whitespace-nowrap">{grn.supplier}</span>
        },
        {
            id: 'Inventory location',
            header: 'Inventory Location',
            accessor: (grn: any) => <span className="text-slate-500 font-medium">{grn.inventoryLocation || '—'}</span>
        },
        {
            id: 'Description',
            header: 'Description',
            accessor: (grn: any) => <span className="text-slate-500 font-medium max-w-xs truncate block" title={grn.description || ''}>{grn.description || '—'}</span>
        },
        {
            id: 'Qty received',
            header: <div className="text-right">Qty Received</div>,
            accessor: (grn: any) => {
                const qty = grn.items?.reduce((sum: number, it: any) => sum + parseFloat(it.qty || '0'), 0) || 0;
                return <span className="font-medium text-slate-600 tabular-nums block text-right">{qty.toLocaleString()}</span>;
            }
        },
        {
            id: 'Timestamp',
            header: 'Timestamp',
            accessor: (grn: any) => {
                if (!grn.createdAt) return <span className="text-slate-400 font-medium">—</span>;
                try {
                    const d = new Date(grn.createdAt);
                    if (isNaN(d.getTime())) return <span className="text-slate-400 font-medium">—</span>;

                    const day = String(d.getDate()).padStart(2, '0');
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const year = d.getFullYear();

                    let hours = d.getHours();
                    const minutes = String(d.getMinutes()).padStart(2, '0');
                    const seconds = String(d.getSeconds()).padStart(2, '0');
                    const ampm = hours >= 12 ? 'PM' : 'AM';

                    hours = hours % 12;
                    hours = hours ? hours : 12;
                    const hoursStr = String(hours).padStart(2, '0');

                    const formatted = `${day}.${month}.${year} ${hoursStr}:${minutes}:${seconds} ${ampm}`;
                    return <span className="text-slate-500 font-medium tabular-nums whitespace-nowrap">{formatted}</span>;
                } catch (e) {
                    return <span className="text-slate-400 font-medium">—</span>;
                }
            }
        }
    ];

    return (
        <div className="p-8 space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center space-x-2 text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">
                        <Package size={14} />
                        <span className="text-gray-400">Logistics & Receiving</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 leading-tight">Goods Received Notes (GRN)</h1>
                    <p className="text-gray-500 text-sm">Acknowledge and track items received from suppliers.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/goods-received-notes/new')}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 flex items-center"
                    >
                        <Plus size={16} className="mr-2" /> CREATE NEW GRN
                    </button>
                </div>
            </div>

            <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4 flex-1">
                    <div className="relative flex-1 group max-w-xl">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            type="text"
                            placeholder="Search by supplier or reference..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="flex flex-col items-end border-l border-slate-100 pl-8">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total GRNs</span>
                    <span className="text-[18px] font-bold text-gray-900">{filteredData.length}</span>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm text-[13px] relative overflow-hidden">
                {isLoading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center animate-in fade-in duration-300">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 size={32} className="text-indigo-600 animate-spin" />
                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Synchronizing GRNs...</p>
                        </div>
                    </div>
                )}
                <DataTable
                    data={displayData}
                    columns={columns as any}
                    tableClassName="min-w-[1000px]"
                    hideDefaultPagination={true}
                    disableInternalScroll={true}
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

export default GoodsReceivedNotesView;
