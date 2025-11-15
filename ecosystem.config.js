module.exports = {
  apps: [
    {
      name: "PehliRasamBackend",
      script: "server.js",
      env: {
        NODE_ENV: "production",
        SMTP_HOST: "mail.pehlirasam.com",
        SMTP_PORT: 587,
        SMTP_SECURE: false,
        SMTP_USERNAME: "info@pehlirasam.com",
        SMTP_PASSWORD: "Aahaanveer@4may22mamu"
      }
    }
  ]
};
