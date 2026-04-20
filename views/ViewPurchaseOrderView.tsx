import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockPurchaseOrders, mockPurchaseInvoices, savePurchaseOrders, savePurchaseInvoices, getSuppliers } from '../mockData';
import { PurchaseOrder, Supplier } from '../types';
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
import { cn } from '../utils/cn';

const ViewPurchaseOrderView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isCopyToOpen, setIsCopyToOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const pdfRef = useRef<HTMLDivElement>(null);

    const allSuppliers = useMemo(() => getSuppliers(), []);
    const orderIndex = mockPurchaseOrders.findIndex(o => o.id === id);
    const order = mockPurchaseOrders[orderIndex];

    const supplierData = useMemo(() => {
        if (!order) return null;
        return allSuppliers.find(s => s.name === order.supplier);
    }, [order, allSuppliers]);

    const supplierEmail = supplierData?.email || (order ? `${order.supplier.toLowerCase().replace(/\s+/g, '.')}@example.com` : '');

    const totals = useMemo(() => {
        let subtotal = 0;
        let tax = 0;
        const isTaxInclusive = order.options?.amountsAreTaxInclusive || false;

        if (order.items && order.items.length > 0) {
            order.items.forEach((item: any) => {
                const qty = parseFloat(item.qty as any) || 0;
                const price = parseFloat(item.unitPrice as any) || 0;
                const lineTotal = qty * price;

                if (isTaxInclusive) {
                    const lineTax = lineTotal - (lineTotal / 1.16);
                    tax += lineTax;
                    subtotal += (lineTotal - lineTax);
                } else {
                    subtotal += lineTotal;
                    tax += lineTotal * 0.16;
                }
            });
        } else {
            const grandTotal = parseFloat(order.amount as any) || 0;
            if (isTaxInclusive) {
                tax = grandTotal - (grandTotal / 1.16);
                subtotal = grandTotal - tax;
            } else {
                subtotal = grandTotal;
                tax = grandTotal * 0.16;
            }
        }
        return { subtotal, tax, total: subtotal + tax };
    }, [order]);

    const handleStatusChange = (newStatus: string, shouldInvoice: boolean = false) => {
        const orders = [...mockPurchaseOrders];
        const index = orders.findIndex(o => o.id === id);
        if (index !== -1) {
            const finalStatus = shouldInvoice ? 'Invoiced' : newStatus;
            (orders[index] as any).status = finalStatus;

            if (shouldInvoice) {
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
                navigate('/purchase-invoices');
                return;
            }

            savePurchaseOrders(orders);
            window.dispatchEvent(new Event('purchase_orders_updated'));
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsCopyToOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!order) return <div className="p-8 text-center text-slate-500 font-black uppercase tracking-widest">Purchase Order not found.</div>;

    return (
        <div className="min-h-screen bg-[#f3f4f6]/50 flex flex-col font-sans">
            {/* Compact Action Toolbar */}
            <div className="bg-[#f8fafc] border-b border-gray-300 px-6 py-3 flex items-center justify-between sticky top-0 z-50 no-print">
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => navigate('/purchase-orders')}
                        className="bg-white border border-gray-300 px-4 py-1.5 text-[12px] font-bold text-gray-700 rounded shadow-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                        <ChevronLeft size={14} /> Back
                    </button>

                    <button
                        onClick={() => navigate(`/purchase-orders/edit/${order.id}`)}
                        className="bg-white border border-gray-300 px-4 py-1.5 text-[12px] font-bold text-gray-700 rounded shadow-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                        <Edit size={14} className="text-blue-600" /> Edit
                    </button>

                    {(order.status === 'Draft' || order.status === 'Pending' || order.status === 'Pending Approval') && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleStatusChange('Invoiced', true)}
                                className="bg-emerald-600 text-white border border-emerald-700 px-4 py-1.5 text-[12px] font-bold rounded shadow-sm hover:bg-emerald-700 flex items-center gap-2 transition-all"
                            >
                                <CheckCircle2 size={14} /> Approve & Invoice
                            </button>
                            <button
                                onClick={() => handleStatusChange('Rejected')}
                                className="bg-white border border-rose-200 px-4 py-1.5 text-[12px] font-bold text-rose-600 rounded shadow-sm hover:bg-rose-50 flex items-center gap-2"
                            >
                                <XCircle size={14} /> Reject
                            </button>
                        </div>
                    )}

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
                                    { label: 'Purchase Quote', path: '/purchase-quotes/new' },
                                    { label: 'Purchase Order', path: '/purchase-orders/new' },
                                    { label: 'Purchase Invoice', path: '/purchase-invoices/new' },
                                    { label: 'Goods Receipt', path: '/goods-receipts/new' },
                                    { label: 'Debit Note', path: '/debit-notes/new' }
                                ].map(item => (
                                    <button
                                        key={item.label}
                                        onClick={() => { setIsCopyToOpen(false); navigate(`${item.path}?copyFrom=${order.id}`); }}
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
                                pdf.save(`${order.reference || 'PurchaseOrder'}.pdf`);
                            }} 
                            className="bg-white border border-gray-300 px-4 py-1.5 text-[12px] font-bold text-gray-700 rounded shadow-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                            <Download size={14} /> PDF
                        </button>
                        <button
                            onClick={() => {
                                const subject = encodeURIComponent(`Purchase Order: ${order.reference}`);
                                const body = encodeURIComponent(`Dear ${order.supplier},\n\nPlease find attached our purchase order ${order.reference}.\n\nKind regards.`);
                                window.location.href = `mailto:${supplierEmail}?subject=${subject}&body=${body}`;
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
                            onClick={() => navigate(`/purchase-orders/view/${mockPurchaseOrders[0].id}`)}
                            disabled={orderIndex <= 0}
                            className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 border-r border-gray-300 disabled:opacity-30 flex items-center"
                        >
                            <ChevronLeft size={14} /> <ChevronLeft size={14} className="-ml-2" />
                        </button>
                        <button
                            onClick={() => navigate(`/purchase-orders/view/${mockPurchaseOrders[Math.max(0, orderIndex - 1)].id}`)}
                            disabled={orderIndex <= 0}
                            className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-30 flex items-center"
                        >
                            <ChevronLeft size={14} />
                        </button>
                    </div>
                    <span className="text-[11px] font-bold text-gray-400 mx-2 uppercase tracking-widest">{orderIndex + 1} / {mockPurchaseOrders.length}</span>
                    <div className="flex bg-white border border-gray-300 rounded shadow-sm">
                        <button
                            onClick={() => navigate(`/purchase-orders/view/${mockPurchaseOrders[Math.min(mockPurchaseOrders.length - 1, orderIndex + 1)].id}`)}
                            disabled={orderIndex === mockPurchaseOrders.length - 1}
                            className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 border-r border-gray-300 disabled:opacity-30 flex items-center"
                        >
                            <ChevronRight size={14} />
                        </button>
                        <button
                            onClick={() => navigate(`/purchase-orders/view/${mockPurchaseOrders[mockPurchaseOrders.length - 1].id}`)}
                            disabled={orderIndex === mockPurchaseOrders.length - 1}
                            className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-30 flex items-center"
                        >
                            <ChevronRight size={14} /> <ChevronRight size={14} className="-ml-2" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-6 flex justify-start overflow-auto print:p-0">
                <div className="print-container bg-white shadow-xl p-12 w-[850px] max-w-full text-[13px] text-gray-800 relative" ref={pdfRef}>
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
                                <div className="flex justify-between items-center mb-1">
                                    <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase leading-none">
                                        {(order.options?.customTitle && order.options?.customTitleValue) ? order.options.customTitleValue : (order.customTitle || 'Purchase Order')}
                                    </h1>
                                </div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Reference: {order.reference}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-12 items-start">
                                {/* Vendor */}
                                <div>
                                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-50 pb-2">Vendor / Supplier</h3>
                                    <p className="text-sm font-bold text-slate-900 uppercase tracking-tight mb-2">{order.supplier}</p>
                                    <div className="text-gray-500 space-y-1">
                                        <p className="whitespace-pre-wrap">{supplierData?.billingAddress || order.billingAddress || '-'}</p>
                                        {supplierEmail && <p className="text-blue-600 lowercase">{supplierEmail}</p>}
                                    </div>
                                </div>

                                {/* Order Details */}
                                <div className="border-l border-gray-100 pl-12">
                                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-50 pb-2">Order Details</h3>
                                    <div className="space-y-3">
                                        <div className="flex">
                                            <span className="w-32 text-gray-500">Order Date:</span>
                                            <span className="font-semibold">{order.orderDate}</span>
                                        </div>
                                        <div className="flex">
                                            <span className="w-32 text-gray-500">Currency:</span>
                                            <span className="font-semibold">{order.currency || 'ZMW'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Company Logo */}
                        <div className="w-[180px] shrink-0 pt-2">
                            <img src="/logo.png" alt="Company Logo" className="w-full object-contain" />
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="mb-14">
                        <table className="w-full text-left">
                            <thead className="bg-[#f8fafc] border-y border-gray-200 overflow-hidden text-right print-bg-slate-50">
                                <tr>
                                    {order.options?.columnLineNumber !== false && <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-left w-12">#</th>}
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-left">Item</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-left">Description</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Qty</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Unit Price</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {order.items && order.items.length > 0 ? order.items.map((item: any, idx: number) => (
                                    <tr key={idx}>
                                        {order.options?.columnLineNumber !== false && <td className="px-4 py-4 text-slate-400 font-medium text-[12px]">{idx + 1}</td>}
                                        <td className="px-4 py-4">
                                            <p className="font-semibold text-slate-900">{item.item || item.itemName || '-'}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-gray-500">{item.description || '-'}</p>
                                        </td>
                                        <td className="px-4 py-4 text-right font-medium">{item.qty} <span className="text-[10px] text-slate-400 font-bold ml-1 uppercase">{item.unit || ''}</span></td>
                                        <td className="px-4 py-4 text-right font-medium">{(parseFloat(item.unitPrice as any) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="px-4 py-4 text-right font-semibold">{((parseFloat(item.qty as any) || 0) * (parseFloat(item.unitPrice as any) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        {order.options?.columnLineNumber !== false && <td className="px-4 py-5 text-slate-400 font-medium text-[12px]">1</td>}
                                        <td className="px-4 py-5 font-semibold text-slate-900">General Item</td>
                                        <td className="px-4 py-5 font-medium text-slate-500">{order.description || '-'}</td>
                                        <td className="px-4 py-5 text-right font-medium">1</td>
                                        <td className="px-4 py-5 text-right font-medium">{(parseFloat(order.amount as any) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="px-4 py-5 text-right font-semibold">{(parseFloat(order.amount as any) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Totals Section */}
                    <div className="flex justify-end items-start gap-12 mt-8 mb-12">
                        <div className="w-80 space-y-3">
                            <div className="flex justify-between items-center text-gray-500">
                                <span className="text-[11px] font-bold uppercase tracking-widest">{order.options?.amountsAreTaxInclusive ? 'Subtotal (Excl. Tax)' : 'Subtotal'}</span>
                                <span className="font-semibold">{totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center text-gray-500 pb-2 border-b border-gray-50">
                                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Sales Tax (16%)</span>
                                <span className="font-semibold">{totals.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-50 p-4 border-t-2 border-slate-900 mt-2 print-bg-slate-50">
                                <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-slate-900">Total</span>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{order.currency?.split(' ')[0] || 'ZMW'}</p>
                                    <p className="text-2xl font-bold text-slate-900 tracking-tighter">{totals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-start gap-12 mt-12 pb-20 relative">
                        <div className="flex-1">
                             <div className="pt-8 border-t border-gray-100">
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-12">Authorized Signature</p>
                                <div className="relative">
                                    <div className="w-48 h-[1px] bg-gray-300"></div>
                                    <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-widest">Stamp & Date</p>
                                </div>
                             </div>
                        </div>
                    </div>

                    {order.options?.footers && order.options?.footerValue && (
                        <div className="mt-12 pt-8 border-t border-gray-100">
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Terms & Conditions</p>
                            <p className="text-[12px] text-gray-600 leading-relaxed whitespace-pre-wrap">{order.options.footerValue}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-[#f3f4f6] px-8 py-4 border-t border-gray-200 flex justify-end no-print">
                <div className="flex space-x-2">
                    <button onClick={() => window.print()} className="bg-white border border-gray-300 px-6 py-2 text-[11px] font-bold text-gray-700 rounded-md shadow-sm hover:bg-gray-50 transition uppercase tracking-widest flex items-center gap-2">
                        <Printer size={14} /> Print Document
                    </button>
                    <button onClick={() => navigate(`/purchase-orders/edit/${order.id}`)} className="bg-blue-600 text-white px-6 py-2 text-[11px] font-bold rounded-md shadow-md hover:bg-blue-700 transition uppercase tracking-widest flex items-center gap-2">
                        <Edit size={14} /> Edit Order
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ViewPurchaseOrderView;
