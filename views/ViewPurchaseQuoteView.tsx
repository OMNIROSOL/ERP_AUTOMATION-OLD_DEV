import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PurchaseQuote, Supplier } from '../types';
import apiService from '../services/apiService';
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
    Package,
    Loader2
} from 'lucide-react';
import { cn } from '../utils/cn';

const ViewPurchaseQuoteView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isCopyToOpen, setIsCopyToOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const pdfRef = useRef<HTMLDivElement>(null);
    const [quote, setQuote] = useState<PurchaseQuote | null>(null);
    const [allQuotes, setAllQuotes] = useState<PurchaseQuote[]>([]);
    const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]);
    const [taxCodes, setTaxCodes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                const [pq, pqs, supps, codes] = await Promise.all([
                    apiService.getPurchaseQuote(id),
                    apiService.getPurchaseQuotes(),
                    apiService.getSuppliers(),
                    apiService.getTaxCodes().catch(() => [])
                ]);
                setQuote(pq);
                setAllQuotes(pqs);
                setAllSuppliers(supps);
                setTaxCodes(codes);
            } catch (err) {
                console.error('Failed to fetch purchase quote data:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const quoteIndex = useMemo(() => {
        return allQuotes.findIndex(pq => pq.id === id);
    }, [allQuotes, id]);

    const supplierData = useMemo(() => {
        if (!quote) return null;
        return allSuppliers.find(s => s.name === quote.supplier);
    }, [quote, allSuppliers]);

    const supplierEmail = supplierData?.email || (quote ? `${quote.supplier.toLowerCase().replace(/\s+/g, '.')}@example.com` : '');

    const totals = useMemo(() => {
        if (!quote) return { subtotal: 0, tax: 0, total: 0 };
        const quoteAmount = parseFloat(quote.quoteAmount as any) || 0;
        const isTaxInclusive = quote.options?.amountsAreTaxInclusive || false;

        if (!quote.items || quote.items.length === 0) {
            const defaultTax = taxCodes.find(tc => tc.name === 'VAT 16%') || { rate: 16 };
            const taxRate = (parseFloat(defaultTax.rate) || 16) / 100;
            const tax = isTaxInclusive ? quoteAmount * taxRate / (1 + taxRate) : quoteAmount * taxRate;
            return { subtotal: isTaxInclusive ? quoteAmount - tax : quoteAmount, tax, total: quoteAmount };
        }

        let subtotal = 0;
        let tax = 0;
        quote.items.forEach(item => {
            const qty = parseFloat(item.qty as any) || 0;
            const price = parseFloat(item.unitPrice as any) || 0;
            const lineTotal = qty * price;
            
            let taxRate = 0;
            const itemTaxCode = (item.taxCode || '').toString().toLowerCase().trim();
            const selectedTax = taxCodes.find(tc => 
                tc.id === item.taxCode || 
                tc.name.toLowerCase() === itemTaxCode ||
                (itemTaxCode === 'zero rated' && tc.name === 'Zero Rated') ||
                (itemTaxCode === 'exempt' && tc.name === 'Exempt')
            );
            
            if (selectedTax) {
                taxRate = parseFloat(selectedTax.rate) / 100;
            } else {
                // Fallback for historical data - check if it looks like it should be 16%
                if (itemTaxCode.includes('16') || itemTaxCode.includes('vat') || !itemTaxCode) {
                    const defaultTax = taxCodes.find(tc => tc.name === 'VAT 16%') || { rate: 16 };
                    taxRate = (parseFloat(defaultTax.rate) || 16) / 100;
                } else {
                    taxRate = 0; // Default to 0 for unknown non-empty tax codes
                }
            }

            if (isTaxInclusive) {
                const lineTax = lineTotal - (lineTotal / (1 + taxRate));
                tax += lineTax;
                subtotal += (lineTotal - lineTax);
            } else {
                subtotal += lineTotal;
                tax += lineTotal * taxRate;
            }
        });
        return { subtotal, tax, total: quoteAmount || (subtotal + tax) };
    }, [quote, taxCodes]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-8">
                <div className="flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading Purchase Quote...</p>
                </div>
            </div>
        );
    }

    if (!quote) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-8">
                <div className="bg-white p-12 rounded-[32px] shadow-xl border border-slate-100 text-center max-w-md">
                    <XCircle className="w-16 h-16 text-rose-500 mx-auto mb-6 opacity-20" />
                    <h2 className="text-2xl font-black text-slate-900 mb-2">Quote Not Found</h2>
                    <p className="text-slate-500 font-medium mb-8 text-sm">The purchase quote you are looking for does not exist or has been removed.</p>
                    <button
                        onClick={() => navigate('/purchase-quotes')}
                        className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black uppercase text-[12px] tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                    >
                        Return to List
                    </button>
                </div>
            </div>
        );
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsCopyToOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="min-h-screen bg-[#f3f4f6]/50 flex flex-col font-sans">
            {/* Compact Action Toolbar */}
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
                                    { label: 'Purchase Quote', path: '/purchase-quotes/new' },
                                    { label: 'Purchase Order', path: '/purchase-orders/new' },
                                    { label: 'Purchase Invoice', path: '/purchase-invoices/new' },
                                    { label: 'Goods Receipt', path: '/goods-receipts/new' },
                                    { label: 'Debit Note', path: '/debit-notes/new' }
                                ].map(item => (
                                    <button
                                        key={item.label}
                                        onClick={() => { setIsCopyToOpen(false); navigate(`${item.path}?copyFrom=${quote.id}`); }}
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
                                pdf.save(`${quote.reference || 'PurchaseQuote'}.pdf`);
                            }}
                            className="bg-white border border-gray-300 px-4 py-1.5 text-[12px] font-bold text-gray-700 rounded shadow-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                            <Download size={14} /> PDF
                        </button>
                        <button
                            onClick={() => {
                                const subject = encodeURIComponent(`Purchase Quotation: ${quote.reference}`);
                                const body = encodeURIComponent(`Dear ${quote.supplier},\n\nPlease find attached our purchase quotation ${quote.reference}.\n\nThank you.`);
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
                            onClick={() => navigate(`/purchase-quotes/view/${allQuotes[0].id}`)}
                            disabled={quoteIndex <= 0}
                            className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 border-r border-gray-300 disabled:opacity-30 flex items-center"
                        >
                            <ChevronLeft size={14} /> <ChevronLeft size={14} className="-ml-2" />
                        </button>
                        <button
                            onClick={() => navigate(`/purchase-quotes/view/${allQuotes[Math.max(0, quoteIndex - 1)].id}`)}
                            disabled={quoteIndex <= 0}
                            className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-30 flex items-center"
                        >
                            <ChevronLeft size={14} />
                        </button>
                    </div>
                    <span className="text-[11px] font-bold text-gray-400 mx-2 uppercase tracking-widest">{quoteIndex + 1} / {allQuotes.length}</span>
                    <div className="flex bg-white border border-gray-300 rounded shadow-sm">
                        <button
                            onClick={() => navigate(`/purchase-quotes/view/${allQuotes[Math.min(allQuotes.length - 1, quoteIndex + 1)].id}`)}
                            disabled={quoteIndex === allQuotes.length - 1}
                            className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 border-r border-gray-300 disabled:opacity-30 flex items-center"
                        >
                            <ChevronRight size={14} />
                        </button>
                        <button
                            onClick={() => navigate(`/purchase-quotes/view/${allQuotes[allQuotes.length - 1].id}`)}
                            disabled={quoteIndex === allQuotes.length - 1}
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
                                    <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase leading-none">{quote.customTitle || 'Purchase Quotation'}</h1>
                                </div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Reference: {quote.reference}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-12 items-start">
                                {/* Vendor */}
                                <div>
                                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-50 pb-2">Vendor / Supplier</h3>
                                    <p className="text-sm font-bold text-slate-900 uppercase tracking-tight mb-2">{quote.supplier}</p>
                                    <div className="text-gray-500 space-y-1">
                                        <p className="whitespace-pre-wrap">{supplierData?.billingAddress || quote.billingAddress || '-'}</p>
                                        {supplierEmail && <p className="text-blue-600 lowercase">{supplierEmail}</p>}
                                    </div>
                                </div>

                                {/* Quote Details */}
                                <div className="border-l border-gray-100 pl-12">
                                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-50 pb-2">Quote Details</h3>
                                    <div className="space-y-3">
                                        <div className="flex">
                                            <span className="w-32 text-gray-500">Issue Date:</span>
                                            <span className="font-semibold">{quote.issueDate}</span>
                                        </div>
                                        <div className="flex">
                                            <span className="w-32 text-gray-500">Currency:</span>
                                            <span className="font-semibold">{quote.currency || 'ZMW'}</span>
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
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-left w-12">#</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-left">Item</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-left">Description</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Qty</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Unit Price</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {quote.items && quote.items.length > 0 ? quote.items.map((item: any, idx: number) => (
                                    <tr key={idx}>
                                        <td className="px-4 py-4 text-slate-400 font-medium text-[12px]">{idx + 1}</td>
                                        <td className="px-4 py-4">
                                            <p className="font-semibold text-slate-900">{item.itemName || '-'}</p>
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
                                        <td className="px-4 py-5 text-slate-400 font-medium text-[12px]">1</td>
                                        <td className="px-4 py-5 font-semibold text-slate-900">General Item</td>
                                        <td className="px-4 py-5 font-medium text-slate-500">{quote.description || '-'}</td>
                                        <td className="px-4 py-5 text-right font-medium">1</td>
                                        <td className="px-4 py-5 text-right font-medium">{(parseFloat(quote.quoteAmount as any) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="px-4 py-5 text-right font-semibold">{(parseFloat(quote.quoteAmount as any) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Bottom Area: Totals */}
                    <div className="flex justify-end items-start gap-12">
                        {/* Summary Section */}
                        <div className="w-80 space-y-3">
                            <div className="flex justify-between items-center text-gray-500">
                                <span className="text-[11px] font-bold uppercase tracking-widest">{quote.options?.amountsAreTaxInclusive ? 'Subtotal (Excl. Tax)' : 'Subtotal'}</span>
                                <span className="font-semibold">{totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center text-gray-500 pb-2 border-b border-gray-50">
                                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Tax Component</span>
                                <span className="font-semibold">{totals.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-50 p-4 border-t-2 border-slate-900 mt-2 print-bg-slate-50">
                                <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-slate-900">Total</span>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{quote.currency?.split(' ')[0] || 'ZMW'}</p>
                                    <p className="text-2xl font-bold text-slate-900 tracking-tighter">{quote.quoteAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footers Section */}
                    {quote.footer && (
                        <div className="mt-12 pt-8 border-t border-gray-100">
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Notes & Terms</p>
                            <p className="text-[12px] text-gray-600 leading-relaxed whitespace-pre-wrap">{quote.footer}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-[#f3f4f6] px-8 py-4 border-t border-gray-200 flex justify-end no-print">
                <div className="flex space-x-2">
                    <button onClick={() => window.print()} className="bg-white border border-gray-300 px-6 py-2 text-[11px] font-bold text-gray-700 rounded-md shadow-sm hover:bg-gray-50 transition uppercase tracking-widest flex items-center gap-2">
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
