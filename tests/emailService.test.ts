import { describe, it, expect, vi, beforeEach } from 'vitest';
import { emailService } from '../services/emailService';
import emailjs from '@emailjs/browser';

vi.mock('@emailjs/browser', () => ({
    default: {
        send: vi.fn().mockResolvedValue({ status: 200, text: 'OK' }),
    },
}));

describe('emailService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('sendPasswordChangeConfirmation sends email with correct params', async () => {
        const email = 'test@example.com';
        const name = 'John Doe';
        await emailService.sendPasswordChangeConfirmation(email, name);

        expect(emailjs.send).toHaveBeenCalledWith(
            process.env.EMAILJS_SERVICE_ID,
            process.env.EMAILJS_TEMPLATE_ID,
            expect.objectContaining({
                email,
                subject: 'Security Alert: Password Changed Successfully',
                message: expect.stringContaining(name)
            }),
            process.env.EMAILJS_PUBLIC_KEY
        );
    });

    it('sendPasswordResetConfirmation sends email with correct params', async () => {
        const email = 'test@example.com';
        await emailService.sendPasswordResetConfirmation(email);

        expect(emailjs.send).toHaveBeenCalledWith(
            process.env.EMAILJS_SERVICE_ID,
            process.env.EMAILJS_TEMPLATE_ID,
            expect.objectContaining({
                email,
                subject: 'Your Password Has Been Reset'
            }),
            process.env.EMAILJS_PUBLIC_KEY
        );
    });
});
