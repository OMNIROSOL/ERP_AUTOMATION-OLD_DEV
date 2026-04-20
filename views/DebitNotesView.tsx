import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockDebitNotes } from '../mockData';
import Badge from '../components/shared/Badge';
import DataTable from '../components/shared/DataTable';
import {
    Plus, Eye, Edit, FileText, Search,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FileX, Calculator
} from 'lucide-react';
import { cn } from '../utils/cn';

const DebitNotesView = () => {
    const navigate = useNavigate();
    const { supplierName } = useParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [pageSize, setPageSize] = useState(50);
    const [currentPage, setCurrentPage] = useState(1);

    const filteredData = useMemo(() => {
        let result = [...mockDebitNotes];

        if (supplierName) {
            result = result.filter(dn => (dn.supplier || '').trim().toLowerCase() === supplierName.trim().toLowerCase());
        }

        const query = searchQuery.toLowerCase();
        if (query) {
            result = result.filter(dn =>
                dn.supplier.toLowerCase().includes(query) ||
                dn.reference.toLowerCase().includes(query)
            );
        }

        return result;
    }, [searchQuery, supplierName]);

    const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
    const displayData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const columns = [
        {
            id: 'Actions',
            header: 'Actions',
            accessor: (dn: any) => (
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate(`/debit-notes/view/${dn.id}`)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Eye size={14} /></button>
                    <button onClick={() => navigate(`/debit-notes/edit/${dn.id}`)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={14} /></button>
                </div>
            )
        },
        {
            id: 'Issue date',
            header: 'Issue Date',
            accessor: (dn: any) => <span className="font-medium text-[13px] text-slate-800">{dn.issueDate}</span>
        },
        {
            id: 'Reference',
            header: 'Reference',
            accessor: (dn: any) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100/50">
                        <FileX size={14} />
                    </div>
                    <span className="font-bold text-slate-900">{dn.reference}</span>
                </div>
            )
        },
        {
            id: 'Supplier',
            header: 'Supplier',
            accessor: (dn: any) => <span className="font-medium text-slate-600">{dn.supplier}</span>
        },
        {
            id: 'Invoice Reference',
            header: 'Invoice Reference',
            accessor: (dn: any) => <span className="text-slate-500 font-medium">{dn.purchaseInvoice || '—'}</span>
        },
        {
            id: 'Amount',
            header: 'Amount',
            className: 'text-right',
            accessor: (dn: any) => (
                <div className="text-right font-black text-rose-600">
                    <span className="text-[10px] text-slate-400 mr-1">{dn.currency}</span>
                    {dn.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
            )
        },
        {
            id: 'Status',
            header: 'Status',
            accessor: (dn: any) => (
                <Badge variant={dn.status === 'Applied' ? 'success' : 'warning'} className="text-[9px] uppercase tracking-widest font-black">
                    {dn.status}
                </Badge>
            )
        }
    ];

    return (
        <div className="p-8 space-y-6 max-w-[1400px] animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center space-x-2 text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-1">
                        <Calculator size={14} />
                        <span className="text-gray-400">Financial Adjustments</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 leading-tight">Debit Notes</h1>
                    <p className="text-gray-500 text-sm">Manage returns and adjustments to supplier invoices.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/debit-notes/new')}
                        className="bg-rose-600 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-500/20 flex items-center"
                    >
                        <Plus size={16} className="mr-2" /> CREATE NEW DEBIT NOTE
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
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="flex flex-col items-end border-l border-slate-100 pl-8">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Debit Notes</span>
                    <span className="text-[18px] font-bold text-gray-900">{filteredData.length}</span>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-[13px]">
                <DataTable
                    data={displayData}
                    columns={columns as any}
                    tableClassName="min-w-[1000px]"
                    hideDefaultPagination={true}
                />
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

export default DebitNotesView;
