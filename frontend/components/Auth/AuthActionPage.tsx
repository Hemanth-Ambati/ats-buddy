import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ResetPasswordPage } from './ResetPasswordPage';

export const AuthActionPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode');
    const navigate = useNavigate();

    // If it's a password reset, delegate to the existing page
    if (mode === 'resetPassword') {
        return <ResetPasswordPage />;
    }

    // Handle Email Verification (Legacy Firebase Flow - Redirect to Login)
    if (mode === 'verifyEmail') {
        // In Amplify, verification is usually done via code entry.
        // We redirect to login where they might be prompted to enter a code if trying to sign in.
        React.useEffect(() => {
            navigate('/login');
        }, [navigate]);

        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Redirecting...</h2>
                </div>
            </div>
        );
    }

    // Fallback for unknown modes
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
            <div className="text-center">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Invalid Action Link</h2>
                <p className="text-slate-600 dark:text-slate-400">The link you followed is invalid or malformed.</p>
            </div>
        </div>
    );
};
