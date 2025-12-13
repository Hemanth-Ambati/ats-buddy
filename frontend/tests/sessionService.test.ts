import { describe, it, expect, beforeEach } from 'vitest';
import { appendChat, createSession, loadSession, resetSession, updateSessionFields } from '../services/sessionService';
import type { ChatMessage } from '../types';

class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string) { return this.store.get(key) ?? null; }
  setItem(key: string, value: string) { this.store.set(key, value); }
  removeItem(key: string) { this.store.delete(key); }
  clear() { this.store.clear(); }
}

describe('sessionService', () => {
  beforeEach(() => {
    // @ts-expect-error - attaching for tests
    globalThis.localStorage = new MemoryStorage();
  });

  it('creates and persists a session', () => {
    const session = createSession();
    expect(session.sessionId).toBeDefined();
    const reloaded = loadSession();
    expect(reloaded.sessionId).toBe(session.sessionId);
  });

  it('updates resume and JD text fields', () => {
    const session = createSession();
    const updated = updateSessionFields(session, { resumeText: 'Resume', jobDescriptionText: 'JD' });
    expect(updated.resumeText).toBe('Resume');
    expect(updated.jobDescriptionText).toBe('JD');
  });

  it('appends chat history and persists', () => {
    const session = createSession();
    const msg: ChatMessage = { role: 'user', content: 'Hello', timestamp: Date.now() };
    const next = appendChat(session, msg);
    expect(next.chatHistory).toHaveLength(1);
    const rehydrated = loadSession();
    expect(rehydrated.chatHistory[0].content).toBe('Hello');
  });

  it('resets the session', () => {
    const session = createSession();
    const reset = resetSession();
    expect(reset.sessionId).not.toBe(session.sessionId);
  });
});
