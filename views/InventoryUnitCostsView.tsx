import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, Calendar, Package, DollarSign, ArrowLeft, Settings } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';
import { InventoryUnitCost } from '../types';

const InventoryUnitCostsView = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const { inventoryUnitCosts, fetchInventoryUnitCosts } = useERPStore();

  useEffect(() => {
    fetchInventoryUnitCosts();
  }, []);

  const filteredCosts = inventoryUnitCosts.filter((cost: any) => 
    (cost.itemName || '').toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toISOString().split('T')[0].split('-').reverse().join('.');
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-gray-100 pb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/settings')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-500" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">
              <Settings size={12} />
              <span>Settings</span>
              <span className="text-gray-300">/</span>
              <span>Inventory</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory Unit Costs</h1>
          </div>
        </div>
        <button
          onClick={() => navigate('/settings/inventory-unit-costs/new')}
          className="px-6 py-2.5 bg-blue-600 text-[11px] font-black text-white rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2 uppercase tracking-widest"
        >
          <Plus size={14} /> New Inventory Unit Cost
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-50 flex items-center gap-4 bg-gray-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search inventory items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-20">Edit</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Inventory Item</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Unit cost</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Min. Selling Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredCosts.length > 0 ? (
                filteredCosts.map((cost) => (
                  <tr key={cost.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => navigate(`/settings/inventory-unit-costs/edit/${cost.id}`)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg border border-transparent hover:border-blue-100 transition-all shadow-sm flex items-center gap-1 text-[10px] font-bold uppercase"
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                        <Calendar size={14} className="text-gray-400" />
                        {formatDate(cost.date)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-tight">
                        <Package size={14} className="text-gray-400" />
                        {cost.itemName}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 text-sm font-black text-gray-900">
                        <span className="text-[10px] text-gray-400">ZMW</span>
                        {cost.unitCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 text-sm font-black text-emerald-600">
                        <span className="text-[10px] text-gray-400">ZMW</span>
                        {(cost.minSellingPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic text-sm">
                    No unit cost records found.
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

export default InventoryUnitCostsView;
