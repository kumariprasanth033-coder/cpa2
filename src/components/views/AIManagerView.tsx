import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  Send,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  BarChart3,
  Bot,
  User,
} from 'lucide-react';

export const AIManagerView: React.FC = () => {
  const { activeGroup, formatCurrency, aiInsights, currentUser, authToken } = useApp();

  const [chatLog, setChatLog] = useState<Array<{ sender: 'ai' | 'user'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: `Hello ${currentUser.fullName}! I am your CPA AI Financial Assistant powered by Gemini. I monitor spending patterns, analyze contribution velocities, and detect statistical anomalies. (Note: As an advisory AI, I operate in read-only mode and cannot execute transactions or modify balances.) How can I assist you today?`,
      time: 'Just now',
    },
  ]);
  const [userInput, setUserInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  // Quick preset query buttons
  const samplePrompts = [
    'Can I afford a ₹1,200 dinner out of my personal pocket?',
    'When will CSE Canteen Fund hit the ₹10,000 target?',
    'Are there any unusual or outlier transactions this week?',
    'How should we split our upcoming batch party expenses?',
  ];

  const handleSendPrompt = async (promptText: string) => {
    if (!promptText.trim()) return;

    const newMsg = {
      sender: 'user' as const,
      text: promptText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatLog((prev) => [...prev, newMsg]);
    setUserInput('');
    setIsThinking(true);

    try {
      const token = localStorage.getItem('cpa_auth_token') || authToken;
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: promptText,
          groupId: activeGroup?.id,
        }),
      });

      const data = await res.json();
      const reply = data.success
        ? data.reply
        : data.error || 'Unable to retrieve financial insights at this moment.';

      setChatLog((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      setChatLog((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'Network error communicating with CPA AI service.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Sparkles className="h-6 w-6 text-indigo-400" />
            <span>AI Money Manager</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Grounded financial intelligence powered by Gemini. Read-only advisory analysis with zero execution privileges.
          </p>
        </div>

        <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 font-mono text-xs font-bold text-indigo-400">
          Health Score: 86/100
        </span>
      </div>

      {/* Top 3 Intelligence Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center gap-2 text-indigo-400 font-bold mb-1">
            <TrendingUp className="h-4 w-4" />
            <span>Collection Velocity</span>
          </div>
          <p className="text-slate-300">
            Target attainment pace: <strong>75% complete</strong>. Forecasted to hit ₹10,000 in ~12 days.
          </p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-center gap-2 text-amber-300 font-bold mb-1">
            <AlertTriangle className="h-4 w-4" />
            <span>Anomaly Detection</span>
          </div>
          <p className="text-slate-300">
            1 outlier detected: ₹1,000 withdrawal is 3.1x the normal spending deviation.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
            <ShieldCheck className="h-4 w-4" />
            <span>Safety Sandbox</span>
          </div>
          <p className="text-slate-300">
            AI has zero financial execution rights. Safe, objective advisory recommendations.
          </p>
        </div>
      </div>

      {/* Interactive Chat Console */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-2xl flex flex-col h-[520px]">
        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/70">
          {chatLog.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 max-w-2xl ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                  msg.sender === 'ai'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {msg.sender === 'ai' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>
              <div>
                <div className={`flex items-center gap-2 text-[10px] text-slate-400 mb-1 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                  <span className="font-semibold text-slate-300">{msg.sender === 'ai' ? 'CPA AI (Gemini)' : 'You'}</span>
                  <span>{msg.time}</span>
                </div>
                <div
                  className={`rounded-2xl p-3.5 text-xs leading-relaxed ${
                    msg.sender === 'ai'
                      ? 'bg-slate-900 border border-slate-800 text-slate-200'
                      : 'bg-indigo-600 text-white rounded-tr-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="flex gap-3 max-w-xl">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3 text-xs text-indigo-300 flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
                <span>Gemini is analyzing ledger records...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-2.5 border-t border-slate-800 bg-slate-950/90 flex gap-2 overflow-x-auto text-[11px] scrollbar-none">
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendPrompt(p)}
              className="rounded-full bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800 px-3 py-1 text-slate-300 whitespace-nowrap cursor-pointer transition-colors"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendPrompt(userInput);
          }}
          className="p-3 border-t border-slate-800 bg-slate-900 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask CPA AI about affordability, budgets, or group trends..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
          <button
            type="submit"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
