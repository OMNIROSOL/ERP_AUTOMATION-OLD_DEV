import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, ArrowLeft, Settings, Database, CheckCircle, XCircle } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';

const ItemCategoriesView = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const { itemCategories, fetchItemCategories } = useERPStore();

  useEffect(() => {
    fetchItemCategories();
  }, []);

  const filteredCategories = itemCategories.filter((cat: any) => 
    (cat.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cat.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-slate-200 pb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/settings')}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-500" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">
              <Settings size={12} />
              <span>Settings</span>
              <span className="text-slate-300">/</span>
              <span>Master Data</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Inventory Item Categories</h1>
          </div>
        </div>
        <button
          onClick={() => navigate('/settings/item-categories/new')}
          className="px-6 py-2.5 bg-indigo-600 text-[11px] font-black text-white rounded-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 uppercase tracking-widest"
        >
          <Plus size={14} /> New Category
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-20">Edit</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredCategories.length > 0 ? (
                filteredCategories.map((category: any) => (
                  <tr key={category.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => navigate(`/settings/item-categories/edit/${category.id}`)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg border border-transparent hover:border-indigo-100 transition-all shadow-sm flex items-center gap-1 text-[10px] font-bold uppercase"
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                        <Database size={14} className="text-slate-400" />
                        {category.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-500">
                        {category.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {category.inactive ? (
                        <div className="flex items-center gap-1 text-xs font-bold text-rose-500 bg-rose-50 w-fit px-2 py-1 rounded-md">
                          <XCircle size={12} /> Inactive
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-50 w-fit px-2 py-1 rounded-md">
                          <CheckCircle size={12} /> Active
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                    No item categories found.
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

export default ItemCategoriesView;
