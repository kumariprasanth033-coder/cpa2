import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Receipt,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export const TransactionsView: React.FC = () => {
  const { transactions, formatCurrency, activeGroup } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const filtered = transactions.filter((txn) => {
    const matchesSearch =
      txn.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.paymentReference.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'ALL' || txn.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Receipt className="h-6 w-6 text-emerald-400" />
            <span>Immutable Transaction Ledger</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Server-authoritative double-entry ledger records with verified payment references.
          </p>
        </div>

        <button
          onClick={() => {
            const csv = transactions.map(t => `${t.timestamp},${t.type},${t.amount / 100},${t.userName},${t.status},${t.paymentReference}`).join('\n');
            const blob = new Blob([`Timestamp,Type,Amount_INR,User,Status,Reference\n${csv}`], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `cpa-ledger-${activeGroup?.cpaNumber || 'export'}.csv`;
            a.click();
          }}
          className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200 cursor-pointer"
        >
          <Download className="h-4 w-4" />
          <span>Export Ledger CSV</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search description, user name, or reference ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto">
          {['ALL', 'Contribution', 'Expense', 'Withdrawal'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`rounded-xl px-3 py-2 text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                filterType === type
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="p-4">Transaction</th>
                <th className="p-4">Type</th>
                <th className="p-4">Member</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4">Reference</th>
                <th className="p-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No ledger transactions matching the selected criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((txn) => (
                  <tr key={txn.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-bold text-white">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                            txn.type === 'Contribution'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {txn.type === 'Contribution' ? (
                            <ArrowDownLeft className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          )}
                        </div>
                        <div>
                          <div>{txn.description}</div>
                          {txn.category && <span className="text-[10px] text-slate-400">{txn.category}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="rounded bg-slate-800 px-2 py-0.5 font-semibold text-[10px] text-slate-300">
                        {txn.type}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-slate-200">{txn.userName}</td>
                    <td className="p-4 font-mono font-bold">
                      <span className={txn.type === 'Contribution' ? 'text-emerald-400' : 'text-slate-100'}>
                        {txn.type === 'Contribution' ? '+' : '-'}
                        {formatCurrency(txn.amount)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold ${
                          txn.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {txn.status === 'COMPLETED' ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        <span>{txn.status}</span>
                      </span>
                    </td>
                    <td className="p-4 font-mono text-[11px] text-slate-400">{txn.paymentReference}</td>
                    <td className="p-4 text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(txn.timestamp).toLocaleDateString()} {new Date(txn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
