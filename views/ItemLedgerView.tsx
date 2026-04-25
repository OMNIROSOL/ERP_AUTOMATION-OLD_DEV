import React, { useMemo, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronRight, Package, Search, ArrowLeft, History } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';

const ItemLedgerView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const { 
      items, fetchItems, 
      deliveryNotes, fetchDeliveryNotes, 
      inventoryWriteOffs, fetchInventoryWriteOffs 
    } = useERPStore();

    useEffect(() => {
        fetchItems();
        fetchDeliveryNotes();
        fetchInventoryWriteOffs();
    }, []);

    const item = useMemo(() => items.find((i: any) => i.id === id), [items, id]);

    const transactions = useMemo(() => {
        if (!item) return [];
        
        let allTx: any[] = [];

        // Delivery Notes (Outwards)
        deliveryNotes.forEach((dn: any) => {
            dn.items?.forEach((dnItem: any) => {
                if (dnItem.item === item.itemName || dnItem.itemId === item.id) {
                    allTx.push({
                        id: dn.id,
                        date: dn.deliveryDate || dn.date || new Date().toISOString().split('T')[0],
                        type: 'Delivery Note',
                        reference: dn.reference,
                        party: dn.customer || 'Unknown',
                        qtyChange: -(parseFloat(dnItem.qty) || 0)
                    });
                }
            });
        });

        // Inventory Write-offs (Outwards)
        inventoryWriteOffs.forEach((wo: any) => {
            if (wo.inventoryItem === item.itemName || wo.itemId === item.id) {
                allTx.push({
                    id: wo.id,
                    date: wo.date || new Date().toISOString().split('T')[0],
                    type: 'Inventory Write-off',
                    reference: wo.reference,
                    party: 'Internal',
                    qtyChange: -(parseFloat(wo.qty) || 0)
                });
            }
        });

        // Sort chronologically
        allTx.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Calculate running balance
        let balance = 0;
        return allTx.map(t => {
            balance += t.qtyChange;
            return { ...t, balance };
        });

    }, [item, deliveryNotes, inventoryWriteOffs]);

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t =>
            t.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.party?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [transactions, searchQuery]);

    if (!item) {
        return (
            <div className="p-8 text-center mt-20">
                <div className="text-rose-500 font-bold mb-4">Item not found.</div>
                <button onClick={() => navigate('/inventory-items')} className="text-blue-600 font-bold hover:underline">
                    Back to Inventory Items
                </button>
            </div>
        );
    }

    return (
        <div className="p-8 bg-slate-50 min-h-screen space-y-8 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-6">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/inventory-items')}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                    >
                        <ArrowLeft size={20} className="text-slate-500" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                            <History size={12} />
                            <Link to="/inventory-items" className="hover:text-blue-600 transition-colors">Inventory</Link>
                            <ChevronRight size={10} className="opacity-30" />
                            <span className="text-blue-600">{item.itemCode}</span>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">{item.itemName} - Ledger</h1>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                    <div className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                        Total Transactions: {filteredTransactions.length}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                                <th className="px-6 py-4 whitespace-nowrap">Date</th>
                                <th className="px-6 py-4 whitespace-nowrap">Type</th>
                                <th className="px-6 py-4 whitespace-nowrap">Reference</th>
                                <th className="px-6 py-4 whitespace-nowrap">Party / Account</th>
                                <th className="px-6 py-4 text-right whitespace-nowrap">Qty Change</th>
                                <th className="px-6 py-4 text-right whitespace-nowrap">Running Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredTransactions.length > 0 ? (
                                filteredTransactions.map((t, idx) => (
                                    <tr key={`${t.id}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-slate-600">{t.date}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{t.type}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-blue-600">{t.reference}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{t.party}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`text-sm font-black ${t.qtyChange > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {t.qtyChange > 0 ? '+' : ''}{t.qtyChange}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-black text-slate-900">
                                            {t.balance}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                                        No transactions found for this item.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ItemLedgerView;
