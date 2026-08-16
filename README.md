# ✈️ SkySafe - Flight Booking System

SkySafe is a full-stack flight booking web application built using the MERN stack.

It allows users to register, login securely, search for flights, view flight details, book flights, manage their bookings, and cancel bookings.

The project also includes an Admin Dashboard for managing and monitoring the flight booking system.

---

## 🚀 Live Demo

### Frontend
https://skysafe-1.onrender.com

### Backend API
https://skysafe-b6bq.onrender.com

---

## ✨ Features

### 👤 User Features

- User Registration
- User Login
- Secure JWT Authentication
- HTTP-only Cookie Authentication
- Protected Routes
- Search Flights
- View Flight Details
- Add Passenger Details
- Book Flights
- View My Bookings
- Cancel Bookings
- Logout

### 🛡️ Admin Features

- Admin Authentication
- Role-Based Authorization
- Admin Dashboard
- View Total Flights
- View Total Users
- View Total Bookings
- View Total Revenue
- Add Flights
- Update Flights
- Delete Flights

---

## 🛠️ Tech Stack

### Frontend

- React.js
- React Router DOM
- Axios
- Tailwind CSS
- Context API
- Vite

### Backend

- Node.js
- Express.js
- REST API
- JWT
- bcrypt
- Cookie Parser
- CORS

### Database

- MongoDB
- Mongoose

### Deployment

- Render

---

## 🏗️ Project Structure

```text
SkySafe/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── Booking.jsx
│   │   │   ├── MyBookings.jsx
│   │   │   └── AdminDashboard.jsx
│   │   │
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   ├── flightService.js
│   │   │   ├── bookingService.js
│   │   │   └── adminService.js
│   │   │
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   └── package.json
│
├── server/
│   ├── config/
│   │   └── db.js
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── flight.controller.js
│   │   ├── booking.controller.js
│   │   └── admin.controller.js
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   └── admin.middleware.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Flight.js
│   │   └── Booking.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── flight.routes.js
│   │   ├── booking.routes.js
│   │   └── admin.routes.js
│   │
│   ├── app.js
│   ├── server.js
│   └── package.json
│
├── .gitignore
└── README.md
#Authentication

SkySafe uses JWT-based authentication with HTTP-only cookies.

-Registration Flow
User enters Name, Email and Password
                ↓
        POST /api/auth/register
                ↓
       Password hashed using bcrypt
                ↓
          User stored in MongoDB 
-Login Flow
User enters Email and Password
                ↓
         POST /api/auth/login
                ↓
          Find User in MongoDB
                ↓
          Compare Password
                ↓
          Generate JWT Token
                ↓
      Store Token in HTTP-only Cookie
Protected Request
Frontend Request
       ↓
Authentication Cookie
       ↓
authMiddleware
       ↓
JWT Verification
       ↓
req.user
       ↓
Protected Controller
🛡️ Role-Based Authorization

SkySafe supports normal users and administrators.

                    User
                     │
             ┌───────┴───────┐
             │               │
        Normal User         Admin
             │               │
        Book Flights    Admin Dashboard
        My Bookings     Manage Flights
        Cancel Booking View Statistics

Admin routes use two middleware layers:

    Request
        ↓
    authMiddleware
        ↓
    adminMiddleware
        ↓
    Admin Controller

The admin middleware checks:
req.user.role === "admin"
✈️ Flight Booking Flow
    Search Flights
          ↓
    Select Flight
          ↓
    View Flight Details
          ↓
    Enter Passenger Details
         ↓
    Confirm Booking
         ↓
    Booking Created
          ↓
    My Bookings
         ↓
    Cancel Booking
Database Models
User
User
├── name
├── email
├── password
└── role
Flight
Flight
├── flightNumber
├── airline
├── source
├── destination
├── departureTime
├── arrivalTime
├── duration
├── price
├── totalSeats
├── availableSeats
├── aircraft
└── status
Booking
Booking
├── user
├── flight
├── passengers
├── seatsBooked
├── totalPrice
├── bookingRef
└── status

📊 Admin Dashboard

The Admin Dashboard displays important system statistics.

┌─────────────────────────┐
│      Total Flights      │
└─────────────────────────┘


┌─────────────────────────┐
│       Total Users       │
└─────────────────────────┘


┌─────────────────────────┐
│      Total Bookings     │
└─────────────────────────┘


┌─────────────────────────┐
│        Revenue          │
└─────────────────────────┘

Revenue is calculated using MongoDB aggregation and includes confirmed bookings.

🔒 Security

The application implements:

Password hashing using bcrypt
JWT authentication
HTTP-only cookies
Protected frontend routes
Protected backend routes
Role-based authorization
CORS configuration
Environment variables
Server-side authentication validation

💻 Installation and Setup
1. Clone the Repository
git clone https://github.com/Palak216/SkySafe.git
2. Navigate to the Project
cd SkySafe
3. Install Backend Dependencies
cd server
npm install
4. Create Environment Variables

Create:

server/.env

Add:

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
5. Start Backend
npm start

or:

node server.js
6. Install Frontend Dependencies

Open another terminal:

cd client
npm install
7. Start Frontend
npm run dev

The frontend will normally run at:

http://localhost:5173

🎯 Key Concepts Implemented

This project demonstrates practical implementation of:

React Components
React Hooks
React Router
Context API
Protected Routes
Axios
REST APIs
Express.js
MVC Architecture
Middleware
JWT Authentication
bcrypt Password Hashing
HTTP-only Cookies
Role-Based Authorization
MongoDB
Mongoose
CRUD Operations
MongoDB Aggregation
CORS
Full-Stack Deployment

🔮 Future Improvements

Some possible future improvements are:

Online payment integration
Seat selection
E-ticket generation
Email booking confirmation
Password reset
Email verification
Advanced flight filtering
Flight sorting
Pagination
Better form validation
Automated testing
Enhanced Admin Flight Management
👩‍💻 Author
Palak Agrawal

GitHub:

https://github.com/Palak216

⭐ Project

If you find this project useful, feel free to explore the repository and give it a star.

Built with ❤️ using the MERN Stack.