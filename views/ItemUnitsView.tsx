import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Package, ArrowLeft, Ruler, Search, Check, X, AlertCircle } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';

const ItemUnitsView = () => {
  const navigate = useNavigate();
  const { itemUnits, fetchItemUnits, createItemUnit, deleteItemUnit } = useERPStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchItemUnits();
  }, []);

  const filteredUnits = itemUnits.filter((unit: any) => {
    const q = searchQuery.toLowerCase();
    return unit.name.toLowerCase().includes(q) || unit.code.toLowerCase().includes(q);
  });

  const handleAdd = async () => {
    if (!newName.trim()) {
      setError('Unit name is required');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await createItemUnit({
        name: newName.trim(),
        code: newCode.trim() || newName.trim().toUpperCase().replace(/\s+/g, ''),
      });
      setNewName('');
      setNewCode('');
      setShowAddForm(false);
    } catch (err: any) {
      setError('Unit already exists or failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteItemUnit(id);
      setDeleteConfirm(null);
    } catch (err) {
      alert('Failed to delete unit');
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/settings')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-500" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">
              <Ruler size={12} />
              <span>Inventory Settings</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Item Units of Measure</h1>
            <p className="text-gray-400 text-sm mt-1">Manage measurement units for inventory items (SET, PCS, Each, Litres, etc.)</p>
          </div>
        </div>

        <button
          onClick={() => { setShowAddForm(true); setError(''); }}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-[11px] font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 uppercase tracking-widest"
        >
          <Plus size={14} /> Add Unit
        </button>
      </div>

      {/* Stats & Search */}
      <div className="flex items-center justify-between gap-6">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search units..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
          />
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Units</span>
          <span className="text-lg font-black text-gray-900">{itemUnits.length}</span>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white border border-indigo-100 rounded-2xl p-6 shadow-lg shadow-indigo-100/30 space-y-4 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
              <Plus size={16} />
            </div>
            <h3 className="text-[12px] font-black text-indigo-600 uppercase tracking-widest">New Unit of Measure</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit Name *</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => { setNewName(e.target.value); setError(''); }}
                placeholder="e.g. Set, Pieces, Litres"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Short Code</label>
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="e.g. SET, PCS, LTR (auto-generated if empty)"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all uppercase"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-rose-500 text-[11px] font-bold">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => { setShowAddForm(false); setNewName(''); setNewCode(''); setError(''); }}
              className="px-6 py-2.5 text-[11px] font-black text-slate-500 hover:bg-slate-50 rounded-xl transition-all uppercase tracking-widest"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={isSubmitting}
              className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl text-[11px] font-black hover:bg-indigo-700 transition-all shadow-md flex items-center gap-2 uppercase tracking-widest disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : (<><Check size={14} /> Save Unit</>)}
            </button>
          </div>
        </div>
      )}

      {/* Units Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-16">#</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit Name</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Code</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUnits.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center">
                  <Ruler size={40} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-sm font-bold text-slate-400">No units defined yet</p>
                  <p className="text-xs text-slate-300 mt-1">Click "Add Unit" to create your first measurement unit</p>
                </td>
              </tr>
            ) : (
              filteredUnits.map((unit: any, index: number) => (
                <tr key={unit.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-[12px] font-bold text-slate-300">{index + 1}</td>
                  <td className="px-6 py-4">
                    <span className="text-[13px] font-bold text-slate-800">{unit.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[11px] font-black uppercase tracking-wider border border-indigo-100">
                      {unit.code}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {deleteConfirm === unit.id ? (
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-[10px] font-bold text-rose-500">Delete?</span>
                        <button
                          onClick={() => handleDelete(unit.id)}
                          className="p-1.5 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-lg transition-all"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="p-1.5 bg-slate-50 text-slate-400 hover:bg-slate-100 rounded-lg transition-all"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(unit.id)}
                        className="p-2 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                        title="Delete Unit"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ItemUnitsView;
