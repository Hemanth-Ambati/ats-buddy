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
    fetchSignInMethodsForEmail
} from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    signup: (email: string, password: string) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    logout: () => Promise<void>;
    updateName: (name: string) => Promise<void>;
    updateUserPassword: (password: string) => Promise<void>;
    confirmReset: (oobCode: string, newPassword: string) => Promise<void>;
    verifyResetCode: (oobCode: string) => Promise<string>;
    checkEmailExists: (email: string) => Promise<boolean>;
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

    const signup = async (email: string, password: string) => {
        await createUserWithEmailAndPassword(auth, email, password);
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
            const methods = await fetchSignInMethodsForEmail(auth, email);
            return methods.length > 0;
        } catch (error) {
            console.error("Error checking email existence:", error);
            // If error is due to enumeration protection, we might not get a clear answer.
            // But usually this works if enabled in console.
            return false;
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
        checkEmailExists
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
