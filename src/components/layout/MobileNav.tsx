import React, { useState } from 'react';
import { useApp, MainNavTab, QuickActionType } from '../../context/AppContext';
import {
  Home,
  Users,
  Plus,
  MessageSquare,
  User,
  X,
  CreditCard,
  UserPlus,
  HeartHandshake,
  PieChart,
  Send,
  ArrowUpRight,
} from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { activeTab, setActiveTab, setQuickActionModal, unreadNotificationCount } = useApp();
  const [fabOpen, setFabOpen] = useState(false);

  const handleAction = (action: QuickActionType) => {
    setFabOpen(false);
    setQuickActionModal(action);
  };

  return (
    <>
      {/* Expanded Quick Action FAB overlay */}
      {fabOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setFabOpen(false)}
        >
          <div
            className="absolute bottom-20 left-4 right-4 rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Quick Actions</span>
              <button onClick={() => setFabOpen(false)} className="rounded-lg p-1 text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                onClick={() => handleAction('contribute')}
                className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-800/60 p-3 text-left hover:bg-slate-800"
              >
                <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                  <HeartHandshake className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Contribute</div>
                  <div className="text-[10px] text-slate-400">Send to Pocket</div>
                </div>
              </button>

              <button
                onClick={() => handleAction('split-expense')}
                className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-800/60 p-3 text-left hover:bg-slate-800"
              >
                <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
                  <PieChart className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Split Expense</div>
                  <div className="text-[10px] text-slate-400">Divide group bill</div>
                </div>
              </button>

              <button
                onClick={() => handleAction('create-group')}
                className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-800/60 p-3 text-left hover:bg-slate-800"
              >
                <div className="rounded-lg bg-teal-500/10 p-2 text-teal-400">
                  <UserPlus className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Create Group</div>
                  <div className="text-[10px] text-slate-400">New CPA wallet</div>
                </div>
              </button>

              <button
                id="btn-mobile-quick-add-members"
                onClick={() => handleAction('invite-friends')}
                className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-800/60 p-3 text-left hover:bg-slate-800"
              >
                <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
                  <UserPlus className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Add Members</div>
                  <div className="text-[10px] text-slate-400">Invite to group</div>
                </div>
              </button>

              <button
                onClick={() => handleAction('withdraw')}
                className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-800/60 p-3 text-left hover:bg-slate-800"
              >
                <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Withdraw</div>
                  <div className="text-[10px] text-slate-400">Multi-sig payout</div>
                </div>
              </button>

              <button
                onClick={() => handleAction('add-money')}
                className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-800/60 p-3 text-left hover:bg-slate-800"
              >
                <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Add Money</div>
                  <div className="text-[10px] text-slate-400">Personal wallet</div>
                </div>
              </button>

              <button
                onClick={() => handleAction('pay')}
                className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-800/60 p-3 text-left hover:bg-slate-800"
              >
                <div className="rounded-lg bg-rose-500/10 p-2 text-rose-400">
                  <Send className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Pay Bill</div>
                  <div className="text-[10px] text-slate-400">Direct settlement</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-slate-800 bg-slate-950/95 backdrop-blur-md px-2 lg:hidden">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors ${
            activeTab === 'dashboard' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="h-5 w-5" />
          <span>Home</span>
        </button>

        <button
          onClick={() => setActiveTab('groups')}
          className={`flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors ${
            activeTab === 'groups' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="h-5 w-5" />
          <span>Groups</span>
        </button>

        {/* Center Floating Action Button */}
        <div className="relative -top-5">
          <button
            onClick={() => setFabOpen(!fabOpen)}
            className="flex h-13 w-13 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-xl shadow-emerald-500/30 active:scale-95 transition-transform"
            aria-label="Quick Action Menu"
          >
            <Plus className={`h-6 w-6 transition-transform duration-200 ${fabOpen ? 'rotate-45' : ''}`} />
          </button>
        </div>

        <button
          onClick={() => setActiveTab('messages')}
          className={`flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors relative ${
            activeTab === 'messages' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="h-5 w-5" />
          <span>Messages</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors ${
            activeTab === 'profile' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="h-5 w-5" />
          <span>Profile</span>
        </button>
      </div>
    </>
  );
};
