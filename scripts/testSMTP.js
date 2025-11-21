#!/usr/bin/env node

/**
 * Script to test SMTP connection
 * Usage: node scripts/testSMTP.js
 */

const path = require('path');
require("dotenv").config({ path: path.resolve(__dirname, '../.env') });

const nodemailer = require('nodemailer');

async function testSMTP() {
    try {
        console.log('📧 Testing SMTP Configuration...\n');
        
        const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
        const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
        const smtpSecure = process.env.SMTP_SECURE === 'true' ? true : (process.env.SMTP_SECURE === 'false' ? false : false);
        const smtpUsername = process.env.SMTP_USERNAME;
        const smtpPassword = process.env.SMTP_PASSWORD;
        const fromEmail = process.env.FROM_EMAIL;
        
        console.log('Configuration:');
        console.log(`  Host: ${smtpHost}`);
        console.log(`  Port: ${smtpPort}`);
        console.log(`  Secure: ${smtpSecure}`);
        console.log(`  Username: ${smtpUsername ? smtpUsername.substring(0, 3) + '***' : 'NOT SET'}`);
        console.log(`  Password Length: ${smtpPassword ? smtpPassword.length : 0}`);
        console.log(`  From Email: ${fromEmail || 'NOT SET'}`);
        console.log('');
        
        if (!smtpUsername || !smtpPassword) {
            console.error('❌ SMTP_USERNAME or SMTP_PASSWORD not set in .env file!');
            process.exit(1);
        }
        
        // Check for common issues
        if (smtpPassword.includes(' ')) {
            console.warn('⚠️  WARNING: Password contains spaces!');
        }
        if (smtpPassword !== smtpPassword.trim()) {
            console.warn('⚠️  WARNING: Password has leading/trailing spaces!');
        }
        
        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpSecure,
            auth: {
                user: smtpUsername,
                pass: smtpPassword.trim(),
            },
            tls: {
                rejectUnauthorized: false
            },
            requireTLS: smtpPort === 587,
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 10000
        });
        
        console.log('🔌 Testing connection...');
        const verified = await transporter.verify();
        
        if (verified) {
            console.log('✅ SMTP connection successful!');
            console.log('✅ Authentication successful!');
            console.log('\n📧 SMTP is ready to send emails.');
            process.exit(0);
        }
        
    } catch (error) {
        console.error('\n❌ SMTP Test Failed!\n');
        console.error('Error:', error.message);
        
        if (error.code === 'EAUTH') {
            console.error('\n🔍 Authentication Error Details:');
            console.error('   This means the username or password is incorrect.');
            console.error('\n💡 Troubleshooting:');
            console.error('   1. Verify SMTP_USERNAME is correct (check for typos)');
            console.error('   2. Verify SMTP_PASSWORD is correct (check for typos, extra spaces)');
            console.error('   3. Try logging into webmail with the same credentials');
            console.error('   4. Check if password has changed recently');
            console.error('   5. For hosting providers:');
            console.error('      - Make sure you\'re using the email account password');
            console.error('      - Some providers require SMTP to be enabled in account settings');
            console.error('      - Check if IP restrictions are blocking Azure');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('\n🔍 Connection Refused:');
            console.error('   The mail server is not accepting connections on this port.');
            console.error('\n💡 Try:');
            console.error('   - Change SMTP_PORT to 465 and SMTP_SECURE=true');
            console.error('   - Or try SMTP_PORT=2525');
        } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNECTION') {
            console.error('\n🔍 Connection Timeout:');
            console.error('   Cannot reach the mail server.');
            console.error('\n💡 Check:');
            console.error('   - SMTP_HOST is correct');
            console.error('   - Firewall allows outbound connections');
            console.error('   - Network connectivity');
        }
        
        process.exit(1);
    }
}

testSMTP();

