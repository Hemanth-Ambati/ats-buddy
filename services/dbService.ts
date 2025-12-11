/**
 * AWS Amplify Data Service
 * 
 * Handles persistence of user data to DynamoDB via AppSync (GraphQL).
 * Replaces Firestore service.
 */

import { generateClient } from 'aws-amplify/api';
import {
    createSession,
    updateSession,
    deleteSession,
    updateUser,
    createUser
} from '../src/graphql/mutations';
import {
    getSession,
    getUser,
    sessionsByUserIdAndUpdatedAt
} from '../src/graphql/queries';
import {
    onCreateSession,
    onUpdateSession,
    onDeleteSession
} from '../src/graphql/subscriptions';
import { ModelSortDirection } from '../src/API';
import type { SessionState } from '../types';
import { log } from './logger';

const client = generateClient({ authMode: 'userPool' });

// Custom mutation to avoid fetching the User object, which can cause validation errors
// if the relationship is not perfectly consistent or if fields are null.
const customUpdateSession = /* GraphQL */ `
  mutation UpdateSession(
    $input: UpdateSessionInput!
    $condition: ModelSessionConditionInput
  ) {
    updateSession(input: $input, condition: $condition) {
      id
      title
      updatedAt
      resumeText
      jobDescriptionText
      chatHistory
      analysis
      userId
      createdAt
      owner
    }
  }
`;

// Custom mutation to avoid fetching the User object
const customCreateSession = /* GraphQL */ `
  mutation CreateSession(
    $input: CreateSessionInput!
    $condition: ModelSessionConditionInput
  ) {
    createSession(input: $input, condition: $condition) {
      id
      title
      updatedAt
      resumeText
      jobDescriptionText
      chatHistory
      analysis
      userId
      createdAt
      owner
    }
  }
`;

// Custom query to avoid fetching the User object
const customGetSession = /* GraphQL */ `
  query GetSession($id: ID!) {
     getSession(id: $id) {
      id
      title
      updatedAt
      resumeText
      jobDescriptionText
      chatHistory
      analysis
      userId
      createdAt
      owner
    }
  }
`;

// Custom mutation to avoid fetching unnecessary User fields which might cause auth errors
const customUpdateUser = /* GraphQL */ `
  mutation UpdateUser(
    $input: UpdateUserInput!
    $condition: ModelUserConditionInput
  ) {
    updateUser(input: $input, condition: $condition) {
      id
      profileResume
      lastUpdated
    }
  }
`;

const customCreateUser = /* GraphQL */ `
  mutation CreateUser(
    $input: CreateUserInput!
    $condition: ModelUserConditionInput
  ) {
    createUser(input: $input, condition: $condition) {
      id
      email
      lastUpdated
    }
  }
`;

export interface SessionSummary {
    sessionId: string;
    title: string;
    updatedAt: string;
    preview?: string;
    hasCoverLetter?: boolean;
}

/**
 * Ensures the user exists in the database.
 */
