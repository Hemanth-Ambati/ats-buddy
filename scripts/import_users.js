/**
 * USER IMPORT SCRIPT: DynamoDB -> Cognito & Data Linking
 * 
 * PURPOSE:
 * 1. Reads users from DynamoDB (migrated from Firebase).
 * 2. Creates corresponding users in Cognito User Pool (if missing).
 * 3. Updates DynamoDB records to use the NEW Cognito User ID (sub) and sets the 'owner' field.
 * 
 * USAGE:
 * node scripts/import_users.js
 */

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
const AWS_EXPORTS_PATH = path.resolve(__dirname, '../src/aws-exports.js');
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const TEMP_PASSWORD = 'Password123!'; // Temporary password for imported users

// REPLACE THESE WITH YOUR ACTUAL TABLE NAMES FROM DYNAMODB CONSOLE
const DYNAMODB_TABLE_USERS = process.env.DYNAMODB_TABLE_USERS || 'User-xxxxxxxxxx-dev';
const DYNAMODB_TABLE_SESSIONS = process.env.DYNAMODB_TABLE_SESSIONS || 'Session-xxxxxxxxxx-dev';

// --- INITIALIZATION ---

// Load AWS Config
if (!fs.existsSync(AWS_EXPORTS_PATH)) {
    console.error(`Error: aws-exports.js not found at ${AWS_EXPORTS_PATH}`);
    process.exit(1);
}
const awsConfig = require(AWS_EXPORTS_PATH).default;
const USER_POOL_ID = awsConfig.aws_user_pools_id;

if (!USER_POOL_ID) {
    console.error('Error: Could not find aws_user_pools_id in aws-exports.js');
    process.exit(1);
}

console.log(`Using User Pool ID: ${USER_POOL_ID}`);
console.log(`Using Region: ${AWS_REGION}`);

AWS.config.update({ region: AWS_REGION });
const cognito = new AWS.CognitoIdentityServiceProvider();
const docClient = new AWS.DynamoDB.DocumentClient();

// --- LOGIC ---

async function importUsers() {
    console.log('Scanning DynamoDB for users...');

    // 1. Get all users from DynamoDB
    const scanResult = await docClient.scan({
        TableName: DYNAMODB_TABLE_USERS
    }).promise();

    const users = scanResult.Items;
    console.log(`Found ${users.length} users in DynamoDB.`);

    for (const user of users) {
        try {
            await processUser(user);
        } catch (err) {
            console.error(`Failed to process user ${user.email}:`, err.message);
        }
    }

    console.log('Import and Linking Complete!');
}

async function processUser(user) {
    console.log('Inspecting user object:', JSON.stringify(user, null, 2));
    const email = user.email;
    const oldId = user.id;
    let newId = null;

    if (!email) {
        console.error(`  - SKIPPING: No email found for user ${oldId}`);
        return;
    }

    console.log(`Processing ${email} (Old ID: ${oldId})...`);

    // 2. Check/Create Cognito User
    try {
        // Try to get user
        const listUsers = await cognito.listUsers({
            UserPoolId: USER_POOL_ID,
            Filter: `email = "${email}"`
        }).promise();

        if (listUsers.Users.length > 0) {
            console.log(`  - User already exists in Cognito.`);
            newId = listUsers.Users[0].Username; // This is the 'sub'
        } else {
            console.log(`  - Creating new Cognito user...`);
            const createResult = await cognito.adminCreateUser({
                UserPoolId: USER_POOL_ID,
                Username: email,
                UserAttributes: [
                    { Name: 'email', Value: email },
                    { Name: 'email_verified', Value: 'true' },
                    { Name: 'name', Value: user.displayName || email.split('@')[0] }
                ],
                MessageAction: 'SUPPRESS', // Don't send email
                TemporaryPassword: TEMP_PASSWORD
            }).promise();
            newId = createResult.User.Username;
            console.log(`  - Created. New ID: ${newId}`);

            // Set password permanently (optional, but good for testing)
            await cognito.adminSetUserPassword({
                UserPoolId: USER_POOL_ID,
                Username: newId,
                Password: TEMP_PASSWORD,
                Permanent: true
            }).promise();
        }
    } catch (err) {
        console.error(`  - Cognito Error: ${err.message}`);
        return;
    }

    // 3. Update DynamoDB Data if IDs don't match
    if (newId && newId !== oldId) {
        console.log(`  - Linking data from ${oldId} to ${newId}...`);

        // A. Migrate User Record
        const newUserItem = { ...user };
        newUserItem.id = newId;
        newUserItem.owner = newId; // Set Owner for @auth rules
        newUserItem.updatedAt = new Date().toISOString();

        // Remove old ID from object if it was there

        await docClient.put({
            TableName: DYNAMODB_TABLE_USERS,
            Item: newUserItem
        }).promise();

        // Delete old user record
        await docClient.delete({
            TableName: DYNAMODB_TABLE_USERS,
            Key: { id: oldId }
        }).promise();

        console.log(`  - User record updated.`);

        // B. Migrate Sessions
        await migrateUserSessions(oldId, newId);
    } else if (newId === oldId) {
        // Even if IDs match (unlikely), ensure 'owner' field is set
        if (!user.owner) {
            await docClient.update({
                TableName: DYNAMODB_TABLE_USERS,
                Key: { id: user.id },
                UpdateExpression: 'set #owner = :owner',
                ExpressionAttributeNames: { '#owner': 'owner' },
                ExpressionAttributeValues: { ':owner': newId }
            }).promise();
            console.log(`  - Updated owner field for existing user.`);
            await migrateUserSessions(oldId, newId); // Ensure sessions have owner too
        } else {
            console.log(`  - IDs match and owner set. Skipping data update.`);
        }
    }
}

async function migrateUserSessions(oldUserId, newUserId) {
    // Scan for sessions with old userId (Scan is okay for migration script)
    // Ideally we would query by GSI, but we might not have one set up for the old ID if schema changed.
    // Actually, schema has @index(name: "byUser", ...) on userId.

    const queryResult = await docClient.query({
        TableName: DYNAMODB_TABLE_SESSIONS,
        IndexName: 'byUser',
        KeyConditionExpression: 'userId = :uid',
        ExpressionAttributeValues: { ':uid': oldUserId }
    }).promise();

    const sessions = queryResult.Items;
    if (sessions.length === 0) return;

    console.log(`  - Migrating ${sessions.length} sessions...`);

    for (const session of sessions) {
        const newSession = { ...session };
        newSession.userId = newUserId;
        newSession.owner = newUserId; // Set Owner

        // We keep the same Session ID, just update the userId and owner
        // But since we are changing the GSI key (userId), PutItem is fine.
        // Wait, 'id' is the partition key. 'userId' is just an attribute (and GSI key).
        // So we can just UpdateItem!

        await docClient.update({
            TableName: DYNAMODB_TABLE_SESSIONS,
            Key: { id: session.id },
            UpdateExpression: 'set userId = :uid, #owner = :owner',
            ExpressionAttributeNames: { '#owner': 'owner' },
            ExpressionAttributeValues: {
                ':uid': newUserId,
                ':owner': newUserId
            }
        }).promise();
    }
    console.log(`  - Sessions updated.`);
}

// --- MAIN ---
importUsers().catch(console.error);
