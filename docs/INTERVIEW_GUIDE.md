# ✈️ SkySafe — Technical Interview Defense & Architectural Guide

This guide is designed for Computer Science technical interviews and project defense. It explains the system design, architectural decisions, security practices, trade-offs, and implementation details of SkySafe.

---

## 1. High-Level System Architecture

SkySafe is an enterprise-pattern MERN application enhanced with an **AI/NLP Flight Search Engine**, **External Flight API Integration (Amadeus Test API)**, **Deterministic Custom Ranking Layer**, and a **Safe Inventory Booking Bridge**.

### End-to-End Request Lifecycle:
```text
┌────────────────────────────────────────────────────────┐
│                   React 19 Frontend                    │
│   • Natural Language "Ask SkySafe" or Manual Search    │
└───────────────────────────┬────────────────────────────┘
                            │ POST /api/ai/flights/search { message }
                            ▼
┌────────────────────────────────────────────────────────┐
│               Node.js / Express Backend                │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│               AI / NLP Flight Parser                   │
│   • Optional Google Gemini 1.5/2.5 Flash               │
│   • Resilient Built-in Deterministic NLP Extractor     │
└───────────────────────────┬────────────────────────────┘
                            │ Structured Parameters
                            ▼
┌────────────────────────────────────────────────────────┐
│                Query Validation Layer                  │
│   • Airport / City IATA Code Resolution (DEL, BOM, etc)│
│   • Past Date & Calendar Integrity Checks              │
│   • Passenger Limits & Route Collision Prevention      │
└───────────────────────────┬────────────────────────────┘
                            │ Sanitized Parameters
                            ▼
┌────────────────────────────────────────────────────────┐
│               Flight Provider Abstraction              │
│             ┌─────────────┴─────────────┐              │
│             ▼                           ▼              │
│    Amadeus Provider               Mock Provider        │
│   (Live OAuth2 Test API)     (Deterministic Fallback)  │
└───────────────────────────┬────────────────────────────┘
                            │ Normalized Flight Objects
                            ▼
┌────────────────────────────────────────────────────────┐
│             Deterministic Ranking Layer                │
│   • Time Preference Score (+35 pts)                    │
│   • Stops / Non-stop Score (+30 pts)                   │
│   • Price Competitiveness Score (+25 pts)              │
│   • Duration Competitiveness Score (+10 pts)           │
└───────────────────────────┬────────────────────────────┘
                            │ Ranked Offers with Match Highlights
                            ▼
┌────────────────────────────────────────────────────────┐
│               React Smart Results UI                   │
│   • Best Match Ribbon, Highlights, Timings & Pricing   │
└───────────────────────────┬────────────────────────────┘
                            │ User clicks "Book Now"
                            ▼
┌────────────────────────────────────────────────────────┐
│             Booking Bridge Service                     │
│   • POST /api/flights/bridge-or-prepare                │
│   • Idempotently creates MongoDB Flight inventory      │
└───────────────────────────┬────────────────────────────┘
                            │ MongoDB flightId
                            ▼
┌────────────────────────────────────────────────────────┐
│          Existing SkySafe Booking Lifecycle            │
│   • Atomic Conditional Seat Decrement ($gte & $inc)    │
│   • Unique Booking Reference (SKY-XXXXXX)              │
│   • Ownership Validation & Cancellation Recovery       │
└────────────────────────────────────────────────────────┘
```

---

## 2. Core Architectural Questions & Answers

### Q1: Why React on the frontend?
- **Component-Driven Architecture:** UI components (e.g. `SearchForm`, `Navbar`, `ProtectedRoute`) encapsulate state and presentation logic, making the code modular, reusable, and easy to maintain.
- **Virtual DOM & Fast Renders:** React efficiently reconciles DOM diffs when search results or authentication states change, maintaining smooth 60fps UI performance.
- **Rich Ecosystem & Tooling:** Vite delivers instant hot-module replacement (HMR) and optimized Rollup production bundles.

