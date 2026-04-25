import React, { useState, useEffect, useMemo } from 'react';
import { useERPStore } from '../store/useERPStore';
import Card from '../components/shared/Card';
import DataTable from '../components/shared/DataTable';
import Badge from '../components/shared/Badge';
import { ShoppingCart, Clock, TrendingUp, AlertCircle, Check, Save, Info } from 'lucide-react';
import { cn } from '../utils/cn';

const ProcurementPlanningView = () => {
  const { 
    suppliers, 
    fetchSuppliers,
    fetchProcurementSuggestions,
    fetchLeadTime,
    updateLeadTime,
    createProcurementOrder
  } = useERPStore();

  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [leadTime, setLeadTime] = useState({
    processingDays: 0,
    productionDays: 0,
    shippingDays: 0,
    roadTransportDays: 0
  });
  const [isSaving, setIsSaving] = useState(false);
  const [expenses, setExpenses] = useState({
    fobCharge: 0,
    freight: 0,
    insurance: 0,
    roadTransport: 0,
    clearingAgent: 0,
    duty: 0,
    zabs: 0,
    overweight: 0,
    bankCharges: 0
  });
  const [autoBankCharges, setAutoBankCharges] = useState(true);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  useEffect(() => {
    if (selectedSupplier) {
      loadSupplierData(selectedSupplier.id);
    }
  }, [selectedSupplier]);

  const loadSupplierData = async (id: string) => {
    const [suggs, lt] = await Promise.all([
      fetchProcurementSuggestions(id),
      fetchLeadTime(id)
    ]);
    setSuggestions(suggs);
    if (lt) setLeadTime(lt);
  };

  const totalLeadTime = useMemo(() => {
    return leadTime.processingDays + leadTime.productionDays + leadTime.shippingDays + leadTime.roadTransportDays;
  }, [leadTime]);

  const projectedETA = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + totalLeadTime);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }, [totalLeadTime]);

  const totalFOB = useMemo(() => {
    return suggestions.reduce((sum, s) => sum + (s.suggestedQty * (s.lastPurchasePrice || 0)), 0);
  }, [suggestions]);

  useEffect(() => {
    if (autoBankCharges) {
      setExpenses(prev => ({ ...prev, bankCharges: totalFOB * 0.015 }));
    }
  }, [totalFOB, autoBankCharges]);

  const totalExpenses = useMemo(() => {
    return Object.values(expenses).reduce((sum, val) => sum + val, 0);
  }, [expenses]);

  const expenseMultiplier = useMemo(() => {
    return totalFOB > 0 ? (totalExpenses / totalFOB) : 0;
  }, [totalExpenses, totalFOB]);

  const handleSaveLeadTime = async () => {
    if (!selectedSupplier) return;
    setIsSaving(true);
    try {
      await updateLeadTime({ ...leadTime, supplierId: selectedSupplier.id });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!selectedSupplier || suggestions.length === 0) return;
    
    const itemsToOrder = suggestions.filter(s => s.suggestedQty > 0);
    if (itemsToOrder.length === 0) {
      alert("No items suggested for order.");
      return;
    }

    try {
      await createProcurementOrder({
        supplierId: selectedSupplier.id,
        reference: `PROC-${Date.now()}`,
        description: `Automated order for ${selectedSupplier.name}`,
        totalLandedCost: totalFOB + totalExpenses,
        expenses: Object.entries(expenses).map(([name, amount]) => ({
          expenseName: name,
          amount: amount
        })),
        items: itemsToOrder.map(s => {
          const unitPrice = parseFloat(s.lastPurchasePrice || 0);
          const landedCost = unitPrice * (1 + expenseMultiplier);
          return {
            itemId: s.itemId,
            qty: s.suggestedQty,
            unitPrice: unitPrice,
            totalAmount: s.suggestedQty * unitPrice,
            landedCost: landedCost
          };
        })
      });
      alert("Procurement order created successfully!");
    } catch (err) {
      alert("Failed to create order: " + (err as Error).message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShoppingCart className="text-primary" />
            Procurement Planning
          </h1>
          <p className="text-slate-500 text-sm">Intelligent supplier-wise order planning & lead time tracking</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Supplier Selector */}
        <Card className="lg:col-span-1 p-4">
          <h3 className="font-bold text-slate-800 mb-4 px-2">Select Supplier</h3>
          <div className="space-y-1">
            {suppliers.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedSupplier(s)}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-xl transition-all text-sm font-medium",
                  selectedSupplier?.id === s.id 
                    ? "bg-primary text-white shadow-lg shadow-primary/20" 
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                {s.name}
              </button>
            ))}
          </div>
        </Card>

        {/* Planning Sheet */}
        <div className="lg:col-span-3 space-y-6">
          {!selectedSupplier ? (
            <div className="h-64 flex flex-col items-center justify-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <ShoppingCart size={48} className="text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium">Select a supplier to start planning</p>
            </div>
          ) : (
            <>
              {/* Lead Time & Projections */}
              <Card className="p-6 bg-gradient-to-br from-white to-slate-50 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <Clock size={120} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                      <Clock size={16} className="text-primary" />
                      Lead Time (Days)
                    </h4>
                    <div className="space-y-3">
                      {['Processing', 'Production', 'Shipping', 'Road Transport'].map((label, idx) => {
                        const key = label.charAt(0).toLowerCase() + label.slice(1).replace(' ', '') + 'Days';
                        return (
                          <div key={label} className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">{label}</label>
                            <input
                              type="number"
                              value={(leadTime as any)[key]}
                              onChange={(e) => setLeadTime(prev => ({ ...prev, [key]: parseInt(e.target.value) || 0 }))}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                          </div>
                        );
                      })}
                    </div>
                    <button
                      onClick={handleSaveLeadTime}
                      disabled={isSaving}
                      className="w-full bg-slate-900 text-white py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2"
                    >
                      {isSaving ? "Saving..." : <><Save size={14} /> Save Config</>}
                    </button>
                  </div>

                  <div className="lg:col-span-3 flex flex-col justify-between">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
                      <div className="bg-white/60 backdrop-blur-sm border border-white p-4 rounded-2xl flex flex-col justify-center items-center text-center shadow-sm">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Lead Time</span>
                        <span className="text-3xl font-black text-slate-900">{totalLeadTime} Days</span>
                      </div>
                      
                      <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl flex flex-col justify-center items-center text-center shadow-sm">
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Projected Arrival</span>
                        <span className="text-2xl font-black text-slate-900">{projectedETA}</span>
                      </div>

                      <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex flex-col justify-center items-center text-center shadow-sm">
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">Items Recommended</span>
                        <span className="text-3xl font-black text-slate-900">{suggestions.filter(s => s.suggestedQty > 0).length}</span>
                      </div>
                    </div>

                    <div className="mt-6 flex items-start gap-3 bg-amber-50 border border-amber-100 p-3 rounded-xl">
                      <AlertCircle className="text-amber-500 shrink-0" size={18} />
                      <p className="text-[11px] text-amber-700 font-medium">
                        Recommendations are based on an 8-month moving average of sales inflows. 
                        Order now to ensure stock availability by the projected arrival date.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Landing Cost Estimator */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    <TrendingUp size={18} className="text-primary" />
                    Landed Cost Calculator
                  </h4>
                  <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full">
                    <input 
                      type="checkbox" 
                      id="autoBank" 
                      checked={autoBankCharges}
                      onChange={(e) => setAutoBankCharges(e.target.checked)}
                      className="rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="autoBank" className="text-[10px] font-bold text-slate-500 uppercase tracking-tight cursor-pointer">Auto 1.5% Bank Charges</label>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {[
                    { key: 'fobCharge', label: 'FOB Charge' },
                    { key: 'freight', label: 'Freight' },
                    { key: 'insurance', label: 'Insurance' },
                    { key: 'roadTransport', label: 'Road Transport' },
                    { key: 'clearingAgent', label: 'Clearing Agent' },
                    { key: 'duty', label: 'Duty' },
                    { key: 'zabs', label: 'ZABS' },
                    { key: 'overweight', label: 'Overweight' },
                    { key: 'bankCharges', label: 'Bank Charges', disabled: autoBankCharges }
                  ].map((field) => (
                    <div key={field.key} className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{field.label}</label>
                      <input
                        type="number"
                        value={(expenses as any)[field.key]}
                        disabled={field.disabled}
                        onChange={(e) => setExpenses(prev => ({ ...prev, [field.key]: parseFloat(e.target.value) || 0 }))}
                        className={cn(
                          "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20",
                          field.disabled && "opacity-50 cursor-not-allowed bg-slate-100"
                        )}
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-900 rounded-2xl p-4 text-white flex flex-col justify-center items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total FOB</span>
                    <span className="text-2xl font-black">${totalFOB.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="bg-indigo-600 rounded-2xl p-4 text-white flex flex-col justify-center items-center">
                    <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Total Expenses</span>
                    <span className="text-2xl font-black">${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="bg-emerald-600 rounded-2xl p-4 text-white flex flex-col justify-center items-center">
                    <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-1">Expense Coefficient</span>
                    <span className="text-2xl font-black">{(expenseMultiplier * 100).toFixed(2)}%</span>
                  </div>
                </div>
              </Card>

              {/* Suggestions Table */}
              <Card className="p-0 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <TrendingUp size={18} className="text-emerald-500" />
                    Demand-Based Suggestions
                  </h3>
                  <button
                    onClick={handleCreateOrder}
                    className="bg-primary text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                  >
                    <ShoppingCart size={16} /> Create Order Sheet
                  </button>
                </div>
                <DataTable
                  data={suggestions}
                  columns={[
                    {
                      header: 'Item Detail',
                      accessor: (row: any) => (
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{row.itemName}</span>
                          <span className="text-[10px] font-medium text-slate-400">{row.itemCode}</span>
                        </div>
                      )
                    },
                    {
                      header: 'Monthly Demand',
                      accessor: (row: any) => (
                        <div className="flex flex-col">
                          <span className="font-black text-slate-700">{row.avgMonthlyDemand.toFixed(2)}</span>
                          <span className="text-[10px] text-slate-400">8-month avg</span>
                        </div>
                      )
                    },
                    {
                      header: 'Suggested Qty',
                      accessor: (row: any) => (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={row.suggestedQty}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setSuggestions(prev => prev.map(p => p.itemId === row.itemId ? { ...p, suggestedQty: val } : p));
                            }}
                            className="w-20 bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-1 text-center font-black text-emerald-700 focus:ring-2 focus:ring-emerald-200 outline-none"
                          />
                          {row.suggestedQty > 0 && <Badge variant="success" className="h-5">Needed</Badge>}
                        </div>
                      )
                    },
                    {
                      header: 'Last Cost',
                      accessor: (row: any) => (
                        <div className="flex flex-col text-right">
                          <span className="font-black text-slate-900">
                            ${parseFloat(row.lastPurchasePrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase tracking-tighter">FOB Unit Price</span>
                        </div>
                      )
                    },
                    {
                      header: 'Landed Cost',
                      accessor: (row: any) => {
                        const unitPrice = parseFloat(row.lastPurchasePrice || 0);
                        const landedCost = unitPrice * (1 + expenseMultiplier);
                        return (
                          <div className="flex flex-col text-right">
                            <span className="font-black text-indigo-600">
                              ${landedCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-tighter">Est. Per Unit</span>
                          </div>
                        );
                      }
                    },
                    {
                      header: 'Total Landed',
                      accessor: (row: any) => {
                        const unitPrice = parseFloat(row.lastPurchasePrice || 0);
                        const landedCost = unitPrice * (1 + expenseMultiplier);
                        const totalLanded = landedCost * row.suggestedQty;
                        return (
                          <div className="flex flex-col text-right">
                            <span className="font-black text-slate-900">
                              ${totalLanded.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-tighter">FOB + Expenses</span>
                          </div>
                        );
                      }
                    }
                  ]}
                />
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProcurementPlanningView;
