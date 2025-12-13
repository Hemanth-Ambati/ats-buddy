import * as React from 'react';
import { chatWithGemini } from '../services/geminiService';
import type { AnalysisResult, ChatMessage } from '../types';
import ReactMarkdown from 'react-markdown';

interface ChatWindowProps {
  analysisResult: AnalysisResult | null;
  resumeText?: string;
  jobDescriptionText?: string;
  onResumeUpdate?: (updatedResume: string) => void;
  sessionId?: string;
  chatHistory?: ChatMessage[];
  onChatHistoryUpdate?: (message: ChatMessage) => void;
  onClose?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ analysisResult, resumeText, jobDescriptionText, onResumeUpdate, sessionId, chatHistory, onChatHistoryUpdate, onClose }) => {
  const [messages, setMessages] = React.useState<ChatMessage[]>(chatHistory ?? []);
  const [input, setInput] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    setMessages(chatHistory ?? []);
  }, [chatHistory, sessionId]);

  // Scroll to bottom on new messages
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = React.useCallback(async () => {
    const text = input.trim();
    if (!text) return;

    const userMessage: ChatMessage = { role: 'user', content: text, timestamp: Date.now() };

    // Optimistic update
    setMessages(prev => [...prev, userMessage]);
    onChatHistoryUpdate?.(userMessage);
    setInput('');
    setIsSending(true);

    try {
      // Prepare messages for API: prepend system message if analysis exists
      let apiMessages = [...messages, userMessage];

      const response = await chatWithGemini(apiMessages, analysisResult ?? null, resumeText, jobDescriptionText);

      // Check if the response contains a resume modification
      if (response.includes('UPDATED_RESUME:') && onResumeUpdate) {
        const parts = response.split('UPDATED_RESUME:');
        if (parts.length > 1) {
          const updatedResume = parts[1].trim();
          onResumeUpdate(updatedResume);
          const assistantMessage: ChatMessage = { role: 'assistant', content: parts[0].trim() + '\n\n✅ Resume updated successfully!', timestamp: Date.now() };
          setMessages(prev => [...prev, assistantMessage]);
          onChatHistoryUpdate?.(assistantMessage);
        } else {
          const assistantMessage: ChatMessage = { role: 'assistant', content: response, timestamp: Date.now() };
          setMessages(prev => [...prev, assistantMessage]);
          onChatHistoryUpdate?.(assistantMessage);
        }
      } else {
        const assistantMessage: ChatMessage = { role: 'assistant', content: response, timestamp: Date.now() };
        setMessages(prev => [...prev, assistantMessage]);
        onChatHistoryUpdate?.(assistantMessage);
      }
    } catch (err) {
      console.error('Chat send error:', err);
      const errorMsg: ChatMessage = { role: 'assistant', content: 'Sorry, I could not reach the AI service. Please try again later.', timestamp: Date.now() };
      setMessages(prev => [...prev, errorMsg]);
      onChatHistoryUpdate?.(errorMsg);
    } finally {
      setIsSending(false);
      // Use setTimeout to ensure focus happens after render
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [input, messages, analysisResult, resumeText, jobDescriptionText, onResumeUpdate, onChatHistoryUpdate]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="w-full h-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden flex flex-col relative ring-1 ring-slate-900/5 transition-colors duration-300">
      <div className="px-4 py-3 flex items-center justify-between bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Resume Assistant
        </h3>
        <div className="flex items-center gap-2">
          <div className="text-xs text-slate-400 font-medium mr-4">Context-aware</div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700 p-1 rounded transition-all duration-200"
              title="Close Chat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-slate-800">
        {messages.length === 0 && (
          <div className="text-slate-400 text-center mt-8 px-4">
            <p>Ask questions about your resume, analyze it against the job description, or request modifications.</p>
          </div>
        )}
        {messages.map((m, idx) => (
          <div key={`${m.timestamp}-${idx}`} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <div className={`${m.role === 'user' ? 'inline-block bg-sky-600 text-white shadow-sm' : 'inline-block bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600'} px-4 py-2.5 rounded-2xl max-w-[85%] text-left break-words prose prose-sm ${m.role === 'user' ? 'prose-invert' : 'dark:prose-invert'} rounded-tr-sm`}>
              {m.role === 'assistant' ? (
                <ReactMarkdown>{m.content}</ReactMarkdown>
              ) : (
                <span>{m.content}</span>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-3 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent shadow-sm select-text placeholder:text-slate-400 dark:placeholder:text-slate-500"
            placeholder={analysisResult ? 'Ask about analysis...' : 'Ask a question...'}
          />
          <button
            disabled={isSending}
            onClick={() => void handleSend()}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors select-none"
          >
            {isSending ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
