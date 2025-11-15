# SMTP Configuration Guide

## How It Works

The code automatically selects the correct SMTP configuration based on `NODE_ENV`:

- **Development** (`NODE_ENV=development`): Uses `SMTP_*_DEV` variables or falls back to `EMAIL_USER`/`EMAIL_PASS`
- **Production** (`NODE_ENV=production`): Uses `SMTP_*` variables only

**No mixing of variables** - each environment uses its own set of variables.

---

## Development Environment (.env)

### Option 1: Use EMAIL_USER and EMAIL_PASS (Recommended)

```env
NODE_ENV=development

# Development SMTP (Gmail)
EMAIL_USER=knowthehiccup@gmail.com
EMAIL_PASS=your_gmail_app_password_here

# Optional: Development-specific FROM email
FROM_EMAIL_DEV=knowthehiccup@gmail.com
```

### Option 2: Use SMTP_*_DEV variables

```env
NODE_ENV=development

# Development SMTP (Gmail)
SMTP_HOST_DEV=smtp.gmail.com
SMTP_PORT_DEV=465
SMTP_SECURE_DEV=true
SMTP_USERNAME_DEV=knowthehiccup@gmail.com
SMTP_PASSWORD_DEV=your_gmail_app_password_here
FROM_EMAIL_DEV=knowthehiccup@gmail.com
```

### Priority Order (Development):

1. `SMTP_HOST_DEV`, `SMTP_PORT_DEV`, `SMTP_SECURE_DEV`, `SMTP_USERNAME_DEV`, `SMTP_PASSWORD_DEV`
2. Falls back to: `EMAIL_USER`, `EMAIL_PASS`
3. Defaults: `smtp.gmail.com`, port `465`, `secure=true`

### Gmail Setup:

1. Enable 2-Step Verification: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Select "Mail" and generate a 16-character password
4. Use that password (no spaces) as `EMAIL_PASS` or `SMTP_PASSWORD_DEV`

---

## Production Environment (.env)

### Required Variables:

```env
NODE_ENV=production

# Production SMTP (Hosting Provider)
SMTP_HOST=mail.pehlirasam.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=info@pehlirasam.com
SMTP_PASSWORD=Aahaanveer@4may22mamu
FROM_EMAIL=info@pehlirasam.com
```

### Alternative Port (if 587 doesn't work):

```env
SMTP_PORT=465
SMTP_SECURE=true
```

### Priority Order (Production):

1. **ONLY** uses: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USERNAME`, `SMTP_PASSWORD`
2. Does **NOT** use `EMAIL_USER`, `EMAIL_PASS`, or `SMTP_*_DEV` variables
3. Defaults: port `587`, `secure=false` (if not specified)

---

## Variable Reference

### Development Variables (NODE_ENV=development):

| Variable | Required | Fallback | Default |
|----------|----------|----------|---------|
| `SMTP_HOST_DEV` | No | `EMAIL_USER` | `smtp.gmail.com` |
| `SMTP_PORT_DEV` | No | - | `465` |
| `SMTP_SECURE_DEV` | No | - | `true` |
| `SMTP_USERNAME_DEV` | No | `EMAIL_USER` | - |
| `SMTP_PASSWORD_DEV` | No | `EMAIL_PASS` | - |
| `FROM_EMAIL_DEV` | No | `EMAIL_USER` | `SMTP_USERNAME_DEV` |
| `EMAIL_USER` | Yes* | - | - |
| `EMAIL_PASS` | Yes* | - | - |

*Required if `SMTP_*_DEV` variables are not set

### Production Variables (NODE_ENV=production):

| Variable | Required | Default |
|----------|----------|---------|
| `SMTP_HOST` | Yes | `smtp.gmail.com` |
| `SMTP_PORT` | No | `587` |
| `SMTP_SECURE` | No | `false` |
| `SMTP_USERNAME` | Yes | - |
| `SMTP_PASSWORD` | Yes | - |
| `FROM_EMAIL` | No | `SMTP_USERNAME` |

---

## Quick Setup

### Development (.env):

```env
NODE_ENV=development
EMAIL_USER=knowthehiccup@gmail.com
EMAIL_PASS=your_gmail_app_password
```

### Production (.env):

```env
NODE_ENV=production
SMTP_HOST=mail.pehlirasam.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=info@pehlirasam.com
SMTP_PASSWORD=Aahaanveer@4may22mamu
FROM_EMAIL=info@pehlirasam.com
```

---

## Verification

After setting up, check the logs:

### Development:
```
📧 SMTP Config [DEV]: Host=smtp.gmail.com, Port=465, Secure=true, User=knowthehiccup@gmail.com
✅ SMTP is ready to send messages
```

### Production:
```
📧 SMTP Config [PROD]: Host=mail.pehlirasam.com, Port=587, Secure=false, User=info@pehlirasam.com
✅ SMTP is ready to send messages
```

---

## Troubleshooting

### Development Issues:

1. **Authentication Error**: 
   - Make sure you're using an App Password (not regular password)
   - Verify 2-Step Verification is enabled

2. **Connection Error**:
   - Check `EMAIL_USER` and `EMAIL_PASS` are set correctly
   - Verify Gmail App Password is correct

### Production Issues:

1. **Authentication Error**:
   - Verify `SMTP_USERNAME` and `SMTP_PASSWORD` are correct
   - Check password has no extra spaces
   - Try logging into webmail with the same credentials

2. **Connection Error**:
   - Try port `465` with `SMTP_SECURE=true` if `587` doesn't work
   - Check hosting provider's SMTP documentation
   - Verify firewall allows outbound connections

---

## Summary

- **Development**: Uses `SMTP_*_DEV` or `EMAIL_USER`/`EMAIL_PASS` (Gmail)
- **Production**: Uses `SMTP_*` variables only (Hosting Provider)
- **No mixing**: Each environment uses its own variables
- **Automatic**: Code selects the correct variables based on `NODE_ENV`

