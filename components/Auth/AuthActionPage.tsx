import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { applyActionCode, signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { ResetPasswordPage } from './ResetPasswordPage';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

export const AuthActionPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode');
    const oobCode = searchParams.get('oobCode');
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // If it's a password reset, delegate to the existing page
    if (mode === 'resetPassword') {
        return <ResetPasswordPage />;
    }

    const processedCode = React.useRef<string | null>(null);

    // Handle Email Verification
    useEffect(() => {
        const handleEmailVerification = async () => {
            if (mode !== 'verifyEmail' || !oobCode) return;

            // Prevent double execution (React Strict Mode)
            if (processedCode.current === oobCode) return;
            processedCode.current = oobCode;

            setLoading(true);
            try {
                await applyActionCode(auth, oobCode);

                // Force logout so user has to sign in again
                await signOut(auth);

                setSuccess(true);
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } catch (err: any) {
                console.error('Verification failed:', err);
                // If code is invalid but we just used it, it might be a race condition.
                // However, with the ref check above, this should be a genuine error.
                setError('Failed to verify email. The link may be invalid or expired.');
            } finally {
                setLoading(false);
            }
        };

        handleEmailVerification();
    }, [mode, oobCode, navigate]);

    if (mode === 'verifyEmail') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full text-center space-y-8 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
                    {loading && (
                        <>
                            <div className="mx-auto flex items-center justify-center h-16 w-16">
                                <Loader className="h-8 w-8 text-sky-600 animate-spin" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Verifying Email...</h2>
                        </>
                    )}

                    {success && (
                        <>
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                                <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Email Verified!</h2>
                            <p className="text-slate-600 dark:text-slate-400">Redirecting to login...</p>
                        </>
                    )}

                    {error && (
                        <>
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30">
                                <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Verification Failed</h2>
                            <p className="text-red-600 dark:text-red-400">{error}</p>
                        </>
                    )}
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
