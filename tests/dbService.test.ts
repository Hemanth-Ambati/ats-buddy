import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveUserSession, loadUserSession, getUserProfileResume, saveUserProfileResume } from '../services/dbService';

const { mockGraphql } = vi.hoisted(() => {
    return { mockGraphql: vi.fn() };
});

vi.mock('aws-amplify/api', () => ({
    generateClient: vi.fn(() => ({
        graphql: mockGraphql
    }))
}));

describe('dbService', () => {
    beforeEach(() => {
        mockGraphql.mockReset();
    });

    describe('saveUserSession', () => {
        it('saves a session successfully (update path)', async () => {
            // Mock ensureUserExists (getUser)
            mockGraphql.mockResolvedValueOnce({ data: { getUser: { id: 'user1' } } });
            // Mock updateSession
            mockGraphql.mockResolvedValueOnce({ data: { updateSession: { id: 'session1' } } });
            // Mock updateUser (lastSessionId)
            mockGraphql.mockResolvedValueOnce({ data: { updateUser: { id: 'user1' } } });

            await saveUserSession('user1', {
                sessionId: 'session1',
                correlationId: 'corr1',
                resumeText: 'resume content',
                jobDescriptionText: '',
                chatHistory: []
            });

            expect(mockGraphql).toHaveBeenCalledTimes(3);
        });

        it('creates a session if update fails', async () => {
            // Mock ensureUserExists (getUser)
            mockGraphql.mockResolvedValueOnce({ data: { getUser: { id: 'user1' } } });
            // Mock updateSession FAILURE
            mockGraphql.mockRejectedValueOnce(new Error('Item not found'));
            // Mock createSession SUCCESS
            mockGraphql.mockResolvedValueOnce({ data: { createSession: { id: 'session1' } } });
            // Mock updateUser (lastSessionId)
            mockGraphql.mockResolvedValueOnce({ data: { updateUser: { id: 'user1' } } });

            await saveUserSession('user1', {
                sessionId: 'session1',
                correlationId: 'corr1',
                resumeText: 'resume',
                jobDescriptionText: 'jd',
                chatHistory: []
            });

            // 1 check user + 1 update (fail) + 1 create + 1 update user = 4 calls
            expect(mockGraphql).toHaveBeenCalledTimes(4);
        });
    });

    describe('loadUserSession', () => {
        it('loads last session from user profile', async () => {
            // 1. getUser (returns lastSessionId='sess_123')
            mockGraphql.mockResolvedValueOnce({
                data: { getUser: { lastSessionId: 'sess_123' } }
            });
            // 2. getSession (by id)
            mockGraphql.mockResolvedValueOnce({
                data: { getSession: { id: 'sess_123', resumeText: 'foo' } }
            });

            const session = await loadUserSession('user1');
            expect(session?.sessionId).toBe('sess_123');
            expect(session?.resumeText).toBe('foo');
        });

        it('falls back to recent session query if no lastSessionId', async () => {
            // 1. getUser (no lastSessionId)
            mockGraphql.mockResolvedValueOnce({
                data: { getUser: { lastSessionId: null } }
            });
            // 2. sessionsByUserIdAndUpdatedAt
            mockGraphql.mockResolvedValueOnce({
                data: {
                    sessionsByUserIdAndUpdatedAt: {
                        items: [{ id: 'sess_recent', resumeText: 'bar' }]
                    }
                }
            });

            const session = await loadUserSession('user1');
            expect(session?.sessionId).toBe('sess_recent');
            expect(session?.resumeText).toBe('bar');
        });
    });

    describe('Profile Resume interactions', () => {
        it('saves profile resume', async () => {
            // ensureUserExists
            mockGraphql.mockResolvedValueOnce({ data: { getUser: { id: 'user1' } } });
            // updateUser
            mockGraphql.mockResolvedValueOnce({ data: { updateUser: { id: 'user1' } } });

            await saveUserProfileResume('user1', 'My Resume Body');
            expect(mockGraphql).toHaveBeenCalledTimes(2);
        });

        it('gets profile resume', async () => {
            mockGraphql.mockResolvedValueOnce({
                data: { getUser: { profileResume: 'My Resume Body' } }
            });

            const result = await getUserProfileResume('user1');
            expect(result).toBe('My Resume Body');
        });
    });
});
