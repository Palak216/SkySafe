# ✈️ SkySafe — Autonomous AI-Powered Flight Booking Platform

SkySafe is a full-stack flight booking web application built using the **MERN stack (MongoDB, Express.js, React, Node.js)**, enhanced with an **AI-powered natural-language flight search engine**, **live Amadeus Test API integration**, a **deterministic custom ranking layer**, and a **transactional booking engine** with race-condition prevention.

---

## 🚀 Live Demo

- **Frontend:** [https://skysafe-1.onrender.com](https://skysafe-1.onrender.com)
- **Backend API:** [https://skysafe-b6bq.onrender.com](https://skysafe-b6bq.onrender.com)

---

## ✨ Features

### 🤖 AI-Powered Flight Search (New)
- **Natural Language Understanding:** Users can search flights in plain English, e.g.:
  - *"Find me a cheap non-stop flight from Delhi to Goa tomorrow morning"*
  - *"Cheapest flight from Mumbai to Delhi on October 5"*
  - *"Show me non-stop flights from Bangalore to Delhi after 6 PM"*
  - *"Find an affordable morning flight from Chennai to Mumbai for 2 adults"*
- **Intelligent Parameter Extraction:** Automatically extracts origin, destination, relative dates ("tomorrow", "next Monday", "October 5"), time preferences (morning, afternoon, evening, night, after 6 PM), non-stop preference, passenger count, and price sorting.
- **Airport & City Code Normalization:** Maps city names (Delhi, Mumbai, Bangalore, Goa, etc.) and IATA codes (DEL, BOM, BLR, GOI) to standard 3-letter IATA codes.
- **Strict Backend Validation:** Enforces business rules, prevents route collisions (e.g. Delhi to Delhi), rejects invalid cities (e.g. Mars), and rejects past dates.
- **Deterministic Custom Ranking:** Scores flights based on time window match (+35 pts), stops match (+30 pts), price competitiveness (+25 pts), and duration competitiveness (+10 pts) with human-readable match highlights.
- **Flight Provider Abstraction:** Integrates **Amadeus Test API** as the primary live flight-offer source, with an automatic, resilient **Mock Provider** fallback for offline demonstrations or API quota exhaustion.
- **Seamless Booking Bridge:** Safely bridges external/mock flight offers into MongoDB flight inventory, preserving existing transactional booking mechanics.

### 👤 User Features
- User Registration & Secure Login
- JWT Authentication with HTTP-only Cookies
- Role-based Protected Routes
- Dual Search Modes: **Ask SkySafe (AI Search)** and **Traditional Route Search**
- Passenger Information Entry
- Confirmed Bookings History (`/my-bookings`)
- Instant Booking Cancellation with Automatic Seat Restitution

### 🛡️ Admin Features
- Secure Role-Based Admin Access (`/admin`)
- Real-Time Admin Dashboard Metrics: Total Flights, Registered Users, Total Bookings, and Confirmed Revenue
- Flight CRUD Management (`/admin/flights`): Add, Edit, Update Status, and Delete Flights

---

## 🏗️ Architecture

```text
React 19 Frontend
       │
       ▼ (POST /api/ai/flights/search)
Node.js / Express Backend
       │
       ▼
AI / NLP Flight Query Parser (services/aiFlightHelper.js)
       │
       ▼ (Structured JSON)
Backend Validation Layer (services/queryValidator.js)
       │
       ▼ (Sanitized Query Parameters)
Flight Provider Abstraction (services/flightProviders/index.js)
       ├── Amadeus Provider (OAuth2 Client Credentials + Test API)
       └── Mock Provider (Realistic Domestic/International Fallback)
       │
       ▼ (Normalized Flight Offers)
Deterministic Ranking Layer (services/rankingService.js)
       │
       ▼ (Ranked Offers with Match Scores & Highlights)
Smart Results UI (components/SearchForm.jsx)
       │
       ▼ (User clicks "Book Now" → POST /api/flights/bridge-or-prepare)
MongoDB Booking Bridge & Atomic Inventory Update
       │
       ▼
Confirmed Booking (models/Booking.js)
```

---

## 🛠️ Tech Stack

### Frontend
- **React 19** & **Vite 8**
- **React Router DOM 7** (Client-side routing & Protected Routes)
- **Axios** (Centralized API client with HTTP-only cookie support)
- **Tailwind CSS 4** (Modern utility-first styling)

### Backend
- **Node.js** (v20+) & **Express.js 5**
- **JWT (jsonwebtoken)** & **bcrypt** (Secure password hashing)
- **cookie-parser** & **cors**
- **Amadeus Self-Service Test API** (Flight offer search via OAuth2)
- **Built-in NLP Semantic Engine** + optional **Google Gemini LLM**

### Database
- **MongoDB Atlas** & **Mongoose 9**
- Atomic conditional updates (`$gte` and `$inc`) for overbooking race condition prevention
- MongoDB Aggregation Framework for revenue calculation

---

## ⚙️ Environment Variables

Copy the provided `.env.example` file to create your environment variables:

```bash
cp .env.example server/.env
```

### Server Configuration (`server/.env`):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/skysafe?retryWrites=true&w=majority
JWT_SECRET=your_jwt_strong_secret_key_here

# Flight Provider Configuration ("amadeus" or "mock")
FLIGHT_PROVIDER=amadeus
AMADEUS_CLIENT_ID=your_amadeus_api_key
AMADEUS_CLIENT_SECRET=your_amadeus_api_secret

# AI Query Parsing (Optional)
GEMINI_API_KEY=your_gemini_api_key_here
```

### Client Configuration (optional for custom host/port):
```env
VITE_API_URL=http://localhost:5000/api
```

> **Security Note:** Secrets are stored exclusively in environment variables and are never exposed to the frontend bundle. `server/.env` is strictly ignored by Git.

---

## 💻 Local Setup & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/Palak216/SkySafe.git
cd SkySafe
```

### 2. Backend Setup
```bash
cd server
npm install
# Ensure server/.env is created with your MONGODB_URI
npm run dev
```
Backend will start at: `http://localhost:5000`

### 3. Frontend Setup
Open a new terminal:
```bash
cd client
npm install
npm run dev
```
Frontend will be available at: `http://localhost:5173`

### 4. Run Automated Test Suite
From the `server` directory:
```bash
npm test
```
Executes the comprehensive automated integration suite verifying:
- All 9 user test scenarios
- Query validation & error rejection
- Fallback mechanics
- Booking bridge & atomic seat decrement
- Traditional flight search

---

## 📡 API Endpoints

### AI & Smart Flight Search
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/ai/flights/search` | Natural language flight query search | Public |
| `POST` | `/api/flights/bridge-or-prepare` | Bridges search offer into MongoDB flight inventory | Public |

### Traditional Flight Search & Flights
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/flights/search` | Search flights via source, destination, date query params | Public |
| `GET` | `/api/flights` | Retrieve all flights | Public |
| `GET` | `/api/flights/:id` | Get flight by MongoDB ID | Public |
| `POST` | `/api/flights` | Create new flight | Admin |
| `PUT` | `/api/flights/:id` | Update flight details | Admin |
| `DELETE` | `/api/flights/:id` | Delete flight | Admin |

### Authentication
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user account | Public |
| `POST` | `/api/auth/login` | Login user & issue HTTP-only JWT cookie | Public |
| `GET` | `/api/auth/profile` | Get current authenticated user profile | User |
| `POST` | `/api/auth/logout` | Clear authentication cookie | User |

### Bookings
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/bookings` | Book flight with passenger information (Atomic seat update) | User |
| `GET` | `/api/bookings/my` | Retrieve logged-in user's bookings | User |
| `DELETE` | `/api/bookings/:id` | Cancel booking & restore seats | User |

### Admin Dashboard
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/dashboard` | View total flights, users, bookings, and revenue | Admin |

---

## 🔍 How Overbooking Is Prevented

SkySafe uses **atomic conditional document updates** in MongoDB to eliminate race conditions:
```javascript
const flight = await Flight.findOneAndUpdate(
  {
    _id: flightId,
    availableSeats: { $gte: seatsRequested } // Atomic condition
  },
  {
    $inc: { availableSeats: -seatsRequested } // Atomic decrement
  },
  { returnDocument: "after" }
);

if (!flight) {
  return res.status(400).json({ success: false, message: "Not enough seats available" });
}
```
If two users simultaneously attempt to book the last available seat, only one request will satisfy the `$gte` condition. The other request returns `null` and is rejected cleanly.

---

## ⚠️ Important Limitations & Transparent Disclosures

1. **Amadeus Test Environment:** The project is integrated with the **Amadeus Self-Service Test API**. The test sandbox contains a subset of airline schedules. If an queried route or date has no sandbox data, the system automatically falls back to the **Mock Provider** to ensure seamless demonstration.
2. **Booking Prototype Simulation:** SkySafe simulates ticket booking and inventory management on MongoDB. It does **not** process real payments or issue live airline PNR tickets with commercial airlines.
3. **Airport Coverage:** The city-to-IATA resolution dictionary covers major Indian hubs and international destinations, with fallback support for any valid 3-letter IATA code.

---

## 📖 Technical Interview Guide

For an in-depth architectural breakdown and technical interview defense questions (covering concurrency, security, AI validation, ranking formulas, and scaling), see:
👉 **[`docs/INTERVIEW_GUIDE.md`](./docs/INTERVIEW_GUIDE.md)**

---

## 👩‍💻 Author
**Palak Agrawal**  
GitHub: [https://github.com/Palak216](https://github.com/Palak216)