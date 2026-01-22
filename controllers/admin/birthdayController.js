const { getCustomersWithBirthdayToday } = require("../../services/birthdayService");
const { generateBirthdayEmailHTML, generateBirthdayEmailText } = require("../../templates/birthdayEmail");
const sendEmail = require("../../utils/sendEmail");

/**
 * Send birthday reminder emails to all customers whose birthday is today
 * Can be used as a standalone function or as an Express route handler
 * @param {Object} req - Express request object (optional)
 * @param {Object} res - Express response object (optional)
 * @returns {Promise<Object>} Summary of sent emails
 */
const sendBirthdayReminders = async (req, res) => {
  try {
    console.log("🎂 Starting birthday reminder email process...");
    
    // Get customers with birthdays today
    const customersWithBirthday = await getCustomersWithBirthdayToday();
    
    if (customersWithBirthday.length === 0) {
      console.log("✅ No customers have birthdays today.");
      const result = {
        success: true,
        message: "No customers have birthdays today",
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

    console.log(`📧 Found ${customersWithBirthday.length} customer(s) with birthdays today`);

    let sentCount = 0;
    let failedCount = 0;
    const failedEmails = [];

    // Send email to each customer
    for (const customer of customersWithBirthday) {
      try {
        // Generate email content
        const htmlContent = generateBirthdayEmailHTML(customer.fullName);
        const textContent = generateBirthdayEmailText(customer.fullName);
        const subject = `🎉 Happy Birthday ${customer.firstName || 'Valued Client'}! 🎉`;

        // Send email
        const emailResult = await sendEmail({
          to: customer.email,
          subject: subject,
          html: htmlContent,
          text: textContent
        });

        if (emailResult.success) {
          sentCount++;
          console.log(`✅ Birthday email sent to: ${customer.email} (${customer.fullName})`);
        } else {
          failedCount++;
          failedEmails.push({
            email: customer.email,
            name: customer.fullName,
            error: emailResult.error?.message || "Unknown error"
          });
          console.error(`❌ Failed to send birthday email to: ${customer.email} - ${emailResult.error?.message || "Unknown error"}`);
        }
      } catch (error) {
        failedCount++;
        failedEmails.push({
          email: customer.email,
          name: customer.fullName,
          error: error.message
        });
        console.error(`❌ Error sending birthday email to ${customer.email}:`, error.message);
      }
    }

    const summary = {
      success: true,
      message: `Birthday reminder process completed`,
      sent: sentCount,
      failed: failedCount,
      total: customersWithBirthday.length,
      failedEmails: failedEmails.length > 0 ? failedEmails : undefined
    };

    console.log(`✅ Birthday reminder process completed: ${sentCount} sent, ${failedCount} failed out of ${customersWithBirthday.length} total`);
    
    // If called as HTTP endpoint, send response
    if (res) {
      return res.status(200).json(summary);
    }
    return summary;
  } catch (error) {
    console.error("❌ Error in sendBirthdayReminders:", error);
    const errorResult = {
      success: false,
      message: "Error processing birthday reminders",
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
  sendBirthdayReminders
};

