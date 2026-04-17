import React, { useMemo, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { ChevronRight, LayoutGrid, HelpCircle, Edit, Eye, Search } from 'lucide-react';
import { getCustomers, getDeliveryTransactionsByItem } from '../mockData';

const InventoryItemTransactionsView = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const itemName = queryParams.get('item');

    const customers = useMemo(() => getCustomers(), []);
    const customer = useMemo(() => customers.find(c => c.id === id), [customers, id]);
    const [searchQuery, setSearchQuery] = useState('');

    const transactions = useMemo(() => {
        if (!customer || !itemName) return [];
        const items = getDeliveryTransactionsByItem(customer.name, itemName);

        let runningBalance = 0;
        return items.map(t => {
            runningBalance += t.qty;
            return {
                id: t.id,
                date: t.date,
                transaction: t.transaction,
                reference: t.reference,
                inventoryItem: itemName,
                customer: customer.name,
                qtyToDeliver: t.qty,
                balance: runningBalance
            };
        });
    }, [customer, itemName]);

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t =>
            t.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.transaction.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [transactions, searchQuery]);

    if (!customer || !itemName) {
        return (
            <div className="p-8">
                <div className="bg-red-50 text-red-600 p-4 rounded-xl font-bold">
                    Information not found.
                </div>
                <button onClick={() => navigate('/customers')} className="mt-4 text-blue-600 font-bold hover:underline">
                    Back to Customers
                </button>
            </div>
        );
    }

    return (
        <div className="p-0 bg-slate-50 min-h-screen">
            {/* Breadcrumb Area */}
            <div className="bg-white border-b border-slate-200 px-8 py-3 flex items-center space-x-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                <LayoutGrid size={12} />
                <ChevronRight size={10} className="opacity-30" />
                <Link to="/customers" className="hover:text-blue-600 transition-colors">Customers</Link>
                <ChevronRight size={10} className="opacity-30" />
                <Link to={`/customers/qty-to-deliver/${customer.id}`} className="hover:text-blue-600 transition-colors">{customer.name}</Link>
                <ChevronRight size={10} className="opacity-30" />
                <span className="text-slate-600 truncate max-w-[150px]">{itemName}</span>
                <span className="mx-2 text-slate-300">...</span>
                <span className="text-slate-600">{customer.name}</span>
            </div>

            <div className="p-8 space-y-6">
                {/* Header Area */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center space-x-2">
                        <h1 className="text-sm font-bold text-slate-400 uppercase tracking-tight">Inventory Items — Qty to deliver — Transactions</h1>
                        <HelpCircle size={14} className="text-slate-300" />
                    </div>

                    <div className="flex items-center space-x-2">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-3 pr-10 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-64"
                            />
                        </div>
                        <button className="bg-white border border-slate-200 px-4 py-1.5 rounded text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors">
                            <Search size={14} /> Search
                        </button>
                    </div>
                </div>

                {/* Table Area */}
                <div className="bg-white border border-slate-200 rounded shadow-sm w-fit min-w-full text-[13px] mb-8">
                    <table className="w-full text-left border-collapse min-w-[1500px]">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
                                <th className="px-4 py-3 w-16 border-r border-slate-200 text-center whitespace-nowrap">
                                    Edit
                                </th>
                                <th className="px-4 py-3 w-16 border-r border-slate-200 text-center whitespace-nowrap">
                                    View
                                </th>
                                <th className="px-4 py-3 border-r border-slate-200 whitespace-nowrap">Date</th>
                                <th className="px-4 py-3 border-r border-slate-200 whitespace-nowrap">Transaction</th>
                                <th className="px-4 py-3 border-r border-slate-200 whitespace-nowrap">Reference</th>
                                <th className="px-4 py-3 border-r border-slate-200 whitespace-nowrap">Inventory Item</th>
                                <th className="px-4 py-3 border-r border-slate-200 whitespace-nowrap">Customer</th>
                                <th className="px-4 py-3 text-right border-r border-slate-200 whitespace-nowrap">Qty to deliver</th>
                                <th className="px-4 py-3 text-right whitespace-nowrap">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {filteredTransactions.map((t) => (
                                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3 border-r border-slate-100 text-center">
                                        <Link
                                            to={`/delivery-notes/edit/${t.id}?item=${encodeURIComponent(t.inventoryItem)}`}
                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all inline-flex items-center justify-center"
                                            title="Edit"
                                        >
                                            <Edit size={14} />
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 border-r border-slate-100 text-center">
                                        <Link
                                            to={`/delivery-notes/view/${t.id}?item=${encodeURIComponent(t.inventoryItem)}`}
                                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all inline-flex items-center justify-center"
                                            title="View"
                                        >
                                            <Eye size={14} />
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 border-r border-slate-100 whitespace-nowrap">{t.date}</td>
                                    <td className="px-4 py-3 border-r border-slate-100">{t.transaction}</td>
                                    <td className="px-4 py-3 border-r border-slate-100 text-blue-600 font-medium">{t.reference}</td>
                                    <td className="px-4 py-3 border-r border-slate-100">{t.inventoryItem}</td>
                                    <td className="px-4 py-3 border-r border-slate-100">{t.customer}</td>
                                    <td className="px-4 py-3 text-right border-r border-slate-100 font-medium">
                                        {t.qtyToDeliver.toLocaleString(undefined, { minimumFractionDigits: t.qtyToDeliver % 1 !== 0 ? 1 : 0 })}
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold">
                                        {t.balance.toLocaleString(undefined, { minimumFractionDigits: t.balance % 1 !== 0 ? 1 : 0 })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default InventoryItemTransactionsView;
