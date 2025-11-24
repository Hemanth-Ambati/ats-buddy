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
