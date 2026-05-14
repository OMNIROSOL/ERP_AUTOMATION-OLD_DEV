import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import apiService from '../services/apiService';

const NewDebitNoteView = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dateInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
    const [supplier, setSupplier] = useState('');
    const [description, setDescription] = useState('');
    const [reference, setReference] = useState('');
    const [useManualRef, setUseManualRef] = useState(false);
    const [fileName, setFileName] = useState('No file chosen');
    const [items, setItems] = useState([{ id: Date.now(), item: '', account: 'Inventory on hand', qty: '1', unitPrice: '0', taxCode: 'VAT 16%' }]);

    const [dbSuppliers, setDbSuppliers] = useState<any[]>([]);
    const [dbItems, setDbItems] = useState<any[]>([]);
    const [taxCodes, setTaxCodes] = useState<any[]>([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [sups, itemsData, taxCodesData] = await Promise.all([
                    apiService.getSuppliers(),
                    apiService.getItems(),
                    apiService.getTaxCodes()
                ]);
                setDbSuppliers(sups);
                setDbItems(itemsData);
                setTaxCodes(taxCodesData);
            } catch (err) {
                console.error('Failed to load debit note data:', err);
            }
        };
        loadData();
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const copyFromId = params.get('copyFrom');
        if (copyFromId) {
            const fetchSource = async () => {
                try {
                    let sourceDoc: any = null;
                    try {
                        sourceDoc = await apiService.getPurchaseInvoice(copyFromId);
                    } catch (e) {
                        try {
                            sourceDoc = await apiService.getPurchaseOrder(copyFromId);
                        } catch (e2) {
                            sourceDoc = await apiService.getInvoice(copyFromId);
                        }
                    }

                    if (sourceDoc) {
                        setSupplier(sourceDoc.supplier?.name || sourceDoc.supplierName || sourceDoc.supplier || '');
                        setDescription(`Debit note for ${sourceDoc.reference}`);
                        if (sourceDoc.items) {
                            setItems(sourceDoc.items.map((i: any) => ({
                                id: Date.now() + Math.random(),
                                item: i.item?.itemName || i.itemName || i.item || '',
                                account: i.account || 'Inventory on hand',
                                qty: (i.qty || '1').toString(),
                                unitPrice: (i.unitPrice || '0').toString(),
                                taxCode: i.taxCode || 'VAT 16%'
                            })));
                        }
                    }
                } catch (err) {
                    console.error('Failed to load source for debit note:', err);
                }
            };
            fetchSource();
        }
    }, [location.search]);

    const updateItem = (id: number, field: string, value: string) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const triggerFileSelect = () => fileInputRef.current?.click();
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFileName(e.target.files[0].name);
        }
    };

    const addItem = () => {
        setItems([...items, { id: Date.now(), item: '', account: 'Inventory on hand', qty: '1', unitPrice: '0', taxCode: 'VAT 16%' }]);
    };

    const removeItem = (id: number) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    return (
        <div className="bg-[#f3f4f6] min-h-full flex flex-col">
            <div className="bg-white px-4 py-2 border-b border-[#cfd8dc] flex items-center text-[11px] text-[#90a4ae] space-x-1.5 select-none">
                <i className="fas fa-folder-open text-[#90a4ae]"></i>
                <i className="fas fa-caret-right text-[#cfd8dc] scale-75"></i>
                <Link to="/sales-quotes" className="hover:text-[#2196f3]">Sales Quotes</Link>
                <i className="fas fa-caret-right text-[#cfd8dc] scale-75"></i>
                <span className="hover:text-[#2196f3] cursor-pointer">View</span>
                <i className="fas fa-caret-right text-[#cfd8dc] scale-75"></i>
                <span className="text-[#455a64]">Edit</span>
            </div>

            <div className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-[1600px] mx-auto">
                    <div className="flex items-center space-x-2 mb-8">
                        <h1 className="text-[18px] text-[#455a64]">Debit Note</h1>
                        <i className="fas fa-question-circle text-[#cfd8dc] text-[14px]"></i>
                    </div>

                    <div className="grid grid-cols-4 gap-x-12 gap-y-6 mb-10">
                        <div className="space-y-2">
                            <label className="block text-[13px] text-[#455a64]">Issue date</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={issueDate}
                                    onChange={(e) => setIssueDate(e.target.value)}
                                    className="w-full border border-[#cfd8dc] rounded-[4px] px-3 py-1.5 text-[14px] outline-none focus:border-[#2196f3]"
                                />
                                <i className="far fa-calendar absolute right-3 top-1/2 -translate-y-1/2 text-[#90a4ae] cursor-pointer" onClick={() => dateInputRef.current?.showPicker()}></i>
                                <input type="date" ref={dateInputRef} className="absolute opacity-0 pointer-events-none" onChange={(e) => setIssueDate(e.target.value)} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[13px] text-[#455a64]">Reference</label>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={useManualRef}
                                    onChange={(e) => setUseManualRef(e.target.checked)}
                                    className="w-4 h-4 border-[#cfd8dc] rounded"
                                />
                                <input
                                    type="text"
                                    placeholder="Optional"
                                    disabled={!useManualRef}
                                    value={reference}
                                    onChange={(e) => setReference(e.target.value)}
                                    className="flex-1 border border-[#cfd8dc] rounded-[4px] px-3 py-1.5 text-[14px] outline-none focus:border-[#2196f3] disabled:bg-[#f5f5f5]"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-x-12 gap-y-6 mb-10">
                        <div className="space-y-2">
                            <label className="block text-[13px] text-[#455a64]">Supplier</label>
                            <div className="relative">
                                <select
                                    className="w-full border border-[#cfd8dc] rounded-[4px] px-3 py-1.5 text-[14px] outline-none focus:border-[#2196f3] appearance-none bg-white"
                                    value={supplier}
                                    onChange={(e) => setSupplier(e.target.value)}
                                >
                                    <option value=""></option>
                                    {dbSuppliers.filter(s => (!s.inactive && s.status !== 'Inactive') || s.name === supplier).map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                </select>
                                <i className="fas fa-caret-down absolute right-3 top-1/2 -translate-y-1/2 text-[#90a4ae] pointer-events-none"></i>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[13px] text-[#455a64]">Purchase Invoice</label>
                            <div className="relative">
                                <select
                                    className="w-full border border-[#cfd8dc] rounded-[4px] px-3 py-1.5 text-[14px] outline-none focus:border-[#2196f3] appearance-none bg-white"
                                >
                                    <option>Automatic</option>
                                </select>
                                <i className="fas fa-caret-down absolute right-3 top-1/2 -translate-y-1/2 text-[#90a4ae] pointer-events-none"></i>
                            </div>
                        </div>
                    </div>

                    <div className="mb-10 space-y-2">
                        <label className="block text-[13px] text-[#455a64]">Description</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full max-w-[400px] border border-[#cfd8dc] rounded-[4px] px-3 py-1.5 text-[14px] outline-none focus:border-[#2196f3]"
                        />
                    </div>

                    <div className="mb-6 overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="text-[11px] text-[#90a4ae] uppercase tracking-wider">
                                    <th className="pb-2 font-medium w-[25%]">Item</th>
                                    <th className="pb-2 font-medium w-[25%]">Account</th>
                                    <th className="pb-2 font-medium w-[10%]">Qty</th>
                                    <th className="pb-2 font-medium w-[12%]">Unit price</th>
                                    <th className="pb-2 font-medium w-[12%]">Total</th>
                                    <th className="pb-2 font-medium w-[12%]">Tax Code</th>
                                    <th className="pb-2 w-[4%]"></th>
                                </tr>
                            </thead>
                            <tbody className="space-y-2">
                                {items.map((item) => (
                                    <tr key={item.id} className="group">
                                        <td className="pr-4 pb-2">
                                            <div className="relative">
                                                <select
                                                    className="w-full border border-[#cfd8dc] rounded-[4px] px-3 py-1.5 text-[13px] outline-none focus:border-[#2196f3] appearance-none bg-white"
                                                    value={item.item}
                                                    onChange={(e) => updateItem(item.id, 'item', e.target.value)}
                                                >
                                                    <option value=""></option>
                                                    {dbItems.map(it => (
                                                        <option key={it.id} value={it.itemName}>{it.itemName}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </td>
                                        <td className="pr-4 pb-2">
                                            <div className="relative">
                                                <select
                                                    className="w-full border border-[#cfd8dc] rounded-[4px] px-3 py-1.5 text-[13px] outline-none focus:border-[#2196f3] appearance-none bg-white"
                                                    value={item.account}
                                                    onChange={(e) => updateItem(item.id, 'account', e.target.value)}
                                                >
                                                    <option>Inventory on hand</option>
                                                </select>
                                                <i className="fas fa-caret-down absolute right-3 top-1/2 -translate-y-1/2 text-[#cfd8dc]"></i>
                                            </div>
                                        </td>
                                        <td className="pr-4 pb-2">
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="text"
                                                    value={item.qty}
                                                    onChange={(e) => updateItem(item.id, 'qty', e.target.value)}
                                                    className="w-16 border border-[#cfd8dc] rounded-[4px] px-3 py-1.5 text-[13px] outline-none focus:border-[#2196f3] text-right"
                                                />
                                                <span className="text-[11px] text-[#90a4ae]">PCS</span>
                                            </div>
                                        </td>
                                        <td className="pr-4 pb-2">
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="text"
                                                    value={item.unitPrice}
                                                    onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)}
                                                    className="flex-1 border border-[#cfd8dc] rounded-[4px] px-3 py-1.5 text-[13px] outline-none focus:border-[#2196f3] text-right"
                                                />
                                                <span className="text-[11px] text-[#90a4ae]">ZMW</span>
                                            </div>
                                        </td>
                                        <td className="pr-4 pb-2">
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="text"
                                                    value="0"
                                                    readOnly
                                                    className="flex-1 border border-[#cfd8dc] rounded-[4px] px-3 py-1.5 text-[13px] bg-[#f5f5f5] text-right outline-none"
                                                />
                                                <span className="text-[11px] text-[#90a4ae]">ZMW</span>
                                            </div>
                                        </td>
                                        <td className="pr-4 pb-2">
                                            <div className="relative">
                                                <select
                                                    className="w-full border border-[#cfd8dc] rounded-[4px] px-3 py-1.5 text-[13px] outline-none focus:border-[#2196f3] appearance-none bg-white"
                                                    value={item.taxCode}
                                                    onChange={(e) => updateItem(item.id, 'taxCode', e.target.value)}
                                                >
                                                    <option value="No tax">No tax</option>
                                                    {taxCodes.map(tc => <option key={tc.id} value={tc.name}>{tc.name}</option>)}
                                                </select>
                                                <button className="absolute right-2 top-1/2 -translate-y-1/2 text-[#cfd8dc] hover:text-[#90a4ae]">×</button>
                                                <i className="fas fa-caret-down absolute right-6 top-1/2 -translate-y-1/2 text-[#cfd8dc]"></i>
                                            </div>
                                        </td>
                                        <td className="pb-2">
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="w-8 h-8 border border-[#cfd8dc] rounded-[4px] flex items-center justify-center text-[#90a4ae] hover:bg-red-50 hover:text-red-500 transition shadow-sm"
                                            >
                                                <i className="fas fa-trash-alt text-[12px]"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <button
                        onClick={addItem}
                        className="flex items-center space-x-2 text-[13px] text-[#455a64] hover:text-[#2196f3] transition mb-10"
                    >
                        <i className="fas fa-caret-right text-[10px]"></i>
                        <span className="border-b border-dotted border-[#455a64] hover:border-[#2196f3]">Add line</span>
                    </button>

                    <div className="space-y-4 mb-12">
                        {[
                            { label: 'Amounts are tax inclusive', checked: true },
                            { label: 'Column — Line number', checked: false },
                            { label: 'Column — Description', checked: false },
                            { label: 'Column — Discount', checked: false },
                            { label: 'Show tax amount column', checked: false },
                            { label: 'Also acts as goods receipt', checked: false },
                            { label: 'Footers', checked: false },
                        ].map((cb, idx) => (
                            <div key={idx} className="flex items-center space-x-3">
                                <input type="checkbox" defaultChecked={cb.checked} className="w-4 h-4 border-[#cfd8dc] rounded" />
                                <span className="text-[13px] text-[#455a64]">{cb.label}</span>
                            </div>
                        ))}
                    </div>

                    <div className="border border-[#cfd8dc] rounded-[4px] p-6 mb-12">
                        <span className="block text-[12px] text-[#90a4ae] uppercase mb-4">Image</span>
                        <div className="flex flex-col space-y-4">
                            <div className="flex items-center space-x-4">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                <button
                                    onClick={triggerFileSelect}
                                    className="border border-[#cfd8dc] bg-white px-5 py-2.5 rounded-[4px] text-[14px] text-[#455a64] hover:bg-[#f5f5f5] transition shadow-sm"
                                >
                                    Choose File
                                </button>
                                <span className="text-[14px] text-[#90a4ae]">{fileName}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-16 pt-10 border-t border-[#f0f0f0] flex items-center space-x-4">
                        <div className="flex items-center space-x-4">
                            <button
                                disabled
                                className="bg-blue-600 opacity-50 text-white px-6 py-2 rounded-[4px] text-[14px] font-medium cursor-not-allowed shadow-md"
                            >
                                Create
                            </button>
                            <span className="text-[14px] text-[#455a64]">Administrator has disabled "Create" button</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewDebitNoteView;
