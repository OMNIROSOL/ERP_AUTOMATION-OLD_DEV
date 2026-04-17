import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { getDeliveryNotes } from '../mockData';

const ViewDeliveryNoteView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const pdfRef = useRef<HTMLDivElement>(null);
    const location = useLocation();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [isCopyToOpen, setIsCopyToOpen] = useState(false);

    const queryParams = new URLSearchParams(location.search);
    const filterItem = queryParams.get('item');

    const allNotes = getDeliveryNotes();
    const noteIndex = allNotes.findIndex((n: any) => n.id === id || n.noteId === id);
    const note = allNotes[noteIndex] as any;

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

    if (!note) {
        return (
            <div className="p-8 text-center text-gray-500">
                <p>Delivery Note not found.</p>
                <button onClick={() => navigate('/delivery-notes')} className="mt-4 text-blue-500 hover:underline">Return to list</button>
            </div>
        );
    }

    return (
        <div className="bg-[#f3f4f6] min-h-full flex flex-col">
            {/* Breadcrumb */}
            <div className="bg-white px-4 py-2 border-b border-gray-200 flex items-center text-[11px] text-gray-500 space-x-1.5 select-none no-print">
                <i className="fas fa-folder-open text-[#90a4ae]"></i>
                <i className="fas fa-caret-right text-[#cfd8dc] scale-75"></i>
                <Link to="/delivery-notes" className="hover:text-[#2196f3]">Delivery Notes</Link>
                <i className="fas fa-caret-right text-[#cfd8dc] scale-75"></i>
                <span className="text-gray-400">View</span>
            </div>

            {/* Toolbar */}
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between no-print">
                <div className="flex items-center space-x-3">
                    <span className="text-[13px] text-gray-400 mr-2">Delivery Note</span>
                    <div className="flex bg-white border border-gray-300 rounded-md shadow-sm overflow-visible relative">
                        <button onClick={() => navigate(`/delivery-notes/edit/${note.id}`)} className="px-4 py-1.5 text-[12px] font-bold text-gray-700 hover:bg-gray-50 border-r border-gray-300 uppercase tracking-wider transition-colors">Edit</button>
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsCopyToOpen(!isCopyToOpen)}
                                className={`px-4 py-1.5 text-[12px] font-bold text-gray-700 hover:bg-gray-50 flex items-center h-full uppercase tracking-wider transition-colors ${isCopyToOpen ? 'bg-gray-50' : ''}`}
                            >
                                <i className={`fas fa-caret-${isCopyToOpen ? 'down' : 'right'} text-[9px] mr-2 text-gray-900`}></i> Copy to
                            </button>
                            {isCopyToOpen && (
                                <div className="absolute left-0 mt-1 w-64 bg-white border border-gray-200 shadow-xl rounded-md py-1 z-50">
                                    <button onClick={() => { setIsCopyToOpen(false); navigate(`/sales-orders/new?copyFrom=${note.id}`); }} className="w-full text-left px-4 py-2 text-[12px] text-gray-700 hover:bg-gray-100 transition-colors">New Sales Order</button>
                                    <button onClick={() => { setIsCopyToOpen(false); navigate(`/sales-invoices/new?copyFrom=${note.id}`); }} className="w-full text-left px-4 py-2 text-[12px] text-gray-700 hover:bg-gray-100 transition-colors">New Sales Invoice</button>
                                    <button onClick={() => { setIsCopyToOpen(false); navigate(`/delivery-notes/new?copyFrom=${note.id}`); }} className="w-full text-left px-4 py-2 text-[12px] text-gray-700 hover:bg-gray-100 transition-colors">New Delivery Note</button>
                                    <button onClick={() => { setIsCopyToOpen(false); navigate(`/credit-notes/new?copyFrom=${note.id}`); }} className="w-full text-left px-4 py-2 text-[12px] text-gray-700 hover:bg-gray-100 transition-colors">New Credit Note</button>

                                    <div className="h-[1px] bg-gray-100 my-1 mx-2"></div>

                                    <button onClick={() => { setIsCopyToOpen(false); navigate(`/purchase-invoices/new?copyFrom=${note.id}`); }} className="w-full text-left px-4 py-2 text-[12px] text-gray-700 hover:bg-gray-100 transition-colors">New Purchase Invoice</button>
                                    <button onClick={() => { setIsCopyToOpen(false); navigate(`/goods-receipts/new?copyFrom=${note.id}`); }} className="w-full text-left px-4 py-2 text-[12px] text-gray-700 hover:bg-gray-100 transition-colors">New Goods Receipt</button>
                                    <button onClick={() => { setIsCopyToOpen(false); navigate(`/debit-notes/new?copyFrom=${note.id}`); }} className="w-full text-left px-4 py-2 text-[12px] text-gray-700 hover:bg-gray-100 transition-colors">New Debit Note</button>

                                    <div className="h-[1px] bg-gray-100 my-1 mx-2"></div>

                                    <button onClick={() => { setIsCopyToOpen(false); navigate(`/receipts/new?copyFrom=${note.id}`); }} className="w-full text-left px-4 py-2 text-[12px] text-gray-700 hover:bg-gray-100 transition-colors">New Receipt</button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="w-[1px] h-6 bg-gray-200 mx-1"></div>
                    <div className="flex space-x-2">
                        <button onClick={() => window.print()} className="bg-white border border-gray-300 px-4 py-1.5 text-[12px] font-bold text-gray-700 rounded-md shadow-sm hover:bg-gray-50 transition-colors uppercase tracking-wider">Print</button>
                        <button 
                            onClick={async () => {
                                if (!pdfRef.current) return;
                                const html2canvas = (await import('html2canvas')).default;
                                const jsPDF = (await import('jspdf')).jsPDF;
                                
                                const element = pdfRef.current;
                                const originalStyle = element.getAttribute('style') || '';
                                element.style.maxWidth = 'none';
                                element.style.width = '850px';
                                
                                const canvas = await html2canvas(element, {
                                    scale: 2,
                                    useCORS: true,
                                    backgroundColor: '#ffffff'
                                });
                                
                                element.setAttribute('style', originalStyle);
                                
                                const imgData = canvas.toDataURL('image/png');
                                const pdf = new jsPDF('p', 'mm', 'a4');
                                const imgProps = pdf.getImageProperties(imgData);
                                const pdfWidth = pdf.internal.pageSize.getWidth();
                                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                                
                                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                                pdf.save(`${note.reference || 'DeliveryNote'}.pdf`);
                            }} 
                            className="bg-white border border-gray-300 px-4 py-1.5 text-[12px] font-bold text-gray-700 rounded-md shadow-sm hover:bg-gray-50 transition-colors uppercase tracking-wider"
                        >
                            PDF
                        </button>
                        <button className="bg-white border border-gray-300 px-4 py-1.5 text-[12px] font-bold text-gray-700 rounded-md shadow-sm hover:bg-gray-50 transition-colors uppercase tracking-wider">Email</button>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="flex bg-white border border-gray-300 rounded-md shadow-sm overflow-hidden">
                        <button onClick={handleFirst} disabled={noteIndex === 0} className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 border-r border-gray-300 disabled:opacity-30 transition-colors"><i className="fas fa-step-backward text-[10px]"></i></button>
                        <button onClick={handlePrev} disabled={noteIndex === 0} className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-colors"><i className="fas fa-backward text-[10px]"></i></button>
                    </div>
                    <span className="text-[11px] text-gray-400 mx-2 font-bold uppercase tracking-wider">{noteIndex + 1} / {allNotes.length}</span>
                    <div className="flex bg-white border border-gray-300 rounded-md shadow-sm overflow-hidden">
                        <button onClick={handleNext} disabled={noteIndex === allNotes.length - 1} className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 border-r border-gray-300 disabled:opacity-30 transition-colors"><i className="fas fa-forward text-[10px]"></i></button>
                        <button onClick={handleLast} disabled={noteIndex === allNotes.length - 1} className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-colors"><i className="fas fa-step-forward text-[10px]"></i></button>
                    </div>
                </div>
            </div>

            {/* Document */}
            <div className="flex-1 p-6 flex justify-center overflow-auto bg-[#f3f4f6]">
                <div className="bg-white shadow-xl p-12 w-full max-w-[850px] min-h-[1100px] relative font-sans text-gray-900 border border-gray-200" ref={pdfRef}>
                    <div className="flex justify-between items-start gap-12 mb-10 pb-10 border-b border-gray-100">
                        <div className="flex-1">
                            {/* Header Section */}
                            <div className="mb-6">
                                <div className="flex justify-between items-start mb-1">
                                    <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase leading-none">{note.customTitle || 'Delivery Note'}</h1>
                                </div>
                                <div className="flex items-center gap-2">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Reference: {note.reference}</p>
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${note.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' : note.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>{note.status}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-12 items-start">
                                {/* Customer */}
                                <div>
                                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-50 pb-2">Customer</h3>
                                    <p className="text-sm font-bold text-slate-900 uppercase tracking-tight mb-2">{note.customer}</p>
                                    <p className="text-gray-500 italic">No delivery address</p>
                                </div>

                                {/* Delivery Details */}
                                <div className="border-l border-gray-100 pl-12">
                                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-50 pb-2">Details</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="font-bold text-gray-500">Delivery Date:</span>
                                            <span className="font-semibold">{note.deliveryDate}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-bold text-gray-500">Reference:</span>
                                            <span className="font-semibold">{note.reference}</span>
                                        </div>
                                        {note.invoiceNumber && (
                                            <div className="flex justify-between">
                                                <span className="font-bold text-gray-500">Invoice:</span>
                                                <span className="font-semibold">{note.invoiceNumber}</span>
                                            </div>
                                        )}
                                        {note.orderNumber && (
                                            <div className="flex justify-between">
                                                <span className="font-bold text-gray-500">Order:</span>
                                                <span className="font-semibold">{note.orderNumber}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Company Logo - Large and Span across Header+Details */}
                        <div className="w-[180px] shrink-0 pt-2">
                            <img src="/logo.png" alt="Company Logo" className="w-full object-contain" />
                        </div>
                    </div>

                    {/* Description */}
                    {note.description && (
                        <div className="mb-6">
                            <h2 className="font-bold uppercase text-[15px]">{note.description}</h2>
                        </div>
                    )}

                    {/* Inventory Location */}
                    {note.inventoryLocation && (
                        <div className="mb-4 text-[13px] text-gray-600">
                            <span className="font-bold">Inventory Location:</span> {note.inventoryLocation}
                        </div>
                    )}

                    {/* Items Table */}
                    <table className="w-full border-collapse border border-gray-300 text-[13px]">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="border border-gray-300 p-3 text-left w-[40%] font-bold uppercase tracking-wider text-[11px] text-gray-600">Item</th>
                                <th className="border border-gray-300 p-3 text-left w-[40%] font-bold uppercase tracking-wider text-[11px] text-gray-600">Description</th>
                                <th className="border border-gray-300 p-3 text-center w-[20%] font-bold uppercase tracking-wider text-[11px] text-gray-600">Qty</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayItems.map((item: any, idx: number) => (
                                <tr key={item.id || idx} className="hover:bg-gray-50 transition-colors">
                                    <td className="border border-gray-300 p-3 align-top font-medium text-gray-900">{item.item || item.itemName}</td>
                                    <td className="border border-gray-300 p-3 align-top text-gray-600">{item.description}</td>
                                    <td className="border border-gray-300 p-3 text-center align-top font-bold text-gray-900">{item.qty} <span className="text-[10px] text-slate-400 font-bold ml-1 uppercase">{item.unit || ''}</span></td>
                                </tr>
                            ))}
                            {displayItems.length === 0 && (
                                <tr>
                                    <td className="border border-gray-300 p-3 align-top text-center text-gray-400 italic" colSpan={3}>No items found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Total Qty */}
                    <div className="mt-0 flex justify-end">
                        <div className="w-48">
                            <div className="grid grid-cols-[1fr_80px] border-x border-b border-gray-300 bg-gray-50">
                                <div className="p-3 text-right font-bold border-r border-gray-300 text-gray-700 uppercase tracking-wider text-[11px]">Total Qty</div>
                                <div className="p-3 text-center font-bold text-gray-900">{totalQty}</div>
                            </div>
                        </div>
                    </div>

                    {/* Footer text */}
                    {note.footers && (
                        <div className="mt-8 text-[13px] text-gray-600 border-t border-gray-200 pt-4">
                            {note.footers}
                        </div>
                    )}

                    {/* Receiver Verification Section */}
                    <div className="mt-24 pt-8 border-t border-gray-100 grid grid-cols-3 gap-12 text-[14px]">
                        <div className="flex flex-col space-y-4">
                            <span className="font-bold text-gray-700 uppercase tracking-wider text-[11px]">Receiver Name</span>
                            <div className="border-b border-gray-300 w-full pt-4"></div>
                        </div>
                        <div className="flex flex-col space-y-4">
                            <span className="font-bold text-gray-700 uppercase tracking-wider text-[11px]">Signature</span>
                            <div className="border-b border-gray-300 w-full pt-4"></div>
                        </div>
                        <div className="flex flex-col space-y-4">
                            <span className="font-bold text-gray-700 uppercase tracking-wider text-[11px]">Date</span>
                            <div className="border-b border-gray-300 w-full pt-4"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewDeliveryNoteView;
