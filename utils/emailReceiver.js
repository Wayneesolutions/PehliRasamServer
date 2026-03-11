const Imap = require('imap');
const { simpleParser } = require('mailparser');
const sendEmail = require('./sendEmail');
const EmailSettings = require('../models/admin/emailSettingsModel');
const InboxMessage = require('../models/customer/mail/inboxMessage');
const Customer = require('../models/customer/customerModel');
const MailLog = require('../models/customer/mail/mailLog');

// Store processed email UIDs to avoid duplicate processing
const processedEmails = new Set();

/**
 * Connect to IMAP and fetch new emails
 */
const connectAndFetchEmails = (imapConfig) => {
  return new Promise((resolve, reject) => {
    const imap = new Imap(imapConfig);
    let connectionTimeout;

    // Set connection timeout (increased for large inboxes)
    connectionTimeout = setTimeout(() => {
      imap.end();
      reject(new Error('IMAP connection timeout'));
    }, 60000);

    imap.once('ready', () => {
      clearTimeout(connectionTimeout);
      console.log('   ✅ IMAP connection established');
      imap.openBox('INBOX', false, (err, box) => {
        if (err) {
          console.error('   ❌ Error opening INBOX:', err.message);
          imap.end();
          return reject(err);
        }
        console.log(`   ✅ Opened INBOX (${box.messages.total} total messages)`);

        // Search for emails from the last 24 hours (both read and unread)
        // This ensures we catch customer replies even if they've been opened in Gmail
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        // Format date for IMAP (e.g., "January 29, 2026")
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'];
        const formattedDate = `${monthNames[yesterday.getMonth()]} ${yesterday.getDate()}, ${yesterday.getFullYear()}`;
        
        imap.search([['SINCE', formattedDate]], (err, results) => {
          if (err) {
            console.error('   ❌ Error searching for emails:', err.message);
            imap.end();
            return reject(err);
          }

          console.log(`   📬 Found ${results?.length || 0} email(s) from last 24 hours`);

          let emailsToProcess = results || [];
          
          // If too many emails, only process the most recent ones (limit to 20 per run)
          const MAX_EMAILS_PER_RUN = 20;
          if (emailsToProcess.length > MAX_EMAILS_PER_RUN) {
            console.log(`   ⚠️  Too many emails (${emailsToProcess.length}). Processing only the most recent ${MAX_EMAILS_PER_RUN}...`);
            console.log(`   💡 The system will process ${MAX_EMAILS_PER_RUN} emails per run. Remaining emails will be processed in subsequent runs.`);
            // Get the last N UIDs (most recent)
            emailsToProcess = emailsToProcess.slice(-MAX_EMAILS_PER_RUN);
          }
          
          processEmails();

          function processEmails() {
            if (!emailsToProcess || emailsToProcess.length === 0) {
              imap.end();
              return resolve([]);
            }

            // Filter out already processed emails
            const newResults = emailsToProcess.filter(uid => !processedEmails.has(uid));
            console.log(`   📬 ${newResults.length} new email(s) to process (${emailsToProcess.length - newResults.length} already processed)`);
            
            if (newResults.length === 0) {
              imap.end();
              return resolve([]);
            }

            const fetch = imap.fetch(newResults, {
              bodies: '',
              struct: true
            });

            const emails = [];
            let emailPromises = [];

            fetch.on('message', (msg, seqno) => {
              const emailPromise = new Promise((resolveEmail) => {
                let emailData = {
                  uid: newResults[seqno - 1],
                  from: '',
                  fromName: '',
                  to: [],
                  cc: [],
                  subject: '',
                  text: '',
                  html: '',
                  date: null,
                  messageId: null,
                  inReplyTo: null,
                  references: [],
                  attachments: [],
                  headers: {}
                };

                let parsedData = null;

                msg.on('body', (stream, info) => {
                  simpleParser(stream, (err, parsed) => {
                    if (err) {
                      console.error(`   ⚠️  Error parsing email ${emailData.uid}:`, err.message);
                    } else if (parsed) {
                      parsedData = parsed;
                    }
                  });
                });

                msg.once('end', () => {
                  // Small delay to ensure parsing completes
                  setTimeout(() => {
                    // Process parsed data after stream ends
                    if (parsedData) {
                    // Extract from email and name
                    if (parsedData.from?.value && parsedData.from.value.length > 0) {
                      emailData.from = parsedData.from.value[0].address || parsedData.from.text || '';
                      emailData.fromName = parsedData.from.value[0].name || '';
                    } else {
                      emailData.from = parsedData.from?.text || '';
                    }
                    
                    // Extract to emails - handle multiple recipients
                    if (parsedData.to?.value && Array.isArray(parsedData.to.value)) {
                      emailData.to = parsedData.to.value.map(addr => addr.address);
                    } else if (parsedData.to?.text) {
                      emailData.to = [parsedData.to.text];
                    }
                    
                    // Extract cc emails
                    if (parsedData.cc?.value && Array.isArray(parsedData.cc.value)) {
                      emailData.cc = parsedData.cc.value.map(addr => addr.address);
                    }
                    
                    emailData.subject = parsedData.subject || '';
                    emailData.text = parsedData.text || '';
                    emailData.html = parsedData.html || parsedData.textAsHtml || '';
                    emailData.date = parsedData.date || new Date();
                    
                    // Extract email threading headers
                    emailData.messageId = parsedData.messageId || `${Date.now()}-${emailData.uid}@pehlirasam.com`;
                    emailData.inReplyTo = parsedData.inReplyTo || null;
                    
                    // Extract references for conversation threading
                    if (parsedData.references && Array.isArray(parsedData.references)) {
                      emailData.references = parsedData.references;
                    } else if (parsedData.references) {
                      emailData.references = [parsedData.references];
                    }
                    
                    // Extract attachments metadata
                    if (parsedData.attachments && Array.isArray(parsedData.attachments)) {
                      emailData.attachments = parsedData.attachments.map(att => ({
                        fileName: att.filename || 'untitled',
                        fileSize: att.size || 0,
                        mimeType: att.contentType || 'application/octet-stream',
                        contentId: att.contentId || null
                      }));
                    }
                    
                    // Store important headers
                    emailData.headers = parsedData.headers ? Object.fromEntries(parsedData.headers) : {};
                  } else {
                    console.log(`   ⚠️  Warning: Email ${emailData.uid} - No parsed data available`);
                  }
                  
                  resolveEmail(emailData);
                  }, 100); // 100ms delay to ensure parsing completes
                });
              });

              emailPromises.push(emailPromise);
            });

            fetch.once('error', (err) => {
              console.error('   ❌ Error fetching email:', err.message);
              imap.end();
              reject(err);
            });

            fetch.once('end', async () => {
              try {
                const parsedEmails = await Promise.all(emailPromises);
                imap.end();
                resolve(parsedEmails);
              } catch (err) {
                imap.end();
                reject(err);
              }
            });
          }
        });
      });
    });

    imap.once('error', (err) => {
      clearTimeout(connectionTimeout);
      console.error('   ❌ IMAP connection error:', err.message);
      console.error('   Error code:', err.code);
      reject(err);
    });

    console.log('   🔌 Connecting to IMAP server...');
    imap.connect();
  });
};

