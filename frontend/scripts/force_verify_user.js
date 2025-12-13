
import { CognitoIdentityProviderClient, ListUsersCommand, AdminUpdateUserAttributesCommand } from "@aws-sdk/client-cognito-identity-provider";
import config from '../src/aws-exports.js';

// Note: This script assumes you have AWS credentials configured in your environment 
// or available via a named profile that the SDK can discover.
// If you get "CredentialsError", try running: set AWS_PROFILE=your-profile-name && node scripts/force_verify_user.js

const REGION = config.aws_project_region;
const USER_POOL_ID = config.aws_user_pools_id;

if (!REGION || !USER_POOL_ID) {
    console.error("Could not find Region or User Pool ID in aws-exports.js");
    process.exit(1);
}

const email = process.argv[2];

if (!email) {
    console.log("Usage: node scripts/force_verify_user.js <email>");
    process.exit(1);
}

const client = new CognitoIdentityProviderClient({ region: REGION });

async function main() {
    console.log(`Using Region: ${REGION}, User Pool: ${USER_POOL_ID}`);
    console.log(`Searching for user: ${email}...`);

    try {
        // 1. Find the user
        const listCommand = new ListUsersCommand({
            UserPoolId: USER_POOL_ID,
            Filter: `email = "${email}"`,
            Limit: 1
        });

        const listResult = await client.send(listCommand);

        if (!listResult.Users || listResult.Users.length === 0) {
            console.error(`User with email ${email} not found.`);
            return;
        }

        const user = listResult.Users[0];
        console.log(`Found user: ${user.Username} (Status: ${user.UserStatus})`);

        // 2. Force Verification
        console.log("Forcing email_verified = true...");

        const updateCommand = new AdminUpdateUserAttributesCommand({
            UserPoolId: USER_POOL_ID,
            Username: user.Username,
            UserAttributes: [
                {
                    Name: 'email_verified',
                    Value: 'true'
                }
            ]
        });

        await client.send(updateCommand);
        console.log("✅ Use email_verified updated successfully!");
        console.log("Try logging in again.");

    } catch (err) {
        console.error("Error:", err);
        console.log("\nIf this is a credential error, make sure your terminal has AWS credentials configured.");
    }
}

main();
