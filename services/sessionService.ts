/**
 * Session Management Service
 * 
 * Implements in-memory session state with localStorage persistence.
 * Sessions maintain user context across page refreshes and browser sessions.
 * 
 * Key Concepts:
 * - sessionId: Unique identifier for a user's session (persists across page loads)
 * - correlationId: Unique identifier for each analysis request (for tracing)
 * - State includes: resume text, job description, analysis results, chat history
 * 
 * Design Decision: localStorage for persistence
 * - Simple, client-side solution (no backend required)
 * - Enables instant resume recovery on page refresh
 * - Privacy-friendly: data never leaves user's browser
 * - Limitation: ~5-10MB storage limit (sufficient for resume use case)
 */

import { v4 as uuidv4 } from 'uuid';
import type { AnalysisResult, ChatMessage, SessionState } from '../types';
import { log } from './logger';

const STORAGE_KEY = 'ats-buddy-session';

/**
 * Safely parses session data from localStorage.
 * Returns null if parsing fails to prevent app crashes from corrupted data.
 */
function safeParseSession(raw: string | null): SessionState | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionState;
  } catch (err) {
    console.warn('Failed to parse saved session', err);
    return null;
  }
}

/**
 * Creates a new session with fresh UUIDs.
 * Called on first app load or when user explicitly resets.
 */
export function createSession(): SessionState {
  const session: SessionState = {
    sessionId: uuidv4(),
    correlationId: uuidv4(),
    resumeText: '',
    jobDescriptionText: '',
    chatHistory: [],
  };
  persistSession(session);
  return session;
}

/**
 * Loads existing session from localStorage or creates new one.
 * Called on app initialization to restore user's previous state.
 */
export function loadSession(): SessionState {
  const saved = safeParseSession(typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null);
  if (saved) return saved;
  return createSession();
}

/**
 * Persists session state to localStorage.
 * Called after every state mutation to ensure data isn't lost.
 */
export function persistSession(state: SessionState) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch (err) {
    console.warn('Failed to persist session', err);
  }
}

/**
 * Updates resume or job description text in session.
 * Immutable update pattern ensures React state updates trigger properly.
 */
export function updateSessionFields(state: SessionState, updates: Partial<Pick<SessionState, 'resumeText' | 'jobDescriptionText'>>): SessionState {
  const next = { ...state, ...updates };
  persistSession(next);
  return next;
}

/**
 * Saves completed analysis result to session.
 * Enables UI to display results even after page refresh.
 */
export function saveAnalysis(state: SessionState, analysis: AnalysisResult): SessionState {
  const next = { ...state, analysis };
  persistSession(next);
  return next;
}

/**
 * Appends a message to chat history.
 * Maintains conversation context for the AI assistant.
 */
export function appendChat(state: SessionState, message: ChatMessage): SessionState {
  const next = { ...state, chatHistory: [...state.chatHistory, message] };
  persistSession(next);
  return next;
}

/**
 * Resets session to fresh state, clearing all data.
 * Used when user wants to start over with a new resume/job description.
 */
export function resetSession(): SessionState {
  const session = createSession();
  log({ level: 'info', message: 'Session reset', sessionId: session.sessionId, correlationId: session.correlationId });
  return session;
}

// History Management (Fallback for when Firestore is unavailable)
const HISTORY_KEY = 'ats-buddy-history';

interface SessionHistoryMap {
  [sessionId: string]: SessionState;
}

function getHistory(): SessionHistoryMap {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.warn('Failed to parse session history', err);
    return {};
  }
}

function saveHistory(history: SessionHistoryMap) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (err) {
    console.warn('Failed to save session history', err);
  }
}

export function saveSessionToHistory(session: SessionState) {
  const history = getHistory();

  // Check if session has meaningful content
  const hasContent = (session.resumeText && session.resumeText.trim().length > 0) ||
    (session.jobDescriptionText && session.jobDescriptionText.trim().length > 0) ||
    (session.chatHistory && session.chatHistory.length > 0);

  if (hasContent) {
    // Update title if generic
    const title = session.title || (session.analysis?.jdAnalysis?.output?.title) || 'Untitled Session';

    history[session.sessionId] = {
      ...session,
      title,
      updatedAt: new Date().toISOString()
    };
  } else {
    // Remove from history if it exists (cleanup empty sessions)
    if (history[session.sessionId]) {
      delete history[session.sessionId];
    }
  }

  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (err) {
    console.warn('Failed to save session to history (quota exceeded?)', err);
  }
}

export function getLocalSessions(): { sessionId: string; title: string; updatedAt: string }[] {
  const history = getHistory();
  return Object.values(history)
    .filter(session => {
      // Filter out empty sessions
      return (session.resumeText && session.resumeText.trim().length > 0) ||
        (session.jobDescriptionText && session.jobDescriptionText.trim().length > 0) ||
        (session.chatHistory && session.chatHistory.length > 0);
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .map(session => ({
      sessionId: session.sessionId,
      title: session.title || 'Untitled Session',
      updatedAt: session.updatedAt || new Date().toISOString()
    }));
}

export function loadLocalSession(sessionId: string): SessionState | null {
  const history = getHistory();
  return history[sessionId] || null;
}

export function renameSessionInHistory(sessionId: string, newTitle: string): void {
  const history = getHistory();
  if (history[sessionId]) {
    history[sessionId].title = newTitle;
    history[sessionId].updatedAt = new Date().toISOString();
    saveHistory(history);
  }
}

export function deleteSessionFromHistory(sessionId: string): void {
  const history = getHistory();
  if (history[sessionId]) {
    delete history[sessionId];
    saveHistory(history);
  }
}
