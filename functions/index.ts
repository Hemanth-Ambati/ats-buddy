/**
 * Firebase Cloud Function to clean up unverified accounts.
 * 
 * INSTRUCTIONS:
 * 1. Initialize Firebase Functions in your project: `firebase init functions`
 * 2. Replace the contents of `functions/index.ts` with this code.
 * 3. Deploy: `firebase deploy --only functions`
 */

import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

admin.initializeApp();

/**
 * Callable function to check if an email exists.
 * This bypasses the client-side email enumeration protection.
 */
export const checkEmailExists = onCall(async (request) => {
    const email = request.data.email;
    if (!email) {
        throw new HttpsError('invalid-argument', 'The function must be called with an "email" argument.');
    }

    try {
        await admin.auth().getUserByEmail(email);
        return { exists: true };
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            return { exists: false };
        }
        throw new HttpsError('internal', 'Error checking email existence', error);
    }
});

/**
 * Scheduled function that runs every 24 hours.
 * Deletes user accounts that are:
 * 1. Not email verified.
 * 2. Created more than 24 hours ago.
 */
export const cleanupUnverifiedUsers = onSchedule('every 24 hours', async (event) => {
    const now = Date.now();
    const cutoffTime = now - (24 * 60 * 60 * 1000); // 24 hours ago in milliseconds

    let nextPageToken: string | undefined;
    let deletedCount = 0;

    try {
        // List all users in batches
        do {
            const listUsersResult: admin.auth.ListUsersResult = await admin.auth().listUsers(1000, nextPageToken);

            const usersToDelete = listUsersResult.users.filter((user: admin.auth.UserRecord) => {
                const creationTime = new Date(user.metadata.creationTime).getTime();
                // Check if unverified AND older than 24 hours
                return !user.emailVerified && creationTime < cutoffTime;
            });

            // Delete users in parallel
            const deletePromises = usersToDelete.map((user: admin.auth.UserRecord) => admin.auth().deleteUser(user.uid));
            await Promise.all(deletePromises);

            deletedCount += usersToDelete.length;
            nextPageToken = listUsersResult.pageToken;
        } while (nextPageToken);

        logger.info(`Successfully deleted ${deletedCount} unverified users.`);
    } catch (error) {
        logger.error('Error cleaning up unverified users:', error);
    }
});