async function ensureUserExists(userId: string, email?: string | null, displayName?: string | null) {
    try {
        const { data } = await client.graphql({
            query: getUser,
            variables: { id: userId }
        });

        if (!data.getUser) {
            await client.graphql({
                query: customCreateUser,
                variables: {
                    input: {
                        id: userId,
                        email,
                        displayName,
                        lastUpdated: new Date().toISOString()
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error ensuring user exists:', JSON.stringify(error, null, 2));
    }
}

/**
 * Saves the current session to AppSync.
 */
export async function saveUserSession(userId: string, session: SessionState) {
    try {
        await ensureUserExists(userId);

        // Check if session has meaningful content
        const hasContent = (session.resumeText && session.resumeText.trim().length > 0) ||
            (session.jobDescriptionText && session.jobDescriptionText.trim().length > 0) ||
            (session.chatHistory && session.chatHistory.length > 0);

        if (hasContent) {
            const now = new Date().toISOString();
            const sessionInput = {
                id: session.sessionId,
                userId: userId,
                title: session.title || 'Untitled Session',
                resumeText: session.resumeText,
                jobDescriptionText: session.jobDescriptionText,
                chatHistory: JSON.stringify(session.chatHistory), // Store as JSON string
                analysis: session.analysis ? JSON.stringify(session.analysis) : null, // Store as JSON string
                updatedAt: now
            };

            // Try to update first, if fails then create
            try {
                await client.graphql({
                    query: customUpdateSession,
                    variables: { input: sessionInput }
                });
            } catch (updateErr: any) {
                console.warn('Update session failed, attempting create. Error:', JSON.stringify(updateErr, null, 2));
                // If update fails, try create. 
                // Note: If update failed because of something other than "not found", create might also fail.
                try {
                    await client.graphql({
                        query: customCreateSession,
                        variables: { input: sessionInput }
                    });
                } catch (createErr: any) {
                    console.error('Create session also failed:', JSON.stringify(createErr, null, 2));
                    // If create failed because it already exists (ConditionalCheckFailed), 
                    // it implies the initial update failed for a different reason (e.g. auth, validation).
                    throw createErr;
                }
            }

            // Update User's lastSessionId
            await client.graphql({
                query: updateUser,
                variables: {
                    input: {
                        id: userId,
                        lastSessionId: session.sessionId,
                        lastUpdated: now
                    }
                }
            });

        } else {
            // Delete empty session
            await deleteUserSession(userId, session.sessionId);
        }

    } catch (error) {
        console.error('Error saving session to AppSync:', JSON.stringify(error, null, 2));
        throw error;
    }
}

/**
 * Updates the title of a specific session.
 */
export async function renameUserSession(userId: string, sessionId: string, newTitle: string) {
    try {
        await client.graphql({
            query: updateSession,
            variables: {
                input: {
                    id: sessionId,
                    title: newTitle
                }
            }
        });
    } catch (error) {
        console.error('Error renaming session:', JSON.stringify(error, null, 2));
        throw error;
    }
}

/**
 * Deletes a session.
 */
export async function deleteUserSession(userId: string, sessionId: string) {
    try {
        await client.graphql({
            query: deleteSession,
            variables: {
                input: { id: sessionId }
            }
        });
    } catch (error: any) {
        // Suppress Unauthorized errors during delete, as they often mean the item doesn't exist
        // and thus ownership cannot be verified.
        const errorStr = JSON.stringify(error);
        if (errorStr.includes('Unauthorized')) {
            return;
        }
        console.error('Error deleting session:', JSON.stringify(error, null, 2));
    }
}

/**
 * Loads the most recent session for a user.
 */
export async function loadUserSession(userId: string): Promise<SessionState | null> {
    try {
        // 1. Get User to find lastSessionId
        const userResult = await client.graphql({
            query: getUser,
            variables: { id: userId }
        }) as any;

        const userData = userResult.data;
        if (userData.getUser?.lastSessionId) {
            return await loadSessionById(userId, userData.getUser.lastSessionId);
        }

        // 2. Fallback: Query most recent session
        const sessionResult = await client.graphql({
            query: sessionsByUserIdAndUpdatedAt,
            variables: {
                userId: userId,
                sortDirection: ModelSortDirection.DESC,
                limit: 1
            }
        }) as any;

        const sessionData = sessionResult.data;

        if (sessionData.sessionsByUserIdAndUpdatedAt.items.length > 0) {
            const item = sessionData.sessionsByUserIdAndUpdatedAt.items[0];
            if (item) {
                return mapSessionFromGraphQL(item);
            }
        }

        return null;
    } catch (error) {
        console.error('Error loading session:', JSON.stringify(error, null, 2));
        return null;
    }
}

/**
 * Loads a specific session by ID.
 */
export async function loadSessionById(userId: string, sessionId: string): Promise<SessionState | null> {
    try {
        const result = await client.graphql({
            query: customGetSession,
            variables: { id: sessionId }
        }) as any;

        const data = result.data;
        if (data.getSession) {
            return mapSessionFromGraphQL(data.getSession);
        }
        return null;
    } catch (error) {
        console.error('Error loading session by ID:', JSON.stringify(error, null, 2));
        return null;
    }
}

function mapSessionFromGraphQL(item: any): SessionState {
    return {
        sessionId: item.id,
        title: item.title || 'Untitled Session',
        resumeText: item.resumeText || '',
        jobDescriptionText: item.jobDescriptionText || '',
        chatHistory: item.chatHistory ? JSON.parse(item.chatHistory) : [],
        updatedAt: item.updatedAt,
        correlationId: '', // Default to empty, will be regenerated if needed
        analysis: item.analysis ? JSON.parse(item.analysis) : undefined
    };
}

/**
 * Subscribes to the user's sessions list for real-time updates.
 */
export function subscribeToUserSessions(userId: string, callback: (sessions: SessionSummary[]) => void): () => void {
    let unsubscribeCreate: any;
    let unsubscribeUpdate: any;
    let unsubscribeDelete: any;

    const fetchAndNotify = async () => {
        try {
            const { data } = await client.graphql({
                query: sessionsByUserIdAndUpdatedAt,
                variables: {
                    userId: userId,
                    sortDirection: ModelSortDirection.DESC
                }
            });

            const sessions = data.sessionsByUserIdAndUpdatedAt.items.map((item: any) => {
                let hasCoverLetter = false;
                try {
                    if (item.analysis) {
                        const analysis = JSON.parse(item.analysis);
                        if (analysis && analysis.coverLetter) {
                            hasCoverLetter = true;
                        }
                    }
                } catch (e) {
                    // ignore parse error
                }

                return {
                    sessionId: item.id,
                    title: item.title || 'Untitled Session',
                    updatedAt: item.updatedAt,
                    preview: item.resumeText ? item.resumeText.substring(0, 150) + '...' : 'No preview available',
                    hasCoverLetter
                };
            });

            callback(sessions);
        } catch (error) {
            console.error('Error fetching sessions:', JSON.stringify(error, null, 2));
        }
    };

    // Initial fetch
    fetchAndNotify();

    // Subscribe to changes (Owner auth automatically filters these)
    try {
        const createSub = client.graphql({ query: onCreateSession }).subscribe({
            next: () => fetchAndNotify(),
            error: (err: any) => console.error('Create sub error', JSON.stringify(err, null, 2))
        });
        const updateSub = client.graphql({ query: onUpdateSession }).subscribe({
            next: () => fetchAndNotify(),
            error: (err: any) => console.error('Update sub error', JSON.stringify(err, null, 2))
        });
        const deleteSub = client.graphql({ query: onDeleteSession }).subscribe({
            next: () => fetchAndNotify(),
            error: (err: any) => console.error('Delete sub error', JSON.stringify(err, null, 2))
        });

        unsubscribeCreate = createSub;
        unsubscribeUpdate = updateSub;
        unsubscribeDelete = deleteSub;

    } catch (error) {
        console.error('Error setting up subscriptions:', JSON.stringify(error, null, 2));
    }

    return () => {
        if (unsubscribeCreate) unsubscribeCreate.unsubscribe();
        if (unsubscribeUpdate) unsubscribeUpdate.unsubscribe();
        if (unsubscribeDelete) unsubscribeDelete.unsubscribe();
    };
}

/**
 * Retrieves the password history for a user.
 */
export async function getPasswordHistory(userId: string): Promise<string[]> {
    try {
        const { data } = await client.graphql({
            query: getUser,
            variables: { id: userId }
        });

        return data.getUser?.passwordHistory?.filter((p): p is string => p !== null) || [];
    } catch (error) {
        console.error('Error fetching password history:', JSON.stringify(error, null, 2));
        return [];
    }
}

/**
 * Adds a password hash to the user's history.
 */
export async function addToPasswordHistory(userId: string, passwordHash: string) {
    try {
        const history = await getPasswordHistory(userId);

        history.push(passwordHash);

        // Keep only last 5
        const newHistory = history.length > 5 ? history.slice(history.length - 5) : history;

        await client.graphql({
            query: updateUser,
            variables: {
                input: {
                    id: userId,
                    passwordHistory: newHistory
                }
            }
        });
    } catch (error) {
        console.error('Error updating password history:', JSON.stringify(error, null, 2));
    }
}

/**
 * Saves the user's profile resume.
 */
export async function saveUserProfileResume(userId: string, resumeText: string) {
    try {
        await ensureUserExists(userId);

        await client.graphql({
            query: customUpdateUser,
            variables: {
                input: {
                    id: userId,
                    profileResume: resumeText,
                    lastUpdated: new Date().toISOString()
                }
            }
        });
    } catch (error) {
        console.error('Error saving profile resume:', JSON.stringify(error, null, 2));
        throw error;
    }
}

/**
 * Retrieves the user's profile resume.
 */
const getProfileResumeQuery = /* GraphQL */ `
  query GetUser($id: ID!) {
    getUser(id: $id) {
      profileResume
    }
  }
`;

export async function getUserProfileResume(userId: string): Promise<string | null> {
    try {
        const result = await client.graphql({
            query: getProfileResumeQuery,
            variables: { id: userId }
        }) as any;

        return result.data.getUser?.profileResume || null;
    } catch (error) {
        console.error('Error fetching profile resume:', JSON.stringify(error, null, 2));
        return null;
    }
}
