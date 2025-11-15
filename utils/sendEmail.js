const nodemailer = require('nodemailer');

// Check if environment variables are set
// For local development, use Gmail. For production, use hosting provider
const isDevelopment = process.env.NODE_ENV === 'development';

let smtpHost, smtpPort, smtpSecure, smtpUsername, smtpPassword;

if (isDevelopment) {
    // Local development - use Gmail or development SMTP
    smtpHost = process.env.SMTP_HOST_DEV || process.env.SMTP_HOST || 'smtp.gmail.com';
    smtpPort = process.env.SMTP_PORT_DEV ? parseInt(process.env.SMTP_PORT_DEV) : (process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 465);
    smtpSecure = process.env.SMTP_SECURE_DEV !== undefined ? process.env.SMTP_SECURE_DEV === 'true' : (process.env.SMTP_SECURE !== undefined ? process.env.SMTP_SECURE === 'true' : true);
    smtpUsername = process.env.SMTP_USERNAME_DEV || process.env.EMAIL_USER || process.env.SMTP_USERNAME;
    smtpPassword = process.env.SMTP_PASSWORD_DEV || process.env.EMAIL_PASS || process.env.SMTP_PASSWORD;
} else {
    // Production - use hosting provider SMTP
    smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : null;
    smtpSecure = process.env.SMTP_SECURE !== undefined ? process.env.SMTP_SECURE === 'true' : null;
    smtpUsername = process.env.SMTP_USERNAME;
    smtpPassword = process.env.SMTP_PASSWORD;
}

// Auto-detect port and security settings if not specified (common hosting provider defaults)
if (!smtpPort) {
    // Try port 587 (STARTTLS) first for hosting providers, fallback to 465 (SSL)
    smtpPort = 587;
}
if (smtpSecure === null) {
    // Port 465 uses SSL (secure: true), port 587 uses STARTTLS (secure: false)
    smtpSecure = smtpPort === 465;
}

// Debug logging (remove sensitive data)
if (smtpHost && smtpUsername) {
    const passwordLength = smtpPassword ? smtpPassword.length : 0;
    const passwordPreview = smtpPassword ? (smtpPassword.substring(0, 2) + '***' + smtpPassword.substring(smtpPassword.length - 2)) : 'NOT_SET';
    const envMode = isDevelopment ? 'DEV' : 'PROD';
    console.log(`📧 SMTP Config [${envMode}]: Host=${smtpHost}, Port=${smtpPort}, Secure=${smtpSecure}, User=${smtpUsername}, PasswordLength=${passwordLength}`);
    console.log(`📧 Password Preview: ${passwordPreview}`);
    
    // Check for common issues
    if (smtpPassword) {
        if (smtpPassword.includes(' ')) {
            console.warn('⚠️  WARNING: Password contains spaces - this might cause authentication issues!');
        }
        if (smtpPassword !== smtpPassword.trim()) {
            console.warn('⚠️  WARNING: Password has leading/trailing spaces - trimming...');
        }
    }
} else {
    console.warn('⚠️  SMTP_HOST or SMTP_USERNAME not found in environment variables.');
    if (isDevelopment) {
        console.warn('   For local development, set EMAIL_USER and EMAIL_PASS, or SMTP_USERNAME_DEV and SMTP_PASSWORD_DEV');
    }
}

if (!smtpUsername || !smtpPassword) {
    console.warn('⚠️  SMTP credentials not found in environment variables.');
    console.warn('   Please set SMTP_USERNAME and SMTP_PASSWORD in your .env file.');
    console.warn('   For Gmail: Enable 2-Step Verification and use an App Password.');
    console.warn('   For hosting providers: Check SMTP_PORT (usually 587 or 465) and SMTP_SECURE settings.');
}

const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure, // true for 465 (SSL), false for 587 (STARTTLS)
    auth: smtpUsername && smtpPassword ? {
        user: smtpUsername,
        pass: smtpPassword.trim(), // Remove any trailing spaces
    } : undefined,
    // Additional options for hosting provider mail servers
    tls: {
        rejectUnauthorized: false // Some hosting mail servers have self-signed certificates
    },
    // For hosting providers, sometimes need requireTLS
    requireTLS: smtpPort === 587,
    // Connection timeout
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
});

// Verify SMTP connection (non-blocking)
transporter.verify(function (error, success) {
    console.log('success ==== ', success, 'error ==== ', error);
    if (error) {
        console.error('❌ SMTP connection error:', error.message);
        if (error.code === 'EAUTH') {
            console.error('   Authentication failed. Please check:');
            console.error('   1. SMTP_USERNAME and SMTP_PASSWORD are correct (check for typos)');
            console.error('   2. Password has no extra spaces (use .trim() if needed)');
            console.error('   3. For hosting providers:');
            console.error('      - Try SMTP_PORT=587 with SMTP_SECURE=false (STARTTLS)');
            console.error('      - Or SMTP_PORT=465 with SMTP_SECURE=true (SSL)');
            console.error('      - Check your hosting provider\'s SMTP documentation');
            console.error('   4. For Gmail: Use an App Password (not your regular password)');
            console.error(`   Current config: ${smtpHost}:${smtpPort}, Secure=${smtpSecure}`);
        } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
            console.error('   Connection failed. Please check:');
            console.error(`   1. SMTP_HOST (${smtpHost}) is correct`);
            console.error(`   2. SMTP_PORT (${smtpPort}) is correct and the server accepts connections`);
            console.error('   3. Firewall allows outbound connections on this port');
            console.error('   4. The port might be blocked - try common ports:');
            console.error('      - Port 587 (STARTTLS) - most common for hosting providers');
            console.error('      - Port 465 (SSL) - alternative');
            console.error('      - Port 25 (unencrypted) - rarely used, often blocked');
            console.error('      - Port 2525 (alternative) - if your provider specifically uses it');
            
            if (error.code === 'ECONNREFUSED') {
                console.error(`   ❌ Connection REFUSED on ${smtpHost}:${smtpPort}`);
                console.error('   This usually means:');
                console.error('   - The port is incorrect for this mail server');
                console.error('   - The mail server is not accepting connections on this port');
                console.error('   - Try changing SMTP_PORT to 587 or 465 in your .env file');
            }
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

    // Use appropriate FROM_EMAIL based on environment
    const fromEmail = isDevelopment 
        ? (process.env.FROM_EMAIL_DEV || process.env.EMAIL_USER || process.env.FROM_EMAIL || smtpUsername)
        : (process.env.FROM_EMAIL || smtpUsername);
    
    const mailOptions = {
        from: `"Pehli Rasam" <${fromEmail}>`,
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
