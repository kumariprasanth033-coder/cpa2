import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Lock,
  UserCheck,
  ArrowUpRight,
} from 'lucide-react';

export const ApprovalsView: React.FC = () => {
  const {
    approvalRequests,
    approveWithdrawalRequest,
    rejectWithdrawalRequest,
    formatCurrency,
    currentUser,
    activeGroup,
  } = useApp();

  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ id: string; message: string; type: 'success' | 'error' } | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const handleApprove = async (requestId: string) => {
    setSubmittingId(requestId);
    const comment = commentInput[requestId] || 'Approved upon review.';
    const res = await approveWithdrawalRequest(requestId, comment);
    setSubmittingId(null);
    setFeedback({
      id: requestId,
      message: res.message,
      type: res.success ? 'success' : 'error',
    });
  };

  const handleReject = async (requestId: string) => {
    setSubmittingId(requestId);
    const res = await rejectWithdrawalRequest(requestId, 'Rejected by authorized member.');
    setSubmittingId(null);
    setFeedback({
      id: requestId,
      message: res.message || 'Withdrawal request rejected.',
      type: res.success ? 'success' : 'error',
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
          <ShieldCheck className="h-6 w-6 text-amber-400" />
          <span>Multi-Signature Approval Queue</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configurable governance: high-value withdrawals require multiple independent member sign-offs. Self-approval is strictly prevented.
        </p>
      </div>

      {/* Threshold Explanation Box */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="font-bold text-slate-300">Incidental (&lt; ₹500)</span>
          <p className="text-[11px] text-slate-400 mt-1">Automatic execution without additional sign-off delay.</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="font-bold text-amber-300">Moderate (₹500 – ₹999)</span>
          <p className="text-[11px] text-slate-400 mt-1">Requires 1 verified peer or leader approval.</p>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <span className="font-bold text-amber-400">High-Value (₹1,000+)</span>
          <p className="text-[11px] text-slate-300 mt-1">Mandates 2 independent approvals before funds can be disbursed.</p>
        </div>
      </div>

      {/* Approval Requests Cards */}
      <div className="space-y-4">
        {approvalRequests.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center text-xs text-slate-500">
            No withdrawal approval requests currently in queue.
          </div>
        ) : (
          approvalRequests.map((req) => {
            const isRequester = req.requesterId === currentUser.id;
            const hasApproved = req.approvers.some((a) => a.userId === currentUser.id);

            return (
              <div
                key={req.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold">
                        {req.status}
                      </span>
                      <span className="text-xs text-slate-400">
                        Requested by <strong className="text-white">{req.requesterName}</strong>
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mt-1">
                      Withdrawal of {formatCurrency(req.amount)}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-400 bg-slate-950 border border-slate-800 px-3 py-1 rounded-lg">
                      {req.approvedCount} of {req.requiredApprovals} Approvals
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">Destination Account</span>
                    <span className="font-mono font-bold text-slate-200 mt-0.5 block truncate">
                      {req.destination}
                    </span>
                  </div>
                  <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">Itemized Purpose / Justification</span>
                    <span className="text-slate-200 mt-0.5 block">{req.reason}</span>
                  </div>
                </div>

                {/* Approvers who have signed */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Sign-Off Verification Trail
                  </span>
                  <div className="space-y-1.5">
                    {req.approvers.map((a, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-2.5 text-xs text-emerald-300"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          <span>{a.userName}</span>
                          <span className="text-[10px] text-slate-400 italic">"{a.comment}"</span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Feedback Message */}
                {feedback?.id === req.id && (
                  <div
                    className={`rounded-xl p-3 text-xs font-semibold ${
                      feedback.type === 'success'
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {feedback.message}
                  </div>
                )}

                {/* Action Buttons if Pending */}
                {req.status === 'PENDING' && (
                  <div className="border-t border-slate-800/80 pt-3">
                    {isRequester ? (
                      <div className="flex items-center gap-2 text-xs text-amber-400/90 italic">
                        <Lock className="h-4 w-4 shrink-0" />
                        <span>Anti-Self-Approval Rule: As the requester, you cannot sign off on your own withdrawal.</span>
                      </div>
                    ) : hasApproved ? (
                      <div className="text-xs text-emerald-400 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>You have already approved this request. Waiting for co-signers if needed.</span>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          placeholder="Optional sign-off comment (e.g. Verified caterer receipt)..."
                          value={commentInput[req.id] || ''}
                          onChange={(e) =>
                            setCommentInput((prev) => ({ ...prev, [req.id]: e.target.value }))
                          }
                          className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                        />
                        <button
                          onClick={() => handleApprove(req.id)}
                          className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleReject(req.id)}
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                        >
                          <XCircle className="h-4 w-4 text-rose-400" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
