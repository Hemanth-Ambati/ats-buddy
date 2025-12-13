/**
 * Structured Logging and Observability Service
 * 
 * Implements a lightweight observability system for tracking agent execution:
 * - Structured log entries with consistent schema
 * - Correlation IDs for tracing requests across agent stages
 * - Pub/sub pattern for real-time log streaming to UI
 * - Performance timing utilities
 * 
 * Design Decision: In-memory pub/sub instead of external service
 * - No external dependencies (Datadog, CloudWatch, etc.)
 * - Logs stream to UI debug panel in real-time
 * - Simple implementation suitable for client-side application
 * - Could be extended to send logs to backend for production monitoring
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Structured log entry format.
 * Consistent schema enables filtering, searching, and correlation across logs.
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  sessionId?: string;           // Links log to user session
  correlationId?: string;       // Links log to specific analysis request
  agent?: string;               // Which agent generated this log
  stage?: string;               // Which pipeline stage (jdAnalysis, scoring, etc.)
  durationMs?: number;          // Execution time for performance monitoring
  extra?: Record<string, unknown>; // Additional context (scores, counts, etc.)
  error?: unknown;              // Error object if log is error-level
  timestamp: string;            // ISO 8601 timestamp
}

/**
 * Subscriber registry for pub/sub pattern.
 * Components can subscribe to receive log entries in real-time.
 */
const subscribers: Array<(entry: LogEntry) => void> = [];

/**
 * Subscribes to log stream for real-time updates.
 * Used by DebugPanel component to display logs in UI.
 * 
 * @param cb - Callback function to receive log entries
 * @returns Unsubscribe function to clean up when component unmounts
 */
export function subscribeLogger(cb: (entry: LogEntry) => void) {
  subscribers.push(cb);
  return () => {
    const idx = subscribers.indexOf(cb);
    if (idx >= 0) subscribers.splice(idx, 1);
  };
}

/**
 * Logs a structured entry to console and notifies all subscribers.
 * 
 * Design Decision: Dual output (console + subscribers)
 * - Console logs only appear when VITE_DEBUG_LOGS is set to 'true'
 * - Subscribers enable UI components to display logs to end users
 * - Log levels map to appropriate console methods (log/warn/error)
 */
const DEBUG_LOGS_ENABLED = typeof import.meta !== 'undefined' &&
  (import.meta as any).env?.VITE_DEBUG_LOGS === 'true';

export function log(entry: Omit<LogEntry, 'timestamp'>) {
  const payload: LogEntry = { ...entry, timestamp: new Date().toISOString() };

  // Only emit to console if debug logging is enabled
  if (DEBUG_LOGS_ENABLED) {
    switch (payload.level) {
      case 'debug':
      case 'info':
        console.log('[ATS Buddy]', payload);
        break;
      case 'warn':
        console.warn('[ATS Buddy]', payload);
        break;
      case 'error':
        console.error('[ATS Buddy]', payload);
        break;
    }
  }

  subscribers.forEach((fn) => fn(payload));
}

/**
 * Utility wrapper for timing async operations.
 * Automatically logs execution time on success or failure.
 * 
 * @param opts - Logging metadata (message, IDs, agent/stage info)
 * @param fn - Async function to execute and time
 * @returns Result of the async function
 * 
 * Usage example:
 * ```typescript
 * const result = await withTiming(
 *   { message: 'Running JD analysis', sessionId, stage: 'jdAnalysis' },
 *   () => generateStructured(prompt, schema)
 * );
 * ```
 */
export function withTiming<T>(opts: { message: string; sessionId?: string; correlationId?: string; agent?: string; stage?: string }, fn: () => Promise<T>) {
  const start = performance.now();
  return fn()
    .then((result) => {
      log({ level: 'info', ...opts, durationMs: performance.now() - start });
      return result;
    })
    .catch((error) => {
      log({ level: 'error', ...opts, durationMs: performance.now() - start, error });
      throw error;
    });
}
