import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import apiService from '../services/apiService';
import { 
    ChevronLeft, ChevronRight, Printer, FileText, 
    Download, Mail, Edit, Copy, ChevronFirst, ChevronLast,
    Box, MapPin, Calendar, Info, FileStack, Clock, ChevronDown, User
} from 'lucide-react';
import { cn } from '../utils/cn';
import Badge from '../components/shared/Badge';

const ViewDeliveryNoteView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const pdfRef = useRef<HTMLDivElement>(null);
    const location = useLocation();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [isCopyToOpen, setIsCopyToOpen] = useState(false);
    const [note, setNote] = useState<any>(null);
    const [allNotes, setAllNotes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const queryParams = new URLSearchParams(location.search);
    const filterItem = queryParams.get('item');

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch the list first as a fallback
                const notesList = await apiService.getDeliveryNotes().catch(() => []);
                setAllNotes(notesList);

                try {
                    const specificNote = await apiService.getDeliveryNote(id!);
                    setNote(specificNote);
                } catch (err) {
                    console.error('Direct fetch failed, trying fallback from list:', err);
                    const fallbackNote = notesList.find((n: any) => n.id === id || n.reference === id);
                    if (fallbackNote) {
                        setNote(fallbackNote);
                    } else {
                        throw err; // Re-throw if even fallback fails
                    }
                }
            } catch (err) {
                console.error('Failed to fetch delivery note:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const noteIndex = useMemo(() => allNotes.findIndex((n: any) => (n.id === id || n.reference === id)), [allNotes, id]);

    const displayItems = useMemo(() => {
        if (!note?.items) return [];
        if (!filterItem) return note.items;
        return note.items.filter((it: any) => (it.item || it.itemName) === filterItem);
    }, [note, filterItem]);

    const totalQty = useMemo(() => {
        return displayItems.reduce((sum: number, item: any) => sum + (parseFloat(item.qty) || 0), 0);
    }, [displayItems]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsCopyToOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNext = () => {
        if (noteIndex < allNotes.length - 1) navigate(`/delivery-notes/view/${allNotes[noteIndex + 1].id}${location.search}`);
    };
    const handlePrev = () => {
        if (noteIndex > 0) navigate(`/delivery-notes/view/${allNotes[noteIndex - 1].id}${location.search}`);
    };
    const handleFirst = () => navigate(`/delivery-notes/view/${allNotes[0].id}${location.search}`);
    const handleLast = () => navigate(`/delivery-notes/view/${allNotes[allNotes.length - 1].id}${location.search}`);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-40 space-y-4 font-sans bg-slate-50/50 min-h-screen">
                <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading delivery note...</p>
            </div>
        );
    }

    if (!note) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
                <div className="max-w-md w-full bg-white rounded-[32px] p-12 text-center shadow-xl border border-slate-100">
                    <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500 mx-auto mb-6">
                        <Info size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Document Not Found</h2>
                    <p className="text-slate-500 text-sm mb-8 font-medium">The delivery note you are looking for doesn't exist or has been removed.</p>
                    <button 
                        onClick={() => navigate('/delivery-notes')} 
                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                    >
                        Return to List
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f3f4f6]/50 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
            {/* Compact Action Toolbar - Matching Sales Quote View */}
            <div className="bg-[#f8fafc] border-b border-gray-300 px-6 py-3 flex items-center justify-between sticky top-0 z-50 no-print">
                <div className="flex items-center space-x-3">
                    <button 
                        onClick={() => navigate('/delivery-notes')}
                        className="bg-white border border-gray-300 px-4 py-1.5 text-[12px] font-bold text-gray-700 rounded shadow-sm hover:bg-gray-50 flex items-center gap-2 transition-colors"
                    >
                        <ChevronLeft size={14} /> Back
                    </button>

                    <button 
                        onClick={() => navigate(`/delivery-notes/edit/${note.id}`)}
                        className="bg-white border border-gray-300 px-4 py-1.5 text-[12px] font-bold text-gray-700 rounded shadow-sm hover:bg-gray-50 flex items-center gap-2 transition-colors"
                    >
                        <Edit size={14} className="text-blue-600" /> Edit
                    </button>

                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsCopyToOpen(!isCopyToOpen)}
                            className="bg-white border border-gray-300 px-4 py-1.5 text-[12px] font-bold text-gray-700 rounded shadow-sm hover:bg-gray-50 flex items-center gap-2 transition-colors"
                        >
                            <Copy size={14} /> Copy To
                        </button>
                        {isCopyToOpen && (
                            <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 shadow-xl rounded py-1 z-[100] animate-in fade-in slide-in-from-top-1 duration-200">
                                {[
                                    { label: 'Sales Order', path: '/sales-orders/new' },
                                    { label: 'Sales Invoice', path: '/sales-invoices/new' },
                                    { label: 'Credit Note', path: '/credit-notes/new' },
                                    { label: 'Purchase Invoice', path: '/purchase-invoices/new' },
                                    { label: 'Goods Receipt', path: '/goods-receipts/new' },
                                    { label: 'Receipt', path: '/receipts/new' }
                                ].map(item => (
                                    <button 
                                        key={item.label}
                                        onClick={() => { setIsCopyToOpen(false); navigate(`${item.path}?copyFrom=${note.id}`); }} 
                                        className="w-full text-left px-4 py-2 text-[12px] text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                    >
                                        New {item.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="w-[1px] h-6 bg-gray-200 mx-3"></div>

                    <div className="flex space-x-2">
                        <button onClick={() => window.print()} className="bg-white border border-gray-300 px-4 py-1.5 text-[12px] font-bold text-gray-700 rounded shadow-sm hover:bg-gray-50 flex items-center gap-2">
                            <Printer size={14} /> Print
                        </button>
                        <button className="bg-white border border-gray-300 px-4 py-1.5 text-[12px] font-bold text-gray-700 rounded shadow-sm hover:bg-gray-50 flex items-center gap-2">
                            <Download size={14} /> PDF
                        </button>
                        <button className="bg-white border border-gray-300 px-4 py-1.5 text-[12px] font-bold text-gray-700 rounded shadow-sm hover:bg-gray-50 flex items-center gap-2">
                            <Mail size={14} /> Email
                        </button>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <div className="flex bg-white border border-gray-300 rounded shadow-sm">
                        <button 
                            onClick={handleFirst} 
                            disabled={noteIndex === 0} 
                            className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 border-r border-gray-300 disabled:opacity-30 flex items-center transition-colors"
                        >
                            <ChevronFirst size={14} />
                        </button>
                        <button 
                            onClick={handlePrev} 
                            disabled={noteIndex === 0} 
                            className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-30 flex items-center transition-colors"
                        >
                            <ChevronLeft size={14} />
                        </button>
                    </div>
                    <span className="text-[11px] font-bold text-gray-400 mx-2 uppercase tracking-widest">{noteIndex + 1} / {allNotes.length}</span>
                    <div className="flex bg-white border border-gray-300 rounded shadow-sm">
                        <button 
                            onClick={handleNext} 
                            disabled={noteIndex === allNotes.length - 1} 
                            className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 border-r border-gray-300 disabled:opacity-30 flex items-center transition-colors"
                        >
                            <ChevronRight size={14} />
                        </button>
                        <button 
                            onClick={handleLast} 
                            disabled={noteIndex === allNotes.length - 1} 
                            className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-30 flex items-center transition-colors"
                        >
                            <ChevronLast size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Document Area */}
            <div className="flex-1 p-6 flex justify-start overflow-auto print:p-0">
                <div className="bg-white shadow-xl p-12 w-[850px] max-w-full text-[13px] text-gray-800 relative rounded-none border border-gray-100 print:shadow-none print:border-none print:p-8 print:rounded-none" ref={pdfRef}>
                    <div className="flex justify-between items-start gap-12 mb-10 pb-10 border-b border-gray-100">
                        <div className="flex-1 space-y-6">
                            {/* Header Section */}
                            <div className="mb-6">
                                <div className="flex items-center space-x-3 mb-1">
                                    <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase leading-none">{note.customTitle || 'Delivery Note'}</h1>
                                </div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Reference: {note.reference}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-12 items-start">
                                {/* Customer */}
                                <div>
                                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-50 pb-2">Delivered To</h3>
                                    <p className="text-sm font-bold text-slate-900 uppercase tracking-tight mb-2">
                                        {typeof note.customer === 'string' ? note.customer : note.customer?.name || 'Unknown Customer'}
                                    </p>
                                    <div className="text-gray-500 space-y-1">
                                        <p className="whitespace-pre-wrap leading-relaxed">
                                            {note.deliveryAddress || note.customer?.shippingAddress || note.customer?.address || 'No delivery address recorded.'}
                                        </p>
                                    </div>
                                </div>

                                {/* Delivery Details */}
                                <div className="border-l border-gray-100 pl-12">
                                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-50 pb-2">Shipment Details</h3>
                                    <div className="space-y-3">
                                        <div className="flex">
                                            <span className="w-32 text-gray-500">Delivery Date:</span>
                                            <span className="font-semibold">{note.deliveryDate ? new Date(note.deliveryDate).toLocaleDateString('en-GB').replace(/\//g, '.') : '-'}</span>
                                        </div>
                                        {note.orderNumber && (
                                            <div className="flex">
                                                <span className="w-32 text-gray-500">Sales Order:</span>
                                                <span className="font-semibold">{note.orderNumber}</span>
                                            </div>
                                        )}
                                        {note.inventoryLocation && (
                                            <div className="flex">
                                                <span className="w-32 text-gray-500">Location:</span>
                                                <span className="font-semibold">{note.inventoryLocation}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Company Logo */}
                        <div className="w-[180px] shrink-0 pt-2 animate-in fade-in zoom-in-95 duration-700">
                            <img src="/logo.png" alt="Company Logo" className="w-full object-contain" />
                        </div>
                    </div>

                    {/* Memo / Description */}
                    {note.description && (
                        <div className="mb-10 p-6 bg-slate-50/50 rounded-xl border border-slate-100">
                            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Info size={12} /> Shipment Memo
                            </h2>
                            <p className="text-gray-600 leading-relaxed italic">{note.description}</p>
                        </div>
                    )}

                    {/* Items Table */}
                    <div className="mb-14 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-[#f8fafc] border-y border-gray-200 text-right">
                                <tr>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-left w-12">#</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-left">Item</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-left">Description</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right w-32">Quantity</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {displayItems.map((item: any, idx: number) => (
                                    <tr key={item.id || idx} className="hover:bg-slate-50/30 transition-colors">
                                        <td className="px-4 py-4 text-slate-400 font-medium text-[12px]">{idx + 1}</td>
                                        <td className="px-4 py-4">
                                            <p className="font-semibold text-slate-900 uppercase tracking-tight">
                                                {typeof item.item === 'object' ? (item.item?.itemName || item.item?.name) : (item.item || item.itemName || 'Unnamed Item')}
                                            </p>
                                        </td>
                                        <td className="px-4 py-4">
                                            {item.description ? <p className="text-[12px] text-gray-500 leading-relaxed italic">{item.description}</p> : <span className="text-gray-300">-</span>}
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="font-bold text-slate-900">{item.qty}</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.unit || 'PCS'}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {displayItems.length === 0 && (
                                    <tr>
                                        <td className="px-4 py-10 text-center text-slate-400 italic text-sm" colSpan={3}>No fulfillment items found in this note.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Total Summary */}
                    <div className="flex justify-end mb-20">
                        <div className="w-72 space-y-3">
                            <div className="flex items-center justify-between text-gray-500">
                                <span className="text-[11px] font-bold uppercase tracking-widest">Total Quantity</span>
                                <span className="font-semibold">{totalQty}</span>
                            </div>
                            <div className="flex items-center justify-between text-gray-500">
                                <span className="text-[11px] font-bold uppercase tracking-widest">Item Types</span>
                                <span className="font-semibold">{displayItems.length}</span>
                            </div>
                            <div className="flex items-center justify-between bg-slate-50 p-4 border-t-2 border-slate-900 mt-2">
                                <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-slate-900">Final Count</span>
                                <span className="text-2xl font-bold text-slate-900 tracking-tighter">{totalQty}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footers */}
                    {note.footer && (
                        <div className="mb-20 p-8 border-t-2 border-dashed border-slate-100">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Terms & Special Instructions</h3>
                            <div className="text-[13px] font-bold text-slate-500 leading-relaxed whitespace-pre-wrap italic">
                                {note.footer}
                            </div>
                        </div>
                    )}

                    {/* Signature Section */}
                    <div className="mt-24 grid grid-cols-2 gap-20 px-4">
                        <div className="space-y-4">
                            <div className="h-px bg-slate-200 w-full mb-6 relative">
                                <div className="absolute -top-3 left-0 bg-white pr-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorized Signatory</div>
                            </div>
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Omni Rosol Logistics</p>
                        </div>
                        <div className="space-y-4">
                            <div className="h-px bg-slate-200 w-full mb-6 relative">
                                <div className="absolute -top-3 left-0 bg-white pr-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Received In Good Condition By</div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Name / ID</p>
                                    <div className="h-6 border-b border-slate-100"></div>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Date / Time</p>
                                    <div className="h-6 border-b border-slate-100"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ViewDeliveryNoteView;
