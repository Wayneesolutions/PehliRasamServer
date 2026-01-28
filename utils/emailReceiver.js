const Imap = require('imap');
const { simpleParser } = require('mailparser');
const sendEmail = require('./sendEmail');
const EmailSettings = require('../models/admin/emailSettingsModel');

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
                  to: '',
                  subject: '',
                  text: '',
                  html: '',
                  date: null
                };

                msg.on('body', (stream, info) => {
                  simpleParser(stream, (err, parsed) => {
                    if (err) {
                      console.error(`   ⚠️  Error parsing email ${emailData.uid}:`, err.message);
                    } else if (parsed) {
                      // Extract from email
                      if (parsed.from?.value && parsed.from.value.length > 0) {
                        emailData.from = parsed.from.value[0].address || parsed.from.text || '';
                      } else {
                        emailData.from = parsed.from?.text || '';
                      }
                      
                      // Extract to emails - handle multiple recipients
                      if (parsed.to?.value && Array.isArray(parsed.to.value)) {
                        emailData.to = parsed.to.value.map(addr => addr.address).join(', ') || parsed.to.text || '';
                      } else {
                        emailData.to = parsed.to?.text || '';
                      }
                      
                      emailData.subject = parsed.subject || '';
                      emailData.text = parsed.text || '';
                      emailData.html = parsed.html || '';
                      emailData.date = parsed.date || new Date();
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

    // Check if auto-reply is enabled and inbound email is configured
    console.log('📧 Checking auto-reply configuration...');
    console.log(`   Auto-reply enabled: ${settings.autoReplyEnabled}`);
    console.log(`   Inbound email: ${settings.inboundEmail || '(not set)'}`);
    
    if (!settings.autoReplyEnabled) {
      console.log('❌ Auto-reply is disabled. Please enable it in email settings.');
      return { processed: 0, replied: 0 };
    }
    
    if (!settings.inboundEmail) {
      console.log('❌ Inbound email not configured. Please set it in email settings.');
      return { processed: 0, replied: 0 };
    }

    // Check if IMAP settings are configured
    console.log(`   IMAP Host: ${settings.imapSettings?.host || '(not set)'}`);
    console.log(`   IMAP Username: ${settings.imapSettings?.username || '(not set)'}`);
    
    if (!settings.imapSettings || !settings.imapSettings.host || !settings.imapSettings.username || !settings.imapSettings.password) {
      console.log('❌ IMAP settings not configured. Please configure IMAP settings in email settings.');
      return { processed: 0, replied: 0 };
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
      return { processed: 0, replied: 0, error: error.message };
    }

    if (emails.length === 0) {
      console.log('📧 No new emails found');
      return { processed: 0, replied: 0 };
    }

    console.log(`📧 Found ${emails.length} new email(s)`);

    let repliedCount = 0;

    // Process each email
    for (const email of emails) {
      try {
        console.log(`\n📧 Processing email:`);
        console.log(`   From: ${email.from}`);
        console.log(`   To: ${email.to}`);
        console.log(`   Subject: ${email.subject}`);
        
        // Check if email is sent to the inbound email address
        // Handle cases where "to" might contain multiple emails, "me" alias, or be in different format
        const emailTo = (email.to || '').toLowerCase();
        const inboundEmailLower = settings.inboundEmail.toLowerCase();
        const inboundEmailDomain = inboundEmailLower.split('@')[1];
        
        // Check if email is sent to inbound address
        // Also check if IMAP username matches (for "me" alias cases)
        const isToInboundEmail = emailTo.includes(inboundEmailLower) || 
                                 emailTo.includes(`<${inboundEmailLower}>`) ||
                                 (settings.imapSettings.username && emailTo.includes(settings.imapSettings.username.toLowerCase()));
        
        // Also check if it's sent to the domain (for catch-all or aliases)
        const isToDomain = inboundEmailDomain && emailTo.includes(`@${inboundEmailDomain}`);

        if (!isToInboundEmail && !isToDomain) {
          console.log(`   ⚠️  Email not sent to inbound address (${settings.inboundEmail}), skipping`);
          console.log(`   Email 'to' field: ${emailTo}`);
          // Mark as processed anyway to avoid reprocessing
          processedEmails.add(email.uid);
          continue;
        }
        
        console.log(`   ✅ Email matches inbound address criteria`);

        // Extract sender email
        const senderEmail = email.from.match(/[\w\.-]+@[\w\.-]+\.\w+/)?.[0] || email.from;
        
        if (!senderEmail || !senderEmail.includes('@')) {
          console.log(`📧 Invalid sender email, skipping: ${email.from}`);
          processedEmails.add(email.uid);
          continue;
        }

        // Send auto-reply
        const autoReplyMessage = settings.autoReplyMessage || 
          'Thank you for contacting us. We have received your email and our team will contact you soon.';

        const replySubject = `Re: ${email.subject}`;

        const emailResult = await sendEmail({
          to: senderEmail,
          subject: replySubject,
          text: autoReplyMessage,
          html: `<p>${autoReplyMessage.replace(/\n/g, '<br>')}</p>`,
          replyTo: settings.inboundEmail
        });

        if (emailResult.success) {
          console.log(`✅ Auto-reply sent to: ${senderEmail}`);
          repliedCount++;
        } else {
          console.error(`❌ Failed to send auto-reply to ${senderEmail}:`, emailResult.error?.message);
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
        // Mark as processed to avoid infinite retry
        processedEmails.add(email.uid);
      }
    }

    console.log(`📧 Processed ${emails.length} email(s), sent ${repliedCount} auto-reply(ies)`);

    return { processed: emails.length, replied: repliedCount };

  } catch (error) {
    console.error('❌ Error in processIncomingEmails:', error.message);
    return { processed: 0, replied: 0, error: error.message };
  }
};

module.exports = {
  processIncomingEmails
};

