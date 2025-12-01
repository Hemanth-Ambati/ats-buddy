import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode; requireVerification?: boolean }> = ({
    children,
    requireVerification = true
}) => {
    const { currentUser, loading } = useAuth();
    const [isVerifying, setIsVerifying] = React.useState(false);

    React.useEffect(() => {
        const checkVerification = async () => {
            if (currentUser && !currentUser.emailVerified && requireVerification) {
                setIsVerifying(true);
                try {
                    await currentUser.reload();
                    // Force a re-render or update context if needed. 
                    // Note: reload() updates the currentUser object in place, but might not trigger a re-render 
                    // unless we force it or if AuthContext handles it. 
                    // However, we can just force a local re-render by toggling state if needed, 
                    // but usually accessing the property again is enough if the object reference is stable.
                } catch (e) {
                    console.error("Error reloading user:", e);
                } finally {
                    setIsVerifying(false);
                }
            }
        };

        checkVerification();
    }, [currentUser, requireVerification]);

    if (loading || isVerifying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
            </div>
        );
    }

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    // Check again after potential reload
    if (requireVerification && !currentUser.emailVerified) {
        return <Navigate to="/verify-email" replace />;
    }

    return <>{children}</>;
};
