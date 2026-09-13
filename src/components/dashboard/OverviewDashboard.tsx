import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Wallet,
  Users,
  Clock,
  ArrowUpRight,
  HeartHandshake,
  PieChart,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  QrCode,
  Lock,
  ChevronRight,
  ArrowDownLeft,
  Info,
  Calendar,
  Layers,
} from 'lucide-react';

export const OverviewDashboard: React.FC = () => {
  const {
    activeGroup,
    personalCpa,
    personalBudget,
    wallets,
    formatCurrency,
    joinRequests,
    approvalRequests,
    transactions,
    aiInsights,
    approveJoinRequest,
    rejectJoinRequest,
    approveWithdrawalRequest,
    rejectWithdrawalRequest,
    setQuickActionModal,
    setActiveTab,
    paymentMode,
    currentUser,
  } = useApp();

  const groupWallet = activeGroup ? wallets[activeGroup.walletId] : undefined;
  const personalWallet = wallets[personalCpa.walletId];

  const pendingJoinRequests = joinRequests.filter((r) => r.status === 'PENDING');
  const pendingApprovals = approvalRequests.filter((r) => r.status === 'PENDING');

  const progressPercent = activeGroup?.targetAmount
    ? Math.min(100, Math.round((activeGroup.collectedAmount / activeGroup.targetAmount) * 100))
    : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      {/* TEST / LIVE Notification Banner */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl border p-4 text-xs ${
          paymentMode === 'TEST'
            ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200'
            : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Info className="h-4 w-4 shrink-0" />
          <span>
            <strong>{paymentMode} GATEWAY ACTIVE:</strong>{' '}
            {paymentMode === 'TEST' &&
              'Developer gateway test mode active. Cryptographic direct ledger and simulated HMAC webhook verification.'}
            {paymentMode === 'LIVE' &&
              'Production banking gateway active. Real money transfers with banking partner settlements.'}
          </span>
        </div>
        <button
          onClick={() => setActiveTab('trust-center')}
          className="underline hover:text-white shrink-0 self-start sm:self-auto font-semibold"
        >
          View Security Policies
        </button>
      </div>

      {/* TOP STATS CARDS: GROUP CPA + PERSONAL CPA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* GROUP CPA CARD */}
        {activeGroup && (
          <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Layers className="h-4 w-4" />
                </span>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Active Group CPA
                  </span>
                  <h3 className="text-base font-bold text-white">{activeGroup.name}</h3>
                </div>
              </div>
              <span className="font-mono text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                {activeGroup.cpaNumber}
              </span>
            </div>

            <div className="mt-5">
              <span className="text-xs text-slate-400">Available Group Treasury</span>
              <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono mt-0.5">
                {formatCurrency(groupWallet?.balance || 0)}
              </div>
            </div>

            {/* Target Progress Bar */}
            {activeGroup.targetAmount && (
              <div className="mt-5">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400">
                    Collected: <strong className="text-white">{formatCurrency(activeGroup.collectedAmount)}</strong>
                  </span>
                  <span className="font-bold text-emerald-400">{progressPercent}% of {formatCurrency(activeGroup.targetAmount)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Quick Metrics Grid */}
            <div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-800/80 pt-4 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Members</span>
                <span className="font-bold text-slate-200">{activeGroup.memberCount} active</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Spent</span>
                <span className="font-bold text-slate-200">{formatCurrency(activeGroup.spentAmount)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Pending Approvals</span>
                <span className="font-bold text-amber-400">{formatCurrency(activeGroup.pendingAmount)}</span>
              </div>
            </div>

            {/* Group Action Buttons */}
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={() => setQuickActionModal('contribute')}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-xs font-bold text-white transition-colors cursor-pointer shadow-md shadow-emerald-600/20"
              >
                <HeartHandshake className="h-3.5 w-3.5" />
                <span>Contribute</span>
              </button>
              <button
                onClick={() => setQuickActionModal('withdraw')}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
              >
                <ArrowUpRight className="h-3.5 w-3.5 text-amber-400" />
                <span>Withdraw</span>
              </button>
              <button
                onClick={() => setActiveTab('groups')}
                className="flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <span>Manage</span>
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* PERSONAL CPA POCKET CARD */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Wallet className="h-4 w-4" />
              </span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Personal CPA Pocket
                </span>
                <h3 className="text-base font-bold text-white">{personalCpa.name}</h3>
              </div>
            </div>
            <span className="font-mono text-xs font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-md">
              {personalCpa.cpaNumber}
            </span>
          </div>

          <div className="mt-5">
            <span className="text-xs text-slate-400">Personal Pocket Balance</span>
            <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono mt-0.5">
              {formatCurrency(personalWallet?.balance || 0)}
            </div>
          </div>

          {/* Envelope Budget Tracker */}
          <div className="mt-5">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400">
                Allowance Remaining: <strong className="text-white">{formatCurrency(personalBudget.totalPocketMoney - (personalWallet?.balance || 0))} spent</strong>
              </span>
              <span className="font-bold text-cyan-400">
                Budget: {formatCurrency(personalBudget.totalPocketMoney)}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 mt-2">
              {personalBudget.categories.map((cat, idx) => {
                const spentPct = Math.min(100, Math.round((cat.spent / cat.allocated) * 100));
                return (
                  <div key={idx} className="rounded-lg bg-slate-950 p-1.5 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 truncate block">{cat.name.split(' ')[0]}</span>
                    <span className="text-xs font-bold text-slate-200 mt-0.5 block">{spentPct}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-800/80 pt-4">
            <button
              onClick={() => setQuickActionModal('add-money')}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-3 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              <span>+ Add Pocket Money</span>
            </button>
            <button
              onClick={() => setActiveTab('ai-manager')}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-2 text-xs font-semibold text-indigo-300 transition-colors cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Can I Afford This?</span>
            </button>
          </div>
        </div>
      </div>

      {/* PENDING ACTIONS ROW: JOIN REQUESTS & MULTI-APPROVALS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PENDING JOIN REQUESTS (Leader View) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Pending Join Requests</h3>
            </div>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-bold text-emerald-400">
              {pendingJoinRequests.length} Pending Review
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {pendingJoinRequests.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No join requests awaiting leader review.
              </div>
            ) : (
              pendingJoinRequests.map((req) => (
                <div
                  key={req.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-300 font-bold">
                        {req.applicantName[0]}
                      </div>
                      <div>
                        <div className="font-bold text-white">{req.applicantName}</div>
                        <div className="text-[10px] text-slate-400">{req.contactInfo || req.applicantEmail}</div>
                      </div>
                    </div>
                    <span className="rounded bg-amber-500/10 text-amber-300 px-1.5 py-0.5 text-[10px] font-semibold border border-amber-500/20">
                      PIN Verified
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-300 italic bg-slate-900/50 p-2 rounded-lg">
                    "{req.reason}"
                  </p>

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => approveJoinRequest(req.id)}
                      className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 py-1.5 text-xs font-bold text-white transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Approve Member</span>
                    </button>
                    <button
                      onClick={() => rejectJoinRequest(req.id)}
                      className="flex items-center justify-center gap-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                    >
                      <XCircle className="h-3.5 w-3.5 text-rose-400" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* PENDING WITHDRAWAL APPROVALS */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Multi-Signature Approvals</h3>
            </div>
            <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[11px] font-bold text-amber-400">
              {pendingApprovals.length} Action Needed
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {pendingApprovals.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No pending withdrawals requiring approval.
              </div>
            ) : (
              pendingApprovals.map((apr) => (
                <div
                  key={apr.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-white">
                        {apr.requesterName} requested {formatCurrency(apr.amount)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Destination: <span className="font-mono text-slate-300">{apr.destination}</span>
                      </div>
                    </div>
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-400 border border-slate-700">
                      {apr.approvedCount}/{apr.requiredApprovals} Approvals
                    </span>
                  </div>

                  <p className="mt-2 text-[11px] text-slate-300 bg-slate-900/50 p-2 rounded-lg">
                    <strong>Reason:</strong> {apr.reason}
                  </p>

                  {/* Approvers who have signed so far */}
                  {apr.approvers.length > 0 && (
                    <div className="mt-2 text-[11px] text-slate-400">
                      Signed by: {apr.approvers.map((a) => a.userName).join(', ')}
                    </div>
                  )}

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => {
                        const res = approveWithdrawalRequest(apr.id);
                        if (!res.success) alert(res.message);
                      }}
                      className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-amber-600 hover:bg-amber-500 py-1.5 text-xs font-bold text-white transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Cast Sign-off Approval</span>
                    </button>
                    <button
                      onClick={() => rejectWithdrawalRequest(apr.id, 'Rejected by member')}
                      className="flex items-center justify-center gap-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                    >
                      <XCircle className="h-3.5 w-3.5 text-rose-400" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* AI INSIGHTS & RECENT TRANSACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GEMINI AI OVERSIGHT WIDGET */}
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950 p-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">CPA AI Financial Monitor</h3>
            </div>
            <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded">
              Gemini
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {aiInsights.map((insight) => (
              <div
                key={insight.id}
                className={`rounded-xl border p-3 text-xs ${
                  insight.severity === 'WARNING'
                    ? 'border-amber-500/30 bg-amber-500/5 text-amber-200'
                    : 'border-slate-800 bg-slate-950/40 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-white">
                  {insight.severity === 'WARNING' && <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />}
                  <span>{insight.title}</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-300">{insight.text}</p>
                {insight.suggestedAction && (
                  <div className="mt-2 text-[10px] font-semibold text-amber-300">
                    Action: {insight.suggestedAction}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => setActiveTab('ai-manager')}
            className="mt-4 w-full rounded-xl border border-slate-800 bg-slate-900 py-2 text-xs font-semibold text-indigo-300 hover:bg-slate-800 transition-colors"
          >
            Ask AI Assistant Questions →
          </button>
        </div>

        {/* RECENT LEDGER TRANSACTIONS */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Verified Ledger Activity</h3>
            </div>
            <button
              onClick={() => setActiveTab('transactions')}
              className="text-xs font-semibold text-emerald-400 hover:underline"
            >
              View Full Ledger →
            </button>
          </div>

          <div className="mt-4 divide-y divide-slate-800/60">
            {transactions.slice(0, 5).map((txn) => (
              <div key={txn.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      txn.type === 'Contribution' || txn.type === 'Deposit'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {txn.type === 'Contribution' ? (
                      <ArrowDownLeft className="h-4 w-4" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-white">{txn.description}</div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span>{txn.userName}</span>
                      <span>•</span>
                      <span className="font-mono">{txn.paymentReference}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`font-mono font-bold ${
                      txn.type === 'Contribution' ? 'text-emerald-400' : 'text-slate-200'
                    }`}
                  >
                    {txn.type === 'Contribution' ? '+' : '-'}
                    {formatCurrency(txn.amount)}
                  </div>
                  <span
                    className={`inline-block text-[10px] rounded px-1.5 py-0.2 font-semibold ${
                      txn.status === 'COMPLETED'
                        ? 'text-emerald-400 bg-emerald-500/10'
                        : 'text-amber-400 bg-amber-500/10'
                    }`}
                  >
                    {txn.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
