/* Amplify Params - DO NOT EDIT
    AUTH_ATSBUDDYC5CA7E0B_USERPOOLID
    ENV
    REGION
Amplify Params - DO NOT EDIT */

const AWS = require('aws-sdk');
const cognito = new AWS.CognitoIdentityServiceProvider();

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);

    // Get User Pool ID from environment variables
    // Note: The variable name might differ slightly depending on how Amplify injected it.
    // We'll try to find the one starting with AUTH_ and ending with _USERPOOLID
    const userPoolIdEnv = Object.keys(process.env).find(key => key.startsWith('AUTH_') && key.endsWith('_USERPOOLID'));
    const userPoolId = process.env[userPoolIdEnv];

    if (!userPoolId) {
        console.error("UserPoolId not found in environment variables");
        return { statusCode: 500, body: "Configuration Error" };
    }

    const now = Date.now();
    const cutoffTime = now - (24 * 60 * 60 * 1000); // 24 hours ago

    let deletedCount = 0;
    let paginationToken = null;

    try {
        do {
            const params = {
                UserPoolId: userPoolId,
                Limit: 60,
                PaginationToken: paginationToken
            };

            const response = await cognito.listUsers(params).promise();
            paginationToken = response.PaginationToken;

            const usersToDelete = response.Users.filter(user => {
                const createdDate = new Date(user.UserCreateDate).getTime();
                const isUnverified = user.UserStatus === 'UNCONFIRMED';
                // Extra safety: Do NOT delete if they have external identities (e.g. Google) linked, 
                // even if status is somehow UNCONFIRMED (unlikely but possible during linking edge cases).
                const hasExternalIdentities = user.Attributes.some(attr => attr.Name === 'identities');

                return isUnverified && !hasExternalIdentities && createdDate < cutoffTime;
            });

            for (const user of usersToDelete) {
                try {
                    await cognito.adminDeleteUser({
                        UserPoolId: userPoolId,
                        Username: user.Username
                    }).promise();
                    console.log(`Deleted unverified user: ${user.Username}`);
                    deletedCount++;
                } catch (err) {
                    console.error(`Failed to delete user ${user.Username}:`, err);
                }
            }

        } while (paginationToken);

        return {
            statusCode: 200,
            body: JSON.stringify(`Successfully deleted ${deletedCount} unverified users.`),
        };
    } catch (error) {
        console.error('Error cleaning up users:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
