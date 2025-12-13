/**
 * FORCE PASSWORD RESET SCRIPT
 * 
 * PURPOSE:
 * Sets a temporary password for all users (or specific ones) and forces them to change it on next login.
 * 
 * USAGE:
 * node scripts/set_temp_passwords.js
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
const TEMP_PASSWORD = 'Password123!'; // The temporary password to set

// --- INITIALIZATION ---
if (!fs.existsSync(AWS_EXPORTS_PATH)) {
    console.error(`Error: aws-exports.js not found at ${AWS_EXPORTS_PATH}`);
    process.exit(1);
}
const awsConfig = require(AWS_EXPORTS_PATH).default;
const USER_POOL_ID = awsConfig.aws_user_pools_id;

AWS.config.update({ region: AWS_REGION });
const cognito = new AWS.CognitoIdentityServiceProvider();

// --- LOGIC ---

async function forcePasswordReset() {
    console.log(`Targeting User Pool: ${USER_POOL_ID}`);

    let paginationToken = null;
    let count = 0;

    do {
        const response = await cognito.listUsers({
            UserPoolId: USER_POOL_ID,
            PaginationToken: paginationToken
        }).promise();

        paginationToken = response.PaginationToken;

        for (const user of response.Users) {
            const username = user.Username;
            const email = user.Attributes.find(a => a.Name === 'email')?.Value;

            console.log(`Processing ${email} (${username})...`);

            try {
                await cognito.adminSetUserPassword({
                    UserPoolId: USER_POOL_ID,
                    Username: username,
                    Password: TEMP_PASSWORD,
                    Permanent: false // This forces the change!
                }).promise();
                console.log(`  - Set temp password and forced reset.`);
                count++;
            } catch (err) {
                console.error(`  - Error: ${err.message}`);
            }
        }

    } while (paginationToken);

    console.log(`\nDone! Forced password reset for ${count} users.`);
    console.log(`Temporary Password is: ${TEMP_PASSWORD}`);
}

forcePasswordReset().catch(console.error);
