"use strict";
/**
 * Firebase Cloud Function to clean up unverified accounts.
 *
 * INSTRUCTIONS:
 * 1. Initialize Firebase Functions in your project: `firebase init functions`
 * 2. Replace the contents of `functions/index.ts` with this code.
 * 3. Deploy: `firebase deploy --only functions`
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupUnverifiedUsers = exports.checkEmailExists = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const logger = __importStar(require("firebase-functions/logger"));
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
admin.initializeApp();
/**
 * Callable function to check if an email exists.
 * This bypasses the client-side email enumeration protection.
 */
exports.checkEmailExists = (0, https_1.onCall)(async (request) => {
    const email = request.data.email;
    if (!email) {
        throw new https_1.HttpsError('invalid-argument', 'The function must be called with an "email" argument.');
    }
    try {
        await admin.auth().getUserByEmail(email);
        return { exists: true };
    }
    catch (error) {
        if (error.code === 'auth/user-not-found') {
            return { exists: false };
        }
        throw new https_1.HttpsError('internal', 'Error checking email existence', error);
    }
});
/**
 * Scheduled function that runs every 24 hours.
 * Deletes user accounts that are:
 * 1. Not email verified.
 * 2. Created more than 24 hours ago.
 */
exports.cleanupUnverifiedUsers = (0, scheduler_1.onSchedule)('every 24 hours', async (event) => {
    const now = Date.now();
    const cutoffTime = now - (24 * 60 * 60 * 1000); // 24 hours ago in milliseconds
    let nextPageToken;
    let deletedCount = 0;
    try {
        // List all users in batches
        do {
            const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
            const usersToDelete = listUsersResult.users.filter((user) => {
                const creationTime = new Date(user.metadata.creationTime).getTime();
                // Check if unverified AND older than 24 hours
                return !user.emailVerified && creationTime < cutoffTime;
            });
            // Delete users in parallel
            const deletePromises = usersToDelete.map((user) => admin.auth().deleteUser(user.uid));
            await Promise.all(deletePromises);
            deletedCount += usersToDelete.length;
            nextPageToken = listUsersResult.pageToken;
        } while (nextPageToken);
        logger.info(`Successfully deleted ${deletedCount} unverified users.`);
    }
    catch (error) {
        logger.error('Error cleaning up unverified users:', error);
    }
});
//# sourceMappingURL=index.js.map