import * as React from 'react';
import { chatWithGemini } from '../services/geminiService';
import type { AnalysisResult } from '../types';

interface ChatWindowProps {
  analysisResult: AnalysisResult | null;
  resumeText?: string;
  jobDescriptionText?: string;
  onResumeUpdate?: (updatedResume: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ analysisResult, resumeText, jobDescriptionText, onResumeUpdate }) => {
  const [messages, setMessages] = React.useState<Array<{ role: 'user' | 'assistant' | 'system'; content: string }>>([]);
  const [input, setInput] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [position, setPosition] = React.useState({ x: window.innerWidth - 400, y: 100 });
  const [size, setSize] = React.useState({ width: 384, height: 400 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [isResizing, setIsResizing] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = React.useState({ x: 0, y: 0, width: 0, height: 0 });
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const chatWindowRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    // If there's analysis available, add a short system message to indicate the chat
    // will use it. We keep the system message lightweight here because the service
    // call will prepend the full analysis when requesting responses.
    if (analysisResult) {
      setMessages(prev => [
        ...prev.filter(m => m.role !== 'system'),
        { role: 'system', content: 'Use the latest resume analysis as context for user questions.' },
      ]);
    }
  }, [analysisResult]);

  const handleSend = React.useCallback(async () => {
    const text = input.trim();
    if (!text) return;
    const userMessage = { role: 'user' as const, content: text };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      // Ask Gemini using the conversation + analysisContext + current resume + job description
      const response = await chatWithGemini([...messages, userMessage], analysisResult ?? null, resumeText, jobDescriptionText);
      
      // Check if the response contains a resume modification
      if (response.includes('UPDATED_RESUME:') && onResumeUpdate) {
        const parts = response.split('UPDATED_RESUME:');
        if (parts.length > 1) {
          const updatedResume = parts[1].trim();
          onResumeUpdate(updatedResume);
          const assistantMessage = { role: 'assistant' as const, content: parts[0].trim() + '\n\n✅ Resume updated successfully!' };
          setMessages(prev => [...prev, assistantMessage]);
        } else {
          const assistantMessage = { role: 'assistant' as const, content: response };
          setMessages(prev => [...prev, assistantMessage]);
        }
      } else {
        const assistantMessage = { role: 'assistant' as const, content: response };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (err) {
      const errorMsg = { role: 'assistant' as const, content: 'Sorry, I could not reach the AI service. Please try again later.' };
      setMessages(prev => [...prev, errorMsg]);
      console.error('Chat send error:', err);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }, [input, messages, analysisResult, resumeText, jobDescriptionText, onResumeUpdate]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  // Dragging functionality
  const handleMouseDownDrag = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({ 
      x: e.clientX, 
      y: e.clientY, 
      width: size.width, 
      height: size.height 
    });
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = Math.max(0, Math.min(window.innerWidth - size.width, e.clientX - dragStart.x));
        const newY = Math.max(0, Math.min(window.innerHeight - size.height, e.clientY - dragStart.y));
        setPosition({ x: newX, y: newY });
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        const newWidth = Math.max(300, Math.min(800, resizeStart.width + deltaX));
        const newHeight = Math.max(200, Math.min(600, resizeStart.height + deltaY));
        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, resizeStart, size.width, size.height]);

  // Ensure chat window stays within viewport bounds
  React.useEffect(() => {
    const handleResize = () => {
      setPosition(prev => ({
        x: Math.max(0, Math.min(window.innerWidth - size.width, prev.x)),
        y: Math.max(0, Math.min(window.innerHeight - size.height, prev.y))
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [size.width, size.height]);

  return (
    <div 
      ref={chatWindowRef}
      className="fixed z-50 select-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: isMinimized ? 'auto' : `${size.height}px`
      }}
    >
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-lg overflow-hidden h-full flex flex-col relative">
        <div 
          className="px-4 py-2 flex items-center justify-between bg-slate-900 border-b border-slate-700 cursor-move"
          onMouseDown={handleMouseDownDrag}
        >
          <h3 className="text-sm font-medium text-sky-300 pointer-events-none">Resume Assistant</h3>
          <div className="flex items-center gap-2">
            <div className="text-xs text-slate-400 pointer-events-none">Context-aware</div>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-slate-400 hover:text-sky-300 text-lg font-bold w-6 h-6 flex items-center justify-center rounded pointer-events-auto"
              onMouseDown={(e) => e.stopPropagation()}
            >
              {isMinimized ? '□' : '_'}
            </button>
          </div>
        </div>
        {!isMinimized && (
          <>
            <div 
              className="p-3 overflow-y-auto space-y-2 text-sm text-slate-100 flex-1 select-text"
              style={{ maxHeight: `${size.height - 120}px` }}
            >
              {messages.length === 0 && (
                <div className="text-slate-400">Ask questions about your resume, analyze it against the job description, or request modifications. I have full context of your analysis, resume, and job requirements.</div>
              )}
              {messages.map((m, idx) => (
                <div key={idx} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                  <div className={`${m.role === 'user' ? 'inline-block bg-sky-600 text-white' : 'inline-block bg-slate-700 text-slate-100'} px-3 py-2 rounded-md max-w-xs break-words`}> 
                    {m.content} 
                  </div>
                </div>
              ))}
            </div>
            <div className="px-3 py-2 border-t border-slate-700 bg-slate-800">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-slate-900 text-slate-100 px-3 py-2 rounded-md border border-slate-700 focus:outline-none select-text"
                  placeholder={analysisResult ? 'Ask about analysis, compare resume with job description, or request changes...' : 'Ask a question about your resume...'}
                />
                <button
                  disabled={isSending}
                  onClick={() => void handleSend()}
                  className="px-3 py-2 bg-sky-500 hover:bg-sky-600 rounded-md text-slate-900 font-semibold disabled:opacity-50 select-none"
                >
                  {isSending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
            {/* Resize handle */}
            <div 
              className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-60 hover:opacity-100 transition-opacity"
              style={{ 
                background: `
                  repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 2px,
                    #64748b 2px,
                    #64748b 3px
                  )
                `
              }}
              onMouseDown={handleMouseDownResize}
              title="Drag to resize"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;

