import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { ArrowLeft, User, Lock, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { emailService } from '../../services/emailService';

export const ProfilePage: React.FC = () => {
    const { currentUser, updateName, updateUserPassword } = useAuth();
    const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const promises = [];
        if (displayName !== currentUser?.displayName) {
            promises.push(updateName(displayName));
        }
        if (password) {
            if (password !== confirmPassword) {
                setMessage({ type: 'error', text: 'Passwords do not match' });
                setLoading(false);
                return;
            }
            promises.push(updateUserPassword(password));
        }

        Promise.all(promises)
            .then(async () => {
                setMessage({ type: 'success', text: 'Profile updated successfully' });

                // Send email if password was changed
                if (password && currentUser?.email) {
                    await emailService.sendPasswordChangeConfirmation(currentUser.email, displayName || currentUser.displayName || 'User');
                }

                setPassword('');
                setConfirmPassword('');
            })
            .catch((error: any) => {
                console.error(error);
                let errorMessage = 'Failed to update profile. ';

                if (error.code === 'auth/requires-recent-login') {
                    errorMessage = 'Security requirement: You must have recently signed in to change your password. Please sign out and sign in again.';
                } else if (error instanceof Error) {
                    errorMessage += error.message;
                }

                setMessage({ type: 'error', text: errorMessage });
            })
            .finally(() => {
                setLoading(false);
            });
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <Link to="/app" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
                        <ArrowLeft size={16} className="mr-1" />
                        Back to Dashboard
                    </Link>
                </div>

                <div className="bg-white dark:bg-slate-800 shadow rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                    <div className="px-6 py-8 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                                {currentUser?.email?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profile Settings</h1>
                                <p className="text-slate-500 dark:text-slate-400">{currentUser?.email}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 md:p-8">
                        {message && (
                            <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300' : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'}`}>
                                {message.type === 'success' ? <CheckCircle size={20} className="mt-0.5" /> : <AlertCircle size={20} className="mt-0.5" />}
                                <div>
                                    <h3 className="font-medium">{message.type === 'success' ? 'Success' : 'Error'}</h3>
                                    <p className="text-sm opacity-90">{message.text}</p>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleUpdateProfile} className="space-y-8">
                            {/* Personal Information */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                    <User size={20} className="text-sky-500" />
                                    Personal Information
                                </h2>
                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <label htmlFor="displayName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Display Name
                                        </label>
                                        <input
                                            type="text"
                                            id="displayName"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-shadow"
                                            placeholder="Your Name"
                                        />
                                    </div>
                                </div>
                            </div>

                            <hr className="border-slate-200 dark:border-slate-700" />

                            {/* Security */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Lock size={20} className="text-sky-500" />
                                    Security
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Leave blank to keep your current password.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            New Password
                                        </label>
                                        <input
                                            type="password"
                                            id="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-shadow"
                                            placeholder="New Password"
                                            minLength={6}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Confirm New Password
                                        </label>
                                        <input
                                            type="password"
                                            id="confirmPassword"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-shadow"
                                            placeholder="Confirm New Password"
                                            minLength={6}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={20} className="mr-2" />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};
