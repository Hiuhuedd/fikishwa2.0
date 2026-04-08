const { Resend } = require('resend');

class EmailService {
    constructor() {
        const apiKey = process.env.RESEND_API_KEY;

        if (!apiKey) {
            console.warn('⚠️ RESEND_API_KEY is not set. Email delivery will fail.');
        }

        this.resend = new Resend(apiKey);
        console.log('📧 Email Service Initialized (Resend API)');
    }

    /**
     * Send general email
     */
    async sendEmail(to, subject, html, text = '') {
        try {
            console.log(`📧 Attempting Resend delivery to ${to}...`);

            const from = process.env.SMTP_FROM || 'onboarding@resend.dev';

            const { data, error } = await this.resend.emails.send({
                from: `Fikishwa App <${from}>`,
                to: [to],
                subject,
                html,
                text: text || html.replace(/<[^>]*>?/gm, ''), // Basic HTML to text fallback
            });

            if (error) {
                console.error(`❌ Resend API Error for ${to}:`, error);
                throw error;
            }

            console.log(`✅ Email sent to ${to}: ${data?.id}`);
            return data;
        } catch (error) {
            console.error(`❌ Failed to send email via Resend to ${to}:`, error.message);
            throw error;
        }
    }

    /**
     * Send OTP Verification Email
     */
    async sendOtpEmail(to, otp) {
        const subject = `${otp} is your Fikishwa verification code`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #D4AF37; text-align: center;">Fikishwa Verification</h2>
                <p>Hello,</p>
                <p>Use the following code to verify your Fikishwa account. This code is valid for 5 minutes.</p>
                <div style="background: #f9f9f9; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333;">${otp}</span>
                </div>
                <p>If you did not request this code, please ignore this email.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #999; text-align: center;">&copy; 2026 Fikishwa App. All rights reserved.</p>
            </div>
        `;
        return this.sendEmail(to, subject, html);
    }
}

module.exports = new EmailService();
