import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import apiService from '../services/apiService';
import { PurchaseInvoice, FooterTemplate } from '../types';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import FormInput from '../components/shared/FormInput';
import Badge from '../components/shared/Badge';
import {
    FileText,
    ChevronRight,
    CheckCircle2,
    Plus,
    Trash2,
    Copy,
    User,
    X,
    Search,
    AlertTriangle,
    Package,
    Calendar,
    Save,
    ChevronDown,
    ChevronUp,
    Hash,
    Briefcase,
    Settings
} from 'lucide-react';
import { cn } from '../utils/cn';

const InputField = ({ label, value, onChange, placeholder, type = "text", Icon, error, readOnly }: any) => (
    <div className="space-y-2">
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
        {error && <p className="text-[10px] font-bold text-rose-500 ml-1 mt-1 uppercase tracking-wider animate-in fade-in slide-in-from-top-1 duration-300">{error}</p>}
    </div>
);

const SelectField = ({ label, value, onChange, Icon, children }: any) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-600 uppercase tracking-tight ml-1">{label}</label>
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

const TextareaField = ({ label, value, onChange, placeholder, rows = 3 }: any) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{label}</label>
        <textarea
            value={value}
            onChange={onChange}
            rows={rows}
            placeholder={placeholder}
            className="w-full bg-slate-50 border border-slate-200 rounded-[24px] px-5 py-4 text-[13px] font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none"
        ></textarea>
    </div>
);

