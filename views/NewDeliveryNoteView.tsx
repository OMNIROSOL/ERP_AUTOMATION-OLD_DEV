import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import apiService from '../services/apiService';
import { Customer, InventoryItem, FooterTemplate } from '../types';

const NewDeliveryNoteView = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const isEditing = Boolean(id);

    const [formData, setFormData] = useState({
        deliveryDate: new Date().toISOString().split('T')[0],
        customer: '',
        deliveryAddress: '',
        description: '',
        reference: '',
        inventoryLocation: 'Default Inventory Location',
        orderNumber: '',
        invoiceNumber: '',
        status: 'Pending',
    });

    const [useManualRef, setUseManualRef] = useState(false);
    const [options, setOptions] = useState({
        columnLineNumber: true,
        customTitle: false,
        customTitleValue: 'Delivery Note',
        footers: false,
        footerValue: 'Goods received in good condition. Signature required.'
    });
    const [showOptionsArea, setShowOptionsArea] = useState(false);
    const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [footers, setFooters] = useState<FooterTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [items, setItems] = useState([{ id: Date.now(), item: '', description: '', qty: '0', unit: '' }]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [customers, itemsData, footersData] = await Promise.all([
                    apiService.getCustomers(),
                    apiService.getItems(),
                    apiService.getFooters()
                ]);
                setAllCustomers(customers);
                setInventoryItems(itemsData);
                setFooters(footersData);

                if (isEditing && id) {
                    const note = await apiService.getDeliveryNote(id);
                    if (note) {
                        setFormData({
                            deliveryDate: note.deliveryDate ? convertToInputDate(note.deliveryDate) : new Date().toISOString().split('T')[0],
                            customer: note.customer || '',
                            deliveryAddress: note.deliveryAddress || '',
                            description: note.description || '',
                            reference: note.reference || '',
                            inventoryLocation: note.inventoryLocation || 'Default Inventory Location',
                            orderNumber: note.orderNumber || '',
                            invoiceNumber: note.invoiceNumber || '',
                            status: note.status || 'Pending',
                        });
                        setUseManualRef(true);
                        if (note.customTitle) setOptions(prev => ({ ...prev, customTitle: true, customTitleValue: note.customTitle }));
                        if (note.footer) setOptions(prev => ({ ...prev, footers: true, footerValue: note.footer }));
                        if (note.columnLineNumber !== undefined) setOptions(prev => ({ ...prev, columnLineNumber: note.columnLineNumber }));
                        if (note.items) {
                            setItems(note.items.map((it: any) => ({
                                id: it.id || Math.random(),
                                item: it.item || '',
                                description: it.description || '',
                                qty: (it.qty || 0).toString(),
                                unit: it.unit || ''
                            })));
                        }
                    }
                } else {
                    const nextRef = await apiService.getNextReference('delivery');
                    setFormData(prev => ({ ...prev, reference: nextRef }));
                }
            } catch (err) {
                console.error('Failed to fetch data:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id, isEditing]);

    // Context fetching from URL for New Delivery Note
    useEffect(() => {
        const query = new URLSearchParams(location.search);
        const invoiceId = query.get('invoiceId') || query.get('copyFrom');

        if (invoiceId && !isEditing) {
            const fetchInvoiceContext = async () => {
                try {
                    const invoice = await apiService.getInvoice(invoiceId);
                    if (invoice) {
                        setFormData(prev => ({
                            ...prev,
                            customer: invoice.customer?.name || invoice.customerName || '',
                            deliveryAddress: invoice.billingAddress || invoice.customer?.billingAddress || '',
                            invoiceNumber: invoice.reference,
                            orderNumber: invoice.salesOrder || '',
                            description: `Shipment for Invoice ${invoice.reference}`
                        }));
                        if (invoice.items) {
                            setItems(invoice.items.map((it: any, idx: number) => ({
                                id: Date.now() + idx,
                                item: it.itemName || it.item,
                                description: it.description || '',
                                qty: (it.qty || 0).toString(),
                                unit: it.unitName || it.unit || ''
                            })));
                        }
                    }
                } catch (err) {
                    console.error('Failed to fetch invoice for context:', err);
                }
            };
            fetchInvoiceContext();
        }
    }, [location.search, isEditing]);

    const updateItem = (itemId: number, field: string, value: string) => {
        setItems(items.map(item => {
            if (item.id === itemId) {
                const updated = { ...item, [field]: value };
                if (field === 'item') {
                    const invItem = inventoryItems.find(i => i.itemName === value || i.itemCode === value);
                    if (invItem) {
                        updated.description = invItem.description || value;
                        updated.unit = invItem.unitName || '';
                    }
                }
                return updated;
            }
            return item;
        }));
    };

    const handleSave = async () => {
        if (!formData.customer) {
            alert('Please select a customer');
            return;
        }

        const noteData = {
            deliveryDate: convertToDisplayDate(formData.deliveryDate),
            customer: formData.customer,
            deliveryAddress: formData.deliveryAddress,
            description: formData.description,
            reference: formData.reference,
            inventoryLocation: formData.inventoryLocation,
            orderNumber: formData.orderNumber,
            invoiceNumber: formData.invoiceNumber,
            items: items.map(it => ({
                id: it.id,
                item: it.item,
                description: it.description,
                qty: parseFloat(it.qty) || 0,
                unit: it.unit
            })),
            status: formData.status,
            customTitle: options.customTitle ? options.customTitleValue : undefined,
            footer: options.footers ? options.footerValue : undefined,
            columnLineNumber: options.columnLineNumber
        };

        try {
            if (isEditing && id) {
                await apiService.updateDeliveryNote(id, noteData);
            } else {
                await apiService.createDeliveryNote(noteData);
            }
            navigate('/delivery-notes');
        } catch (err) {
            console.error('Failed to save delivery note:', err);
            alert('Failed to save delivery note');
        }
    };

    const addLine = () => setItems([...items, { id: Date.now(), item: '', description: '', qty: '0', unit: '' }]);
    const deleteLine = (itemId: number) => items.length > 1 && setItems(items.filter(item => item.id !== itemId));

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-40 space-y-4">
                <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Preparing shipment details...</p>
            </div>
        );
    }

    const handleInputChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const totalQty = useMemo(() => {
        return items.reduce((sum, item) => {
            if (item.item.trim() === '') return sum;
            return sum + (parseFloat(item.qty) || 0);
        }, 0);
    }, [items]);

    const totalItems = useMemo(() => {
        return items.filter(i => i.item.trim() !== '').length;
    }, [items]);

    const handleDuplicateItem = (item: any) => {
        const newItem = {
            ...item,
            id: Date.now() + Math.random()
        };
        const index = items.findIndex(i => i.id === item.id);
        const newItems = [...items];
        newItems.splice(index + 1, 0, newItem);
        setItems(newItems);
    };

    return (
        <div className="p-10 max-w-[1400px] mx-auto space-y-6 selection:bg-indigo-100 selection:text-indigo-900 font-sans animate-in fade-in duration-700">
            {/* Header Area */}
            <div className="flex justify-between items-center">
                <div>
                    <div className="flex items-center space-x-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">
                        <span className="cursor-pointer hover:underline" onClick={() => navigate('/delivery-notes')}>Delivery Notes</span>
                        <ChevronRight size={10} className="opacity-50" />
                        <span className="text-slate-400">{isEditing ? 'Edit Existing' : 'Capture New'}</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                        {isEditing ? 'Modify Delivery Note' : 'New Delivery Note'}
                    </h1>
                    <p className="text-slate-500 font-medium text-sm">Capture shipment details and fulfillment items.</p>
                </div>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate('/delivery-notes')}
                        className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors shadow-sm text-slate-400"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="p-10 space-y-12">
                    {/* Basic Info Segment */}
                    <div className="space-y-8">
                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                                <FileText size={20} />
                            </div>
                            <h2 className="text-lg font-black text-slate-800 tracking-tight">Basic Information</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <InputField
                                label="Delivery Date"
                                type="date"
                                name="deliveryDate"
                                value={formData.deliveryDate}
                                onChange={handleInputChange}
                                Icon={Calendar}
                            />
                            <SelectField
                                label="Current Status"
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                                Icon={Clock}
                            >
                                <option value="Pending">Pending</option>
                                <option value="Packed">Packed</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Delivered">Delivered</option>
                            </SelectField>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Reference</label>
                                <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-500 transition-all h-[46px]">
                                    <div
                                        className="h-full px-4 border-r border-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-100/50 transition-colors"
                                        onClick={() => {
                                            setUseManualRef(!useManualRef);
                                            if (!useManualRef) handleInputChange({ target: { name: 'reference', value: '' } });
                                        }}
                                    >
                                        <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${!useManualRef ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 border-2'}`}>
                                            {!useManualRef && <CheckCircle2 size={12} className="text-white" strokeWidth={3} />}
                                        </div>
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.reference}
                                        onChange={(e) => useManualRef && handleInputChange({ target: { name: 'reference', value: e.target.value } })}
                                        readOnly={!useManualRef}
                                        placeholder={useManualRef ? "Enter custom ref..." : ""}
                                        className={cn(
                                            "w-full bg-transparent border-none px-4 py-3 text-[13px] font-semibold outline-none transition-colors",
                                            !useManualRef ? "text-indigo-600 font-black" : "text-slate-700"
                                        )}
                                    />
                                </div>
                            </div>
                            <SelectField
                                label="Inventory Location"
                                value={formData.inventoryLocation}
                                onChange={(e: any) => handleInputChange({ target: { name: 'inventoryLocation', value: e.target.value } })}
                                Icon={MapPin}
                            >
                                <option>Default Inventory Location</option>
                                <option>Main Warehouse</option>
                                <option>Secondary Yard</option>
                            </SelectField>
                        </div>
                    </div>

                    {/* Logistics & Memo Segment */}
                    <div className="space-y-8 pt-8 border-t border-slate-100">
                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
                                <User size={20} />
                            </div>
                            <h2 className="text-lg font-black text-slate-800 tracking-tight">Logistics & Memo</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <SelectField
                                    label="Customer (To)"
                                    value={formData.customer}
                                    onChange={(e: any) => handleInputChange({ target: { name: 'customer', value: e.target.value } })}
                                    Icon={User}
                                >
                                    <option value="">Select Customer</option>
                                    {allCustomers.map(c => (
                                        <option key={c.id} value={c.name}>{c.name}</option>
                                    ))}
                                </SelectField>
                            </div>
                            <div className="hidden md:block"></div> {/* Spacer for alignment */}

                            <TextareaField
                                label="Delivery Address"
                                value={formData.deliveryAddress}
                                onChange={(e: any) => handleInputChange({ target: { name: 'deliveryAddress', value: e.target.value } })}
                                placeholder="Enter shipping destination information..."
                                rows={4}
                            />
                            <TextareaField
                                label="Description / Memo"
                                value={formData.description}
                                onChange={(e: any) => handleInputChange({ target: { name: 'description', value: e.target.value } })}
                                placeholder="Overall shipment description..."
                                rows={4}
                            />
                        </div>
                    </div>





                    {/* Items Section */}
                    <div className="space-y-8 pt-8 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                                    <Package size={20} />
                                </div>
                                <h2 className="text-lg font-black text-slate-800 tracking-tight">Fulfillment Line Items</h2>
                            </div>
                            <button
                                onClick={addLine}
                                className="flex items-center space-x-2 px-6 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-100 transition-all"
                            >
                                <Plus size={14} /> <span>Add New Item</span>
                            </button>
                        </div>

                        <div className="overflow-hidden rounded-3xl border border-slate-100 shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        {options.columnLineNumber && <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-16 text-center">#</th>}
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest min-w-[200px]">ITEM / PRODUCT</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">DESCRIPTION</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-40 text-right">QTY DELIVERED</th>
                                        <th className="px-6 py-4 w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {items.map((item, index) => (
                                        <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                                            {options.columnLineNumber && <td className="px-6 py-6 text-xs font-bold text-slate-400 text-center">{index + 1}</td>}
                                            <td className="px-6 py-6">
                                                <select
                                                    value={item.item}
                                                    onChange={(e) => updateItem(item.id, 'item', e.target.value)}
                                                    className="w-full bg-transparent border-none p-0 text-sm font-bold text-indigo-600 outline-none appearance-none cursor-pointer"
                                                >
                                                    <option value="">Select Item...</option>
                                                    {inventoryItems.map(i => (
                                                        <option key={i.id} value={i.itemName}>{i.itemName}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-6 py-6">
                                                <input
                                                    type="text"
                                                    value={item.description}
                                                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                                    className="w-full bg-transparent border-none p-0 text-sm text-slate-600 outline-none placeholder:text-slate-300 font-medium"
                                                    placeholder="Add line description..."
                                                />
                                            </td>
                                            <td className="px-6 py-6 transition-all group-hover:px-4">
                                                <div className="flex flex-col items-end gap-1 group-hover:bg-white group-hover:shadow-sm group-hover:rounded-xl group-hover:px-4 group-hover:py-2 transition-all">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <input
                                                            type="text"
                                                            value={item.qty}
                                                            onChange={(e) => updateItem(item.id, 'qty', e.target.value)}
                                                            className="w-20 bg-transparent border-none p-0 text-sm font-black text-slate-800 text-right outline-none"
                                                            placeholder="0"
                                                        />
                                                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-tight">{item.unit || 'PCS'}</span>
                                                    </div>
                                                    {(() => {
                                                        const invItem = inventoryItems.find(i => i.itemName === item.item || i.itemCode === item.item);
                                                        return invItem && (
                                                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em] border-t border-slate-100 pt-1 w-full text-right">
                                                                Available: <span className="text-emerald-500 font-black">{(invItem.qtyOnHand || 0).toLocaleString()}</span> {item.unit || 'PCS'}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button
                                                        onClick={() => handleDuplicateItem(item)}
                                                        className="p-2 rounded-xl text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                                                        title="Duplicate Line"
                                                    >
                                                        <Copy size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteLine(item.id)}
                                                        className="p-2 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
                                                        title="Delete Line"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Document Options Segment */}
                    <div className="space-y-6 pt-8 border-t border-slate-100">
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
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{showOptionsArea ? 'Hide configuration' : 'Configure document settings'}</p>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-amber-600 group-hover:bg-amber-100/50 transition-all">
                                <ChevronDown size={20} className={cn("transition-transform duration-300", showOptionsArea ? "rotate-180" : "")} />
                            </div>
                        </div>

                        {showOptionsArea && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-4 duration-500 pb-4">
                                <div
                                    className="flex items-center space-x-3 cursor-pointer group"
                                    onClick={() => setOptions(prev => ({ ...prev, columnLineNumber: !prev.columnLineNumber }))}
                                >
                                    <div className={cn(
                                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                                        options.columnLineNumber ? "bg-amber-500 border-amber-500" : "border-slate-300 group-hover:border-amber-400"
                                    )}>
                                        {options.columnLineNumber && <CheckCircle2 size={12} className="text-white" strokeWidth={3} />}
                                    </div>
                                    <span className="text-sm font-semibold text-slate-600">Column — Line number</span>
                                </div>
                                <div className="space-y-4">
                                    <div
                                        className="flex items-center space-x-3 cursor-pointer group"
                                        onClick={() => setOptions(prev => ({ ...prev, customTitle: !prev.customTitle }))}
                                    >
                                        <div className={cn(
                                            "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                                            options.customTitle ? "bg-amber-500 border-amber-500" : "border-slate-300 group-hover:border-amber-400"
                                        )}>
                                            {options.customTitle && <CheckCircle2 size={12} className="text-white" strokeWidth={3} />}
                                        </div>
                                        <span className="text-sm font-semibold text-slate-600">Custom title</span>
                                    </div>
                                    {options.customTitle && (
                                        <input
                                            type="text"
                                            value={options.customTitleValue}
                                            onChange={(e) => setOptions(prev => ({ ...prev, customTitleValue: e.target.value }))}
                                            placeholder="e.g. Proforma Note"
                                            className="w-full bg-amber-50/50 border border-amber-100/50 rounded-xl px-4 py-2 text-[11px] font-bold text-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/10 placeholder:text-amber-300/50 animate-in slide-in-from-top-2 duration-300"
                                        />
                                    )}
                                </div>
                                <div className="space-y-4">
                                    <div
                                        className="flex items-center space-x-3 cursor-pointer group"
                                        onClick={() => setOptions(prev => ({ ...prev, footers: !prev.footers }))}
                                    >
                                        <div className={cn(
                                            "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                                            options.footers ? "bg-amber-500 border-amber-500" : "border-slate-300 group-hover:border-amber-400"
                                        )}>
                                            {options.footers && <CheckCircle2 size={12} className="text-white" strokeWidth={3} />}
                                        </div>
                                        <span className="text-sm font-semibold text-slate-600">Footers</span>
                                    </div>
                                    {options.footers && (
                                        <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                            <select
                                                onChange={(e) => {
                                                    const footer = getFooters().find(f => f.id === e.target.value);
                                                    if (footer) {
                                                        setOptions(prev => ({ ...prev, footerValue: footer.content }));
                                                    }
                                                }}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black text-indigo-600 uppercase focus:outline-none focus:ring-4 focus:ring-indigo-500/10 cursor-pointer appearance-none"
                                            >
                                                <option value="">-- Choose template --</option>
                                                    {footers.map(f => (
                                                        <option key={f.id} value={f.id}>{f.name}</option>
                                                    ))}
                                            </select>
                                            <textarea
                                                value={options.footerValue}
                                                onChange={(e) => setOptions(prev => ({ ...prev, footerValue: e.target.value }))}
                                                placeholder="Terms & Conditions..."
                                                rows={2}
                                                className="w-full bg-amber-50/50 border border-amber-100/50 rounded-xl px-4 py-2 text-[11px] font-bold text-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/10 placeholder:text-amber-300/50 resize-none overflow-hidden"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Supporting Documentation Segment */}
                    <div className="space-y-6 pt-8 border-t border-slate-100">
                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                <Image size={20} />
                            </div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Supporting Documentation</h3>
                        </div>

                        <div className="relative group cursor-pointer">
                            <div className="flex items-center p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[28px] hover:border-indigo-300 hover:bg-slate-100 transition-all">
                                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-indigo-500 transition-colors">
                                    <Plus size={24} />
                                </div>
                                <div className="ml-6">
                                    <h4 className="text-md font-black text-slate-700 tracking-tight">Attach Documents</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Specs, Plans or References</p>
                                </div>
                            </div>
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                    </div>

                    {/* Summary Support Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
                        <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100 border-dashed space-y-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Shipment Summary</h3>
                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Total Items</p>
                                    <p className="text-2xl font-black text-slate-800 tracking-tight">{totalItems}</p>
                                </div>
                                <div className="text-right space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Total Quantity</p>
                                    <p className="text-2xl font-black text-indigo-600 tracking-tight">{totalQty} <span className="text-[10px] text-slate-400 opacity-60">PCS</span></p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col justify-end gap-4 pb-4">
                            <div className="flex gap-4">
                                <button
                                    onClick={() => navigate('/delivery-notes')}
                                    className="flex-1 px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-[20px] font-black text-[12px] uppercase tracking-[0.15em] hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                                >
                                    Discard
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex-[1.5] px-8 py-4 bg-indigo-600 text-white rounded-[20px] font-black text-[12px] uppercase tracking-[0.15em] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    {isEditing ? <Save size={18} /> : <Save size={18} />}
                                    {isEditing ? 'Update Delivery Note' : 'Create Delivery Note'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewDeliveryNoteView;
