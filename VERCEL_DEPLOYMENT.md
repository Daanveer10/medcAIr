# Vercel Deployment Guide

## Important Note About SQLite Database

⚠️ **SQLite will NOT work on Vercel's serverless functions** because:
- The filesystem is read-only (except `/tmp`)
- Data doesn't persist between function invocations
- Each function invocation is stateless

**You need to use a cloud database service** such as:
- Vercel Postgres (recommended for Vercel)
- Supabase (free tier available)
- MongoDB Atlas (free tier available)
- PlanetScale (free tier available)
- Railway (free tier available)

## Deployment Steps

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Login to Vercel:**
```bash
vercel login
```

3. **Deploy:**
```bash
vercel
```

Follow the prompts. On first deploy, select:
- Set up and deploy? Yes
- Which scope? (select your account)
- Link to existing project? No
- Project name? medcAIr
- Directory? ./
- Override settings? No

4. **Set Environment Variables:**
```bash
vercel env add JWT_SECRET
# Enter your JWT secret when prompted
```

5. **Deploy to production:**
```bash
vercel --prod
```

### Option 2: Deploy via GitHub Integration

1. **Push your code to GitHub** (already done ✓)

2. **Go to Vercel Dashboard:**
   - Visit https://vercel.com
   - Click "Add New Project"
   - Import your GitHub repository `Daanveer10/medcAIr`

3. **Configure Project:**
   - Framework Preset: Other
   - Root Directory: `./`
   - Build Command: `cd client && npm install && npm run build`
   - Output Directory: `client/build`
   - Install Command: `npm install`

4. **Add Environment Variables:**
   - Go to Project Settings → Environment Variables
   - Add `JWT_SECRET` with a secure random string

5. **Deploy:**
   - Click "Deploy"

## After Deployment

1. **Update API URL in Frontend:**
   - The frontend code currently uses `http://localhost:5000`
   - Update it to use your Vercel deployment URL
   - Or use environment variables: `REACT_APP_API_URL`

2. **Database Migration:**
   - You'll need to migrate from SQLite to a cloud database
   - Update `server.js` to use the new database connection
   - The database schema remains the same, just the connection changes

## Environment Variables

Set these in Vercel Dashboard → Project Settings → Environment Variables:

- `JWT_SECRET` - Secret key for JWT tokens (use a strong random string)
- `DATABASE_URL` - Connection string for your cloud database (after migration)

## Current Limitations

- SQLite database needs to be replaced with a cloud database
- Database file (`appointments.db`) should be in `.gitignore` (already done)

## Quick Database Migration Guide

### Using Vercel Postgres:

1. Install `@vercel/postgres`:
```bash
npm install @vercel/postgres
```

2. Update `server.js` to use Postgres instead of SQLite
3. Migrate schema using SQL scripts

### Using Supabase (Free):

1. Create account at https://supabase.com
2. Create a new project
3. Get connection string
4. Install `pg`:
```bash
npm install pg
```
5. Update database connection in `server.js`

## Troubleshooting

- **Build fails?** Check that all dependencies are in `package.json`
- **API routes not working?** Verify `vercel.json` routes configuration
- **Database errors?** Make sure you've migrated to a cloud database
- **Environment variables?** Ensure they're set in Vercel dashboard

