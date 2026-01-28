# Reply-To Multiple Email Addresses Setup

## Overview
This system supports multiple Reply-To email addresses so customers can reply to multiple addresses when they receive emails from your system.

## Configuration

### Step 1: Add Multiple Email Addresses
In Email Settings page (`http://localhost:5173/dashboard/emailsettings`), enter multiple email addresses in the **Reply To Email** field, separated by commas:

```
skrishnadas38@gmail.com, sanusv37@gmail.com
```

or

```
support@pehlirasam.com, contact@pehlirasam.com, info@pehlirasam.com
```

### Step 2: Save Settings
Click "Save Settings" button.

### Step 3: Send Test Email
Use "Send Test Message" to verify the Reply-To configuration.

## How It Works

### Email Header Format
When you configure multiple Reply-To addresses like:
```
email1@example.com, email2@example.com
```

The system sends emails with this header:
```
Reply-To: email1@example.com, email2@example.com
```

### Customer Experience
When customers receive your email and click "Reply" in their email client:

**Gmail:**
- Shows all Reply-To addresses in the "To" field
- Customer can see: `email1@example.com, email2@example.com`

**Outlook:**
- Shows all Reply-To addresses
- May display as: `email1@example.com; email2@example.com`

**Apple Mail:**
- Shows all Reply-To addresses separated by commas
- Customer reply will go to ALL addresses

**Thunderbird:**
- Displays all addresses
- Reply goes to all specified addresses

## Testing

### Send a Test Email
1. Go to Email Settings
2. Add multiple emails in Reply-To field: `email1@gmail.com, email2@gmail.com`
3. Click "Send Test Message"
4. Check the received email
5. Click "Reply" button
6. Verify both email addresses appear in the "To" field

### Verify in Email Client
Open the received email and check:
- Click "Reply" button
- Look at the "To:" field
- Both email addresses should be visible

## Important Notes

### Email Client Differences
Different email clients may display multiple Reply-To addresses differently:
- Some show them comma-separated
- Some show them semicolon-separated
- Some show them as separate chips/tags
- **All of them will send the reply to ALL addresses**

### Format Requirements
- ✅ Use commas to separate emails
- ✅ Spaces after commas are optional (system trims them)
- ✅ Any number of email addresses is supported
- ❌ Don't use semicolons (;)
- ❌ Don't use line breaks

### Valid Examples
```
email1@gmail.com,email2@gmail.com
email1@gmail.com, email2@gmail.com
support@company.com, sales@company.com, info@company.com
```

### Invalid Examples
```
email1@gmail.com;email2@gmail.com     ❌ (semicolon)
email1@gmail.com
email2@gmail.com                       ❌ (line break)
```

## Inbox Tracking

### Which Emails Are Saved to Inbox?
**ONLY emails sent to the Inbound Email address** are saved to the inbox page.

Example Configuration:
- **Reply-To Emails:** `support@pehlirasam.com, contact@pehlirasam.com`
- **Inbound Email:** `inbound@pehlirasam.com`

Results:
- ✅ Email sent to `inbound@pehlirasam.com` → **Saved to inbox** + Auto-reply sent
- ❌ Email sent to `support@pehlirasam.com` → NOT saved to inbox (auto-reply still sent)
- ❌ Email sent to `contact@pehlirasam.com` → NOT saved to inbox (auto-reply still sent)

### Why This Design?
- **Reply-To emails:** For customer convenience (they can reply to multiple addresses)
- **Inbound email:** For tracking and managing customer communications in your dashboard
- This prevents duplicate entries and keeps your inbox clean

## Troubleshooting

### Issue: Customer only sees one email when replying
**Possible Causes:**
1. Email client displays them as a group (they're still all there)
2. Only one email was saved in Reply-To field
3. Browser cache - clear and reload

**Solution:**
1. Check Email Settings page - verify multiple emails are shown
2. Save settings again
3. Send a new test email
4. Check email source/headers (View → Show Original in Gmail)
5. Look for `Reply-To:` header - should show all addresses

### Issue: Reply-To not working
**Check:**
1. Email settings are saved correctly
2. You're sending new emails (not old ones)
3. SMTP is configured properly
4. Check server logs for any errors

### Issue: Commas or spaces in email addresses
**Solution:**
The system automatically:
- Trims whitespace from each email
- Removes empty entries
- Formats them correctly for email headers

## Code Implementation

### Backend: `backend/utils/sendEmail.js`
```javascript
// Handle multiple emails (comma-separated)
if (replyToEmail) {
    const replyToAddresses = replyToEmail
        .split(',')
        .map(email => email.trim())
        .filter(email => email.length > 0);
    
    if (replyToAddresses.length > 0) {
        mailOptions.replyTo = replyToAddresses.join(', ');
    }
}
```

### Frontend: Email Settings UI
Shows visual indicator when multiple emails are detected:
```
✅ Multiple emails detected: email1@example.com • email2@example.com
```

## Support

If you're still having issues:
1. Check the terminal logs when sending emails
2. Look for: `Reply-To addresses (2): email1@example.com, email2@example.com`
3. Verify emails are reaching customers using email headers
4. Test with different email clients

