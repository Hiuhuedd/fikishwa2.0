const nodemailer = require('nodemailer');
const dns = require('dns');

// Force Node.js to prioritize IPv4 over IPv6 if supported
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

class EmailService {
    constructor() {
        // Preference for port 587 (TLS) on most cloud platforms
        const port = parseInt(process.env.SMTP_PORT) || 587;
        const host = process.env.SMTP_HOST || 'smtp.gmail.com';

        console.log(`📧 Initializing Email Service with host: ${host}, port: ${port}`);

        this.transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465, // false for 587 (STARTTLS)
            family: 4, // Force IPv4 to avoid ENETUNREACH issues
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            tls: {
                rejectUnauthorized: false
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 20000
        });

        console.log('📧 Email Service Initialized (SMTP)');
    }

    /**
     * Send general email
     */
    async sendEmail(to, subject, html, text = '') {
        try {
            const mailOptions = {
                from: process.env.SMTP_FROM || `"Fikishwa App" <${process.env.SMTP_USER}>`,
                to,
                subject,
                text: text || html.replace(/<[^>]*>?/gm, ''), // Basic HTML to text fallback
                html
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log(`✅ Email sent to ${to}: ${info.messageId}`);
            return info;
        } catch (error) {
            console.error(`❌ Failed to send email to ${to}:`, error.message);
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
