const Imap = require('imap');
const { simpleParser } = require('mailparser');
const sendEmail = require('./sendEmail');
const EmailSettings = require('../models/admin/emailSettingsModel');
const InboxMessage = require('../models/customer/mail/inboxMessage');
const Customer = require('../models/customer/customerModel');

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

        // Search for unseen emails, but limit to most recent ones to avoid processing thousands
        // First, get the most recent unseen emails (limit to last 50)
        imap.search(['UNSEEN'], (err, results) => {
          if (err) {
            console.error('   ❌ Error searching for emails:', err.message);
            imap.end();
            return reject(err);
          }

          console.log(`   📬 Found ${results?.length || 0} unseen email(s)`);

          let emailsToProcess = results || [];
          
          // If too many emails, only process the most recent ones (limit to 20 per run)
          const MAX_EMAILS_PER_RUN = 20;
          if (emailsToProcess.length > MAX_EMAILS_PER_RUN) {
            console.log(`   ⚠️  Too many emails (${emailsToProcess.length}). Processing only the most recent ${MAX_EMAILS_PER_RUN}...`);
            console.log(`   💡 The system will process ${MAX_EMAILS_PER_RUN} emails per run. Remaining emails will be processed in subsequent runs.`);
            // Get the last N UIDs (most recent)
            emailsToProcess = emailsToProcess.slice(-MAX_EMAILS_PER_RUN);
          }
          
          // If no unseen emails, check recent emails from last 24 hours
          if (emailsToProcess.length === 0) {
            console.log('   📬 No unseen emails, checking recent emails from last 24 hours...');
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            imap.search(['SINCE', yesterday], (err2, recentResults) => {
              if (!err2 && recentResults && recentResults.length > 0) {
                console.log(`   📬 Found ${recentResults.length} recent email(s) from last 24 hours`);
                // Limit to most recent 50
                emailsToProcess = recentResults.slice(-MAX_EMAILS_PER_RUN);
                if (recentResults.length > MAX_EMAILS_PER_RUN) {
                  console.log(`   ⚠️  Processing only the most recent ${MAX_EMAILS_PER_RUN}...`);
                }
              }
              processEmails();
            });
          } else {
            processEmails();
          }

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

                msg.on('body', (stream, info) => {
                  simpleParser(stream, (err, parsed) => {
                    if (err) {
                      console.error(`   ⚠️  Error parsing email ${emailData.uid}:`, err.message);
                    } else if (parsed) {
                      // Extract from email and name
                      if (parsed.from?.value && parsed.from.value.length > 0) {
                        emailData.from = parsed.from.value[0].address || parsed.from.text || '';
                        emailData.fromName = parsed.from.value[0].name || '';
                      } else {
                        emailData.from = parsed.from?.text || '';
                      }
                      
                      // Extract to emails - handle multiple recipients
                      if (parsed.to?.value && Array.isArray(parsed.to.value)) {
                        emailData.to = parsed.to.value.map(addr => addr.address);
                      } else if (parsed.to?.text) {
                        emailData.to = [parsed.to.text];
                      }
                      
                      // Extract cc emails
                      if (parsed.cc?.value && Array.isArray(parsed.cc.value)) {
                        emailData.cc = parsed.cc.value.map(addr => addr.address);
                      }
                      
                      emailData.subject = parsed.subject || '';
                      emailData.text = parsed.text || '';
                      emailData.html = parsed.html || parsed.textAsHtml || '';
                      emailData.date = parsed.date || new Date();
                      
                      // Extract email threading headers
                      emailData.messageId = parsed.messageId || `${Date.now()}-${emailData.uid}@pehlirasam.com`;
                      emailData.inReplyTo = parsed.inReplyTo || null;
                      
                      // Extract references for conversation threading
                      if (parsed.references && Array.isArray(parsed.references)) {
                        emailData.references = parsed.references;
                      } else if (parsed.references) {
                        emailData.references = [parsed.references];
                      }
                      
                      // Extract attachments metadata
                      if (parsed.attachments && Array.isArray(parsed.attachments)) {
                        emailData.attachments = parsed.attachments.map(att => ({
                          fileName: att.filename || 'untitled',
                          fileSize: att.size || 0,
                          mimeType: att.contentType || 'application/octet-stream',
                          contentId: att.contentId || null
                        }));
                      }
                      
                      // Store important headers
                      emailData.headers = parsed.headers ? parsed.headers.toJSON() : {};
                    }
                  });
                });

                msg.once('end', () => {
                  resolveEmail(emailData);
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
 * Process incoming emails and send auto-replies
 */
const processIncomingEmails = async () => {
  try {
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
        
        // Only save to inbox if sent to INBOUND email (not reply-to emails)
        const shouldSaveToInbox = isToInboundEmail;
        
        if (shouldSaveToInbox) {
          console.log(`   ✅ Email sent to INBOUND address - will be saved to inbox`);
        } else {
          console.log(`   ℹ️  Email sent to reply-to/domain only - will NOT be saved to inbox (only for auto-reply)`);
        }

        // Extract sender email
        const senderEmail = email.from.match(/[\w\.-]+@[\w\.-]+\.\w+/)?.[0] || email.from;
        
        if (!senderEmail || !senderEmail.includes('@')) {
          console.log(`📧 Invalid sender email, skipping: ${email.from}`);
          processedEmails.add(email.uid);
          continue;
        }

        // Only save to inbox if email is sent to INBOUND email address
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

