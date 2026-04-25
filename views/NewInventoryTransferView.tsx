import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, X, ArrowRightLeft, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { mockInventoryTransfers } from '../mockData';
import { InventoryTransfer } from '../types';
import { useERPStore } from '../store/useERPStore';
import { useEffect } from 'react';

const NewInventoryTransferView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const existingTransfer = isEdit ? mockInventoryTransfers.find(t => t.id === id) : null;
  const { inventoryLocations, fetchInventoryLocations, items, fetchItems } = useERPStore();

  useEffect(() => {
    fetchInventoryLocations();
    fetchItems();
  }, []);

  const [formData, setFormData] = useState<Partial<InventoryTransfer>>(existingTransfer || {
    date: new Date().toISOString().split('T')[0],
    reference: `TR-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
    fromLocation: '',
    toLocation: '',
    description: '',
    status: 'Draft',
    items: [{ inventoryItem: '', qty: 0 }]
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...(formData.items || [])];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItemRows = (count: number) => {
    const newRows = Array(count).fill(null).map(() => ({ inventoryItem: '', qty: 0 }));
    setFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), ...newRows]
    }));
  };

  const removeItemRow = (index: number) => {
    const newItems = [...(formData.items || [])];
    newItems.splice(index, 1);
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Post/Saving inventory transfer:', formData);
    navigate('/inventory-transfers');
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 bg-slate-50/30 min-h-screen">
      <div className="flex items-center justify-between border-b border-gray-100 pb-6 bg-white -m-8 mb-8 p-8 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/inventory-transfers')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-500" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">
              <ArrowRightLeft size={12} />
              <span>Inventory Transfer</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {isEdit ? `Edit Transfer: ${formData.reference}` : 'New Inventory Transfer'}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select 
            className="px-4 py-2.5 bg-white text-[11px] font-black text-blue-600 rounded-xl hover:bg-gray-50 transition-all border border-blue-200 uppercase tracking-widest outline-none shadow-sm"
            onChange={(e) => alert(`Copying to ${e.target.value}...`)}
            defaultValue=""
          >
            <option value="" disabled>COPY TO...</option>
            <option value="Sales Quote">Sales Quote</option>
            <option value="Sales Order">Sales Order</option>
            <option value="Sales Invoice">Sales Invoice</option>
            <option value="Delivery Note">Delivery Note</option>
            <option value="Credit Note">Credit Note</option>
            <option value="Purchase Quote">Purchase Quote</option>
            <option value="Purchase Order">Purchase Order</option>
            <option value="Good Receipt">Good Receipt</option>
            <option value="Debit Note">Debit Note</option>
          </select>

          <button
            onClick={() => navigate('/inventory-transfers')}
            className="px-6 py-2.5 bg-white text-[11px] font-black text-gray-500 rounded-xl hover:bg-gray-50 transition-all border border-gray-200 uppercase tracking-widest flex items-center gap-2"
          >
            <X size={14} /> Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-8 py-2.5 bg-indigo-600 text-[11px] font-black text-white rounded-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-2 uppercase tracking-widest border border-indigo-500"
          >
            <Save size={14} /> {isEdit ? 'Update Transfer' : 'Post Transfer'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto space-y-8 pb-12">
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 font-bold">Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 font-bold">Reference</label>
              <input
                type="text"
                name="reference"
                value={formData.reference}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 font-bold">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-black text-blue-600 uppercase tracking-tighter"
              >
                <option value="Draft">Draft</option>
                <option value="Approved">Approved</option>
                <option value="Posted">Posted (Final)</option>
                <option value="Sent">Sent</option>
                <option value="Received">Received</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gray-50">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600 font-bold">Source Warehouse</label>
              <select
                name="fromLocation"
                value={formData.fromLocation}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-emerald-50/30 border border-emerald-100 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium"
                required
              >
                <option value="">Select Source...</option>
                {inventoryLocations.map(loc => (
                  <option key={loc.id} value={loc.name}>{loc.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-blue-600 font-bold">Destination Warehouse</label>
              <select
                name="toLocation"
                value={formData.toLocation}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-blue-50/30 border border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                required
              >
                <option value="">Select Destination...</option>
                {inventoryLocations.map(loc => (
                  <option key={loc.id} value={loc.name}>{loc.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 font-bold">Description / Purpose</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
            />
          </div>
        </div>

        {/* Multi-line Items Management */}
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-50 pb-4">
            <h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-blue-600">Transfer Items</h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase mr-2">Quick Add:</span>
              {[5, 10, 20].map(n => (
                <button 
                  key={n}
                  type="button"
                  onClick={() => addItemRows(n)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-md text-[10px] font-black text-slate-500 transition-all font-bold"
                >
                  +{n} LINES
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            {formData.items?.map((item, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-gray-50/50 p-4 rounded-xl border border-gray-100 hover:border-indigo-200 transition-all">
                <div className="md:col-span-1 text-[10px] font-black text-slate-300 pb-3 pl-2">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <div className="md:col-span-7 space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Inventory Item</label>
                  <select
                    value={item.inventoryItem}
                    onChange={(e) => handleItemChange(index, 'inventoryItem', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-sm font-medium"
                    required
                  >
                    <option value="">Select Item...</option>
                    {items.map(mi => (
                      <option key={mi.id} value={`${mi.itemCode} - ${mi.itemName}`}>
                        {mi.itemCode} - {mi.itemName} ({mi.qtyOnHand || 0} available)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-3 space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Quantity</label>
                  <input
                    type="number"
                    value={item.qty}
                    onChange={(e) => handleItemChange(index, 'qty', Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-sm font-black text-indigo-600"
                    required
                  />
                </div>
                <div className="md:col-span-1 flex justify-center pb-1">
                  <button
                    type="button"
                    onClick={() => removeItemRow(index)}
                    disabled={(formData.items?.length || 0) <= 1}
                    className="p-2.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-30"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => addItemRows(1)}
            className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 font-black text-[11px] uppercase tracking-widest hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Add Single Line Item
          </button>
        </div>
      </form>
    </div>
  );
};
export default NewInventoryTransferView;
