import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, RefreshCw, LogOut } from 'lucide-react';

export const VerifyEmailPage: React.FC = () => {
    const { currentUser, sendVerification, logout, reloadUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [cooldown, setCooldown] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        if (currentUser?.emailVerified) {
            navigate('/dashboard');
        }
    }, [currentUser, navigate]);

    // Timer for cooldown
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (cooldown > 0) {
            timer = setInterval(() => {
                setCooldown((prev) => prev - 1);
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [cooldown]);

    const handleResendEmail = async () => {
        if (cooldown > 0) return;
        if (!currentUser?.email) return setError('No email found for user.');

        try {
            setMessage('');
            setError('');
            setLoading(true);
            await sendVerification(currentUser.email);
            setMessage('Verification email sent! Please check your inbox and spam folder.');
            setCooldown(60); // Start 60s cooldown on success
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/too-many-requests') {
                setError('Too many requests. Please wait a moment before trying again.');
                setCooldown(60); // Enforce cooldown if we hit the limit
            } else {
                setError('Failed to send verification email. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (err) {
            console.error('Failed to log out', err);
        }
    };

    const handleCheckVerification = async () => {
        try {
            setLoading(true);
            await reloadUser(); // Use the new reloadUser method from context

            console.log('Reloaded user profile.');

        } catch (err) {
            console.error('Error checking verification:', err);
            setError('Failed to check verification status. See console for details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-400/20 rounded-full blur-3xl -translate-y-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 pointer-events-none"></div>

            <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 relative z-10 text-center">
                <div className="mx-auto w-16 h-16 bg-sky-100 dark:bg-sky-900/30 rounded-full flex items-center justify-center mb-6">
                    <Mail className="text-sky-600 dark:text-sky-400" size={32} />
                </div>

                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Verify your email
                </h2>

                <p className="mt-2 text-slate-600 dark:text-slate-400">
                    We've sent a verification email to:
                    <br />
                    <span className="font-medium text-slate-900 dark:text-slate-200">{currentUser?.email}</span>
                </p>

                <p className="text-sm text-slate-500 dark:text-slate-500">
                    Please check your email and click the link to verify your account. Once verified, click the button below.
                </p>

                {message && (
                    <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg text-sm">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-4 mt-8">
                    <button
                        onClick={handleResendEmail}
                        disabled={loading || cooldown > 0}
                        className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Verification Email'}
                    </button>

                    <button
                        onClick={handleCheckVerification}
                        disabled={loading}
                        className="w-full flex justify-center items-center py-2.5 px-4 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                    >
                        <RefreshCw size={16} className="mr-2" />
                        I've Verified My Email
                    </button>

                    <button
                        onClick={handleLogout}
                        className="w-full flex justify-center items-center py-2.5 px-4 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    >
                        <LogOut size={16} className="mr-2" />
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
};
