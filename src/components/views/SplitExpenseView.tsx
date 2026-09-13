import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  PieChart,
  Users,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  Shield,
  MessageSquare,
} from 'lucide-react';

export const SplitExpenseView: React.FC = () => {
  const { activeGroup, members, formatCurrency, sendChatMessage, recordExpense, setActiveTab } = useApp();

  const groupMembers = (members || []).filter((m) => m.groupId === activeGroup?.id);

  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState<number>(600);
  const [splitMethod, setSplitMethod] = useState<'EQUAL' | 'PERCENTAGE' | 'EXACT'>('EQUAL');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
    (groupMembers || []).map((m) => m.userId)
  );
  const [isSuccess, setIsSuccess] = useState(false);

  const toggleMember = (id: string) => {
    if (selectedMemberIds.includes(id)) {
      if (selectedMemberIds.length > 1) {
        setSelectedMemberIds(selectedMemberIds.filter((m) => m !== id));
      }
    } else {
      setSelectedMemberIds([...selectedMemberIds, id]);
    }
  };

  const perPersonAmount =
    selectedMemberIds.length > 0 ? Math.round(totalAmount / selectedMemberIds.length) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || totalAmount <= 0 || selectedMemberIds.length === 0) return;

    // Record expense in CPA ledger
    recordExpense({
      title,
      totalAmount,
      splitType: splitMethod,
      category: 'Food & Snacks',
      splits: selectedMemberIds.map((uid) => {
        const m = (groupMembers || []).find((gm) => gm.userId === uid);
        return {
          userId: uid,
          userName: m?.user?.fullName || 'Member',
          amount: perPersonAmount,
          hasSettled: false,
        };
      }),
    });

    // Post to group chat
    sendChatMessage(
      `Shared Expense Added: "${title}" for ₹${totalAmount.toLocaleString()} split equally between ${
        selectedMemberIds.length
      } members (₹${perPersonAmount} each).`
    );

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setTitle('');
      setActiveTab('messages');
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
          <PieChart className="h-6 w-6 text-emerald-400" />
          <span>Split Group Expense</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Distribute costs seamlessly across members and notify everyone automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form Panel */}
        <div className="md:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Expense Title</label>
              <input
                type="text"
                placeholder="e.g., Friday Canteen Snacks, Lab Manual Prints"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Total Amount (₹)</label>
                <input
                  type="number"
                  value={totalAmount || ''}
                  onChange={(e) => setTotalAmount(Math.max(1, Number(e.target.value)))}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-white font-mono font-bold focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Split Method</label>
                <select
                  value={splitMethod}
                  onChange={(e) => setSplitMethod(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="EQUAL">Split Equally</option>
                  <option value="PERCENTAGE">By Percentage (%)</option>
                  <option value="EXACT">Custom Exact Amount</option>
                </select>
              </div>
            </div>

            {/* Member Selection */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-slate-300 font-semibold">Participating Members ({selectedMemberIds.length})</label>
                <button
                  type="button"
                  onClick={() => setSelectedMemberIds(groupMembers.map((m) => m.userId))}
                  className="text-[11px] text-emerald-400 hover:underline"
                >
                  Select All
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {groupMembers.map((m) => {
                  const isSelected = selectedMemberIds.includes(m.userId);
                  return (
                    <div
                      key={m.id}
                      onClick={() => toggleMember(m.userId)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-white'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-4 w-4 rounded flex items-center justify-center border ${
                            isSelected ? 'bg-emerald-500 border-emerald-400' : 'border-slate-700'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="h-3 w-3 text-slate-950" />}
                        </div>
                        <span className="font-semibold text-xs">{m.user.fullName}</span>
                      </div>
                      <span className="font-mono text-xs font-bold text-emerald-400">
                        {isSelected ? `₹${perPersonAmount}` : 'Excluded'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {isSuccess && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-emerald-300 font-bold text-center">
                ✓ Expense successfully logged and announced to group chat!
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 text-xs font-bold text-white transition-colors cursor-pointer shadow-lg shadow-emerald-600/20"
            >
              <span>Record Expense & Notify Group</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Summary Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 text-xs">
          <h3 className="font-bold text-white">Expense Summary</h3>
          <div className="rounded-xl bg-slate-950/80 p-4 border border-slate-800 space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Bill:</span>
              <span className="font-mono font-bold text-white">₹{totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Participants:</span>
              <span className="font-bold text-emerald-400">{selectedMemberIds.length} members</span>
            </div>
            <div className="border-t border-slate-800 pt-2 flex justify-between">
              <span className="text-slate-300 font-semibold">Per Person Share:</span>
              <span className="font-mono font-bold text-emerald-300 text-sm">
                ₹{perPersonAmount.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3 text-[11px] text-slate-400 leading-relaxed">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold mb-1">
              <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
              <span>Automatic Settlement Reminders</span>
            </div>
            When created, an interactive financial card is dispatched to the group chat with one-click payment links.
          </div>
        </div>
      </div>
    </div>
  );
};
