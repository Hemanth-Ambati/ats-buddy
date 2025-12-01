/**
 * Authentication Context
 * 
 * Provides global authentication state and methods to the entire application.
 * Wraps Firebase Auth functionality in a React Context for easy access.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    User,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    signInWithPopup,
    sendPasswordResetEmail,
    updateProfile,
    updatePassword,
    confirmPasswordReset,
    verifyPasswordResetCode,
    fetchSignInMethodsForEmail,
    reauthenticateWithCredential,
    EmailAuthProvider,
    sendEmailVerification
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth, googleProvider, functions } from '../services/firebase';

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    signup: (email: string, password: string, name?: string) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    logout: () => Promise<void>;
    updateName: (name: string) => Promise<void>;
    updateUserPassword: (password: string) => Promise<void>;
    confirmReset: (oobCode: string, newPassword: string) => Promise<void>;
    verifyResetCode: (oobCode: string) => Promise<string>;
    checkEmailExists: (email: string) => Promise<boolean>;
    reauthenticate: (password: string) => Promise<void>;
    sendVerification: () => Promise<void>;
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
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const signup = async (email: string, password: string, name?: string) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (name) {
            await updateProfile(userCredential.user, { displayName: name });
            // Force refresh user state to reflect the new display name immediately
            setCurrentUser({ ...userCredential.user, displayName: name });
        }
    };

    const login = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const loginWithGoogle = async () => {
        await signInWithPopup(auth, googleProvider);
    };

    const resetPassword = async (email: string) => {
        await sendPasswordResetEmail(auth, email);
    };

    const logout = async () => {
        await signOut(auth);
    };

    const updateName = async (name: string) => {
        if (auth.currentUser) {
            await updateProfile(auth.currentUser, { displayName: name });
            // Force refresh user state
            setCurrentUser({ ...auth.currentUser, displayName: name });
        }
    };

    const updateUserPassword = async (password: string) => {
        if (auth.currentUser) {
            await updatePassword(auth.currentUser, password);
        }
    };

    const confirmReset = async (oobCode: string, newPassword: string) => {
        await confirmPasswordReset(auth, oobCode, newPassword);
    };

    const verifyResetCode = async (oobCode: string): Promise<string> => {
        return await verifyPasswordResetCode(auth, oobCode);
    };

    const checkEmailExists = async (email: string): Promise<boolean> => {
        try {
            // Use Cloud Function to bypass client-side enumeration protection
            const checkEmail = httpsCallable(functions, 'checkEmailExists');
            const result = await checkEmail({ email }) as { data: { exists: boolean } };
            return result.data.exists;
        } catch (error) {
            console.error("Error checking email existence:", error);
            // Fallback to false on error to be safe, or true to allow flow to continue?
            // If the function fails (e.g. network), we probably want to allow the user to try sending the email anyway.
            // But the UI logic expects true/false.
            // Let's return false so the UI shows "No account found" or generic error if we want.
            // Actually, if the function fails, we might want to assume it exists to not block the user if it's just a network glitch?
            // But the user specifically wants the check.
            return false;
        }
    };

    const reauthenticate = async (password: string): Promise<void> => {
        if (auth.currentUser && auth.currentUser.email) {
            const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
            await reauthenticateWithCredential(auth.currentUser, credential);
        }
    };

    const sendVerification = async () => {
        if (auth.currentUser) {
            await sendEmailVerification(auth.currentUser);
        }
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
        sendVerification
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
