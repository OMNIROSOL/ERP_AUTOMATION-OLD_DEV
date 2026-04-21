import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Save, X, GripVertical, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

const EditPurchaseInvoiceColumnsView = () => {
    const navigate = useNavigate();
    const [columns, setColumns] = useState([
        { id: 'Actions', label: 'Actions', visible: true, locked: true },
        { id: 'Issue date', label: 'Issue Date', visible: true, locked: false },
        { id: 'Reference', label: 'Reference', visible: true, locked: false },
        { id: 'Supplier', label: 'Supplier', visible: true, locked: false },
        { id: 'Amount', label: 'Amount', visible: true, locked: false },
        { id: 'Balance due', label: 'Balance Due', visible: true, locked: false },
        { id: 'Status', label: 'Status', visible: true, locked: false }
    ]);

    useEffect(() => {
        const saved = localStorage.getItem('purchase_invoice_column_visibility');
        if (saved) {
            const visibility = JSON.parse(saved);
            setColumns(prev => prev.map(col => ({
                ...col,
                visible: col.locked ? true : (visibility[col.id] !== false)
            })));
        }
    }, []);

    const handleSave = () => {
        const visibility = columns.reduce((acc, col) => ({
            ...acc,
            [col.id]: col.visible
        }), {});
        localStorage.setItem('purchase_invoice_column_visibility', JSON.stringify(visibility));
        window.dispatchEvent(new Event('storage'));
        navigate('/purchase-invoices');
    };

    const toggleVisibility = (id: string) => {
        setColumns(prev => prev.map(col => 
            (col.id === id && !col.locked) ? { ...col, visible: !col.visible } : col
        ));
    };

    return (
        <div className="p-10 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-center">
                <div>
                    <div className="flex items-center space-x-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">
                        <span className="cursor-pointer hover:underline" onClick={() => navigate('/purchase-invoices')}>Purchase Invoices</span>
                        <ChevronRight size={10} className="opacity-50" />
                        <span className="text-slate-400 font-bold">Column Configuration</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Configure Columns</h1>
                    <p className="text-slate-500 text-sm mt-1">Select which columns appear in your purchase invoice list.</p>
                </div>
                <button 
                    onClick={() => navigate('/purchase-invoices')}
                    className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm text-slate-400 hover:text-slate-600"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden">
                <div className="p-8 space-y-4">
                    {columns.map((column, index) => (
                        <motion.div 
                            key={column.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`flex items-center p-5 rounded-3xl border transition-all ${
                                column.visible 
                                    ? 'bg-white border-slate-200 shadow-sm' 
                                    : 'bg-slate-50/50 border-transparent opacity-60'
                            }`}
                        >
                            <div className="mr-6 text-slate-300">
                                <GripVertical size={20} />
                            </div>
                            
                            <div className="flex-1">
                                <h3 className={`text-sm font-bold uppercase tracking-wider ${column.visible ? 'text-slate-800' : 'text-slate-400'}`}>
                                    {column.label}
                                </h3>
                                {column.locked && (
                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1 block">Required Column</span>
                                )}
                            </div>

                            <button
                                onClick={() => toggleVisibility(column.id)}
                                disabled={column.locked}
                                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                                    column.locked
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        : column.visible
                                            ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                                            : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                                }`}
                            >
                                {column.visible ? (
                                    <><Eye size={14} /> Visible</>
                                ) : (
                                    <><EyeOff size={14} /> Hidden</>
                                )}
                            </button>
                        </motion.div>
                    ))}
                </div>

                <div className="bg-slate-50/50 p-8 flex justify-end gap-4 border-t border-slate-100">
                    <button 
                        onClick={() => navigate('/purchase-invoices')}
                        className="px-8 py-4 rounded-2xl text-[12px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        className="flex items-center gap-3 px-10 py-4 bg-indigo-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-95"
                    >
                        <Save size={18} />
                        Save Configuration
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditPurchaseInvoiceColumnsView;
