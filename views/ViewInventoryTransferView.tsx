import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, ArrowRightLeft, Calendar, MapPin, ClipboardList, AlertCircle } from 'lucide-react';
import apiService from '../services/apiService';

const ViewInventoryTransferView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [transfer, setTransfer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTransfer = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await apiService.getInventoryTransfer(id);
        setTransfer(data);
      } catch (err) {
        console.error('Failed to fetch inventory transfer:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTransfer();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-4 font-sans">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading transfer details...</p>
      </div>
    );
  }

  if (!transfer) {
    return (
      <div className="p-8 text-center mt-20">
        <AlertCircle size={48} className="mx-auto text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Transfer Not Found</h2>
        <button 
          onClick={() => navigate('/inventory-transfers')}
          className="mt-4 text-blue-600 font-bold hover:underline"
        >
          Back to Transfers
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-gray-100 pb-6">
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
              <span>Inventory Transfer Details</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{transfer.reference}</h1>
            <p className="text-sm text-gray-400 font-medium">{transfer.date}</p>
          </div>
        </div>
        <button
          onClick={() => navigate(`/inventory-transfers/edit/${transfer.id}`)}
          className="px-8 py-2 bg-blue-600 text-[11px] font-black text-white rounded-md hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2 uppercase tracking-widest"
        >
          <Edit size={14} /> Edit Transfer
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-300 block mb-0.5">From Location</label>
                    <div className="text-sm font-bold text-slate-700">{transfer.fromLocation}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-300 block mb-0.5">To Location</label>
                    <div className="text-sm font-bold text-slate-700">{transfer.toLocation}</div>
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
                    <div className="text-sm font-bold text-slate-700">{transfer.date}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600">
                    <ClipboardList size={20} />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-300 block mb-0.5">Status</label>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      transfer.status === 'Received' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                      transfer.status === 'Sent' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                      'bg-slate-50 text-slate-600 border-slate-100'
                    }`}>
                      {transfer.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-8 border-t border-gray-50">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 block mb-2">Description</label>
              <div className="text-sm font-medium text-slate-600 leading-relaxed italic bg-slate-50 p-4 rounded-xl border border-slate-100">
                "{transfer.description || 'No description provided'}"
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-gray-400 border-b border-gray-50 pb-4 mb-6">Transferred Items</h2>
            <div className="space-y-4">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Inventory Item</th>
                    <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transfer.items.map((item, index) => (
                    <tr key={index}>
                      <td className="py-4">
                        <div className="text-sm font-bold text-slate-700">{item.inventoryItem}</div>
                      </td>
                      <td className="py-4 text-right">
                        <div className="text-sm font-black text-blue-600 bg-blue-50 inline-block px-3 py-1 rounded-lg border border-blue-100">{item.qty} units</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl text-white space-y-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-white/10 pb-4">Transfer Timeline</h2>
            <div className="relative space-y-8 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-white/10">
              <div className="relative pl-10">
                <div className="absolute left-3 top-1 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Created</div>
                <div className="text-xs font-bold text-white">{transfer.date}</div>
              </div>
              <div className="relative pl-10">
                <div className={`absolute left-3 top-1 w-2 h-2 rounded-full ${transfer.status === 'Draft' ? 'bg-slate-700' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'}`}></div>
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Sent</div>
                <div className="text-xs font-bold text-white">{transfer.status === 'Draft' ? 'Pending' : transfer.date}</div>
              </div>
              <div className="relative pl-10">
                <div className={`absolute left-3 top-1 w-2 h-2 rounded-full ${transfer.status === 'Received' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`}></div>
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Received</div>
                <div className="text-xs font-bold text-white">{transfer.status === 'Received' ? transfer.date : 'Awaiting Arrival'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewInventoryTransferView;