const NewPurchaseInvoiceView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const isEditing = Boolean(id);

    const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState('');
    const [supplier, setSupplier] = useState('');
    const [currency, setCurrency] = useState('ZMW');
    const [billingAddress, setBillingAddress] = useState('');
    const [description, setDescription] = useState('');
    const [reference, setReference] = useState('');
    const [useManualRef, setUseManualRef] = useState(false);
    const [items, setItems] = useState([{ id: Date.now(), item: 'Select Item', account: 'Inventory', description: '', qty: '1', unitPrice: '0', discount: '', taxCode: 'VAT 16%' }]);
    const [showOptionsArea, setShowOptionsArea] = useState(false);
    const [freightItems, setFreightItems] = useState([{ id: Date.now(), description: 'Freight / Shipping', amount: '0', taxCode: 'No tax' }]);
    const [options, setOptions] = useState({
        amountsAreTaxInclusive: false,
        columnLineNumber: true,
        columnDescription: true,
        columnDiscount: false,
        columnDiscountType: 'Percentage',
        freightIn: false,
        actAsGoodReceipt: false,
        inventoryLocation: 'Main Warehouse',
        customTitle: false,
        customTitleValue: 'Purchase Invoice',
        footers: false,
        footerValue: 'Terms & Conditions apply.'
    });

    const [dbSuppliers, setDbSuppliers] = useState<any[]>([]);
    const [dbItems, setDbItems] = useState<any[]>([]);
    const [dbFooters, setDbFooters] = useState<FooterTemplate[]>([]);
    const [taxCodes, setTaxCodes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (issueDate) {
            const date = new Date(issueDate);
            date.setDate(date.getDate() + 30);
            setDueDate(date.toISOString().split('T')[0]);
        }
    }, [issueDate]);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [sups, itemsData, footersData, codesData] = await Promise.all([
                    apiService.getSuppliers(),
                    apiService.getItems(),
                    apiService.getFooters(),
                    apiService.getTaxCodes()
                ]);
                setDbSuppliers(sups);
                setDbItems(itemsData);
                setDbFooters(footersData);
                setTaxCodes(codesData);

                const searchParams = new URLSearchParams(location.search);
                const copyFromId = searchParams.get('copyFrom');

                if (id || copyFromId) {
                    const targetId = id || copyFromId;
                    try {
                        let sourceDoc: any = null;
                        // Try lookup across modules
                        try {
                            sourceDoc = await apiService.getPurchaseInvoice(targetId);
                        } catch (e) {
                            try {
                                sourceDoc = await apiService.getInvoice(targetId);
                            } catch (e2) {
                                try {
                                    sourceDoc = await apiService.getOrder(targetId);
                                } catch (e3) {
                                    sourceDoc = await apiService.getQuote(targetId);
                                }
                            }
                        }

                        if (sourceDoc) {
                            const docDate = copyFromId ? '' : (sourceDoc.issueDate || sourceDoc.orderDate || '');
                            let parsedIssueDate = new Date().toISOString().split('T')[0];
                            if (docDate) {
                                const dottedPattern = /^\d{1,2}\.\d{1,2}\.\d{4}$/;
                                if (dottedPattern.test(docDate)) {
                                    const [day, month, year] = docDate.split('.');
                                    parsedIssueDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                                } else {
                                    const d = new Date(docDate);
                                    if (!isNaN(d.getTime())) parsedIssueDate = d.toISOString().split('T')[0];
                                }
                            }
                            setIssueDate(parsedIssueDate);

                            let parsedDueDate = '';
                            if (sourceDoc.dueDate) {
                                const dottedPattern = /^\d{1,2}\.\d{1,2}\.\d{4}$/;
                                if (dottedPattern.test(sourceDoc.dueDate)) {
                                    const [day, month, year] = sourceDoc.dueDate.split('.');
                                    parsedDueDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                                } else {
                                    const d = new Date(sourceDoc.dueDate);
                                    if (!isNaN(d.getTime())) parsedDueDate = d.toISOString().split('T')[0];
                                }
                            }
                            setDueDate(parsedDueDate);
                            
                            const sup = sups.find((s: any) => s.id === sourceDoc.supplierId || s.name === (sourceDoc.supplier?.name || sourceDoc.supplier));
                            if (sup) {
                                setSupplier(sup.name);
                                setCurrency(sup.currency?.split(' - ')[0] || 'ZMW');
                                setBillingAddress(sup.billingAddress || '');
                            } else {
                                setSupplier(sourceDoc.supplier?.name || sourceDoc.supplier || '');
                                setCurrency(sourceDoc.currency || 'ZMW');
                                setBillingAddress(sourceDoc.billingAddress || '');
                            }

                            if (copyFromId) {
                                const nextRef = await apiService.getNextReference('purchase-invoice');
                                setReference(nextRef);
                                setUseManualRef(false);
                            } else {
                                setReference(sourceDoc.reference);
                                setUseManualRef(true);
                            }

                            setDescription(sourceDoc.description || '');
                            
                            if (sourceDoc.items) {
                                setItems(sourceDoc.items.map((i: any) => ({
                                    id: Date.now() + Math.random(),
                                    item: i.item?.itemName || i.itemName || i.item || 'Select Item',
                                    account: i.account || 'Inventory',
                                    description: i.description || '',
                                    qty: (i.qty || '1').toString(),
                                    unitPrice: (i.unitPrice || '0').toString(),
                                    discount: (i.discount || '').toString(),
                                    taxCode: i.taxCode || 'No tax'
                                })));
                            }
                        }
                    } catch (err) {
                        console.error('Failed to load source document:', err);
                    }
                } else {
                    const nextRef = await apiService.getNextReference('purchase-invoice');
                    setReference(nextRef);
                }
            } catch (err) {
                console.error('Failed to load invoice data:', err);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [id, location.search]);

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
            const selectedTax = taxCodes.find(tc => tc.name === item.taxCode);
            const taxRate = selectedTax ? (parseFloat(selectedTax.rate) / 100) : 0;

            if (taxRate > 0) {
                if (options.amountsAreTaxInclusive) {
                    taxAmount = netTotal - (netTotal / (1 + taxRate));
                    netTotal = netTotal - taxAmount;
                } else taxAmount = netTotal * taxRate;
            }
            subtotal += netTotal;
            totalTax += taxAmount;
            return { taxAmount, grossTotal: netTotal + taxAmount, netTotal };
        });
        const freightTotal = freightItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        const freightTax = freightItems.reduce((sum, item) => {
            const amt = parseFloat(item.amount) || 0;
            const selectedTax = taxCodes.find(tc => tc.name === item.taxCode);
            const taxRate = selectedTax ? (parseFloat(selectedTax.rate) / 100) : 0;
            return sum + (amt * taxRate);
        }, 0);

        let grandTotal = subtotal + totalTax + freightTotal + freightTax;
        return { lineCalcs, subtotal, totalTax: totalTax + freightTax, grandTotal, freightTotal };
    }, [items, options, freightItems, taxCodes]);

    const handleSave = async () => {
        if (!supplier) {
            alert('Please select a supplier.');
            return;
        }

        const validItems = items.filter(i => i.item !== 'Select Item' && i.item !== '');
        if (validItems.length === 0) {
            alert('Please add at least one valid item.');
            return;
        }

        const selectedSup = dbSuppliers.find(s => s.name === supplier);
        if (!selectedSup) {
            alert('Selected supplier not found in database.');
            return;
        }

        const invoiceData = {
            reference: reference,
            supplierId: selectedSup.id,
            issueDate: issueDate,
            dueDate: dueDate,
            grandTotal: calculations.grandTotal,
            balanceDue: calculations.grandTotal,
            description: description,
            currency: currency,
            items: validItems.map(i => {
                const dbItem = dbItems.find(it => it.itemName === i.item);
                return {
                    itemId: dbItem?.id,
                    description: i.description,
                    qty: parseFloat(i.qty),
                    unitPrice: parseFloat(i.unitPrice),
                    totalAmount: parseFloat(i.qty) * parseFloat(i.unitPrice)
                };
            })
        };

        try {
            if (isEditing) {
                // await apiService.updatePurchaseInvoice(id!, invoiceData);
                alert('Update not yet implemented in backend.');
            } else {
                await apiService.createPurchaseInvoice(invoiceData);
            }
            navigate('/purchase-invoices');
        } catch (err) {
            console.error('Failed to save purchase invoice:', err);
            alert('Failed to save purchase invoice to database.');
        }
    };

    return (
        <div className="p-10 max-w-[1400px] mx-auto space-y-6 selection:bg-indigo-100 selection:text-indigo-900 font-sans">
            <div className="flex justify-between items-center">
                <div>
                    <div className="flex items-center space-x-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">
                        <span className="cursor-pointer hover:underline" onClick={() => navigate('/purchase-invoices')}>Purchase Invoices</span>
                        <ChevronRight size={10} className="opacity-50" />
                        <span className="text-slate-400">{isEditing ? 'Edit Existing' : 'Configure New'}</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 leading-tight">{isEditing ? 'Modify Purchase Invoice' : 'New Purchase Invoice'}</h1>
                </div>
                <div className="flex items-center space-x-4">
                    <button onClick={() => navigate('/purchase-invoices')} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors shadow-sm text-slate-400">
                        <X size={20} />
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="p-10 space-y-8">
                    <div className="space-y-8 animate-in fade-in duration-700">
                        <div className="space-y-8">
                            <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                                    <FileText size={20} />
                                </div>
                                <h2 className="text-lg font-black text-slate-800 tracking-tight">Invoice Details</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                <InputField label="Issue Date" type="date" value={issueDate} onChange={(e: any) => setIssueDate(e.target.value)} Icon={Calendar} />
                                <InputField label="Due Date" type="date" value={dueDate} onChange={(e: any) => setDueDate(e.target.value)} Icon={Calendar} />
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Reference</label>
                                    <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-500 transition-all">
                                        <div className="h-full px-4 border-r border-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => { setUseManualRef(!useManualRef); if (!useManualRef) setReference(''); }}>
                                            <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${!useManualRef ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 border-2'}`}>
                                                {!useManualRef && <CheckCircle2 size={12} className="text-white" strokeWidth={3} />}
                                            </div>
                                        </div>
                                        <input
                                            type="text"
                                            value={reference}
                                            onChange={(e) => useManualRef && setReference(e.target.value)}
                                            readOnly={!useManualRef}
                                            placeholder={useManualRef ? "Enter custom ref..." : ""}
                                            className={cn(
                                                "w-full bg-transparent border-none px-4 py-3 text-[13px] font-semibold outline-none transition-colors",
                                                !useManualRef ? "text-indigo-600 font-black" : "text-slate-700"
                                            )}
                                        />
                                    </div>
                                </div>
                                <InputField label="Description" value={description} onChange={(e: any) => setDescription(e.target.value)} placeholder="General description..." Icon={Briefcase} />
                            </div>
                        </div>

                        <div className="space-y-6 pt-0 border-t border-slate-50">
                            <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
                                    <User size={20} />
                                </div>
                                <h2 className="text-lg font-black text-slate-800 tracking-tight">Supplier Selection</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <SelectField label="Selected Supplier" value={supplier} onChange={(e: any) => {
                                        const supName = e.target.value;
                                        setSupplier(supName);
                                        const selected = dbSuppliers.find(s => s.name === supName);
                                        if (selected) {
                                            setCurrency(selected.currency?.split(' - ')[0] || 'ZMW');
                                            setBillingAddress(selected.billingAddress || '');
                                        }
                                    }} Icon={User}>
                                        <option value="">Select Target Supplier...</option>
                                        {dbSuppliers.filter(s => (!s.inactive && s.status !== 'Inactive') || s.name === supplier).map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                    </SelectField>
                                </div>
                                <TextareaField label="Supplier Address" value={billingAddress} onChange={(e: any) => setBillingAddress(e.target.value)} placeholder="Physical address of supplier..." rows={3} />
                            </div>
                        </div>

                        <div className="space-y-6 pt-0 border-t border-slate-50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                                        <Package size={20} />
                                    </div>
                                    <h2 className="text-lg font-black text-slate-800 tracking-tight">Invoice Line Items</h2>
                                </div>
                                <button onClick={() => setItems(prev => [...prev, { id: Date.now(), item: 'Select Item', account: 'Inventory', description: '', qty: '1', unitPrice: '0', discount: '', taxCode: 'No tax' }])} className="flex items-center space-x-2 px-6 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-100 transition-all">
                                    <Plus size={14} /> <span>Add Row</span>
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200">
                                            {options.columnLineNumber && <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-12 text-center">#</th>}
                                            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider min-w-[180px]">ITEM</th>
                                            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider min-w-[180px]">ACCOUNT</th>
                                            {options.columnDescription && <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">DESCRIPTION</th>}
                                            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-24 text-right">QTY</th>
                                            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-32 text-right">UNIT PRICE</th>
                                            {options.columnDiscount && <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-28 text-right whitespace-nowrap">DISCOUNT</th>}
                                            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-32">TAX CODE</th>
                                            {!options.amountsAreTaxInclusive && <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-32 text-right">TAX AMOUNT</th>}
                                            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-32 text-right">TOTAL</th>
                                            <th className="px-4 py-3 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {items.map((item, index) => {
                                            const calc = calculations.lineCalcs[index];
                                            return (
                                                <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                                                    {options.columnLineNumber && <td className="px-4 py-4 text-xs font-bold text-slate-400 text-center">{index + 1}</td>}
                                                    <td className="px-4 py-4 min-w-[180px]">
                                                        <select
                                                            value={item.item}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                const invItem = dbItems.find(it => it.itemName === val);
                                                                setItems(prev => prev.map(i => i.id === item.id ? {
                                                                    ...i,
                                                                    item: val,
                                                                    unitPrice: invItem ? invItem.purchasePrice.toString() : i.unitPrice,
                                                                    description: invItem ? val : i.description
                                                                } : i));
                                                            }}
                                                            className="w-full bg-transparent border-none p-0 text-sm font-bold text-[#2563eb] outline-none appearance-none cursor-pointer"
                                                        >
                                                            <option value="Select Item">Select Item</option>
                                                            {dbItems.map(it => (
                                                                <option key={it.id} value={it.itemName}>{it.itemName}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-4 min-w-[180px]">
                                                        <select
                                                            value={(item as any).account}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                setItems(prev => prev.map(i => i.id === item.id ? { ...i, account: val } : i));
                                                            }}
                                                            className="w-full bg-transparent border-none p-0 text-[11px] font-black text-slate-500 uppercase tracking-widest outline-none appearance-none cursor-pointer hover:text-indigo-600 transition-colors"
                                                        >
                                                            <option value="Inventory">Inventory</option>
                                                            <option value="Cost of Goods Sold">Cost of Goods Sold</option>
                                                            <option value="Packaging Materials">Packaging Materials</option>
                                                            <option value="Stationery">Stationery</option>
                                                            <option value="Office Equipment">Office Equipment</option>
                                                            <option value="Repair & Maintenance">Repair & Maintenance</option>
                                                            <option value="Telecommunications">Telecommunications</option>
                                                            <option value="Fuel & Oil">Fuel & Oil</option>
                                                        </select>
                                                    </td>
                                                    {options.columnDescription && (
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
                                                    )}
                                                    <td className="px-4 py-4">
                                                        <input
                                                            type="text"
                                                            value={item.qty}
                                                            onMouseDown={(e) => e.stopPropagation()}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                setItems(prev => prev.map(i => i.id === item.id ? { ...i, qty: val } : i));
                                                            }}
                                                            className="w-full bg-transparent border-none p-0 text-sm font-bold text-right outline-none text-slate-700"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <input
                                                            type="text"
                                                            value={item.unitPrice}
                                                            onMouseDown={(e) => e.stopPropagation()}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                setItems(prev => prev.map(i => i.id === item.id ? { ...i, unitPrice: val } : i));
                                                            }}
                                                            className="w-full bg-transparent border-none p-0 text-sm font-bold text-right outline-none text-slate-700"
                                                            placeholder="0.00"
                                                        />
                                                    </td>
                                                    {options.columnDiscount && (
                                                        <td className="px-4 py-4">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <input
                                                                    type="text"
                                                                    value={item.discount}
                                                                    onMouseDown={(e) => e.stopPropagation()}
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
                                                            <option value="" disabled>Select Tax...</option>
                                                            <option value="No tax">No tax</option>
                                                            {taxCodes.map(tc => (
                                                                <option key={tc.id} value={tc.name}>{tc.name}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    {!options.amountsAreTaxInclusive && (
                                                        <td className="px-4 py-4 text-sm font-bold text-slate-400 text-right tabular-nums">
                                                            {calc?.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                    )}
                                                    <td className="px-4 py-4 text-sm font-bold text-slate-800 text-right tabular-nums">
                                                        {calc?.grossTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                            <button
                                                                onClick={() => {
                                                                    const newItem = { ...item, id: Date.now() + Math.random() };
                                                                    setItems(prev => {
                                                                        const newArr = [...prev];
                                                                        newArr.splice(index + 1, 0, newItem);
                                                                        return newArr;
                                                                    });
                                                                }}
                                                                className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-100 rounded-md transition-all"
                                                                title="Duplicate Row"
                                                            >
                                                                <Copy size={13} />
                                                            </button>
                                                            <button
                                                                onClick={() => setItems(prev => prev.length > 1 ? prev.filter(i => i.id !== item.id) : prev)}
                                                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-all"
                                                                title="Delete Row"
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end pr-24">
                                    <div className="w-full max-w-xs space-y-2">
                                        <div className="flex justify-end items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] gap-8">
                                            <span>Subtotal ({currency})</span>
                                            <span className="text-slate-700 font-bold tabular-nums text-[13px] w-32 text-right">
                                                {calculations.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <div className="flex justify-end items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] gap-8">
                                            <span>Tax Component</span>
                                            <span className="text-slate-700 font-bold tabular-nums text-[13px] w-32 text-right">{calculations.totalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        {options.freightIn && (
                                            <div className="flex justify-end items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] gap-8">
                                                <span>Total Freight</span>
                                                <span className="text-slate-700 font-bold tabular-nums text-[13px] w-32 text-right">
                                                    {calculations.freightTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-end items-center bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50 mt-2 h-14 gap-x-6">
                                            <div className="flex-1 text-left">
                                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Total Payable</p>
                                            </div>
                                            <h2 className="text-xl font-bold text-slate-900 tracking-tight tabular-nums flex items-baseline">
                                                <span className="text-xs font-medium text-indigo-400 mr-2 uppercase">{currency}</span>
                                                {calculations.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </h2>
                                        </div>
                                    </div>
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
                                <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
                                    {/* Primary Options Row */}
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {([
                                            ['Tax Inclusive', 'amountsAreTaxInclusive'],
                                            ['Description', 'columnDescription'],
                                            ['Freight-in', 'freightIn'],
                                            ['Act as Good Receipt', 'actAsGoodReceipt'],
                                        ] as const).map(([label, key]) => (
                                            <div key={key} className="space-y-3 h-full">
                                                <label className="flex items-center space-x-3 cursor-pointer group bg-slate-50 p-4 rounded-2xl border border-transparent hover:border-indigo-100 transition-all h-full">
                                                    <div className="relative flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={(options as any)[key]}
                                                            onMouseDown={(e) => e.stopPropagation()}
                                                            onChange={(e) => setOptions(prev => ({ ...prev, [key]: e.target.checked }))}
                                                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 transition-all cursor-pointer"
                                                        />
                                                    </div>
                                                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight">{label}</span>
                                                </label>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Inline Details (Freight & Inventory) */}
                                    {(options.freightIn || options.actAsGoodReceipt) && (
                                        <div className="space-y-4">
                                            {options.freightIn && (
                                                <div className="animate-in slide-in-from-top-2 duration-300">
                                                    <div className="bg-indigo-50/20 rounded-2xl border border-indigo-100/30 p-4 space-y-3 shadow-sm text-left">
                                                        <div className="flex items-center justify-between px-2 mb-1">
                                                            <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Freight Tracking Details</h3>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setFreightItems(prev => [...prev, { id: Date.now(), description: '', amount: '0', taxCode: 'No tax' }]);
                                                                }}
                                                                className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 flex items-center space-x-1 uppercase tracking-wider"
                                                            >
                                                                <Plus size={10} /> <span>New Freight Line</span>
                                                            </button>
                                                        </div>
                                                        <div className="space-y-2">
                                                            {freightItems.map((fItem) => (
                                                                <div key={fItem.id} className="flex items-stretch bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:border-indigo-200 transition-all group text-left">
                                                                    <div className="flex items-center px-4 bg-slate-50 border-r border-slate-200 text-[9px] font-black text-slate-400 uppercase tracking-tighter min-w-[90px]">DESCRIPTION</div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <input
                                                                            className="w-full h-full px-4 py-2 text-sm text-slate-600 focus:outline-none bg-transparent"
                                                                            placeholder="Shipping, Road Transport, etc."
                                                                            value={fItem.description}
                                                                            onMouseDown={(e) => e.stopPropagation()}
                                                                            onChange={(e) => setFreightItems(prev => prev.map(i => i.id === fItem.id ? { ...i, description: e.target.value } : i))}
                                                                        />
                                                                    </div>
                                                                    <div className="flex items-center px-4 bg-slate-50 border-x border-slate-200 text-[9px] font-black text-slate-400 uppercase tracking-tighter">AMOUNT</div>
                                                                    <div className="flex items-center bg-white px-2">
                                                                        <input
                                                                            className="w-24 px-2 py-2 text-sm font-bold text-slate-700 text-right focus:outline-none bg-transparent"
                                                                            placeholder="0.00"
                                                                            value={fItem.amount}
                                                                            onMouseDown={(e) => e.stopPropagation()}
                                                                            onChange={(e) => setFreightItems(prev => prev.map(i => i.id === fItem.id ? { ...i, amount: e.target.value } : i))}
                                                                        />
                                                                        <span className="text-[10px] font-black text-slate-300 ml-1 uppercase">{currency}</span>
                                                                    </div>
                                                                    <div className="bg-white border-x border-slate-200">
                                                                        <select
                                                                            className="h-full px-4 py-2 text-[10px] font-extrabold text-indigo-500 uppercase tracking-wider bg-transparent cursor-pointer focus:outline-none appearance-none"
                                                                            value={fItem.taxCode}
                                                                            onChange={(e) => setFreightItems(prev => prev.map(i => i.id === fItem.id ? { ...i, taxCode: e.target.value } : i))}
                                                                        >
                                                                            <option value="No tax">NO TAX</option>
                                                                            <option value="VAT 16%">VAT 16%</option>
                                                                        </select>
                                                                    </div>
                                                                    <div className="flex items-center px-4 bg-slate-50/30 text-right min-w-[100px]">
                                                                        <div className="w-full">
                                                                            <div className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Tax Amt</div>
                                                                            <div className="text-[11px] font-bold text-slate-600 tabular-nums">
                                                                                {((parseFloat(fItem.amount) || 0) * (fItem.taxCode === 'VAT 16%' ? 0.16 : 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-stretch border-l border-slate-200">
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); setFreightItems(prev => [...prev, { ...fItem, id: Date.now() }]); }}
                                                                            className="px-4 bg-slate-50 hover:bg-emerald-50 text-slate-300 hover:text-emerald-600 transition-all flex items-center justify-center border-r border-slate-100"
                                                                            title="Duplicate Line"
                                                                        ><Copy size={13} /></button>
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); setFreightItems(prev => prev.length > 1 ? prev.filter(i => i.id !== fItem.id) : prev); }}
                                                                            className="px-4 bg-slate-50 hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-all flex items-center justify-center"
                                                                            title="Remove Line"
                                                                            onMouseDown={(e) => e.stopPropagation()}
                                                                        ><Trash2 size={13} /></button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {options.actAsGoodReceipt && (
                                                <div className="bg-slate-50/50 rounded-3xl border border-slate-100 p-4 flex items-center justify-between group hover:border-indigo-100 transition-all animate-in slide-in-from-top-2 duration-300">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                                                            <Package size={14} />
                                                        </div>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Store Location</span>
                                                    </div>
                                                    <div className="relative w-48">
                                                        <select
                                                            value={options.inventoryLocation}
                                                            onMouseDown={(e) => e.stopPropagation()}
                                                            onChange={(e) => setOptions(prev => ({ ...prev, inventoryLocation: e.target.value }))}
                                                            className="w-full appearance-none bg-emerald-50 border border-emerald-100 rounded-full px-5 py-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-emerald-500/10 cursor-pointer transition-all hover:bg-emerald-100/50 pr-10"
                                                        >
                                                            <option value="Main Warehouse">MAIN WAREHOUSE</option>
                                                            <option value="Showroom">SHOWROOM</option>
                                                            <option value="Secondary Store">SECONDARY STORE</option>
                                                            <option value="Retail Branch">RETAIL BRANCH</option>
                                                        </select>
                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-500">
                                                            <ChevronDown size={12} />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Secondary Options Row */}
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {([
                                            ['Line Numbers', 'columnLineNumber'],
                                            ['Custom Title', 'customTitle'],
                                            ['Footers', 'footers']
                                        ] as const).map(([label, key]) => (
                                            <div key={key} className="space-y-3 h-full">
                                                <label className="flex items-center space-x-3 cursor-pointer group bg-slate-50 p-4 rounded-2xl border border-transparent hover:border-indigo-100 transition-all h-full">
                                                    <div className="relative flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={(options as any)[key]}
                                                            onMouseDown={(e) => e.stopPropagation()}
                                                            onChange={(e) => setOptions(prev => ({ ...prev, [key]: e.target.checked }))}
                                                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 transition-all cursor-pointer"
                                                        />
                                                    </div>
                                                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight">{label}</span>
                                                </label>
                                                {key === 'customTitle' && options.customTitle && (
                                                    <div className="animate-in slide-in-from-top-2 duration-300 ml-4">
                                                        <input
                                                            type="text"
                                                            autoFocus
                                                            value={options.customTitleValue}
                                                            onMouseDown={(e) => e.stopPropagation()}
                                                            onChange={(e) => setOptions(prev => ({ ...prev, customTitleValue: e.target.value }))}
                                                            placeholder="e.g. Purchase Invoice"
                                                            className="w-full bg-indigo-50/70 border-none rounded-full px-6 py-2 text-[12px] font-bold text-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 placeholder:text-indigo-300/50 transition-all shadow-sm"
                                                        />
                                                    </div>
                                                )}
                                                {key === 'footers' && options.footers && (
                                                    <div className="space-y-4 ml-4 animate-in slide-in-from-top-2 duration-300">
                                                        <div className="relative group/foot">
                                                            <select
                                                                onMouseDown={(e) => e.stopPropagation()}
                                                                onChange={(e) => {
                                                                    const footer = dbFooters.find(f => f.id === e.target.value);
                                                                    if (footer) setOptions(prev => ({ ...prev, footerValue: footer.content }));
                                                                }}
                                                                className="w-full appearance-none bg-white border border-indigo-100 rounded-full px-6 py-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-indigo-500/10 cursor-pointer pr-12 shadow-sm"
                                                            >
                                                                <option value="">-- Choose template --</option>
                                                                {dbFooters.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                                            </select>
                                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400">
                                                                <ChevronDown size={12} />
                                                            </div>
                                                        </div>
                                                        <div className="bg-white/80 rounded-2xl p-4 border border-indigo-100/50 min-h-[60px]">
                                                            <p className="text-[10px] font-medium text-slate-600 italic leading-relaxed">
                                                                {options.footerValue || <span className="opacity-40 italic">Select a template...</span>}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end space-x-4 pt-8">
                            <Button variant="outline" onClick={() => navigate('/purchase-invoices')} className="rounded-2xl px-8 py-4">Cancel</Button>
                            <Button variant="primary" onClick={handleSave} className="rounded-2xl px-12 py-4 bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-200">
                                <Save size={18} className="mr-2" />
                                {isEditing ? 'Update Invoice' : 'Save Invoice'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewPurchaseInvoiceView;
