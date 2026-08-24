import React, { useState, useEffect, useRef } from 'react';
import {
  Bot, Send, Sparkles, Clock, ArrowUpRight, MessageSquare,
  ShieldAlert, Layers, CheckCircle, RefreshCw, MapPin, ChevronRight,
  TrendingUp, Copy, HelpCircle, Activity, Info
} from 'lucide-react';
import { AIQueryResponse, ProjectCardData } from '../types';
import { api } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';

interface AiAssistantPageProps {
  initialQuery?: string;
  onSelectProject: (projectId: string) => void;
}

interface MessageHistoryItem {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  response?: AIQueryResponse;
  timestamp: string;
}

function formatMarkdown(raw: string): string {
  let text = raw;

  // Format markdown tables
  const tableRegex = /(\|.+?\|\n\|[-:| ]+\|\n(?:\|.+?\|\n?)+)/g;
  text = text.replace(tableRegex, (match) => {
    const lines = match.trim().split('\n');
    if (lines.length < 3) return match;
    const headerCells = lines[0].split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1).map(c => c.trim());
    const bodyRows = lines.slice(2).map(line =>
      line.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1).map(c => c.trim())
    );

    let tableHtml = '<div class="overflow-x-auto my-3"><table class="w-full text-xs text-left border-collapse border border-slate-200 rounded-lg overflow-hidden bg-slate-50/50">';
    tableHtml += '<thead><tr class="bg-slate-100 border-b border-slate-200">';
    headerCells.forEach(h => {
      tableHtml += `<th class="p-2 font-semibold text-slate-800">${h}</th>`;
    });
    tableHtml += '</tr></thead><tbody>';
    bodyRows.forEach((row, rIdx) => {
      tableHtml += `<tr class="border-b border-slate-100 ${rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}">`;
      row.forEach(cell => {
        tableHtml += `<td class="p-2 text-slate-700">${cell}</td>`;
      });
      tableHtml += '</tr>';
    });
    tableHtml += '</tbody></table></div>';
    return tableHtml;
  });

  // Blockquotes
  text = text.replace(/^>\s*(.+)$/gm, '<blockquote class="border-l-4 border-blue-500 bg-blue-50/60 p-2.5 my-2 rounded-r text-slate-700 italic">$1</blockquote>');

  // Headers
  text = text.replace(/^####\s*(.+)$/gm, '<h4 class="font-bold text-xs text-slate-900 mt-3 mb-1 uppercase tracking-wide">$1</h4>');
  text = text.replace(/^###\s*(.+)$/gm, '<h3 class="font-bold text-sm text-slate-900 mt-3 mb-1.5">$1</h3>');

  // Bold, italic, inline code
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>');
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  text = text.replace(/`([^`]+)`/g, '<code class="bg-slate-100 px-1.5 py-0.5 rounded text-blue-700 font-mono text-[11px] border border-slate-200">$1</code>');

  // Bullet points
  text = text.replace(/^-\s*(.+)$/gm, '<li class="ml-4 list-disc text-slate-700 my-0.5">$1</li>');

  // Paragraph spacing
  text = text.replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>');

  return text;
}

export const AiAssistantPage: React.FC<AiAssistantPageProps> = ({
  initialQuery,
  onSelectProject,
}) => {
  const [inputQuery, setInputQuery] = useState(initialQuery || '');
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'dataset' | 'mps' | 'anomaly' | 'geo' | 'financial' | 'duplicate' | 'methodology'>('dataset');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [history, setHistory] = useState<MessageHistoryItem[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello, Officer! 👋 I am **PARAKH**, your **MPLADS AI Natural Language Vigilance & Intelligence Assistant**.\n\nI can analyze all **95,964 authentic government works** and **205,000+ financial disbursement records** in real time. Ask me about Member of Parliament development records, dataset provenance, specific project anomalies, cost overruns, district delay patterns, duplicate works, or explainable AI risk drivers.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  // Auto-execute initialQuery if passed from other pages (e.g. Project Detail)
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleSend(initialQuery.trim());
    }
  }, [initialQuery]);

  const categorizedPrompts = {
    dataset: [
      'Tell me about the dataset and its info',
      'Is the data real or demo?',
      'Show Lok Sabha vs Rajya Sabha statistics',
      'Top 5 states by total expenditure',
      'Show emergency Calamity Relief projects',
    ],
    mps: [
      'Who are the top spending MPs?',
      'Tell me about Janardan Mishra',
      'Show works by Devusinh Chauhan',
      'Show works by Smt Aparajita Sarangi',
      'Show projects in Rewa constituency',
    ],
    anomaly: [
      'Why is project MPLAD-8386 high risk?',
      'Find projects with more than 30% cost escalation',
      'Show projects where financial progress is above 80% and physical progress is below 40%',
      'Show all critical risk projects nationwide',
    ],
    geo: [
      'Show high-risk projects in Uttar Pradesh',
      'Show projects in Rewa',
      'Which districts have the highest delay rate?',
      'Show delayed projects in Bihar',
    ],
    financial: [
      'Show national MPLADS expenditure summary',
      'Which projects have the highest budget overruns?',
      'Show projects with sanctioned amount > 50 Lakhs',
      'Show top implementing agencies by expenditure',
    ],
    duplicate: [
      'Show potential duplicate projects within 1 km',
      'Show flagged duplicate candidate pairs',
      'What is a Geographic Cluster Anomaly?',
      'Find works with high NLP text similarity',
    ],
    methodology: [
      'How does the Isolation Forest ML model detect anomalies?',
      'How is the composite risk score calculated?',
      'What are the MoSPI vigilance guidelines for work splitting?',
      'Explain the difference between physical and financial progress',
    ],
  };

  const handleSend = async (queryToSend?: string) => {
    const query = (queryToSend || inputQuery).trim();
    if (!query || loading) return;

    const userMsgId = Date.now().toString();
    const userItem: MessageHistoryItem = {
      id: userMsgId,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setHistory(prev => [...prev, userItem]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await api.askAiAssistant(query);
      const assistantItem: MessageHistoryItem = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: res.answer_markdown,
        response: res,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setHistory(prev => [...prev, assistantItem]);
    } catch (err: any) {
      const errorItem: MessageHistoryItem = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: `⚠️ **Query Error:** ${err.message || 'Unable to process query at this time. Please check your network connection.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setHistory(prev => [...prev, errorItem]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-3.5 pb-2">
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                MPLADS Natural Language AI Assistant
              </h2>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                Active &bull; 43,506 Works
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Ask any question about risk factors, state summaries, progress gaps, cost escalations, or spatial clusters.
            </p>
          </div>
        </div>

        <button
          onClick={() => setHistory(history.slice(0, 1))}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition shrink-0 self-start sm:self-auto"
        >
          Clear History
        </button>
      </div>

      {/* Messages Feed Area */}
      <div className="flex-1 bg-slate-50/60 border border-slate-200 rounded-2xl p-5 overflow-y-auto space-y-5 shadow-inner">
        {history.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === 'user' ? 'items-end' : 'items-start'
            } space-y-1.5`}
          >
            <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-mono">
              <span className="font-semibold text-slate-700">
                {msg.sender === 'user' ? 'You (Authorized Officer)' : 'MPLADS AI Engine'}
              </span>
              <span>&bull;</span>
              <span>{msg.timestamp}</span>
              {msg.response?.execution_time_ms && (
                <span className="text-blue-700 font-bold bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded">
                  {msg.response.execution_time_ms} ms
                </span>
              )}
            </div>

            {/* Bubble Container */}
            <div
              className={`p-4 sm:p-5 rounded-2xl max-w-3xl text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-xs'
              }`}
            >
              {/* Interpretation Pill for AI replies */}
              {msg.response?.interpretation && (
                <div className="mb-3 pb-2.5 border-b border-slate-100 flex items-center space-x-1.5 text-[11px] text-slate-600">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="font-medium">Intent Identified: <strong>{msg.response.interpretation}</strong></span>
                </div>
              )}

              {/* Main Markdown Text */}
              <div
                className="prose prose-xs max-w-none space-y-2 text-inherit"
                dangerouslySetInnerHTML={{
                  __html: formatMarkdown(msg.text),
                }}
              />

              {/* Matched Project Previews with 1-Click Deep Dive Link */}
              {msg.response && msg.response.matched_projects && msg.response.matched_projects.length > 0 && (
                <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                      <span>Matched Project Files ({msg.response.matched_projects.length})</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Click to open full file</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {msg.response.matched_projects.map((p) => (
                      <div
                        key={p.project_id}
                        onClick={() => onSelectProject(p.project_id)}
                        className="p-3.5 bg-slate-50 border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 rounded-xl cursor-pointer transition flex flex-col justify-between space-y-2 group shadow-2xs"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-blue-700 group-hover:underline flex items-center space-x-1">
                              <span>{p.project_id}</span>
                              <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </span>
                            <RiskBadge level={p.risk_level} score={p.overall_score} size="sm" />
                          </div>
                          <p className="text-[11px] font-semibold text-slate-900 line-clamp-2 mt-1 leading-snug">
                            {p.description}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {p.district}, {p.state} &bull; {p.project_type}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/80 text-[10px] font-mono text-slate-600">
                          <span>Spent: <strong className="text-slate-800">₹{p.expenditure.toFixed(1)}L</strong></span>
                          <span>Phys: <strong className="text-slate-800">{p.physical_progress.toFixed(0)}%</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Follow-up Action Chips */}
              {msg.response && msg.response.suggested_followups && msg.response.suggested_followups.length > 0 && (
                <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Suggested Exploration Next Steps:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.response.suggested_followups.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(s)}
                        className="text-[11px] bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 px-3 py-1 rounded-lg transition shadow-2xs flex items-center space-x-1 cursor-pointer"
                      >
                        <span>{s}</span>
                        <ChevronRight className="w-3 h-3 opacity-60" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-3 text-slate-600 text-xs py-3 px-4 bg-white rounded-2xl border border-slate-200 w-fit shadow-xs">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="font-medium">Querying 43,506 projects and synthesizing diagnostic telemetry...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Interactive Categorized Inquiry Topic Pills */}
      <div className="space-y-2 bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs">
        {/* Category Tabs */}
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-2 overflow-x-auto scrollbar-none text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
            Topic Explorer:
          </span>
          <button
            onClick={() => setActiveCategory('dataset')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition shrink-0 ${
              activeCategory === 'dataset' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            📊 Dataset & Info
          </button>
          <button
            onClick={() => setActiveCategory('mps')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition shrink-0 ${
              activeCategory === 'mps' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            🏛️ MPs & Leaders
          </button>
          <button
            onClick={() => setActiveCategory('anomaly')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition shrink-0 ${
              activeCategory === 'anomaly' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            🚨 Anomaly Diagnostics
          </button>
          <button
            onClick={() => setActiveCategory('geo')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition shrink-0 ${
              activeCategory === 'geo' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            📍 State & District
          </button>
          <button
            onClick={() => setActiveCategory('financial')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition shrink-0 ${
              activeCategory === 'financial' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            💰 Financial & Overruns
          </button>
          <button
            onClick={() => setActiveCategory('duplicate')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition shrink-0 ${
              activeCategory === 'duplicate' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            👥 Duplicates & Clusters
          </button>
          <button
            onClick={() => setActiveCategory('methodology')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition shrink-0 ${
              activeCategory === 'methodology' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            📚 AI Methodology
          </button>
        </div>

        {/* Selected Category Prompt Buttons */}
        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none py-0.5">
          {categorizedPrompts[activeCategory].map((promptText, i) => (
            <button
              key={i}
              onClick={() => handleSend(promptText)}
              className="whitespace-nowrap bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-medium transition shrink-0 shadow-2xs"
            >
              {promptText}
            </button>
          ))}
        </div>
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="bg-white border border-slate-200 rounded-2xl p-2 shadow-xs flex items-center space-x-3"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask AI anything (e.g. 'Show high risk projects in Uttar Pradesh' or 'Why is project MPLAD-RELIEF-Ra-19 high risk?')"
          className="flex-1 bg-transparent px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !inputQuery.trim()}
          className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition flex items-center justify-center shrink-0 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
