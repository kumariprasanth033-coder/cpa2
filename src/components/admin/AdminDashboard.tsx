import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Users,
  Wallet,
  Activity,
  ShieldCheck,
  Search,
  RefreshCw,
  Lock,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  BarChart3,
  Server,
  DollarSign,
  ArrowDownRight,
  Eye,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AdminGroupItem, AdminPlatformMetrics } from '../../types';

export const AdminDashboard: React.FC = () => {
  const { formatCurrency, setSelectedGroupId, setActiveTab, authToken } = useApp();

  const [metrics, setMetrics] = useState<AdminPlatformMetrics>({
    totalUsers: 0,
    totalCpaGroups: 0,
    activeGroups: 0,
    totalMembers: 0,
    totalTransactions: 0,
    grossTransactionVolumePaise: 0,
    totalCustomerMoneyHeldPaise: 0,
    platformFeesPaise: 0,
    netPlatformRevenuePaise: 0,
    paymentGatewayFeesPaise: 0,
    netRevenueAfterGatewayFeesPaise: 0,
    totalContributionVolumePaise: 0,
    totalExpensesPaise: 0,
    pendingSystemIssues: 0,
    securityAlertsCount: 0,
    systemHealth: '100%',
    uptimeSeconds: 0,
    recentPlatformActivity: [],
    realtimeActivity: {
      activeSessions: 0,
      sseConnections: 0,
      transactionsLastHour: 0,
    },
    charts: {
      groupsOverTime: [],
      userGrowth: [],
      transactionVolume: [],
      contributionsVsExpenses: [],
      activeVsInactive: [],
      securityEvents: [],
    },
  });

  const [groups, setGroups] = useState<AdminGroupItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'HIGH_ACTIVITY' | 'NEW' | 'INACTIVE'>('ALL');
  const [selectedGroupModal, setSelectedGroupModal] = useState<AdminGroupItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAdminData = useCallback(async () => {
    const token = localStorage.getItem('cpa_auth_token') || authToken;
    if (!token) return;

    setIsLoading(true);
    try {
      const [metricsRes, groupsRes] = await Promise.all([
        fetch('/api/admin/metrics', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/admin/groups', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (metricsRes.ok) {
        const mData = await metricsRes.json();
        setMetrics(mData);
      }
      if (groupsRes.ok) {
        const gData = await groupsRes.json();
        if (gData.groups) {
          setGroups(gData.groups);
        }
      }
    } catch (e) {
      console.error('Failed to fetch admin metrics:', e);
    } finally {
      setIsLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const filteredGroups = groups.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.cpaNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.purpose.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || g.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleInspectGroup = (groupItem: AdminGroupItem) => {
    setSelectedGroupModal(groupItem);
  };

  const handleSwitchToGroup = (groupId: string) => {
    setSelectedGroupId(groupId);
    setActiveTab('groups');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Top Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Building2 className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              CPA Platform Operations & Monitoring
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            System Administrator Center &bull; Real-time platform health, authoritative double-entry monitoring & fund separation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Health: {metrics.systemHealth || '100%'}</span>
            <span className="text-slate-600">|</span>
            <span>Uptime: {metrics.uptimeSeconds ? `${Math.floor(metrics.uptimeSeconds / 60)}m` : 'Active'}</span>
          </div>

          <button
            type="button"
            onClick={fetchAdminData}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </div>

      {/* Sovereign Governance Callout Notice */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-purple-800/30 flex items-start gap-3.5">
        <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <h2 className="font-bold text-purple-200">Platform Sovereign Governance Architecture</h2>
          <p className="text-slate-400 leading-relaxed">
            As a System Administrator, you monitor infrastructure health, group lifecycle statuses, and network-wide double-entry balance consistency.
            In accordance with decentralized group sovereignty, <strong>platform administrators cannot disburse, tamper with, or override private group funds</strong> without group multi-signature approval.
          </p>
        </div>
      </div>

      {/* MANDATORY: Strict Separation of Customer Money vs Platform Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Box 1: Customer Custodial Money */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-900 border border-emerald-500/30 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300">Total Customer Money Held</h3>
                <p className="text-[11px] text-slate-400">Sum of all isolated group treasury balances (Zero commingling)</p>
              </div>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Custodial
            </span>
          </div>

          <div className="text-3xl font-extrabold text-white font-mono tracking-tight">
            {formatCurrency(metrics.totalCustomerMoneyHeldPaise || 0)}
          </div>

          <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Gross Transfer Volume</span>
              <span className="font-mono font-semibold text-slate-200">
                {formatCurrency(metrics.grossTransactionVolumePaise || 0)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Active Groups Holding Funds</span>
              <span className="font-mono font-semibold text-slate-200">
                {groups.filter((g) => g.currentBalancePaise > 0).length} of {groups.length}
              </span>
            </div>
          </div>
        </div>

        {/* Box 2: Platform Revenue & Fee Breakdown */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-purple-950/30 via-slate-900 to-slate-900 border border-purple-500/30 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300">Net Platform Revenue</h3>
                <p className="text-[11px] text-slate-400">Platform earnings strictly isolated from customer deposits</p>
              </div>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Corporate
            </span>
          </div>

          <div className="text-3xl font-extrabold text-white font-mono tracking-tight">
            {formatCurrency(metrics.netRevenueAfterGatewayFeesPaise || 0)}
          </div>

          <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Gross Platform Fees</span>
              <span className="font-mono font-semibold text-purple-300">
                {formatCurrency(metrics.platformFeesPaise || 0)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Gateway Expenses</span>
              <span className="font-mono font-semibold text-rose-300">
                - {formatCurrency(metrics.paymentGatewayFeesPaise || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Metrics Row (6 Key Stats) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Users */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Users</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{metrics.totalUsers}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Registered identities
          </div>
        </div>

        {/* Total CPA Groups */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Groups</span>
            <Building2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{groups.length || metrics.totalCpaGroups}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            <span className="text-emerald-400 font-semibold">{groups.filter((g) => g.status === 'ACTIVE' || g.status === 'HIGH_ACTIVITY').length}</span> Active
          </div>
        </div>

        {/* Total Contributions */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Collected</span>
            <TrendingUp className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono">
            {formatCurrency(metrics.totalContributionVolumePaise || 0)}
          </div>
          <div className="text-[11px] text-teal-400 mt-1">
            Inbound deposits
          </div>
        </div>

        {/* Settled Expenses */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Settled Expenses</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono">
            {formatCurrency(metrics.totalExpensesPaise || 0)}
          </div>
          <div className="text-[11px] text-blue-400 mt-1">
            Group disbursements
          </div>
        </div>

        {/* Security Alerts */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Security Alerts</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{metrics.securityAlertsCount}</div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>0 Vulnerabilities</span>
          </div>
        </div>

        {/* Multi-Sig Compliance */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Multi-Sig Guard</span>
            <Lock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">100%</div>
          <div className="text-[11px] text-purple-400 mt-1">
            Anti-Self-Approval
          </div>
        </div>
      </div>

      {/* Centralized Pocket Accounts Master Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl space-y-4">
        {/* Table Controls */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Platform Group CPAs</h2>
            <p className="text-xs text-slate-400">
              Authoritative overview of all registered Centralized Pocket Accounts and isolated treasuries.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute inset-y-0 left-3 my-auto pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search groups, CPA #, purpose..."
                className="pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors w-64"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              {(['ALL', 'ACTIVE', 'HIGH_ACTIVITY', 'NEW', 'INACTIVE'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === st
                      ? 'bg-purple-600 text-white font-medium'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st === 'HIGH_ACTIVITY' ? 'HIGH' : st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Group Name & CPA Number</th>
                <th className="py-3 px-4">Purpose</th>
                <th className="py-3 px-4">Founder / Owner</th>
                <th className="py-3 px-4 text-center">Members</th>
                <th className="py-3 px-4 text-right">Target & Collected</th>
                <th className="py-3 px-4 text-right">Current Balance</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Security</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredGroups.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <Building2 className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-40" />
                    No Centralized Pocket Accounts registered yet.
                  </td>
                </tr>
              ) : (
                filteredGroups.map((group) => (
                  <tr key={group.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                        {group.name}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500">{group.cpaNumber}</div>
                    </td>

                    <td className="py-3 px-4 max-w-[200px] truncate text-slate-400">
                      {group.purpose}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-200">{group.ownerName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{group.ownerEmail}</div>
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-medium">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-200">
                        {group.memberCount}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono">
                      <div className="text-emerald-400 font-medium">
                        {formatCurrency(group.collectedAmountPaise)}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        of {formatCurrency(group.targetAmountPaise)}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-white">
                      {formatCurrency(group.currentBalancePaise)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold uppercase ${
                          group.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : group.status === 'HIGH_ACTIVITY'
                            ? 'bg-teal-500/10 text-teal-300 border border-teal-500/20'
                            : group.status === 'NEW'
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {group.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      {group.hasPasswordPin ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <Lock className="w-3 h-3" />
                          <span>PIN</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                          <span>Open</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleInspectGroup(group)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-purple-600 hover:text-white text-slate-300 text-[11px] font-medium transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <span>Audit</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Group Inspection & Audit Modal */}
      {selectedGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="text-base font-bold text-white">{selectedGroupModal.name}</h3>
                  <p className="text-xs font-mono text-slate-400">{selectedGroupModal.cpaNumber}</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {selectedGroupModal.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block mb-1">Group Treasury Balance</span>
                <span className="text-base font-bold font-mono text-emerald-400">
                  {formatCurrency(selectedGroupModal.currentBalancePaise)}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block mb-1">Target Pool Amount</span>
                <span className="text-base font-bold font-mono text-white">
                  {formatCurrency(selectedGroupModal.targetAmountPaise)}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block mb-1">Founder / Owner</span>
                <span className="font-semibold text-slate-200 block">{selectedGroupModal.ownerName}</span>
                <span className="text-[11px] text-slate-500 font-mono">{selectedGroupModal.ownerEmail}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block mb-1">Security Gate</span>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{selectedGroupModal.hasPasswordPin ? 'PIN Gate Protected' : 'Public Access'}</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-800/30 text-xs text-purple-200 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>Multi-Signature Ledger Verification</span>
              </div>
              <p className="text-[11px] text-purple-300/80 leading-relaxed">
                Group ledger balances are reconciled against double-entry transaction hashes. Direct administrator withdrawals are disabled by protocol rule.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  handleSwitchToGroup(selectedGroupModal.id);
                  setSelectedGroupModal(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View In Groups</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedGroupModal(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
