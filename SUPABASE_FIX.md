# Fixing Supabase Registration and Login Issues

## Problem
If account creation and login are not working, it's likely due to Row Level Security (RLS) policies blocking database operations.

## Quick Fix (Recommended for Development)

### Option 1: Disable RLS Temporarily (Easiest)

Run this SQL in your Supabase SQL Editor:

```sql
-- Disable RLS on all tables (for development only)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE clinics DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE followups DISABLE ROW LEVEL SECURITY;
ALTER TABLE slots DISABLE ROW LEVEL SECURITY;
```

**⚠️ Warning:** Only do this for development/testing. For production, use proper RLS policies.

### Option 2: Use Fixed RLS Policies

Run the SQL from `db/rls_policies_fixed.sql` in your Supabase SQL Editor. This file contains policies that work with custom JWT authentication.

**Note:** The script automatically drops existing policies before creating new ones, so it's safe to run multiple times if you get "policy already exists" errors.

## Steps to Fix

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to SQL Editor

2. **Check Current RLS Status**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('users', 'clinics', 'appointments', 'followups', 'slots');
   ```

3. **Apply Fix**
   - Copy and paste the SQL from `db/rls_policies_fixed.sql`
   - OR disable RLS using Option 1 above
   - Click "Run"

4. **Test the Connection**
   - Visit: `https://your-app.vercel.app/api/test-db`
   - Should return: `{"status":"success","message":"Database connection successful"}`

5. **Try Registration Again**
   - Go to your signup page
   - Create a new account
   - Should redirect to dashboard after successful registration

## Verify Environment Variables

Make sure these are set in Vercel (Settings → Environment Variables):

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anon/public key
- `JWT_SECRET` - A random secret string

## Test Endpoints

1. **Health Check**: `GET /api/health`
   - Should show `supabase_configured: true`

2. **Database Test**: `GET /api/test-db`
   - Should return success if connection works

3. **Registration**: `POST /api/auth/register`
   - Should create user and return token

4. **Login**: `POST /api/auth/login`
   - Should authenticate and return token

## Common Errors

### "Database permission error. Please check Row Level Security policies"
- **Solution**: Disable RLS or use fixed policies from `rls_policies_fixed.sql`

### "Database not configured"
- **Solution**: Check environment variables in Vercel dashboard

### "Email already registered"
- **Solution**: This is normal - try a different email or delete the user from Supabase dashboard

### "Request timed out"
- **Solution**: Check Supabase project status (not paused), verify network connectivity

## After Fixing

1. ✅ Registration should work and save to Supabase
2. ✅ Login should work and authenticate users
3. ✅ Users should be redirected to dashboard after login/signup
4. ✅ User data should persist in Supabase `users` table

## Verify Data in Supabase

1. Go to Supabase Dashboard → Table Editor → `users`
2. You should see created users with:
   - `id` (UUID)
   - `email`
   - `password` (hashed)
   - `name`
   - `role` (patient or hospital)
   - `phone`
   - `created_at`
