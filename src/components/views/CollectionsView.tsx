import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  HeartHandshake,
  ShieldCheck,
  CreditCard,
  QrCode,
  Users,
  CheckCircle2,
  Lock,
  Sparkles,
  UserPlus,
} from 'lucide-react';

export const CollectionsView: React.FC = () => {
  const { activeGroup, formatCurrency, setQuickActionModal, transactions, currentUser } = useApp();

  const [customAmount, setCustomAmount] = useState<number>(500);

  const groupContributions = transactions.filter(
    (t) => t.cpaId === activeGroup?.id && t.type === 'Contribution'
  );

  const progressPct = activeGroup?.targetAmount
    ? Math.min(100, Math.round((activeGroup.collectedAmount / activeGroup.targetAmount) * 100))
    : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Disclaimer banner */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 text-xs text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Verified Group Collection:</strong> CPA manages shared group pockets and team contributions.
            CPA is not a public charitable fundraising platform.
          </span>
        </div>
      </div>

      {/* Main Campaign Card */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 font-mono text-xs font-bold">
                {activeGroup?.cpaNumber}
              </span>
              <span className="text-xs text-slate-400">Target Group</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
              {activeGroup?.name || 'Group Collection'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              {activeGroup?.description || 'Support group activities with zero-fee centralized ledger contributions.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              id="btn-collections-add-members"
              onClick={() => setQuickActionModal('invite-friends')}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-600/20 hover:bg-emerald-600/30 px-4 py-3 text-xs font-bold text-emerald-300 transition-all cursor-pointer"
            >
              <UserPlus className="h-4 w-4 text-emerald-400" />
              <span>+ Add Members</span>
            </button>
            <button
              id="btn-collections-contribute"
              onClick={() => setQuickActionModal('contribute')}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 text-xs font-bold text-slate-950 shadow-xl shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-400 transition-all cursor-pointer shrink-0"
            >
              <HeartHandshake className="h-4 w-4" />
              <span>Make a Contribution</span>
            </button>
          </div>
        </div>

        {/* Progress Display */}
        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <span className="text-xs text-slate-400">Total Collected So Far</span>
              <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono mt-1">
                {formatCurrency(activeGroup?.collectedAmount || 0)}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Target Goal</span>
              <div className="text-xl font-bold text-slate-300 font-mono">
                {formatCurrency(activeGroup?.targetAmount || 0)}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs font-semibold">
              <span className="text-emerald-400">{progressPct}% achieved</span>
              <span className="text-slate-400">
                {activeGroup?.memberCount || 8} Active contributors
              </span>
            </div>
          </div>
        </div>

        {/* Recent Public Contributions List */}
        <div className="mt-8">
          <h3 className="text-sm font-bold text-white mb-3">Verified Contributor Ledger</h3>
          <div className="space-y-2">
            {groupContributions.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                No contributions recorded yet. Be the first to contribute!
              </div>
            ) : (
              groupContributions.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 font-bold">
                      {c.userName[0]}
                    </div>
                    <div>
                      <div className="font-bold text-white">{c.userName}</div>
                      <div className="text-[10px] text-slate-400">{c.description}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-emerald-400">+{formatCurrency(c.amount)}</div>
                    <div className="text-[10px] text-slate-500">
                      {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
