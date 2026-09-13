import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  QrCode,
  Wallet,
  Sparkles,
  Receipt,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

export const TrustCenter: React.FC = () => {
  const { setActiveTab } = useApp();

  const securityPillars = [
    {
      title: '1. Payment Verification & Webhook Validation',
      icon: ShieldCheck,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      description:
        'CPA enforces absolute zero-trust on payments. Balances are never updated from client-side requests or "success" callbacks. Instead, payments are processed through certified gateways (e.g. Razorpay) and verified server-side using cryptographic HMAC SHA-256 webhook signatures.',
      guarantees: [
        'No client-side balance modification permitted',
        'Cryptographic webhook validation before ledger entry',
        'Test and Live payment environments strictly separated',
      ],
    },
    {
      title: '2. Group Membership & Mandatory Leader Approval',
      icon: Lock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      description:
        'Merely possessing a group link, QR code, or PIN does not grant membership. All new participants must submit a Join Request that enters a PENDING status. The designated group leader must explicitly review applicant information and approve access.',
      guarantees: [
        'Private group data hidden until membership is approved',
        'Group PINs stored as one-way salted cryptographic hashes',
        'Invitation links use high-entropy server tokens, never plaintext passwords',
      ],
    },
    {
      title: '3. Approval Requirements & Anti-Self-Approval',
      icon: ShieldAlert,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20',
      description:
        'Sensitive withdrawals and high-value payments mandate multi-party consensus. Small incidental expenses (<₹500) can proceed directly, while withdrawals above ₹1,000 require two independent member approvals. Requesters are strictly prohibited from approving their own withdrawals.',
      guarantees: [
        'Server-enforced multi-signature threshold logic',
        'Hard block against self-approval exploits',
        'Full approver attribution recorded in permanent audit logs',
      ],
    },
    {
      title: '4. QR Code Security & Anti-Replay Tokens',
      icon: QrCode,
      color: 'text-teal-400',
      bgColor: 'bg-teal-500/10',
      borderColor: 'border-teal-500/20',
      description:
        'CPA employs distinct Join QRs and Contribution QRs. Scanning a QR code displays a verified confirmation modal with exact recipient details and amount before any transaction occurs. QR scanning will never directly transfer funds without deliberate confirmation.',
      guarantees: [
        'Preview dialog precedes any financial movement',
        'Server-validated QR tokens with time-to-live expiration',
        'Distinction between join access and payment collection',
      ],
    },
    {
      title: '5. Balance Maintenance & Double-Entry Ledger',
      icon: Wallet,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20',
      description:
        'The centralized wallet balance is backed by an append-only transaction ledger. Balance mutations are executed within atomic database transaction boundaries using integer base currency units (paise) to prevent IEEE floating-point arithmetic corruption.',
      guarantees: [
        'All records logged in base integer units (1 INR = 100 paise)',
        'Atomic updates with row-level transaction locking',
        'Historical reconciliation against verified credit/debit records',
      ],
    },
    {
      title: '6. AI Behavior & Zero-Execution Boundaries',
      icon: Sparkles,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      description:
        'The integrated Gemini AI operates strictly as an analytical advisor. It calculates collection velocities, detects statistical spending anomalies, and aids in pocket budgeting. The AI has zero privileges to modify balances, approve requests, or withdraw funds.',
      guarantees: [
        'Read-only grounding on authorized member data only',
        'Cannot approve, modify, or execute financial transactions',
        'Flags anomalies objectively without accusatory claims',
      ],
    },
    {
      title: '7. Immutable Audit Logs & Traceability',
      icon: Receipt,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      description:
        'Every critical operational event—including group creation, member requests, approval/rejection decisions, contributions, rule alterations, and security events—is permanently written to an immutable audit trail.',
      guarantees: [
        'Un-deletable audit log with timestamp, actor ID, and IP address',
        'Comprehensive history accessible to authorized group leaders and auditors',
        'Zero stack traces or sensitive database internals exposed',
      ],
    },
    {
      title: '8. Suspicious Activity Reporting & Moderation',
      icon: AlertTriangle,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/20',
      description:
        'Members can review unusual transactions flagged by AI or peers and flag them for leader review or administrative moderation. CPA does not claim to verify charitable status or public fundraising causes.',
      guarantees: [
        'Direct reporting pathway for suspicious withdrawal requests',
        'Explicit disclaimer: CPA is a group-based shared-fund tool, not a regulated fundraising platform',
        'Temporary freeze capabilities on disputed transactions',
      ],
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => setActiveTab('dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Trust & Security Center</h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Architectural standards, verification guarantees, and governance policies of the CPA platform.
            </p>
          </div>
        </div>
      </div>

      {/* Pillars Grid */}
      <div className="space-y-6">
        {securityPillars.map((pillar, idx) => {
          const Icon = pillar.icon;
          return (
            <div
              key={idx}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition-all hover:border-slate-700"
            >
              <div className="flex items-start gap-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${pillar.bgColor} ${pillar.color} border ${pillar.borderColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-white">{pillar.title}</h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {pillar.description}
                  </p>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {pillar.guarantees.map((g, gIdx) => (
                      <div
                        key={gIdx}
                        className="flex items-start gap-2 rounded-lg bg-slate-950/60 p-2.5 text-[11px] text-slate-300 border border-slate-800/80"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{g}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
