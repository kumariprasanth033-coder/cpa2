import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Wallet,
  PieChart,
  PlusCircle,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Receipt,
} from 'lucide-react';

export const PersonalCPAView: React.FC = () => {
  const { personalCpa, personalBudget, wallets, formatCurrency, setQuickActionModal, transactions, setActiveTab } = useApp();

  const personalWallet = wallets[personalCpa.walletId];
  const personalTxns = transactions.filter((t) => t.cpaId === personalCpa.id);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 font-mono text-xs font-bold text-cyan-400">
              {personalCpa.cpaNumber}
            </span>
            <span className="text-xs text-slate-400">Isolated Personal Pocket</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1">Personal Pocket & Envelope Budget</h1>
          <p className="text-xs text-slate-400">
            Dedicated personal allowance ledger. Completely separated from group shared funds.
          </p>
        </div>

        <button
          onClick={() => setQuickActionModal('add-money')}
          className="flex items-center justify-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-4 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer shrink-0 shadow-md shadow-cyan-600/20"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Add Pocket Allowance</span>
        </button>
      </div>

      {/* Balance & Envelope Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balance Card */}
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-xl space-y-4">
          <span className="text-xs text-slate-400">Current Available Pocket Balance</span>
          <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
            {formatCurrency(personalWallet?.balance || 0)}
          </div>

          <div className="border-t border-slate-800 pt-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Monthly Budget:</span>
              <span className="font-mono text-white font-bold">{formatCurrency(personalBudget.totalPocketMoney)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Savings Goal:</span>
              <span className="font-mono text-emerald-400 font-bold">{formatCurrency(personalBudget.savingsGoal)}</span>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('ai-manager')}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 py-2.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition-colors cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            <span>Ask AI: Can I afford this?</span>
          </button>
        </div>

        {/* Envelope Categories */}
        <div className="md:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Categorized Budget Envelopes</h3>
            <span className="text-[10px] text-slate-400">Discipline Score: 86/100</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {personalBudget.categories.map((cat, idx) => {
              const pct = Math.min(100, Math.round((cat.spent / cat.allocated) * 100));
              return (
                <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{cat.name}</span>
                    <span className="font-mono text-[11px] text-slate-400">
                      {formatCurrency(cat.spent)} / {formatCurrency(cat.allocated)}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        pct > 80 ? 'bg-amber-400' : 'bg-cyan-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>{pct}% consumed</span>
                    <span>Remaining: {formatCurrency(cat.allocated - cat.spent)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Personal Transactions */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Receipt className="h-4 w-4 text-cyan-400" />
          <span>Personal Pocket Ledger</span>
        </h3>

        <div className="divide-y divide-slate-800/80">
          {personalTxns.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No personal transactions recorded. Add pocket money or log a personal expense.
            </div>
          ) : (
            personalTxns.map((t) => (
              <div key={t.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                    <ArrowDownLeft className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white">{t.description}</div>
                    <div className="text-[10px] text-slate-400">{t.category} • {t.paymentReference}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-bold text-emerald-400">+{formatCurrency(t.amount)}</div>
                  <div className="text-[10px] text-slate-500">
                    {new Date(t.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
