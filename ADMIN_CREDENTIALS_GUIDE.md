# How to Change Admin Login Credentials

There are **three ways** to change the admin email or password:

## Method 1: Using Environment Variables + Update Script (Recommended)

1. **Update your `.env.local` file** (or Vercel environment variables):
   ```env
   ADMIN_EMAIL=admin@example.com          # Current admin email (to find the user)
   ADMIN_PASSWORD=YourNewPassword123!     # New password
   ADMIN_NAME=Admin Name                  # Optional: New name
   ADMIN_NEW_EMAIL=newadmin@example.com   # Optional: New email (if you want to change it)
   MONGODB_URI=your_mongodb_uri
   MONGODB_DB=waste_tracker
   ```

2. **Run the update script**:
   ```bash
   node scripts/update-admin.mjs
   ```

3. **That's it!** The admin credentials are now updated.

## Method 2: Using Environment Variables + Seed Script

1. **Update your `.env.local` file**:
   ```env
   ADMIN_EMAIL=newadmin@example.com       # New email
   ADMIN_PASSWORD=YourNewPassword123!     # New password
   ADMIN_NAME=Admin Name                  # Optional: New name
   MONGODB_URI=your_mongodb_uri
   MONGODB_DB=waste_tracker
   ```

2. **Run the seed script** (it will update if user exists, or create if not):
   ```bash
   node scripts/seed-admin.mjs
   ```

## Method 3: Update in Vercel (Production)

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables

2. **Update the environment variables**:
   - `ADMIN_EMAIL`: Set to the current admin email (to find the user)
   - `ADMIN_PASSWORD`: Set to your new password
   - `ADMIN_NAME`: (Optional) Set to new name
   - `ADMIN_NEW_EMAIL`: (Optional) Set to new email if you want to change it

3. **Run the update script locally** (with Vercel env vars) or via Vercel CLI:
   ```bash
   # Install Vercel CLI if needed
   npm i -g vercel
   
   # Pull environment variables
   vercel env pull .env.local
   
   # Run update script
   node scripts/update-admin.mjs
   ```

   **OR** connect to your MongoDB database directly and update manually (see Method 4).

## Method 4: Manual MongoDB Update (Advanced)

1. **Connect to your MongoDB database** (using MongoDB Compass, MongoDB Atlas UI, or `mongosh`)

2. **Navigate to the `users` collection** in the `waste_tracker` database

3. **Find the admin user**:
   ```javascript
   db.users.findOne({ role: 'admin' })
   ```

4. **Update the user**:
   ```javascript
   // To update password only
   const bcrypt = require('bcryptjs')
   const hashedPassword = await bcrypt.hash('YourNewPassword123!', 12)
   
   db.users.updateOne(
     { email: 'admin@example.com', role: 'admin' },
     { 
       $set: { 
         password: hashedPassword,
         updatedAt: new Date()
       }
     }
   )
   
   // To update email
   db.users.updateOne(
     { email: 'old@example.com', role: 'admin' },
     { 
       $set: { 
         email: 'new@example.com',
         updatedAt: new Date()
       }
     }
   )
   ```

## Quick Reference

### Local Development
```bash
# Update .env.local with new credentials
# Then run:
node scripts/update-admin.mjs
```

### Production (Vercel)
1. Update environment variables in Vercel dashboard
2. Run update script locally with Vercel env vars, OR
3. Use MongoDB Atlas UI to update directly

## Notes

- **Password hashing**: Passwords are automatically hashed using bcryptjs (12 rounds)
- **Email case**: Emails are stored in lowercase for consistency
- **Security**: Never commit `.env.local` or expose admin credentials
- **Multiple admins**: You can have multiple admin users - just run the script with different emails

## Troubleshooting

- **"Admin user not found"**: Make sure `ADMIN_EMAIL` matches the current admin email in the database
- **"Missing MONGODB_URI"**: Ensure your `.env.local` file has the correct MongoDB connection string
- **"Authentication failed"**: After updating, wait a few seconds and try logging in again (session may need to refresh)

