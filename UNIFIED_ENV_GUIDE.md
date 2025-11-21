# Unified .env File Guide

## Overview

You can now use the **SAME `.env` file** for both local development and production! The code automatically detects the environment and uses the appropriate settings.

## How It Works

### Automatic Detection

The code automatically detects if you're running locally or on production:

**Local Detection (uses Gmail SMTP):**
- ✅ `EMAIL_USER` is set in `.env`
- ✅ `NODE_ENV=development`
- ✅ `LOCAL_DEV=true`

**Production Detection (uses hosting provider SMTP):**
- ✅ `EMAIL_USER` is NOT set
- ✅ Running on production server
- ✅ `NODE_ENV=production` (without EMAIL_USER)

### Database Selection

- **If `NODE_ENV=production`**: Uses `DB` (production MongoDB)
- **If `NODE_ENV=development`**: Uses `DB1` (local MongoDB)

### SMTP Selection

- **If `EMAIL_USER` exists**: Uses Gmail SMTP (`EMAIL_USER`, `EMAIL_PASS`)
- **If `EMAIL_USER` does NOT exist**: Uses production SMTP (`SMTP_HOST`, `SMTP_USERNAME`, `SMTP_PASSWORD`)

---

## Unified .env File Template

```env
# ============================================
# SERVER CONFIGURATION
# ============================================
PORT=8098
NODE_ENV=production
BASE_URL=http://localhost:8098
PROD_URL=https://pehlirasam.wayneesolutions.com/be/

# ============================================
# DATABASE CONFIGURATION
# ============================================
# Production MongoDB
DB=mongodb+srv://santwayne123:WAyne123@cluster0.hdya7.mongodb.net/pehli_rasam?retryWrites=true&w=majority&appName=pehli_rasam
# Local MongoDB (optional, used when NODE_ENV=development)
DB1=mongodb://localhost:27017/pehli_rasam

# ============================================
# JWT CONFIGURATION
# ============================================
JWT_ACCESS_TOKEN=$2y$12$ioeNXcYkkV0hxYifmhPeqOtoqj1J6RWP/b7IJtdgTYnUn9y8hXUuS
JWT_REFRESH_TOKEN=$2y$10$oJEPb4r7y.UF3ctK1B0j.epCSSoACWdZd81odmVqtZH7sHhu/A0Ce
COOKIE_EXPIRES_TIME=7

# ============================================
# AZURE BLOB STORAGE
# ============================================
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=pehlirasamstorage;AccountKey=ntDHMRofxC6Be/tVfjzjOWOUI6IZA3twMWA7JyLzh0zke+w9vyveEW5pUapAy8Fp6oD54TaXvP+t+ASt2dWuRA==;EndpointSuffix=core.windows.net
AZURE_STORAGE_CONTAINER_NAME=pehlirasamstorage

# ============================================
# LOCAL SMTP (Gmail) - Used when EMAIL_USER is present
# ============================================
EMAIL_USER=knowthehiccup@gmail.com
EMAIL_PASS=your_gmail_app_password_here

# ============================================
# PRODUCTION SMTP (Hosting Provider) - Used when EMAIL_USER is NOT present
# ============================================
SMTP_HOST=mail.pehlirasam.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=info@pehlirasam.com
SMTP_PASSWORD=Aahaanveer@4may22mamu
FROM_EMAIL=info@pehlirasam.com

# ============================================
# APPLICATION LINKS
# ============================================
LINK=http://localhost:8098
```

---

## Usage Scenarios

### Scenario 1: Local Development with Production Database

**Your `.env` file:**
```env
NODE_ENV=production
DB=mongodb+srv://...production...
EMAIL_USER=knowthehiccup@gmail.com
EMAIL_PASS=your_gmail_app_password
SMTP_HOST=mail.pehlirasam.com
SMTP_USERNAME=info@pehlirasam.com
SMTP_PASSWORD=Aahaanveer@4may22mamu
```

**Result:**
- ✅ Database: Production MongoDB (because `NODE_ENV=production`)
- ✅ SMTP: Gmail (because `EMAIL_USER` exists)
- ✅ Login: Works with production credentials

### Scenario 2: Production Server

**Your `.env` file (same file, just remove EMAIL_USER on server):**
```env
NODE_ENV=production
DB=mongodb+srv://...production...
# EMAIL_USER=knowthehiccup@gmail.com  <-- Comment out or remove
# EMAIL_PASS=your_gmail_app_password  <-- Comment out or remove
SMTP_HOST=mail.pehlirasam.com
SMTP_USERNAME=info@pehlirasam.com
SMTP_PASSWORD=Aahaanveer@4may22mamu
```

**Result:**
- ✅ Database: Production MongoDB
- ✅ SMTP: Hosting provider (because `EMAIL_USER` is NOT set)
- ✅ Login: Works with production credentials

---

## Quick Setup

### For Local Development:

1. **Keep `EMAIL_USER` and `EMAIL_PASS` in your `.env`**
2. Set `NODE_ENV=production` if you want to use production database
3. The code will automatically use Gmail SMTP

### For Production Server:

1. **Remove or comment out `EMAIL_USER` and `EMAIL_PASS`**
2. Keep `SMTP_HOST`, `SMTP_USERNAME`, `SMTP_PASSWORD` set
3. The code will automatically use hosting provider SMTP

---

## Benefits

✅ **One `.env` file** works for both environments  
✅ **Automatic detection** - no manual switching needed  
✅ **Use production DB locally** - just set `NODE_ENV=production` and keep `EMAIL_USER`  
✅ **Easy deployment** - same file, just remove `EMAIL_USER` on server  
✅ **No code changes** - works automatically  

---

## Verification

After starting your server, check the logs:

### Local (with EMAIL_USER):
```
📧 SMTP Config [LOCAL]: Host=smtp.gmail.com, Port=465, Secure=true, User=knowthehiccup@gmail.com
✅ SMTP is ready to send messages
mongoDB connected to production ✅
```

### Production (without EMAIL_USER):
```
📧 SMTP Config [PROD]: Host=mail.pehlirasam.com, Port=587, Secure=false, User=info@pehlirasam.com
✅ SMTP is ready to send messages
mongoDB connected to production ✅
```

---

## Troubleshooting

### Local not using Gmail SMTP?

- ✅ Make sure `EMAIL_USER` is set in `.env`
- ✅ Check logs show `[LOCAL]` not `[PROD]`
- ✅ Restart your server after changing `.env`

### Production not using hosting SMTP?

- ✅ Make sure `EMAIL_USER` is NOT set (remove or comment it out)
- ✅ Verify `SMTP_HOST`, `SMTP_USERNAME`, `SMTP_PASSWORD` are set
- ✅ Check logs show `[PROD]` not `[LOCAL]`

---

## Summary

**The key is `EMAIL_USER`:**
- **Present** = Local development (uses Gmail SMTP)
- **Not present** = Production server (uses hosting provider SMTP)

**Database selection:**
- Controlled by `NODE_ENV` (production = `DB`, development = `DB1`)

**You can use the same `.env` file everywhere!** 🎉

