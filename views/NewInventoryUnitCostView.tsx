import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, X, ArrowLeft, Package, Calendar, DollarSign, ShieldAlert, Database } from 'lucide-react';
import apiService from '../services/apiService';
import { InventoryUnitCost, InventoryItem } from '../types';

const NewInventoryUnitCostView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [formData, setFormData] = useState<Partial<InventoryUnitCost>>({
    date: new Date().toISOString().split('T')[0],
    itemId: '',
    itemName: '',
    unitCost: 0,
    minSellingPrice: 0,
    division: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [itemsList, costList] = await Promise.all([
          apiService.getItems(),
          apiService.getInventoryUnitCosts()
        ]);
        setItems(itemsList);
        
        if (isEdit && id) {
          const existingCost = costList.find((c: any) => c.id === id);
          if (existingCost) {
            setFormData(existingCost);
          }
        }
      } catch (err) {
        console.error('Failed to fetch unit cost data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: ['unitCost', 'minSellingPrice'].includes(name) ? Number(value) : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.itemId || !formData.date || formData.unitCost === undefined || !formData.division) {
      alert('Please fill all required fields (Item, Date, Unit Cost, and Division).');
      return;
    }

    setIsLoading(true);
    try {
      if (isEdit && id) {
        await apiService.updateInventoryUnitCost(id, formData);
      } else {
        await apiService.createInventoryUnitCost({
          date: formData.date!,
          itemId: formData.itemId!,
          itemName: formData.itemName!,
          unitCost: formData.unitCost!,
          minSellingPrice: formData.minSellingPrice || 0,
          division: formData.division!
        });
      }
      navigate('/settings/inventory-unit-costs');
    } catch (err) {
      console.error('Failed to save unit cost record:', err);
      alert('Failed to save unit cost record to database');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-4 font-sans">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{isEdit ? 'Updating record...' : 'Creating record...'}</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-gray-100 pb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/settings/inventory-unit-costs')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-500" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">
              <ShieldAlert size={12} />
              <span>Admin Restricted Area</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Edit Unit Cost Record' : 'New Unit Cost Record'}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/settings/inventory-unit-costs')}
            className="px-6 py-2 bg-gray-50 text-[11px] font-black text-gray-500 rounded-md hover:bg-gray-100 transition-all border border-gray-200 uppercase tracking-widest flex items-center gap-2"
          >
            <X size={14} /> Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-8 py-2 bg-blue-600 text-[11px] font-black text-white rounded-md hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2 uppercase tracking-widest"
          >
            <Save size={14} /> {isEdit ? 'Save Changes' : 'Create Record'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-8">
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <Package size={12} />
                Inventory Item
              </label>
              <select
                name="itemId"
                value={formData.itemId}
                onChange={(e) => {
                  const item = items.find(i => i.id === e.target.value);
                  setFormData(prev => ({ 
                    ...prev, 
                    itemId: e.target.value,
                    itemName: item ? `${item.itemCode} - ${item.itemName}` : ''
                  }));
                }}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                required
              >
                <option value="">Select Item...</option>
                {items.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.itemCode} - {item.itemName}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <Calendar size={12} />
                  Record Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-[11px] uppercase tracking-tighter"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <DollarSign size={12} />
                  Unit Cost (ZMW)
                </label>
                <input
                  type="number"
                  step="0.001"
                  name="unitCost"
                  value={formData.unitCost}
                  onChange={handleChange}
                  placeholder="0.000"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-black text-blue-600"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <DollarSign size={12} />
                  Min. Selling Price (ZMW)
                </label>
                <input
                  type="number"
                  step="0.001"
                  name="minSellingPrice"
                  value={formData.minSellingPrice}
                  onChange={handleChange}
                  placeholder="0.000"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-black text-emerald-600"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <Database size={12} />
                  Division / Location
                </label>
                <select
                  name="division"
                  value={formData.division}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                  required
                >
                  <option value="">Select Division...</option>
                  <option value="WAREHOUSE">WAREHOUSE</option>
                  <option value="KITWE">KITWE</option>
                  <option value="NDOLA">NDOLA</option>
                  <option value="LUSAKA">LUSAKA</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-4">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-600 h-fit">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900 uppercase tracking-tight">Administrative Control</h3>
              <p className="text-xs text-amber-700 leading-relaxed mt-1">
                This record directly influences inventory valuation and COGS calculations. Changes are logged and should only be performed by authorized administrators.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default NewInventoryUnitCostView;
