const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMPT_HOST || 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.SMPT_USERNAME || 'knowthehiccup@gmail.com',
        pass: process.env.SMPT_PASSWORD || 'yerxvspltccderba',
    },
});
transporter.verify(function (error, success) {
  if (error) {
    console.log('SMTP connection error:', error);
  } else {
    console.log('SMTP is ready to send messages');
  }
});

const sendEmail = async ({ to, subject, html = '',text = '', attachments = [] }) => {
    console.log('to ====',to,'subject ==== ',subject,'html====  ',html,'text === ',text,'attachments === ',attachments)
    if (!to || !subject || !text || !html) {
        return {
            success: false,
            error: new Error('Missing required email fields: "to", "subject", and "html".')
        };
    }

    const mailOptions = {
        from: `"Pehli Rasam" <${process.env.FROM_EMAIL}>`,
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
