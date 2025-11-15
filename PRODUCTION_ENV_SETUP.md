# Production Environment Setup Guide

## How It Works

The code automatically detects the environment:
- **Development** (`NODE_ENV=development`): Uses Gmail SMTP (`EMAIL_USER`, `EMAIL_PASS`)
- **Production** (`NODE_ENV=production`): Uses hosting provider SMTP (`SMTP_HOST`, `SMTP_USERNAME`, `SMTP_PASSWORD`)

## Production .env File Configuration

On your production server (`/home/azureuser/var/www/PehliRasamServer/.env`), make sure you have:

```env
# Server Configuration
PORT=8098
NODE_ENV=production
BASE_URL=https://pehlirasam.wayneesolutions.com
PROD_URL=https://pehlirasam.wayneesolutions.com/be/

# Database Configuration
DB=mongodb+srv://santwayne123:WAyne123@cluster0.hdya7.mongodb.net/pehli_rasam?retryWrites=true&w=majority&appName=pehli_rasam
DB1=mongodb://localhost:27017/pehli_rasam

# JWT Configuration
JWT_ACCESS_TOKEN=$2y$12$ioeNXcYkkV0hxYifmhPeqOtoqj1J6RWP/b7IJtdgTYnUn9y8hXUuS
JWT_REFRESH_TOKEN=$2y$10$oJEPb4r7y.UF3ctK1B0j.epCSSoACWdZd81odmVqtZH7sHhu/A0Ce
COOKIE_EXPIRES_TIME=7

# Azure Blob Storage Configuration
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=pehlirasamstorage;AccountKey=ntDHMRofxC6Be/tVfjzjOWOUI6IZA3twMWA7JyLzh0zke+w9vyveEW5pUapAy8Fp6oD54TaXvP+t+ASt2dWuRA==;EndpointSuffix=core.windows.net
AZURE_STORAGE_CONTAINER_NAME=pehlirasamstorage

# Production SMTP Configuration (Hosting Provider)
# These are REQUIRED for production
SMTP_HOST=mail.pehlirasam.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=info@pehlirasam.com
SMTP_PASSWORD=Aahaanveer@4may22mamu
FROM_EMAIL=info@pehlirasam.com

# Alternative: If port 587 doesn't work, try:
# SMTP_PORT=465
# SMTP_SECURE=true

# Application Links
LINK=https://pehlirasam.wayneesolutions.com
```

## Important Notes for Production

### 1. NODE_ENV
- **Must be set to `production`** in production
- Your `ecosystem.config.js` already sets this: `NODE_ENV: 'production'`
- So you can either:
  - Set it in `.env`: `NODE_ENV=production`
  - OR rely on `ecosystem.config.js` (it will override)

### 2. SMTP Settings (REQUIRED)
For production, these variables are **required**:
- `SMTP_HOST=mail.pehlirasam.com`
- `SMTP_PORT=587` (or `465`)
- `SMTP_SECURE=false` (or `true` if using port 465)
- `SMTP_USERNAME=info@pehlirasam.com`
- `SMTP_PASSWORD=Aahaanveer@4may22mamu`
- `FROM_EMAIL=info@pehlirasam.com`

### 3. Port Configuration
Most hosting providers use:
- **Port 587** with `SMTP_SECURE=false` (STARTTLS) - **Most Common**
- **Port 465** with `SMTP_SECURE=true` (SSL) - Alternative

If port 587 doesn't work, try port 465.

### 4. Gmail Credentials (NOT NEEDED IN PRODUCTION)
- `EMAIL_USER` and `EMAIL_PASS` are **only used in development**
- You can remove them from production `.env` or leave them (they won't be used)

## Steps to Deploy to Production

1. **SSH into your production server:**
   ```bash
   ssh azureuser@your-server-ip
   ```

2. **Navigate to your project directory:**
   ```bash
   cd ~/var/www/PehliRasamServer
   ```

3. **Edit the `.env` file:**
   ```bash
   nano .env
   ```

4. **Make sure you have:**
   - `NODE_ENV=production` (or rely on ecosystem.config.js)
   - All SMTP_* variables set correctly
   - Correct `SMTP_PASSWORD` (the one that works for your hosting provider)

5. **Save and exit** (Ctrl+X, Y, Enter in nano)

6. **Restart PM2:**
   ```bash
   pm2 restart 0
   # or
   pm2 restart PehliRasamBackend
   ```

7. **Check the logs:**
   ```bash
   pm2 logs 0 --lines 30
   ```

8. **You should see:**
   ```
   📧 SMTP Config [PROD]: Host=mail.pehlirasam.com, Port=587, Secure=false, User=info@pehlirasam.com, PasswordLength=18
   ✅ SMTP is ready to send messages
   ```

## Troubleshooting Production SMTP

If you see authentication errors in production:

1. **Verify the password is correct:**
   - Try logging into webmail with `info@pehlirasam.com` and the password
   - Make sure the password in `.env` matches exactly

2. **Try different port:**
   - If port 587 doesn't work, try port 465:
     ```env
     SMTP_PORT=465
     SMTP_SECURE=true
     ```

3. **Check hosting provider documentation:**
   - Look for SMTP settings in your hosting control panel
   - Contact your hosting provider for correct SMTP settings

4. **Verify firewall:**
   - Make sure your server can make outbound connections on ports 587 or 465

5. **Check email account status:**
   - Make sure the email account `info@pehlirasam.com` is active
   - Verify it's not locked or suspended

## Summary

- **Development**: Uses Gmail automatically (EMAIL_USER, EMAIL_PASS)
- **Production**: Uses hosting provider SMTP automatically (SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD)
- **No code changes needed** - just ensure correct `.env` variables in each environment

