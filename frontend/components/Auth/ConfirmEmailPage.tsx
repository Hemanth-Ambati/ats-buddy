import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';

// Force rebuild
export const ConfirmEmailPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const emailParam = searchParams.get('email') || '';

    const [email, setEmail] = useState(emailParam);
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const { confirmEmail, sendVerification } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !code) return setError('Please fill in all fields');

        try {
            setError('');
            setLoading(true);
            await confirmEmail(email, code);
            navigate('/login', { state: { message: 'Email confirmed! You can now log in.' } });
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to confirm email. Please check the code.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (!email) return setError('Please enter your email address first');

        try {
            setMessage('');
            setError('');
            setLoading(true);
            await sendVerification(email);
            setMessage('Verification code resent! Please check your email.');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to resend code.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-400/20 rounded-full blur-3xl -translate-y-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 pointer-events-none"></div>

            <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 relative z-10">
                <div>
                    <Link to="/login" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors mb-6">
                        <ArrowLeft size={16} className="mr-1" />
                        Back to Login
                    </Link>
                    <div className="mx-auto w-16 h-16 bg-sky-100 dark:bg-sky-900/30 rounded-full flex items-center justify-center mb-6">
                        <Mail className="text-sky-600 dark:text-sky-400" size={32} />
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white text-center tracking-tight">
                        Confirm your email
                    </h2>
                    <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
                        We sent a verification code to your email. Enter it below to activate your account.
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm" role="alert">
                            {error}
                        </div>
                    )}
                    {message && (
                        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg text-sm" role="alert">
                            {message}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-shadow"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="code" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Verification Code</label>
                            <input
                                id="code"
                                name="code"
                                type="text"
                                required
                                className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-shadow tracking-widest text-center text-lg"
                                placeholder="123456"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
                        >
                            {loading ? 'Verifying...' : 'Confirm Email'}
                        </button>

                        <button
                            type="button"
                            onClick={handleResendCode}
                            disabled={loading}
                            className="text-sm text-sky-600 hover:text-sky-500 dark:text-sky-400 font-medium"
                        >
                            Resend Code
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