### Q2: Why Node.js & Express on the backend?
- **Asynchronous Non-Blocking I/O:** Node.js runs on the V8 engine with an event loop. Network-bound operations (calling Amadeus API, querying MongoDB Atlas, running AI parsers) run concurrently without blocking request worker threads.
- **Unified Language Stack (JavaScript across Full Stack):** Eliminates context-switching between frontend and backend. Data structures, JSON payloads, and validation models share the same idioms.
- **Lightweight & Modular Middleware Pipeline:** Express allows clear separation of concerns: CORS, cookie parsing, JWT authentication middleware, route handlers, and centralized error handling.

### Q3: Why MongoDB & Mongoose?
- **Document Model Alignment:** Flights, bookings, and users are naturally represented as hierarchical JSON/BSON documents. A booking contains passenger subdocuments, referencing the flight and user.
- **Flexible Schema Evolution:** Adding attributes (such as aircraft type, match scores, or external provider references) does not require downtime-inducing SQL table migrations.
- **Atomic Operations for Concurrency:** MongoDB provides document-level ACID guarantees. Single-document operations like `$inc` and conditional updates (`$gte`) prevent race conditions natively without heavy distributed locks.

### Q4: Why JWT (JSON Web Tokens) with HTTP-only Cookies?
- **Stateless Authentication:** The backend does not need an in-memory session store (like Redis) to verify user identity. The token is cryptographically signed using `JWT_SECRET`.
- **XSS (Cross-Site Scripting) Defense:** Storing tokens in `localStorage` or `sessionStorage` exposes them to malicious JavaScript injection. SkySafe stores the JWT in an **HTTP-only cookie**, making it inaccessible to `document.cookie` in client-side scripts.
- **CSRF Consideration:** The cookie uses `sameSite: "lax"` (or `"none"` with `secure: true` in cross-origin production), preventing unauthorized cross-origin requests.

### Q5: Authentication vs. Authorization — What is the difference?
- **Authentication ("Who are you?"):** Handled by `authMiddleware.js`. It extracts the JWT cookie, verifies the signature against `JWT_SECRET`, decodes the user payload, and attaches `req.user` to the request object. If the cookie is absent or expired, it returns HTTP 401 (Unauthorized).
- **Authorization ("What are you allowed to do?"):** Handled by `adminMiddleware.js` and resource ownership checks. For instance, `adminMiddleware` checks `req.user.role === 'admin'`. If a standard user attempts to access `/api/admin/dashboard`, it returns HTTP 403 (Forbidden). Similarly, in `booking.controller.js`, cancellation checks `booking.user.toString() === req.user.id` so users cannot cancel other users' flights.

---

## 3. Booking Engine & Overbooking Prevention

### Q6: How does SkySafe prevent overbooking race conditions?
In a flight booking system, two users might try to book the last available seat simultaneously. A naive implementation does:
```javascript
// BAD PRACTICE (Prone to race conditions):
const flight = await Flight.findById(flightId);
if (flight.availableSeats >= seatsRequested) {
    flight.availableSeats -= seatsRequested;
    await flight.save();
}
```
If two requests execute `findById` concurrently, both see 1 seat remaining and both subtract 1, resulting in -1 seats (overbooking).

**SkySafe's Atomic Solution:**
```javascript
// SECURE & ATOMIC IMPLEMENTATION:
const flight = await Flight.findOneAndUpdate(
    {
        _id: flightId,
        availableSeats: { $gte: seatsRequested } // Filter condition
    },
    {
        $inc: { availableSeats: -seatsRequested } // Atomic decrement
    },
    {
        returnDocument: "after"
    }
);

if (!flight) {
    return res.status(400).json({
        success: false,
        message: "Not enough seats available"
    });
}
```
- MongoDB evaluates the query and update atomically in a single operation.
- Only the first request finds `availableSeats >= seatsRequested` and atomically decrements the counter.
- The second request finds `availableSeats = 0`, the query filter matches 0 documents, `findOneAndUpdate` returns `null`, and the system cleanly rejects the booking with HTTP 400.

---

## 4. AI-Powered Natural Language Flight Search

