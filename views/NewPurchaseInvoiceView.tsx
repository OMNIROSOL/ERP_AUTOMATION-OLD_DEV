import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { mockSalesQuotes } from '../mockData';

const NewPurchaseInvoiceView = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dateInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [issueDate, setIssueDate] = useState('2026-02-20');
    const [dueDateType, setDueDateType] = useState('Net');
    const [dueDateDays, setDueDateDays] = useState('0');
    const [supplier, setSupplier] = useState('');
    const [description, setDescription] = useState('');
    const [reference, setReference] = useState('');
    const [useManualRef, setUseManualRef] = useState(false);
    const [fileName, setFileName] = useState('No file chosen');
    const [items, setItems] = useState([{ id: Date.now(), item: '', account: 'Inventory on hand', qty: '1', unitPrice: '0', taxCode: 'No tax' }]);

    const [options, setOptions] = useState({
        lineNumber: false,
        description: false,
        discount: false,
        freightIn: false,
        taxInclusive: false,
        hideBalanceDue: false,
        showTaxAmount: false,
        alsoActsAsGoodsReceipt: false,
        footers: false
    });

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const copyFromId = searchParams.get('copyFrom');

        if (copyFromId) {
            const quote = mockSalesQuotes.find(q => q.id === copyFromId);
            if (quote) {
                let dateVal = quote.issueDate;
                if (dateVal && dateVal.includes('.')) {
                    const parts = dateVal.split('.');
                    if (parts.length === 3) dateVal = `${parts[2]}-${parts[1]}-${parts[0]}`;
                }
                setIssueDate(dateVal || '2026-02-20');
                setDescription(quote.description || '');
                setItems([{ id: Date.now(), item: 'MI0084 - 315/80 R22.5 UNIVERSAL', account: 'Inventory on hand', qty: '2', unitPrice: '0', taxCode: 'VAT 16%' }]);
            }
        }
    }, [location.search]);

    const updateItem = (itemId: number, field: string, value: string) => {
        setItems(items.map(item => item.id === itemId ? { ...item, [field]: value } : item));
    };

    const addLine = () => setItems([...items, { id: Date.now(), item: '', account: 'Inventory on hand', qty: '1', unitPrice: '0', taxCode: 'No tax' }]);
    const copyLine = (itemId: number) => {
        const item = items.find(i => i.id === itemId);
        if (item) setItems([...items, { ...item, id: Date.now() }]);
    };
    const deleteLine = (itemId: number) => items.length > 1 && setItems(items.filter(item => item.id !== itemId));

    const toggleOption = (key: keyof typeof options) => {
        setOptions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setFileName(file.name);
        else setFileName('No file chosen');
    };

    const triggerFileSelect = () => fileInputRef.current?.click();

    const handleSave = () => {
        navigate('/sales-quotes');
    };

    return (
        <div className="bg-[#f9fafb] min-h-full pb-20">
            <div className="bg-white px-4 py-2 border-b border-gray-200 flex items-center text-[12px] text-[#78909c] space-x-1.5 select-none">
                <i className="fas fa-folder-open text-[#90a4ae]"></i>
                <i className="fas fa-caret-right text-[#cfd8dc] scale-75"></i>
                <Link to="/sales-quotes" className="hover:text-[#2196f3]">Sales Quotes</Link>
                <i className="fas fa-caret-right text-[#cfd8dc] scale-75"></i>
                <Link to="#" className="hover:text-[#2196f3]">View</Link>
                <i className="fas fa-caret-right text-[#cfd8dc] scale-75"></i>
                <span>Edit</span>
            </div>

            <div className="p-6">
                <div className="bg-white border border-[#cfd8dc] shadow-sm rounded-sm max-w-[1400px] mx-auto p-10">
                    <div className="flex items-center space-x-2 mb-8 select-none">
                        <h2 className="text-[#cfd8dc] text-[18px] font-medium">Purchase Invoice</h2>
                        <i className="far fa-question-circle text-[#cfd8dc] text-[14px] cursor-help"></i>
                    </div>

                    <div className="space-y-6 mb-8">
                        <div className="flex space-x-12">
                            <div className="w-48 space-y-1.5">
                                <label className="block text-[13px] font-medium text-[#455a64]">Issue date</label>
                                <div className="relative">
                                    <input
                                        ref={dateInputRef}
                                        type="date"
                                        value={issueDate}
                                        onChange={(e) => setIssueDate(e.target.value)}
                                        className="w-full border border-[#cfd8dc] px-2 py-1.5 text-[14px] text-[#263238] rounded-md focus:outline-none focus:border-[#2196f3] bg-white h-[36px]"
                                    />
                                </div>
                            </div>

                            <div className="w-64 space-y-1.5">
                                <label className="block text-[13px] font-medium text-[#455a64]">Due date</label>
                                <div className="flex items-center space-x-2">
                                    <div className="relative flex-1">
                                        <select
                                            value={dueDateType}
                                            onChange={(e) => setDueDateType(e.target.value)}
                                            className="w-full border border-[#cfd8dc] px-3 py-1.5 text-[14px] text-[#263238] rounded-md appearance-none focus:outline-none focus:border-[#2196f3] bg-white h-[36px]"
                                        >
                                            <option value="Net">Net</option>
                                            <option value="On receipt">On receipt</option>
                                        </select>
                                        <i className="fas fa-caret-down absolute right-3 top-1/2 -translate-y-1/2 text-[#90a4ae] text-[10px] pointer-events-none"></i>
                                    </div>
                                    <input
                                        type="number"
                                        value={dueDateDays}
                                        onChange={(e) => setDueDateDays(e.target.value)}
                                        className="w-20 border border-[#cfd8dc] px-2 py-1.5 text-[14px] text-[#263238] rounded-md focus:outline-none focus:border-[#2196f3] text-center h-[36px]"
                                    />
                                    <span className="text-[13px] text-[#90a4ae]">days</span>
                                </div>
                            </div>

                            <div className="w-48 space-y-1.5">
                                <label className="block text-[13px] font-medium text-[#455a64]">Reference</label>
                                <div className="flex items-center">
                                    <div className="border border-[#cfd8dc] border-r-0 bg-white px-2 py-1.5 rounded-l-md h-[36px] flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={useManualRef}
                                            onChange={() => setUseManualRef(!useManualRef)}
                                            className="w-4 h-4 rounded border-[#cfd8dc] text-[#2196f3] focus:ring-0"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        value={useManualRef ? reference : ''}
                                        placeholder={useManualRef ? "Optional" : "Automatic"}
                                        disabled={!useManualRef}
                                        onChange={(e) => setReference(e.target.value)}
                                        className={`flex-1 border border-[#cfd8dc] px-3 py-1.5 text-[14px] text-[#263238] rounded-r-md focus:outline-none focus:border-[#2196f3] h-[36px] ${!useManualRef ? 'bg-[#f5f5f5] cursor-not-allowed text-[#90a4ae]' : ''}`}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-[13px] font-medium text-[#455a64]">Supplier</label>
                            <div className="relative w-48">
                                <select
                                    value={supplier}
                                    onChange={(e) => setSupplier(e.target.value)}
                                    className="w-full border border-[#cfd8dc] px-3 py-1.5 text-[14px] text-[#263238] rounded-md appearance-none focus:outline-none focus:border-[#2196f3] bg-white h-[36px]"
                                >
                                    <option value=""></option>
                                </select>
                                <i className="fas fa-caret-down absolute right-3 top-1/2 -translate-y-1/2 text-[#90a4ae] text-[10px] pointer-events-none"></i>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-[13px] font-medium text-[#455a64]">Description</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full border border-[#cfd8dc] px-3 py-1.5 text-[14px] text-[#263238] rounded-md focus:outline-none focus:border-[#2196f3] bg-white h-[36px]"
                            />
                        </div>
                    </div>

                    <div className="mt-10 overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="text-[13px] text-[#455a64] font-medium">
                                    <th className="text-left pb-2 pr-4 font-medium">Item</th>
                                    <th className="text-left pb-2 pr-4 font-medium">Account</th>
                                    <th className="text-right pb-2 pr-4 font-medium w-24">Qty</th>
                                    <th className="text-right pb-2 pr-4 font-medium w-32">Unit price</th>
                                    <th className="text-right pb-2 pr-4 font-medium w-32">Total</th>
                                    <th className="text-left pb-2 pr-4 font-medium w-40">Tax Code</th>
                                    <th className="text-right pb-2 pr-4 font-medium w-24">Tax Amount</th>
                                    <th className="text-right pb-2 pr-4 font-medium w-32">Total</th>
                                    <th className="pb-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="border-t border-[#cfd8dc]">
                                {items.map((item, idx) => (
                                    <tr key={item.id} className="group">
                                        <td className="py-2 pr-4 align-top">
                                            <div className="relative">
                                                <select
                                                    value={item.item}
                                                    onChange={(e) => updateItem(item.id, 'item', e.target.value)}
                                                    className="w-full border border-[#cfd8dc] px-2 py-1.5 text-[13px] text-[#263238] rounded-md appearance-none focus:outline-none focus:border-[#2196f3] bg-white h-[34px]"
                                                >
                                                    <option value=""></option>
                                                    <option value="MI0084 - 315/80 R22.5 UNIVERSAL">MI0084 - 315/80 R22.5 UNIVERSAL</option>
                                                </select>
                                                <i className="fas fa-caret-down absolute right-2 top-1/2 -translate-y-1/2 text-[#90a4ae] text-[9px] pointer-events-none"></i>
                                            </div>
                                        </td>
                                        <td className="py-2 pr-4 align-top">
                                            <div className="relative">
                                                <select
                                                    value={item.account}
                                                    onChange={(e) => updateItem(item.id, 'account', e.target.value)}
                                                    className="w-full border border-[#cfd8dc] px-2 py-1.5 text-[13px] text-[#263238] rounded-md appearance-none focus:outline-none focus:border-[#2196f3] bg-white h-[34px]"
                                                >
                                                    <option value="Inventory on hand">Inventory on hand</option>
                                                </select>
                                                <i className="fas fa-caret-down absolute right-2 top-1/2 -translate-y-1/2 text-[#90a4ae] text-[9px] pointer-events-none"></i>
                                            </div>
                                        </td>
                                        <td className="py-2 pr-4 align-top">
                                            <div className="flex items-center">
                                                <input
                                                    type="text"
                                                    value={item.qty}
                                                    onChange={(e) => updateItem(item.id, 'qty', e.target.value)}
                                                    className="w-full border border-[#cfd8dc] px-2 py-1.5 text-[13px] text-[#263238] rounded-l-md focus:outline-none focus:border-[#2196f3] text-center h-[34px]"
                                                />
                                                <div className="bg-[#f5f5f5] border border-[#cfd8dc] border-l-0 px-2 py-1.5 text-[11px] text-[#90a4ae] rounded-r-md h-[34px] flex items-center">PCS</div>
                                            </div>
                                        </td>
                                        <td className="py-2 pr-4 align-top">
                                            <div className="flex items-center">
                                                <input
                                                    type="text"
                                                    value={item.unitPrice}
                                                    onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)}
                                                    className="w-full border border-[#cfd8dc] px-2 py-1.5 text-[13px] text-[#263238] rounded-l-md focus:outline-none focus:border-[#2196f3] text-right h-[34px]"
                                                />
                                                <div className="bg-[#f5f5f5] border border-[#cfd8dc] border-l-0 px-2 py-1.5 text-[11px] text-[#90a4ae] rounded-r-md h-[34px] flex items-center">ZMW</div>
                                            </div>
                                        </td>
                                        <td className="py-2 pr-4 align-top">
                                            <div className="flex items-center">
                                                <div className="flex-1 border border-[#cfd8dc] px-2 py-1.5 text-[13px] text-[#263238] rounded-l-md bg-[#f5f5f5] text-right h-[34px]">
                                                    {(parseFloat(item.qty) * parseFloat(item.unitPrice)).toFixed(2)}
                                                </div>
                                                <div className="bg-[#f5f5f5] border border-[#cfd8dc] border-l-0 px-2 py-1.5 text-[11px] text-[#90a4ae] rounded-r-md h-[34px] flex items-center">ZMW</div>
                                            </div>
                                        </td>
                                        <td className="py-2 pr-4 align-top">
                                            <div className="relative">
                                                <select
                                                    value={item.taxCode}
                                                    onChange={(e) => updateItem(item.id, 'taxCode', e.target.value)}
                                                    className="w-full border border-[#cfd8dc] px-2 py-1.5 text-[13px] text-[#263238] rounded-md appearance-none focus:outline-none focus:border-[#2196f3] bg-white h-[34px]"
                                                >
                                                    <option value="No tax">No tax</option>
                                                    <option value="VAT 16%">VAT (16%)</option>
                                                </select>
                                                <i className="fas fa-caret-down absolute right-2 top-1/2 -translate-y-1/2 text-[#90a4ae] text-[9px] pointer-events-none"></i>
                                            </div>
                                        </td>
                                        <td className="py-2 pr-4 align-top">
                                            <div className="w-full border border-[#cfd8dc] px-2 py-1.5 text-[13px] text-[#263238] rounded-md bg-[#f5f5f5] text-right h-[34px]">
                                                {(parseFloat(item.qty) * parseFloat(item.unitPrice) * 0.16).toFixed(2)}
                                            </div>
                                        </td>
                                        <td className="py-2 pr-4 align-top">
                                            <div className="flex items-center">
                                                <div className="flex-1 border border-[#cfd8dc] px-2 py-1.5 text-[13px] text-[#263238] rounded-l-md bg-[#f5f5f5] text-right h-[34px]">
                                                    {(parseFloat(item.qty) * parseFloat(item.unitPrice) * 1.16).toFixed(2)}
                                                </div>
                                                <div className="bg-[#f5f5f5] border border-[#cfd8dc] border-l-0 px-2 py-1.5 text-[11px] text-[#90a4ae] rounded-r-md h-[34px] flex items-center">ZMW</div>
                                            </div>
                                        </td>
                                        <td className="py-2 pl-2 align-top">
                                            <div className="flex items-center space-x-1">
                                                <button onClick={() => copyLine(item.id)} className="text-[#90a4ae] hover:text-[#2196f3] p-1"><i className="fas fa-copy text-[12px]"></i></button>
                                                <button onClick={() => deleteLine(item.id)} className="text-[#90a4ae] hover:text-red-500 p-1"><i className="fas fa-times text-[12px]"></i></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="mt-4">
                            <button
                                onClick={addLine}
                                className="bg-white border border-[#cfd8dc] px-4 py-1.5 rounded-md text-[13px] text-[#455a64] hover:bg-[#f5f5f5] transition flex items-center shadow-sm"
                            >
                                <i className="fas fa-caret-right mr-2 text-[10px] text-[#90a4ae]"></i>
                                Add line
                            </button>
                        </div>
                    </div>

                    <div className="mt-12 space-y-4 select-none">
                        {Object.entries(options).map(([key, value]) => (
                            <div key={key} className="space-y-2">
                                <label className="flex items-center space-x-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={value}
                                        onChange={() => toggleOption(key as keyof typeof options)}
                                        className="w-4 h-4 rounded border-[#cfd8dc] text-[#2196f3] focus:ring-0 cursor-pointer"
                                    />
                                    <span className="text-[14px] text-[#455a64] font-normal group-hover:text-[#2196f3] capitalize transition-colors">
                                        {key === 'lineNumber' ? 'Column — Line number' :
                                            key === 'description' ? 'Column — Description' :
                                                key === 'discount' ? 'Column — Discount' :
                                                    key === 'freightIn' ? 'Freight-in' :
                                                        key === 'taxInclusive' ? 'Amounts are tax inclusive' :
                                                            key === 'hideBalanceDue' ? 'Hide — Balance due' :
                                                                key === 'showTaxAmount' ? 'Show tax amount column' :
                                                                    key === 'alsoActsAsGoodsReceipt' ? 'Also acts as goods receipt' :
                                                                        key === 'footers' ? 'Footers' :
                                                                            key.replace(/([A-Z])/g, ' $1')}
                                    </span>
                                </label>
                            </div>
                        ))}
                    </div>

                    <div className="mt-16 border-t border-[#f0f0f0] pt-10">
                        <div className="relative inline-block border border-[#cfd8dc] rounded-sm p-8 min-w-[400px]">
                            <div className="absolute -top-3 left-4 bg-white px-2 text-[#90a4ae] text-[13px]">Image</div>
                            <div className="flex items-center space-x-4">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept="image/*"
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
                        <button
                            onClick={handleSave}
                            className="bg-[#263238] text-white px-10 py-3 rounded-[4px] text-[16px] font-bold hover:bg-black transition-colors shadow-md"
                        >
                            Create
                        </button>
                        <button
                            onClick={() => navigate('/sales-quotes')}
                            className="bg-white border border-[#cfd8dc] text-[#455a64] px-10 py-3 rounded-[4px] text-[16px] font-normal hover:bg-[#f9fafb] transition-colors shadow-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewPurchaseInvoiceView;
