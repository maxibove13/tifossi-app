# Strapi Admin Authentication Guide

## Overview

This Tifossi backend uses **email/password authentication** for Strapi admin panel access, WITHOUT requiring email configuration (SMTP). This is a pragmatic choice that prioritizes deployment simplicity over password reset convenience.

## Current Configuration

**Authentication Method**: Email + Password only
**Email Plugin**: Conditional (disabled by default)
**Password Reset**: Manual process (no automated emails)

## Why This Approach?

1. **No SMTP Complexity**: Avoids requiring email service setup for deployment
2. **Mobile Users Use Firebase**: App users authenticate via Firebase (Google/Apple Sign-In)
3. **Admin Access Still Secure**: Admins use email/password to access Strapi dashboard
4. **Cost Effective**: No need for email service subscription initially

## Trade-offs

### ✅ Benefits

- Strapi deploys immediately without SMTP configuration
- No external email service dependencies
- Admin login works out-of-the-box
- Can add email functionality later when needed

### ⚠️ Limitations

- **No password reset emails**: Admins who forget passwords need manual reset
- **No email notifications**: Order confirmations must be added separately if needed
- **No automated emails**: Custom email features require SMTP setup first

## Creating Admin Users

### Method 1: Via Strapi Admin Panel (Recommended)

1. Log in as existing admin
2. Go to Settings → Users
3. Click "Create new user"
4. Fill in email, password, name
5. Assign role (Admin, Editor, etc.)

### Method 2: Via CLI (First Admin)

```bash
cd backend/strapi
npm run strapi admin:create-user
```

### Method 3: Via Environment Variables (Initial Setup)

```env
ADMIN_EMAIL=admin@tifossi.com
ADMIN_PASSWORD=SecurePassword123!
ADMIN_FIRSTNAME=Admin
ADMIN_LASTNAME=User
```

## Resetting Forgotten Admin Passwords

### Option 1: Database Reset (Recommended for Production)

**Connect to Render PostgreSQL:**

```bash
# Get DATABASE_URL from Render dashboard
psql $DATABASE_URL
```

**Reset password in database:**

```sql
-- Find admin user
SELECT id, email, username FROM admin_users;

-- Update password (replace with bcrypt hash)
-- Generate hash: node -e "console.log(require('bcryptjs').hashSync('NewPassword123', 10))"
UPDATE admin_users
SET password = '$2a$10$...' -- Insert bcrypt hash here
WHERE email = 'admin@tifossi.com';
```

### Option 2: Create New Admin User

If locked out, create a new admin account:

```bash
cd backend/strapi
npm run strapi admin:create-user -- \
  --email=recovery@tifossi.com \
  --password=TempPassword123! \
  --firstname=Recovery \
  --lastname=Admin
```

### Option 3: Use Render Shell

From Render dashboard:

1. Go to your service → Shell tab
2. Run: `npm run strapi admin:create-user`
3. Follow prompts

## Enabling Email Plugin (Optional)

If you want password reset emails and order confirmation emails:

### 1. Get SMTP Credentials

**Using Gmail:**

- Go to Google Account → Security → 2-Step Verification → App Passwords
- Generate app password
- Use: `smtp.gmail.com:587`

**Using Company Email:**

- Contact your email hosting provider
- Request SMTP server details
- Usually: `mail.yourdomain.com:587`

### 2. Configure Environment Variables

**Add to Render Dashboard:**

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=info@tifossi.com
SMTP_PASSWORD=<app-password>
EMAIL_FROM=info@tifossi.com
EMAIL_REPLY_TO=infotiffosiuy@gmail.com
```

**Or for local development (.env):**

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
```

### 3. Restart Strapi

The email plugin will automatically load when `SMTP_HOST` is detected.

## Security Best Practices

### For Admins:

1. **Use strong passwords**: Minimum 12 characters, mixed case, numbers, symbols
2. **Don't share admin accounts**: Create individual accounts for each admin
3. **Use password manager**: Store credentials securely (LastPass, 1Password, etc.)
4. **Regular access review**: Remove inactive admin accounts

### For Developers:

1. **Secure DATABASE_URL**: Keep PostgreSQL credentials private
2. **Limit admin creation**: Only via secure methods (CLI, admin panel)
3. **Monitor access**: Check admin_users table periodically
4. **Backup admin emails**: Keep list of admin accounts for recovery

## Mobile App Users (Separate System)

**Important**: This guide is ONLY for Strapi admin panel access.

Mobile app users authenticate via:

- **Firebase Auth**: Google Sign-In, Apple Sign-In
- **User data stored in Strapi**: Via Users & Permissions plugin
- **NO password management in Strapi**: Firebase handles all auth

Mobile users **NEVER** log into the Strapi admin panel.

## Testing Email Configuration

After enabling SMTP, test email sending:

```bash
cd backend/strapi
npm run strapi console
```

Then run:

```javascript
await strapi.plugins.email.services.email.send({
  to: 'your-email@example.com',
  subject: 'Test Email',
  text: 'If you receive this, email is working!',
});
```

## Troubleshooting

### "Cannot access admin panel"

- Verify admin user exists in database
- Check password is correct
- Try creating new admin via CLI

### "Forgot password link doesn't work"

- Expected! Email plugin is disabled by default
- Use manual password reset methods above

### "Want to enable password reset emails"

- Follow "Enabling Email Plugin" section
- Requires SMTP credentials
- 5-10 minutes setup time

## Support

For assistance:

- **Admin Access Issues**: Use CLI password reset
- **SMTP Configuration**: Check email provider documentation
- **Database Access**: Render dashboard → Database → Connection info

## Summary

- ✅ Admin authentication works without email
- ⚠️ Password reset is manual process
- 💡 Email can be enabled later with SMTP setup
- 🔐 Mobile users use Firebase (separate system)
