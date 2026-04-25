import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, FileX, Calendar, Package, Trash2, AlertCircle, TrendingDown } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';
import { useEffect } from 'react';

const ViewInventoryWriteOffView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { inventoryWriteOffs, fetchInventoryWriteOffs } = useERPStore();

  useEffect(() => {
    fetchInventoryWriteOffs();
  }, []);

  const writeOff = inventoryWriteOffs.find((wo: any) => wo.id === id);

  if (!writeOff) {
    return (
      <div className="p-8 text-center mt-20">
        <AlertCircle size={48} className="mx-auto text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Write-off Not Found</h2>
        <button 
          onClick={() => navigate('/inventory-write-offs')}
          className="mt-4 text-blue-600 font-bold hover:underline"
        >
          Back to Write-offs
        </button>
      </div>
    );
  }

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
              <span>Inventory Write-off Details</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{writeOff.reference}</h1>
            <p className="text-sm text-gray-400 font-medium">{writeOff.date ? new Date(writeOff.date).toISOString().split('T')[0] : ''}</p>
          </div>
        </div>
        <button
          onClick={() => navigate(`/inventory-write-offs/edit/${writeOff.id}`)}
          className="px-8 py-2 bg-blue-600 text-[11px] font-black text-white rounded-md hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2 uppercase tracking-widest"
        >
          <Edit size={14} /> Edit Write-off
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                    <Package size={20} />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-300 block mb-0.5">Inventory Item</label>
                    <div className="text-sm font-bold text-slate-700">{writeOff.inventoryItem}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600">
                    <TrendingDown size={20} />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-300 block mb-0.5">Quantity Adjusted</label>
                    <div className="text-sm font-bold text-rose-600">-{writeOff.qty} units</div>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-300 block mb-0.5">Date Created</label>
                    <div className="text-sm font-bold text-slate-700">{writeOff.date ? new Date(writeOff.date).toISOString().split('T')[0] : ''}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                    <span className="font-black text-xs">$$</span>
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-300 block mb-0.5">Write-off Value</label>
                    <div className="text-sm font-black text-rose-600">ZMW {(writeOff.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-8 border-t border-gray-50 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 block mb-2">Expense Account</label>
                <div className="text-sm font-bold text-slate-700 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 inline-block">
                  {writeOff.account}
                </div>
              </div>
              <div className="flex flex-col justify-center items-end">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 block mb-2 text-right">Transaction Status</label>
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border bg-emerald-50 text-emerald-600 border-emerald-100`}>
                  {writeOff.status || 'Approved'}
                </span>
              </div>
            </div>

            <div className="pt-8 border-t border-gray-50">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 block mb-2">Reason for Adjustment</label>
              <div className="text-sm font-medium text-slate-600 leading-relaxed italic border-l-4 border-rose-200 pl-4 py-2">
                "{writeOff.description || 'No description provided'}"
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-rose-900 p-8 rounded-3xl shadow-2xl text-white space-y-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-200/50 border-b border-white/10 pb-4">Accounting Impact</h2>
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="text-[10px] font-black uppercase tracking-widest text-rose-200">Asset Decrease</div>
                <div className="text-sm font-black">ZMW {(writeOff.amount || 0).toLocaleString()}</div>
              </div>
              <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="text-[10px] font-black uppercase tracking-widest text-rose-200">Expense Increase</div>
                <div className="text-sm font-black">ZMW {(writeOff.amount || 0).toLocaleString()}</div>
              </div>
              <p className="text-[10px] text-rose-200/60 leading-relaxed text-center px-4">
                This transaction marks the inventory as unusable and shifts the cost to the specified expense account.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewInventoryWriteOffView;
