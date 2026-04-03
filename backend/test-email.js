const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmail() {
    console.log('--- Testing Nodemailer Gmail SMTP ---');
    console.log('Host:', process.env.SMTP_HOST);
    console.log('User:', process.env.SMTP_USER);

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: (parseInt(process.env.SMTP_PORT) === 465),
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    try {
        await transporter.verify();
        console.log('✅ SMTP Connection successful!');

        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: process.env.SMTP_USER, // Send to self
            subject: 'Fikishwa SMTP Test',
            text: 'If you are reading this, your Nodemailer setup is working perfectly!',
            html: '<b>If you are reading this, your Nodemailer setup is working perfectly!</b>'
        });

        console.log('✅ Test email sent:', info.messageId);
    } catch (error) {
        console.error('❌ SMTP Error:', error.message);
        if (error.message.includes('Invalid login')) {
            console.log('\n💡 TIP: If using Gmail, make sure you generated an "App Password" (16 characters) and put it in SMTP_PASS.');
        }
    }
}

testEmail();
