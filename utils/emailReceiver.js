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
 * Process incoming emails and track customer replies
 */
const processIncomingEmails = async () => {
  try {
    // Clear processed emails set at start of each run
    // This allows re-processing if logic changes
    processedEmails.clear();
    
    // Get email settings
    const settings = await EmailSettings.getOrCreate();

    // Check if inbound email is configured
    console.log('📧 Checking inbox tracking configuration...');
    console.log(`   Inbound email: ${settings.inboundEmail || '(not set)'}`);
    console.log(`   Auto-reply: Disabled (tracking only)`);
    
    if (!settings.inboundEmail) {
      console.log('❌ Inbound email not configured. Please set it in email settings.');
      return { processed: 0, saved: 0 };
    }

    // Check if IMAP settings are configured
    console.log(`   IMAP Host: ${settings.imapSettings?.host || '(not set)'}`);
    console.log(`   IMAP Username: ${settings.imapSettings?.username || '(not set)'}`);
    
    if (!settings.imapSettings || !settings.imapSettings.host || !settings.imapSettings.username || !settings.imapSettings.password) {
      console.log('❌ IMAP settings not configured. Please configure IMAP settings in email settings.');
      return { processed: 0, saved: 0 };
    }

    // Configure IMAP connection
    const imapConfig = {
      user: settings.imapSettings.username,
      password: settings.imapSettings.password,
      host: settings.imapSettings.host,
      port: parseInt(settings.imapSettings.port) || 993,
      tls: settings.imapSettings.secure !== false,
      tlsOptions: { rejectUnauthorized: false }
    };

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
      if (error.code === 'EAUTH' || error.message.includes('authentication')) {
        console.error('   🔐 Authentication failed. Please check:');
        console.error('   1. IMAP username and password are correct');
        console.error('   2. For Gmail: Use App Password (not regular password)');
        console.error('   3. IMAP is enabled in your email account settings');
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        console.error('   🔌 Connection failed. Please check:');
        console.error(`   1. IMAP Host: ${imapConfig.host}`);
        console.error(`   2. IMAP Port: ${imapConfig.port}`);
        console.error('   3. Firewall allows outbound connections');
        console.error('   4. For Gmail: Use imap.gmail.com:993');
      }
      return { processed: 0, saved: 0, error: error.message };
    }

    if (emails.length === 0) {
      console.log('📧 No new emails found');
      return { processed: 0, saved: 0 };
    }

    console.log(`📧 Found ${emails.length} new email(s)`);

    let repliedCount = 0;
    let savedCount = 0;

    // Process each email
    for (const email of emails) {
      try {
        console.log(`\n📧 Processing email:`);
        console.log(`   From: ${email.from}`);
        console.log(`   To: ${email.to?.join(', ')}`);
        console.log(`   CC: ${email.cc?.join(', ') || '(none)'}`);
        console.log(`   Subject: ${email.subject}`);
        console.log(`   Message-ID: ${email.messageId}`);
        
        // Check if email is sent to the inbound email address AND/OR reply-to emails
        const emailToString = Array.isArray(email.to) ? email.to.join(',').toLowerCase() : (email.to || '').toLowerCase();
        const emailCcString = Array.isArray(email.cc) ? email.cc.join(',').toLowerCase() : '';
        const allRecipients = (emailToString + ',' + emailCcString).toLowerCase();
        
        const inboundEmailLower = settings.inboundEmail.toLowerCase();
        const replyToEmails = settings.replyToEmail ? settings.replyToEmail.split(',').map(e => e.trim().toLowerCase()) : [];
        const inboundEmailDomain = inboundEmailLower.split('@')[1];
        
        console.log(`   🔍 Checking recipients against:`);
        console.log(`      Inbound email: ${settings.inboundEmail}`);
        if (replyToEmails.length > 0) {
          console.log(`      Reply-to emails: ${replyToEmails.join(', ')}`);
        }
        
        // Check if email is sent to inbound address (check To and CC fields)
        const isToInboundEmail = allRecipients.includes(inboundEmailLower) || 
                                 allRecipients.includes(`<${inboundEmailLower}>`) ||
                                 (settings.imapSettings.username && allRecipients.includes(settings.imapSettings.username.toLowerCase()));
        
        // Check if email is sent to any reply-to addresses (check To and CC fields)
        const isToReplyToEmail = replyToEmails.length > 0 && replyToEmails.some(replyEmail => 
          allRecipients.includes(replyEmail) || allRecipients.includes(`<${replyEmail}>`)
        );
        
        // Also check if it's sent to the domain (for catch-all or aliases)
        const isToDomain = inboundEmailDomain && allRecipients.includes(`@${inboundEmailDomain}`);

        // Log which conditions matched
        if (isToInboundEmail) {
          console.log(`   ✅ Matched: Inbound email (${settings.inboundEmail})`);
        }
        if (isToReplyToEmail) {
          const matchedEmails = replyToEmails.filter(email => allRecipients.includes(email));
          console.log(`   ✅ Matched: Reply-to email (${matchedEmails.join(', ')})`);
        }
        if (isToDomain) {
          console.log(`   ✅ Matched: Domain (@${inboundEmailDomain})`);
        }

        // Accept email if it's sent to ANY of: inbound email OR reply-to emails OR domain
        // BUT only SAVE to inbox if sent to INBOUND email specifically
        if (!isToInboundEmail && !isToReplyToEmail && !isToDomain) {
          console.log(`   ❌ Email NOT sent to any monitored address, skipping`);
          console.log(`   Email recipients: ${emailToString}`);
          console.log(`   Expected one of:`);
          console.log(`      - Inbound: ${settings.inboundEmail}`);
          if (replyToEmails.length > 0) {
            console.log(`      - Reply-to: ${replyToEmails.join(', ')}`);
          }
          console.log(`      - Domain: @${inboundEmailDomain}`);
          // Mark as processed anyway to avoid reprocessing
          processedEmails.add(email.uid);
          continue;
        }
        
        // Extract sender email
        const senderEmail = email.from.match(/[\w\.-]+@[\w\.-]+\.\w+/)?.[0] || email.from;
        
        if (!senderEmail || !senderEmail.includes('@')) {
          console.log(`📧 Invalid sender email, skipping: ${email.from}`);
          processedEmails.add(email.uid);
          continue;
        }

        // Check if this is a REPLY (customer replying to our emails)
        // An email is considered a reply if:
        // 1. Has In-Reply-To or References headers, OR
        // 2. Subject starts with "Re:" or "RE:"
        const hasReplyHeaders = !!(email.inReplyTo || (email.references && email.references.length > 0));
        const hasReplySubject = email.subject && (email.subject.startsWith('Re:') || email.subject.startsWith('RE:'));
        const isReply = hasReplyHeaders || hasReplySubject;
        
        console.log(`   🔍 Checking if email is a reply...`);
        console.log(`      Subject: ${email.subject}`);
        console.log(`      Starts with Re: ${hasReplySubject ? 'YES' : 'NO'}`);
        console.log(`      In-Reply-To: ${email.inReplyTo || '(none)'}`);
        console.log(`      References: ${email.references?.join(', ') || '(none)'}`);
        
        // Try to match against our sent emails (optional - for better tracking)
        let matchedSentEmail = null;
        if (isReply && (email.inReplyTo || (email.references && email.references.length > 0))) {
          const messageIdsToCheck = [email.inReplyTo, ...(email.references || [])].filter(Boolean);
          
          if (messageIdsToCheck.length > 0) {
            try {
              matchedSentEmail = await MailLog.findOne({ 
                messageId: { $in: messageIdsToCheck }
              });
              
              if (matchedSentEmail) {
                console.log(`   ✅ Matched to our sent email!`);
                console.log(`      Original email to: ${matchedSentEmail.to}`);
                console.log(`      Original subject: ${matchedSentEmail.subject}`);
              }
            } catch (checkError) {
              console.error(`   ⚠️  Error matching sent email:`, checkError.message);
            }
          }
        }
        
        if (isReply) {
          console.log(`   ✅ Email is a REPLY (will be saved to inbox)`);
        } else {
          console.log(`   ❌ Email is NOT a reply (automated/unsolicited - will be skipped)`);
        }
        
        // Save to inbox if:
        // 1. Email is sent to INBOUND email address
        // 2. Email appears to be a reply (has Re: or reply headers)
        const shouldSaveToInbox = isToInboundEmail && isReply;
        
        if (shouldSaveToInbox) {
          console.log(`   ✅ Email qualifies for inbox - will be saved`);
        } else {
          if (!isToInboundEmail) {
            console.log(`   ❌ NOT saving: Email not sent to inbound address`);
          } else if (!isReply) {
            console.log(`   ❌ NOT saving: Email is not a reply (automated/unsolicited)`);
          }
          processedEmails.add(email.uid);
          continue;
        }

        // Save email to inbox
        if (shouldSaveToInbox) {
          // Check if email already exists in database (avoid duplicates)
          const existingEmail = await InboxMessage.findOne({ messageId: email.messageId });
          if (existingEmail) {
            console.log(`   ⚠️  Email already exists in database (Message-ID: ${email.messageId}), skipping`);
            processedEmails.add(email.uid);
            continue;
          }

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

          // Save email to inbox (auto-reply removed - only tracking)
          try {
            const inboxMessage = new InboxMessage({
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
            console.log(`   ℹ️  Auto-reply disabled for inbound messages - only tracking`);
            savedCount++;

            // Send notification to contact email
            if (settings.contactEmail) {
              try {
                console.log(`   📧 Sending notification to contact email: ${settings.contactEmail}`);
                
                const customerName = matchedCustomer 
                  ? `${matchedCustomer.firstName} ${matchedCustomer.lastName}` 
                  : email.fromName || senderEmail;
                
                const notificationSubject = `New Customer Reply: ${email.subject}`;
                const notificationHtml = `
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                        .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; }
                        .info-box { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #4CAF50; }
                        .label { font-weight: bold; color: #555; }
                        .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
                        .message-preview { background-color: #fff; padding: 15px; border: 1px solid #ddd; margin: 10px 0; border-radius: 3px; }
                      </style>
                    </head>
                    <body>
                      <div class="container">
                        <div class="header">
                          <h2>📬 New Customer Reply Received</h2>
                        </div>
                        <div class="content">
                          <p>A customer has replied to your email. Here are the details:</p>
                          
                          <div class="info-box">
                            <p><span class="label">From:</span> ${customerName}</p>
                            <p><span class="label">Email:</span> ${senderEmail}</p>
                            ${matchedCustomer ? `<p><span class="label">Customer ID:</span> ${matchedCustomer._id}</p>` : ''}
                          </div>
                          
                          <div class="info-box">
                            <p><span class="label">Subject:</span> ${email.subject}</p>
                            <p><span class="label">Received:</span> ${new Date().toLocaleString()}</p>
                          </div>
                          
                          <div class="message-preview">
                            <p class="label">Message Preview:</p>
                            <p>${(email.text || '').substring(0, 300)}${(email.text || '').length > 300 ? '...' : ''}</p>
                          </div>
                          
                          <p style="margin-top: 20px;">
                            <strong>Action Required:</strong> Please log in to your dashboard to view and respond to this message.
                          </p>
                        </div>
                        <div class="footer">
                          <p>This is an automated notification from Pehli Rasam CRM</p>
                          <p>Inbound Email: ${settings.inboundEmail}</p>
                        </div>
                      </div>
                    </body>
                  </html>
                `;
                
                const notificationText = `
New Customer Reply Received

From: ${customerName}
Email: ${senderEmail}
${matchedCustomer ? `Customer ID: ${matchedCustomer._id}` : ''}

Subject: ${email.subject}
Received: ${new Date().toLocaleString()}

Message Preview:
${(email.text || '').substring(0, 300)}${(email.text || '').length > 300 ? '...' : ''}

Action Required: Please log in to your dashboard to view and respond to this message.

---
This is an automated notification from Pehli Rasam CRM
Inbound Email: ${settings.inboundEmail}
                `;
                
                const notificationResult = await sendEmail({
                  to: settings.contactEmail,
                  subject: notificationSubject,
                  html: notificationHtml,
                  text: notificationText
                });
                
                if (notificationResult.success) {
                  console.log(`   ✅ Notification sent to contact email successfully`);
                } else {
                  console.error(`   ⚠️  Failed to send notification to contact email:`, notificationResult.error?.message);
                }
              } catch (notifyError) {
                console.error(`   ⚠️  Error sending notification to contact email:`, notifyError.message);
              }
            } else {
              console.log(`   ℹ️  No contact email configured - skipping notification`);
            }

            // Send auto-reply to customer if enabled
            if (settings.autoReplyEnabled && settings.autoReplyMessage && settings.contactEmail) {
              try {
                // Check if Contact Email SMTP is configured
                const hasContactEmailSmtp = settings.contactEmailSmtp && 
                                           settings.contactEmailSmtp.host && 
                                           settings.contactEmailSmtp.username && 
                                           settings.contactEmailSmtp.password;
                
                if (!hasContactEmailSmtp) {
                  console.log(`   ⚠️  Auto-reply enabled but Contact Email SMTP not configured - skipping`);
                  console.log(`   💡 Please configure SMTP settings for Contact Email in Email Settings`);
                } else {
                  console.log(`   📧 Auto-reply enabled - sending reply to customer: ${senderEmail}`);
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
                    
                    // Update the inbox message to mark that auto-reply was sent
                    try {
                      await InboxMessage.findByIdAndUpdate(inboxMessage._id, {
                        hasAutoReplied: true
                      });
                    } catch (updateError) {
                      console.error(`   ⚠️  Failed to update hasAutoReplied flag:`, updateError.message);
                    }
                  }
                }
              } catch (autoReplyError) {
                console.error(`   ⚠️  Error sending auto-reply:`, autoReplyError.message);
              }
            } else {
              if (!settings.autoReplyEnabled) {
                console.log(`   ℹ️  Auto-reply disabled - skipping`);
              } else if (!settings.autoReplyMessage) {
                console.log(`   ⚠️  Auto-reply enabled but no message configured - skipping`);
              } else if (!settings.contactEmail) {
                console.log(`   ⚠️  Auto-reply enabled but no contact email configured - skipping`);
              }
            }

          } catch (saveError) {
            console.error(`   ❌ Error saving email to inbox:`, saveError.message);
          }
        } else {
          // Email sent to reply-to address only - DON'T save to inbox and NO auto-reply
          console.log(`   📧 Email sent to reply-to address - not saving to inbox (auto-reply disabled)`);
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
    console.log(`   Auto-reply: Disabled (tracking only)`);

    return { processed: emails.length, saved: savedCount, replied: 0 };

  } catch (error) {
    console.error('❌ Error in processIncomingEmails:', error.message);
    return { processed: 0, replied: 0, error: error.message };
  }
};

module.exports = {
  processIncomingEmails
};

