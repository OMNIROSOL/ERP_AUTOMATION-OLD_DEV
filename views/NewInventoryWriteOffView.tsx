import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, X, FileX, ArrowLeft, Trash2 } from 'lucide-react';
import { mockInventoryWriteOffs, mockInventoryItems, getAccounts, getInventoryLocations } from '../mockData';
import { InventoryWriteOff, Division } from '../types';
import apiService from '../services/apiService';

const NewInventoryWriteOffView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const existingWriteOff = isEdit ? mockInventoryWriteOffs.find(wo => wo.id === id) : null;

  const [formData, setFormData] = useState<Partial<InventoryWriteOff>>(existingWriteOff || {
    date: new Date().toISOString().split('T')[0],
    reference: `WO-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
    inventoryItem: '',
    qty: 0,
    amount: 0,
    account: '',
    description: '',
    status: 'Approved'
  });

  const [availableDivisions, setAvailableDivisions] = useState<Division[]>([]);

  React.useEffect(() => {
    apiService.getDivisions().then(setAvailableDivisions).catch(err => console.error('Failed to fetch divisions:', err));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedItemName = e.target.value;
    const item = mockInventoryItems.find(mi => `${mi.itemCode} - ${mi.itemName}` === selectedItemName);
    setFormData(prev => ({
      ...prev,
      inventoryItem: selectedItemName,
      amount: (prev.qty || 0) * (item?.avgCost || 0)
    }));
  };

  const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const qty = Number(e.target.value);
    const item = mockInventoryItems.find(mi => `${mi.itemCode} - ${mi.itemName}` === formData.inventoryItem);
    setFormData(prev => ({
      ...prev,
      qty,
      amount: qty * (item?.avgCost || 0)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Saving inventory write-off:', formData);
    navigate('/inventory-write-offs');
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-gray-100 pb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/inventory-write-offs')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-500" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-rose-500 mb-1">
              <FileX size={12} />
              <span>Inventory Write-off</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? `Edit Write-off: ${formData.reference}` : 'New Inventory Write-off'}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/inventory-write-offs')}
            className="px-6 py-2 bg-gray-50 text-[11px] font-black text-gray-500 rounded-md hover:bg-gray-100 transition-all border border-gray-200 uppercase tracking-widest flex items-center gap-2"
          >
            <X size={14} /> Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-8 py-2 bg-blue-600 text-[11px] font-black text-white rounded-md hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2 uppercase tracking-widest"
          >
            <Save size={14} /> {isEdit ? 'Update Write-off' : 'Post Write-off'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-8">
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Date</label>
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
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Reference</label>
              <input
                type="text"
                name="reference"
                value={formData.reference}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                required
              />
            </div>
          </div>

          <div className="space-y-6 pt-4 border-t border-gray-50">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-gray-300">Adjustment Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
              <div className="md:col-span-8 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Inventory Item</label>
                <select
                  name="inventoryItem"
                  value={formData.inventoryItem}
                  onChange={handleItemSelect}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                  required
                >
                  <option value="">Select Item to Write-off</option>
                  {mockInventoryItems.map(mi => (
                    <option key={mi.id} value={`${mi.itemCode} - ${mi.itemName}`}>
                      {mi.itemCode} - {mi.itemName} (Available: {mi.qtyOnHand})
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-4 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Quantity</label>
                <input
                  type="number"
                  name="qty"
                  value={formData.qty}
                  onChange={handleQtyChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 font-bold">Division</label>
                <select
                  name="division"
                  value={formData.division}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                >
                  <option value="">Select Division...</option>
                  <option value="General">General</option>
                  {availableDivisions.map(div => (
                    <option key={div.id} value={div.name}>{div.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 font-bold">Expense Account</label>
                <select
                  name="account"
                  value={formData.account}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                  required
                >
                  <option value="">Select Expense Account</option>
                  {getAccounts().filter(a => a.type === 'Expense').map(acc => (
                    <option key={acc.id} value={acc.name}>{acc.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 font-bold">Allocation</label>
                <select
                  name="allocation"
                  value={formData.allocation}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                >
                  <option value="">Select Allocation...</option>
                  <option value="Head Office">Head Office</option>
                  <option value="Branch A">Branch A</option>
                  <option value="Branch B">Branch B</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 font-bold">Tax Code</label>
                <select
                  name="taxCode"
                  value={formData.taxCode}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                >
                  <option value="">Select Tax Code...</option>
                  <option value="EXEMPT">EXEMPT - 0%</option>
                  <option value="SR-16">Standard Rate - 16%</option>
                  <option value="ZR-0">Zero Rated - 0%</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-rose-600 font-bold">Write-off Amount (ZMW)</label>
                <div className="w-full px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 font-black flex items-center justify-between">
                  <span>ZMW</span>
                  <span>{(Number(formData.amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 font-bold">Reason / Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Why is this item being written off?"
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
              />
            </div>
          </div>
        </div>


        {isEdit && (
          <div className="flex justify-end pt-4">
            <button
              type="button"
              className="flex items-center gap-2 text-rose-500 font-bold text-[11px] uppercase tracking-widest hover:text-rose-600 transition-colors"
            >
              <Trash2 size={16} /> Void Write-off
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default NewInventoryWriteOffView;
