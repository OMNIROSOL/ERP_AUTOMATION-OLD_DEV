import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, X, ArrowLeft, ShieldAlert, Database, Trash2 } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';

const NewItemCategoryView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  
  const { 
    itemCategories, fetchItemCategories, 
    createItemCategory, updateItemCategory, deleteItemCategory 
  } = useERPStore();

  useEffect(() => {
    fetchItemCategories();
  }, []);

  const existingCategory = isEdit ? itemCategories.find((c: any) => c.id === id) : null;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    if (existingCategory) {
      setFormData({
        name: existingCategory.name || '',
        description: existingCategory.description || '',
      });
    }
  }, [existingCategory]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      alert('Please provide a category name.');
      return;
    }

    try {
      if (isEdit && id) {
        await updateItemCategory(id, formData);
      } else {
        await createItemCategory(formData);
      }
      navigate('/settings/item-categories');
    } catch (err) {
      alert('Failed to save item category. Ensure the name is unique.');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        if (id) await deleteItemCategory(id);
        navigate('/settings/item-categories');
      } catch (err) {
        alert('Failed to delete category.');
      }
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-200 pb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/settings/item-categories')}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-500" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">
              <ShieldAlert size={12} />
              <span>Admin Restricted Area</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isEdit ? 'Edit Item Category' : 'New Item Category'}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isEdit && (
             <button
             onClick={handleDelete}
             className="px-6 py-2 bg-rose-50 text-[11px] font-black text-rose-600 rounded-md hover:bg-rose-100 transition-all border border-rose-200 uppercase tracking-widest flex items-center gap-2"
           >
             <Trash2 size={14} /> Delete
           </button>
          )}
          <button
            onClick={() => navigate('/settings/item-categories')}
            className="px-6 py-2 bg-slate-50 text-[11px] font-black text-slate-500 rounded-md hover:bg-slate-100 transition-all border border-slate-200 uppercase tracking-widest flex items-center gap-2"
          >
            <X size={14} /> Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-8 py-2 bg-indigo-600 text-[11px] font-black text-white rounded-md hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 uppercase tracking-widest"
          >
            <Save size={14} /> {isEdit ? 'Save Changes' : 'Create Category'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
            <Database size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Category Details</h2>
            <p className="text-sm text-slate-500">Enter the name and description of the inventory category</p>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">
                Category Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Raw Materials, Electronics"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-slate-900"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Optional detailed description..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-slate-900 resize-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewItemCategoryView;
