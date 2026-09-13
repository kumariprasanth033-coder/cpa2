import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useApp, GroupSubTab } from '../../context/AppContext';
import { GroupInvitation } from '../../types';
import {
  Users,
  Wallet,
  Receipt,
  PieChart,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  QrCode,
  FileText,
  Settings,
  HeartHandshake,
  ArrowUpRight,
  Lock,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  PlusCircle,
  Clock,
  Shield,
  Download,
  UserPlus,
  MessageCircle,
  Share2,
} from 'lucide-react';

export const GroupsView: React.FC = () => {
  const {
    activeGroup,
    groups,
    setSelectedGroupId,
    activeGroupTab,
    setActiveGroupTab,
    members,
    joinRequests,
    wallets,
    formatCurrency,
    approveJoinRequest,
    rejectJoinRequest,
    fetchGroupInvitations,
    setQuickActionModal,
    auditLogs,
    aiInsights,
    transactions,
    currentUser,
    setActiveTab,
  } = useApp();

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [joinQrDataUrl, setJoinQrDataUrl] = useState<string>('');
  const [contribQrDataUrl, setContribQrDataUrl] = useState<string>('');
  const [groupInvitations, setGroupInvitations] = useState<GroupInvitation[]>([]);

  useEffect(() => {
    if (!activeGroup) return;
    fetchGroupInvitations(activeGroup.id).then((invs) => setGroupInvitations(invs));
  }, [activeGroup?.id, fetchGroupInvitations]);

  useEffect(() => {
    if (!activeGroup) return;

    // Join URL
    const joinPayload = `${window.location.origin}/join/${activeGroup.secureToken}`;
    QRCode.toDataURL(joinPayload, {
      width: 256,
      margin: 1,
      color: { dark: '#022c22', light: '#ffffff' },
    })
      .then((url) => setJoinQrDataUrl(url))
      .catch((err) => console.error('Error generating join QR:', err));

    // Contribution UPI / Deep link
    const contribPayload = `${window.location.origin}/contribute?groupId=${activeGroup.id}&cpa=${activeGroup.cpaNumber}`;
    QRCode.toDataURL(contribPayload, {
      width: 256,
      margin: 1,
      color: { dark: '#042f2e', light: '#ffffff' },
    })
      .then((url) => setContribQrDataUrl(url))
      .catch((err) => console.error('Error generating contrib QR:', err));
  }, [activeGroup?.id, activeGroup?.secureToken, activeGroup?.cpaNumber]);

  const handleWhatsAppShare = (customJoinUrl?: string) => {
    if (!activeGroup) return;
    const realJoinUrl = customJoinUrl || `${window.location.origin}/join/${activeGroup.secureToken}`;
    const whatsappText = `You are invited to join ${activeGroup.name} on CPA.\n\nPurpose: ${activeGroup.purpose}\nCPA ID: ${activeGroup.cpaNumber}\n\nJoin securely:\n${realJoinUrl}\n\nYour membership requires approval from the group leader.`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const groupWallet = activeGroup ? wallets[activeGroup.walletId] : undefined;
  const groupMembers = members.filter((m) => m.groupId === activeGroup?.id);
  const groupJoinRequests = joinRequests.filter((r) => r.groupId === activeGroup?.id);
  const groupTransactions = transactions.filter((t) => t.cpaId === activeGroup?.id);
  const groupAuditLogs = auditLogs.filter((l) => l.cpaId === activeGroup?.id);

  const subTabs: Array<{ id: GroupSubTab; label: string; icon: React.ElementType; badge?: number }> = [
    { id: 'overview', label: 'Overview', icon: Users },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'contributions', label: 'Contributions', icon: HeartHandshake },
    { id: 'expenses', label: 'Expenses', icon: PieChart },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'members', label: 'Members', icon: Users, badge: groupJoinRequests.filter(r => r.status === 'PENDING').length || undefined },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'approvals', label: 'Approvals', icon: ShieldCheck },
    { id: 'ai', label: 'AI Insights', icon: Sparkles },
    { id: 'qr', label: 'QR & Share', icon: QrCode },
    { id: 'audit', label: 'Audit Log', icon: FileText },
  ];

  const handleCopyLink = () => {
    if (!activeGroup) return;
    navigator.clipboard?.writeText(`${window.location.origin}/join/${activeGroup.secureToken}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    if (!activeGroup) return;
    navigator.clipboard?.writeText(activeGroup.groupCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (!activeGroup) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        No active group found. Create a group CPA to begin.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Group Header Card */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-xs font-bold text-emerald-400">
                {activeGroup.cpaNumber}
              </span>
              <span className="text-xs text-slate-400">Code: <strong className="font-mono text-white">{activeGroup.groupCode}</strong></span>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 font-semibold">
                {activeGroup.purpose}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">{activeGroup.name}</h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">{activeGroup.description}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              id="btn-group-header-add-friends"
              onClick={() => setQuickActionModal('invite-friends')}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3.5 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer shadow-md shadow-indigo-600/20"
            >
              <UserPlus className="h-4 w-4" />
              <span>+ Add Friends</span>
            </button>
            <button
              id="btn-group-header-whatsapp"
              onClick={() => handleWhatsAppShare()}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 px-3 py-2.5 text-xs font-bold text-emerald-300 transition-colors cursor-pointer"
            >
              <MessageCircle className="h-4 w-4 text-emerald-400" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={() => setQuickActionModal('contribute')}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer shadow-md shadow-emerald-600/20"
            >
              <HeartHandshake className="h-4 w-4" />
              <span>Contribute</span>
            </button>
            <button
              onClick={() => setActiveGroupTab('qr')}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-2.5 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
            >
              <QrCode className="h-4 w-4 text-emerald-400" />
              <span>Share & QR</span>
            </button>
          </div>
        </div>

        {/* Financial KPI bar */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-800/80 pt-4">
          <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800/60">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Wallet Balance</span>
            <span className="text-xl font-bold font-mono text-white mt-0.5 block">
              {formatCurrency(groupWallet?.balance || 0)}
            </span>
          </div>
          <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800/60">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Collected</span>
            <span className="text-xl font-bold font-mono text-emerald-400 mt-0.5 block">
              {formatCurrency(activeGroup.collectedAmount)}
            </span>
          </div>
          <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800/60">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Spent</span>
            <span className="text-xl font-bold font-mono text-slate-300 mt-0.5 block">
              {formatCurrency(activeGroup.spentAmount)}
            </span>
          </div>
          <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800/60">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Active Members</span>
            <span className="text-xl font-bold font-mono text-cyan-400 mt-0.5 block">
              {groupMembers.length} Members
            </span>
          </div>
        </div>
      </div>

      {/* Subnavigation Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-800 pb-1 gap-1 text-xs font-semibold scrollbar-none">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeGroupTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveGroupTab(tab.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="rounded-full bg-amber-500 text-slate-950 px-1.5 py-0.2 text-[10px] font-bold">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Subtab Dynamic Views */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 min-h-[400px]">
        {/* TAB: OVERVIEW */}
        {activeGroupTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Progress & Target Card */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
                <h3 className="text-sm font-bold text-white mb-3">Group Target & Velocity</h3>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400">Target: {formatCurrency(activeGroup.targetAmount || 0)}</span>
                  <span className="font-bold text-emerald-400">
                    {Math.round(((activeGroup.collectedAmount || 0) / (activeGroup.targetAmount || 1)) * 100)}%
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(((activeGroup.collectedAmount || 0) / (activeGroup.targetAmount || 1)) * 100)
                      )}%`,
                    }}
                  />
                </div>
                <div className="mt-4 text-[11px] text-slate-400 leading-relaxed">
                  Deadline: <strong>{new Date(activeGroup.deadline || '').toLocaleDateString()}</strong>
                </div>
              </div>

              {/* Security Status Box */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-2">
                  <Lock className="h-4 w-4" />
                  <span>Configured Access Controls</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-2 mt-3">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Join Mode: <strong>Protected (PIN + Leader Approval)</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Anti-Self Approval: <strong>Enforced</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Withdrawal Threshold: <strong>Above ₹1,000 mandates 2 sign-offs</strong></span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Quick Actions in Overview Tab */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-white">Group Member Actions</h4>
                <p className="text-[11px] text-slate-400">Invite new friends, share secure invite links, or display group QR code.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="btn-overview-add-members"
                  onClick={() => setQuickActionModal('invite-friends')}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-2 text-xs font-bold text-white hover:from-emerald-500 hover:to-teal-500 transition-all cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>+ Add Members</span>
                </button>
                <button
                  id="btn-overview-whatsapp"
                  onClick={() => handleWhatsAppShare()}
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-600/20 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-600/30 transition-colors cursor-pointer"
                >
                  <MessageCircle className="h-4 w-4 text-emerald-400" />
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={() => setActiveGroupTab('qr')}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <QrCode className="h-4 w-4 text-slate-400" />
                  <span>View QR</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: MEMBERS & JOIN REQUESTS */}
        {activeGroupTab === 'members' && (
          <div className="space-y-6">
            {/* Pending Requests Section */}
            <div>
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-400" />
                <span>Pending Join Requests ({groupJoinRequests.filter((r) => r.status === 'PENDING').length})</span>
              </h3>
              {groupJoinRequests.filter((r) => r.status === 'PENDING').length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-center text-xs text-slate-400">
                  No applicants waiting in queue.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupJoinRequests
                    .filter((r) => r.status === 'PENDING')
                    .map((req) => (
                      <div key={req.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{req.applicantName}</span>
                          <span className="rounded bg-amber-500/10 text-amber-300 px-1.5 py-0.5 text-[10px]">
                            {req.verificationState}
                          </span>
                        </div>
                        <p className="mt-2 text-slate-300 italic text-[11px]">"{req.reason}"</p>
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => approveJoinRequest(req.id)}
                            className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 py-1.5 text-xs font-bold text-white cursor-pointer"
                          >
                            Approve Membership
                          </button>
                          <button
                            onClick={() => rejectJoinRequest(req.id)}
                            className="rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Active Members List */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white">Active Group Members ({groupMembers.length})</h3>
                <button
                  id="btn-active-members-add-member"
                  onClick={() => setQuickActionModal('invite-friends')}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white transition-colors cursor-pointer shadow-sm"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>+ Add Member</span>
                </button>
              </div>

              {groupMembers.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 text-center text-slate-400">
                  <p className="font-semibold text-white text-xs">No members yet.</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Add members or invite friends to join this CPA group.
                  </p>
                  <button
                    onClick={() => setQuickActionModal('invite-friends')}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-white cursor-pointer"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>+ Add Members</span>
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-800/80 rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
                  {groupMembers.map((m) => (
                    <div key={m.id} className="p-3.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <img
                          src={m.user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={m.user.fullName}
                          className="h-8 w-8 rounded-full object-cover border border-slate-700"
                        />
                        <div>
                          <div className="font-bold text-white">{m.user.fullName}</div>
                          <div className="text-[10px] text-slate-400">{m.user.email}</div>
                        </div>
                      </div>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          m.role === 'OWNER'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : m.role === 'ADMIN'
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            : m.role === 'VIEWER'
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-cyan-500/10 text-cyan-300'
                        }`}
                      >
                        {m.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Friend Invitations Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white">
                  Friend Invitations ({groupInvitations.length})
                </h3>
                <button
                  id="btn-members-tab-invite"
                  onClick={() => setQuickActionModal('invite-friends')}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>+ Invite Friend</span>
                </button>
              </div>

              {groupInvitations.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 text-center text-slate-400">
                  <p>No invitations sent yet.</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Invite friends by mobile number. They can join securely or register with CPA identity.
                  </p>
                  <button
                    onClick={() => setQuickActionModal('invite-friends')}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-white cursor-pointer"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Invite Friends</span>
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-800/80 rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
                  {groupInvitations.map((inv) => (
                    <div key={inv.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">
                            {inv.inviteeName || 'Friend'}
                          </span>
                          <span className="font-mono text-slate-300 text-xs">
                            ({inv.inviteePhone})
                          </span>
                          {inv.isExistingUser ? (
                            <span className="rounded bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 text-[10px] font-semibold">
                              CPA Member
                            </span>
                          ) : (
                            <span className="rounded bg-slate-800 text-slate-400 px-1.5 py-0.5 text-[10px]">
                              New Member
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Invited on {new Date(inv.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            inv.status === 'ACCEPTED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : inv.status === 'JOIN_REQUESTED'
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                              : inv.status === 'OPENED'
                              ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {inv.status}
                        </span>

                        <button
                          onClick={() => handleWhatsAppShare(inv.joinUrl)}
                          className="flex items-center gap-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 px-2.5 py-1 text-xs font-semibold text-emerald-300 transition-colors cursor-pointer"
                        >
                          <MessageCircle className="h-3 w-3 text-emerald-400" />
                          <span>WhatsApp</span>
                        </button>

                        <button
                          onClick={() => {
                            navigator.clipboard?.writeText(inv.joinUrl);
                            setCopiedLink(true);
                            setTimeout(() => setCopiedLink(false), 2000);
                          }}
                          className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                        >
                          <Copy className="h-3 w-3 text-slate-400" />
                          <span>Copy Link</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: QR & SHARE */}
        {activeGroupTab === 'qr' && (
          <div className="space-y-6 max-w-3xl mx-auto text-xs">
            {/* Real WhatsApp Sharing Card */}
            <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-slate-950 via-emerald-950/20 to-slate-950 p-5 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <MessageCircle className="h-5 w-5" />
                    <span>Instant WhatsApp Group Sharing</span>
                  </div>
                  <p className="mt-1 text-slate-300 text-xs">
                    Sends a formatted invite with real Group Name, Purpose, CPA ID, and secure join URL.
                  </p>
                </div>
                <button
                  id="btn-whatsapp-full-share"
                  onClick={() => handleWhatsAppShare()}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 font-bold text-white shadow-lg shadow-emerald-600/20 transition-all cursor-pointer whitespace-nowrap"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Share via WhatsApp</span>
                </button>
              </div>

              {/* Message Preview Box */}
              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-[11px] text-slate-300 font-mono space-y-1">
                <div className="text-slate-500 text-[10px] uppercase tracking-wider font-sans font-bold">Invite Message Template:</div>
                <p>You are invited to join <strong>{activeGroup.name}</strong> on CPA.</p>
                <p>Purpose: {activeGroup.purpose}</p>
                <p>CPA ID: {activeGroup.cpaNumber}</p>
                <p>Join securely: {window.location.origin}/join/{activeGroup.secureToken}</p>
                <p className="text-slate-400">Your membership requires approval from the group leader.</p>
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex items-center gap-2 font-bold text-amber-300 text-xs">
                <Lock className="h-4 w-4" />
                <span>Security Notice: Sharing does not grant auto-membership</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Anyone receiving this link or QR code must pass the group PIN check and will remain in PENDING status
                until approved by you.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* JOIN QR */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Concept A</span>
                <h4 className="text-sm font-bold text-white mt-1">Join CPA QR</h4>
                <p className="text-[11px] text-slate-400 mt-1">Directs applicants to request access</p>

                <div className="my-4 mx-auto flex h-44 w-44 items-center justify-center rounded-xl border border-slate-800 bg-white p-2 shadow-inner">
                  {joinQrDataUrl ? (
                    <img
                      src={joinQrDataUrl}
                      alt="Join CPA QR Code"
                      className="h-40 w-40 object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="text-slate-950 text-center font-mono">
                      <QrCode className="h-32 w-32 mx-auto text-slate-900 animate-pulse" />
                    </div>
                  )}
                </div>

                <div className="mt-3 flex flex-col gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
                  >
                    {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedLink ? 'Link Copied!' : 'Copy Secure Invite Link'}</span>
                  </button>
                  {joinQrDataUrl && (
                    <a
                      href={joinQrDataUrl}
                      download={`join-cpa-${activeGroup.groupCode}.png`}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-850 py-1.5 text-[11px] font-semibold text-slate-300 transition-colors"
                    >
                      <Download className="h-3 w-3" />
                      <span>Download QR PNG</span>
                    </a>
                  )}
                </div>
              </div>

              {/* CONTRIBUTION QR */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">Concept B</span>
                <h4 className="text-sm font-bold text-white mt-1">Contribution QR</h4>
                <p className="text-[11px] text-slate-400 mt-1">Directs contributors to deposit money</p>

                <div className="my-4 mx-auto flex h-44 w-44 items-center justify-center rounded-xl border border-slate-800 bg-white p-2 shadow-inner">
                  {contribQrDataUrl ? (
                    <img
                      src={contribQrDataUrl}
                      alt="Contribution QR Code"
                      className="h-40 w-40 object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="text-slate-950 text-center font-mono">
                      <QrCode className="h-32 w-32 mx-auto text-teal-800 animate-pulse" />
                    </div>
                  )}
                </div>

                <div className="mt-3 flex flex-col gap-2">
                  <button
                    onClick={handleCopyCode}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 py-2 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                  >
                    {copiedCode ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedCode ? 'Code Copied!' : `Copy Group Code (${activeGroup.groupCode})`}</span>
                  </button>
                  {contribQrDataUrl && (
                    <a
                      href={contribQrDataUrl}
                      download={`contribute-cpa-${activeGroup.groupCode}.png`}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-850 py-1.5 text-[11px] font-semibold text-slate-300 transition-colors"
                    >
                      <Download className="h-3 w-3" />
                      <span>Download QR PNG</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: AUDIT LOG */}
        {activeGroupTab === 'audit' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-white">Immutable Security Audit Trail</span>
              <span className="text-[10px] text-slate-400">Non-editable ledger records</span>
            </div>
            {groupAuditLogs.map((log) => (
              <div key={log.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-emerald-400">{log.action}</span>
                  <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
                <div className="mt-1 text-slate-300">
                  By: <strong>{log.actorName}</strong> • Entity: <span className="font-mono">{log.entityType} ({log.entityId})</span>
                </div>
                {log.metadata && (
                  <pre className="mt-2 rounded bg-slate-950 p-2 text-[10px] font-mono text-slate-400 overflow-x-auto">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}

        {/* FALLBACK FOR OTHER SUBTABS (redirect to main views or render summary) */}
        {(activeGroupTab === 'messages' ||
          activeGroupTab === 'approvals' ||
          activeGroupTab === 'transactions' ||
          activeGroupTab === 'wallet' ||
          activeGroupTab === 'contributions' ||
          activeGroupTab === 'expenses' ||
          activeGroupTab === 'ai') && (
          <div className="text-center py-10 text-xs text-slate-300">
            <p className="font-semibold text-white">Viewing {activeGroupTab.toUpperCase()} for {activeGroup.name}</p>
            <p className="text-slate-400 mt-1">You can also access the global multi-group view in the left sidebar.</p>
            <button
              onClick={() => {
                if (activeGroupTab === 'messages') setActiveTab('messages');
                if (activeGroupTab === 'approvals') setActiveTab('approvals');
                if (activeGroupTab === 'transactions') setActiveTab('transactions');
                if (activeGroupTab === 'expenses') setActiveTab('split-expense');
                if (activeGroupTab === 'ai') setActiveTab('ai-manager');
              }}
              className="mt-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 font-bold text-white cursor-pointer"
            >
              Open Full {activeGroupTab.toUpperCase()} Panel →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
