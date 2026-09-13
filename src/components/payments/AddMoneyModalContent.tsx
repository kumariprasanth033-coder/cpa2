import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ArrowRight,
  RefreshCw,
  Download,
  ExternalLink,
  Settings as SettingsIcon,
  Receipt,
  Smartphone,
  Building2,
  Lock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { loadRazorpayScript, RazorpayOptions, RazorpayPaymentSuccessResponse } from '../../lib/razorpay';

interface PaymentConfig {
  provider: string;
  mode: 'TEST' | 'LIVE';
  configured: boolean;
  status: 'CONNECTED' | 'NOT_CONFIGURED' | 'ERROR';
  keyId: string | null;
  webhookUrl: string;
  appUrl: string;
  statusNote: string;
}

interface PaymentReceiptData {
  receiptId: string;
  paymentId: string;
  orderId: string;
  amountPaise: number;
  amountRupees: number;
  currency: string;
  status: string;
  timestamp: string;
  cpaNumber: string;
  cpaName: string;
  walletBalancePaise: number;
  walletBalanceRupees: number;
  isIdempotentReplay?: boolean;
}

interface AddMoneyModalContentProps {
  onClose: () => void;
  onNavigateToSettings?: () => void;
  onNavigateToPersonalWallet?: () => void;
}

