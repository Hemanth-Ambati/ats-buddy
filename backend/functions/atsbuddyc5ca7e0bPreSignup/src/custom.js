/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
const { CognitoIdentityProviderClient, ListUsersCommand, AdminLinkProviderForUserCommand } = require("@aws-sdk/client-cognito-identity-provider");
const client = new CognitoIdentityProviderClient({ region: process.env.REGION });

exports.handler = async (event, context) => {
  console.log("FULL PRE-SIGNUP EVENT:", JSON.stringify(event, null, 2));

  if (event.triggerSource === 'PreSignUp_ExternalProvider') {
    const { email } = event.request.userAttributes;
    const { userPoolId, userName } = event;

    console.log(`Attempting to link account for email: ${email}, userName: ${userName}`);

    // 1. Check if a user with this email already exists
    const listParams = {
      UserPoolId: userPoolId,
      Filter: `email = "${email}"`,
      Limit: 1,
    };

    try {
      const command = new ListUsersCommand(listParams);
      const { Users } = await client.send(command);
      console.log("ListUsers result:", JSON.stringify(Users, null, 2));

      if (Users && Users.length > 0) {
        const existingUser = Users[0];
        console.log("Found existing user:", existingUser.Username);
        console.log("Existing user status:", existingUser.UserStatus);

        // 2. Link the new provider user to the existing user
        // The userName for external provider is usually "Google_12345"
        // We need to be careful with the split if the provider name has underscores, but Google usually doesn't.
        const parts = userName.split('_');
        let providerName = parts[0];
        const providerUserId = parts.slice(1).join('_'); // Handle case where ID has underscores? Unlikely for Google but safe.

        console.log(`Parsed Provider: ${providerName}, ID: ${providerUserId}`);

        if (providerName && providerUserId) {
          // Capitalize provider name (google -> Google) to match Cognito config
          providerName = providerName.charAt(0).toUpperCase() + providerName.slice(1);
          console.log(`Corrected Provider Name: ${providerName}`);

          const linkParams = {
            UserPoolId: userPoolId,
            DestinationUser: {
              ProviderName: 'Cognito',
              ProviderAttributeValue: existingUser.Username
            },
            SourceUser: {
              ProviderName: providerName, // e.g. "Google"
              ProviderAttributeName: 'Cognito_Subject',
              ProviderAttributeValue: providerUserId
            }
          };

          console.log("Linking accounts with params:", JSON.stringify(linkParams, null, 2));
          const linkCommand = new AdminLinkProviderForUserCommand(linkParams);

          try {
            await client.send(linkCommand);
            console.log("Successfully linked accounts");
          } catch (linkErr) {
            console.warn("Account linking failed (user might already be linked):", linkErr);
          }

          // 3. Force email_verified = true for the existing user
          // Only update if it's not already true to save API calls
          const isAlreadyVerified = existingUser.Attributes.find(attr => attr.Name === 'email_verified' && attr.Value === 'true');
          
          if (!isAlreadyVerified) {
              const updateParams = {
                UserPoolId: userPoolId,
                Username: existingUser.Username,
                UserAttributes: [
                  {
                    Name: 'email_verified',
                    Value: 'true'
                  }
                ]
              };
              const { AdminUpdateUserAttributesCommand } = require("@aws-sdk/client-cognito-identity-provider");
              const updateCommand = new AdminUpdateUserAttributesCommand(updateParams);
              await client.send(updateCommand);
              console.log("Successfully forced email_verified = true");
          } else {
              console.log("User already verified, skipping update.");
          }

        } else {
          console.log("Could not parse provider from username:", userName);
        }
      } else {
        console.log("No existing user found for email:", email);
      }
    } catch (err) {
      console.error("FATAL ERROR in Pre-Signup Trigger:", err);
      // We do NOT throw error here, to allow the sign-up to proceed as a new user if linking fails
      // or if it's just a permission issue.
    }
  } else {
    console.log("Trigger source is not ExternalProvider:", event.triggerSource);
  }

  // Always auto-verify email for external providers to avoid the "Verify Email" screen
  // This helps for both new users and linked users (though linked users rely on the existing attribute)
  event.response.autoVerifyEmail = true;
  event.response.autoConfirmUser = true;

  return event;
};
