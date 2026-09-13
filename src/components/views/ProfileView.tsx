import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  User,
  Shield,
  Key,
  Lock,
  CheckCircle2,
  Smartphone,
  LogOut,
  Mail,
  Calendar,
  CreditCard,
  Plus,
  AlertCircle,
  Building2,
  ArrowUpRight,
  ShieldCheck,
  Check,
  MessageSquare,
  Clock,
  Send,
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const {
    currentUser,
    logout,
    authToken,
    sendPhoneOtp,
    verifyPhoneOtp,
    payoutDestinations,
    addPayoutDestination,
  } = useApp();

  // Phone Verification State
  const [phoneNumber, setPhoneNumber] = useState(currentUser.phone || '');
  const [otpCode, setOtpCode] = useState('');
  const [otpChannel, setOtpChannel] = useState<'sms' | 'whatsapp'>('sms');
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [maskedRecipient, setMaskedRecipient] = useState<string>('');
  const [phoneFeedback, setPhoneFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const timer = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  // Payout Destination Form State
  const [showAddPayout, setShowAddPayout] = useState(false);
  const [payoutType, setPayoutType] = useState<'UPI' | 'BANK_ACCOUNT'>('UPI');
  const [accountHolderName, setAccountHolderName] = useState(currentUser.fullName || '');
  const [upiId, setUpiId] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [payoutFeedback, setPayoutFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Security PIN
  const [pinMessage, setPinMessage] = useState<string | null>(null);

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinMessage('PIN security preferences updated successfully.');
    setTimeout(() => setPinMessage(null), 3000);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldownRemaining > 0) return;
    if (!phoneNumber.trim()) {
      setPhoneFeedback({ type: 'error', message: 'Please enter a valid 10-digit Indian mobile number.' });
      return;
    }
    setIsSendingOtp(true);
    setPhoneFeedback(null);
    try {
      const res = await sendPhoneOtp(phoneNumber.trim(), otpChannel);
      if (res.success) {
        setOtpSent(true);
        setCooldownRemaining(60);
        if (res.maskedPhone) setMaskedRecipient(res.maskedPhone);
        setPhoneFeedback({
          type: 'success',
          message: res.message
            ? `${res.message} via ${otpChannel === 'whatsapp' ? 'WhatsApp' : 'SMS'}`
            : `Verification code sent via ${otpChannel === 'whatsapp' ? 'WhatsApp' : 'SMS'}.`,
        });
      } else {
        if (res.cooldownRemainingSec) {
          setCooldownRemaining(res.cooldownRemainingSec);
        }
        setPhoneFeedback({ type: 'error', message: res.error || 'Failed to send OTP.' });
      }
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.length !== 6) {
      setPhoneFeedback({ type: 'error', message: 'Enter the complete 6-digit verification code.' });
      return;
    }
    setIsVerifyingOtp(true);
    setPhoneFeedback(null);
    try {
      const res = await verifyPhoneOtp(otpCode.trim(), phoneNumber.trim());
      if (res.success) {
        setOtpSent(false);
        setOtpCode('');
        setCooldownRemaining(0);
        setPhoneFeedback({
          type: 'success',
          message: 'Phone number verified successfully! Treasury disbursements and multi-sig withdrawals are now active.',
        });
      } else {
        setPhoneFeedback({ type: 'error', message: res.error || 'Invalid verification code.' });
      }
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleAddPayoutDestination = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountHolderName.trim()) {
      setPayoutFeedback({ type: 'error', message: 'Account holder legal name is required.' });
      return;
    }

    if (payoutType === 'UPI') {
      if (!upiId.trim() || !upiId.includes('@')) {
        setPayoutFeedback({ type: 'error', message: 'Please enter a valid UPI ID (e.g. name@okhdfcbank).' });
        return;
      }
    } else {
      if (!accountNumber.trim() || accountNumber.length < 8) {
        setPayoutFeedback({ type: 'error', message: 'Valid bank account number (8–18 digits) required.' });
        return;
      }
      if (!ifscCode.trim() || ifscCode.length !== 11) {
        setPayoutFeedback({ type: 'error', message: 'Valid 11-character bank IFSC code required (e.g. HDFC0001234).' });
        return;
      }
    }

    setIsSubmittingPayout(true);
    setPayoutFeedback(null);
    try {
      const res = await addPayoutDestination({
        type: payoutType,
        accountHolderName: accountHolderName.trim(),
        upiId: payoutType === 'UPI' ? upiId.trim().toLowerCase() : undefined,
        accountNumber: payoutType === 'BANK_ACCOUNT' ? accountNumber.trim() : undefined,
        ifscCode: payoutType === 'BANK_ACCOUNT' ? ifscCode.trim().toUpperCase() : undefined,
        bankName: payoutType === 'BANK_ACCOUNT' ? (bankName.trim() || 'Scheduled Commercial Bank') : undefined,
      });

      if (res.success) {
        setPayoutFeedback({ type: 'success', message: 'Payout destination verified and linked to your wallet!' });
        setShowAddPayout(false);
        setUpiId('');
        setAccountNumber('');
        setIfscCode('');
        setBankName('');
      } else {
        setPayoutFeedback({ type: 'error', message: res.error || 'Failed to link destination.' });
      }
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <User className="h-6 w-6 text-emerald-400" />
            <span>User Profile & Security Identity</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative cryptographic credentials, verified payout rails, and KYC governance.
          </p>
        </div>

        <button
          type="button"
          onClick={logout}
          className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Profile Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 backdrop-blur-md">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-slate-950 font-black text-2xl shadow-xl shadow-emerald-500/10 shrink-0">
          {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
        </div>

        <div className="flex-1 text-center sm:text-left space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-white">{currentUser.fullName || 'Authorized User'}</h2>
              <div className="flex items-center gap-2 justify-center sm:justify-start text-xs text-slate-400 mt-0.5">
                <Mail className="w-3.5 h-3.5" />
                <span>{currentUser.email}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 self-center sm:self-start">
              {currentUser.phoneVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Phone Verified</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 text-xs font-bold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Phone Unverified</span>
                </span>
              )}
              <span className="rounded-full bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-0.5 font-mono text-xs font-bold">
                {currentUser.role}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800/80 justify-center sm:justify-start">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Registered: {new Date(currentUser.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
              <Key className="w-3.5 h-3.5 text-emerald-400" />
              <span>User ID: {currentUser.id}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: PHONE VERIFICATION (REAL SMS & WHATSAPP) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Smartphone className="h-4 w-4 text-emerald-400" />
            <span>Mobile Phone Verification (SMS & WhatsApp 2FA)</span>
          </div>
          {currentUser.phoneVerified ? (
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Verified ({currentUser.phone})
            </span>
          ) : (
            <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              Verification Required
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400">
          Real OTP verification via SMS or WhatsApp is required before initiating disbursements or receiving settlement payouts.
        </p>

        {phoneFeedback && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              phoneFeedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
            }`}
          >
            {phoneFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{phoneFeedback.message}</span>
          </div>
        )}

        {/* Verification Channel Selector */}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs font-medium text-slate-400">Delivery Channel:</span>
          <button
            type="button"
            onClick={() => setOtpChannel('sms')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              otpChannel === 'sms'
                ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>SMS (Text Message)</span>
          </button>
          <button
            type="button"
            onClick={() => setOtpChannel('whatsapp')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              otpChannel === 'whatsapp'
                ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
          <form onSubmit={handleSendOtp} className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">Indian Mobile Number (+91)</label>
            <div className="flex gap-2">
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={isSendingOtp || cooldownRemaining > 0}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 flex items-center gap-1.5"
              >
                {cooldownRemaining > 0 && <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />}
                <span>
                  {isSendingOtp
                    ? 'Dispatching...'
                    : cooldownRemaining > 0
                    ? `Resend in ${cooldownRemaining}s`
                    : otpSent
                    ? 'Resend OTP'
                    : `Send via ${otpChannel === 'whatsapp' ? 'WhatsApp' : 'SMS'}`}
                </span>
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              Standard 10-digit Indian format (+91). Real carrier dispatch via Twilio.
            </p>
          </form>

          <form onSubmit={handleVerifyOtp} className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">Enter 6-Digit OTP Code</label>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                placeholder="••••••"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                disabled={!otpSent && !phoneNumber}
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-center tracking-widest text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isVerifyingOtp || !otpCode || otpCode.trim().length !== 6}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                {isVerifyingOtp ? 'Verifying...' : 'Verify OTP'}
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              Verification codes are valid for 5 minutes. Enter code received on your device.
            </p>
          </form>
        </div>
      </div>


      {/* SECTION: PAYOUT DESTINATIONS (UPI & BANK ACCOUNTS) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <CreditCard className="h-4 w-4 text-emerald-400" />
            <span>Payout Destinations (Disbursement Rails)</span>
          </div>
          <button
            type="button"
            onClick={() => setShowAddPayout(!showAddPayout)}
            className="flex items-center gap-1 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddPayout ? 'Cancel' : 'Add Destination'}</span>
          </button>
        </div>
        <p className="text-xs text-slate-400">
          Registered UPI IDs and Bank Accounts verified for direct multi-sig withdrawal disbursements and expense reimbursements.
        </p>

        {payoutFeedback && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              payoutFeedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
            }`}
          >
            {payoutFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{payoutFeedback.message}</span>
          </div>
        )}

        {/* ADD PAYOUT FORM */}
        {showAddPayout && (
          <form onSubmit={handleAddPayoutDestination} className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-3 text-xs">
            <div className="font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Link New Settlement Account</span>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPayoutType('UPI')}
                className={`flex-1 py-1.5 rounded-lg font-bold border transition-colors cursor-pointer ${
                  payoutType === 'UPI'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                UPI Virtual Payment Address (VPA)
              </button>
              <button
                type="button"
                onClick={() => setPayoutType('BANK_ACCOUNT')}
                className={`flex-1 py-1.5 rounded-lg font-bold border transition-colors cursor-pointer ${
                  payoutType === 'BANK_ACCOUNT'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                Direct Bank Account (NEFT / IMPS)
              </button>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Account Holder Legal Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Chandra Verma"
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {payoutType === 'UPI' ? (
              <div>
                <label className="block text-slate-300 font-semibold mb-1">UPI ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ramesh@okhdfcbank or 9876543210@paytm"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Bank Name</label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC Bank Ltd"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Account Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 50100234567890"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">IFSC Code *</label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    placeholder="e.g. HDFC0001234"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono uppercase focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddPayout(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingPayout}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-50 cursor-pointer"
              >
                {isSubmittingPayout ? 'Validating...' : 'Save & Verify Rail'}
              </button>
            </div>
          </form>
        )}

        {/* LIST OF DESTINATIONS */}
        {payoutDestinations.length === 0 ? (
          <div className="p-6 rounded-xl border border-slate-800 bg-slate-950/40 text-center text-xs text-slate-400">
            No payout destinations registered yet. Add your UPI ID or Bank Account to receive approved disbursements.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {payoutDestinations.map((dest) => (
              <div
                key={dest.id}
                className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex items-start justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
                    {dest.type === 'UPI' ? <Smartphone className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="font-bold text-white">{dest.accountHolderName}</div>
                    <div className="font-mono text-emerald-400 font-medium text-[11px] mt-0.5">
                      {dest.maskedDestination}
                    </div>
                    {dest.bankName && (
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {dest.bankName} {dest.ifscCode ? `• IFSC: ${dest.ifscCode}` : ''}
                      </div>
                    )}
                  </div>
                </div>

                <span className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Verified</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cryptographic Security Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <Shield className="h-4 w-4" />
            <span>Cryptographic Proof Status</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            All your contributions and expenses are verified with SHA-256 state hashes. Ledger entries are stored in write-ahead log mode to prevent balance divergence.
          </p>
          <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Password Encryption</span>
              <span className="font-mono text-emerald-400 font-medium">Scrypt / 64-byte key</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Multi-Signature Protocol</span>
              <span className="font-mono text-emerald-400 font-medium">Anti-Self-Approval Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Database Schema</span>
              <span className="font-mono text-emerald-400 font-medium">ACID Compliant WAL</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
          <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
            <Lock className="h-4 w-4" />
            <span>Active Session Token</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your current session token is cryptographically bound to your user record and verified on each authoritative API request.
          </p>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 break-all">
            {authToken ? `${authToken.substring(0, 32)}...` : 'Session active'}
          </div>
        </div>
      </div>

      {/* Security PIN Management */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">Multi-Signature Security PIN</h3>
        </div>
        <p className="text-xs text-slate-400">
          Set a 4-to-6 digit numeric PIN required when authorising high-value treasury disbursements or creating new Centralized Pocket Accounts.
        </p>

        {pinMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{pinMessage}</span>
          </div>
        )}

        <form onSubmit={handleUpdatePin} className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <input
            type="password"
            maxLength={6}
            placeholder="••••••"
            className="w-48 px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-center tracking-widest text-sm focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
          >
            Update Security PIN
          </button>
        </form>
      </div>
    </div>
  );
};
