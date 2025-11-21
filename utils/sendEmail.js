const nodemailer = require('nodemailer');

// Auto-detect if running locally or on production server
// Priority: EMAIL_USER presence > NODE_ENV > hostname detection
// If EMAIL_USER exists, assume local development (allows using production DB with Gmail SMTP)


let smtpHost, smtpPort, smtpSecure, smtpUsername, smtpPassword,fromEmail;


// PRODUCTION SERVER: Use production SMTP variables only
fromEmail = process.env.FROM_EMAIL || 'info@pehlirasam.com';
smtpHost = process.env.SMTP_HOST || 'mail.pehlirasam.com';
smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 465;
// Convert SMTP_SECURE to boolean properly
smtpSecure = process.env.SMTP_SECURE === 'true' ? true : (process.env.SMTP_SECURE === 'false' ? false : (smtpPort === 465 ? true : false));
smtpUsername = process.env.SMTP_USERNAME || 'info@pehlirasam.com';
smtpPassword = process.env.SMTP_PASSWORD || 'Infopehilirasam123';

// Remove any whitespace from password (common issue)
if (smtpPassword) {
    smtpPassword = smtpPassword.trim();
}

// Debug logging (without sensitive data)
console.log('\n📧 ========== SMTP Configuration Check ==========');
console.log('Environment Variables Check:');
console.log(`  SMTP_HOST from env: ${process.env.SMTP_HOST ? 'SET' : 'NOT SET'}`);
console.log(`  SMTP_PORT from env: ${process.env.SMTP_PORT ? process.env.SMTP_PORT : 'NOT SET'}`);
console.log(`  SMTP_SECURE from env: ${process.env.SMTP_SECURE ? process.env.SMTP_SECURE : 'NOT SET'}`);
console.log(`  SMTP_USERNAME from env: ${process.env.SMTP_USERNAME ? 'SET' : 'NOT SET'}`);
console.log(`  SMTP_PASSWORD from env: ${process.env.SMTP_PASSWORD ? 'SET (length: ' + process.env.SMTP_PASSWORD.length + ')' : 'NOT SET'}`);
console.log(`  FROM_EMAIL from env: ${process.env.FROM_EMAIL ? 'SET' : 'NOT SET'}`);

if (smtpHost && smtpUsername) {
    const passwordLength = smtpPassword ? smtpPassword.length : 0;
    const usernamePreview = smtpUsername ? smtpUsername.substring(0, 3) + '***' : 'NOT_SET';
    const passwordPreview = smtpPassword ? (smtpPassword.substring(0, 2) + '***' + smtpPassword.substring(smtpPassword.length - 2)) : 'NOT_SET';
    console.log(`\n📧 Final SMTP Config [PROD]:`);
    console.log(`   Host: ${smtpHost}`);
    console.log(`   Port: ${smtpPort}`);
    console.log(`   Secure: ${smtpSecure}`);
    console.log(`   Username: ${smtpUsername}`);
    console.log(`   Password Length: ${passwordLength}`);
    console.log(`   Password Preview: ${passwordPreview}`);
    
    // Check for common issues
    if (smtpPassword) {
        if (smtpPassword.includes(' ')) {
            console.warn('⚠️  WARNING: Password contains spaces - this might cause authentication issues!');
        }
        if (smtpPassword !== smtpPassword.trim()) {
            console.warn('⚠️  WARNING: Password has leading/trailing spaces - trimming...');
        }
        // Show first and last characters to help verify
        if (smtpPassword.length >= 6) {
            console.log(`   Password starts with: "${smtpPassword.substring(0, 3)}" and ends with: "${smtpPassword.substring(smtpPassword.length - 3)}"`);
        }
        
        // Check if using default/hardcoded password
        if (smtpPassword === 'Infopehilirasam123' || smtpPassword === 'Aahaanveer@4may22mamu') {
            console.warn('⚠️  WARNING: Using default/hardcoded password!');
            console.warn('   Make sure SMTP_PASSWORD is set correctly in your .env file on the server.');
        }
    } else {
        console.error('❌ ERROR: SMTP_PASSWORD is empty or not set!');
    }
    console.log('📧 ==========================================\n');
} else {
    console.error('❌ ERROR: SMTP_HOST or SMTP_USERNAME not found!');
    console.error('   Please set SMTP_HOST, SMTP_USERNAME, and SMTP_PASSWORD in your .env file.');
    console.log('📧 ==========================================\n');
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
