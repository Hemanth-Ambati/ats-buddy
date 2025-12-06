/**
 * DATA MIGRATION SCRIPT: Firebase Firestore -> AWS DynamoDB
 * 
 * PREREQUISITES:
 * 1. Firebase Service Account Key (firebase-service-account.json)
 * 2. AWS Credentials configured (~/.aws/credentials or env vars)
 * 3. DynamoDB Tables created (via Amplify)
 * 
 * USAGE:
 * npm install firebase-admin aws-sdk dotenv
 * node scripts/migrate_data.js
 */

import admin from 'firebase-admin';
import AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: '.env.local' });

// --- CONFIGURATION ---
const FIREBASE_SERVICE_ACCOUNT = path.resolve(__dirname, '../firebase-service-account.json');
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// REPLACE THESE WITH YOUR ACTUAL TABLE NAMES FROM DYNAMODB CONSOLE
const DYNAMODB_TABLE_USERS = process.env.DYNAMODB_TABLE_USERS || 'User-xxxxxxxxxx-dev';
const DYNAMODB_TABLE_SESSIONS = process.env.DYNAMODB_TABLE_SESSIONS || 'Session-xxxxxxxxxx-dev';

// --- INITIALIZATION ---

if (!fs.existsSync(FIREBASE_SERVICE_ACCOUNT)) {
    console.error(`Error: Firebase Service Account key not found at ${FIREBASE_SERVICE_ACCOUNT}`);
    console.error('Please download it from Firebase Console -> Project Settings -> Service Accounts');
    process.exit(1);
}

const serviceAccount = require(FIREBASE_SERVICE_ACCOUNT);
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

AWS.config.update({ region: AWS_REGION });
const docClient = new AWS.DynamoDB.DocumentClient();

// --- HELPER FUNCTIONS ---

function parseDate(value) {
    if (!value) return new Date().toISOString();
    if (typeof value.toDate === 'function') {
        return value.toDate().toISOString();
    }
    if (typeof value === 'string' || typeof value === 'number') {
        return new Date(value).toISOString();
    }
    return new Date().toISOString();
}

// --- MIGRATION LOGIC ---

async function migrateUsers() {
    console.log('Starting User Migration...');
    const snapshot = await db.collection('users').get();

    let count = 0;
    for (const doc of snapshot.docs) {
        const data = doc.data();
        const userId = doc.id;

        let email = data.email;
        let displayName = data.displayName;
        let photoURL = data.photoURL;

        // If email is missing in Firestore, try to get it from Auth
        if (!email) {
            try {
                const userRecord = await admin.auth().getUser(userId);
                email = userRecord.email;
                if (!displayName) displayName = userRecord.displayName;
                if (!photoURL) photoURL = userRecord.photoURL;
                console.log(`  - Fetched email from Auth for ${userId}: ${email}`);
            } catch (authErr) {
                console.warn(`  - Could not fetch Auth record for ${userId}: ${authErr.message}`);
            }
        }

        if (!email) {
            console.warn(`  - SKIPPING user ${userId}: No email found in Firestore or Auth.`);
            continue;
        }

        const item = {
            id: userId,
            email: email,
            displayName: displayName || null,
            photoURL: photoURL || null,
            createdAt: parseDate(data.createdAt),
            updatedAt: parseDate(data.updatedAt),
            __typename: 'User'
        };

        try {
            await docClient.put({
                TableName: DYNAMODB_TABLE_USERS,
                Item: item
            }).promise();
            count++;

            // Migrate Sessions for this user
            await migrateSessions(userId);

        } catch (err) {
            console.error(`Failed to migrate user ${userId}:`, err.message);
        }
    }
    console.log(`User Migration Complete. Total Users: ${count}`);
}

async function migrateSessions(userId) {
    const snapshot = await db.collection('users').doc(userId).collection('sessions').get();

    if (snapshot.empty) return;

    let count = 0;
    for (const doc of snapshot.docs) {
        const data = doc.data();

        const item = {
            id: doc.id,
            userId: userId,
            title: data.title || 'Untitled Session',
            resumeText: data.resumeText || '',
            jobDescriptionText: data.jobDescriptionText || '',
            chatHistory: data.chatHistory ? JSON.stringify(data.chatHistory) : '[]',
            analysis: data.analysis ? JSON.stringify(data.analysis) : null,
            createdAt: parseDate(data.createdAt),
            updatedAt: parseDate(data.updatedAt),
            __typename: 'Session'
        };

        try {
            await docClient.put({
                TableName: DYNAMODB_TABLE_SESSIONS,
                Item: item
            }).promise();
            count++;
        } catch (err) {
            console.error(`Failed to migrate session ${doc.id} for user ${userId}:`, err.message);
        }
    }
    if (count > 0) console.log(`  - Migrated ${count} sessions for user ${userId}`);
}

// --- MAIN ---
async function main() {
    if (DYNAMODB_TABLE_USERS.includes('xxxxxxxxxx')) {
        console.error('ERROR: Please set DYNAMODB_TABLE_USERS and DYNAMODB_TABLE_SESSIONS in .env.local or edit the script.');
        process.exit(1);
    }

    try {
        await migrateUsers();
        console.log('All migrations finished successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    }
}

main();
