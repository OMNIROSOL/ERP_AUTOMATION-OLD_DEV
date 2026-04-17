import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockPurchaseQuotes, getSuppliers } from '../mockData';
import { PurchaseQuote } from '../types';
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
    ChevronsLeft,
    ChevronsRight
} from 'lucide-react';
import Badge from '../components/shared/Badge';
import { cn } from '../utils/cn';

const ViewPurchaseQuoteView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isCopyToOpen, setIsCopyToOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const pdfRef = useRef<HTMLDivElement>(null);

    const allSuppliers = useMemo(() => getSuppliers(), []);
    const quoteIndex = mockPurchaseQuotes.findIndex(q => q.id === id);
    const quote = mockPurchaseQuotes[quoteIndex];

    const supplierData = useMemo(() => {
        if (!quote) return null;
        return allSuppliers.find(s => s.name === quote.supplier);
    }, [quote, allSuppliers]);

    const supplierEmail = supplierData?.email || (quote ? `${quote.supplier.toLowerCase().replace(/\s+/g, '.')}@example.com` : '');

    const totals = useMemo(() => {
        if (!quote) return { subtotal: 0, tax: 0, total: 0, withholdingTaxAmount: 0 };
        const isTaxInclusive = quote.options?.amountsAreTaxInclusive || false;

        let subtotal = 0;
        let tax = 0;
        
        const lineItems = quote.items || [];
        lineItems.forEach(item => {
            const qty = parseFloat(item.qty) || 0;
            const price = parseFloat(item.unitPrice) || 0;
            const discount = parseFloat(item.discount || '0') || 0;

            let lineTotal = qty * price;
            if (quote.options?.columnDiscount) {
                if (quote.options?.columnDiscountType === 'Percentage') {
                    lineTotal = lineTotal * (1 - discount / 100);
                } else {
                    lineTotal = lineTotal - discount;
                }
            }

            let lineTax = 0;
            if (item.taxCode === 'VAT 16%') {
                if (isTaxInclusive) {
                    lineTax = lineTotal * 0.16 / 1.16;
                    tax += lineTax;
                    subtotal += (lineTotal - lineTax);
                } else {
                    subtotal += lineTotal;
                    lineTax = lineTotal * 0.16;
                    tax += lineTax;
                }
            } else {
                subtotal += lineTotal;
            }
        });

        let total = subtotal + tax;
        
        if (quote.options?.rounding) {
            if (quote.options.roundingType === 'Round to nearest') total = Math.round(total);
            else if (quote.options.roundingType === 'Round down') total = Math.floor(total);
        }

        let withholdingTaxAmount = 0;
        if (quote.options?.withholdingTax) {
            const val = parseFloat(quote.options.withholdingTaxValue) || 0;
            if (quote.options.withholdingTaxType === 'Rate') {
                withholdingTaxAmount = subtotal * (val / 100);
            } else {
                withholdingTaxAmount = val;
            }
            total -= withholdingTaxAmount;
        }

        return { subtotal, tax, total, withholdingTaxAmount };
    }, [quote]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsCopyToOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!quote) return <div className="p-8 text-center text-slate-500 font-black uppercase tracking-widest">Quote not found.</div>;

    const showDiscount = quote.options?.columnDiscount;

    return (
        <div className="min-h-screen bg-[#f3f4f6]/50 flex flex-col font-sans">
            <div className="bg-[#f8fafc] border-b border-gray-300 px-6 py-3 flex items-center justify-between sticky top-0 z-50 no-print">
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => navigate('/purchase-quotes')}
                        className="bg-white border border-gray-300 px-4 py-1.5 text-[12px] font-bold text-gray-700 rounded shadow-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                        <ChevronLeft size={14} /> Back
                    </button>

                    <button
                        onClick={() => navigate(`/purchase-quotes/edit/${quote.id}`)}
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
                                    { label: 'Purchase Quote', path: '/purchase-quotes/new' },
                                    { label: 'Sales Order', path: '/sales-orders/new' },
                                    { label: 'Sales Invoice', path: '/sales-invoices/new' },
                                    { label: 'Delivery Note', path: '/delivery-notes/new' },
                                    { label: 'Credit Note', path: '/credit-notes/new' },
                                    { label: 'Purchase Order', path: '/purchase-orders/new' },
                                    { label: 'Purchase Invoice', path: '/purchase-invoices/new' },
                                    { label: 'Goods Receipt', path: '/goods-receipts/new' },
                                    { label: 'Debit Note', path: '/debit-notes/new' }
                                ].map(item => (
                                    <button
                                        key={item.label}
                                        onClick={() => { setIsCopyToOpen(false); navigate(`${item.path}?copyFrom=${quote.id}`); }}
                                        className="w-full text-left px-4 py-2 text-[12px] text-gray-700 hover:bg-blue-50 transition-colors"
                                    >
                                        New {item.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

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
                                pdf.save(`${quote.reference || 'PurchaseQuote'}.pdf`);
                            }} 
                            className="bg-white border border-gray-300 px-4 py-1.5 text-[12px] font-bold text-gray-700 rounded shadow-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                            <Download size={14} /> PDF
                        </button>
                        <button
                            onClick={() => {
                                const subject = encodeURIComponent(`Purchase Quote: ${quote.reference}`);
                                const body = encodeURIComponent(`Dear ${quote.supplier},\n\nRegarding purchase quote ${quote.reference}.\n\nThank you.`);
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
                            onClick={() => navigate(`/purchase-quotes/view/${mockPurchaseQuotes[0].id}`)}
                            disabled={quoteIndex <= 0}
                            className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 border-r border-gray-300 disabled:opacity-30 flex items-center"
                        >
                            <ChevronLeft size={14} /> <ChevronLeft size={14} className="-ml-2" />
                        </button>
                        <button
                            onClick={() => navigate(`/purchase-quotes/view/${mockPurchaseQuotes[Math.max(0, quoteIndex - 1)].id}`)}
                            disabled={quoteIndex <= 0}
                            className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-30 flex items-center"
                        >
                            <ChevronLeft size={14} />
                        </button>
                    </div>
                    <span className="text-[11px] font-bold text-gray-400 mx-2 uppercase tracking-widest">{quoteIndex + 1} / {mockPurchaseQuotes.length}</span>
                    <div className="flex bg-white border border-gray-300 rounded shadow-sm">
                        <button
                            onClick={() => navigate(`/purchase-quotes/view/${mockPurchaseQuotes[Math.min(mockPurchaseQuotes.length - 1, quoteIndex + 1)].id}`)}
                            disabled={quoteIndex === mockPurchaseQuotes.length - 1}
                            className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 border-r border-gray-300 disabled:opacity-30 flex items-center"
                        >
                            <ChevronRight size={14} />
                        </button>
                        <button
                            onClick={() => navigate(`/purchase-quotes/view/${mockPurchaseQuotes[mockPurchaseQuotes.length - 1].id}`)}
                            disabled={quoteIndex === mockPurchaseQuotes.length - 1}
                            className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-30 flex items-center"
                        >
                            <ChevronRight size={14} /> <ChevronRight size={14} className="-ml-2" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-6 flex justify-center overflow-auto print:p-0">
                <div className="bg-white shadow-xl p-12 w-[850px] max-w-full text-[13px] text-gray-800 relative" ref={pdfRef}>
                    <div className="flex justify-between items-start gap-12 mb-10 pb-10 border-b border-gray-100">
                        <div className="flex-1">
                            <div className="mb-6">
                                <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase leading-none">
                                    {(quote.options?.customTitle && quote.options?.customTitleValue) ? quote.options.customTitleValue : (quote.customTitle || 'Purchase Quotation')}
                                </h1>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Ref: {quote.reference}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-12">
                                <div>
                                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-50 pb-2">Supplier</h3>
                                    <p className="text-sm font-bold text-slate-900 uppercase tracking-tight mb-2">{quote.supplier}</p>
                                </div>
                                <div className="border-l border-gray-100 pl-12">
                                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-50 pb-2">Quote Info</h3>
                                    <div className="space-y-2">
                                         <div className="flex justify-between"><span>Issue Date:</span><span className="font-semibold">{quote.issueDate}</span></div>
                                         <div className="flex justify-between"><span>Currency:</span><span className="font-semibold">{quote.currency}</span></div>
                                     </div>
                                </div>
                            </div>
                        </div>
                        <div className="w-[180px] shrink-0 pt-2"><img src="/logo.png" alt="Logo" className="w-full object-contain" /></div>
                    </div>

                    <table className="w-full text-left mb-10">
                        <thead className="bg-[#f8fafc]">
                            <tr>
                                {quote.options?.columnLineNumber !== false && <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-left w-12">#</th>}
                                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-left">Item</th>
                                {quote.options?.columnDescription !== false && <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-left">Description</th>}
                                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Qty</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Unit Price</th>
                                {showDiscount && <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Disc</th>}
                                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="text-[12px]">
                            {quote.items?.map((item, idx) => {
                                const qty = parseFloat(item.qty) || 0;
                                const price = parseFloat(item.unitPrice) || 0;
                                const discount = parseFloat(item.discount || '0') || 0;
                                let lineTotal = qty * price;
                                if (showDiscount) {
                                    if (quote.options?.columnDiscountType === 'Percentage') lineTotal *= (1 - discount / 100);
                                    else lineTotal -= discount;
                                }
                                return (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                        {quote.options?.columnLineNumber !== false && <td className="px-4 py-4 text-slate-400 font-medium text-[12px]">{idx + 1}</td>}
                                        <td className="px-4 py-4 font-semibold text-slate-900">{item.item}</td>
                                        {quote.options?.columnDescription !== false && <td className="px-4 py-4 text-gray-500">{item.description}</td>}
                                        <td className="px-4 py-4 text-right font-medium">{item.qty}</td>
                                        <td className="px-4 py-4 text-right font-medium">{price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        {showDiscount && <td className="px-4 py-4 text-right font-medium text-indigo-600">{discount}{quote.options?.columnDiscountType === 'Percentage' ? '%' : ''}</td>}
                                        <td className="px-4 py-4 text-right font-bold text-slate-900">{lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

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

                        <div className="w-80 space-y-3">
                            <div className="flex justify-between items-center text-gray-500">
                                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{quote.options?.amountsAreTaxInclusive ? 'Subtotal (Excl. Tax)' : 'Subtotal'}</span>
                                <span className="font-semibold">{totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center text-gray-500 pb-2 border-b border-gray-50">
                                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Sales Tax (16%)</span>
                                <span className="font-semibold">{totals.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            {quote.options?.withholdingTax && (
                                <div className="flex justify-between items-center text-rose-500">
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-rose-400">Withholding Tax ({quote.options.withholdingTaxType === 'Rate' ? `${quote.options.withholdingTaxValue}%` : 'Amount'})</span>
                                    <span className="font-semibold">-{totals.withholdingTaxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center bg-slate-50 p-4 border-t-2 border-slate-900 mt-2 print-bg-slate-50">
                                <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-slate-900">Total</span>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{quote.currency?.split(' ')[0] || 'ZMW'}</p>
                                    <p className="text-2xl font-bold text-slate-900 tracking-tighter">{totals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {quote.options?.footers && quote.options?.footerValue && (
                        <div className="mt-12 pt-8 border-t border-gray-100">
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Terms & Conditions</p>
                            <p className="text-[12px] text-gray-600 leading-relaxed whitespace-pre-wrap">{quote.options.footerValue}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-[#f3f4f6] px-8 py-4 border-t border-gray-200 flex justify-end no-print">
                <div className="flex space-x-2">
                    <button onClick={() => navigate(`/purchase-quotes/print-batch?ids=${quote.id}`)} className="bg-white border border-gray-300 px-6 py-2 text-[11px] font-bold text-gray-700 rounded-md shadow-sm hover:bg-gray-50 transition uppercase tracking-widest flex items-center gap-2">
                        <Printer size={14} /> Print Document
                    </button>
                    <button onClick={() => navigate(`/purchase-quotes/edit/${quote.id}`)} className="bg-blue-600 text-white px-6 py-2 text-[11px] font-bold rounded-md shadow-md hover:bg-blue-700 transition uppercase tracking-widest flex items-center gap-2">
                        <Edit size={14} /> Edit Quote
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ViewPurchaseQuoteView;
