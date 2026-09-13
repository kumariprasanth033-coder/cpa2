import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PaymentMode } from '../../types';
import {
  Wallet,
  Shield,
  Bell,
  QrCode,
  CheckCircle2,
  ChevronDown,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    paymentMode,
    setPaymentMode,
    currentUser,
    activeGroup,
    groups,
    setSelectedGroupId,
    unreadNotificationCount,
    setQuickActionModal,
  } = useApp();

  const [modeDropdownOpen, setModeDropdownOpen] = useState(false);
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab('landing')}
            className="group flex items-center gap-3 text-left focus:outline-none"
          >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
                <span className="font-mono text-base font-black tracking-wider text-emerald-400">CPA</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                  CPA
                </span>
                <span className="hidden sm:inline-block rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                  CENTRALIZED
                </span>
              </div>
              <p className="hidden text-[11px] text-slate-400 md:block">One Pocket. One Group.</p>
            </div>
          </button>

          {/* Group Quick Selector (When inside app view) */}
          {activeTab !== 'landing' && (
            <div className="relative hidden md:block">
              <button
                onClick={() => setGroupDropdownOpen(!groupDropdownOpen)}
                className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-700 hover:bg-slate-800 transition-all"
              >
                <Layers className="h-3.5 w-3.5 text-emerald-400" />
                <span className="max-w-[140px] truncate font-semibold">
                  {activeGroup?.name || 'CSE CANTEEN FUND'}
                </span>
                <span className="font-mono text-[10px] text-slate-400">
                  ({activeGroup?.cpaNumber.split('-').pop()})
                </span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

              {groupDropdownOpen && (
                <div className="absolute left-0 mt-2 w-64 rounded-xl border border-slate-800 bg-slate-900 p-1.5 shadow-2xl shadow-black/80 z-50">
                  <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Switch Active Group CPA
                  </div>
                  {groups.map((grp) => (
                    <button
                      key={grp.id}
                      onClick={() => {
                        setSelectedGroupId(grp.id);
                        setGroupDropdownOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                        activeGroup?.id === grp.id
                          ? 'bg-emerald-500/15 text-emerald-300 font-medium'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="truncate">
                        <div className="font-semibold">{grp.name}</div>
                        <div className="font-mono text-[10px] text-slate-400">{grp.cpaNumber}</div>
                      </div>
                      {activeGroup?.id === grp.id && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      )}
                    </button>
                  ))}
                  <div className="mt-1 border-t border-slate-800 pt-1">
                    <button
                      onClick={() => {
                        setQuickActionModal('create-group');
                        setGroupDropdownOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-emerald-400 hover:bg-slate-800 transition-colors"
                    >
                      + Create New Group CPA
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Tools & Navigation */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Mode Switcher Pill (DEMO / TEST / LIVE) */}
          <div className="relative">
            <button
              onClick={() => setModeDropdownOpen(!modeDropdownOpen)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all border ${
                paymentMode === 'TEST'
                  ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20'
                  : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse"></span>
              <span>{paymentMode} MODE</span>
              <ChevronDown className="h-3 w-3" />
            </button>

            {modeDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl shadow-black/90 z-50 text-xs">
                <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold text-slate-400">
                  <Info className="h-3.5 w-3.5" />
                  Payment & Ledger Environment
                </div>
                {(['TEST', 'LIVE'] as PaymentMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      setPaymentMode(mode);
                      setModeDropdownOpen(false);
                    }}
                    className={`mt-1 flex w-full flex-col rounded-lg p-2 text-left transition-colors ${
                      paymentMode === mode
                        ? 'bg-slate-800 border border-slate-700 text-white'
                        : 'text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span>{mode} MODE</span>
                      {paymentMode === mode && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                    </div>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      {mode === 'TEST' && 'Developer gateway sandbox test keys. HMAC verified.'}
                      {mode === 'LIVE' && 'Real banking & payment gateway. Requires KYC onboarding.'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Scan QR Shortcut */}
          <button
            onClick={() => setQuickActionModal('scan-qr')}
            title="Scan Join or Contribution QR"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:text-white transition-all"
          >
            <QrCode className="h-4 w-4" />
          </button>

          {/* Notifications Center Icon */}
          <button
            onClick={() => setActiveTab('notifications')}
            title="Notifications & Approval Alerts"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:text-white transition-all"
          >
            <Bell className="h-4 w-4" />
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-slate-950">
                {unreadNotificationCount}
              </span>
            )}
          </button>

          {/* User Profile Mini Trigger */}
          <button
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 p-1 pl-2 hover:border-slate-700 transition-all"
          >
            <span className="hidden text-xs font-semibold text-slate-200 sm:inline">
              {currentUser.fullName.split(' ')[0]}
            </span>
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.fullName}
              className="h-7 w-7 rounded-md object-cover border border-slate-700"
            />
          </button>
        </div>
      </div>
    </header>
  );
};
