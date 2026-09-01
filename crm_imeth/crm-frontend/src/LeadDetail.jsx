import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { apiClient } from './api/client';

export default function LeadDetail({ leadId, onBack }) {
  const [lead, setLead] = useState(null);
  const [agents, setAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Outbound Reply State
  const [outboundMessage, setOutboundMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Follow-up Form State
  const [followupType, setFollowupType] = useState('CALL');
  const [followupNote, setFollowupNote] = useState('');
  const [followupDate, setFollowupDate] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isPrivileged = ['ADMIN', 'TEAM_LEAD'].includes(currentUser.role);

  const fetchLeadDetail = async () => {
    try {
      const response = await apiClient(`/leads/${leadId}`);
      setLead(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAgents = async () => {
    if (!isPrivileged) return;
    try {
      const response = await apiClient('/users');
      setAgents(response.data || []);
    } catch (err) {
      console.error('Failed to fetch agents', err);
    }
  };

  useEffect(() => {
    fetchLeadDetail();
    fetchAgents();
  }, [leadId]);

  // Real-Time WebSocket Connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io('http://localhost:3000', { auth: { token } });

    socket.on('connect', () => {
      console.log('⚡ [WebSocket] Connected to real-time stream');
    });

    socket.on('new_message', (payload) => {
      if (payload.leadId === leadId) {
        setLead(prevLead => {
          if (!prevLead) return prevLead;
          const existing = prevLead.messages || [];
          if (existing.some(m => m.id === payload.message.id || m.messageId === payload.message.messageId)) {
            return prevLead;
          }
          return {
            ...prevLead,
            messages: [...existing, payload.message]
          };
        });
      }
    });

    return () => {
      socket.off('new_message');
      socket.disconnect();
    };
  }, [leadId]);

  const handleUpdate = async (updatePayload) => {
    setIsUpdating(true);
    try {
      await apiClient(`/leads/${leadId}`, {
        method: 'PUT',
        body: JSON.stringify(updatePayload)
      });
      setLead(prev => ({ ...prev, ...updatePayload }));
    } catch (err) {
      alert(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleScheduleFollowup = async (e) => {
    e.preventDefault();
    if (!followupDate) {
      alert('Please select a date and time for the follow-up.');
      return;
    }
    setIsScheduling(true);
    try {
      await apiClient(`/leads/${leadId}/followups`, {
        method: 'POST',
        body: JSON.stringify({
          type: followupType,
          note: followupNote,
          dueAt: new Date(followupDate).toISOString()
        })
      });
      setFollowupNote('');
      setFollowupDate('');
      fetchLeadDetail();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsScheduling(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!outboundMessage.trim()) return;
    
    setIsSendingMessage(true);
    try {
      await apiClient(`/leads/${leadId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body: outboundMessage })
      });
      setOutboundMessage('');
      fetchLeadDetail();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'NEW': return 'bg-[#dcf8c6] text-[#075e54] border border-[#25d366]/40 font-bold';
      case 'CONTACTED': return 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold';
      case 'QUALIFIED': return 'bg-teal-100 text-teal-900 border border-[#128c7e]/40 font-semibold';
      case 'CONVERTED': return 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold';
      case 'LOST': return 'bg-rose-100 text-rose-800 border border-rose-200 font-medium';
      default: return 'bg-slate-100 text-slate-700 border border-slate-200 font-medium';
    }
  };

  if (isLoading) return <div className="p-8 text-center text-[#075e54] font-semibold">Loading contact interaction history...</div>;
  if (error) return <div className="p-8 text-center text-red-600 font-medium">Error: {error}</div>;
  if (!lead) return <div className="p-8 text-center text-slate-600 font-medium">Lead not found.</div>;

  const assignedAgentName = agents.find(a => a.id === lead.assignedToId)?.email || lead.assignedTo?.email || 'Unassigned';

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans">
      {/* Top Controls Bar */}
      <div className="flex justify-between items-center">
        <button 
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-[#075e54] font-bold rounded-xl border border-slate-300 shadow-sm transition-all cursor-pointer"
        >
          <span>&larr;</span> Back to Leads
        </button>
        <span className="px-3.5 py-1.5 bg-[#dcf8c6] text-[#075e54] text-xs font-bold rounded-full border border-[#25d366]/50 flex items-center gap-2 shadow-2xs">
          <span className="w-2.5 h-2.5 rounded-full bg-[#25d366] animate-pulse"></span>
          WhatsApp Stream Active
        </span>
      </div>

      {/* Header Info & Lead Management Controls */}
      <div className="bg-white p-6 border border-slate-200/80 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-extrabold text-[#075e54]">{lead.name || 'Unknown Contact'}</h2>
            <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs ${getStatusBadgeClass(lead.status)}`}>
              {lead.status}
            </span>
          </div>
          <p className="text-slate-600 text-sm mb-1">
            <strong>Phone:</strong> <span className="font-mono text-[#075e54] font-semibold">{lead.phoneNumber}</span>
          </p>
          <p className="text-slate-600 text-sm">
            <strong>Category:</strong> <span className="text-slate-800">{lead.category || 'Organic'}</span>
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:text-right items-start sm:items-end">
          <p className="text-xs text-slate-500">
            Captured: {new Date(lead.createdAt).toLocaleString()}
          </p>

          <div className="flex flex-wrap gap-2 items-center justify-end">
            {/* Agent Assignee Dropdown */}
            {isPrivileged ? (
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Agent:</label>
                <select 
                  value={lead.assignedToId || ''}
                  onChange={(e) => handleUpdate({ assignedToId: e.target.value })}
                  disabled={isUpdating}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-medium focus:ring-2 focus:ring-[#128c7e] focus:outline-none cursor-pointer disabled:opacity-50 shadow-2xs"
                >
                  <option value="">Unassigned</option>
                  {agents.map(agent => (
                    <option key={agent.id} value={agent.id}>
                      {agent.email} ({agent.role})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <span className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 text-xs font-medium">
                👤 Agent: {assignedAgentName}
              </span>
            )}

            {/* Status Dropdown */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Status:</label>
              <select 
                value={lead.status}
                onChange={(e) => handleUpdate({ status: e.target.value })}
                disabled={isUpdating}
                className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-[#075e54] font-extrabold text-xs focus:ring-2 focus:ring-[#128c7e] focus:outline-none cursor-pointer disabled:opacity-50 shadow-2xs"
              >
                <option value="NEW">NEW</option>
                <option value="CONTACTED">CONTACTED</option>
                <option value="QUALIFIED">QUALIFIED</option>
                <option value="CONVERTED">CONVERTED</option>
                <option value="LOST">LOST</option>
              </select>
            </div>
          </div>
          {isUpdating && <span className="text-xs text-[#128c7e] font-semibold">Updating lead...</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Attribution & WhatsApp Chat Thread */}
        <div className="lg:col-span-2 space-y-6">
          {lead.attribution && (
            <div className="bg-gradient-to-r from-[#dcf8c6]/40 to-teal-50/50 p-6 border border-[#25d366]/40 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🎯</span>
                <h3 className="text-base font-bold text-[#075e54]">Meta Ad CTWA Attribution</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <p className="text-slate-700">
                  <strong>Ad ID:</strong> <span className="font-mono text-xs bg-white px-2 py-0.5 rounded border border-slate-200">{lead.attribution.adId || 'N/A'}</span>
                </p>
                <p className="text-slate-700">
                  <strong>Headline:</strong> <span className="font-semibold text-slate-900">{lead.attribution.headline || 'N/A'}</span>
                </p>
                <p className="col-span-1 sm:col-span-2 text-slate-700">
                  <strong>Ad Copy:</strong> {lead.attribution.body || 'N/A'}
                </p>
                {lead.attribution.sourceUrl && (
                  <p className="col-span-1 sm:col-span-2 truncate text-slate-700">
                    <strong>Source URL:</strong> <a href={lead.attribution.sourceUrl} target="_blank" rel="noreferrer" className="text-[#128c7e] hover:underline font-medium">{lead.attribution.sourceUrl}</a>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Authentic WhatsApp Chat Container */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm flex flex-col h-[580px] overflow-hidden">
            {/* Chat Header */}
            <div className="p-4 bg-[#075e54] text-white flex justify-between items-center shadow-xs">
              <div className="flex items-center space-x-3">
                <div className="h-9 w-9 rounded-full bg-[#25d366] text-white flex items-center justify-center font-bold text-sm">
                  {lead.name ? lead.name.charAt(0).toUpperCase() : 'C'}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">{lead.name || lead.phoneNumber}</h3>
                  <p className="text-[11px] text-emerald-100">WhatsApp Inbound Thread</p>
                </div>
              </div>
              <span className="text-xs text-emerald-100 bg-[#128c7e] px-2.5 py-1 rounded-full font-medium">
                {lead.messages?.length || 0} messages
              </span>
            </div>
            
            {/* Chat Message Scroll Canvas (Soft WhatsApp Wallpaper Feel) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#ece5dd]">
              {lead.messages && lead.messages.length > 0 ? (
                lead.messages.map((msg) => {
                  const isInbound = msg.direction === 'INBOUND' || !msg.direction;
                  return (
                    <div key={msg.id} className={`flex ${isInbound ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[78%] p-3.5 rounded-2xl shadow-xs ${
                        isInbound 
                          ? 'bg-white text-slate-900 rounded-tl-xs border border-slate-200/60' 
                          : 'bg-[#dcf8c6] text-[#075e54] rounded-tr-xs border border-[#25d366]/30'
                      }`}>
                        <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isInbound ? 'text-slate-500' : 'text-[#128c7e]'}`}>
                          {isInbound ? 'Customer' : 'Agent'}
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                        <span className={`text-[10px] font-mono block mt-1 text-right ${isInbound ? 'text-slate-400' : 'text-[#128c7e]'}`}>
                          {msg.timestamp ? (
                            isNaN(Number(msg.timestamp))
                              ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : new Date(Number(msg.timestamp) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          ) : new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-16 text-slate-500 text-sm bg-white/50 rounded-2xl m-4 border border-dashed border-slate-300">
                  No messages recorded in this conversation yet.
                </div>
              )}
            </div>

            {/* Chat Input Bar */}
            <div className="p-3 bg-[#f0f2f5] border-t border-slate-200">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={outboundMessage}
                  onChange={(e) => setOutboundMessage(e.target.value)}
                  placeholder="Type a WhatsApp reply to customer..."
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-[#128c7e] focus:outline-none shadow-2xs"
                  disabled={isSendingMessage}
                />
                <button
                  type="submit"
                  disabled={isSendingMessage || !outboundMessage.trim()}
                  className="px-6 py-2.5 bg-[#128c7e] hover:bg-[#075e54] text-white font-bold text-sm rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1"
                >
                  {isSendingMessage ? 'Sending...' : 'Send 💬'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: Schedule Follow-up & Pending Tasks */}
        <div className="space-y-6">
          <div className="bg-white p-6 border border-slate-200/80 rounded-2xl shadow-sm">
            <h3 className="text-base font-bold text-[#075e54] border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <span>📅</span> Schedule Follow-up
            </h3>
            <form onSubmit={handleScheduleFollowup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Type</label>
                <select 
                  value={followupType}
                  onChange={(e) => setFollowupType(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium text-sm focus:ring-2 focus:ring-[#128c7e] focus:outline-none shadow-2xs cursor-pointer"
                >
                  <option value="CALL">Phone Call</option>
                  <option value="MESSAGE">WhatsApp Message</option>
                  <option value="MEETING">Meeting / Demo</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Date & Time</label>
                <input 
                  type="datetime-local" 
                  required
                  value={followupDate}
                  onChange={(e) => setFollowupDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium text-sm focus:ring-2 focus:ring-[#128c7e] focus:outline-none shadow-2xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Action Note</label>
                <textarea 
                  required
                  value={followupNote}
                  onChange={(e) => setFollowupNote(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-[#128c7e] focus:outline-none shadow-2xs resize-none h-24"
                  placeholder="What needs to be done?"
                />
              </div>
              <button 
                type="submit" 
                disabled={isScheduling}
                className="w-full py-2.5 px-4 bg-[#128c7e] hover:bg-[#075e54] text-white font-bold text-sm rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {isScheduling ? 'Scheduling...' : '+ Add Follow-up Task'}
              </button>
            </form>
          </div>

          <div className="bg-white p-6 border border-slate-200/80 rounded-2xl shadow-sm">
            <h3 className="text-base font-bold text-[#075e54] border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <span>⏰</span> Scheduled Follow-ups
            </h3>
            {lead.followups && lead.followups.length > 0 ? (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {lead.followups.map(task => (
                  <div key={task.id} className="p-3.5 bg-[#dcf8c6]/50 border border-[#25d366]/40 rounded-xl space-y-1">
                    <div className="flex justify-between items-start">
                      <span className="text-[11px] font-bold text-[#075e54] uppercase tracking-wider bg-[#dcf8c6] px-2 py-0.5 rounded border border-[#25d366]/30">
                        {task.type}
                      </span>
                      <span className="text-xs font-bold text-[#075e54]">
                        {task.dueAt ? new Date(task.dueAt).toLocaleDateString() : 'No date'}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-800 mt-1 leading-normal">{task.note}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm text-center py-4">No pending follow-up tasks.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
