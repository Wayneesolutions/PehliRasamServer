const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMPT_HOST || 'smtp.gmail.com',
    port: 587,
    secure: false, // true for port 465, false for 587
    auth: {
        user: process.env.SMPT_USERNAME || 'knowthehiccup@gmail.com',
        pass: process.env.SMPT_PASSWORD || 'Galaxy!-',
    },
});

const sendEmail = async ({ to, subject, text = '', html = '', attachments = [] }) => {
    if (!to || !subject || (!text && !html)) {
        return {
            success: false,
            error: new Error('Missing required email fields: "to", "subject", and either "text" or "html".')
        };
    }

    const mailOptions = {
        from: `"Real Estate" <${process.env.SMPT_USERNAME}>`,
        to,
        subject,
        text,
        html,
        attachments, // [{ filename, path, contentType }]
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', subject, '→', to);
        return { success: true, response: info };
    } catch (error) {
        console.error('Nodemailer Error:', error);
        return { success: false, error };
    }
};

module.exports = sendEmail;
