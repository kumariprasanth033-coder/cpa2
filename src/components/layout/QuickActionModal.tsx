import React, { useState, useRef, useEffect } from 'react';
import jsQR from 'jsqr';
import QRCode from 'qrcode';
import { useApp } from '../../context/AppContext';
import { GroupCPA, GroupInvitation } from '../../types';
import { AddMoneyModalContent } from '../payments/AddMoneyModalContent';
import {
  X,
  PlusCircle,
  HeartHandshake,
  ArrowUpRight,
  PieChart,
  CreditCard,
  Send,
  QrCode,
  ShieldCheck,
  Lock,
  AlertCircle,
  CheckCircle2,
  Users,
  Eye,
  EyeOff,
  Camera,
  Upload,
  RefreshCw,
  Building2,
  Smartphone,
  ExternalLink,
  UserPlus,
  Copy,
  Check,
  Share2,
  MessageCircle,
  Search,
  Phone,
  Clock,
  UserCheck,
  XCircle,
} from 'lucide-react';

export const QuickActionModal: React.FC = () => {
  const {
    quickActionModal,
    setQuickActionModal,
    activeGroup,
    groups,
    setSelectedGroupId,
    formatCurrency,
    createGroupCPA,
    submitWithdrawalRequest,
    recordContribution,
    createJoinRequest,
    createFriendInvitation,
    fetchGroupInvitations,
    cancelGroupInvitation,
    searchCpaUsers,
    joinRequests,
    approveJoinRequest,
    rejectJoinRequest,
    setActiveTab,
    setActiveGroupTab,
    wallets,
    currentUser,
    paymentMode,
    payoutDestinations,
    members,
  } = useApp();

  // Create Group Form State
  const [groupName, setGroupName] = useState('');
  const [groupPurpose, setGroupPurpose] = useState('Shared Expenses');
  const [groupPin, setGroupPin] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [description, setDescription] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isSubmittingGroup, setIsSubmittingGroup] = useState(false);

  // Group Creation Ready & Invite View States
  const [createdGroupData, setCreatedGroupData] = useState<GroupCPA | null>(null);
  const [createdGroupView, setCreatedGroupView] = useState<'READY_OPTIONS' | 'INVITE_FRIENDS' | null>(null);
  const [joinQrDataUrl, setJoinQrDataUrl] = useState<string>('');
  const [contribQrDataUrl, setContribQrDataUrl] = useState<string>('');
  const [activeQrModal, setActiveQrModal] = useState<'JOIN' | 'CONTRIB' | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Invite Friends State
  const [inviteFriendName, setInviteFriendName] = useState('');
  const [inviteMobileNumber, setInviteMobileNumber] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);
  const [invitationResult, setInvitationResult] = useState<GroupInvitation | null>(null);
  const [copiedInviteLink, setCopiedInviteLink] = useState(false);

  // Add Members Tabbed Experience
  const [memberAddTab, setMemberAddTab] = useState<'search' | 'phone' | 'share' | 'members' | 'invitations'>('search');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [invitingUserId, setInvitingUserId] = useState<string | null>(null);
  const [modalInvitations, setModalInvitations] = useState<GroupInvitation[]>([]);
  const [cancellingModalInviteId, setCancellingModalInviteId] = useState<string | null>(null);

  // Contribute Form State
  const [contributeAmount, setContributeAmount] = useState('500');
  const [contributeNote, setContributeNote] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Withdraw Form State
  const [withdrawAmount, setWithdrawAmount] = useState('500');
  const [selectedPayoutId, setSelectedPayoutId] = useState<string>('CUSTOM');
  const [withdrawDestination, setWithdrawDestination] = useState('');
  const [withdrawReason, setWithdrawReason] = useState('');
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);

  // Join Form State
  const [joinGroupCode, setJoinGroupCode] = useState('');
  const [joinPin, setJoinPin] = useState('');
  const [joinReason, setJoinReason] = useState('');

  // QR Scanner State
  const [scanTab, setScanTab] = useState<'upload' | 'camera' | 'manual'>('upload');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualQrInput, setManualQrInput] = useState('');
  const [isResolvingQr, setIsResolvingQr] = useState(false);
  const [resolvedGroup, setResolvedGroup] = useState<any | null>(null);
  const [qrResolveError, setQrResolveError] = useState<string | null>(null);

  // Video / Canvas refs for real-time QR scanning
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Status feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Set default payout destination if available
  useEffect(() => {
    if (payoutDestinations && payoutDestinations.length > 0) {
      const first = payoutDestinations[0];
      setSelectedPayoutId(first.id);
      setWithdrawDestination(first.maskedDestination);
    } else {
      setSelectedPayoutId('CUSTOM');
    }
  }, [payoutDestinations]);

  // Clean up camera stream on close or tab change
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera API is not supported in this browser. Please use the image upload option.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsCameraActive(true);
        requestAnimationFrame(tickCameraScan);
      }
    } catch (err: any) {
      console.warn('Camera access denied or error:', err);
      setCameraError('Camera access unavailable or permission denied. Please upload a QR code image instead.');
      setIsCameraActive(false);
    }
  };

  const tickCameraScan = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });
        if (code && code.data) {
          stopCamera();
          resolveQrPayload(code.data);
          return;
        }
      }
    }
    if (isCameraActive) {
      animationFrameRef.current = requestAnimationFrame(tickCameraScan);
    }
  };

  // Image Upload QR decoding using jsQR
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setQrResolveError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setQrResolveError('Failed to initialize image parser canvas.');
          return;
        }
        ctx.drawImage(img, 0, 0, img.width, img.height);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) {
          resolveQrPayload(code.data);
        } else {
          setQrResolveError('No readable QR code found in the uploaded image. Ensure the image is clear and well-lit.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Resolve QR code against server endpoint
  const resolveQrPayload = async (payload: string) => {
    if (!payload || !payload.trim()) return;
    setIsResolvingQr(true);
    setQrResolveError(null);
    setResolvedGroup(null);
    try {
      const res = await fetch('/api/groups/resolve-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: payload.trim() }),
      });
      const data = await res.json();
      if (data.success && data.group) {
        setResolvedGroup(data.group);
      } else {
        setQrResolveError(data.error || 'Failed to resolve QR code: Group CPA not found.');
      }
    } catch {
      setQrResolveError('Network error while resolving QR code.');
    } finally {
      setIsResolvingQr(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    setFeedback(null);
    setResolvedGroup(null);
    setQrResolveError(null);
    setCreatedGroupData(null);
    setCreatedGroupView(null);
    setActiveQrModal(null);
    setInvitationResult(null);
    setInviteFriendName('');
    setInviteMobileNumber('');
    setInviteEmail('');
    setUserSearchQuery('');
    setUserSearchResults([]);
    setMemberAddTab('search');
    setQuickActionModal(null);
  };

  // Sync group invitations and QRs when modal opens for invite-friends or createdGroupView
  useEffect(() => {
    const targetGroup = createdGroupData || activeGroup;
    if (!targetGroup) return;

    if (quickActionModal === 'invite-friends' || createdGroupView === 'INVITE_FRIENDS') {
      fetchGroupInvitations(targetGroup.id).then((res) => {
        setModalInvitations(res || []);
      });
      generateGroupQrs(targetGroup);
    }
  }, [quickActionModal, createdGroupView, createdGroupData?.id, activeGroup?.id]);

  // Debounced search for registered CPA users
  useEffect(() => {
    const targetGroup = createdGroupData || activeGroup;
    const q = userSearchQuery.trim();
    if (!q || q.length < 2) {
      setUserSearchResults([]);
      setIsSearchingUsers(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        const results = await searchCpaUsers(q, targetGroup?.id);
        setUserSearchResults(results || []);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [userSearchQuery, createdGroupData?.id, activeGroup?.id]);

  const handleInviteSearchedUser = async (user: any) => {
    const targetGroup = createdGroupData || activeGroup;
    if (!targetGroup) return;

    setInvitingUserId(user.id);
    setFeedback(null);
    try {
      const res = await createFriendInvitation(
        targetGroup.id,
        user.fullName || '',
        user.phone || '',
        user.email || undefined
      );
      if (res.success && res.invitation) {
        setInvitationResult(res.invitation);
        setFeedback({
          type: 'success',
          message: `Invitation dispatched to ${user.fullName} (${res.invitation.inviteePhone})!`,
        });
        const updated = await fetchGroupInvitations(targetGroup.id);
        setModalInvitations(updated);
        // Mark as invited in the current search results list
        setUserSearchResults((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, isInvited: true, inviteStatus: 'INVITE_SENT' } : u))
        );
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Failed to send invitation.',
        });
      }
    } finally {
      setInvitingUserId(null);
    }
  };

  const handleCancelModalInvite = async (invitationId: string) => {
    const targetGroup = createdGroupData || activeGroup;
    if (!targetGroup) return;
    setCancellingModalInviteId(invitationId);
    try {
      const res = await cancelGroupInvitation(targetGroup.id, invitationId);
      if (res.success) {
        const updated = await fetchGroupInvitations(targetGroup.id);
        setModalInvitations(updated);
        setFeedback({ type: 'success', message: 'Invitation cancelled.' });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to cancel invitation.' });
      }
    } finally {
      setCancellingModalInviteId(null);
    }
  };

  const generateGroupQrs = async (group: GroupCPA) => {
    try {
      const joinPayload = `${window.location.origin}/join/${group.secureToken}`;
      const jUrl = await QRCode.toDataURL(joinPayload, {
        width: 256,
        margin: 1,
        color: { dark: '#022c22', light: '#ffffff' },
      });
      setJoinQrDataUrl(jUrl);

      const contribPayload = `${window.location.origin}/contribute?groupId=${group.id}&cpa=${group.cpaNumber}`;
      const cUrl = await QRCode.toDataURL(contribPayload, {
        width: 256,
        margin: 1,
        color: { dark: '#042f2e', light: '#ffffff' },
      });
      setContribQrDataUrl(cUrl);
    } catch (err) {
      console.error('Failed to generate QRs:', err);
    }
  };

  const openWhatsAppShare = (group: GroupCPA, customJoinUrl?: string) => {
    const realJoinUrl = customJoinUrl || `${window.location.origin}/join/${group.secureToken}`;
    const whatsappText = `You are invited to join ${group.name} on CPA.\n\nPurpose: ${group.purpose}\nCPA ID: ${group.cpaNumber}\n\nJoin securely:\n${realJoinUrl}\n\nYour membership requires approval from the group leader.`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = (token: string) => {
    const realJoinUrl = `${window.location.origin}/join/${token}`;
    navigator.clipboard?.writeText(realJoinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setFeedback({ type: 'error', message: 'Please enter a valid group name.' });
      return;
    }
    if (!groupPin || groupPin.length < 4) {
      setFeedback({ type: 'error', message: 'Group PIN must be at least 4 digits for security.' });
      return;
    }

    setIsSubmittingGroup(true);
    setFeedback(null);
    const created = await createGroupCPA({
      name: groupName.trim(),
      purpose: groupPurpose,
      description,
      pin: groupPin,
      targetAmount: targetAmount ? parseFloat(targetAmount) : undefined,
    });
    setIsSubmittingGroup(false);

    if (created) {
      setCreatedGroupData(created);
      await generateGroupQrs(created);
      setCreatedGroupView('READY_OPTIONS');
      setFeedback({
        type: 'success',
        message: `Group CPA "${created.name}" created with ID ${created.cpaNumber}!`,
      });
    } else {
      setFeedback({
        type: 'error',
        message: 'Failed to create group. Please check your network and try again.',
      });
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetGroup = createdGroupData || activeGroup;
    if (!targetGroup) {
      setFeedback({ type: 'error', message: 'No target group selected.' });
      return;
    }

    const trimmedPhone = inviteMobileNumber.trim();
    if (!trimmedPhone) {
      setFeedback({ type: 'error', message: 'Mobile number is required to invite friends.' });
      return;
    }

    setIsSubmittingInvite(true);
    setFeedback(null);
    const res = await createFriendInvitation(
      targetGroup.id,
      inviteFriendName.trim(),
      trimmedPhone,
      inviteEmail.trim() || undefined
    );
    setIsSubmittingInvite(false);

    if (res.success && res.invitation) {
      setInvitationResult(res.invitation);
      setFeedback({
        type: 'success',
        message: res.message || `Invitation dispatched to ${res.invitation.inviteePhone}!`,
      });
      fetchGroupInvitations(targetGroup.id).then((updated) => setModalInvitations(updated || []));
    } else {
      setFeedback({
        type: 'error',
        message: res.error || 'Failed to send invitation.',
      });
    }
  };

  const handleAddAnotherFriend = () => {
    setInviteFriendName('');
    setInviteMobileNumber('');
    setInviteEmail('');
    setInvitationResult(null);
    setFeedback(null);
  };

  const handleContribute = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(contributeAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      setFeedback({ type: 'error', message: 'Enter a valid positive contribution amount.' });
      return;
    }
    if (!activeGroup) {
      setFeedback({ type: 'error', message: 'No active group selected.' });
      return;
    }

    const paise = Math.round(amountVal * 100);
    recordContribution(activeGroup.id, paise, contributeNote, isAnonymous);
    setFeedback({
      type: 'success',
      message: `Successfully contributed ${formatCurrency(paise)} to ${activeGroup.name}! Ledger credited.`,
    });
    setTimeout(() => handleClose(), 1600);
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(withdrawAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      setFeedback({ type: 'error', message: 'Enter a valid withdrawal amount.' });
      return;
    }

    let finalDestination = withdrawDestination.trim();
    let payoutDestId: string | undefined = undefined;

    if (selectedPayoutId !== 'CUSTOM') {
      const found = (payoutDestinations || []).find((d) => d.id === selectedPayoutId);
      if (found) {
        finalDestination = found.maskedDestination;
        payoutDestId = found.id;
      }
    }

    if (!finalDestination) {
      setFeedback({ type: 'error', message: 'Please specify destination UPI or Bank account.' });
      return;
    }
    if (!withdrawReason.trim()) {
      setFeedback({ type: 'error', message: 'Please specify itemized reason for withdrawal.' });
      return;
    }
    if (!activeGroup) return;

    setIsSubmittingWithdraw(true);
    const paise = Math.round(amountVal * 100);
    const idempotencyKey = `wd_ui_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const result = await submitWithdrawalRequest(
      activeGroup.id,
      paise,
      finalDestination,
      withdrawReason.trim(),
      payoutDestId,
      idempotencyKey
    );

    setIsSubmittingWithdraw(false);

    if (result.success) {
      setFeedback({ type: 'success', message: result.message });
      setTimeout(() => handleClose(), 1800);
    } else {
      setFeedback({ type: 'error', message: result.message });
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const targetGroupId = activeGroup?.id;
    if (!targetGroupId && !joinGroupCode) {
      setFeedback({ type: 'error', message: 'Please provide group code or token.' });
      return;
    }
    const ok = createJoinRequest(targetGroupId || joinGroupCode, joinReason, joinPin);
    if (ok) {
      setFeedback({
        type: 'success',
        message: 'Join request submitted! Status is PENDING leader approval.',
      });
      setTimeout(() => handleClose(), 1600);
    } else {
      setFeedback({
        type: 'error',
        message: 'Your join request is already pending review by the leader.',
      });
    }
  };

  const activeWallet = activeGroup ? wallets[activeGroup.walletId] : undefined;

  if (!quickActionModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-emerald-500/10 p-1.5 text-emerald-400">
              {quickActionModal === 'create-group' && !createdGroupView && <PlusCircle className="h-5 w-5" />}
              {quickActionModal === 'create-group' && createdGroupView === 'READY_OPTIONS' && <CheckCircle2 className="h-5 w-5" />}
              {(quickActionModal === 'invite-friends' || createdGroupView === 'INVITE_FRIENDS') && <UserPlus className="h-5 w-5" />}
              {quickActionModal === 'contribute' && <HeartHandshake className="h-5 w-5" />}
              {quickActionModal === 'withdraw' && <ArrowUpRight className="h-5 w-5" />}
              {quickActionModal === 'join-cpa' && <Users className="h-5 w-5" />}
              {quickActionModal === 'scan-qr' && <QrCode className="h-5 w-5" />}
              {quickActionModal === 'split-expense' && <PieChart className="h-5 w-5" />}
              {quickActionModal === 'add-money' && <CreditCard className="h-5 w-5" />}
              {quickActionModal === 'pay' && <Send className="h-5 w-5" />}
            </span>
            <h2 className="text-base font-bold text-white">
              {quickActionModal === 'create-group' && (createdGroupView === 'INVITE_FRIENDS' ? 'Add Members to Group' : createdGroupView === 'READY_OPTIONS' ? 'Your CPA Group is Ready' : 'Create Centralized Group CPA')}
              {quickActionModal === 'invite-friends' && 'Add Members to Group'}
              {quickActionModal === 'contribute' && `Contribute to ${activeGroup?.name || 'Group'}`}
              {quickActionModal === 'withdraw' && 'Request Treasury Disbursement'}
              {quickActionModal === 'join-cpa' && 'Request Access to Group CPA'}
              {quickActionModal === 'scan-qr' && 'Scan & Resolve CPA QR Code'}
              {quickActionModal === 'split-expense' && 'Split Group Expense'}
              {quickActionModal === 'add-money' && 'Add Money to Personal Wallet'}
              {quickActionModal === 'pay' && 'Direct Bill Payment'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mt-4 flex items-center gap-2 rounded-xl p-3 text-xs font-medium ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Content based on Action */}
        <div className="mt-4">
          {/* QR PREVIEW MODAL OVERLAY */}
          {activeQrModal && (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">
                  {activeQrModal === 'JOIN' ? 'Join Group QR Code' : 'Group Contribution QR Code'}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveQrModal(null)}
                  className="text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Close QR
                </button>
              </div>

              <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-xl bg-white p-2 shadow-inner">
                <img
                  src={activeQrModal === 'JOIN' ? joinQrDataUrl : contribQrDataUrl}
                  alt="CPA QR Code"
                  className="h-44 w-44 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              <p className="text-[11px] text-slate-400">
                {activeQrModal === 'JOIN'
                  ? 'Scan to request membership access. Requires PIN & leader approval.'
                  : 'Scan to directly make payments and contribute funds to this CPA wallet.'}
              </p>

              <div className="flex gap-2 justify-center">
                <a
                  href={activeQrModal === 'JOIN' ? joinQrDataUrl : contribQrDataUrl}
                  download={`${activeQrModal === 'JOIN' ? 'join' : 'contribute'}-cpa-${(createdGroupData || activeGroup)?.groupCode}.png`}
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-white transition-colors"
                >
                  Download QR PNG
                </a>
                <button
                  type="button"
                  onClick={() => setActiveQrModal(null)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {/* CREATE GROUP MODAL - STAGE 2: POST CREATION READY OPTIONS */}
          {quickActionModal === 'create-group' && createdGroupData && createdGroupView === 'READY_OPTIONS' && (
            <div className="space-y-4 text-xs">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 mb-2">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-white">Your CPA Group is Ready</h3>
                <p className="text-xs text-slate-300 mt-1 font-semibold">{createdGroupData.name}</p>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <span className="font-mono text-xs bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-emerald-400 font-bold">
                    {createdGroupData.cpaNumber}
                  </span>
                  <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    {createdGroupData.purpose}
                  </span>
                </div>
              </div>

              {/* Primary Action Button: [ + Add Members ] */}
              <button
                type="button"
                id="btn-add-members-ready"
                onClick={() => setCreatedGroupView('INVITE_FRIENDS')}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 font-bold text-white hover:from-emerald-500 hover:to-teal-500 transition-all cursor-pointer shadow-lg shadow-emerald-600/20 text-sm"
              >
                <UserPlus className="h-4 w-4" />
                <span>+ Add Members</span>
              </button>

              {/* Real Post-Creation Actions */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  id="btn-whatsapp-share"
                  onClick={() => openWhatsAppShare(createdGroupData)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 py-2.5 font-bold text-emerald-300 transition-colors cursor-pointer"
                >
                  <MessageCircle className="h-4 w-4 text-emerald-400" />
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  id="btn-copy-join-link"
                  onClick={() => handleCopyLink(createdGroupData.secureToken)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 py-2.5 font-semibold text-slate-200 transition-colors cursor-pointer"
                >
                  {copiedLink ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-slate-400" />}
                  <span>{copiedLink ? 'Link Copied!' : 'Copy Join Link'}</span>
                </button>

                <button
                  type="button"
                  id="btn-show-join-qr"
                  onClick={() => setActiveQrModal('JOIN')}
                  className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 py-2.5 font-semibold text-slate-200 transition-colors cursor-pointer"
                >
                  <QrCode className="h-4 w-4 text-emerald-400" />
                  <span>Show Join QR</span>
                </button>

                <button
                  type="button"
                  id="btn-show-contrib-qr"
                  onClick={() => setActiveQrModal('CONTRIB')}
                  className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 py-2.5 font-semibold text-slate-200 transition-colors cursor-pointer"
                >
                  <QrCode className="h-4 w-4 text-teal-400" />
                  <span>Contribution QR</span>
                </button>
              </div>

              <button
                type="button"
                id="btn-open-group"
                onClick={() => {
                  setSelectedGroupId(createdGroupData.id);
                  setActiveTab('groups');
                  handleClose();
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 py-2.5 font-semibold text-slate-300 transition-colors cursor-pointer"
              >
                <span>Open Group</span>
              </button>
            </div>
          )}

          {/* CREATE GROUP MODAL - STAGE 1: CREATION FORM */}
          {quickActionModal === 'create-group' && !createdGroupData && (
            <form onSubmit={handleCreateGroup} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Group Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSE Project 2026 or Flat 402 Expenses"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Purpose Category *</label>
                  <select
                    value={groupPurpose}
                    onChange={(e) => setGroupPurpose(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  >
                    <option>Shared Expenses</option>
                    <option>Team Fund</option>
                    <option>College Activity</option>
                    <option>Project</option>
                    <option>Event</option>
                    <option>Trip</option>
                    <option>Savings</option>
                    <option>Community Collection</option>
                    <option>Emergency Support</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Group Security PIN *</label>
                  <div className="relative">
                    <input
                      type={showPin ? 'text' : 'password'}
                      required
                      placeholder="4-6 digit PIN"
                      value={groupPin}
                      onChange={(e) => setGroupPin(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Target Amount (₹ Optional)</label>
                  <input
                    type="number"
                    placeholder="e.g. 10000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Currency</label>
                  <input
                    type="text"
                    disabled
                    value="INR (₹)"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-2.5 text-slate-400"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Automatic Wallet Provisioning
                </div>
                <p className="mt-1">
                  On creation, a unique CPA ID, Group Wallet ID, Join QR, Contribution QR, secure invite link, and
                  immutable ledger will be initialized automatically.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmittingGroup}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 font-bold text-white hover:from-emerald-500 hover:to-teal-500 transition-all cursor-pointer shadow-lg shadow-emerald-600/20 disabled:opacity-50"
              >
                {isSubmittingGroup ? 'Provisioning Group CPA...' : 'Create Group CPA'}
              </button>
            </form>
          )}

          {/* ADD MEMBERS VIEW (Either from post-creation or direct quick action) */}
          {(quickActionModal === 'invite-friends' || (quickActionModal === 'create-group' && createdGroupView === 'INVITE_FRIENDS')) && (() => {
            const targetGroup = createdGroupData || activeGroup || (groups && groups.length > 0 ? groups[0] : null);
            const currentGroupMembers = (members || []).filter((m) => m.groupId === targetGroup?.id);

            if (!targetGroup) {
              return (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 text-center space-y-3 my-4">
                  <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                    <Users className="h-6 w-6" />
                  </div>
                  <h4 className="font-bold text-white text-base">No Group Pocket Yet</h4>
                  <p className="text-slate-400 text-xs max-w-sm mx-auto">
                    You need an active Group CPA pocket to add friends and members. Create your group in just a few seconds!
                  </p>
                  <button
                    type="button"
                    id="btn-create-first-group-cpa"
                    onClick={() => {
                      setCreatedGroupView(null);
                      setQuickActionModal('create-group');
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500 transition-all cursor-pointer"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Create Group CPA First</span>
                  </button>
                </div>
              );
            }

            return (
              <div className="space-y-4 text-xs">
                {/* Target Group Banner with Switcher */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Target Group Pocket</span>
                      <div className="font-bold text-white text-sm">{targetGroup.name}</div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs text-emerald-400 bg-slate-900 border border-slate-800 px-2 py-1 rounded">
                        {targetGroup.cpaNumber}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">{targetGroup.purpose}</div>
                    </div>
                  </div>

                  {groups && groups.length > 1 && (
                    <div className="flex items-center gap-2 pt-1.5 border-t border-slate-800/80">
                      <span className="text-[10px] text-slate-400 font-semibold whitespace-nowrap">Switch Group:</span>
                      <select
                        id="select-invite-target-group"
                        value={targetGroup.id}
                        onChange={(e) => {
                          const selected = groups.find((g) => g.id === e.target.value);
                          if (selected) {
                            setSelectedGroupId(selected.id);
                            setCreatedGroupData(null);
                            generateGroupQrs(selected);
                            fetchGroupInvitations(selected.id).then((res) => setModalInvitations(res || []));
                          }
                        }}
                        className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none cursor-pointer"
                      >
                        {groups.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name} ({g.cpaNumber}) - {g.purpose}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Subtabs for Adding Members */}
                <div className="flex border-b border-slate-800 pb-1 gap-1 overflow-x-auto">
                  <button
                    type="button"
                    id="tab-search-cpa-users"
                    onClick={() => setMemberAddTab('search')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      memberAddTab === 'search'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Search className="h-3.5 w-3.5" />
                    <span>Search CPA Users</span>
                  </button>
                  <button
                    type="button"
                    id="tab-invite-by-mobile"
                    onClick={() => setMemberAddTab('phone')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      memberAddTab === 'phone'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>Invite by Mobile</span>
                  </button>
                  <button
                    type="button"
                    id="tab-share-and-qr"
                    onClick={() => setMemberAddTab('share')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      memberAddTab === 'share'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    <span>Share & QR</span>
                  </button>
                  <button
                    type="button"
                    id="tab-current-members"
                    onClick={() => setMemberAddTab('members')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      memberAddTab === 'members'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>Group Members ({currentGroupMembers.length})</span>
                  </button>
                  <button
                    type="button"
                    id="tab-modal-invites"
                    onClick={() => setMemberAddTab('invitations')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      memberAddTab === 'invitations'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>Sent Invites ({modalInvitations.length})</span>
                  </button>
                </div>

              {/* TAB 1: SEARCH CPA USERS */}
              {memberAddTab === 'search' && (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      id="input-search-cpa-users"
                      placeholder="Search CPA registered users by name, phone, or email..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-8 py-2.5 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                    {userSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setUserSearchQuery('')}
                        className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {isSearchingUsers ? (
                    <div className="p-4 text-center text-slate-400">
                      <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-1 text-emerald-400" />
                      Searching registered CPA network...
                    </div>
                  ) : userSearchQuery.trim().length >= 2 ? (
                    userSearchResults.length === 0 ? (
                      <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-center text-slate-400">
                        <p>No CPA users found matching "{userSearchQuery}".</p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          You can switch to the "Invite by Mobile" tab to send a direct WhatsApp/SMS invite to any mobile number.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setInviteMobileNumber(userSearchQuery.replace(/\D/g, ''));
                            setMemberAddTab('phone');
                          }}
                          className="mt-2 text-emerald-400 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Phone className="h-3 w-3" />
                          <span>Invite with Mobile Number instead →</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {userSearchResults.map((u) => (
                          <div
                            key={u.id}
                            className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-950/70 hover:bg-slate-950 transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center text-xs">
                                {u.fullName?.charAt(0) || 'U'}
                              </div>
                              <div>
                                <div className="font-bold text-white text-xs">{u.fullName}</div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                  <span>{u.phone}</span>
                                  {u.email && <span>• {u.email}</span>}
                                </div>
                              </div>
                            </div>

                            <div>
                              {u.isMember ? (
                                <span className="rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold">
                                  Member
                                </span>
                              ) : u.isInvited || u.inviteStatus === 'INVITE_SENT' ? (
                                <span className="rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2 py-0.5 text-[10px] font-bold">
                                  Invited
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  id={`btn-invite-user-${u.id}`}
                                  disabled={invitingUserId === u.id}
                                  onClick={() => handleInviteSearchedUser(u)}
                                  className="flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  <UserPlus className="h-3 w-3" />
                                  <span>{invitingUserId === u.id ? 'Sending...' : '+ Add'}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    <div className="p-4 text-center text-slate-500">
                      <Users className="h-6 w-6 mx-auto mb-1 text-slate-600" />
                      <p>Type 2 or more characters to find registered CPA users by name, mobile, or email.</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: INVITE BY MOBILE */}
              {memberAddTab === 'phone' && (
                <form onSubmit={handleSendInvite} className="space-y-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Friend Name (Optional)</label>
                    <input
                      type="text"
                      id="input-invite-friend-name"
                      placeholder="e.g. Rahul Sharma"
                      value={inviteFriendName}
                      onChange={(e) => setInviteFriendName(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Mobile Number *</label>
                    <div className="relative flex">
                      <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-800 bg-slate-900 text-slate-400 font-mono text-xs">
                        +91
                      </span>
                      <input
                        type="tel"
                        id="input-invite-friend-phone"
                        required
                        placeholder="10-digit Indian mobile number"
                        value={inviteMobileNumber}
                        onChange={(e) => setInviteMobileNumber(e.target.value)}
                        className="w-full rounded-r-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none font-mono"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Normalized to +91XXXXXXXXXX. Automatically links to existing CPA accounts or invites for new registration.
                    </p>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Email (Optional)</label>
                    <input
                      type="email"
                      id="input-invite-friend-email"
                      placeholder="friend@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      id="btn-send-invite-submit"
                      disabled={isSubmittingInvite}
                      className="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 font-bold text-white hover:from-emerald-500 hover:to-teal-500 transition-all cursor-pointer shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                    >
                      {isSubmittingInvite ? 'Validating & Dispatching...' : 'Send Invite'}
                    </button>
                    <button
                      type="button"
                      id="btn-add-another-friend"
                      onClick={handleAddAnotherFriend}
                      className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 px-3.5 py-2.5 font-semibold text-slate-300 transition-colors cursor-pointer"
                    >
                      Add Another Friend
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: SHARE LINK & QR */}
              {memberAddTab === 'share' && (
                <div className="space-y-4">
                  {/* QR Image Card */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center">
                    <div className="inline-block rounded-xl border border-emerald-500/20 bg-white p-2 shadow-lg mb-3">
                      {joinQrDataUrl ? (
                        <img
                          src={joinQrDataUrl}
                          alt="Join Group QR"
                          className="h-44 w-44 object-contain mx-auto"
                        />
                      ) : (
                        <div className="h-44 w-44 flex items-center justify-center text-slate-800">
                          <QrCode className="h-10 w-10 animate-pulse text-slate-400" />
                        </div>
                      )}
                    </div>
                    <div className="font-bold text-white text-xs">Scan to Join {(createdGroupData || activeGroup)?.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Open camera or CPA Scanner to submit a join request.
                    </div>
                  </div>

                  {/* Share actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      id="btn-share-tab-whatsapp"
                      onClick={() => {
                        const grp = createdGroupData || activeGroup;
                        if (grp) openWhatsAppShare(grp);
                      }}
                      className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 py-2.5 font-bold text-emerald-300 transition-colors cursor-pointer"
                    >
                      <MessageCircle className="h-4 w-4 text-emerald-400" />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      id="btn-share-tab-copy"
                      onClick={() => {
                        const grp = createdGroupData || activeGroup;
                        if (grp) handleCopyLink(grp.secureToken);
                      }}
                      className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 py-2.5 font-semibold text-slate-200 transition-colors cursor-pointer"
                    >
                      {copiedLink ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-slate-400" />}
                      <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: SENT INVITATIONS */}
              {memberAddTab === 'invitations' && (
                <div className="space-y-2">
                  {modalInvitations.length === 0 ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-5 text-center text-slate-400">
                      <Users className="h-6 w-6 mx-auto mb-1 text-slate-600" />
                      <p>No invitations sent for this group yet.</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Use "Search CPA Users" or "Invite by Mobile" to send invitations.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800/80 rounded-xl border border-slate-800 bg-slate-950/70 overflow-hidden max-h-60 overflow-y-auto">
                      {modalInvitations.map((inv) => (
                        <div key={inv.id} className="p-3 flex items-center justify-between gap-2 text-xs">
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{inv.inviteeName || 'Friend'}</span>
                              <span className="font-mono text-slate-400 text-[11px]">({inv.inviteePhone})</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              Invited {new Date(inv.createdAt).toLocaleDateString()}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span
                              className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                                inv.status === 'ACCEPTED'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : inv.status === 'JOIN_REQUESTED'
                                  ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                                  : inv.status === 'CANCELLED'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                              }`}
                            >
                              {inv.status}
                            </span>

                            <button
                              type="button"
                              onClick={() => {
                                const grp = createdGroupData || activeGroup;
                                if (grp) openWhatsAppShare(grp, inv.joinUrl);
                              }}
                              className="rounded bg-emerald-600/20 hover:bg-emerald-600/30 p-1 text-emerald-400 cursor-pointer"
                              title="WhatsApp Share"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard?.writeText(inv.joinUrl);
                                setCopiedInviteLink(true);
                                setTimeout(() => setCopiedInviteLink(false), 2000);
                              }}
                              className="rounded bg-slate-800 hover:bg-slate-700 p-1 text-slate-300 cursor-pointer"
                              title="Copy Link"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>

                            {inv.status !== 'ACCEPTED' && inv.status !== 'CANCELLED' && (
                              <button
                                type="button"
                                onClick={() => handleCancelModalInvite(inv.id)}
                                disabled={cancellingModalInviteId === inv.id}
                                className="rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 text-[10px] font-semibold text-rose-300 cursor-pointer disabled:opacity-50"
                              >
                                {cancellingModalInviteId === inv.id ? '...' : 'Cancel'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: CURRENT MEMBERS */}
              {memberAddTab === 'members' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-300">
                      Active Pocket Members ({currentGroupMembers.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setMemberAddTab('phone')}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                    >
                      <UserPlus className="h-3 w-3" />
                      <span>+ Invite Friend</span>
                    </button>
                  </div>

                  {currentGroupMembers.length === 0 ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 text-center text-slate-400">
                      <p className="font-semibold text-white">No members yet</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Use the Search or Mobile tabs above to add friends to this pocket!
                      </p>
                      <button
                        type="button"
                        onClick={() => setMemberAddTab('phone')}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white transition-colors cursor-pointer"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>Invite by Mobile Now</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {currentGroupMembers.map((m) => {
                        const isLeader = m.role === 'OWNER' || m.role === 'ADMIN';
                        const isSelf = m.userId === currentUser.id;
                        const displayName = m.user?.fullName || 'Group Member';
                        const displayContact = m.user?.phone || m.user?.email || 'Verified Account';
                        return (
                          <div
                            key={m.id}
                            className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-slate-700 transition-all"
                          >
                            <div className="flex items-center gap-2.5">
                              {m.user?.avatarUrl ? (
                                <img
                                  src={m.user.avatarUrl}
                                  alt={displayName}
                                  className="h-8 w-8 rounded-full object-cover border border-slate-700"
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-slate-800 text-slate-200 font-bold flex items-center justify-center text-xs border border-slate-700">
                                  {displayName.charAt(0)}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-white text-xs flex items-center gap-1.5">
                                  <span>{displayName}</span>
                                  {isSelf && (
                                    <span className="text-[10px] text-emerald-400 font-normal">(You)</span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                  <span>{displayContact}</span>
                                  {m.joinedAt && (
                                    <span>• Joined {new Date(m.joinedAt).toLocaleDateString()}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                                  isLeader
                                    ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                }`}
                              >
                                {m.role}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Real Invitation Result Card */}
              {invitationResult && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>Invite Created for {invitationResult.inviteeName || invitationResult.inviteePhone}</span>
                    </div>
                    <span className="rounded bg-emerald-500/10 text-emerald-400 px-2 py-0.5 text-[10px] font-mono font-bold border border-emerald-500/20">
                      {invitationResult.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span>Phone: <strong className="font-mono text-slate-200">{invitationResult.inviteePhone}</strong></span>
                    {invitationResult.isExistingUser ? (
                      <span className="rounded bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 text-[10px] font-semibold">
                        Registered CPA User
                      </span>
                    ) : (
                      <span className="rounded bg-slate-800 text-slate-300 px-1.5 py-0.5 text-[10px]">
                        New Member Invitation
                      </span>
                    )}
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      id="btn-invite-whatsapp"
                      onClick={() => {
                        const grp = createdGroupData || activeGroup;
                        if (grp) openWhatsAppShare(grp, invitationResult.joinUrl);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 py-2 font-bold text-white transition-colors cursor-pointer"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>Share via WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      id="btn-invite-copy-link"
                      onClick={() => {
                        navigator.clipboard?.writeText(invitationResult.joinUrl);
                        setCopiedInviteLink(true);
                        setTimeout(() => setCopiedInviteLink(false), 2000);
                      }}
                      className="rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-2 font-semibold text-slate-200 transition-colors cursor-pointer"
                    >
                      {copiedInviteLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => {
                    const grp = createdGroupData || activeGroup;
                    if (grp) setSelectedGroupId(grp.id);
                    setActiveTab('groups');
                    handleClose();
                  }}
                  className="text-xs font-semibold text-emerald-400 hover:underline cursor-pointer"
                >
                  Go to Group CPA →
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          );
        })()}

          {/* CONTRIBUTE MODAL */}
          {quickActionModal === 'contribute' && (
            <form onSubmit={handleContribute} className="space-y-4 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Target Group</span>
                  <span className="font-mono text-emerald-400">{activeGroup?.cpaNumber}</span>
                </div>
                <div className="font-bold text-sm text-white mt-1">{activeGroup?.name}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Current Balance: {formatCurrency(activeWallet?.balance || 0)}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Contribution Amount (₹) *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={contributeAmount}
                    onChange={(e) => setContributeAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-8 pr-3.5 py-2.5 text-base font-bold text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="mt-2 flex gap-2">
                  {[200, 500, 1000, 2000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setContributeAmount(preset.toString())}
                      className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:border-slate-700 hover:text-white cursor-pointer"
                    >
                      +₹{preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Note / Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. Canteen lunch pool / Semester snack contribution"
                  value={contributeNote}
                  onChange={(e) => setContributeNote(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/40 p-3">
                <div>
                  <div className="font-semibold text-slate-200">Contribute Anonymously</div>
                  <div className="text-[11px] text-slate-400">Hide my name from public group feed</div>
                </div>
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-2.5 text-[11px] text-amber-300">
                <span className="font-semibold">Mode: {paymentMode}</span> — Verified server webhook will credit the
                group ledger upon gateway confirmation.
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 font-bold text-white hover:from-emerald-500 hover:to-teal-500 transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
              >
                Proceed to Payment ({formatCurrency(Math.round(parseFloat(contributeAmount || '0') * 100))})
              </button>
            </form>
          )}

          {/* WITHDRAW MODAL */}
          {quickActionModal === 'withdraw' && (
            <form onSubmit={handleWithdraw} className="space-y-4 text-xs">
              {!currentUser?.phoneVerified && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-300 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-xs text-white">Mobile Verification Required</p>
                    <p className="text-[11px] text-amber-200/80 leading-relaxed">
                      Financial compliance requires a verified mobile phone number before submitting treasury disbursements. Please verify your mobile phone in your Profile.
                    </p>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Available Treasury Balance</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {formatCurrency(activeWallet?.balance || 0)}
                  </span>
                </div>
                <div className="mt-2 text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300">Multi-Approval Policy:</span>
                  <ul className="mt-1 list-disc pl-4 space-y-0.5">
                    <li>Under ₹500: Auto-approved & executed immediately</li>
                    <li>₹500 – ₹999: Requires 1 Member approval</li>
                    <li>₹1,000+: Requires 2 Independent approvals (Anti-Self-Approval strictly enforced)</li>
                  </ul>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Withdrawal Amount (₹) *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-8 pr-3.5 py-2.5 text-base font-bold text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* PAYOUT DESTINATION SELECTOR */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Payout Destination *</label>
                <div className="space-y-2">
                  <select
                    value={selectedPayoutId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedPayoutId(val);
                      if (val !== 'CUSTOM') {
                        const d = (payoutDestinations || []).find((p) => p.id === val);
                        if (d) setWithdrawDestination(d.maskedDestination);
                      } else {
                        setWithdrawDestination('');
                      }
                    }}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  >
                    {(payoutDestinations || []).map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.type === 'UPI' ? '📱 UPI: ' : '🏛️ Bank: '}
                        {d.maskedDestination} ({d.accountHolderName})
                      </option>
                    ))}
                    <option value="CUSTOM">➕ Custom UPI ID or Bank Account</option>
                  </select>

                  {selectedPayoutId === 'CUSTOM' && (
                    <input
                      type="text"
                      required
                      placeholder="e.g. campus.caterer@okhdfcbank or 50100234567890 (HDFC Bank)"
                      value={withdrawDestination}
                      onChange={(e) => setWithdrawDestination(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none font-mono"
                    />
                  )}
                </div>
                {payoutDestinations.length === 0 && (
                  <p className="text-[10px] text-amber-400 mt-1">
                    Tip: Save your verified UPI/Bank accounts in Profile to select with 1-click.
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Reason / Itemized Justification *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Provide complete itemized justification for group audit..."
                  value={withdrawReason}
                  onChange={(e) => setWithdrawReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingWithdraw || !currentUser?.phoneVerified}
                className="w-full rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 py-3 font-bold text-white hover:from-amber-500 hover:to-orange-500 transition-all cursor-pointer shadow-lg shadow-amber-600/20 disabled:opacity-50"
              >
                {isSubmittingWithdraw
                  ? 'Submitting Request...'
                  : !currentUser?.phoneVerified
                  ? 'Phone Verification Required'
                  : 'Submit Withdrawal Request'}
              </button>
            </form>
          )}

          {/* JOIN CPA MODAL */}
          {quickActionModal === 'join-cpa' && (
            <form onSubmit={handleJoin} className="space-y-4 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                  <Lock className="h-4 w-4" />
                  Mandatory Security Verification
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Entering code/PIN does not auto-join you. Your application will be sent to the group leader for
                  explicit review.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Group Code or Token *</label>
                <input
                  type="text"
                  required
                  value={joinGroupCode}
                  onChange={(e) => setJoinGroupCode(e.target.value)}
                  placeholder="e.g. CSECANT26 or tok_join_..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-100 font-mono focus:border-emerald-500 focus:outline-none uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Group PIN (if required)</label>
                <input
                  type="password"
                  placeholder="Enter 4-6 digit group PIN"
                  value={joinPin}
                  onChange={(e) => setJoinPin(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Message to Leader</label>
                <input
                  type="text"
                  placeholder="e.g. Requesting to join for canteen lunch meal pool."
                  value={joinReason}
                  onChange={(e) => setJoinReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 font-bold text-white hover:from-emerald-500 hover:to-teal-500 transition-all cursor-pointer"
              >
                Submit Join Request (Status: PENDING)
              </button>
            </form>
          )}

          {/* SCAN QR MODAL - REAL QR DECODING & RESOLUTION */}
          {quickActionModal === 'scan-qr' && (
            <div className="space-y-4 text-xs">
              {/* Tabs: Upload / Camera / Manual */}
              <div className="flex gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setScanTab('upload');
                  }}
                  className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    scanTab === 'upload' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Image</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setScanTab('camera');
                    startCamera();
                  }}
                  className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    scanTab === 'camera' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Device Camera</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setScanTab('manual');
                  }}
                  className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    scanTab === 'manual' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Code / URL</span>
                </button>
              </div>

              {/* TAB 1: FILE UPLOAD */}
              {scanTab === 'upload' && (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 text-center space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="mx-auto flex flex-col h-40 w-full max-w-sm items-center justify-center rounded-2xl border-2 border-dashed border-emerald-500/50 bg-emerald-500/5 p-4 cursor-pointer hover:border-emerald-400 transition-colors"
                  >
                    <Upload className="h-10 w-10 text-emerald-400 mb-2" />
                    <span className="text-xs font-bold text-white">Click to Select QR Code Image</span>
                    <span className="text-[11px] text-slate-400 mt-1">Supports PNG, JPG, WebP screenshots</span>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <p className="text-[11px] text-slate-400">
                    Dual Concept QR Engine: Automatically identifies whether the image is a <strong>Join QR</strong> or{' '}
                    <strong>Contribution QR</strong>.
                  </p>
                </div>
              )}

              {/* TAB 2: LIVE CAMERA SCAN */}
              {scanTab === 'camera' && (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center space-y-3">
                  <div className="relative mx-auto h-52 w-full max-w-xs rounded-xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      muted
                      autoPlay
                      playsInline
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="absolute inset-0 border-2 border-emerald-400/50 rounded-xl pointer-events-none flex items-center justify-center">
                      <div className="w-36 h-36 border border-emerald-400 rounded-lg animate-pulse" />
                    </div>
                  </div>

                  {cameraError && (
                    <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px]">
                      {cameraError}
                    </div>
                  )}

                  <p className="text-[11px] text-slate-400">
                    Point your camera at a CPA QR code. It will automatically freeze and resolve.
                  </p>
                </div>
              )}

              {/* TAB 3: MANUAL INPUT */}
              {scanTab === 'manual' && (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                  <label className="block text-slate-300 font-semibold text-xs">
                    Paste Group Code, Token, or Full CPA URL:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. CSECANT26 or tok_join_... or URL"
                      value={manualQrInput}
                      onChange={(e) => setManualQrInput(e.target.value)}
                      className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      disabled={isResolvingQr || !manualQrInput.trim()}
                      onClick={() => resolveQrPayload(manualQrInput)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
                    >
                      {isResolvingQr ? 'Resolving...' : 'Resolve'}
                    </button>
                  </div>
                </div>
              )}

              {/* RESOLVING SPINNER */}
              {isResolvingQr && (
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 text-center flex items-center justify-center gap-2 text-emerald-400">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Contacting Centralized Pocket Registry to resolve code...</span>
                </div>
              )}

              {/* QR RESOLUTION ERROR */}
              {qrResolveError && (
                <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{qrResolveError}</span>
                </div>
              )}

              {/* RESOLVED GROUP PREVIEW CARD */}
              {resolvedGroup && (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wide">
                        Verified Group CPA Found
                      </span>
                      <h3 className="text-base font-extrabold text-white mt-0.5">{resolvedGroup.name}</h3>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-300">
                        <span className="font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-emerald-300">
                          {resolvedGroup.cpaNumber}
                        </span>
                        <span>• Code: {resolvedGroup.groupCode}</span>
                        <span>• {resolvedGroup.memberCount} Members</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                      {resolvedGroup.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">{resolvedGroup.description || resolvedGroup.purpose}</p>

                  <div className="pt-2 border-t border-emerald-500/20 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setJoinGroupCode(resolvedGroup.groupCode);
                        setQuickActionModal('join-cpa');
                      }}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Request to Join Group</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedGroupId(resolvedGroup.id);
                        setQuickActionModal('contribute');
                      }}
                      className="flex-1 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <HeartHandshake className="w-3.5 h-3.5" />
                      <span>Contribute Directly</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* REAL PAYMENT GATEWAY FLOW FOR ADD MONEY */}
          {quickActionModal === 'add-money' && (
            <AddMoneyModalContent
              onClose={handleClose}
              onNavigateToSettings={() => {
                handleClose();
                setActiveTab('settings');
              }}
              onNavigateToPersonalWallet={() => {
                handleClose();
                setActiveTab('personal-cpa');
              }}
            />
          )}

          {/* SPLIT EXPENSE / PAY fallback */}
          {(quickActionModal === 'split-expense' ||
            quickActionModal === 'pay') && (
            <div className="space-y-3 text-xs text-center py-4">
              <p className="text-slate-300">
                You selected <strong>{quickActionModal.replace('-', ' ').toUpperCase()}</strong>.
              </p>
              <p className="text-[11px] text-slate-400">
                Use the dedicated sub-tab in your active Group CPA or use direct contribution.
              </p>
              <button
                onClick={handleClose}
                className="mt-2 rounded-xl bg-slate-800 px-4 py-2 font-semibold text-white hover:bg-slate-700 cursor-pointer"
              >
                Close Window
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