### Q7: How does the AI search work under the hood?
1. **User input:** e.g., *"Find me a cheap non-stop flight from Delhi to Goa tomorrow morning."*
2. **AI / NLP Parsing (`server/services/aiFlightHelper.js`):**
   - **Hybrid Design:** If `GEMINI_API_KEY` is present, it uses Gemini Flash via structured JSON prompting.
   - **Deterministic Fallback Engine:** A built-in regex and semantic dictionary tokenizer extracts:
     - Route: Origin `DEL` (Delhi) and Destination `GOI` (Goa) via `airportCodes.js`.
     - Date: "tomorrow" calculates local calendar date `YYYY-MM-DD`.
     - Time slot: "morning" maps to `05:00 - 12:00`.
     - Non-stop: "non-stop" maps to `nonStop: true`.
     - Sort preference: "cheap" maps to `sortBy: "price"`.
     - Passenger count: e.g. "for 2 adults" maps to `adults: 2` (defaults to 1).
3. **Structured Output:** Emits a validated JSON parameter object.

### Q8: Why do we NEVER trust AI output directly?
- **Hallucination Risk:** LLMs can invent non-existent airport codes (e.g. "MARS"), invert origins and destinations, or generate past dates (e.g. "2020-01-01").
- **Injection & Security Vulnerabilities:** Raw AI outputs should never be interpolated into database queries or passed directly to third-party APIs.
- **Separation of Concerns:**
  - **AI's role:** Interpret natural language and extract semantic intent.
  - **Backend's role:** Enforce business rules, validate data types, check dates, resolve IATA codes, and maintain system boundaries.

### Q9: How does the Validation Layer (`queryValidator.js`) enforce rules?
The validator performs 6 deterministic checks:
1. **Origin check:** Resolves city/airport name to a valid 3-letter IATA code. Fails gracefully if invalid.
2. **Destination check:** Resolves city/airport name to a valid 3-letter IATA code. Fails gracefully if invalid.
3. **Same-city rejection:** If `origin === destination`, rejects with *"Origin and destination cannot be the same airport"*.
4. **Calendar & Past Date check:** Validates `YYYY-MM-DD` format, checks that the date exists on the calendar, and ensures `departureDate >= today`. Past dates are rejected with *"Departure date cannot be in the past"*.
5. **Passenger Bounds:** Enforces `1 <= adults <= 9`.
6. **Date Range:** Rejects flights booked more than 1 year in advance.

---

## 5. Flight Provider Abstraction & Amadeus Integration

### Q10: How does Amadeus authentication work?
Amadeus uses **OAuth2 Client Credentials Grant**:
1. Backend sends a `POST` request to `https://test.api.amadeus.com/v1/security/oauth2/token` with `client_id` and `client_secret` in `x-www-form-urlencoded` format.
2. Amadeus returns an `access_token` and `expires_in` (typically 1799 seconds / 30 minutes).
3. **Token Caching:** SkySafe stores the token in memory (`cachedToken`, `tokenExpiresAt`). Subsequent search requests reuse this token until 60 seconds before expiration, avoiding redundant authentication roundtrips.
4. Subsequent calls include `Authorization: Bearer <access_token>` in headers.

### Q11: Why keep external API credentials exclusively on the backend?
- If `AMADEUS_CLIENT_SECRET` were included in frontend React code, anyone inspecting the browser network tab or JavaScript bundle could extract the secret and abuse the quota or billing.
- The backend acts as a secure proxy: it authenticates, queries external APIs, filters sensitive response metadata, and delivers only clean normalized data to the client.

### Q12: Why does the Mock Provider exist and how does failover work?
- **Resilience:** If Amadeus test servers are down, rate limits are hit (HTTP 429), test credentials expire, or the system is run offline during an interview demo, the application does not crash.
- **Provider Abstraction (`flightProviders/index.js`):**
  - Tries `amadeusProvider.searchFlights()`.
  - On any error (network failure, auth failure, zero results in test sandbox), catches the exception, logs it safely, and immediately invokes `mockProvider.searchFlights()`.
  - Returns `isFallback: true` and `fallbackReason` so the frontend can transparently indicate the data source.

