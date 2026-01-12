# Environment Variables Guide

## Required Environment Variables

### For Your App (Set in .env.local and Vercel):

1. **JWT_SECRET**
   - Purpose: Used to sign/verify JWT tokens for your app's authentication
   - Generate: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
   - Location: `.env.local` (local) and Vercel Dashboard → Environment Variables (production)
   - Example: `JWT_SECRET=abc123def456...` (64+ character random string)

2. **SUPABASE_URL**
   - Purpose: Your Supabase project URL
   - Get from: Supabase Dashboard → Settings → API → Project URL
   - Example: `SUPABASE_URL=https://xyz123.supabase.co`

3. **SUPABASE_ANON_KEY**
   - Purpose: Your Supabase anonymous/public key
   - Get from: Supabase Dashboard → Settings → API → anon public key
   - Example: `SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## What You DON'T Need:

- ❌ Supabase JWT Secret (service_role key) - We don't use Supabase's built-in auth
- ❌ Supabase Service Role Key - Not needed for this app

## Important Notes:

1. **JWT_SECRET** and **Supabase JWT Secret** are DIFFERENT:
   - JWT_SECRET = For YOUR app's authentication
   - Supabase JWT Secret = For Supabase's internal auth (we don't use it)

2. They do NOT need to match - they serve different purposes

3. Make sure JWT_SECRET is the SAME in:
   - `.env.local` (for local development)
   - Vercel Environment Variables (for production)

## Setting Up in Vercel:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add these 3 variables for Production, Preview, and Development:
   - `JWT_SECRET` (your generated secret)
   - `SUPABASE_URL` (from Supabase)
   - `SUPABASE_ANON_KEY` (from Supabase)
3. Redeploy after adding variables
