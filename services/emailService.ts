/**
 * Email Service
 * 
 * Handles sending email notifications using EmailJS.
 * Currently mocked to log to console until credentials are provided.
 */

import emailjs from '@emailjs/browser';

// TODO: Replace with your actual EmailJS credentials
const SERVICE_ID = process.env.EMAILJS_SERVICE_ID;
const TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY;
export const emailService = {
    sendPasswordChangeConfirmation: async (email: string, name: string) => {
        console.log(`[EmailService] Sending Password Change Confirmation to ${email} (${name})`);

        // Mock delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
            const emailContent = `Hello ${name},

We wanted to confirm that your password was successfully changed.

If you did not perform this action, please contact our support team immediately to secure your account.

Best regards,
The ATS Buddy Team`;

            await emailjs.send(
                SERVICE_ID,
                TEMPLATE_ID,
                {
                    email: email,
                    subject: 'Security Alert: Password Changed Successfully',
                    message: emailContent
                },
                PUBLIC_KEY
            );
        } catch (error) {
            console.error('Failed to send email:', error);
        }
    },

    sendPasswordResetConfirmation: async (email: string) => {
        console.log(`[EmailService] Sending Password Reset Confirmation to ${email}`);

        // Mock delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
            const emailContent = `Hello,

Your password has been successfully reset. You can now log in to your account with your new password.

If you did not request a password reset, please contact support immediately.

Best regards,
The ATS Buddy Team`;

            await emailjs.send(
                SERVICE_ID,
                TEMPLATE_ID,
                {
                    email: email,
                    subject: 'Your Password Has Been Reset',
                    message: emailContent
                },
                PUBLIC_KEY
            );
        } catch (error) {
            console.error('Failed to send email:', error);
        }
    }
};
