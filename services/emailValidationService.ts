/**
 * Email Validation Service
 * 
 * Checks if an email address is from an allowed provider.
 * Uses a strict whitelist of domains.
 */

// Whitelist of allowed domains
const ALLOWED_DOMAINS = [
    'gmail.com',
    'outlook.com',
    'hotmail.com',
    'live.com',
    'yahoo.com',
    'icloud.com',
    'protonmail.com',
    'aol.com',
    'zoho.com',
    'yandex.com',
    'mail.com',
    'gmx.com'
];

export const isDisposableEmail = async (email: string): Promise<boolean> => {
    const domain = email.split('@')[1]?.toLowerCase();

    if (!domain) return true;

    // Check if domain is in the allowed whitelist
    // If it's NOT in the whitelist, we consider it "invalid" (blocked).
    if (!ALLOWED_DOMAINS.includes(domain)) {
        return true;
    }

    return false;
};
