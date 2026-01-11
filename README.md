# medcAIr - AI Hospital Receptionist

A modern, full-stack web application for managing hospital appointments and follow-ups. This AI receptionist system helps hospitals handle appointment scheduling, track patient visits, and manage follow-up appointments seamlessly.

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

🎨 **Modern Design**
- Clean, attractive interface
- Responsive design (mobile-friendly)
- Smooth animations and transitions
- Gradient color scheme

## Tech Stack

**Backend:**
- Node.js with Express
- SQLite database
- RESTful API

**Frontend:**
- React.js
- Modern CSS with gradients
- Axios for API calls
- date-fns for date handling

## Installation

1. **Clone the repository** (or navigate to the project directory)

2. **Install backend dependencies:**
```bash
npm install
```

3. **Install frontend dependencies:**
```bash
cd client
npm install
cd ..
```

Or install all at once:
```bash
npm run install:all
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

## Usage

1. **Dashboard**: View statistics and today's appointments
2. **New Appointment**: Create appointments by filling out the form
3. **Appointments**: View, filter, sort, update, and delete appointments
4. **Follow-ups**: View scheduled follow-ups (schedule them from completed appointments)

## API Endpoints

- `GET /api/appointments` - Get all appointments
- `GET /api/appointments/today` - Get today's appointments
- `POST /api/appointments` - Create new appointment
- `PATCH /api/appointments/:id` - Update appointment status
- `DELETE /api/appointments/:id` - Delete appointment
- `GET /api/followups` - Get all follow-ups
- `POST /api/followups` - Create new follow-up
- `POST /api/appointments/:id/followup` - Schedule follow-up from appointment
- `GET /api/stats` - Get dashboard statistics

## Database

The application uses SQLite database (`appointments.db`) which is automatically created on first run. The database includes two tables:
- `appointments` - Stores all appointments
- `followups` - Stores all follow-up appointments

## Project Structure

```
medcAIr/
├── server.js              # Express backend server
├── package.json           # Backend dependencies
├── appointments.db        # SQLite database (auto-generated)
├── client/                # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── Dashboard.js
│   │   │   ├── AppointmentForm.js
│   │   │   ├── AppointmentsList.js
│   │   │   └── FollowUpsList.js
│   │   ├── App.js         # Main app component
│   │   └── index.js       # Entry point
│   └── package.json       # Frontend dependencies
└── README.md
```

## Features in Detail

### Appointment Creation
- Patient name and phone number (required)
- Date and time selection
- Doctor selection
- Reason for visit (optional)

### Follow-up Scheduling
- Automatically scheduled 30 days after the original appointment
- Same time as original appointment
- Linked to original appointment

### Status Management
- **Scheduled**: Default status for new appointments
- **Completed**: Mark appointments as completed
- **Cancelled**: Cancel appointments

## Future Enhancements

- User authentication and authorization
- Email/SMS notifications
- Calendar view
- Search functionality
- Export to CSV/PDF
- Integration with phone systems
- AI chatbot integration
- Patient history tracking

## License

MIT

## Support

For issues or questions, please create an issue in the repository.

---

**Built with ❤️ for modern healthcare management**

