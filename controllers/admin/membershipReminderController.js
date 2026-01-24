const { getCustomersWithExpiringMembership } = require("../../services/membershipReminderService");
const { generateMembershipReminderHTML, generateMembershipReminderText } = require("../../templates/membershipReminderEmail");
const sendEmail = require("../../utils/sendEmail");
const MailLog = require("../../models/customer/mail/mailLog");

/**
 * Send membership renewal reminder emails to customers whose membership expires in 10 days
 * Can be used as a standalone function or as an Express route handler
 * @param {Object} req - Express request object (optional)
 * @param {Object} res - Express response object (optional)
 * @returns {Promise<Object>} Summary of sent emails
 */
const sendMembershipReminders = async (req, res) => {
  try {
    console.log("📧 Starting membership renewal reminder email process...");
    
    // Get customers with expiring memberships
    const expiringCustomers = await getCustomersWithExpiringMembership();
    
    if (expiringCustomers.length === 0) {
      console.log("✅ No customers have memberships expiring in 10 days.");
      const result = {
        success: true,
        message: "No memberships expiring in 10 days",
        sent: 0,
        failed: 0,
        total: 0
      };
      
      // If called as HTTP endpoint, send response
      if (res) {
        return res.status(200).json(result);
      }
      return result;
    }

    console.log(`📧 Found ${expiringCustomers.length} customer(s) with memberships expiring in 10 days`);

    let sentCount = 0;
    let failedCount = 0;
    const failedEmails = [];

    // Send email to each customer
    for (const customer of expiringCustomers) {
      try {
        // Generate email content
        const htmlContent = generateMembershipReminderHTML(
          customer.fullName,
          customer.expirationDate,
          customer.durationMonths
        );
        const textContent = generateMembershipReminderText(
          customer.fullName,
          customer.expirationDate,
          customer.durationMonths
        );
        const subject = `⏰ Membership Renewal Reminder - Expires in 10 Days`;

        // Send email
        const emailResult = await sendEmail({
          to: customer.email,
          subject: subject,
          html: htmlContent,
          text: textContent
        });

        if (emailResult.success) {
          sentCount++;
          console.log(`✅ Membership reminder email sent to: ${customer.email} (${customer.fullName})`);

          // Log the email in MailLog (optional - for tracking)
          try {
            await MailLog.create({
              customer: customer.customerId,
              subject: subject,
              body: textContent,
              sentBy: null, // System automated
              sentByEmail: process.env.FROM_EMAIL || 'info@pehlirasam.com',
              deliveryStatus: 'Sent'
            });
          } catch (logError) {
            console.error(`⚠️ Failed to log email for ${customer.email}:`, logError.message);
            // Don't fail the whole process if logging fails
          }
        } else {
          failedCount++;
          failedEmails.push({
            email: customer.email,
            name: customer.fullName,
            error: emailResult.error?.message || "Unknown error"
          });
          console.error(`❌ Failed to send membership reminder to: ${customer.email} - ${emailResult.error?.message || "Unknown error"}`);
        }
      } catch (error) {
        failedCount++;
        failedEmails.push({
          email: customer.email,
          name: customer.fullName,
          error: error.message
        });
        console.error(`❌ Error sending membership reminder to ${customer.email}:`, error.message);
      }
    }

    const summary = {
      success: true,
      message: `Membership reminder process completed`,
      sent: sentCount,
      failed: failedCount,
      total: expiringCustomers.length,
      failedEmails: failedEmails.length > 0 ? failedEmails : undefined
    };

    console.log(`✅ Membership reminder process completed: ${sentCount} sent, ${failedCount} failed out of ${expiringCustomers.length} total`);
    
    // If called as HTTP endpoint, send response
    if (res) {
      return res.status(200).json(summary);
    }
    return summary;
  } catch (error) {
    console.error("❌ Error in sendMembershipReminders:", error);
    const errorResult = {
      success: false,
      message: "Error processing membership reminders",
      error: error.message,
      sent: 0,
      failed: 0,
      total: 0
    };
    
    // If called as HTTP endpoint, send error response
    if (res) {
      return res.status(500).json(errorResult);
    }
    return errorResult;
  }
};

module.exports = {
  sendMembershipReminders
};

