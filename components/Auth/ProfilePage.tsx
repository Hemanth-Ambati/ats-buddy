import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { ArrowLeft, User, Lock, Save, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { emailService } from '../../services/emailService';
import { getPasswordHistory, addToPasswordHistory, getUserProfileResume, saveUserProfileResume } from '../../services/dbService';
import { parseFile } from '../../services/fileParser';

export const ProfilePage: React.FC = () => {
    const { currentUser, updateName, updateUserPassword, reauthenticate } = useAuth();
    const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [resumeText, setResumeText] = useState('');
    const [isParsing, setIsParsing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Helper to hash password for history check
    const hashPassword = async (pwd: string): Promise<string> => {
        const msgBuffer = new TextEncoder().encode(pwd);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    // Load saved resume on mount
    React.useEffect(() => {
        const loadResume = async () => {
            if (currentUser?.uid) {
                try {
                    const savedResume = await getUserProfileResume(currentUser.uid);
                    if (savedResume) {
                        setResumeText(savedResume);
                    }
                } catch (error) {
                    console.error('Failed to load resume:', error);
                }
            }
        };
        loadResume();
    }, [currentUser]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsParsing(true);
        try {
            const text = await parseFile(file);
            if (text && text.trim()) {
                setResumeText(text);
                setMessage({ type: 'success', text: 'Resume parsed successfully' });
            } else {
                setMessage({ type: 'error', text: 'No text could be extracted from the file.' });
            }
        } catch (err) {
            console.error('File parse error:', err);
            setMessage({ type: 'error', text: 'Failed to parse resume file.' });
        } finally {
            setIsParsing(false);
            e.target.value = ''; // Reset input
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            // Check if user has password provider
            const hasPasswordProvider = currentUser?.providerData.some(p => p.providerId === 'password');

            if (password) {
                if (hasPasswordProvider) {
                    // Standard flow: require current password
                    if (!currentPassword) {
                        throw new Error('Please enter your current password to set a new one');
                    }
                    if (password === currentPassword) {
                        throw new Error('New password cannot be the same as your current password');
                    }
                    // Verify current password first
                    await reauthenticate(currentPassword);
                } else {
                    // Google user setting password for the first time: no current password needed
                }

                if (password !== confirmPassword) {
                    throw new Error('Passwords do not match');
                }

                // Validate password strength
                const hasUpperCase = /[A-Z]/.test(password);
                const hasLowerCase = /[a-z]/.test(password);
                const hasNumbers = /[0-9]/.test(password);
                const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
                const isLongEnough = password.length >= 8;

                if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar || !isLongEnough) {
                    throw new Error('Password does not meet strength requirements');
                }

                // Check password history
                if (currentUser?.uid) {
                    const history = await getPasswordHistory(currentUser.uid);
                    const newPasswordHash = await hashPassword(password);

                    if (history.includes(newPasswordHash)) {
                        throw new Error('You cannot use a previous password. Please choose a new one.');
                    }

                    await updateUserPassword(password);

                    // Add to history on success
                    await addToPasswordHistory(currentUser.uid, newPasswordHash);
                }
            }

            if (resumeText) {
                await saveUserProfileResume(currentUser.uid, resumeText);
            }

            if (displayName !== currentUser?.displayName) {
                await updateName(displayName);
            }

            setMessage({ type: 'success', text: 'Profile updated successfully' });

            // Send email if password was changed
            if (password && currentUser?.email) {
                await emailService.sendPasswordChangeConfirmation(currentUser.email, displayName || currentUser.displayName || 'User');
            }

            setPassword('');
            setConfirmPassword('');
            setCurrentPassword('');
        } catch (error: any) {
            console.error(error);
            let errorMessage = 'Failed to update profile. ';

            // Check for specific Firebase auth error codes
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-password') {
                errorMessage = 'Incorrect current password. Please try again.';
            } else if (error.code === 'auth/requires-recent-login') {
                errorMessage = 'Security requirement: You must have recently signed in to change your password. Please sign out and sign in again.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password is too weak. Please use a stronger password.';
            } else if (error instanceof Error) {
                // Only use the raw error message if we haven't set a specific one
                errorMessage = error.message;
            }

            setMessage({ type: 'error', text: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <Link to="/home" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
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

                            {/* Default Resume */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                    <FileText size={20} className="text-sky-500" />
                                    Default Resume
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Save your default resume here to quickly load it for any future optimization.
                                </p>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <input
                                                type="file"
                                                id="resume-upload"
                                                className="hidden"
                                                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                                onChange={handleFileChange}
                                                disabled={isParsing || loading}
                                            />
                                            <label
                                                htmlFor="resume-upload"
                                                className={`cursor-pointer inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors ${(isParsing || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                {isParsing ? 'Parsing...' : 'Upload Resume'}
                                            </label>
                                        </div>
                                        {resumeText && (
                                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                                <CheckCircle size={16} />
                                                <span className="text-sm font-medium">Resume on file</span>
                                            </div>
                                        )}
                                    </div>

                                    {resumeText && (
                                        <details className="group">
                                            <summary className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200">
                                                <span>View/Edit parsed text</span>
                                            </summary>
                                            <textarea
                                                value={resumeText}
                                                onChange={(e) => setResumeText(e.target.value)}
                                                rows={10}
                                                className="mt-2 appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-shadow text-sm font-mono"
                                                placeholder="Paste your resume content here..."
                                                disabled={loading}
                                            />
                                        </details>
                                    )}

                                    {!resumeText && (
                                        <textarea
                                            value={resumeText}
                                            onChange={(e) => setResumeText(e.target.value)}
                                            rows={10}
                                            className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-shadow text-sm font-mono"
                                            placeholder="Paste your resume content here or upload a file..."
                                            disabled={loading}
                                        />
                                    )}
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
                                <div className="grid grid-cols-1 gap-6">
                                    {currentUser?.providerData.some(p => p.providerId === 'password') && (
                                        <div>
                                            <label htmlFor="currentPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Current Password
                                            </label>
                                            <input
                                                type="password"
                                                id="currentPassword"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-shadow"
                                                placeholder="Required only if changing password"
                                                required={!!password}
                                            />
                                            {password && (
                                                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                                                    Required to verify your identity before changing password.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                {currentUser?.providerData.some(p => p.providerId === 'password') ? 'New Password' : 'Set Password'}
                                            </label>
                                            <input
                                                type="password"
                                                id="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-shadow"
                                                placeholder="New Password"
                                                minLength={8}
                                            />
                                            {/* Password Strength Checklist */}
                                            {password && (
                                                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Password Requirements:</p>
                                                    <ul className="space-y-1">
                                                        <li className={`text-xs flex items-center gap-1.5 ${password.length >= 8 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                                                            {password.length >= 8 ? <CheckCircle size={12} /> : <div className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-600" />}
                                                            At least 8 characters
                                                        </li>
                                                        <li className={`text-xs flex items-center gap-1.5 ${/[A-Z]/.test(password) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                                                            {/[A-Z]/.test(password) ? <CheckCircle size={12} /> : <div className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-600" />}
                                                            One uppercase letter
                                                        </li>
                                                        <li className={`text-xs flex items-center gap-1.5 ${/[a-z]/.test(password) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                                                            {/[a-z]/.test(password) ? <CheckCircle size={12} /> : <div className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-600" />}
                                                            One lowercase letter
                                                        </li>
                                                        <li className={`text-xs flex items-center gap-1.5 ${/[0-9]/.test(password) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                                                            {/[0-9]/.test(password) ? <CheckCircle size={12} /> : <div className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-600" />}
                                                            One number
                                                        </li>
                                                        <li className={`text-xs flex items-center gap-1.5 ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                                                            {/[!@#$%^&*(),.?":{}|<>]/.test(password) ? <CheckCircle size={12} /> : <div className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-600" />}
                                                            One special character
                                                        </li>
                                                    </ul>
                                                </div>
                                            )}
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
                                                minLength={8}
                                            />
                                        </div>
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
