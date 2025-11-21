const nodemailer = require('nodemailer');

// Auto-detect if running locally or on production server
// Priority: EMAIL_USER presence > NODE_ENV > hostname detection
// If EMAIL_USER exists, assume local development (allows using production DB with Gmail SMTP)


let smtpHost, smtpPort, smtpSecure, smtpUsername, smtpPassword,fromEmail;


// PRODUCTION SERVER: Use production SMTP variables only
fromEmail = process.env.FROM_EMAIL || 'info@pehlirasam.com';
smtpHost = process.env.SMTP_HOST || 'mail.pehlirasam.com';
smtpPort =  587;
// Convert SMTP_SECURE to boolean properly
smtpSecure = false
smtpUsername = process.env.SMTP_USERNAME || 'info@pehlirasam.com';
smtpPassword = process.env.SMTP_PASSWORD || 'Infopehilirasam123';

// Debug logging (without sensitive data)
if (smtpHost && smtpUsername) {
    const passwordLength = smtpPassword ? smtpPassword.length : 0;
    const usernamePreview = smtpUsername ? smtpUsername.substring(0, 3) + '***' : 'NOT_SET';
    console.log(`📧 SMTP Config [PROD]: Host=${smtpHost}, Port=${smtpPort}, Secure=${smtpSecure}, User=${usernamePreview}, PasswordLength=${passwordLength}`);
    
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
    console.warn('   Please set SMTP_HOST, SMTP_USERNAME, and SMTP_PASSWORD in your .env file.');
}

if (!smtpUsername || !smtpPassword) {
    console.warn('⚠️  SMTP credentials not found in environment variables.');
    console.warn('   PRODUCTION: Set SMTP_USERNAME and SMTP_PASSWORD');
    console.warn('   For hosting providers: Check SMTP_PORT (usually 587 or 465) and SMTP_SECURE settings.');
}




// Configure transporter based on port
// Port 465: Uses SSL (secure: true, no STARTTLS)
// Port 587: Uses STARTTLS (secure: false, requireTLS: true)
const transporterConfig = {
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure, // true for 465 (SSL), false for 587 (STARTTLS)
    auth: smtpUsername && smtpPassword ? {
        user: smtpUsername,
        pass: smtpPassword.trim(), // Remove any trailing spaces
    } : undefined,
    // Connection timeout
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 15000
};

// Port-specific configuration
if (smtpPort === 587) {
    // Port 587 uses STARTTLS (not SSL) - must set secure: false
    transporterConfig.secure = false;
    transporterConfig.requireTLS = true;
    transporterConfig.tls = {
        rejectUnauthorized: false // Some hosting mail servers have self-signed certificates
    };
} else if (smtpPort === 465) {
    // Port 465 uses SSL/TLS - must set secure: true
    transporterConfig.secure = true;
    transporterConfig.requireTLS = false;
    transporterConfig.tls = {
        rejectUnauthorized: false
    };
} else {
    // Other ports - use default TLS settings
    transporterConfig.tls = {
        rejectUnauthorized: false
    };
}

const transporter = nodemailer.createTransport(transporterConfig);

// Verify SMTP connection (non-blocking)
transporter.verify(function (error, success) {
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
        } else if (error.code === 'ESOCKET' || error.message.includes('wrong version number')) {
            console.error('   SSL/TLS Configuration Error:');
            console.error('   This usually means a mismatch between port and security settings.');
            console.error(`   Current: Port=${smtpPort}, Secure=${smtpSecure}`);
            console.error('\n💡 Fix:');
            if (smtpPort === 587) {
                console.error('   Port 587 requires STARTTLS (not SSL)');
                console.error('   Set in .env: SMTP_PORT=587 and SMTP_SECURE=false');
            } else if (smtpPort === 465) {
                console.error('   Port 465 requires SSL (not STARTTLS)');
                console.error('   Set in .env: SMTP_PORT=465 and SMTP_SECURE=true');
            } else {
                console.error('   Try one of these configurations:');
                console.error('   Option 1: SMTP_PORT=587, SMTP_SECURE=false (STARTTLS)');
                console.error('   Option 2: SMTP_PORT=465, SMTP_SECURE=true (SSL)');
            }
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
