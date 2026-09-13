import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export const NotificationsView: React.FC = () => {
  const { notifications, markAllNotificationsAsRead } = useApp();

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Bell className="h-6 w-6 text-emerald-400" />
            <span>Activity Notifications</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time updates regarding join requests, ledger credits, and multi-signature approvals.
          </p>
        </div>

        <button
          onClick={markAllNotificationsAsRead}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200 cursor-pointer"
        >
          <CheckCheck className="h-4 w-4 text-emerald-400" />
          <span>Mark All Read</span>
        </button>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center text-xs text-slate-500">
            No notifications yet.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-2xl border p-4 text-xs transition-all ${
                !n.isRead
                  ? 'border-emerald-500/30 bg-emerald-500/5 shadow-md shadow-emerald-500/5'
                  : 'border-slate-800 bg-slate-900/50 text-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                      n.type === 'CONTRIBUTION'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : n.type === 'APPROVAL'
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-indigo-500/10 text-indigo-400'
                    }`}
                  >
                    {n.type === 'CONTRIBUTION' ? (
                      <HeartHandshake className="h-4 w-4" />
                    ) : n.type === 'APPROVAL' ? (
                      <ShieldCheck className="h-4 w-4" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{n.title}</h4>
                    <p className="mt-1 text-slate-300">{n.message}</p>
                  </div>
                </div>

                <span className="text-[10px] text-slate-500 whitespace-nowrap">
                  {new Date(n.createdAt || (n as any).timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
