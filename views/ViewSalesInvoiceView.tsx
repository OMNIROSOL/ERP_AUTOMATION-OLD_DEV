import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockInvoices, getCustomers, mockSalesOrders, mockSalesQuotes, getDeliveryNotes, saveDeliveryNotes, saveInvoices, getInvoices } from '../mockData';
import { Invoice, Customer } from '../types';
import {
    Printer,
    FileText,
    Mail,
    Edit,
    ChevronRight,
    ChevronLeft,
    Download,
    Copy,
    Clock,
    User,
    MapPin,
    Calendar,
    Hash,
    CheckCircle2,
    XCircle,
    Package
} from 'lucide-react';
import Badge from '../components/shared/Badge';
import { cn } from '../utils/cn';

const ViewSalesInvoiceView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isCopyToOpen, setIsCopyToOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const allCustomers = useMemo(() => getCustomers(), []);
    const invoiceIndex = mockInvoices.findIndex(inv => inv.id === id || inv.id === `inv-${id}` || inv.id.toString() === id);
    const invoice = mockInvoices[invoiceIndex];

    const customerData = useMemo(() => {
        if (!invoice) return null;
        return allCustomers.find(c => c.name === invoice.customer);
    }, [invoice, allCustomers]);

    const customerEmail = customerData?.email || (invoice ? `${invoice.customer.toLowerCase().replace(/\s+/g, '.')}@example.com` : '');

    const totals = useMemo(() => {
        if (!invoice) return { subtotal: 0, tax: 0, total: 0 };
        if (!invoice.items || invoice.items.length === 0) return { subtotal: invoice.invoiceAmount, tax: 0, total: invoice.invoiceAmount };
        let subtotal = 0;
        let tax = 0;
        invoice.items.forEach(item => {
            const qty = parseFloat(item.qty as any) || 0;
            const price = parseFloat(item.unitPrice as any) || 0;
            const lineTotal = qty * price;
            subtotal += lineTotal;
            if (item.taxCode && item.taxCode.includes('16%')) {
                tax += lineTotal * 0.16;
            }
        });
        return { subtotal, tax, total: invoice.invoiceAmount };
    }, [invoice]);

    const handleMoveToDeliveryNote = () => {
        if (!invoice) return;
        const notes = getDeliveryNotes();
        const nextRef = invoice.reference;
        const customerInfo = allCustomers.find(c => c.name === invoice.customer);
        const newId = Date.now().toString();

        const newNote = {
            id: newId,
            deliveryDate: new Date().toLocaleDateString('en-GB').replace(/\//g, '.'),
            customer: invoice.customer,
            deliveryAddress: (invoice as any).billingAddress || customerInfo?.billingAddress || '',
            description: `Shipment for Invoice ${invoice.reference}`,
            reference: nextRef,
            orderNumber: invoice.salesOrder || '',
            invoiceNumber: invoice.reference,
            status: 'Pending' as 'Pending',
            timestamp: new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).replace(/\//g, '.').replace(',', '').toUpperCase(),
            items: (invoice.items || []).map((it: any, idx: number) => ({
                id: Date.now() + idx,
                item: it.item,
                description: it.description || '',
                qty: it.qty,
                unitPrice: it.unitPrice || '0',
                taxCode: it.taxCode || ''
            }))
        };

        saveDeliveryNotes([newNote, ...notes]);
        const allInvoices = getInvoices();
        const updatedInvoices = allInvoices.map(i => i.id === invoice.id ? { ...i, status: 'Delivered' } : i);
        saveInvoices(updatedInvoices);
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('invoices_updated'));
        navigate('/delivery-notes');
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsCopyToOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!invoice) return <div className="p-8 text-center text-slate-500 font-black uppercase tracking-widest">Invoice not found.</div>;

    return (
        <div className="min-h-screen bg-[#f3f4f6]/50 flex flex-col font-sans">
            {/* Compact Action Toolbar - Matching Sales Order View */}
            <div className="bg-[#f8fafc] border-b border-gray-300 px-6 py-3 flex items-center justify-between sticky top-0 z-50 no-print">
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => navigate('/sales-invoices')}
                        className="bg-white border border-gray-300 px-4 py-1.5 text-[12px] font-bold text-gray-700 rounded shadow-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                        <ChevronLeft size={14} /> Back
                    </button>

                    <button
                        onClick={() => navigate(`/sales-invoices/edit/${invoice.id}`)}
                        className="bg-white border border-gray-300 px-4 py-1.5 text-[12px] font-bold text-gray-700 rounded shadow-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                        <Edit size={14} className="text-blue-600" /> Edit
                    </button>

                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsCopyToOpen(!isCopyToOpen)}
                            className="bg-white border border-gray-300 px-4 py-1.5 text-[12px] font-bold text-gray-700 rounded shadow-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                            <Copy size={14} /> Copy To
                        </button>
                        {isCopyToOpen && (
                            <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 shadow-xl rounded py-1 z-[100]">
                                {[
                                    { label: 'Sales Quote', path: '/sales-quotes/new' },
                                    { label: 'Sales Order', path: '/sales-orders/new' },
                                    { label: 'Sales Invoice', path: '/sales-invoices/new' },
                                    { label: 'Delivery Note', path: '/delivery-notes/new' },
                                    { label: 'Credit Note', path: '/credit-notes/new' },
                                    { label: 'Purchase Quote', path: '/purchase-quotes/new' },
                                    { label: 'Purchase Order', path: '/purchase-orders/new' },
                                    { label: 'Purchase Invoice', path: '/purchase-invoices/new' },
                                    { label: 'Goods Receipt', path: '/goods-receipts/new' },
                                    { label: 'Debit Note', path: '/debit-notes/new' },
                                    { label: 'Receipt', path: '/receipts/new' }
                                ].map(item => (
                                    <button
                                        key={item.label}
                                        onClick={() => {
                                            setIsCopyToOpen(false);
                                            if (item.label === 'Delivery Note') {
                                                handleMoveToDeliveryNote();
                                            } else {
                                                navigate(`${item.path}?copyFrom=${invoice.id}`);
                                            }
                                        }}
                                        className="w-full text-left px-4 py-2 text-[12px] text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                    >
                                        {item.label === 'Delivery Note' ? 'Move to Delivery Note' : `New ${item.label}`}
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
                        <button 
                            onClick={async () => {
                                if (!pdfRef.current) return;
                                const html2canvas = (await import('html2canvas')).default;
                                const jsPDF = (await import('jspdf')).jsPDF;
                                
                                const element = pdfRef.current;
                                // Temporarily remove max-width and internal scrolling for clean capture
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
                                pdf.save(`${invoice.reference || 'Invoice'}.pdf`);
                            }} 
                            className="bg-white border border-gray-300 px-4 py-1.5 text-[12px] font-bold text-gray-700 rounded shadow-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                            <Download size={14} /> PDF
                        </button>
                        <button
                            onClick={() => {
                                const subject = encodeURIComponent(`Sales Invoice: ${invoice.reference}`);
                                const body = encodeURIComponent(`Dear ${invoice.customer},\n\nPlease find attached our sales invoice ${invoice.reference}.\n\nThank you for your business.`);
                                window.location.href = `mailto:${customerEmail}?subject=${subject}&body=${body}`;
                            }}
                            className="bg-white border border-gray-300 px-4 py-1.5 text-[12px] font-bold text-gray-700 rounded shadow-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                            <Mail size={14} /> Email
                        </button>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <div className="flex bg-white border border-gray-300 rounded shadow-sm">
                        <button
                            onClick={() => navigate(`/sales-invoices/view/${mockInvoices[0].id}`)}
                            disabled={invoiceIndex <= 0}
                            className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 border-r border-gray-300 disabled:opacity-30 flex items-center"
                        >
                            <ChevronLeft size={14} /> <ChevronLeft size={14} className="-ml-2" />
                        </button>
                        <button
                            onClick={() => navigate(`/sales-invoices/view/${mockInvoices[Math.max(0, invoiceIndex - 1)].id}`)}
                            disabled={invoiceIndex <= 0}
                            className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-30 flex items-center"
                        >
                            <ChevronLeft size={14} />
                        </button>
                    </div>
                    <span className="text-[11px] font-bold text-gray-400 mx-2 uppercase tracking-widest">{invoiceIndex + 1} / {mockInvoices.length}</span>
                    <div className="flex bg-white border border-gray-300 rounded shadow-sm">
                        <button
                            onClick={() => navigate(`/sales-invoices/view/${mockInvoices[Math.min(mockInvoices.length - 1, invoiceIndex + 1)].id}`)}
                            disabled={invoiceIndex === mockInvoices.length - 1}
                            className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 border-r border-gray-300 disabled:opacity-30 flex items-center"
                        >
                            <ChevronRight size={14} />
                        </button>
                        <button
                            onClick={() => navigate(`/sales-invoices/view/${mockInvoices[mockInvoices.length - 1].id}`)}
                            disabled={invoiceIndex === mockInvoices.length - 1}
                            className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-30 flex items-center"
                        >
                            <ChevronRight size={14} /> <ChevronRight size={14} className="-ml-2" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-6 flex justify-start overflow-auto print:p-0">
                <div className="print-container bg-white shadow-xl p-12 w-[850px] max-w-full text-[13px] text-gray-800 relative">
                    <style>{`
                        @media print {
                            @page { margin: 10mm; size: auto; }
                            html, body, #root, #root > div, main { 
                                background: white !important; 
                                padding: 0 !important; 
                                -webkit-print-color-adjust: exact !important; 
                                print-color-adjust: exact !important;
                                font-family: sans-serif !important; 
                                height: auto !important; 
                                min-height: none !important; 
                                overflow: visible !important; 
                                display: block !important; 
                            }
                            .no-print, nav, aside, header, .nav-bar, .side-bar, button, .breadcrumb-bar { display: none !important; }
                            .print-container { 
                                border: none !important; 
                                box-shadow: none !important; 
                                max-width: none !important; 
                                width: 100% !important; 
                                position: static !important;
                                padding: 48px !important;
                                background: white !important;
                                margin: 0 !important;
                            }
                            .print-bg-slate-50 {
                                background-color: #f8fafc !important;
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                            }
                        }
                    `}</style>

                    <div className="flex justify-between items-start gap-12 mb-10 pb-10 border-b border-gray-100">
                        <div className="flex-1">
                            {/* Header Section */}
                            <div className="mb-6">
                                <div className="flex justify-between items-start mb-1">
                                    <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase leading-none">{invoice.customTitle || 'Sales Invoice'}</h1>
                                </div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Reference: {invoice.reference}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-12 items-start">
                                {/* Billed To */}
                                <div>
                                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-50 pb-2">Billed To</h3>
                                    <p className="text-sm font-bold text-slate-900 uppercase tracking-tight mb-2">{invoice.customer}</p>
                                    <div className="text-gray-500 space-y-1">
                                        <p className="whitespace-pre-wrap">{customerData?.billingAddress || invoice.billingAddress || '-'}</p>
                                        {customerEmail && <p className="text-blue-600 lowercase">{customerEmail}</p>}
                                        {invoice.tpin && <p className="text-[11px] font-bold text-slate-400 mt-2 uppercase tracking-widest">TPIN: {invoice.tpin}</p>}
                                    </div>
                                </div>

                                {/* Invoice Details */}
                                <div className="border-l border-gray-100 pl-12">
                                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-50 pb-2">Invoice Details</h3>
                                    <div className="space-y-3">
                                        <div className="flex">
                                            <span className="w-32 text-gray-500">Issue Date:</span>
                                            <span className="font-semibold">{invoice.issueDate}</span>
                                        </div>
                                        <div className="flex">
                                            <span className="w-32 text-gray-500">Due Date:</span>
                                            <span className="font-semibold text-indigo-600">{invoice.dueDate || '-'}</span>
                                        </div>
                                        <div className="flex">
                                            <span className="w-32 text-gray-500">Currency:</span>
                                            <span className="font-semibold">{invoice.currency || 'ZMW'}</span>
                                        </div>
                                        {invoice.options?.actsAsDeliveryNote && (
                                            <div className="flex text-emerald-700 bg-emerald-50/50 p-2 -m-2 rounded-lg border border-transparent hover:border-emerald-100 transition-colors">
                                                <span className="w-32 font-bold uppercase text-[10px] tracking-widest flex items-center gap-1.5">
                                                    <Package size={12} /> Delivery Date:
                                                </span>
                                                <span className="font-bold">
                                                    {invoice.options.deliveryDate?.includes('-') 
                                                        ? invoice.options.deliveryDate.split('-').reverse().join('.') 
                                                        : invoice.options.deliveryDate || invoice.issueDate}
                                                </span>
                                            </div>
                                        )}
                                        {invoice.timestamp && (
                                            <div className="flex">
                                                <span className="w-32 text-gray-500">Timestamp:</span>
                                                <span className="font-semibold text-[11px] text-slate-400 tracking-tight">{invoice.timestamp}</span>
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

                    {/* Items Table */}
                    <div className="mb-14">
                        <table className="w-full text-left">
                            <thead className="bg-[#f8fafc] border-y border-gray-200 overflow-hidden text-right print-bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-left w-12">#</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-left">Item</th>
                                    {invoice.options?.columnDescription && <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-left">Description</th>}
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Qty</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Unit Price</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {invoice.items && invoice.items.length > 0 ? invoice.items.map((item: any, idx: number) => (
                                    <tr key={idx}>
                                        <td className="px-4 py-4 text-slate-400 font-medium text-[12px]">{idx + 1}</td>
                                        <td className="px-4 py-4">
                                            <p className="font-semibold text-slate-900">{item.item || item.itemName || '-'}</p>
                                        </td>
                                        {invoice.options?.columnDescription && (
                                            <td className="px-4 py-4">
                                                <p className="text-gray-500">{item.description || '-'}</p>
                                            </td>
                                        )}
                                        <td className="px-4 py-4 text-right font-medium">{item.qty} <span className="text-[10px] text-slate-400 font-bold ml-1 uppercase">{item.unit || ''}</span></td>
                                        <td className="px-4 py-4 text-right font-medium">{(parseFloat(item.unitPrice as any) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="px-4 py-4 text-right font-semibold">{((parseFloat(item.qty as any) || 0) * (parseFloat(item.unitPrice as any) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td className="px-4 py-5 text-slate-400 font-medium text-[12px]">1</td>
                                        <td className="px-4 py-5 font-semibold text-slate-900">General Item</td>
                                        <td className="px-4 py-5 font-medium text-slate-500">{invoice.description || '-'}</td>
                                        <td className="px-4 py-5 text-right font-medium">1</td>
                                        <td className="px-4 py-5 text-right font-medium">{(parseFloat(invoice.invoiceAmount as any) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="px-4 py-5 text-right font-semibold">{(parseFloat(invoice.invoiceAmount as any) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Bottom Area: Banking & Totals */}
                    <div className="flex justify-between items-start gap-12">
                        {/* Banking Details */}
                        <div className="flex-1 pt-6 border-t border-gray-100">
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-50 pb-2">Banking Details</h3>
                            <div className="space-y-2 text-[12px]">
                                <p className="font-bold text-slate-900 tracking-tight">INDO ZAMBIA BANK</p>
                                <div className="grid grid-cols-[100px_1fr] gap-x-2 gap-y-1">
                                    <span className="text-gray-500 uppercase">Name:</span>
                                    <span className="font-semibold text-slate-700">MAHANT INVESTMENTS LTD</span>

                                    <span className="text-gray-500 uppercase">ZMW Account:</span>
                                    <span className="font-bold text-indigo-600">0342050000007</span>

                                    <span className="text-gray-500 uppercase">Branch:</span>
                                    <span className="font-semibold text-slate-700">MAIN BRANCH</span>

                                    <span className="text-gray-500 uppercase">Sort Code:</span>
                                    <span className="font-semibold text-slate-700">090034</span>

                                    <span className="text-gray-500 uppercase">Swift Code:</span>
                                    <span className="font-semibold text-slate-700">INZAZMLX</span>
                                </div>
                            </div>
                        </div>

                        {/* Summary Section */}
                        <div className="w-80 space-y-3">
                            <div className="flex justify-between items-center text-gray-500">
                                <span className="text-[11px] font-bold uppercase tracking-widest">Subtotal</span>
                                <span className="font-semibold">{totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center text-gray-500">
                                <span className="text-[11px] font-bold uppercase tracking-widest">Sales Tax (16%)</span>
                                <span className="font-semibold">{totals.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-50 p-4 border-t-2 border-slate-900 mt-2 print-bg-slate-50">
                                <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-slate-900">Total</span>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{invoice.currency?.split(' ')[0] || 'ZMW'}</p>
                                    <p className="text-2xl font-bold text-slate-900 tracking-tighter">{invoice.invoiceAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-[#f3f4f6] px-8 py-4 border-t border-gray-200 flex justify-end no-print">
                <div className="flex space-x-2">
                    <button onClick={() => navigate(`/sales-invoices/print-batch?ids=${invoice.id}`)} className="bg-white border border-gray-300 px-6 py-2 text-[11px] font-bold text-gray-700 rounded-md shadow-sm hover:bg-gray-50 transition uppercase tracking-widest flex items-center gap-2">
                        <Printer size={14} /> Print Document
                    </button>
                    <button onClick={() => navigate(`/sales-invoices/edit/${invoice.id}`)} className="bg-blue-600 text-white px-6 py-2 text-[11px] font-bold rounded-md shadow-md hover:bg-blue-700 transition uppercase tracking-widest flex items-center gap-2">
                        <Edit size={14} /> Edit Invoice
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ViewSalesInvoiceView;
