import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { safeApiRequest } from '../../lib/api';
import {
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Lock,
  ArrowRight,
  LogIn,
  UserPlus,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface InvitationDetails {
  id?: string;
  groupId: string;
  groupName: string;
  groupCode?: string;
  cpaNumber: string;
  purpose: string;
  description?: string;
  inviterName?: string;
  inviteeName?: string;
  inviteePhone?: string;
  status?: string;
  requiresPin?: boolean;
}

export const JoinInviteView: React.FC = () => {
  const { isLoggedIn, currentUser, login, register, createJoinRequest, groups, setSelectedGroupId, setActiveTab } = useApp();

  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Request form state
  const [reason, setReason] = useState('Joining CPA group pocket');
  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Auth toggle if not logged in
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const invQueryToken = searchParams.get('inv');
    const pathParts = window.location.pathname.split('/');
    const pathToken = pathParts[2] || searchParams.get('token') || '';
    const resolvedToken = invQueryToken || pathToken;
    setToken(resolvedToken);

    if (!resolvedToken) {
      setLoading(false);
      setFetchError('No invitation token provided in URL.');
      return;
    }

    const resolveToken = async () => {
      setLoading(true);
      setFetchError(null);

      try {
        // Try invitation endpoint first (with invQueryToken if present, else resolvedToken)
        let invRes = await safeApiRequest<{ success: boolean; invitation?: any; error?: string }>(
          `/api/invitations/${encodeURIComponent(resolvedToken)}`
        );

        if ((!invRes.ok || !invRes.data?.success) && pathToken && pathToken !== resolvedToken) {
          invRes = await safeApiRequest<{ success: boolean; invitation?: any; error?: string }>(
            `/api/invitations/${encodeURIComponent(pathToken)}`
          );
        }

        if (invRes.ok && invRes.data?.success && invRes.data.invitation) {
          const inv = invRes.data.invitation;
          setInvitation({
            id: inv.id,
            groupId: inv.groupId,
            groupName: inv.groupName,
            groupCode: inv.groupCode,
            cpaNumber: inv.cpaNumber,
            purpose: inv.purpose,
            description: inv.description,
            inviterName: inv.inviterName,
            inviteeName: inv.inviteeName,
            inviteePhone: inv.inviteePhone,
            status: inv.status,
          });
          if (inv.inviteeName) setAuthName(inv.inviteeName);
          if (inv.inviteePhone) setAuthPhone(inv.inviteePhone.replace('+91', ''));
          setLoading(false);
          return;
        }

        // Otherwise try QR/secure token resolver
        const qrRes = await safeApiRequest<{ success: boolean; group?: any; error?: string }>(
          `/api/groups/resolve-qr?token=${encodeURIComponent(pathToken)}`
        );

        if (qrRes.ok && qrRes.data?.success && qrRes.data.group) {
          const grp = qrRes.data.group;
          setInvitation({
            groupId: grp.id,
            groupName: grp.name,
            groupCode: grp.groupCode,
            cpaNumber: grp.cpaNumber,
            purpose: grp.purpose,
            description: grp.description,
            requiresPin: grp.requiresPin,
          });
          setLoading(false);
          return;
        }

        setFetchError(invRes.data?.error || qrRes.data?.error || 'Invitation not found or has expired.');
      } catch (err: any) {
        setFetchError('Failed to load invitation. Please verify your connection.');
      } finally {
        setLoading(false);
      }
    };

    resolveToken();
  }, []);

  const isAlreadyMember = Boolean(
    isLoggedIn && invitation && groups.some((g) => g.id === invitation.groupId)
  );

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const res = await createJoinRequest(invitation.groupId, reason.trim(), pin.trim() || undefined);
    setIsSubmitting(false);

    if (res.success) {
      setRequestSuccess(true);
    } else {
      setSubmitError(res.error || 'Failed to submit join request.');
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthenticating(true);

    try {
      if (authMode === 'LOGIN') {
        const res = await login(authEmail.trim(), authPassword, true);
        if (!res.success) {
          setAuthError(res.error || 'Login failed. Please check credentials.');
        }
      } else {
        const res = await register(authEmail.trim(), authPassword, authName.trim(), authPhone.trim() || undefined);
        if (!res.success) {
          setAuthError(res.error || 'Registration failed.');
        }
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const navigateToGroup = () => {
    if (invitation) {
      setSelectedGroupId(invitation.groupId);
    }
    // Clean URL
    window.history.pushState({}, '', '/');
    setActiveTab('groups');
  };

  const navigateToDashboard = () => {
    window.history.pushState({}, '', '/');
    setActiveTab('dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        {/* Header Branding */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950 font-mono text-base font-black text-emerald-400">
                CPA
              </div>
            </div>
            <div>
              <div className="text-base font-bold text-white">Centralized Pocket Account</div>
              <div className="text-[11px] text-slate-400">Secure Group Invitation Flow</div>
            </div>
          </div>
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
            PROTECTED
          </span>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-12 text-center text-xs text-slate-400">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent mb-3" />
            <p>Validating CPA invitation and group credentials...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && fetchError && (
          <div className="space-y-4 text-center py-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-400">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white">Invalid or Expired Invitation</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">{fetchError}</p>
            <button
              onClick={navigateToDashboard}
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              <span>Return to CPA Platform</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Loaded Invitation View */}
        {!loading && invitation && (
          <div className="space-y-5 text-xs">
            {/* Group Banner */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-emerald-400 bg-slate-900 px-2 py-0.5 rounded border border-emerald-500/20">
                  {invitation.cpaNumber}
                </span>
                <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  {invitation.purpose}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-2">{invitation.groupName}</h2>
              {invitation.description && (
                <p className="text-slate-300 text-[11px] mt-1">{invitation.description}</p>
              )}
              {invitation.inviterName && (
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-300 font-semibold border-t border-emerald-500/20 pt-2">
                  <Users className="h-3.5 w-3.5" />
                  <span>Invited by {invitation.inviterName}</span>
                </div>
              )}
            </div>

            {/* If Already Member */}
            {isAlreadyMember && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-center space-y-3">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
                <div className="font-bold text-white text-sm">You are already an active member!</div>
                <p className="text-[11px] text-slate-400">
                  You already belong to this CPA group pocket. You can view the ledger and manage contributions.
                </p>
                <button
                  onClick={navigateToGroup}
                  className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 font-bold text-white transition-colors cursor-pointer text-xs"
                >
                  Go to Group CPA →
                </button>
              </div>
            )}

            {/* If Request Submitted Successfully */}
            {requestSuccess && !isAlreadyMember && (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-5 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-white">Join Request Submitted</h3>
                <div className="inline-block rounded-full bg-amber-500/20 border border-amber-500/30 px-3 py-1 font-mono text-[11px] font-bold text-amber-300">
                  STATUS: PENDING LEADER APPROVAL
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed max-w-sm mx-auto">
                  In accordance with CPA governance, new members must be reviewed and approved by the group leader.
                  You will receive a notification as soon as your membership is approved.
                </p>
                <button
                  onClick={navigateToDashboard}
                  className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 font-bold text-white transition-colors cursor-pointer text-xs"
                >
                  Back to Dashboard
                </button>
              </div>
            )}

            {/* If Logged In & Not Yet Submitted */}
            {isLoggedIn && !isAlreadyMember && !requestSuccess && (
              <form onSubmit={handleJoinSubmit} className="space-y-4">
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 flex items-start gap-2.5">
                  <Lock className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-white text-xs">Approval Required</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Opening this link submits an official join request to the group leader. You will not be added
                      automatically.
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Applying As</label>
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-200">
                    <span className="font-bold">{currentUser?.fullName}</span>
                    <span className="text-slate-400 text-[11px] ml-2 font-mono">({currentUser?.phone || currentUser?.email})</span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Message to Group Leader</label>
                  <input
                    type="text"
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Joined via invite link from Rahul"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {invitation.requiresPin && (
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Group Security PIN *</label>
                    <input
                      type="password"
                      required
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="Enter 4-6 digit group PIN"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                )}

                {submitError && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-rose-300 text-xs">
                    {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 font-bold text-white hover:from-emerald-500 hover:to-teal-500 transition-all cursor-pointer shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting Application...' : 'Request to Join Group'}
                </button>
              </form>
            )}

            {/* If NOT Logged In */}
            {!isLoggedIn && (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-white text-xs">Sign In or Register to Submit Join Request</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      To safeguard group funds, members must authenticate with their verified CPA credentials.
                    </div>
                  </div>
                </div>

                {/* Subtabs Login / Register */}
                <div className="flex border-b border-slate-800 pb-1 gap-2">
                  <button
                    type="button"
                    onClick={() => setAuthMode('LOGIN')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                      authMode === 'LOGIN'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    <span>Sign In</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('REGISTER')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                      authMode === 'REGISTER'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Create Account</span>
                  </button>
                </div>

                <form onSubmit={handleAuthSubmit} className="space-y-3">
                  {authMode === 'REGISTER' && (
                    <>
                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={authName}
                          onChange={(e) => setAuthName(e.target.value)}
                          placeholder="Your Full Name"
                          className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">Mobile Number (Indian +91)</label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-800 bg-slate-900 text-slate-400 font-mono text-xs">
                            +91
                          </span>
                          <input
                            type="tel"
                            value={authPhone}
                            onChange={(e) => setAuthPhone(e.target.value)}
                            placeholder="10-digit mobile number"
                            className="w-full rounded-r-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none font-mono"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Password *</label>
                    <input
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  {authError && (
                    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-rose-300 text-xs">
                      {authError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isAuthenticating}
                    className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 font-bold text-white hover:from-emerald-500 hover:to-teal-500 transition-all cursor-pointer shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                  >
                    {isAuthenticating
                      ? 'Authenticating...'
                      : authMode === 'LOGIN'
                      ? 'Sign In & Continue'
                      : 'Register & Continue'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
