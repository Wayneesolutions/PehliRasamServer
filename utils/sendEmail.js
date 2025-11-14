const nodemailer = require('nodemailer');

// Check if environment variables are set
const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 465;
const smtpSecure = process.env.SMTP_SECURE !== 'false'; // Default to true unless explicitly set to 'false'
const smtpUsername = process.env.SMTP_USERNAME;
const smtpPassword = process.env.SMTP_PASSWORD;

// Debug logging (remove sensitive data)
if (smtpHost && smtpUsername) {
    console.log(`📧 SMTP Config: Host=${smtpHost}, Port=${smtpPort}, Secure=${smtpSecure}, User=${smtpUsername.substring(0, 3)}***`);
}

if (!smtpUsername || !smtpPassword) {
    console.warn('⚠️  SMTP credentials not found in environment variables.');
    console.warn('   Please set SMTP_USERNAME and SMTP_PASSWORD in your .env file.');
    console.warn('   For Gmail: Enable 2-Step Verification and use an App Password.');
    console.warn('   For custom mail servers: Check SMTP_PORT and SMTP_SECURE settings.');
}

const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure, // true for 465, false for other ports
    auth: smtpUsername && smtpPassword ? {
        user: smtpUsername,
        pass: smtpPassword,
    } : undefined,
    // Additional options for custom mail servers
    tls: {
        rejectUnauthorized: false // Some custom mail servers have self-signed certificates
    }
});

// Verify SMTP connection (non-blocking)
transporter.verify(function (error, success) {
    if (error) {
        console.error('❌ SMTP connection error:', error.message);
        if (error.code === 'EAUTH') {
            console.error('   Authentication failed. Please check:');
            console.error('   1. SMTP_USERNAME and SMTP_PASSWORD are correct');
            console.error('   2. For Gmail: Use an App Password (not your regular password)');
            console.error('   3. 2-Step Verification must be enabled for Gmail');
        }
    } else {
        console.log('✅ SMTP is ready to send messages');
    }
});

const sendEmail = async ({ to, subject, html = '', text = '', attachments = [] }) => {
    console.log('to ====', to, 'subject ==== ', subject, 'html====  ', html, 'text === ', text, 'attachments === ', attachments);
    
    // Check if credentials are configured
    if (!smtpUsername || !smtpPassword) {
        return {
            success: false,
            error: new Error('SMTP credentials not configured. Please set SMTP_USERNAME and SMTP_PASSWORD in your .env file.')
        };
    }
    
    if (!to || !subject || (!text && !html)) {
        return {
            success: false,
            error: new Error('Missing required email fields: "to", "subject", and at least one of "text" or "html".')
        };
    }
     const cleanSubject = subject.replace(/(<([^>]+)>)/gi, '').trim();

    const mailOptions = {
        from: `"Pehli Rasam" <${process.env.FROM_EMAIL}>`,
        to,
        subject:cleanSubject,
        text,
        html,
        attachments, // [{ filename, path, contentType }]
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', subject, '→', to);
        return { success: true, response: info };
    } catch (error) {
        console.error('Nodemailer Error:', error);
        return { success: false, error };
    }
};

module.exports = sendEmail;
