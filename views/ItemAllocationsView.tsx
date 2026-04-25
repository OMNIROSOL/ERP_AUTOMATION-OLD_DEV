import React, { useMemo, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronRight, Package, Search, ArrowLeft, MapPin } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';

const ItemAllocationsView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const { items, fetchItems, inventoryLocations, fetchInventoryLocations } = useERPStore();

    useEffect(() => {
        fetchItems();
        fetchInventoryLocations();
    }, []);

    const item = useMemo(() => items.find((i: any) => i.id === id), [items, id]);

    // For demonstration purposes, we will distribute the "Qty on Hand" evenly across locations.
    // In a full production system, this would query a Stock Ledger filtered by locationId.
    const allocations = useMemo(() => {
        if (!item || inventoryLocations.length === 0) return [];
        
        // Mock distribution
        const totalQty = parseFloat(item.qtyOnHand) || 100; // Fallback if no qty on hand
        const perLocation = Math.floor(totalQty / inventoryLocations.length);
        const remainder = totalQty % inventoryLocations.length;

        return inventoryLocations.map((loc: any, idx: number) => ({
            id: String(loc.id),
            location: loc.name,
            qty: perLocation + (idx === 0 ? remainder : 0) // give remainder to first loc
        }));
    }, [item, inventoryLocations]);

    const filteredAllocations = useMemo(() => {
        return allocations.filter(a =>
            a.location?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [allocations, searchQuery]);

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
                            <MapPin size={12} />
                            <Link to="/inventory-items" className="hover:text-emerald-600 transition-colors">Inventory</Link>
                            <ChevronRight size={10} className="opacity-30" />
                            <span className="text-emerald-600">{item.itemCode}</span>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">{item.itemName} - Allocations</h1>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden max-w-4xl">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search locations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                                <th className="px-6 py-4 whitespace-nowrap">Division / Location</th>
                                <th className="px-6 py-4 text-right whitespace-nowrap">Quantity Allocated</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredAllocations.length > 0 ? (
                                filteredAllocations.map((a, idx) => (
                                    <tr key={`${a.id}-${idx}`} className="hover:bg-emerald-50/30 transition-colors">
                                        <td className="px-6 py-4 text-sm font-bold text-slate-700">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                    <MapPin size={14} />
                                                </div>
                                                {a.location}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-black text-slate-900">
                                            {a.qty}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={2} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                                        No allocations found.
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

export default ItemAllocationsView;
