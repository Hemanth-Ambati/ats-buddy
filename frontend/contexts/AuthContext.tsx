/**
 * Authentication Context
 * 
 * Provides global authentication state and methods to the entire application.
 * Wraps Firebase Auth functionality in a React Context for easy access.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    signIn,
    signUp,
    signOut,
    getCurrentUser,
    fetchUserAttributes,
    resetPassword as awsResetPassword,
    confirmResetPassword,
    updatePassword as awsUpdatePassword,
    updateUserAttributes,
    resendSignUpCode,
    confirmSignUp,
    confirmSignIn,
    signInWithRedirect,
    AuthUser
} from 'aws-amplify/auth';
import { Amplify } from 'aws-amplify';
// @ts-ignore
import config from '../src/aws-exports';

Amplify.configure(config);

// Define a User type compatible with our app
export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    emailVerified: boolean;
    providerData: { providerId: string }[];
}

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    signup: (email: string, password: string, name?: string) => Promise<{ isSignUpComplete: boolean; nextStep: any }>;
    login: (email: string, password: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>; // Not implemented yet in AWS migration
    resetPassword: (email: string) => Promise<void>;
    logout: () => Promise<void>;
    updateName: (name: string) => Promise<void>;
    updateUserPassword: (password: string) => Promise<void>;
    confirmReset: (username: string, confirmationCode: string, newPassword: string) => Promise<void>;
    verifyResetCode: (oobCode: string) => Promise<string>; // Not applicable in AWS flow
    checkEmailExists: (email: string) => Promise<boolean>; // Needs Lambda
    reauthenticate: (password: string) => Promise<void>; // Not needed in AWS flow usually
    sendVerification: (username: string) => Promise<void>;
    confirmEmail: (username: string, code: string) => Promise<void>;
    reloadUser: () => Promise<void>;
    completeNewPassword: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkUser();
    }, []);

    async function checkUser() {
        try {
            const user = await getCurrentUser();
            const attributes = await fetchUserAttributes();


            setCurrentUser({
                uid: user.userId,
                email: attributes.email || null,
                displayName: attributes.name || null,
                photoURL: attributes.picture || null,
                emailVerified: String(attributes.email_verified) === 'true' || !!attributes['identities'], // Trust external providers (e.g. Google) as verified
                providerData: [{ providerId: 'password' }] // Default to password for now
            });
        } catch (error) {
            console.error("Check User Error:", error);
            setCurrentUser(null);
            // Clear stale session if user check fails (e.g. user deleted in backend)
            try {
                await signOut();
            } catch (e) {
                // Ignore error during cleanup
            }
        } finally {
            setLoading(false);
        }
    }

    const signup = async (email: string, password: string, name?: string) => {
        const { isSignUpComplete, userId, nextStep } = await signUp({
            username: email,
            password,
            options: {
                userAttributes: {
                    email,
                    name,
                },
            }
        });
        return { isSignUpComplete, nextStep };
    };

    const login = async (email: string, password: string) => {
        try {
            const { isSignedIn, nextStep } = await signIn({ username: email, password });

            if (nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
                throw { name: 'UserNotConfirmedException', code: 'UserNotConfirmedException' };
            }

            if (nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
                // Return a special object or throw a specific error that the UI can catch
                // to redirect to a "Set New Password" screen.
                // Since this function returns Promise<void>, we should probably throw.
                throw {
                    name: 'NewPasswordRequired',
                    code: 'NewPasswordRequired',
                    user: { username: email } // Pass context if needed
                };
            }

            await checkUser();
        } catch (error: any) {
            console.error("AuthContext Login Error:", error);
            throw error;
        }
    };

    const completeNewPassword = async (password: string) => {
        // This function is needed to complete the challenge
        try {
            await confirmSignIn({ challengeResponse: password });
            await checkUser();
        } catch (error) {
            console.error("Complete New Password Error:", error);
            throw error;
        }
    };

    const loginWithGoogle = async () => {
        try {
            await signInWithRedirect({ provider: 'Google' });
        } catch (error: any) {
            console.error("Google Sign In Error:", error);
            if (error.name === 'UserAlreadyAuthenticatedException') {
                // If already authenticated (stale session), sign out and try again
                await signOut();
                await signInWithRedirect({ provider: 'Google' });
            } else {
                throw error;
            }
        }
    };

    const resetPassword = async (email: string) => {
        await awsResetPassword({ username: email });
    };

    const logout = async () => {
        await signOut();
        setCurrentUser(null);
    };

    const updateName = async (name: string) => {
        await updateUserAttributes({
            userAttributes: {
                name
            }
        });
        await checkUser();
    };

    const updateUserPassword = async (password: string) => {
        // AWS requires old password to update. This flow might need UI changes.
        // For now, this is a placeholder or we assume re-auth happened.
        // await awsUpdatePassword({ oldPassword: '...', newPassword: password });
        console.warn("Update password requires old password in AWS");
    };

    const confirmReset = async (username: string, confirmationCode: string, newPassword: string) => {
        await confirmResetPassword({ username, confirmationCode, newPassword });
    };

    const verifyResetCode = async (oobCode: string): Promise<string> => {
        // AWS doesn't verify code separately from confirm.
        return oobCode;
    };

    const checkEmailExists = async (email: string): Promise<boolean> => {
        // Needs API implementation
        return false;
    };

    const reauthenticate = async (password: string): Promise<void> => {
        // Not directly applicable
    };

    const sendVerification = async (username: string) => {
        await resendSignUpCode({ username });
    };

    const confirmEmail = async (username: string, code: string) => {
        await confirmSignUp({ username, confirmationCode: code });
        await checkUser();
    };

    const reloadUser = async () => {
        await checkUser();
    };

    const value = {
        currentUser,
        loading,
        signup,
        login,
        loginWithGoogle,
        resetPassword,
        logout,
        updateName,
        updateUserPassword,
        confirmReset,
        verifyResetCode,
        checkEmailExists,
        reauthenticate,
        sendVerification,
        confirmEmail,
        reloadUser,
        completeNewPassword
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