---

## 6. Deterministic Custom Ranking Algorithm

### Q13: How does the ranking algorithm work?
Instead of a black-box AI model ranking flights, SkySafe uses a transparent, deterministic mathematical scoring function (`rankingService.js`):

$$\text{MatchScore} = \text{Score}_{\text{time}} + \text{Score}_{\text{stops}} + \text{Score}_{\text{price}} + \text{Score}_{\text{duration}}$$

| Component | Max Points | Logic |
| :--- | :--- | :--- |
| **Time Preference** | 35 pts | +35 pts if departure hour falls within requested window (e.g. morning 05:00–12:00, or after 18:00); +20 pts default. |
| **Stops Match** | 30 pts | +30 pts for non-stop flights; +15 pts for 1-stop flights (0 pts if user requested non-stop). |
| **Price Competitiveness** | 25 pts | Scaled linearly: $25 \times \left(1 - \frac{\text{price} - \text{minPrice}}{\text{maxPrice} - \text{minPrice}}\right)$. Lowest price gets full 25 pts. |
| **Duration Competitiveness** | 10 pts | Scaled linearly: $10 \times \left(1 - \frac{\text{duration} - \text{minDuration}}{\text{maxDuration} - \text{minDuration}}\right)$. Shortest duration gets full 10 pts. |

Flights are sorted according to `sortBy` ("price" ascending or "duration" ascending), with time window matches boosted to the top. The highest scoring flight receives the `⭐ Best Match` badge and match highlights (e.g. `["Cheapest Fare", "Non-stop", "Morning Flight"]`).

---

## 7. The Booking Bridge Architecture

### Q14: How does SkySafe connect Amadeus search results to MongoDB bookings?
Amadeus search results are ephemeral flight offers from an external API, whereas SkySafe's booking schema (`models/Booking.js`) requires a MongoDB `ObjectId` referencing a persistent `Flight` document.

**The Solution (`POST /api/flights/bridge-or-prepare`):**
1. User clicks **"Book Now"** on any search result (Amadeus or Mock).
2. The client sends the normalized flight object to `/api/flights/bridge-or-prepare`.
3. The backend checks if a MongoDB `Flight` already exists for this `flightNumber` and `departureTime`.
4. If not found, it persists the flight into MongoDB with initial seat inventory (`totalSeats: 180`, `availableSeats: 180`).
5. Returns the MongoDB `flightId`.
6. React navigates to `/booking/:flightId`.
7. User fills passenger details and confirms booking.
8. The existing SkySafe transactional booking flow runs, decrements seats atomically, generates a unique reference, and updates admin dashboard metrics.

---

## 8. Scalability & Production Readiness

### Q15: How could SkySafe scale for higher traffic?
1. **Redis Caching:** Cache flight search results for identical route/date pairs for 5–10 minutes to reduce external API costs and latencies.
2. **Rate Limiting:** Add `express-rate-limit` to prevent denial-of-service on search and login routes.
3. **Database Indexing:** Add compound indexes on `{ flightNumber: 1, departureTime: 1 }` and `{ source: 1, destination: 1, departureTime: 1 }` in MongoDB.
4. **Message Queues:** Offload post-booking actions (email confirmation, invoice PDF generation) to background workers using BullMQ or RabbitMQ.
5. **Horizontal Scaling:** Deploy stateless backend containers behind an NGINX or AWS Application Load Balancer.

---

## 9. Known Limitations (Honest & Transparent)

1. **Amadeus Test Environment:** Amadeus test sandbox has limited flight offers compared to production GDS. For routes not populated in the test sandbox, the system seamlessly falls back to the Mock Provider.
2. **Booking Prototype Simulation:** SkySafe simulates flight inventory booking in MongoDB; it does not issue live IATA airline tickets or charge real credit cards.
3. **Payment Gateway:** A production system would integrate Razorpay or Stripe between seat reservation and final booking confirmation.
