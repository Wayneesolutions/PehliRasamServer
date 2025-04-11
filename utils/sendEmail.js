const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);


const sendEmail = async ({ to, subject, text, html, attachments = [] }) => {
    const msg = {
        to,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject,
        text,
        html,
        attachments
    };

    try {
        const response = await sgMail.send(msg);
        return { success: true, response };
    } catch (error) {
        console.error('SendGrid Error:', error?.response?.body || error);
        return { success: false, error };
    }
};

module.exports = sendEmail;
