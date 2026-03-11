/**
 * Cleanup script to delete bounce-back emails from InboxMessage collection
 * Run with: node scripts/cleanupBounceEmails.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const InboxMessage = require('../models/customer/mail/inboxMessage');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const dbUrl = process.env.NODE_ENV === 'production' ? process.env.DB : (process.env.DB1 || process.env.DB);
    await mongoose.connect(dbUrl);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Detect if an email is a bounce-back
const isBounceBack = (email) => {
  const fromLower = (email.from || '').toLowerCase();
  const fromNameLower = (email.fromName || '').toLowerCase();
  const subjectLower = (email.subject || '').toLowerCase();
  const bodyLower = ((email.textBody || '') + ' ' + (email.body || '')).toLowerCase();
  
  return (
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
    bodyLower.includes('diagnostic-code')
  );
};

const cleanupBounceEmails = async () => {
  try {
    await connectDB();
    
    console.log('\n🔍 Searching for bounce-back emails...\n');
    
    // Find all non-deleted inbox messages
    const allMessages = await InboxMessage.find({ isDeleted: false });
    console.log(`📧 Total inbox messages: ${allMessages.length}`);
    
    const bounceBackEmails = [];
    
    // Check each message
    for (const msg of allMessages) {
      if (isBounceBack(msg)) {
        bounceBackEmails.push({
          _id: msg._id,
          messageId: msg.messageId,
          from: msg.from,
          subject: msg.subject,
          receivedAt: msg.receivedAt
        });
      }
    }
    
    console.log(`\n⚠️  Found ${bounceBackEmails.length} bounce-back email(s):\n`);
    
    if (bounceBackEmails.length > 0) {
      bounceBackEmails.forEach((email, index) => {
        console.log(`${index + 1}. ${email.subject || '(No Subject)'}`);
        console.log(`   From: ${email.from}`);
        console.log(`   Message ID: ${email.messageId}`);
        console.log(`   Received: ${email.receivedAt}`);
        console.log('');
      });
      
      // Delete bounce-back emails
      const idsToDelete = bounceBackEmails.map(e => e._id);
      const deleteResult = await InboxMessage.deleteMany({ _id: { $in: idsToDelete } });
      
      console.log(`\n✅ Successfully deleted ${deleteResult.deletedCount} bounce-back email(s) from database`);
    } else {
      console.log('✅ No bounce-back emails found. Database is clean!');
    }
    
    await mongoose.connection.close();
    console.log('\n✅ Cleanup completed. Database connection closed.');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error during cleanup:', error.message);
    console.error(error.stack);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run cleanup
cleanupBounceEmails();

