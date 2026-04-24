import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import {
    mockPurchaseOrders,
    mockPurchaseInvoices,
    mockInventory,
    getSuppliers,
    savePurchaseInvoices,
    getFooters
} from '../mockData';
import { PurchaseInvoice } from '../types';
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
    Briefcase
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

    const [issueDate, setIssueDate] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [supplier, setSupplier] = useState('');
    const [currency, setCurrency] = useState('ZMW');
    const [billingAddress, setBillingAddress] = useState('');
    const [description, setDescription] = useState('');
    const [reference, setReference] = useState('');
    const [useManualRef, setUseManualRef] = useState(false);
    const [items, setItems] = useState([{ id: Date.now(), item: 'Select Item', account: 'Inventory', description: '', qty: '1', unitPrice: '0', discount: '', taxCode: 'VAT 16%', unit: '' }]);
    const [options, setOptions] = useState({
        amountsAreTaxInclusive: false,
        columnLineNumber: true,
        columnDiscount: false,
        columnDiscountType: 'Percentage',
        withholdingTax: false,
        withholdingTaxType: 'Rate',
        withholdingTaxValue: '0',
        customTitle: false,
        customTitleValue: 'Purchase Invoice',
        footers: false,
        footerValue: 'Terms & Conditions apply.'
    });

    const getNextReference = () => {
        const refs = mockPurchaseInvoices
            .map(i => i.reference)
            .filter(ref => ref && ref.startsWith('PI-'))
            .map(ref => parseInt(ref.split('-')[1]) || 0);

        const nextNum = refs.length > 0 ? Math.max(...refs) + 1 : 1001;
        return `PI-${nextNum.toString().padStart(4, '0')}`;
    };

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const copyFromId = searchParams.get('copyFrom');
        if (id || copyFromId) {
            const invoiceId = id || copyFromId;
            const sourceInvoice = mockPurchaseInvoices.find(i => i.id === invoiceId);
            const sourceOrder = !sourceInvoice ? mockPurchaseOrders.find(o => o.id === invoiceId) : null;
            const doc = sourceInvoice || sourceOrder;

            if (doc) {
                setIssueDate(new Date().toISOString().split('T')[0]);
                setDueDate(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
                setSupplier(doc.supplier);
                setCurrency(doc.currency || 'ZMW');
                setBillingAddress((doc as any).billingAddress || getSuppliers().find(s => s.name === doc.supplier)?.billingAddress || '');
                if (id) {
                    setReference(doc.reference);
                    setUseManualRef(true);
                } else {
                    setReference(getNextReference());
                    setUseManualRef(false);
                }
                setDescription(doc.description || '');
                
                const itemsToSet = doc.items && doc.items.length > 0
                    ? doc.items
                    : [{ id: Date.now(), item: 'General Item', description: doc.description || '', qty: 1, unitPrice: (doc as any).invoiceAmount || (doc as any).amount || 0, discount: '', taxCode: 'No tax' }];

                setItems(itemsToSet.map(i => ({
                    id: i.id || Date.now() + Math.random(),
                    item: i.item || 'Select Item',
                    account: (i as any).account || 'Inventory',
                    description: i.description || '',
                    qty: i.qty ? i.qty.toString() : '1',
                    unitPrice: i.unitPrice ? i.unitPrice.toString() : '0',
                    discount: i.discount || '',
                    taxCode: i.taxCode || 'No tax',
                    unit: i.unit || ''
                })));
            }
        } else {
            setIssueDate(new Date().toISOString().split('T')[0]);
            setDueDate(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
            setSupplier('');
            setCurrency('ZMW');
            setBillingAddress('');
            setReference(getNextReference());
            setUseManualRef(false);
            setDescription('');
            setItems([{ id: Date.now(), item: 'Select Item', account: 'Inventory', description: '', qty: '1', unitPrice: '', discount: '', taxCode: 'VAT 16%', unit: '' }]);
        }
    }, [id, location.search]);

    const calculations = useMemo(() => {
        let subtotal = 0;
        let totalTax = 0;
        const lineCalcs = items.map(item => {
            const qty = parseFloat(item.qty) || 0;
            const price = parseFloat(item.unitPrice) || 0;
            let netTotal = qty * price;
            let taxAmount = 0;
            if (item.taxCode === 'VAT 16%') {
                if (options.amountsAreTaxInclusive) {
                    taxAmount = netTotal - (netTotal / 1.16);
                    netTotal = netTotal - taxAmount;
                } else taxAmount = netTotal * 0.16;
            }
            subtotal += netTotal;
            totalTax += taxAmount;
            return { taxAmount, grossTotal: netTotal + taxAmount, netTotal };
        });
        let grandTotal = subtotal + totalTax;
        return { lineCalcs, subtotal, totalTax, grandTotal };
    }, [items, options]);

    const handleSave = async () => {
        const newInvoice: PurchaseInvoice = {
            id: isEditing ? id! : `PI-${Date.now()}`,
            issueDate: issueDate.split('-').reverse().join('.'),
            dueDate: dueDate.split('-').reverse().join('.'),
            reference: reference || getNextReference(),
            supplier: supplier,
            description: description,
            currency: currency,
            invoiceAmount: calculations.grandTotal,
            balanceDue: calculations.grandTotal,
            status: 'Coming due',
            billingAddress: billingAddress,
            timestamp: new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).replace(/\//g, '.').replace(',', '').toUpperCase(),
            items: items.filter(i => i.item !== 'Select Item').map(i => ({ ...i, id: Number(i.id) }))
        };

        if (isEditing) {
            const index = mockPurchaseInvoices.findIndex(inv => inv.id === id);
            if (index !== -1) mockPurchaseInvoices[index] = newInvoice;
        } else {
            mockPurchaseInvoices.unshift(newInvoice);
        }

        savePurchaseInvoices(mockPurchaseInvoices);
        window.dispatchEvent(new Event('storage'));
        navigate('/purchase-invoices');
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
                                        const selected = getSuppliers().find(s => s.name === supName);
                                        if (selected) {
                                            setCurrency(selected.currency.split(' - ')[0]);
                                            setBillingAddress(selected.billingAddress || '');
                                        }
                                    }} Icon={User}>
                                        <option value="">Select Target Supplier...</option>
                                        {getSuppliers().map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
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
                                <button onClick={() => setItems(prev => [...prev, { id: Date.now(), item: 'Select Item', account: 'Inventory', description: '', qty: '1', unitPrice: '0', discount: '', taxCode: 'VAT 16%', unit: '' }])} className="flex items-center space-x-2 px-6 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-100 transition-all">
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
                                            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">DESCRIPTION</th>
                                            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-24 text-right">QTY</th>
                                            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-32 text-right">UNIT PRICE</th>
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
                                                                const invItem = (mockInventory as any)[val];
                                                                setItems(prev => prev.map(i => i.id === item.id ? {
                                                                    ...i,
                                                                    item: val,
                                                                    unitPrice: invItem ? invItem.purchasePrice.toString() : i.unitPrice,
                                                                    description: invItem ? val : i.description,
                                                                    unit: invItem ? (invItem as any).unit : i.unit
                                                                } : i));
                                                            }}
                                                            className="w-full bg-transparent border-none p-0 text-sm font-bold text-[#2563eb] outline-none appearance-none cursor-pointer"
                                                        >
                                                            <option value="Select Item">Select Item</option>
                                                            {Object.keys(mockInventory).map(name => (
                                                                <option key={name} value={name}>{name}</option>
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
                                                    <td className="px-4 py-4">
                                                        <input
                                                            type="text"
                                                            value={item.qty}
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
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                setItems(prev => prev.map(i => i.id === item.id ? { ...i, unitPrice: val } : i));
                                                            }}
                                                            className="w-full bg-transparent border-none p-0 text-sm font-bold text-right outline-none text-slate-700"
                                                            placeholder="0.00"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <select
                                                            value={item.taxCode}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                setItems(prev => prev.map(i => i.id === item.id ? { ...i, taxCode: val } : i));
                                                            }}
                                                            className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer"
                                                        >
                                                            <option value="No tax">No tax</option>
                                                            <option value="VAT 16%">VAT 16%</option>
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
