import React, { useState, useRef, useEffect } from 'react';
import { Bot, Sparkles, X, Maximize2, Send, Loader2, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

interface FloatingAiWidgetProps {
  onOpenFullAssistant: (initialQuery?: string) => void;
  onSelectProject: (projectId: string) => void;
  activeScreen: string;
}

interface MiniMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  matched_projects?: any[];
  followups?: string[];
}

export const FloatingAiWidget: React.FC<FloatingAiWidgetProps> = ({
  onOpenFullAssistant,
  onSelectProject,
  activeScreen,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<MiniMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: '👋 Hello! I am **PARAKH AI**, your real-time vigilance & MP intelligence assistant. How can I assist you?',
      followups: [
        'Top spending MPs',
        'Tell me about Janardan Mishra',
        'Why is project MPLAD-8386 high risk?',
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (queryText?: string) => {
    const q = (queryText || inputQuery).trim();
    if (!q || loading) return;

    const userMsg: MiniMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await api.askAiAssistant(q);
      const assistantMsg: MiniMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: res.answer_markdown || 'Analysis completed.',
        matched_projects: res.matched_projects,
        followups: res.suggested_followups,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: `⚠️ Query failed: ${err.message || 'Error communicating with AI engine.'}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Simple markdown renderer for mini popup
  const renderMarkdown = (text: string) => {
    let clean = text
      .replace(/^###\s*(.+)$/gm, '<h4 class="font-bold text-xs text-slate-900 mt-2 mb-1">$1</h4>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>')
      .replace(/`([^`]+)`/g, '<code class="bg-slate-100 px-1 py-0.5 rounded text-blue-700 font-mono text-[10px]">$1</code>')
      .replace(/^-\s*(.+)$/gm, '<li class="ml-3 list-disc text-slate-700 text-[11px] my-0.5">$1</li>')
      .replace(/\n\n/g, '<br/>')
      .replace(/\n/g, '<br/>');
    return clean;
  };

  return (
    <>
      {/* Floating Interactive Popup Box */}
      {isOpen && (
        <div className="fixed bottom-22 right-6 w-96 max-w-[92vw] h-[520px] bg-white rounded-3xl border border-slate-200/90 shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-[#111729] to-[#1e293b] text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="text-xs font-bold tracking-tight text-white">PARAKH AI Assistant</h3>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-[10px] text-slate-400 font-mono">95,964 Real Records</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenFullAssistant(inputQuery);
                }}
                className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                title="Expand to Full Assistant Screen"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                title="Close Window"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Conversation Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/60 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl p-3 text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white shadow-xs font-medium'
                      : 'bg-white border border-slate-200 text-slate-800 shadow-xs'
                  }`}
                >
                  <div
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(m.text) }}
                    className="overflow-x-auto text-[11px]"
                  />

                  {/* Matched Project Cards in Mini Mode */}
                  {m.matched_projects && m.matched_projects.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                        Referenced Projects:
                      </span>
                      {m.matched_projects.slice(0, 2).map((p) => (
                        <div
                          key={p.project_id}
                          onClick={() => {
                            setIsOpen(false);
                            onSelectProject(p.project_id);
                          }}
                          className="bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 p-2 rounded-xl cursor-pointer transition flex items-center justify-between"
                        >
                          <div className="truncate mr-2">
                            <span className="font-mono font-bold text-blue-700 text-[10px]">{p.project_id}</span>
                            <p className="text-[10px] text-slate-600 truncate">{p.description}</p>
                          </div>
                          <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Followup suggestion pills */}
                {m.followups && m.followups.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5 max-w-[90%]">
                    {m.followups.slice(0, 3).map((f, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(f)}
                        className="bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 text-[10px] px-2 py-0.5 rounded-full font-medium transition truncate shadow-2xs cursor-pointer"
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center space-x-2 bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-2xl w-fit shadow-xs">
                <Loader2 className="w-3.5 h-3.5 text-purple-600 animate-spin" />
                <span className="text-[11px] font-medium">Analyzing 95,964 works...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask PARAKH AI..."
                className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white transition"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || loading}
                className="p-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-xl shadow-xs transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Button on Bottom Right Corner */}
      <button
        onClick={() => {
          if (activeScreen === 'assistant') {
            onOpenFullAssistant();
          } else {
            setIsOpen(!isOpen);
          }
        }}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-full shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-200 flex items-center space-x-2.5 px-4 py-3 border border-purple-300/40 shadow-purple-500/30 group cursor-pointer"
        title="Ask PARAKH AI Assistant"
      >
        <div className="relative flex items-center justify-center">
          <Bot className="w-5 h-5 text-white transition-transform group-hover:rotate-6" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-purple-700 animate-pulse" />
        </div>
        <span className="text-xs font-bold tracking-wide">
          {isOpen ? 'Close AI' : 'Ask AI'}
        </span>
      </button>
    </>
  );
};
