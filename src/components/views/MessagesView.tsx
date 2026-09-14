import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  MessageSquare,
  Send,
  HeartHandshake,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Smile,
  Info,
} from 'lucide-react';

export const MessagesView: React.FC = () => {
  const {
    activeGroup,
    chatMessages,
    sendChatMessage,
    currentUser,
    formatCurrency,
    approveWithdrawalRequest,
  } = useApp();

  const [inputMessage, setInputMessage] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    sendChatMessage(inputMessage.trim());
    setInputMessage('');
  };

  const groupMessages = chatMessages.filter((m) => m.groupId === activeGroup?.id);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8 h-[calc(100vh-100px)] flex flex-col">
      {/* Chat Header */}
      <div className="rounded-t-2xl border border-slate-800 bg-slate-900/90 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{activeGroup?.name || 'Group Chat'}</span>
              <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.2 font-mono text-[10px] text-emerald-400">
                {activeGroup?.cpaNumber}
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">Encrypted Group Treasury Communication</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Lock className="h-3.5 w-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Active Members Only</span>
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto border-x border-slate-800 bg-slate-950/80 p-4 space-y-4">
        {groupMessages.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-500">
            No messages yet. Send a note or make a contribution to start group activity.
          </div>
        ) : (
          groupMessages.map((msg) => {
            const isMe = msg.senderId === currentUser.id;
            const isSystem = msg.type === 'SYSTEM';

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <div className="rounded-full bg-slate-900 border border-slate-800 px-3 py-1 text-[10px] text-slate-400">
                    {msg.text}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-xl ${isMe ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 font-bold text-slate-300 text-xs">
                  {msg.senderName[0]}
                </div>

                <div className="space-y-1">
                  <div className={`flex items-center gap-2 text-[10px] text-slate-400 ${isMe ? 'justify-end' : ''}`}>
                    <span className="font-semibold text-slate-300">{msg.senderName}</span>
                    <span className="rounded bg-slate-900 px-1 text-[9px] uppercase font-bold text-slate-400">
                      {msg.role}
                    </span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {/* Standard Text or Financial Event Card */}
                  {msg.type === 'FINANCIAL_CARD' && msg.financialData ? (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 text-xs shadow-md">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold">
                        <HeartHandshake className="h-4 w-4" />
                        <span>Financial Event</span>
                      </div>
                      <p className="mt-1 font-semibold text-white">{msg.text}</p>
                      <div className="mt-2 text-[10px] text-emerald-300 bg-emerald-500/10 p-1.5 rounded font-mono">
                        {msg.financialData.summary}
                      </div>
                    </div>
                  ) : msg.type === 'APPROVAL_CARD' && msg.financialData ? (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 text-xs shadow-md">
                      <div className="flex items-center gap-2 text-amber-400 font-bold">
                        <ShieldCheck className="h-4 w-4" />
                        <span>Withdrawal Sign-off Request</span>
                      </div>
                      <p className="mt-1 font-semibold text-white">{msg.text}</p>
                      <div className="mt-2 text-[10px] text-amber-300 bg-amber-500/10 p-1.5 rounded font-mono">
                        Status: {msg.financialData.status}
                      </div>
                      {!isMe && (
                        <button
                          onClick={async () => {
                            if (msg.financialData?.referenceId) {
                              const res = await approveWithdrawalRequest(msg.financialData.referenceId);
                              alert(res.message);
                            }
                          }}
                          className="mt-2 w-full rounded-lg bg-amber-600 hover:bg-amber-500 py-1.5 font-bold text-white text-[11px] cursor-pointer"
                        >
                          Cast Approval Vote
                        </button>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-xs ${
                        isMe
                          ? 'bg-emerald-600 text-white rounded-tr-none'
                          : 'bg-slate-900 text-slate-100 border border-slate-800 rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSend}
        className="rounded-b-2xl border border-slate-800 bg-slate-900/90 p-3 flex items-center gap-2"
      >
        <input
          type="text"
          placeholder="Message group or discuss shared expenses..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
        />
        <button
          type="submit"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shrink-0"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};
