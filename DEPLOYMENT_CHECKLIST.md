# Deployment Checklist for medcAIr

## Pre-Deployment Checklist

### ✅ Code Ready
- [x] All code fixes applied
- [x] Timeout handling implemented
- [x] Supabase error handling improved
- [x] RLS policies fixed
- [x] API configuration uses relative URLs
- [x] Serverless function wrapper configured
- [x] Vercel configuration file ready

### 📋 Before Deploying

1. **Supabase Setup** (MUST DO FIRST)
   - [ ] Run `db/schema.sql` in Supabase SQL Editor
   - [ ] Run `db/rls_policies_fixed.sql` in Supabase SQL Editor
   - [ ] Verify tables are created: users, clinics, appointments, followups, slots
   - [ ] Test connection: Visit `/api/test-db` after deployment

2. **Environment Variables** (Set in Vercel Dashboard)
   - [ ] `JWT_SECRET` - Generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
   - [ ] `SUPABASE_URL` - From Supabase Dashboard → Settings → API
   - [ ] `SUPABASE_ANON_KEY` - From Supabase Dashboard → Settings → API
   - [ ] Set for: Production, Preview, and Development environments

3. **Git Status**
   - [ ] All changes committed
   - [ ] Code pushed to GitHub repository

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com
   - Sign in with GitHub

2. **Import Project**
   - Click "Add New Project"
   - Select your repository: `Daanveer10/medcAIr`
   - Click "Import"

3. **Configure Project Settings**
   - Framework Preset: **Other** (or leave as default)
   - Root Directory: `./` (default)
   - Build Command: `cd client && npm install && npm run build`
   - Output Directory: `client/build`
   - Install Command: `npm install && cd client && npm install`
   - These should auto-detect from `vercel.json`

4. **Add Environment Variables**
   - Go to **Settings** → **Environment Variables**
   - Add each variable for **Production**, **Preview**, and **Development**:
     ```
     JWT_SECRET=your-generated-secret-here
     SUPABASE_URL=https://your-project.supabase.co
     SUPABASE_ANON_KEY=your-anon-key-here
     ```
   - Click "Save" after each variable

5. **Deploy**
   - Click "Deploy" button
   - Wait for build to complete (usually 2-5 minutes)

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (first time - follow prompts)
vercel

# Set environment variables
vercel env add JWT_SECRET
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY

# Deploy to production
vercel --prod
```

## Post-Deployment Verification

### 1. Test Health Endpoint
Visit: `https://your-app.vercel.app/api/health`
Expected: `{"status":"ok","supabase_configured":true,...}`

### 2. Test Database Connection
Visit: `https://your-app.vercel.app/api/test-db`
Expected: `{"status":"success","message":"Database connection successful"}`

### 3. Test Registration
- Go to: `https://your-app.vercel.app/signup`
- Create a test account
- Should redirect to dashboard
- Check Supabase Dashboard → Table Editor → users (should see new user)

### 4. Test Login
- Go to: `https://your-app.vercel.app/login`
- Login with test account
- Should redirect to dashboard

### 5. Verify Data in Supabase
- Go to Supabase Dashboard → Table Editor
- Check `users` table has your test user
- Verify all fields are populated correctly

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Verify all dependencies are in `package.json`
- Check Node.js version (should be 24.x)

### API Routes Return 404
- Verify `vercel.json` rewrites are correct
- Check `api/server.js` exists and exports handler
- Verify function timeout is set (30 seconds)

### Database Errors
- Verify environment variables are set correctly
- Check Supabase project is active (not paused)
- Verify RLS policies are applied
- Test connection with `/api/test-db` endpoint

### Registration/Login Not Working
- Check Supabase RLS policies are applied
- Verify environment variables in Vercel
- Check browser console for errors
- Check Vercel function logs

### Timeout Errors
- Verify `maxDuration: 30` in `vercel.json`
- Check Supabase connection is working
- Review function logs for slow queries

## Environment Variables Reference

```bash
# Generate JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Get Supabase Credentials
# 1. Go to Supabase Dashboard
# 2. Settings → API
# 3. Copy:
#    - Project URL → SUPABASE_URL
#    - anon public key → SUPABASE_ANON_KEY
```

## Quick Commands

```bash
# Local development
npm start

# Build frontend
npm run build

# Install all dependencies
npm run install:all

# Deploy to Vercel (if using CLI)
vercel --prod
```

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check Supabase logs
3. Test endpoints individually
4. Verify environment variables
5. Review this checklist
