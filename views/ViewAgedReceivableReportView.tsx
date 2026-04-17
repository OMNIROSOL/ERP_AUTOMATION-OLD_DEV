import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  Printer,
  Download,
  Share2,
  FileText,
  Calendar,
  Building2,
  Filter
} from 'lucide-react';
import { cn } from '../utils/cn';

interface AgingData {
  customer: string;
  current: number;
  days1_30: number;
  days31_60: number;
  days61_90: number;
  days90Plus: number;
  lessCredit: number;
  total: number;
  currency: string;
}

const mockAgingData: AgingData[] = [
  { customer: 'UNICORN LOGISTICS ZAMBIA LTD JB', current: 76821.00, days1_30: 416741.60, days31_60: 600677.00, days61_90: 253394.22, days90Plus: 0, lessCredit: 0, total: 1347633.82, currency: 'ZMW' },
  { customer: 'MACHI AUTO PARTS LIMITED - JACOB', current: 0, days1_30: 1326270.00, days31_60: 0, days61_90: 0, days90Plus: 0, lessCredit: 0, total: 1326270.00, currency: 'ZMW' },
  { customer: 'TERMITES MEAT SUPPLIERS LIMITED - KITWE', current: 336000.00, days1_30: 284840.00, days31_60: 211960.00, days61_90: 0, days90Plus: 0, lessCredit: 0, total: 832800.00, currency: 'ZMW' },
  { customer: 'SHAAN CARRIERS LTD MV', current: 52624.40, days1_30: 149317.18, days31_60: 275876.60, days61_90: 211622.24, days90Plus: 0, lessCredit: 0, total: 689440.42, currency: 'ZMW' },
  { customer: 'GLOBAL FREIGHT SERVICES (USD)', current: 15400.00, days1_30: 4500.00, days31_60: 12000.00, days61_90: 0, days90Plus: 0, lessCredit: 0, total: 31900.00, currency: 'USD' },
  { customer: 'TRANS-AFRICA LOGISTICS (USD)', current: 0, days1_30: 22800.00, days31_60: 5400.00, days61_90: 1800.00, days90Plus: 0, lessCredit: 0, total: 30000.00, currency: 'USD' },
  { customer: 'FIRST CHOICE LOGISTICS LIMITED (SG)', current: 1900.00, days1_30: 25988.00, days31_60: 103248.00, days61_90: 13656.00, days90Plus: 407978.00, lessCredit: 0, total: 552770.00, currency: 'ZMW' },
  { customer: 'JERE TYRES - PCRWL', current: 77300.00, days1_30: 100700.00, days31_60: 334180.00, days61_90: 0, days90Plus: 0, lessCredit: 0, total: 512180.00, currency: 'ZMW' },
  { customer: 'CHAKALALA FARM MUMBWA TJS', current: 0, days1_30: 0, days31_60: 204150.00, days61_90: 0, days90Plus: 300550.00, lessCredit: 0, total: 504700.00, currency: 'ZMW' },
  { customer: 'IKHWAAN LOGISTICS LIMITED TJS', current: 98000.00, days1_30: 203240.00, days31_60: 133864.00, days61_90: 0, days90Plus: 0, lessCredit: 0, total: 435104.00, currency: 'ZMW' }
];

