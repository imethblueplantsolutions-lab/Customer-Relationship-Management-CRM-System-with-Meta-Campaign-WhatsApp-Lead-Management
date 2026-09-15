"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, Clock, Smartphone, Send, Loader2 } from "lucide-react";
import type { Message } from "@/types";

interface LeadWhatsAppChatProps {
  messages: Message[];
  phoneNumber: string;
  onSendMessage: (text: string) => Promise<void>;
  sendingMessage: boolean;
}

function renderMessageStatusTick(status?: string) {
  const normStatus = (status || "sent").toLowerCase();

  if (normStatus === "failed") {
    return (
      <span title="Failed to deliver" className="inline-flex items-center text-red-500">
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10" strokeWidth="2" />
          <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" strokeLinecap="round" />
          <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
    );
  }

  if (normStatus === "read") {
    return (
      <span title="Read" className="inline-flex items-center text-blue-500">
        <svg className="h-3.5 w-3.5" viewBox="0 0 16 15" fill="none" stroke="currentColor">
          <path d="M10.5 3.5L4.5 10.5L1.5 7.5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14.5 3.5L8.5 10.5L7 8.8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }

  if (normStatus === "delivered") {
    return (
      <span title="Delivered" className="inline-flex items-center text-slate-400">
        <svg className="h-3.5 w-3.5" viewBox="0 0 16 15" fill="none" stroke="currentColor">
          <path d="M10.5 3.5L4.5 10.5L1.5 7.5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14.5 3.5L8.5 10.5L7 8.8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }

  // 'sent' default: Single gray check
  return (
    <span title="Sent" className="inline-flex items-center text-slate-400">
      <svg className="h-3.5 w-3.5" viewBox="0 0 16 15" fill="none" stroke="currentColor">
        <path d="M12.5 3.5L5.5 11.5L1.5 7.5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export default function LeadWhatsAppChat({
  messages,
  phoneNumber,
  onSendMessage,
  sendingMessage,
}: LeadWhatsAppChatProps) {
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || sendingMessage) return;
    const textToSend = messageText.trim();
    await onSendMessage(textToSend);
    setMessageText("");
  };

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden h-[540px]">
      {/* Chat Box Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-[#f8fafc] px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-xs">
              <MessageSquare className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800">
              WhatsApp Live Thread ({phoneNumber})
            </h3>
            <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Real-time Meta Webhook Connected
            </p>
          </div>
        </div>
        <span className="text-[11px] font-medium text-slate-400">
          {messages.length} messages
        </span>
      </div>

      {/* Chat Messages Stream */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-[#f0f2f5] bg-opacity-60">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-6 text-slate-400">
            <MessageSquare className="h-10 w-10 text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-600">No message history yet</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
              Inbound messages from Meta ads or direct WhatsApp chats will appear here automatically.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOutbound = msg.direction === "OUTBOUND";
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isOutbound ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[75%] sm:max-w-[68%] rounded-2xl px-3.5 py-2 text-xs shadow-xs relative ${
                    isOutbound
                      ? "bg-[#BBE1FA] text-slate-900 rounded-tr-none"
                      : "bg-white text-slate-800 rounded-tl-none border border-slate-200/80"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                  <div
                    className={`flex items-center gap-1.5 text-[9px] mt-1 text-slate-400 ${
                      isOutbound ? "justify-end text-emerald-700/60" : "justify-start"
                    }`}
                  >
                    {isOutbound && msg.source === "WHATSAPP_MOBILE" && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-600/15 text-emerald-800 font-semibold text-[8px] uppercase tracking-wide">
                        <Smartphone className="h-2.5 w-2.5" /> Mobile App
                      </span>
                    )}
                    <Clock className="h-2.5 w-2.5" />
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {isOutbound && renderMessageStatusTick(msg.status)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Outbound Message Composer */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2.5 border-t border-slate-200 bg-white p-3.5"
      >
        <input
          type="text"
          placeholder="Type a WhatsApp message to reply..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          disabled={sendingMessage}
          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
        />
        <button
          type="submit"
          disabled={sendingMessage || !messageText.trim()}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-all cursor-pointer"
        >
          {sendingMessage ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <span className="hidden sm:inline mr-1">Send</span>
              <Send className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
