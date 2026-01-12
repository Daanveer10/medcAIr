# medcAIr - AI Hospital Receptionist

A modern, full-stack web application for managing hospital appointments and follow-ups. Built with React, Node.js, Express, Supabase, and deployed on Vercel.

## Features

🏥 **Appointment Management**
- Create new appointments from phone calls or walk-ins
- View all appointments with filtering and sorting
- Update appointment status (Scheduled, Completed, Cancelled)
- Delete appointments

📅 **Follow-up Scheduling**
- Automatically schedule follow-ups 30 days after appointments
- View all scheduled follow-ups
- Track follow-up status

📊 **Dashboard**
- Real-time statistics (Total, Today's, Pending, Follow-ups)
- Today's appointments overview
- Beautiful, modern UI

🔐 **Authentication**
- User registration and login
- Role-based access (Patient/Hospital)
- JWT token authentication

🔍 **Clinic Search**
- Search clinics by disease, location, availability
- Distance-based search with geolocation
- View available and booked slots
- Book appointments directly

🎨 **Modern Design**
- Clean, attractive interface
- Responsive design (mobile-friendly)
- Smooth animations and transitions
- Gradient color scheme

## Tech Stack

**Backend:**
- Node.js with Express
- Supabase (PostgreSQL database)
- JWT authentication
- Serverless-ready for Vercel

**Frontend:**
- React.js with React Router
- Modern CSS with gradients
- Axios for API calls
- date-fns for date handling

**Deployment:**
- Vercel (serverless functions)
- Supabase (cloud database)

## Prerequisites

- Node.js 16+ and npm
- Supabase account (free tier available)
- Vercel account (for deployment)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Daanveer10/medcAIr.git
cd medcAIr
```

### 2. Set Up Supabase

Follow the detailed guide in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md):

1. Create a Supabase account and project
2. Get your API keys (URL and anon key)
3. Run the database schema from `db/schema.sql`
4. Set up environment variables

### 3. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

Or install all at once:
```bash
npm run install:all
```

### 4. Configure Environment Variables

1. Copy the example environment file:
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

### 5. Build the Frontend

```bash
npm run build
```

## Running the Application

### Development Mode

1. **Start the backend server:**
```bash
npm start
```
The server will run on `http://localhost:5000`

2. **In a new terminal, start the React frontend:**
```bash
cd client
npm start
```
The frontend will run on `http://localhost:3000` and automatically open in your browser.

### Production Mode

1. **Build the React app:**
```bash
npm run build
```

2. **Start the server:**
```bash
npm start
```

The application will be available at `http://localhost:5000`

## Deployment to Vercel

### Prerequisites

1. Vercel account (sign up at [vercel.com](https://vercel.com))
2. Supabase project set up (see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md))
3. GitHub repository (already done ✓)

### Deployment Steps

1. **Push your code to GitHub** (already done ✓)

2. **Go to Vercel Dashboard:**
   - Visit [https://vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository `Daanveer10/medcAIr`

3. **Configure Project:**
   - Framework Preset: **Other**
   - Root Directory: `./`
   - Build Command: `cd client && npm install && npm run build`
   - Output Directory: `client/build`
   - Install Command: `npm install`

4. **Add Environment Variables:**
   - Go to **Settings** → **Environment Variables**
   - Add these variables:
     - `JWT_SECRET` - Your generated JWT secret
     - `SUPABASE_URL` - Your Supabase project URL
     - `SUPABASE_ANON_KEY` - Your Supabase anon key
   - Select environments: **Production**, **Preview**, **Development**
   - Click "Save"

5. **Deploy:**
   - Click "Deploy"
   - Wait for deployment to complete
   - Your app will be live at `https://your-app.vercel.app`

### Update Frontend API URL

After deployment, update the frontend to use your Vercel URL:

1. In Vercel Dashboard → **Settings** → **Environment Variables**
2. Add: `REACT_APP_API_URL` = `https://your-app.vercel.app`
3. Redeploy

Or update `client/src/App.js` and other components to use:
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
```

## Usage

### For Patients:
1. **Sign up** as a patient
2. **Search for clinics** by disease, location, or name
3. **View available slots** for a clinic
4. **Book appointments** by selecting a time slot
5. **View your appointments** and manage them

### For Hospitals:
1. **Sign up** as a hospital
2. **Create clinics** with location and specialties
3. **Manage time slots** for your clinics
4. **View all appointments** for your clinics
5. **Update appointment status** and schedule follow-ups

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Clinics
- `GET /api/clinics` - Get all clinics
- `GET /api/clinics/:id` - Get clinic by ID
- `GET /api/clinics/search` - Search clinics with filters
- `GET /api/clinics/:id/slots` - Get slots for a clinic
- `GET /api/clinics/:id/slots/grouped` - Get slots grouped by date
- `POST /api/clinics` - Create clinic (hospital only)
- `POST /api/clinics/:id/slots` - Create slot (hospital only)

### Appointments
- `GET /api/appointments` - Get all appointments
- `GET /api/appointments/today` - Get today's appointments
- `POST /api/appointments` - Create appointment
- `PATCH /api/appointments/:id` - Update appointment status
- `DELETE /api/appointments/:id` - Delete appointment
- `GET /api/patient/appointments` - Get patient appointments
- `GET /api/hospital/appointments` - Get hospital appointments

### Follow-ups
- `GET /api/followups` - Get all follow-ups
- `POST /api/followups` - Create follow-up
- `POST /api/appointments/:id/followup` - Schedule follow-up from appointment

### Statistics
- `GET /api/stats` - Get dashboard statistics

## Database Schema

The application uses Supabase (PostgreSQL) with the following tables:
- `users` - User accounts (patients and hospitals)
- `clinics` - Clinic information
- `appointments` - Appointment records
- `followups` - Follow-up appointments
- `slots` - Available time slots

See `db/schema.sql` for the complete schema.

## Project Structure

```
medcAIr/
├── server.js              # Express backend server
├── package.json           # Backend dependencies
├── db/
│   ├── supabase.js        # Supabase client configuration
│   └── schema.sql         # Database schema
├── api/
│   └── server.js          # Vercel serverless function wrapper
├── client/                # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── App.js         # Main app component
│   │   └── index.js        # Entry point
│   └── package.json       # Frontend dependencies
├── vercel.json            # Vercel configuration
├── .env.example           # Environment variables template
├── SUPABASE_SETUP.md      # Supabase setup guide
└── README.md              # This file
```

## Environment Variables

Required environment variables:

- `JWT_SECRET` - Secret key for JWT tokens
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anon/public key
- `REACT_APP_API_URL` - API URL for frontend (optional, defaults to localhost)

## Troubleshooting

### Database Connection Issues
- Verify Supabase credentials are correct
- Check that your Supabase project is active
- Ensure the database schema has been created

### Authentication Issues
- Verify JWT_SECRET is set correctly
- Check token expiration (default: 7 days)
- Ensure environment variables are loaded

### Deployment Issues
- Check Vercel deployment logs
- Verify all environment variables are set in Vercel
- Ensure build command completes successfully

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Support

For issues or questions:
- Check [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for database setup
- Review Vercel deployment logs
- Open an issue on GitHub

---

**Built with ❤️ for modern healthcare management**
