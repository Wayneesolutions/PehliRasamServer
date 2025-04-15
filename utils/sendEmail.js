const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async ({ to, subject, text = '', html = '', attachments = [] }) => {
    // Basic validation
    if (!to || !subject || (!text && !html)) {
        return {
            success: false,
            error: new Error('Missing required email fields: "to", "subject", and either "text" or "html".')
        };
    }

    const msg = {
        to,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject,
        text,
        html,
        attachments,
    };

    try {
        const response = await sgMail.send(msg);
        console.log('Email sent:', subject, '→', to);
        return { success: true, response };
    } catch (error) {
        const errorDetails = error?.response?.body?.errors || error.message || error;
        console.error('SendGrid Error:', errorDetails);
        return { success: false, error: errorDetails };
    }
};

module.exports = sendEmail;
