/**
 * Generate birthday email HTML template
 * @param {string} customerName - Customer's full name
 * @returns {string} HTML email content
 */
const generateBirthdayEmailHTML = (customerName) => {
  const firstName = customerName.split(' ')[0] || customerName;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Happy Birthday!</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: #ffffff;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #d32f2f;
            margin: 0;
            font-size: 28px;
        }
        .content {
            margin-bottom: 30px;
        }
        .content p {
            font-size: 16px;
            margin-bottom: 15px;
        }
        .highlight {
            color: #d32f2f;
            font-weight: bold;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
        }
        .signature {
            margin-top: 20px;
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Happy Birthday! 🎉</h1>
        </div>
        <div class="content">
            <p>Dear <span class="highlight">${firstName}</span>,</p>
            <p>On this special day, we at <strong>Pehli Rasam</strong> want to wish you a very <span class="highlight">Happy Birthday!</span></p>
            <p>We hope your special day brings you lots of happiness, love, and joy. May this new year of your life be filled with wonderful moments and beautiful memories.</p>
            <p>Thank you for being a valued member of our community. We are grateful to have you with us.</p>
            <p>Once again, <span class="highlight">Happy Birthday!</span> May all your dreams and wishes come true.</p>
        </div>
        <div class="footer">
            <p>Warm regards,<br>
            <strong>The Pehli Rasam Team</strong></p>
            <p class="signature">We're here to help you find your perfect match!</p>
        </div>
    </div>
</body>
</html>
  `;
};

/**
 * Generate birthday email plain text version
 * @param {string} customerName - Customer's full name
 * @returns {string} Plain text email content
 */
const generateBirthdayEmailText = (customerName) => {
  const firstName = customerName.split(' ')[0] || customerName;
  
  return `
Happy Birthday!

Dear ${firstName},

On this special day, we at Pehli Rasam want to wish you a very Happy Birthday!

We hope your special day brings you lots of happiness, love, and joy. May this new year of your life be filled with wonderful moments and beautiful memories.

Thank you for being a valued member of our community. We are grateful to have you with us.

Once again, Happy Birthday! May all your dreams and wishes come true.

Warm regards,
The Pehli Rasam Team

We're here to help you find your perfect match!
  `;
};

module.exports = {
  generateBirthdayEmailHTML,
  generateBirthdayEmailText
};