/**
 * Process incoming emails:
 * - Inbound Email: Save to inbox (for tracking customer replies to emails sent from software)
 * - Contact Email: Send auto-reply (if enabled) - NOT saved to inbox
 */
const processIncomingEmails = async () => {
  try {
    // Clear processed emails set at start of each run
    // This allows re-processing if logic changes
    processedEmails.clear();
    
    // Get email settings
    const settings = await EmailSettings.getOrCreate();

    console.log('📧 Checking email configuration...');
    console.log(`   Inbound email: ${settings.inboundEmail || '(not set)'} - for inbox tracking`);
    console.log(`   Contact email: ${settings.contactEmail || '(not set)'} - for auto-reply`);
    console.log(`   Auto-reply enabled: ${settings.autoReplyEnabled ? 'Yes' : 'No'}`);
    
    // Need at least Inbound Email OR Contact Email configured
    if (!settings.inboundEmail && !settings.contactEmail) {
      console.log(`❌ Neither Inbound Email nor Contact Email configured. Please configure at least one in email settings.`);
      return { processed: 0, saved: 0, replied: 0 };
    }

    // Determine which IMAP account to use
    // Priority: Use IMAP settings if configured, otherwise infer from Contact Email SMTP
    let imapConfig;
    
    if (settings.imapSettings && settings.imapSettings.host && settings.imapSettings.username && settings.imapSettings.password) {
      // Use configured IMAP settings (for Inbound Email)
      console.log(`   Using IMAP settings for Inbound Email inbox tracking`);
      console.log(`   IMAP Host: ${settings.imapSettings.host}`);
      console.log(`   IMAP Username: ${settings.imapSettings.username}`);
      
      const imapPort = parseInt(settings.imapSettings.port) || 993;
      const imapSecure = settings.imapSettings.secure !== false;
      
      imapConfig = {
        user: settings.imapSettings.username,
        password: settings.imapSettings.password.trim(),
        host: settings.imapSettings.host,
        port: imapPort,
        tls: imapSecure,
        tlsOptions: { rejectUnauthorized: false },
        connTimeout: 60000,
        authTimeout: 60000
      };
    } else if (settings.contactEmail && settings.contactEmailSmtp && 
               settings.contactEmailSmtp.host && settings.contactEmailSmtp.username && settings.contactEmailSmtp.password) {
      // Infer IMAP settings from Contact Email SMTP (for auto-reply)
      console.log(`   Using Contact Email SMTP to infer IMAP settings for auto-reply`);
      console.log(`   Contact Email SMTP Host: ${settings.contactEmailSmtp.host}`);
      console.log(`   Contact Email SMTP Username: ${settings.contactEmailSmtp.username}`);
      
      // Determine IMAP host from SMTP host
      let imapHost = settings.contactEmailSmtp.host;
      if (imapHost.includes('gmail.com')) {
        imapHost = 'imap.gmail.com';
      } else if (imapHost.includes('smtp.')) {
        imapHost = imapHost.replace('smtp.', 'imap.');
      } else if (imapHost.includes('mail.')) {
        imapHost = imapHost.replace('mail.', 'imap.');
      } else {
        // Try common IMAP host patterns
        const domain = imapHost.split('.').slice(-2).join('.');
        imapHost = `imap.${domain}`;
      }
      
      // Determine IMAP port and secure setting
      const smtpPort = parseInt(settings.contactEmailSmtp.port) || 587;
      let imapPort = 993;
      let imapSecure = true;
      
      if (imapHost.includes('gmail.com')) {
        imapPort = 993;
        imapSecure = true;
      } else if (smtpPort === 465) {
        imapPort = 993;
        imapSecure = true;
      } else {
        imapPort = 993; // Default to 993 for most providers
        imapSecure = true;
      }
      
      imapConfig = {
        user: settings.contactEmailSmtp.username,
        password: settings.contactEmailSmtp.password.trim(),
        host: imapHost,
        port: imapPort,
        tls: imapSecure,
        tlsOptions: { rejectUnauthorized: false },
        connTimeout: 60000,
        authTimeout: 60000
      };
    } else {
      console.log('❌ IMAP settings not configured. Please configure IMAP settings or Contact Email SMTP settings.');
      return { processed: 0, saved: 0, replied: 0 };
    }
    
    // Log configuration for debugging
    console.log(`   📋 IMAP Configuration:`);
    console.log(`      Host: ${imapConfig.host}`);
    console.log(`      Port: ${imapConfig.port}`);
    console.log(`      TLS/SSL: ${imapConfig.tls ? 'SSL' : 'STARTTLS'}`);
    console.log(`      Username: ${imapConfig.user}`);
    console.log(`      Password Length: ${imapConfig.password.length}`);

    console.log('📧 Checking for new emails...');
    console.log(`   Connecting to IMAP: ${imapConfig.host}:${imapConfig.port}`);

    // Fetch new emails with timeout
    let emails = [];
    try {
      emails = await Promise.race([
        connectAndFetchEmails(imapConfig),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('IMAP connection timeout after 60 seconds')), 60000)
        )
      ]);
    } catch (error) {
      console.error('❌ Error connecting to IMAP:', error.message);
      if (error.code === 'EAUTH' || error.message.includes('authentication') || error.message.includes('Invalid credentials') || error.message.includes('Failure')) {
        console.error('   🔐 Authentication failed. Please check:');
        console.error(`   1. IMAP Host: ${imapConfig.host} (should match your email provider)`);
        console.error(`   2. IMAP Username: ${imapConfig.user}`);
        console.error(`   3. IMAP Password: Make sure it matches your SMTP password`);
        console.error(`   4. IMAP Port: ${imapConfig.port} (993 for SSL, 143 for STARTTLS)`);
        console.error(`   5. TLS/SSL Setting: ${imapConfig.tls ? 'SSL' : 'STARTTLS'}`);
        
        // Check if using Gmail vs Hostinger
        if (imapConfig.host.includes('gmail.com')) {
          console.error('   📧 Gmail detected - You MUST use an App Password:');
          console.error('      - Enable 2-Step Verification: https://myaccount.google.com/security');
          console.error('      - Generate App Password: https://myaccount.google.com/apppasswords');
        } else {
          console.error('   📧 Hostinger/Other Provider - Common issues:');
          console.error('      - IMAP must be enabled in your hosting control panel');
          console.error('      - Try port 143 with STARTTLS (Secure: false) if 993 doesn\'t work');
          console.error('      - Try port 993 with SSL (Secure: true) if 143 doesn\'t work');
          console.error('      - Password should be the same as SMTP password');
          console.error('      - Check Hostinger email settings for correct IMAP server');
        }
        
        console.error('   💡 TIP: If SMTP works but IMAP doesn\'t, try:');
        console.error('      - Port 143 with Secure: false (STARTTLS)');
        console.error('      - Port 993 with Secure: true (SSL)');
        console.error('      - Verify IMAP is enabled in your hosting control panel');
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        console.error('   🔌 Connection failed. Please check:');
        console.error(`   1. IMAP Host: ${imapConfig.host} (verify this is correct for your provider)`);
        console.error(`   2. IMAP Port: ${imapConfig.port}`);
        console.error('   3. Firewall allows outbound connections');
        console.error('   4. IMAP service is enabled on your email server');
      }
      return { processed: 0, saved: 0, error: error.message };
    }

    if (emails.length === 0) {
      console.log('📧 No new emails found');
      return { processed: 0, saved: 0 };
    }

    console.log(`📧 Found ${emails.length} new email(s)`);

    let savedCount = 0;
    let repliedCount = 0;

    // Process each email
    for (const email of emails) {
      try {
        console.log(`\n📧 Processing email:`);
        console.log(`   From: ${email.from}`);
        console.log(`   To: ${email.to?.join(', ')}`);
        console.log(`   CC: ${email.cc?.join(', ') || '(none)'}`);
        console.log(`   Subject: ${email.subject}`);
        console.log(`   Message-ID: ${email.messageId}`);
        
        // Check recipients
        const emailToString = Array.isArray(email.to) ? email.to.join(',').toLowerCase() : (email.to || '').toLowerCase();
        const emailCcString = Array.isArray(email.cc) ? email.cc.join(',').toLowerCase() : '';
        const allRecipients = (emailToString + ',' + emailCcString).toLowerCase();
        
        const inboundEmailLower = settings.inboundEmail ? settings.inboundEmail.toLowerCase() : '';
        const contactEmailLower = settings.contactEmail ? settings.contactEmail.toLowerCase() : '';
        
        console.log(`   🔍 Checking recipients against:`);
        if (settings.inboundEmail) {
          console.log(`      Inbound email (for inbox tracking): ${settings.inboundEmail}`);
        }
        if (settings.contactEmail) {
          console.log(`      Contact email (for auto-reply): ${settings.contactEmail}`);
        }
        
        // Check if email is sent to Inbound Email address (for inbox tracking)
        const isToInboundEmail = inboundEmailLower && 
                                 (allRecipients.includes(inboundEmailLower) || 
                                  allRecipients.includes(`<${inboundEmailLower}>`));
        
        // Check if email is sent to Contact Email address (for auto-reply)
        const isToContactEmail = contactEmailLower && 
                                 (allRecipients.includes(contactEmailLower) || 
                                  allRecipients.includes(`<${contactEmailLower}>`));

        // Only process emails sent to Inbound Email OR Contact Email
        if (!isToInboundEmail && !isToContactEmail) {
          console.log(`   ❌ Email NOT sent to Inbound Email or Contact Email, skipping`);
          console.log(`   Email recipients: ${emailToString}`);
          if (settings.inboundEmail) {
            console.log(`   Expected: ${settings.inboundEmail} (for inbox) or ${settings.contactEmail || '(not set)'} (for auto-reply)`);
          }
          // Mark as processed anyway to avoid reprocessing
          processedEmails.add(email.uid);
          continue;
        }

        if (isToInboundEmail) {
          console.log(`   ✅ Matched: Inbound email (${settings.inboundEmail}) - will save to inbox`);
        }
        if (isToContactEmail) {
          console.log(`   ✅ Matched: Contact email (${settings.contactEmail}) - will send auto-reply`);
        }
        
        // Extract sender email
        const senderEmail = email.from.match(/[\w\.-]+@[\w\.-]+\.\w+/)?.[0] || email.from;
        
        if (!senderEmail || !senderEmail.includes('@')) {
          console.log(`📧 Invalid sender email, skipping: ${email.from}`);
          processedEmails.add(email.uid);
          continue;
        }

        // Detect bounce-back emails (mail delivery failures) and skip them
        // These are automated error messages from mail servers, NOT customer replies
        const fromLower = (email.from || '').toLowerCase();
        const fromNameLower = (email.fromName || '').toLowerCase();
        const subjectLower = (email.subject || '').toLowerCase();
        const bodyLower = ((email.text || '') + ' ' + (email.html || '')).toLowerCase();
        
        const isBounceBack = 
          // Check sender patterns
          fromLower.includes('mailer-daemon') ||
          fromLower.includes('mail delivery') ||
          fromLower.includes('postmaster@') ||
          fromNameLower.includes('mail delivery system') ||
          fromNameLower.includes('mailer-daemon') ||
          // Check subject patterns
          subjectLower.includes('mail delivery failed') ||
          subjectLower.includes('delivery status notification') ||
          subjectLower.includes('undelivered mail') ||
          subjectLower.includes('returned mail') ||
          subjectLower.includes('returning message to sender') ||
          // Check body patterns
          bodyLower.includes('mail delivery failed') ||
          bodyLower.includes('could not be delivered') ||
          bodyLower.includes('permanent error') ||
          bodyLower.includes('550-5.1.1') ||
          bodyLower.includes('nosuchuser') ||
          bodyLower.includes('reporting-mta') ||
          bodyLower.includes('final-recipient') ||
          bodyLower.includes('diagnostic-code');
        
        if (isBounceBack) {
          console.log(`   ⚠️  Bounce-back email detected (mail delivery failure) - skipping save to inbox`);
          console.log(`   From: ${email.from}`);
          console.log(`   Subject: ${email.subject}`);
          // Mark as processed but don't save to inbox
          processedEmails.add(email.uid);
          continue;
        }

        // Check if this is a REPLY (used to decide if it is project-related)
        const hasReplyHeaders = !!(email.inReplyTo || (email.references && email.references.length > 0));
        const hasReplySubject = email.subject && (email.subject.startsWith('Re:') || email.subject.startsWith('RE:'));
        const isReply = hasReplyHeaders || hasReplySubject;
        
        if (isReply) {
          console.log(`   ℹ️  Email is a reply`);
        }
        
        // Check if email already exists in database (avoid duplicates)
        const existingEmail = await InboxMessage.findOne({ messageId: email.messageId });
        let inboxMessage = null;
        
        // Save emails to inbox ONLY if they are project-related:
        // - Customer reply to an email that was sent from this software (MailLog match)
        if (isToInboundEmail) {
          if (existingEmail) {
            console.log(`   ⚠️  Email already exists in database (Message-ID: ${email.messageId})`);
            inboxMessage = existingEmail;
            // Don't skip - continue to check for auto-reply if needed
          } else {
            // Only store project-related emails in inbox
            let matchedSentEmail = null;
            try {
              // 1) Best: match by Message-IDs in reply headers
              const messageIdsToCheck = [
                email.inReplyTo,
                ...(Array.isArray(email.references) ? email.references : [])
              ].filter(Boolean);
              
              if (messageIdsToCheck.length > 0) {
                matchedSentEmail = await MailLog.findOne({
                  messageId: { $in: messageIdsToCheck }
                });
              }
              
              // 2) Fallback: match by sender + subject (strip Re:) for recent sent emails
              if (!matchedSentEmail && isReply && email.subject) {
                const baseSubject = email.subject.replace(/^\s*re:\s*/i, '').trim();
                const cutoff = new Date(Date.now() - 1000 * 60 * 60 * 24 * 90); // last 90 days
                
                matchedSentEmail = await MailLog.findOne({
                  to: { $regex: new RegExp(`^${senderEmail}$`, 'i') },
                  subject: { $regex: new RegExp(`^${baseSubject}$`, 'i') },
                  sentAt: { $gte: cutoff }
                }).sort({ sentAt: -1 });
              }
            } catch (matchSentError) {
              console.error(`   ⚠️  Error matching sent email (MailLog):`, matchSentError.message);
            }

            if (!matchedSentEmail) {
              console.log(`   ❌ Not project-related (no MailLog match) - skipping save to inbox`);
              // Do NOT save to inbox; still allow auto-reply if this email also targets Contact Email
              // Mark as processed later at end of loop
            } else {
              console.log(`   ✅ Project-related reply matched to sent email (MailLog ID: ${matchedSentEmail._id})`);

            // Try to match sender with existing customer
            let matchedCustomer = null;
            try {
              matchedCustomer = await Customer.findOne({ 
                email: { $regex: new RegExp(`^${senderEmail}$`, 'i') },
                isDeleted: false 
              });
              if (matchedCustomer) {
                console.log(`   ✅ Matched customer: ${matchedCustomer.firstName} ${matchedCustomer.lastName} (ID: ${matchedCustomer._id})`);
              } else {
                console.log(`   ℹ️  No matching customer found for: ${senderEmail}`);
              }
            } catch (matchError) {
              console.error(`   ⚠️  Error matching customer:`, matchError.message);
            }

            // Save email to inbox
            try {
              inboxMessage = new InboxMessage({
                messageId: email.messageId,
                from: senderEmail,
                fromName: email.fromName || '',
                to: email.to || [],
                cc: email.cc || [],
                subject: email.subject || '(No Subject)',
                body: email.html || email.text || '',
                textBody: email.text || '',
                receivedAt: new Date(),
                emailDate: email.date || new Date(),
                customerId: matchedCustomer ? matchedCustomer._id : null,
                customerMatched: !!matchedCustomer,
                inReplyTo: email.inReplyTo,
                references: email.references || [],
                isRead: false,
                hasAutoReplied: false,
                attachments: email.attachments || [],
                rawHeaders: email.headers || {}
              });

              await inboxMessage.save();
              console.log(`   ✅ Email saved to inbox (ID: ${inboxMessage._id})`);
              savedCount++;
            } catch (saveError) {
              console.error(`   ❌ Error saving email to inbox:`, saveError.message);
            }
            }
          }
        }
        
        // Send auto-reply for Contact Email messages (if enabled)
        // Only send if not already replied (check existing email or inbox message)
        const alreadyReplied = existingEmail?.hasAutoReplied || inboxMessage?.hasAutoReplied;
        
        if (isToContactEmail && settings.autoReplyEnabled && settings.autoReplyMessage && settings.contactEmail && !alreadyReplied) {
          // Check if Contact Email SMTP is configured
          const hasContactEmailSmtp = settings.contactEmailSmtp && 
                                     settings.contactEmailSmtp.host && 
                                     settings.contactEmailSmtp.username && 
                                     settings.contactEmailSmtp.password;
          
          if (!hasContactEmailSmtp) {
            console.log(`   ⚠️  Auto-reply enabled but Contact Email SMTP not configured - skipping`);
            console.log(`   💡 Please configure SMTP settings for Contact Email in Email Settings`);
          } else {
            try {
              console.log(`   📧 Sending auto-reply to customer: ${senderEmail}`);
              console.log(`   📧 Using Contact Email SMTP: ${settings.contactEmailSmtp.username}`);
              
              // Create nodemailer transporter for Contact Email
              const nodemailer = require('nodemailer');
              const contactPort = parseInt(settings.contactEmailSmtp.port) || 587;
              const contactSecure = contactPort === 465 || settings.contactEmailSmtp.connectionType === 'ssl';
              
              const contactTransporter = nodemailer.createTransport({
                host: settings.contactEmailSmtp.host,
                port: contactPort,
                secure: contactSecure,
                auth: {
                  user: settings.contactEmailSmtp.username,
                  pass: settings.contactEmailSmtp.password.trim()
                },
                tls: {
                  rejectUnauthorized: false
                }
              });
              
              const autoReplySubject = email.subject.startsWith('Re:') 
                ? email.subject 
                : `Re: ${email.subject}`;
              
              const autoReplyHtml = `
                <!DOCTYPE html>
                <html>
                  <head>
                    <style>
                      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                      .message { background-color: #f9f9f9; padding: 20px; border-left: 4px solid #4CAF50; margin: 20px 0; }
                      .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; border-top: 1px solid #ddd; margin-top: 20px; }
                    </style>
                  </head>
                  <body>
                    <div class="container">
                      <div class="message">
                        <p>${settings.autoReplyMessage.replace(/\n/g, '<br>')}</p>
                      </div>
                      <div class="footer">
                        <p>This is an automated response from Pehli Rasam</p>
                      </div>
                    </div>
                  </body>
                </html>
              `;
              
              const mailOptions = {
                from: `"Pehli Rasam" <${settings.contactEmail}>`,
                to: senderEmail,
                subject: autoReplySubject,
                html: autoReplyHtml,
                text: settings.autoReplyMessage
              };
              
              const autoReplyResult = await contactTransporter.sendMail(mailOptions);
              
              if (autoReplyResult) {
                console.log(`   ✅ Auto-reply sent to customer successfully from ${settings.contactEmail}`);
                repliedCount++;
                
                // If email was also saved to inbox, update the hasAutoReplied flag
                if (inboxMessage) {
                  try {
                    await InboxMessage.findByIdAndUpdate(inboxMessage._id, {
                      hasAutoReplied: true,
                      autoRepliedAt: new Date()
                    });
                    console.log(`   ✅ Updated inbox message with auto-reply flag`);
                  } catch (updateError) {
                    console.error(`   ⚠️  Failed to update hasAutoReplied flag:`, updateError.message);
                  }
                }
              }
            } catch (autoReplyError) {
              console.error(`   ⚠️  Error sending auto-reply:`, autoReplyError.message);
            }
          }
        } else if (isToContactEmail && alreadyReplied) {
          console.log(`   ℹ️  Email sent to Contact Email but auto-reply already sent`);
        } else if (isToContactEmail && !settings.autoReplyEnabled) {
          console.log(`   ℹ️  Email sent to Contact Email but auto-reply is disabled`);
        }
        
        // Mark email as processed
        processedEmails.add(email.uid);

        // Clean up old processed emails (keep last 1000)
        if (processedEmails.size > 1000) {
          const emailsArray = Array.from(processedEmails);
          processedEmails.clear();
          emailsArray.slice(-1000).forEach(uid => processedEmails.add(uid));
        }

      } catch (error) {
        console.error(`❌ Error processing email from ${email.from}:`, error.message);
        console.error(error.stack);
        // Mark as processed to avoid infinite retry
        processedEmails.add(email.uid);
      }
    }

    console.log(`\n📧 Summary:`);
    console.log(`   Processed: ${emails.length} email(s)`);
    console.log(`   Saved to inbox: ${savedCount} email(s)`);
    console.log(`   Auto-replies sent: ${repliedCount} email(s)`);

    return { processed: emails.length, saved: savedCount, replied: repliedCount };

  } catch (error) {
    console.error('❌ Error in processIncomingEmails:', error.message);
    return { processed: 0, saved: 0, error: error.message };
  }
};

module.exports = {
  processIncomingEmails
};

