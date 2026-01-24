/**
 * Generate HTML content for membership renewal reminder email
 */
const generateMembershipReminderHTML = (customerName, expirationDate, durationMonths) => {
  const formattedDate = new Date(expirationDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
        }
        .container { 
          max-width: 600px; 
          margin: 20px auto; 
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header { 
          background-color: #AE0847; 
          color: white; 
          padding: 30px 20px; 
          text-align: center; 
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .content { 
          padding: 30px 20px; 
          background-color: #ffffff; 
        }
        .content p {
          margin: 15px 0;
          font-size: 16px;
        }
        .highlight {
          background-color: #fff3cd;
          padding: 15px;
          border-left: 4px solid #ffc107;
          margin: 20px 0;
          border-radius: 4px;
        }
        .highlight strong {
          color: #AE0847;
          font-size: 18px;
        }
        .button { 
          display: inline-block; 
          padding: 12px 30px; 
          background-color: #AE0847; 
          color: white; 
          text-decoration: none; 
          border-radius: 5px; 
          margin-top: 20px;
          font-weight: bold;
        }
        .button:hover {
          background-color: #8a0638;
        }
        .footer { 
          text-align: center; 
          padding: 20px; 
          font-size: 12px; 
          color: #666;
          background-color: #f9f9f9;
          border-top: 1px solid #eee;
        }
        .info-box {
          background-color: #e7f3ff;
          padding: 15px;
          border-radius: 4px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Membership Renewal Reminder</h1>
        </div>
        <div class="content">
          <p>Dear ${customerName},</p>
          
          <div class="highlight">
            <p style="margin: 0;">
              This is a friendly reminder that your membership will expire in <strong>10 days</strong> on <strong>${formattedDate}</strong>.
            </p>
          </div>

          <div class="info-box">
            <p style="margin: 0;"><strong>Membership Details:</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Duration: <strong>${durationMonths} ${durationMonths === 1 ? 'Month' : 'Months'}</strong></li>
              <li>Expiration Date: <strong>${formattedDate}</strong></li>
            </ul>
          </div>

          <p>To continue enjoying our services and maintain your profile visibility, please renew your membership before the expiration date.</p>
          
          <p>If you have any questions or need assistance with the renewal process, please don't hesitate to contact our support team.</p>
          
          <p>We value your membership and look forward to continuing to serve you.</p>
          
          <p>Best regards,<br>
          <strong>Pehli Rasam Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated reminder email. Please do not reply to this message.</p>
          <p>If you have any questions, please contact our support team directly.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate plain text content for membership renewal reminder email
 */
const generateMembershipReminderText = (customerName, expirationDate, durationMonths) => {
  const formattedDate = new Date(expirationDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
Dear ${customerName},

This is a friendly reminder that your membership will expire in 10 days on ${formattedDate}.

MEMBERSHIP DETAILS:
- Duration: ${durationMonths} ${durationMonths === 1 ? 'Month' : 'Months'}
- Expiration Date: ${formattedDate}

To continue enjoying our services and maintain your profile visibility, please renew your membership before the expiration date.

If you have any questions or need assistance with the renewal process, please don't hesitate to contact our support team.

We value your membership and look forward to continuing to serve you.

Best regards,
Pehli Rasam Team

---
This is an automated reminder email. Please do not reply to this message.
If you have any questions, please contact our support team directly.
  `.trim();
};

module.exports = {
  generateMembershipReminderHTML,
  generateMembershipReminderText
};