const ViewAgedReceivableReportView: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const report = useMemo(() => {
    const saved = localStorage.getItem('aged_receivable_reports');
    if (saved) {
      try {
        const reports = JSON.parse(saved);
        return reports.find((r: any) => r.id === id);
      } catch (e) {
        return null;
      }
    }
    return null;
  }, [id]);

  const formatCurrency = (val: number) => {
    if (val === 0) return '—';
    return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const groupedData = useMemo(() => {
    const groups: Record<string, AgingData[]> = {};
    mockAgingData.forEach(item => {
      if (!groups[item.currency]) groups[item.currency] = [];
      groups[item.currency].push(item);
    });
    return groups;
  }, []);

  const currencies = useMemo(() => {
    return Object.keys(groupedData).sort((a, b) => {
      if (a === 'ZMW') return -1;
      if (b === 'ZMW') return 1;
      return a.localeCompare(b);
    });
  }, [groupedData]);

  return (
    <div className="min-h-screen bg-slate-50/50 p-8 space-y-8 animate-in fade-in duration-700 font-sans">
      {/* Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 max-w-[1400px] mx-auto">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/reports/aged-receivables')}
            className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors shadow-sm text-slate-400 hover:text-indigo-600"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Report Details</h1>
            <p className="text-[12px] font-medium text-slate-500 uppercase tracking-widest">ID: {id?.replace('report-', '')}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[12px] font-black hover:bg-slate-50 transition-all shadow-sm text-slate-600 uppercase tracking-widest">
            <Share2 size={16} /> Share
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[12px] font-black hover:bg-slate-50 transition-all shadow-sm text-slate-600 uppercase tracking-widest">
            <Download size={16} /> PDF
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 border border-indigo-700 rounded-xl text-[12px] font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 text-white uppercase tracking-widest"
          >
            <Printer size={16} /> Print
          </button>
        </div>
      </div>

      {/* Report Document */}
      <div className="max-w-[1400px] mx-auto bg-white rounded-[32px] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden print:border-none print:shadow-none print:rounded-none">
        <div className="p-8 space-y-8">
          {/* Document Header */}
          <div className="text-center space-y-1">
            <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">MAHANT INVESTMENT LTD</h2>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Aged Receivables</h3>
          </div>

          {/* Report Metadata */}
          <div className="flex justify-between items-end border-b border-slate-100 pb-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <Calendar size={14} />
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Report Date</span>
                  <span className="text-[12px] font-bold text-slate-700">{report?.date || '10 April 2026'}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              {/* Status section removed */}
            </div>
          </div>

          {/* Aging Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-900">
                  <th className="py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-900">Customer Name</th>
                  <th className="py-2 text-right text-[10px] font-black uppercase tracking-widest text-slate-900">Current</th>
                  <th className="py-2 text-right text-[10px] font-black uppercase tracking-widest text-slate-900">1-30 days</th>
                  <th className="py-2 text-right text-[10px] font-black uppercase tracking-widest text-slate-900">31-60 days</th>
                  <th className="py-2 text-right text-[10px] font-black uppercase tracking-widest text-slate-900">61-90 days</th>
                  <th className="py-2 text-right text-[10px] font-black uppercase tracking-widest text-slate-900">90+ days</th>
                  <th className="py-2 text-right text-[10px] font-black uppercase tracking-widest text-slate-900">Less: Credit</th>
                  <th className="py-2 text-right text-[10px] font-black uppercase tracking-widest text-slate-900">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {currencies.map(curr => (
                  <React.Fragment key={curr}>
                    {/* Currency Group Header */}
                    <tr className="bg-slate-50/80">
                      <td colSpan={8} className="py-2 px-3">
                        <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{curr}</span>
                      </td>
                    </tr>
                    {groupedData[curr].map((row, idx) => (
                      <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 pr-6 pl-3">
                          <span className="text-[12px] font-bold text-blue-400 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{row.customer}</span>
                        </td>
                        <td className="py-1.5 text-right font-medium text-[12px] text-slate-600 tabular-nums">{formatCurrency(row.current)}</td>
                        <td className="py-1.5 text-right font-medium text-[12px] text-slate-600 tabular-nums">{formatCurrency(row.days1_30)}</td>
                        <td className="py-1.5 text-right font-medium text-[12px] text-slate-600 tabular-nums">{formatCurrency(row.days31_60)}</td>
                        <td className="py-1.5 text-right font-medium text-[12px] text-slate-600 tabular-nums">{formatCurrency(row.days61_90)}</td>
                        <td className="py-1.5 text-right font-medium text-[12px] text-slate-600 tabular-nums">{formatCurrency(row.days90Plus)}</td>
                        <td className="py-1.5 text-right font-medium text-[12px] text-slate-400 tabular-nums">{formatCurrency(row.lessCredit)}</td>
                        <td className="py-1.5 text-right font-black text-[12px] text-slate-900 tabular-nums">{formatCurrency(row.total)}</td>
                      </tr>
                    ))}
                    {/* Currency Sub-total */}
                    <tr className="border-t border-slate-200 bg-slate-50/30">
                      <td className="py-2 pr-8 pl-3 font-black text-[11px] text-slate-700 uppercase tracking-widest italic text-right">Total {curr}</td>
                      <td className="py-2 text-right font-black text-[11px] text-slate-900 tabular-nums">{formatCurrency(groupedData[curr].reduce((acc, r) => acc + r.current, 0))}</td>
                      <td className="py-2 text-right font-black text-[11px] text-slate-900 tabular-nums">{formatCurrency(groupedData[curr].reduce((acc, r) => acc + r.days1_30, 0))}</td>
                      <td className="py-2 text-right font-black text-[11px] text-slate-900 tabular-nums">{formatCurrency(groupedData[curr].reduce((acc, r) => acc + r.days31_60, 0))}</td>
                      <td className="py-2 text-right font-black text-[11px] text-slate-900 tabular-nums">{formatCurrency(groupedData[curr].reduce((acc, r) => acc + r.days61_90, 0))}</td>
                      <td className="py-2 text-right font-black text-[11px] text-slate-900 tabular-nums">{formatCurrency(groupedData[curr].reduce((acc, r) => acc + r.days90Plus, 0))}</td>
                      <td className="py-2 text-right font-black text-[11px] text-slate-400 tabular-nums">{formatCurrency(groupedData[curr].reduce((acc, r) => acc + r.lessCredit, 0))}</td>
                      <td className="py-2 text-right font-black text-[12px] text-indigo-600 tabular-nums underline decoration-1 underline-offset-2">
                        {formatCurrency(groupedData[curr].reduce((acc, r) => acc + r.total, 0))}
                      </td>
                    </tr>
                    {/* Spacer row */}
                    <tr className="h-4"></tr>
                  </React.Fragment>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-900">
                  <td className="py-4 font-black text-[12px] text-slate-900 uppercase tracking-widest">End of Report</td>
                  <td colSpan={7} className="py-4 text-right text-slate-400 text-[10px] font-bold italic">
                    * Values are presented in their respective transaction currencies.
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewAgedReceivableReportView;
