import React from 'react';
import { useApp, MainNavTab } from '../../context/AppContext';
import {
  LayoutDashboard,
  WalletCards,
  Users,
  MessageSquare,
  Receipt,
  PieChart,
  Target,
  Compass,
  Sparkles,
  ShieldCheck,
  Bell,
  User,
  Settings,
  ShieldAlert,
  PlusCircle,
  QrCode,
  Lock,
  Building2,
} from 'lucide-react';

interface NavItem {
  id: MainNavTab;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeColor?: string;
}

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    unreadNotificationCount,
    approvalRequests,
    chatMessages,
    setQuickActionModal,
    activeGroup,
    currentUser,
  } = useApp();

  const pendingApprovalsCount = approvalRequests.filter((r) => r.status === 'PENDING').length;

  const navItems: NavItem[] = [
    ...(currentUser.role === 'SYSTEM_ADMIN'
      ? [
          {
            id: 'admin-dashboard' as MainNavTab,
            label: 'Admin Operations',
            icon: Building2,
            badge: 'Admin',
            badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/40',
          },
        ]
      : []),
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'my-cpa', label: 'My CPA', icon: WalletCards },
    { id: 'groups', label: 'Groups', icon: Users, badge: activeGroup ? '1 Active' : undefined },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: chatMessages.length > 0 ? 'Live' : undefined, badgeColor: 'bg-emerald-500/20 text-emerald-300' },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'split-expense', label: 'Split Expense', icon: PieChart },
    { id: 'collections', label: 'Collections', icon: Target },
    { id: 'goals', label: 'Goals', icon: Compass },
    { id: 'ai-manager', label: 'AI Manager', icon: Sparkles, badge: 'Gemini', badgeColor: 'bg-indigo-500/20 text-indigo-300' },
    { id: 'approvals', label: 'Approvals', icon: ShieldCheck, badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined, badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/40' },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotificationCount > 0 ? unreadNotificationCount : undefined, badgeColor: 'bg-emerald-500 text-slate-950 font-bold' },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'trust-center', label: 'Trust & Security', icon: ShieldAlert },
  ];

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-slate-800/80 bg-slate-950/60 p-4 shrink-0">
      {/* Quick Group Highlight Card */}
      {activeGroup && (
        <div className="mb-4 rounded-xl border border-slate-800/80 bg-gradient-to-b from-slate-900/90 to-slate-900/40 p-3 shadow-inner">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-emerald-400">Active Pocket</span>
            <span className="font-mono text-[10px]">{activeGroup.cpaNumber}</span>
          </div>
          <div className="mt-1 font-bold text-sm text-slate-100 truncate">{activeGroup.name}</div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
            <Lock className="h-3 w-3 text-emerald-400" />
            <span>Leader Approval Enforced</span>
          </div>
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] ${
                    item.badgeColor || 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Floating Action Trigger in Sidebar */}
      <div className="mt-4 border-t border-slate-800/80 pt-4 space-y-2">
        <button
          onClick={() => setQuickActionModal('create-group')}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500 transition-all cursor-pointer"
        >
          <PlusCircle className="h-4 w-4" />
          <span>New Group CPA</span>
        </button>

        <button
          onClick={() => setQuickActionModal('scan-qr')}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:text-white transition-all cursor-pointer"
        >
          <QrCode className="h-4 w-4 text-emerald-400" />
          <span>Scan CPA QR</span>
        </button>
      </div>
    </aside>
  );
};
