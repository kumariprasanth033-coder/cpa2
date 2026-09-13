import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  QrCode,
  Users,
  Wallet,
  Sparkles,
  PieChart,
  MessageSquare,
  Lock,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Shield,
  Layers,
  HeartHandshake,
  TrendingUp,
  CreditCard,
  Building,
  GraduationCap,
  Tent,
  HelpCircle,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { setActiveTab, setQuickActionModal, formatCurrency } = useApp();

  // Animated letter state: C -> P -> A -> Full Reveal
  const [animStep, setAnimStep] = useState<number>(0);

  useEffect(() => {
    const t1 = setTimeout(() => setAnimStep(1), 400); // C
    const t2 = setTimeout(() => setAnimStep(2), 800); // P
    const t3 = setTimeout(() => setAnimStep(3), 1200); // A
    const t4 = setTimeout(() => setAnimStep(4), 1700); // Reveal full text
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  // FAQ open toggles
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: 'Does sharing a group link automatically make someone a member?',
      a: 'Never. CPA enforces a strict gatekeeper protocol: Link/QR → Security Verification → Join Request → PENDING → Leader Review → Approval. No one enters without explicit leader sign-off.',
    },
    {
      q: 'How does CPA handle multi-member approvals for withdrawals?',
      a: 'Withdrawal rules are configurable server-side. For instance, amounts above ₹1,000 require 2 independent member approvals. Crucially, the system strictly forbids self-approval by the requester.',
    },
    {
      q: 'Is CPA a public crowdfunding or charity platform?',
      a: 'No. CPA is designed strictly for private shared-pocket and team fund management (e.g., college activities, roommates, trips, canteen funds). CPA does not verify public fundraising causes or provide tax exemptions.',
    },
    {
      q: 'Can the Gemini AI modify wallet balances or execute payouts?',
      a: 'No. The AI engine is strictly sandboxed in read-only analytical mode. It analyzes spending velocity, flags statistical anomalies, and provides budgeting insights, but holds zero execution privileges.',
    },
    {
      q: 'What is the difference between Join QR and Contribution QR?',
      a: 'A Join QR routes to the group authentication portal to request membership. A Contribution QR routes directly to the verified collection page where members or supporters can contribute funds.',
    },
  ];

  return (
    <div className="relative overflow-hidden bg-slate-950 text-slate-100">
      {/* Background Radial Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-b from-emerald-500/10 via-teal-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* FLOATING CHIPS / PILLS (Support Reduced Motion) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10 select-none">
        <div className="absolute top-24 left-[10%] rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono font-semibold text-emerald-400 shadow-lg shadow-emerald-500/10 animate-bounce duration-1000 motion-reduce:animate-none">
          +₹1,000
        </div>
        <div className="absolute top-36 right-[12%] rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-mono font-semibold text-cyan-400 shadow-lg shadow-cyan-500/10 animate-pulse motion-reduce:animate-none">
          ₹500
        </div>
        <div className="absolute top-72 left-[5%] rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-300">
          Approved ✓
        </div>
        <div className="absolute top-80 right-[8%] rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
          Pending Review ⏳
        </div>
        <div className="absolute top-[480px] left-[15%] rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
          AI Insight 💡
        </div>
        <div className="absolute top-[520px] right-[18%] rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs font-semibold text-slate-300">
          Group Wallet 🔒
        </div>
      </div>

      {/* SECTION 1: HERO */}
      <section className="relative px-4 pt-16 pb-20 sm:px-6 lg:px-8 text-center max-w-5xl mx-auto">
        {/* Animated C -> P -> A display */}
        <div className="inline-flex items-center gap-2 mb-6">
          <div className="flex h-16 w-36 items-center justify-center rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-slate-900 to-slate-950 p-2 shadow-2xl shadow-emerald-500/20">
            <span className="font-mono text-3xl font-black tracking-widest text-emerald-400">
              <span className={`inline-block transition-opacity duration-300 ${animStep >= 1 ? 'opacity-100' : 'opacity-20'}`}>C</span>
              <span className={`inline-block transition-opacity duration-300 ${animStep >= 2 ? 'opacity-100' : 'opacity-20'}`}>P</span>
              <span className={`inline-block transition-opacity duration-300 ${animStep >= 3 ? 'opacity-100' : 'opacity-20'}`}>A</span>
            </span>
          </div>
        </div>

        {/* Revealed Name */}
        <div className={`transition-all duration-500 ${animStep >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
          <div className="inline-block rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1 text-xs font-semibold tracking-widest text-emerald-400 uppercase mb-3">
            Centralized Pocket Account
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            One Pocket. One Group.{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Complete Control.
            </span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal">
            Collect together. Manage transparently. Spend responsibly.
          </p>
          <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            The AI-powered treasury system for college groups, teams, roommates, and projects. No fragmented UPI accounts or lost receipts.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => setQuickActionModal('create-group')}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-xl shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-400 transition-all cursor-pointer"
            >
              <Wallet className="h-4 w-4" />
              <span>Create CPA</span>
            </button>

            <button
              onClick={() => setQuickActionModal('join-cpa')}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-6 py-3.5 text-sm font-bold text-slate-200 hover:border-slate-600 hover:bg-slate-800 transition-all cursor-pointer"
            >
              <Users className="h-4 w-4 text-emerald-400" />
              <span>Join CPA</span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-3.5 text-sm font-bold text-emerald-300 hover:bg-emerald-500/20 transition-all cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span>Explore Demo (CSE Canteen)</span>
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 2: HOW CPA WORKS */}
      <section className="border-y border-slate-800/80 bg-slate-950/60 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Workflow</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">How CPA Works</h2>
            <p className="text-xs text-slate-400 mt-1">
              Deterministic, zero-trust lifecycle for shared funds:
            </p>
          </div>

          {/* Lifecycle Steps */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {[
              { step: 'CREATE', label: 'Group & PIN', icon: '1' },
              { step: 'SHARE', label: 'Token Link / QR', icon: '2' },
              { step: 'REQUEST', label: 'Verification', icon: '3' },
              { step: 'APPROVE', label: 'Leader Sign-off', icon: '4' },
              { step: 'CONTRIBUTE', label: 'Verified Gateway', icon: '5' },
              { step: 'MANAGE', label: 'Expense Splits', icon: '6' },
              { step: 'MONITOR', label: 'Gemini AI Health', icon: '7' },
              { step: 'CONTROL', label: 'Multi-Sig Payout', icon: '8' },
            ].map((item, idx) => (
              <div
                key={item.step}
                className="relative flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-center"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 font-mono text-xs font-bold text-emerald-400 border border-emerald-500/20">
                  {item.icon}
                </span>
                <span className="mt-2 text-xs font-bold tracking-tight text-white">{item.step}</span>
                <span className="text-[10px] text-slate-400 mt-0.5">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: GROUP WALLET & CENTRALIZED TREASURY */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 mb-3">
              <Wallet className="h-3.5 w-3.5" />
              Autonomous Centralized Wallet
            </div>
            <h2 className="text-3xl font-extrabold text-white leading-tight">
              One Shared Account for Your Entire Group.
            </h2>
            <p className="mt-4 text-sm text-slate-300 leading-relaxed">
              Upon group creation, CPA automatically initializes an isolated wallet, unique identifier (e.g.,{' '}
              <code className="rounded bg-slate-900 px-1.5 py-0.5 font-mono text-xs text-emerald-400">
                CPA-GRP-8F42X9
              </code>
              ), and an immutable double-entry ledger.
            </p>
            <ul className="mt-6 space-y-3 text-xs text-slate-300">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>No browser-manipulated balances:</strong> The server ledger is the sole authoritative source.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Decimal-safe integer accounting:</strong> All money recorded in base paise to prevent precision errors.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Multi-signature withdrawal safety:</strong> Large payouts mandate 2+ member approvals.</span>
              </li>
            </ul>
          </div>

          {/* Wallet Interactive Preview Box */}
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Centralized Pocket</span>
                <div className="text-base font-bold text-white">CSE CANTEEN FUND</div>
              </div>
              <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 font-mono text-xs text-emerald-400">
                CPA-GRP-8F42X9
              </span>
            </div>

            <div className="my-6">
              <span className="text-xs text-slate-400">Available Treasury Balance</span>
              <div className="text-3xl font-extrabold text-white font-mono mt-1">₹2,700.00</div>
              <div className="mt-3 flex gap-2">
                <div className="flex-1 rounded-lg bg-slate-950/80 p-2.5 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Collected</div>
                  <div className="text-sm font-bold text-emerald-400">₹7,500.00</div>
                </div>
                <div className="flex-1 rounded-lg bg-slate-950/80 p-2.5 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Spent</div>
                  <div className="text-sm font-bold text-slate-300">₹3,800.00</div>
                </div>
                <div className="flex-1 rounded-lg bg-slate-950/80 p-2.5 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Target</div>
                  <div className="text-sm font-bold text-cyan-400">₹10,000.00</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 flex items-center justify-between text-xs">
              <span className="text-slate-400">Collection Target Progress</span>
              <span className="font-bold text-emerald-400">75%</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: MANDATORY SECURE JOIN FLOW */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-800/80 bg-slate-950/40">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300 mb-3">
            <Lock className="h-3.5 w-3.5" />
            Mandatory Security Rule
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Links and QRs Never Auto-Add Anyone.
          </h2>
          <p className="mt-3 text-sm text-slate-300 max-w-2xl mx-auto">
            Clicking a shared link or entering a password only creates a <strong>Join Request</strong>. It remains{' '}
            <span className="text-amber-400 font-semibold">PENDING</span> until the group leader explicitly reviews and
            approves the applicant.
          </p>

          {/* Visual Step Comparison */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-xs font-mono font-bold text-emerald-400">Step 1</span>
              <h3 className="text-sm font-bold text-white mt-1">Open Link or Scan QR</h3>
              <p className="text-xs text-slate-400 mt-1">User opens the high-entropy invitation token. No group passwords appear in URLs.</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-xs font-mono font-bold text-emerald-400">Step 2</span>
              <h3 className="text-sm font-bold text-white mt-1">PIN Challenge</h3>
              <p className="text-xs text-slate-400 mt-1">Applicant submits their credentials and group PIN for verified authentication.</p>
            </div>
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
              <span className="text-xs font-mono font-bold text-amber-400">Step 3</span>
              <h3 className="text-sm font-bold text-white mt-1">Pending Leader Review</h3>
              <p className="text-xs text-slate-400 mt-1">Applicant is queued. Sensitive internal group balances and chats remain strictly hidden.</p>
            </div>
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
              <span className="text-xs font-mono font-bold text-emerald-400">Step 4</span>
              <h3 className="text-sm font-bold text-white mt-1">Leader Decision</h3>
              <p className="text-xs text-slate-400 mt-1">Leader clicks Approve. The applicant officially becomes an Active CPA Member.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: DUAL QR SYSTEM */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Two Distinct Concepts</span>
          <h2 className="text-3xl font-extrabold text-white mt-1">The Dual QR Engine</h2>
          <p className="text-xs text-slate-400 mt-1">Every CPA group is generated with separate QRs for join access and verified collections.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Join QR Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                  <Users className="h-5 w-5" />
                </span>
                <span className="font-mono text-xs text-slate-400">TYPE: JOIN_QR</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-4">A. Join QR</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Designed to invite prospective members. Scanning navigates to the group landing screen, prompts login/register, validates PIN, and submits a join request for leader approval.
              </p>
            </div>
            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-400">
              Flow: Scan → Landing → Auth → PIN Check → Join Request (Pending)
            </div>
          </div>

          {/* Contribution QR Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-lg bg-teal-500/10 p-2 text-teal-400">
                  <HeartHandshake className="h-5 w-5" />
                </span>
                <span className="font-mono text-xs text-slate-400">TYPE: CONTRIB_QR</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-4">B. Contribution QR</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Designed to collect pooled funds. Scanning resolves the verified group identity, displays target progress, and opens the payment gateway.
              </p>
            </div>
            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-400">
              Flow: Scan → Verified Identity → Enter Amount → Payment Gateway → Webhook → Ledger
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: AI MONEY MANAGER (GEMINI) */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-y border-slate-800/80 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Intelligent Oversight</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white">AI Money Manager Powered by Gemini</h2>
          <p className="mt-2 text-sm text-slate-300 max-w-2xl">
            CPA AI monitors spending patterns, forecasts collection completion dates, detects statistical anomalies, and provides natural-language budgeting advice without ever touching payment execution.
          </p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <h4 className="font-bold text-white">Collection Velocity</h4>
              <p className="text-slate-400 mt-1">Forecasts target attainment using average contribution velocity and active participation rates.</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <h4 className="font-bold text-white">Anomaly Detection</h4>
              <p className="text-slate-400 mt-1">Highlights outlier transactions (e.g., a ₹8,000 withdrawal vs median ₹300) to ensure thorough scrutiny.</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <h4 className="font-bold text-white">Money Health Score</h4>
              <p className="text-slate-400 mt-1">Calculates an algorithmic score (e.g., 86/100) assessing budget discipline, settlement rate, and savings.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: USE CASES */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Target Scenarios</span>
          <h2 className="text-3xl font-extrabold text-white mt-1">Built for Real Everyday Groups</h2>
          <p className="text-xs text-slate-400 mt-1">Legitimate shared pockets with total audit transparency.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
            <GraduationCap className="h-6 w-6 text-emerald-400 mb-3" />
            <h3 className="text-sm font-bold text-white">College Activities & Projects</h3>
            <p className="text-slate-400 mt-1">Batch fests, lab equipment funds, snack subscriptions, and tech symposium budgets.</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
            <Building className="h-6 w-6 text-cyan-400 mb-3" />
            <h3 className="text-sm font-bold text-white">Roommates & Shared Living</h3>
            <p className="text-slate-400 mt-1">Apartment rent buffers, grocery pools, internet bills, and maintenance funds.</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
            <Tent className="h-6 w-6 text-teal-400 mb-3" />
            <h3 className="text-sm font-bold text-white">Trips & Vacations</h3>
            <p className="text-slate-400 mt-1">Joint travel pots, Airbnb deposits, driver fees, and itemized restaurant splits.</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
            <HeartHandshake className="h-6 w-6 text-indigo-400 mb-3" />
            <h3 className="text-sm font-bold text-white">Clubs & Community Groups</h3>
            <p className="text-slate-400 mt-1">Sports team uniforms, tournament registrations, and neighborhood event pools.</p>
          </div>
        </div>
      </section>

      {/* SECTION 8: FAQ */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-800/80 bg-slate-950/60 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Questions</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="flex w-full items-center justify-between p-4 text-left text-xs sm:text-sm font-bold text-white hover:text-emerald-300 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === idx && (
                <div className="p-4 pt-0 text-xs text-slate-300 leading-relaxed border-t border-slate-800/40 bg-slate-950/40">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 9: FINAL CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 text-center max-w-4xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
          Ready to Centralize Your Group Finances?
        </h2>
        <p className="mt-3 text-sm text-slate-300 max-w-xl mx-auto">
          Launch your group wallet in under 60 seconds with leader-approved security and transparent tracking.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setQuickActionModal('create-group')}
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-xl shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-400 transition-all cursor-pointer"
          >
            Create Your First Group CPA
          </button>
          <button
            onClick={() => setActiveTab('trust-center')}
            className="rounded-xl border border-slate-800 bg-slate-900 px-6 py-3.5 text-sm font-bold text-slate-300 hover:bg-slate-800 transition-all cursor-pointer"
          >
            Read Trust & Security Standards
          </button>
        </div>
      </section>

      {/* SECTION 10: FOOTER */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-10 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-bold text-slate-300">CPA — Centralized Pocket Account</span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              One Pocket. One Group. Complete Control. Group-based contribution & shared fund management.
            </p>
          </div>
          <div className="flex gap-6">
            <button onClick={() => setActiveTab('trust-center')} className="hover:text-slate-300">
              Trust & Security
            </button>
            <button onClick={() => setActiveTab('dashboard')} className="hover:text-slate-300">
              Live Demo
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
