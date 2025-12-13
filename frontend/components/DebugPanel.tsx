import * as React from 'react';
import type { LogEntry } from '../services/logger';

interface DebugPanelProps {
  logs: LogEntry[];
  onClear?: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ logs, onClear, isOpen, onToggle }) => {
  return (
    <div className="fixed bottom-4 right-4 z-40 w-96 text-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-lg overflow-hidden">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between px-3 py-2 bg-slate-900 text-slate-100 border-b border-slate-700"
        >
          <span className="font-semibold">Debug Logs</span>
          <span className="text-xs text-slate-300">{isOpen ? 'Hide' : 'Show'}</span>
        </button>
        {isOpen && (
          <div className="max-h-72 overflow-y-auto p-3 space-y-2">
            {logs.length === 0 && <div className="text-slate-400">No logs yet</div>}
            {logs.map((log, idx) => (
              <div key={`${log.timestamp}-${idx}`} className="rounded border border-slate-700 bg-slate-900 p-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{log.level.toUpperCase()}</span>
                  <span>{log.timestamp}</span>
                </div>
                <div className="text-slate-100">{log.message}</div>
                <div className="text-[11px] text-slate-400">
                  {log.sessionId && <span>session: {log.sessionId} </span>}
                  {log.stage && <span>stage: {log.stage} </span>}
                  {typeof log.durationMs === 'number' && <span>duration: {Math.round(log.durationMs)}ms </span>}
                </div>
              </div>
            ))}
          </div>
        )}
        {isOpen && (
          <div className="border-t border-slate-700 flex items-center justify-end px-3 py-2">
            <button
              onClick={onClear}
              className="text-xs text-slate-300 hover:text-sky-300"
            >
              Clear
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
