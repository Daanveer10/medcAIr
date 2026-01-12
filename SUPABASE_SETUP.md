# Supabase Setup Guide for medcAIr

This guide will help you set up Supabase as the database for medcAIr.

## Step 1: Create a Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub (recommended) or email
4. Create a new organization (if needed)

## Step 2: Create a New Project

1. Click "New Project"
2. Fill in the details:
   - **Name**: medcAIr (or any name you prefer)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose the closest region to your users
   - **Pricing Plan**: Free tier is sufficient to start
3. Click "Create new project"
4. Wait 2-3 minutes for the project to be set up

## Step 3: Get Your API Keys

1. Once your project is ready, go to **Settings** → **API**
2. You'll see:
   - **Project URL** (SUPABASE_URL)
   - **anon public** key (SUPABASE_ANON_KEY)
3. Copy both values - you'll need them for environment variables

## Step 4: Set Up the Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy and paste the entire contents of `db/schema.sql`
4. Click "Run" (or press Cmd/Ctrl + Enter)
5. You should see "Success. No rows returned"

## Step 5: Verify Tables Were Created

1. Go to **Table Editor** in the left sidebar
2. You should see these tables:
   - `users`
   - `clinics`
   - `appointments`
   - `followups`
   - `slots`

## Step 6: Set Up Environment Variables

### For Local Development:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your values:
   ```env
   JWT_SECRET=your-generated-jwt-secret
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. Generate a JWT secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

### For Vercel Deployment:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add these variables:
   - `JWT_SECRET` - Your generated JWT secret
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_ANON_KEY` - Your Supabase anon key
4. Select environments: **Production**, **Preview**, **Development**
5. Click "Save"

## Step 8: Test the Connection

1. Start your local server:
   ```bash
   npm start
   ```

2. Check the console - you should see:
   ```
   Server running on port 5000
   Supabase connected: Yes
   ```

3. Try registering a new user via the API or frontend

## Troubleshooting

### "Missing Supabase environment variables"
- Make sure you've set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in your `.env` file
- For Vercel, ensure environment variables are set in the dashboard

### "relation does not exist"
- Make sure you've run the SQL schema from `db/schema.sql` in Supabase SQL Editor
- Check that all tables were created successfully

### "permission denied"
- Check your Supabase Row Level Security (RLS) policies
- For development, you can temporarily disable RLS (not recommended for production)

### Connection Issues
- Verify your Supabase project is active (not paused)
- Check that your API keys are correct
- Ensure your IP is not blocked (for local development)

## Security Notes

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Use different JWT secrets** for development and production
3. **Keep your Supabase keys secure** - Don't share them publicly
4. **Enable Row Level Security (RLS)** for production (optional but recommended)

## Next Steps

After setting up Supabase:
1. ✅ Database schema is created
2. ✅ Environment variables are configured
3. ✅ Test the connection
4. ✅ Deploy to Vercel with environment variables
5. ✅ Start using the application!

For more help, visit [Supabase Documentation](https://supabase.com/docs)
