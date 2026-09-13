import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Compass,
  Target,
  TrendingUp,
  Calendar,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
} from 'lucide-react';

export const GoalsView: React.FC = () => {
  const { activeGroup, formatCurrency, setQuickActionModal } = useApp();
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalAmount, setNewGoalAmount] = useState<number>(5000);

  const targetAmount = activeGroup?.targetAmount || 1000000;
  const collectedAmount = activeGroup?.collectedAmount || 750000;
  const pct = Math.min(100, Math.round((collectedAmount / targetAmount) * 100));

  const milestones = [
    { label: 'Initial Seed Deposit', amount: 250000, reached: true, date: 'Mar 2, 2026' },
    { label: 'Halfway Target Pool', amount: 500000, reached: true, date: 'Mar 8, 2026' },
    { label: '75% Velocity Checkpoint', amount: 750000, reached: collectedAmount >= 750000, date: 'Mar 11, 2026' },
    { label: 'Full Semester Treasury Goal', amount: 1000000, reached: collectedAmount >= 1000000, date: 'Target: Oct 31, 2026' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Compass className="h-6 w-6 text-emerald-400" />
            <span>Treasury Goals & Milestone Tracking</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Group target projections, contribution milestones, and predictive velocity analytics.
          </p>
        </div>

        <button
          onClick={() => setQuickActionModal('contribute')}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer shadow-lg shadow-emerald-600/20"
        >
          <Target className="h-4 w-4" />
          <span>Contribute Towards Goal</span>
        </button>
      </div>

      {/* Main Goal Progress Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Primary Goal</span>
            <h2 className="text-xl font-bold text-white mt-1">{activeGroup?.name} Treasury Reserve</h2>
            <p className="text-xs text-slate-400 mt-0.5">Automated target deadline: {activeGroup?.deadline ? new Date(activeGroup.deadline).toLocaleDateString() : 'October 31, 2026'}</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-extrabold text-emerald-400 font-mono">{pct}%</span>
            <span className="text-xs text-slate-400 block">Completed</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-slate-300">
              Current: <strong className="text-white">{formatCurrency(collectedAmount)}</strong>
            </span>
            <span className="text-slate-400">
              Goal: <strong className="text-emerald-400">{formatCurrency(targetAmount)}</strong>
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 mt-2">
            <span>Remaining needed: {formatCurrency(Math.max(0, targetAmount - collectedAmount))}</span>
            <span className="text-emerald-400">Pace: 11 days ahead of schedule</span>
          </div>
        </div>
      </div>

      {/* Milestone List */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>Treasury Milestones</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {milestones.map((m, idx) => (
            <div
              key={idx}
              className={`rounded-xl border p-4 text-xs transition-all ${
                m.reached
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-white'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {m.reached ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Clock className="h-4 w-4 text-slate-500 shrink-0" />
                  )}
                  <span className="font-bold">{m.label}</span>
                </div>
                <span className="font-mono font-bold text-slate-200">{formatCurrency(m.amount)}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 pl-6">{m.date}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