export const AddMoneyModalContent: React.FC<AddMoneyModalContentProps> = ({
  onClose,
  onNavigateToSettings,
  onNavigateToPersonalWallet,
}) => {
  const {
    user,
    personalCpa: appPersonalCpa,
    cpas,
    wallets,
    authToken,
    refreshUserData,
    fetchTransactions,
    fetchNotifications,
    setActiveTab,
    formatCurrency,
  } = useApp();

  // Find Personal CPA & Personal Wallet safely
  const personalCpa =
    (cpas || []).find((c) => c.type === 'PERSONAL' && c.ownerId === user?.id) ||
    (cpas || []).find((c) => c.type === 'PERSONAL') ||
    appPersonalCpa;
  const personalWallet = personalCpa?.walletId
    ? (wallets?.[personalCpa.walletId] || {
        id: personalCpa.walletId,
        cpaId: personalCpa.id,
        currency: personalCpa.currency || 'INR',
        balance: (personalCpa as any).balancePaise || 0,
        updatedAt: personalCpa.createdAt || new Date().toISOString(),
      })
    : null;

  // Flow states: 'INPUT' | 'CREATING_ORDER' | 'GATEWAY_OPEN' | 'VERIFYING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'
  const [step, setStep] = useState<'INPUT' | 'CREATING_ORDER' | 'GATEWAY_OPEN' | 'VERIFYING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'>('INPUT');

  const [amountInput, setAmountInput] = useState<string>('1');
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState<boolean>(true);
  const [configError, setConfigError] = useState<string | null>(null);

  // Active Order & Verification state
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verifiedReceipt, setVerifiedReceipt] = useState<PaymentReceiptData | null>(null);

  const quickAmounts = [1, 100, 500, 1000, 2000, 5000];

  // Fetch Gateway Configuration on Mount
  useEffect(() => {
    let isMounted = true;
    async function loadConfig() {
      setIsLoadingConfig(true);
      setConfigError(null);
      try {
        const res = await fetch('/api/payments/status');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setConfig({
              provider: (data.provider || 'razorpay').toUpperCase(),
              mode: (data.mode || 'test').toUpperCase(),
              configured: Boolean(data.configured),
              keyId: data.keyId || null,
              status: data.status || (data.configured ? 'CONNECTED' : 'NOT_CONFIGURED'),
              webhookUrl: data.webhookUrl || '',
              appUrl: '',
            });
          }
        } else {
          const fallbackRes = await fetch('/api/payments/config');
          if (!fallbackRes.ok) throw new Error('Could not load payment gateway configuration');
          const fbData = await fallbackRes.json();
          if (isMounted) {
            setConfig({
              provider: (fbData.provider || 'RAZORPAY').toUpperCase(),
              mode: (fbData.mode || 'TEST').toUpperCase(),
              configured: Boolean(fbData.configured),
              keyId: fbData.keyId || null,
              status: fbData.status || (fbData.configured ? 'CONNECTED' : 'NOT_CONFIGURED'),
              webhookUrl: fbData.webhookUrl || '',
              appUrl: fbData.appUrl || '',
            });
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setConfigError(err.message || 'Failed to fetch gateway status');
        }
      } finally {
        if (isMounted) {
          setIsLoadingConfig(false);
        }
      }
    }

    loadConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  const parsedAmountRupees = parseFloat(amountInput) || 0;
  const parsedAmountPaise = Math.round(parsedAmountRupees * 100);
  const isAmountValid = parsedAmountRupees >= 1 && parsedAmountRupees <= 1000000;

  // Handle Initiating Real Gateway Checkout
  const handleStartPayment = async () => {
    if (!isAmountValid) return;
    if (!personalWallet || !personalCpa) {
      setErrorMessage('Personal CPA account or wallet not found.');
      return;
    }

    // Ensure Razorpay SDK is loaded
    const sdkLoaded = await loadRazorpayScript();
    if (!sdkLoaded) {
      setErrorMessage('Failed to load Razorpay secure checkout SDK. Please check your internet connection.');
      return;
    }

    setStep('CREATING_ORDER');
    setErrorMessage(null);

    try {
      const token = localStorage.getItem('cpa_auth_token') || authToken;
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amountPaise: parsedAmountPaise,
          walletId: personalWallet.id,
          currency: 'INR',
          idempotencyKey: `idem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.success) {
        if (orderData.code === 'REQUIRES_CONFIGURATION') {
          setErrorMessage('Payment service requires configuration.');
          setStep('INPUT');
          return;
        }
        throw new Error(orderData.error || 'Unable to start payment. Please try again.');
      }

      const { orderId, keyId, user: userInfo } = orderData;
      setCurrentOrderId(orderId);

      // Open Real Razorpay Standard Checkout
      setStep('GATEWAY_OPEN');

      const options: RazorpayOptions = {
        key: keyId,
        amount: parsedAmountPaise,
        currency: 'INR',
        name: 'CPA — Centralized Pocket Account',
        description: `Add Money to Personal Wallet (${orderData.mode} Mode)`,
        image: 'https://cdn-icons-png.flaticon.com/512/10149/10149458.png',
        order_id: orderId,
        prefill: {
          name: userInfo?.name || user?.fullName || 'Account Holder',
          email: userInfo?.email || user?.email || '',
          contact: userInfo?.phone || user?.phone || '',
        },
        theme: {
          color: '#06b6d4',
          backdrop_color: 'rgba(2, 6, 23, 0.85)',
        },
        modal: {
          ondismiss: async () => {
            // User cancelled / closed checkout modal without completing payment
            setStep('CANCELLED');
            try {
              await fetch('/api/payments/cancel', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ orderId }),
              });
            } catch (_) {}
          },
        },
        handler: async (response: RazorpayPaymentSuccessResponse) => {
          // Gateway completed payment! Now verify cryptographic signature on server
          setStep('VERIFYING');

          try {
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                walletId: personalWallet.id,
                paymentMethod: 'RAZORPAY_GATEWAY',
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData.success) {
              setErrorMessage('Payment verification failed. No money was added.');
              setStep('FAILED');
              return;
            }

            // Real Server Verification Succeeded!
            setVerifiedReceipt(verifyData.receipt);
            setStep('SUCCESS');

            // Refresh all app data and balances from server database
            await Promise.all([
              refreshUserData(),
              fetchTransactions(),
              fetchNotifications(),
            ]);
          } catch (verifyErr: any) {
            console.error('Server verification error:', verifyErr);
            setErrorMessage('Payment verification failed. No money was added.');
            setStep('FAILED');
          }
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (failureResponse: any) => {
        console.error('Payment gateway failure:', failureResponse);
        setErrorMessage(
          failureResponse.error?.description ||
            failureResponse.error?.reason ||
            'Payment verification failed. No money was added.'
        );
        setStep('FAILED');
      });

      rzp.open();
    } catch (err: any) {
      console.error('Payment order creation error:', err);
      setErrorMessage('Unable to start payment. Please try again.');
      setStep('INPUT');
    }
  };

  // Download printable/text receipt
  const handleDownloadReceipt = () => {
    if (!verifiedReceipt) return;
    const content = `=====================================================
CPA — CENTRALIZED POCKET ACCOUNT
OFFICIAL PAYMENT RECEIPT
=====================================================
Receipt ID:         ${verifiedReceipt.receiptId}
Date & Time:        ${new Date(verifiedReceipt.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
Transaction Status: ${verifiedReceipt.status} (CRYPTOGRAPHICALLY VERIFIED)
Environment:        ${config?.mode || 'TEST'}

PAYMENT DETAILS
-----------------------------------------------------
Amount Credited:    ₹${verifiedReceipt.amountRupees.toFixed(2)} (${verifiedReceipt.currency})
Payment Provider:   Razorpay Secure Gateway
Gateway Payment ID: ${verifiedReceipt.paymentId}
Gateway Order ID:   ${verifiedReceipt.orderId}

ACCOUNT & LEDGER
-----------------------------------------------------
Target Account:     ${verifiedReceipt.cpaName}
CPA Number:         ${verifiedReceipt.cpaNumber}
Updated Balance:    ₹${verifiedReceipt.walletBalanceRupees.toFixed(2)}
Verification Type:  Server-Side HMAC-SHA256 Signature Validated
=====================================================
This receipt confirms authoritative ledger credit to your Centralized Pocket Account.
Generated by CPA Financial Engine.
=====================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CPA-Receipt-${verifiedReceipt.receiptId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleGoToSettings = () => {
    onClose();
    if (onNavigateToSettings) {
      onNavigateToSettings();
    } else {
      setActiveTab('settings');
    }
  };

  const handleGoToWallet = () => {
    onClose();
    if (onNavigateToPersonalWallet) {
      onNavigateToPersonalWallet();
    } else {
      setActiveTab('personal-cpa');
    }
  };

  return (
    <div className="space-y-5 text-slate-100">
      {/* 1. GATEWAY MODE BADGE & CURRENT BALANCE HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Payment Gateway</span>
            {isLoadingConfig ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-semibold text-slate-300">
                <Loader2 className="h-3 w-3 animate-spin text-cyan-400" />
                Checking...
              </span>
            ) : config?.mode === 'LIVE' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE MODE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-400">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                TEST MODE
              </span>
            )}

            {config && (
              <span
                className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                  config.status === 'CONNECTED'
                    ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                    : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                }`}
              >
                {config.status}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Deposits are credited authoritatively to your Personal CPA wallet.
          </p>
        </div>

        {/* Current Database Wallet Balance */}
        <div className="text-right">
          <span className="text-[10px] font-medium text-slate-400 block">Current Balance</span>
          <span className="font-mono text-sm font-bold text-emerald-400">
            {formatCurrency(personalWallet?.balance || 0)}
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ===================================================================
            VIEW 1: INPUT AMOUNT & PAYMENT METHOD SELECTION
           =================================================================== */}
        {step === 'INPUT' && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            {/* Missing Configuration Notice */}
            {config && !config.configured && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 p-3.5 space-y-1">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-0.5">
                    <p className="font-semibold text-amber-200">
                      Payment Service Requires Configuration
                    </p>
                    <p className="text-[11px] text-amber-300/80">
                      Payment service requires configuration.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-300 flex items-start gap-2">
                <XCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Unable to proceed with payment</p>
                  <p className="text-[11px] text-rose-300/90">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Amount Input */}
            <div className="space-y-2">
              <label htmlFor="amount-input-field" className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Amount to Add</span>
                <span className="text-[11px] font-normal text-slate-400">Min ₹1 • Max ₹10,00,000</span>
              </label>
              <div className="relative rounded-xl border border-slate-700/80 bg-slate-950 px-4 py-3 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all">
                <div className="flex items-center">
                  <span className="font-mono text-2xl font-bold text-cyan-400 mr-2">₹</span>
                  <input
                    id="amount-input-field"
                    type="number"
                    min="1"
                    max="1000000"
                    step="1"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full bg-transparent font-mono text-2xl font-bold text-white placeholder:text-slate-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Quick Select Amounts */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-slate-400">Quick amounts</span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmountInput(amt.toString())}
                    className={`rounded-lg border px-2 py-1.5 text-xs font-semibold font-mono transition-colors cursor-pointer text-center ${
                      parsedAmountRupees === amt
                        ? 'border-cyan-400 bg-cyan-500/10 text-cyan-300'
                        : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    ₹{amt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method Specification */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Payment method</span>
                    <span className="text-[11px] text-slate-400">Secure payment gateway</span>
                  </div>
                </div>
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                  Razorpay SDK
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400 border-t border-slate-800/80">
                <span className="flex items-center gap-1">
                  <Smartphone className="h-3 w-3 text-cyan-400" /> UPI (GPay, PhonePe, Paytm)
                </span>
                <span className="flex items-center gap-1">
                  <CreditCard className="h-3 w-3 text-emerald-400" /> Credit / Debit Cards
                </span>
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3 text-amber-400" /> Netbanking
                </span>
              </div>
            </div>

            {/* Security Guarantee Note */}
            <p className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
              <Lock className="h-3 w-3 text-slate-400" />
              Your wallet balance is updated only after server-side cryptographic signature verification.
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-800/60 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleStartPayment}
                disabled={!isAmountValid || (config !== null && !config.configured)}
                className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <span>Continue to Payment</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ===================================================================
            VIEW 2: CREATING ORDER / GATEWAY IN PROGRESS
           =================================================================== */}
        {(step === 'CREATING_ORDER' || step === 'GATEWAY_OPEN' || step === 'VERIFYING') && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="py-6 text-center space-y-4"
          >
            <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>

            <div className="space-y-1.5 max-w-sm mx-auto">
              <h3 className="text-sm font-bold text-white">
                {step === 'CREATING_ORDER' && 'Creating Payment Order...'}
                {step === 'GATEWAY_OPEN' && 'Payment Checkout Open'}
                {step === 'VERIFYING' && 'Verifying Payment on Server...'}
              </h3>
              <p className="text-xs text-slate-400">
                {step === 'CREATING_ORDER' && 'Initiating secure order with payment gateway backend...'}
                {step === 'GATEWAY_OPEN' && 'Please complete your payment in the secure Razorpay checkout window. Do not refresh.'}
                {step === 'VERIFYING' && 'Performing cryptographic HMAC-SHA256 signature verification and double-entry ledger credit...'}
              </p>
            </div>

            {currentOrderId && (
              <div className="inline-block rounded-lg bg-slate-950 border border-slate-800 px-3 py-1 font-mono text-[11px] text-slate-400">
                Order Ref: <span className="text-slate-200">{currentOrderId}</span>
              </div>
            )}

            {step === 'GATEWAY_OPEN' && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setStep('CANCELLED')}
                  className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer"
                >
                  Close Checkout / Cancel Payment
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ===================================================================
            VIEW 3: REAL PAYMENT RECEIPT (SUCCESS)
           =================================================================== */}
        {step === 'SUCCESS' && verifiedReceipt && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-4"
          >
            <div className="text-center space-y-1">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-white">Money Added Successfully</h3>
              <p className="text-xs text-slate-400">
                Authoritative double-entry ledger credited and verified.
              </p>
            </div>

            {/* Official Real Payment Receipt Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-cyan-400" />
                  <span className="font-bold text-white">Payment Receipt</span>
                </div>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
                  {verifiedReceipt.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-y-2.5 text-slate-300">
                <div>
                  <span className="text-[10px] text-slate-400 block">Amount Credited</span>
                  <span className="font-mono text-base font-bold text-emerald-400">
                    ₹{verifiedReceipt.amountRupees.toFixed(2)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">New Wallet Balance</span>
                  <span className="font-mono text-base font-bold text-cyan-400">
                    ₹{verifiedReceipt.walletBalanceRupees.toFixed(2)}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block">Payment ID</span>
                  <span className="font-mono text-[11px] text-slate-200 break-all select-all">
                    {verifiedReceipt.paymentId}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Order ID</span>
                  <span className="font-mono text-[11px] text-slate-200 break-all select-all">
                    {verifiedReceipt.orderId}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block">Date / Time</span>
                  <span className="text-[11px] text-slate-300">
                    {new Date(verifiedReceipt.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}{' '}
                    • {new Date(verifiedReceipt.timestamp).toLocaleDateString()}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">CPA Account</span>
                  <span className="font-mono text-[11px] text-slate-300">
                    {verifiedReceipt.cpaNumber}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={handleDownloadReceipt}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-cyan-400" />
                Download Receipt
              </button>

              <button
                type="button"
                onClick={handleGoToWallet}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-cyan-500 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition cursor-pointer shadow-lg shadow-cyan-500/20"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View Personal Wallet
              </button>
            </div>
          </motion.div>
        )}

        {/* ===================================================================
            VIEW 4: PAYMENT CANCELLED (RULE #11)
           =================================================================== */}
        {step === 'CANCELLED' && (
          <motion.div
            key="cancelled"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-4 text-center py-4"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-slate-400">
              <AlertTriangle className="h-6 w-6 text-amber-400" />
            </div>

            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-sm font-bold text-white">Payment Cancelled</h3>
              <p className="text-xs text-slate-400">
                Payment cancelled. No money was added.
              </p>
              <p className="text-xs font-semibold text-amber-300 pt-1">
                Your wallet balance remains unchanged: {formatCurrency(personalWallet?.balance || 0)}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-800/60 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setStep('INPUT');
                }}
                className="flex-1 rounded-xl bg-cyan-500 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition cursor-pointer"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        )}

        {/* ===================================================================
            VIEW 5: PAYMENT FAILED (RULE #12)
           =================================================================== */}
        {step === 'FAILED' && (
          <motion.div
            key="failed"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-4 text-center py-4"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <XCircle className="h-6 w-6" />
            </div>

            <div className="space-y-1.5 max-w-sm mx-auto">
              <h3 className="text-sm font-bold text-white">Payment Failed</h3>
              <p className="text-xs text-rose-300">
                {errorMessage || 'The payment could not be processed by the gateway or was declined.'}
              </p>
              <p className="text-xs font-semibold text-slate-300 pt-1">
                No money was deducted and your wallet balance remains unchanged: {formatCurrency(personalWallet?.balance || 0)}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:flex-1 rounded-xl border border-slate-700 bg-slate-800/60 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setStep('INPUT');
                }}
                className="w-full sm:flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-cyan-500 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Try Again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
