import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Save, 
  X, 
  ArrowLeft, 
  Package, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import { useERPStore } from '../store/useERPStore';

const NewInventoryLocationView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const { inventoryLocations, fetchInventoryLocations, createInventoryLocation, updateInventoryLocation, deleteInventoryLocation } = useERPStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<{name: string; description: string; inactive: boolean}>({
    name: '',
    description: '',
    inactive: false
  });

  useEffect(() => {
    fetchInventoryLocations();
  }, []);

  useEffect(() => {
    if (isEdit) {
      const loc = inventoryLocations.find((l: any) => l.id === id);
      if (loc) {
        setFormData({
          name: loc.name || '',
          description: loc.description || '',
          inactive: loc.inactive || false,
        });
      }
    }
  }, [inventoryLocations, id, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isEdit) {
        await updateInventoryLocation(id!, formData);
        alert('Location updated successfully!');
      } else {
        await createInventoryLocation(formData);
        alert('Location created successfully!');
      }
      navigate('/settings/inventory-locations');
    } catch (err) {
      console.error('Save location failed:', err);
      alert('Failed to save location. The name may already exist.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this location? This action cannot be undone.')) {
      try {
        await deleteInventoryLocation(id!);
        navigate('/settings/inventory-locations');
      } catch (err) {
        alert('Failed to delete location.');
      }
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between border-b border-gray-100 pb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/settings/inventory-locations')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
          >
            <ArrowLeft size={20} className="text-gray-500 group-hover:text-indigo-600 transition-colors" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">
              <Package size={12} />
              <span>Inventory Settings</span>
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              {isEdit ? `Edit Location: ${formData.name}` : 'New Inventory Location'}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/settings/inventory-locations')}
            className="px-6 py-2 bg-gray-50 text-[11px] font-black text-gray-500 rounded-xl hover:bg-gray-100 transition-all border border-gray-200 uppercase tracking-widest flex items-center gap-2"
          >
            <X size={14} /> Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-8 py-2 bg-indigo-600 text-[11px] font-black text-white rounded-xl hover:bg-slate-900 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2 uppercase tracking-widest disabled:opacity-50"
          >
            <Save size={14} /> {isSubmitting ? 'Saving...' : (isEdit ? 'Update Location' : 'Create Location')}
          </button>
        </div>
      </div>

      <div className="max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8">
            <div className="space-y-6">
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-300">Basic Information</h2>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Location Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Main Warehouse, Branch A"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Additional details about this storage location..."
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium"
                />
              </div>

              <div className="pt-4 flex items-center gap-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="inactive"
                    checked={formData.inactive}
                    onChange={handleChange}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
                <div>
                  <p className="text-sm font-bold text-gray-900">Inactive</p>
                  <p className="text-xs text-gray-400 font-medium">Prevent this location from being used in new transactions</p>
                </div>
              </div>
            </div>

            {isEdit && (
              <div className="pt-8 border-t border-gray-50">
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                    <AlertCircle size={20} />
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-rose-900">Danger Zone</p>
                      <p className="text-xs text-rose-700">Deleting a location will remove it from the system.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-4 py-2 bg-white border border-rose-200 text-rose-600 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewInventoryLocationView;
