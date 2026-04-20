import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import {
    mockPurchaseQuotes,
    mockPurchaseOrders,
    mockPurchaseInvoices,
    mockInventory,
    getSuppliers,
    getCurrentUser,
    savePurchaseQuotes,
    getFooters
} from '../mockData';
import { PurchaseQuote } from '../types';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import FormInput from '../components/shared/FormInput';
import Badge from '../components/shared/Badge';
import {
    FileText,
    ChevronRight,
    CheckCircle2,
    Clock,
    Plus,
    Trash2,
    Copy,
    User,
    X,
    Search,
    AlertTriangle,
    Package,
    Calendar,
    Briefcase,
    ChevronDown,
    ChevronUp,
    Hash,
    Save,
    Settings,
    History,
    Calculator,
    Layers,
    Image as ImageIcon,
    TrendingUp
} from 'lucide-react';
import { cn } from '../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/shared/Tooltip";

const InputField = ({ label, value, onChange, placeholder, type = "text", Icon, error, readOnly }: any) => (
    <div className="space-y-2 text-left">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{label}</label>
        <div className="relative group">
            {Icon && <Icon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500" />}
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                readOnly={readOnly}
                className={`w-full bg-slate-50 border ${error ? 'border-rose-500 ring-4 ring-rose-500/10' : 'border-slate-200'} rounded-2xl ${Icon ? 'pl-11' : 'px-5'} py-3 text-[13px] font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 ${error ? 'focus:ring-rose-500/10 focus:border-rose-500' : 'focus:ring-indigo-500/10 focus:border-indigo-500'} transition-all ${readOnly ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''}`}
            />
        </div>
        {error && <p className="text-[10px] font-bold text-rose-500 ml-1 mt-1 uppercase tracking-wider">{error}</p>}
    </div>
);

const SelectField = ({ label, value, onChange, Icon, children }: any) => (
    <div className="space-y-2 text-left">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{label}</label>
        <div className="relative group">
            {Icon && <Icon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500" />}
            <select
                value={value}
                onChange={onChange}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-5 py-3 text-[13px] font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer"
            >
                {children}
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
    </div>
);

const NumericInputField = ({ label, value, onChange, Icon, min = 0 }: any) => (
    <div className="space-y-2 text-left">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{label}</label>
        <div className="relative group">
            {Icon && <Icon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500" />}
            <input
                type="number"
                min={min}
                value={value}
                onChange={onChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-12 py-3 text-[13px] font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col -space-y-px">
                <button
                    onClick={() => onChange({ target: { value: (parseInt(value || 0) + 1).toString() } })}
                    className="p-1 hover:text-indigo-600 text-slate-300 transition-colors"
                >
                    <ChevronUp size={12} />
                </button>
                <button
                    onClick={() => onChange({ target: { value: Math.max(min, parseInt(value || 0) - 1).toString() } })}
                    className="p-1 hover:text-indigo-600 text-slate-300 transition-colors"
                >
                    <ChevronDown size={12} />
                </button>
            </div>
        </div>
    </div>
);

const EditPurchaseQuoteView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isEditing = Boolean(id);

    const formatDateForSave = (dateStr: string) => {
        if (!dateStr) return new Date().toLocaleDateString('en-GB').replace(/\//g, '.');
        if (dateStr.includes('.')) return dateStr;
        const [year, month, day] = dateStr.split('-');
        return `${day}.${month}.${year}`;
    };

    const [issueDate, setIssueDate] = useState('');
    const [supplier, setSupplier] = useState('');
    const [currency, setCurrency] = useState('ZMW');
    const [address, setAddress] = useState('');
    const [description, setDescription] = useState('');
    const [reference, setReference] = useState('');
    const [useManualRef, setUseManualRef] = useState(false);
    const [fileName, setFileName] = useState('No file chosen');
    const [status, setStatus] = useState('Active');
    const [items, setItems] = useState([{ id: Date.now(), item: 'Select Item', description: '', qty: '1', unitPrice: '0', unit: '', discount: '', taxCode: 'VAT 16%' }]);
    const [options, setOptions] = useState({
        amountsAreTaxInclusive: false,
        rounding: false,
        roundingType: 'Round to nearest',
        columnLineNumber: true,
        columnDiscount: false,
        columnDiscountType: 'Percentage',
        withholdingTax: false,
        withholdingTaxType: 'Rate',
        withholdingTaxValue: '0',
        hideTotalAmount: false,
        customTitle: false,
        customTitleValue: 'Purchase Quote',
        footers: false,
        footerValue: 'Terms & Conditions apply.',
        cancelled: false
    });

    const [showOptionsArea, setShowOptionsArea] = useState(false);

    const getNextReference = () => {
        const pqReferences = mockPurchaseQuotes
            .map(q => q.reference)
            .filter(ref => ref && ref.startsWith('PQ-'))
            .map(ref => parseInt(ref.split('-')[1]) || 0);

        const nextNum = pqReferences.length > 0 ? Math.max(...pqReferences) + 1 : 1;
        return `PQ-${nextNum.toString().padStart(4, '0')}`;
    };

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const copyFromId = searchParams.get('copyFrom');
        if (id || copyFromId) {
            const quoteId = id || copyFromId;
            const quote = mockPurchaseQuotes.find(q => q.id === quoteId);
            if (quote) {
                setIssueDate(quote.issueDate.split('.').reverse().join('-'));
                setSupplier(quote.supplier);
                setCurrency(quote.currency);
                setAddress(quote.billingAddress || '');
                if (copyFromId) {
                    setReference(getNextReference());
                    setUseManualRef(false);
                } else {
                    setReference(quote.reference);
                    setUseManualRef(true);
                }
                setDescription(quote.description || '');
                setStatus(id ? quote.status : 'Active');
                setItems(quote.items?.map(i => ({
                    id: i.id,
                    item: i.item,
                    description: i.description,
                    qty: i.qty.toString(),
                    unitPrice: i.unitPrice.toString(),
                    unit: (i as any).unit || '',
                    discount: i.discount || '',
                    taxCode: i.taxCode || 'VAT 16%'
                })) || []);
                if (quote.options) {
                    setOptions(prev => ({ ...prev, ...quote.options }));
                }
            }
        } else {
            setIssueDate(new Date().toISOString().split('T')[0]);
            setReference(getNextReference());
            setItems([{ id: Date.now(), item: 'Select Item', description: '', qty: '1', unitPrice: '', unit: '', discount: '', taxCode: 'VAT 16%' }]);
        }
    }, [id, location.search]);

    const itemHistory = useMemo(() => {
        const global: Record<string, any[]> = {};
        const supplierPurchases: Record<string, any[]> = {};
        const supplierQuotes: Record<string, any[]> = {};

        mockPurchaseInvoices.forEach(doc => {
            if (!doc.items) return;
            doc.items.forEach(i => {
                const itemName = (i as any).item;
                if (!itemName || itemName === 'Select Item') return;
                const entry = { date: doc.issueDate, price: parseFloat((i as any).unitPrice) || 0, qty: parseFloat((i as any).qty) || 0, supplier: doc.supplier, ref: doc.reference, type: 'Invoice' };
                if (!global[itemName]) global[itemName] = [];
                global[itemName].push(entry);
                if (supplier && doc.supplier === supplier) {
                    if (!supplierPurchases[itemName]) supplierPurchases[itemName] = [];
                    supplierPurchases[itemName].push(entry);
                }
            });
        });

        mockPurchaseQuotes.forEach(doc => {
            if (!doc.items) return;
            doc.items.forEach(i => {
                const itemName = (i as any).item;
                if (!itemName || itemName === 'Select Item') return;
                const entry = { date: doc.issueDate, price: parseFloat((i as any).unitPrice) || 0, qty: parseFloat((i as any).qty) || 0, supplier: doc.supplier, ref: doc.reference, type: 'Quote' };
                if (supplier && doc.supplier === supplier) {
                    if (!supplierQuotes[itemName]) supplierQuotes[itemName] = [];
                    supplierQuotes[itemName].push(entry);
                }
            });
        });

        const sortAndSlice = (history: Record<string, any[]>) => {
            Object.keys(history).forEach(item => {
                history[item].sort((a, b) => {
                    const getDate = (d: string) => d.includes('.') ? d.split('.').reverse().join('-') : d;
                    return new Date(getDate(b.date)).getTime() - new Date(getDate(a.date)).getTime();
                });
                history[item] = history[item].slice(0, 3);
            });
        };

        sortAndSlice(global);
        sortAndSlice(supplierPurchases);
        sortAndSlice(supplierQuotes);
        return { global, supplierPurchases, supplierQuotes };
    }, [supplier]);

    const calculations = useMemo(() => {
        let subtotal = 0;
        let totalTax = 0;
        const lineCalcs = items.map(item => {
            const qty = parseFloat(item.qty) || 0;
            const price = parseFloat(item.unitPrice) || 0;
            const discountValue = parseFloat(item.discount) || 0;

            let netTotal = qty * price;
            if (options.columnDiscount) {
                if (options.columnDiscountType === 'Percentage') netTotal *= (1 - (discountValue / 100));
                else netTotal = Math.max(0, netTotal - discountValue);
            }

            let taxAmount = 0;
            if (item.taxCode === 'VAT 16%') {
                if (options.amountsAreTaxInclusive) {
                    taxAmount = netTotal - (netTotal / 1.16);
                    netTotal -= taxAmount;
                } else {
                    taxAmount = netTotal * 0.16;
                }
            }

            subtotal += netTotal;
            totalTax += taxAmount;
            return { taxAmount, netTotal, grossTotal: netTotal + taxAmount };
        });

        let grandTotal = subtotal + totalTax;
        if (options.rounding) {
            if (options.roundingType === 'Round to nearest') grandTotal = Math.round(grandTotal);
            else if (options.roundingType === 'Round down') grandTotal = Math.floor(grandTotal);
        }

        let whtAmount = 0;
        if (options.withholdingTax) {
            const whtVal = parseFloat(options.withholdingTaxValue) || 0;
            if (options.withholdingTaxType === 'Rate') whtAmount = subtotal * (whtVal / 100);
            else whtAmount = whtVal;
            grandTotal -= whtAmount;
        }

        return { lineCalcs, subtotal, totalTax, grandTotal, whtAmount };
    }, [items, options]);

    const handleSave = () => {
        if (!supplier) { alert('Please select a supplier.'); return; }
        const validItems = items.filter(i => i.item && i.item !== 'Select Item');
        if (validItems.length === 0) { alert('Please select at least one valid item.'); return; }

        const newQuote: PurchaseQuote = {
            id: isEditing ? id! : `PQ-${Date.now()}`,
            issueDate: formatDateForSave(issueDate),
            reference: reference || getNextReference(),
            supplier: supplier,
            description: description,
            currency: currency,
            amount: calculations.grandTotal,
            status: status as any,
            billingAddress: address,
            timestamp: new Date().toISOString(),
            items: items.filter(i => i.item !== 'Select Item').map(i => ({ ...i, id: Number(i.id) })),
            options: options
        };

        if (isEditing) {
            const index = mockPurchaseQuotes.findIndex(q => q.id === id);
            if (index !== -1) mockPurchaseQuotes[index] = newQuote;
        } else {
            mockPurchaseQuotes.unshift(newQuote);
        }
        savePurchaseQuotes(mockPurchaseQuotes);
        navigate('/purchase-quotes');
    };

    const requiresApproval = useMemo(() => {
        return items.some(item => {
            const invItem = (mockInventory as any)[item.item];
            return invItem && parseFloat(item.unitPrice) > invItem.purchasePrice * 1.25;
        });
    }, [items]);

    return (
        <div className="p-10 max-w-[1400px] mx-auto space-y-6 font-sans">
            <div className="flex justify-between items-center text-left">
                <div>
                    <div className="flex items-center space-x-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">
                        <span className="cursor-pointer hover:underline" onClick={() => navigate('/purchase-quotes')}>Purchase Quotes</span>
                        <ChevronRight size={10} className="opacity-50" />
                        <span className="text-slate-400">{isEditing ? 'Edit' : 'New'}</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 leading-tight">Purchase Quotation</h1>
                </div>
                <button onClick={() => navigate('/purchase-quotes')} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-400 hover:bg-slate-50 transition-colors shadow-sm"><X size={20} /></button>
            </div>

            <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 p-10 space-y-8 animate-in fade-in duration-700">
                <div className="space-y-8">
                    <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                            <FileText size={20} />
                        </div>
                        <h2 className="text-lg font-black text-slate-800 tracking-tight text-left">Basic Information</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                        <InputField label="Issue Date" type="date" value={issueDate} onChange={(e: any) => setIssueDate(e.target.value)} Icon={Calendar} />
                        <div className="space-y-2 text-left">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Reference</label>
                            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-500 transition-all">
                                <div className="px-4 border-r border-slate-200 cursor-pointer" onClick={() => setUseManualRef(!useManualRef)}>
                                    <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${!useManualRef ? 'bg-indigo-600' : 'border-slate-300 border-2'}`}>
                                        {!useManualRef && <CheckCircle2 size={12} className="text-white" />}
                                    </div>
                                </div>
                                <input type="text" value={reference} onChange={(e) => useManualRef && setReference(e.target.value)} readOnly={!useManualRef} placeholder={useManualRef ? "Enter custom ref..." : ""} className={cn("w-full bg-transparent border-none px-4 py-3 text-[13px] font-semibold outline-none transition-colors", !useManualRef ? "text-indigo-600 font-black" : "text-slate-700")} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-50">
                    <div className="space-y-6">
                        <SelectField label="Supplier" value={supplier} onChange={(e: any) => {
                            setSupplier(e.target.value);
                            const selected = getSuppliers().find(s => s.name === e.target.value);
                            if (selected) {
                                setCurrency(selected.currency || 'ZMW');
                                setAddress(selected.billingAddress || (selected as any).address || '');
                            }
                        }} Icon={User}>
                            <option value="">Select Supplier...</option>
                            {getSuppliers().map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </SelectField>
                        <InputField label="Description" value={description} onChange={(e: any) => setDescription(e.target.value)} placeholder="Summary of request..." Icon={Briefcase} />
                    </div>
                    <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Address</label>
                        <textarea
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            rows={4}
                            placeholder="Supplier address details..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-[24px] px-5 py-4 text-[13px] font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none"
                        ></textarea>
                    </div>
                </div>

                <div className="pt-8 border-t border-slate-50 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                                <Package size={20} />
                            </div>
                            <h2 className="text-lg font-black text-slate-800 tracking-tight text-left">Line Items</h2>
                        </div>
                        <button
                            onClick={() => setItems(prev => [...prev, { id: Date.now(), item: 'Select Item', description: '', qty: '1', unitPrice: '0', unit: '', discount: '', taxCode: 'VAT 16%' }])}
                            className="flex items-center space-x-2 px-6 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-100 transition-all"
                        >
                            <Plus size={14} /> <span>Add New Row</span>
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    {options.columnLineNumber && <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-12 text-center">#</th>}
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-40">ITEM</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">DESCRIPTION</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-24 text-right">QTY</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-32 text-right">UNIT PRICE</th>
                                    {options.columnDiscount && <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-28 text-right whitespace-nowrap">DISCOUNT</th>}
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-32">TAX CODE</th>
                                    {!options.amountsAreTaxInclusive && <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-32 text-right">TAX AMOUNT</th>}
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-32 text-right font-black">TOTAL</th>
                                    <th className="px-4 py-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-left">
                                {items.map((item, index) => {
                                    const calc = calculations.lineCalcs[index];
                                    return (
                                        <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                                            {options.columnLineNumber && <td className="px-4 py-4 text-xs font-bold text-slate-400 text-center">{index + 1}</td>}
                                            <td className="px-4 py-4">
                                                <div className="relative group/select">
                                                    <select
                                                        value={item.item}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            const invItem = (mockInventory as any)[val];
                                                            setItems(prev => {
                                                                const newItems = prev.map(i => i.id === item.id ? {
                                                                    ...i,
                                                                    item: val,
                                                                    unitPrice: invItem ? invItem.purchasePrice.toString() : i.unitPrice,
                                                                    description: invItem ? val : i.description,
                                                                    unit: invItem ? invItem.unit : (i as any).unit
                                                                } : i);
                                                                return newItems;
                                                            });
                                                        }}
                                                        className="w-full bg-transparent border-none p-0 text-sm font-bold text-[#2563eb] outline-none appearance-none cursor-pointer truncate"
                                                    >
                                                        <option value="Select Item">Select Item</option>
                                                        {Object.keys(mockInventory).map(name => (
                                                            <option key={name} value={name}>{name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <input
                                                    type="text"
                                                    value={item.description}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setItems(prev => prev.map(i => i.id === item.id ? { ...i, description: val } : i));
                                                    }}
                                                    className="w-full bg-transparent border-none p-0 text-sm text-slate-600 outline-none placeholder:text-slate-300"
                                                    placeholder="Add description..."
                                                />
                                            </td>
                                            <td className="px-4 py-4 relative group/qty text-right">
                                                <div className="flex flex-col items-end">
                                                    <input
                                                        type="text"
                                                        value={item.qty}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setItems(prev => prev.map(i => i.id === item.id ? { ...i, qty: val } : i));
                                                        }}
                                                        className="w-full bg-transparent border-none p-0 text-sm font-bold text-right outline-none text-slate-700"
                                                    />
                                                    <div className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter flex items-center justify-between w-full">
                                                        <span>Stock: {((mockInventory as any)[item.item]?.stock || 0).toLocaleString()}</span>
                                                        <span className="text-indigo-500 font-black">{(item as any).unit || ''}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 relative group/price text-right">
                                                <div className="flex flex-col items-end">
                                                    <input
                                                        type="text"
                                                        value={item.unitPrice}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setItems(prev => prev.map(i => i.id === item.id ? { ...i, unitPrice: val } : i));
                                                        }}
                                                        className="w-full bg-transparent border-none p-0 text-sm font-bold text-right outline-none text-slate-700"
                                                        placeholder="0.00"
                                                    />
                                                    <div className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">
                                                        Purch: {((mockInventory as any)[item.item]?.purchasePrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </div>
                                                </div>
                                            </td>
                                            {options.columnDiscount && (
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <input
                                                            type="text"
                                                            value={item.discount}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                setItems(prev => prev.map(i => i.id === item.id ? { ...i, discount: val } : i));
                                                            }}
                                                            className="w-16 bg-transparent border-none p-0 text-sm font-bold text-indigo-600 text-right outline-none placeholder:text-slate-300"
                                                            placeholder="0"
                                                        />
                                                        <span className="text-[10px] text-slate-400 font-bold">{options.columnDiscountType === 'Percentage' ? '%' : currency}</span>
                                                    </div>
                                                </td>
                                            )}
                                            <td className="px-4 py-4">
                                                <select
                                                    value={item.taxCode}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setItems(prev => prev.map(i => i.id === item.id ? { ...i, taxCode: val } : i));
                                                    }}
                                                    className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer"
                                                >
                                                    <option value="VAT 16%">VAT 16%</option>
                                                    <option value="No tax">No tax</option>
                                                </select>
                                            </td>
                                            {!options.amountsAreTaxInclusive && (
                                                <td className="px-4 py-4 text-sm font-bold text-slate-400 text-right">
                                                    {calc.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                            )}
                                            <td className="px-4 py-4 text-sm font-bold text-slate-800 text-right tabular-nums">
                                                <span className="text-[10px] font-black text-slate-400 mr-1.5 opacity-60">{currency}</span>
                                                {calc.grossTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                                                    <button
                                                        onClick={() => {
                                                            const newItem = { ...item, id: Date.now() + Math.random() };
                                                            const idx = items.findIndex(i => i.id === item.id);
                                                            const newItems = [...items];
                                                            newItems.splice(idx + 1, 0, newItem);
                                                            setItems(newItems);
                                                        }}
                                                        className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all"
                                                        title="Duplicate Row"
                                                    >
                                                        <Copy size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => setItems(prev => prev.length > 1 ? prev.filter(i => i.id !== item.id) : prev)}
                                                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                                                        title="Remove Row"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary Details */}
                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end pr-24">
                        <div className="w-full max-w-sm space-y-2">
                            <div className="flex justify-end items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] gap-8 text-right">
                                <span>Subtotal ({currency})</span>
                                <span className="text-slate-700 font-bold tabular-nums text-[13px] w-32 text-right">
                                    <span className="text-[10px] font-black text-slate-400 mr-1 opacity-50">{currency}</span>
                                    {calculations.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex justify-end items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] gap-8 text-right">
                                <span>Tax Component</span>
                                <span className="text-slate-700 font-bold tabular-nums text-[13px] w-32 text-right">{calculations.totalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            {options.withholdingTax && (
                                <div className="flex justify-end items-center text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] gap-8 text-right">
                                    <span>Withholding Tax</span>
                                    <span className="text-rose-600 font-bold tabular-nums text-[13px] w-32 text-right">-{calculations.whtAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            )}
                            {!options.hideTotalAmount && (
                                <div className="flex justify-end items-center bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50 mt-4 h-16 gap-x-6">
                                    <div className="flex-1 text-left">
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Total Payable</p>
                                    </div>
                                    <h2 className="text-xl font-medium text-slate-900 tracking-tight tabular-nums flex items-baseline">
                                        <span className="text-xs font-medium text-indigo-400 mr-2 uppercase">{currency}</span>
                                        {calculations.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </h2>
                                </div>
                            )}
                        </div>
                    </div>


                </div>

                {/* Options Area */}
                <div className="space-y-6 pt-6 border-t border-slate-50 text-left">
                    <div
                        onClick={() => setShowOptionsArea(!showOptionsArea)}
                        className="flex items-center justify-between group cursor-pointer hover:bg-slate-50/50 p-2 -m-2 rounded-2xl transition-all"
                    >
                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 group-hover:bg-amber-100 transition-colors">
                                <Settings size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-800 tracking-tight">Document Options</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{showOptionsArea ? 'Hide configuration' : 'Configure procurement settings'}</p>
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-amber-600 group-hover:bg-amber-100/50 transition-all">
                            <ChevronDown size={20} className={cn("transition-transform duration-300", showOptionsArea ? "rotate-180" : "")} />
                        </div>
                    </div>

                    {showOptionsArea && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in slide-in-from-top-4 duration-500">
                            {([
                                ['Tax Inclusive', 'amountsAreTaxInclusive'],
                                ['Rounding', 'rounding'],
                                ['Line Numbers', 'columnLineNumber'],
                                ['Discount', 'columnDiscount'],
                                ['Withholding Tax', 'withholdingTax'],
                                ['Hide Total', 'hideTotalAmount'],
                                ['Custom Title', 'customTitle'],
                                ['Footers', 'footers']
                            ] as const).map(([label, key]) => (
                                <div key={key} className="space-y-3">
                                    <label className="flex items-center space-x-3 cursor-pointer group bg-slate-50 p-4 rounded-2xl border border-transparent hover:border-indigo-100 transition-all">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={(options as any)[key]}
                                                onChange={(e) => setOptions(prev => ({ ...prev, [key]: e.target.checked }))}
                                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 transition-all cursor-pointer"
                                            />
                                        </div>
                                        <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight">{label}</span>
                                    </label>
                                    {key === 'columnDiscount' && options.columnDiscount && (
                                        <div className="flex items-center space-x-2 ml-4 animate-in slide-in-from-top-2 duration-300">
                                            <div className="relative flex-1">
                                                <select
                                                    value={options.columnDiscountType}
                                                    onChange={(e) => setOptions(prev => ({ ...prev, columnDiscountType: e.target.value }))}
                                                    className="w-full appearance-none bg-indigo-50/50 border border-indigo-100/50 rounded-xl px-3 py-1.5 text-[10px] font-black text-indigo-600 uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
                                                >
                                                    <option value="Percentage">Percentage (%)</option>
                                                    <option value="Amount">Exact Amount</option>
                                                </select>
                                                <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" />
                                            </div>
                                        </div>
                                    )}
                                    {key === 'customTitle' && options.customTitle && (
                                        <div className="flex items-center space-x-2 ml-4 animate-in slide-in-from-top-2 duration-300">
                                            <input
                                                type="text"
                                                value={options.customTitleValue}
                                                onChange={(e) => setOptions(prev => ({ ...prev, customTitleValue: e.target.value }))}
                                                placeholder="e.g. Price Enquiry"
                                                className="w-full bg-indigo-50/50 border border-indigo-100/50 rounded-xl px-4 py-2 text-[11px] font-bold text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 placeholder:text-indigo-300/50"
                                            />
                                        </div>
                                    )}
                                    {key === 'footers' && options.footers && (
                                        <div className="space-y-4 ml-4 animate-in slide-in-from-top-2 duration-300">
                                            <select
                                                onChange={(e) => {
                                                    const footer = getFooters().find(f => f.id === e.target.value);
                                                    if (footer) setOptions(prev => ({ ...prev, footerValue: footer.content }));
                                                }}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black text-indigo-600 uppercase focus:outline-none focus:ring-4 focus:ring-indigo-500/10 cursor-pointer appearance-none"
                                            >
                                                <option value="">-- Choose template --</option>
                                                {getFooters().map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Attachment Area */}
                    <div className="mt-6 pt-4 border-t border-slate-50 text-left">
                        <div className="space-y-3 max-w-md">
                            <div className="flex items-center space-x-2.5 mb-1 opacity-60">
                                <ImageIcon size={14} className="text-slate-400" />
                                <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Procurement Documentation</h3>
                            </div>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="group relative flex items-center bg-slate-50 border border-slate-200 border-dashed rounded-xl px-4 py-2 cursor-pointer hover:bg-white hover:border-indigo-300 transition-all duration-300"
                            >
                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400 mr-3 group-hover:text-indigo-500 transition-colors shadow-sm">
                                    <Plus size={16} className={cn("transition-transform duration-300", fileName !== 'No file chosen' ? "rotate-45" : "")} />
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <p className="text-[12px] font-bold text-slate-700 truncate leading-tight">
                                        {fileName === 'No file chosen' ? 'Attach Technical Specs' : fileName}
                                    </p>
                                    <p className="text-[9px] font-medium text-slate-400 uppercase tracking-wider leading-tight">
                                        {fileName === 'No file chosen' ? 'Specs, plans or references' : 'Linked to quote'}
                                    </p>
                                </div>
                                {fileName !== 'No file chosen' && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setFileName('No file chosen'); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                        className="w-7 h-7 flex items-center justify-center bg-rose-50 text-rose-500 rounded-md hover:bg-rose-100 transition-all"
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                                <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) setFileName(file.name); }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submission Area */}
                <div className="bg-slate-50 p-10 mt-12 mb-10 mx-[-48px] border-t border-slate-100 rounded-b-3xl">
                    <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="flex-1 w-full text-left">
                            {requiresApproval && (
                                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start space-x-3">
                                    <AlertTriangle size={16} className="text-amber-500 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest leading-none">Internal Review Required</p>
                                        <p className="text-[11px] font-medium text-amber-700 leading-relaxed">Inventory threshold exceeded or budget constraints active. Managerial approval required before proceeding.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center space-x-4 w-full md:w-auto">
                            <button
                                onClick={() => navigate('/purchase-quotes')}
                                className="px-8 py-4 rounded-2xl text-[12px] font-black text-slate-500 hover:bg-slate-200 transition-all uppercase tracking-[0.2em]"
                            >
                                Discard
                            </button>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => handleSave()}
                                    disabled={requiresApproval}
                                    className={cn(
                                        "px-10 py-4 rounded-2xl text-[12px] font-black transition-all shadow-xl uppercase tracking-[0.2em] flex items-center gap-2",
                                        requiresApproval
                                            ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                                            : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20"
                                    )}
                                >
                                    <Save size={18} /> {isEditing ? 'Update Quote' : 'Create Purchase Quote'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditPurchaseQuoteView;
