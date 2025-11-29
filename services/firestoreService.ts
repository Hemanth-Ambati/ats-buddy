/**
 * Firestore Data Service
 * 
 * Handles persistence of user data to Firestore.
 * Replaces localStorage for authenticated users.
 */

import { doc, setDoc, getDoc, collection, getDocs, query, orderBy, limit, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { SessionState } from '../types';
import { log } from './logger';

export interface SessionSummary {
    sessionId: string;
    title: string;
    updatedAt: string;
    preview?: string;
}

const USERS_COLLECTION = 'users';
const SESSIONS_COLLECTION = 'sessions';

/**
 * Saves the current session to Firestore under the user's document.
 * If the session is empty, it deletes it to keep history clean.
 */
export async function saveUserSession(userId: string, session: SessionState) {
    try {
        const userRef = doc(db, USERS_COLLECTION, userId);
        const sessionRef = doc(userRef, SESSIONS_COLLECTION, session.sessionId);

        // Check if session has meaningful content
        const hasContent = (session.resumeText && session.resumeText.trim().length > 0) ||
            (session.jobDescriptionText && session.jobDescriptionText.trim().length > 0) ||
            (session.chatHistory && session.chatHistory.length > 0);

        if (hasContent) {
            await setDoc(sessionRef, {
                ...session,
                title: session.title || 'New Session',
                updatedAt: new Date().toISOString()
            }, { merge: true });

            // Also update a 'latest' pointer or just rely on querying by date
            await setDoc(userRef, {
                lastSessionId: session.sessionId,
                lastUpdated: new Date().toISOString()
            }, { merge: true });
        } else {
            // Delete empty session
            await deleteDoc(sessionRef);
        }

    } catch (error) {
        console.error('Error saving session to Firestore:', error);
        throw error;
    }
}

/**
 * Updates the title of a specific session.
 */
export async function renameUserSession(userId: string, sessionId: string, newTitle: string) {
    try {
        const sessionRef = doc(db, USERS_COLLECTION, userId, SESSIONS_COLLECTION, sessionId);
        await setDoc(sessionRef, { title: newTitle }, { merge: true });
    } catch (error) {
        console.error('Error renaming session in Firestore:', error);
        throw error;
    }
}

/**
 * Deletes a session from Firestore.
 */
export async function deleteUserSession(userId: string, sessionId: string) {
    try {
        const sessionRef = doc(db, USERS_COLLECTION, userId, SESSIONS_COLLECTION, sessionId);
        await deleteDoc(sessionRef);
    } catch (error) {
        console.error('Error deleting session from Firestore:', error);
        throw error;
    }
}

/**
 * Loads the most recent session for a user.
 */
export async function loadUserSession(userId: string): Promise<SessionState | null> {
    try {
        const userRef = doc(db, USERS_COLLECTION, userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists() && userSnap.data().lastSessionId) {
            const lastSessionId = userSnap.data().lastSessionId;
            const sessionRef = doc(userRef, SESSIONS_COLLECTION, lastSessionId);
            const sessionSnap = await getDoc(sessionRef);

            if (sessionSnap.exists()) {
                return sessionSnap.data() as SessionState;
            }
        }

        // Fallback: Query for most recent session if no pointer
        const sessionsRef = collection(userRef, SESSIONS_COLLECTION);
        // Remove orderBy to avoid index requirement. Sort in memory instead.
        const q = query(sessionsRef);
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const sessions = querySnapshot.docs.map(doc => doc.data() as SessionState);
            sessions.sort((a, b) => {
                const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
                const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
                return dateB - dateA;
            });
            return sessions[0];
        }

        return null;
    } catch (error) {
        console.error('Error loading session from Firestore:', error);
        return null;
    }
}

/**
 * Loads a specific session by ID.
 */
export async function loadSessionById(userId: string, sessionId: string): Promise<SessionState | null> {
    try {
        const sessionRef = doc(db, USERS_COLLECTION, userId, SESSIONS_COLLECTION, sessionId);
        const sessionSnap = await getDoc(sessionRef);

        if (sessionSnap.exists()) {
            return sessionSnap.data() as SessionState;
        }
        return null;
    } catch (error) {
        console.error('Error loading session by ID:', error);
        return null;
    }
}

/**
 * Subscribes to the user's sessions list for real-time updates.
 * Uses onSnapshot to handle offline/optimistic updates gracefully.
 */
export function subscribeToUserSessions(userId: string, callback: (sessions: SessionSummary[]) => void): () => void {
    try {
        log({ level: 'info', message: 'Subscribing to sessions', extra: { userId } });
        const userRef = doc(db, USERS_COLLECTION, userId);
        const sessionsRef = collection(userRef, SESSIONS_COLLECTION);
        // Sort in memory to avoid index issues, but query the collection
        const q = query(sessionsRef);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const sessions = snapshot.docs
                .map(doc => {
                    const data = doc.data();
                    const hasContent = (data.resumeText && data.resumeText.trim().length > 0) ||
                        (data.jobDescriptionText && data.jobDescriptionText.trim().length > 0) ||
                        (data.chatHistory && data.chatHistory.length > 0);

                    return {
                        sessionId: doc.id,
                        title: data.title || 'Untitled Session',
                        updatedAt: data.updatedAt || new Date().toISOString(),
                        preview: data.resumeText ? data.resumeText.substring(0, 150) + '...' : 'No preview available',
                        hasContent
                    };
                })
                .filter(session => session.hasContent) // Filter out empty sessions
                .map(session => ({
                    sessionId: session.sessionId,
                    title: session.title,
                    updatedAt: session.updatedAt,
                    preview: session.preview
                }));

            // Sort in memory (descending by updatedAt)
            sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

            log({ level: 'info', message: 'Sessions updated', extra: { count: sessions.length } });
            callback(sessions);
        }, (error) => {
            console.error('Error subscribing to sessions:', error);
            log({ level: 'error', message: 'Error subscribing to sessions', error });
            callback([]);
        });

        return unsubscribe;
    } catch (error) {
        console.error('Error setting up session subscription:', error);
        log({ level: 'error', message: 'Error setting up session subscription', error });
        return () => { };
    }
}
