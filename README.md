# FullStack Estate Website

A real-estate platform where users can **browse properties for sale or rent, list their own properties with images, and book visits**.
The UI is simple. Most of the work is in the backend: RESTful routing, a modular API, input validation, secure file uploads, full authentication (bcrypt + JWT access/refresh tokens + Google OAuth via Firebase), MongoDB persistence, Jest tests and Postman docs.

---

## Table of contents

1. [Features](#1-features)
2. [Tech stack](#2-tech-stack)
3. [Project structure](#3-project-structure)
4. [Prerequisites (install these first)](#4-prerequisites-install-these-first)
5. [Setup and run: step by step](#5-setup-and-run-step-by-step)
6. [Try the app (a 5-minute walkthrough)](#6-try-the-app-a-5-minute-walkthrough)
7. [Run the tests](#7-run-the-tests)
8. [Test the API with Postman](#8-test-the-api-with-postman)
9. [API reference](#9-api-reference)
10. [How each feature works (and where the code is)](#10-how-each-feature-works-and-where-the-code-is)
11. [Build it yourself from scratch (the order I'd follow)](#11-build-it-yourself-from-scratch-the-order-id-follow)
12. [Deploy to Render (one service)](#12-deploy-to-render-one-service)
13. [Troubleshooting](#13-troubleshooting)
14. [Interview notes: what this build actually does](#14-interview-notes-what-this-build-actually-does)

---

## 1. Features

| Area | What you get |
|---|---|
| Browse | Home page with offers / rent / sale sections, search page with filters (type, offer, parking, furnished), sorting and "Show more" pagination |
| Listings | Create, edit and delete your own property with 1–6 images; only the owner can edit/delete |
| Bookings | Request a visit on a future date, owner confirms or cancels, guest can cancel, two-tab "Bookings" page |
| Auth | Sign up / sign in with email + password, "Continue with Google", silent token refresh, sign out, update / delete profile |
| Security | bcrypt hashing, JWT in httpOnly cookies, refresh-token rotation, ownership checks (403), NoSQL-injection protection, image byte checks |
| Quality | Centralized error handling, consistent JSON errors, Jest + Supertest tests on an in-memory DB, Postman collection |

## 2. Tech stack

- **Frontend:** React 18, Vite, React Router 6, Redux Toolkit + redux-persist, Tailwind CSS, Firebase Auth (Google popup)
- **Backend:** Node.js, Express 4, Mongoose 8 (MongoDB Atlas), bcryptjs, jsonwebtoken, cookie-parser, Multer, express-mongo-sanitize, firebase-admin (optional)
- **Testing / docs:** Jest, Supertest, mongodb-memory-server, Postman

## 3. Project structure

```
fullstack-estate/
├── package.json                 # helper scripts for the whole project (install, build, start)
├── postman/
│   └── FullStack-Estate.postman_collection.json
├── server/                      # Express REST API
│   ├── index.js                 # loads .env, connects MongoDB, starts the server
│   ├── app.js                   # express app: middleware, routes, error handler
│   ├── config/                  # db connection, upload settings
│   ├── routes/                  # URL + HTTP method -> controller
│   ├── controllers/             # business logic
│   ├── models/                  # Mongoose schemas: User, Listing, Booking
│   ├── middleware/              # verifyToken, validation, upload (Multer), error handler
│   ├── utils/                   # errorHandler(), tokens, listing rules, firebase admin
│   ├── uploads/                 # uploaded images are saved here
│   └── tests/                   # Jest + Supertest tests
└── client/                      # React app (Vite)
    └── src/
        ├── api/client.js        # fetch wrapper + automatic token refresh
        ├── components/          # Header, ListingCard, ImageSlider, FilterSidebar, FormInput, Button, OAuth, PrivateRoute, Status
        ├── pages/               # Home, Search, Listing, CreateListing (create + edit), Profile, SignIn, SignUp, MyBookings, NotFound
        ├── redux/               # store + user slice
        └── utils/               # image upload helpers, formatting
```

---

## 4. Prerequisites (install these first)

| Tool | Why | Get it |
|---|---|---|
| **Node.js 20 LTS** (18+ works) | runs the backend and the React dev server | https://nodejs.org → check with `node -v` and `npm -v` |
| **Git** | version control | https://git-scm.com |
| **VS Code** (or any editor) | editing code | https://code.visualstudio.com |
| **MongoDB Atlas account** (free) | the database | https://www.mongodb.com/cloud/atlas/register |
| **Firebase account** (free, optional) | "Continue with Google" | https://console.firebase.google.com |
| **Postman** | testing the API by hand | https://www.postman.com/downloads |

---

## 5. Setup and run: step by step

### Step 1: Get the code

Unzip the project (or clone your repo) and open a terminal inside the `fullstack-estate` folder.

```bash
cd fullstack-estate
git init            # if it's not a git repo yet
```

### Step 2: Create the MongoDB Atlas database

1. Log in to MongoDB Atlas → **Create** a new project (e.g. `estate`).
2. **Build a database** → choose the free **M0** cluster → pick a region close to you (e.g. Mumbai) → Create.
3. **Database Access** (left menu) → **Add New Database User** → username + password (save these) → role "Read and write to any database".
4. **Network Access** → **Add IP Address** → "Add current IP address". (For deployment later, add `0.0.0.0/0`.)
5. **Database** → **Connect** → **Drivers** → copy the connection string. It looks like:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Put your user and password in it, and add the database name `estate` after `.net/`:
   ```
   mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/estate?retryWrites=true&w=majority
   ```
   If your password has special characters like `@` or `#`, URL-encode them (e.g. `@` → `%40`).

### Step 3: Configure the backend `.env`

```bash
cd server
cp .env.example .env          # Windows PowerShell: copy .env.example .env
```

Open `server/.env` and fill in:

- `MONGO_URI`: the string from Step 2.
- `JWT_SECRET` and `JWT_REFRESH_SECRET`: two **different** long random strings. Generate each with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- Leave the rest as they are for now.

### Step 4 (optional): Set up Google sign-in with Firebase

The app works without this (the Google button just shows a note). To turn it on:

1. Firebase console → **Add project** → give it a name → you can disable Google Analytics.
2. **Build → Authentication → Get started → Sign-in method → Google → Enable** → pick a support email → Save.
3. **Project settings (gear icon) → General → Your apps → Web (`</>`)** → register an app (no hosting needed). You'll see a `firebaseConfig` object.
4. Create the frontend env file:
   ```bash
   cd ../client
   cp .env.example .env
   ```
   Copy `apiKey`, `authDomain`, `projectId` and `appId` into `client/.env`:
   ```
   VITE_FIREBASE_API_KEY=AIza...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project
   VITE_FIREBASE_APP_ID=1:123:web:abc
   ```
5. **Recommended (makes the backend verify Google logins):** Project settings → **Service accounts** → **Generate new private key**. This downloads a JSON file. Put its whole content on **one line** in `server/.env`:
   ```
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...","client_email":"..."}
   ```
   One-liner to print it on one line: `node -e "console.log(JSON.stringify(require('./serviceAccount.json')))"`.
   Never commit this file or value to GitHub.

`localhost` is already an authorized domain in Firebase. When you deploy, add your deployed domain under **Authentication → Settings → Authorized domains**.

### Step 5: Install dependencies

From the project root (`fullstack-estate/`):

```bash
npm run install:all
```

(This runs `npm install` in `server/` and in `client/`.)

### Step 6: Start the backend

```bash
cd server
npm run dev
```

You should see:

```
MongoDB connected
API running on http://localhost:3000
```

Check it: open http://localhost:3000/api/health → `{"success":true,"status":"ok"}`.

### Step 7: Start the frontend (in a second terminal)

```bash
cd client
npm run dev
```

Open **http://localhost:5173**. Vite forwards `/api` and `/uploads` to the backend on port 3000, so cookies work without any CORS setup.

---

## 6. Try the app (a 5-minute walkthrough)

You need **two accounts** to try bookings (you can't book your own listing).

1. **Sign up** as `owner` → sign in.
2. Click your avatar → **Profile** → **Create listing**. Fill the form, choose 1–6 images (under 2 MB each), click **Upload** (you'll see a progress bar per file), then **Create listing**.
3. Open the listing page: you'll see the image slider and an **Edit this listing** button.
4. **Sign out**. Sign up as `guest` (use a private window to stay logged in as both).
5. As `guest`: search for the listing from the header, open it, pick a date under **Book a visit**, and send the request.
6. As `owner`: open **Bookings → Requests on my listings** → **Confirm**.
7. As `guest`: **Bookings → My booking requests** now shows *confirmed*.
8. Try the security: in Postman, sign in as `guest` and call `POST /api/listing/update/<owner's listing id>` → you get **403**.

---

## 7. Run the tests

```bash
cd server
npm test               # all tests
npm run test:coverage  # with a coverage report in server/coverage/
```

- Tests use **mongodb-memory-server**, a throwaway in-memory MongoDB, so your Atlas data is never touched. The first run downloads a MongoDB binary (~100 MB), so it takes a minute.
- Firebase is **mocked** with `jest.mock()`, so tests don't need the network.

| File | What it checks |
|---|---|
| `tests/auth.test.js` | signup 201 / duplicate 409 / missing 400, password stored as bcrypt hash, wrong password 401, httpOnly cookies set, password never returned, NoSQL injection blocked, protected route 401, refresh-token rotation + reuse rejected, signout revokes, Google create / login / verified-token / forged-token |
| `tests/listing.test.js` | create needs auth, owner set from token (spoofed `userRef` ignored), discount rule, image limit, enum, 400 vs 404 ids, owner update/delete, **403 for other users**, search / filters / sort / pagination, regex input escaped |
| `tests/booking.test.js` | future-date rule, can't book own listing, duplicate pending 409, only owner confirms (403), guest cancels, populated lists |
| `tests/upload.test.js` | auth required, real images saved, wrong MIME rejected, **script disguised as .png rejected**, > 2 MB rejected |
| `tests/unit.test.js` | `errorHandler`, error middleware, `sanitizeUser`, listing rules, image byte detection |

---

## 8. Test the API with Postman

1. Postman → **Import** → choose `postman/FullStack-Estate.postman_collection.json`.
2. The collection variable `baseUrl` is `http://localhost:3000`. To switch to your deployed server, create an **Environment** with `baseUrl = https://your-app.onrender.com`.
3. Run **Auth → Sign Up**, then **Auth → Sign In**. Postman stores the `access_token` / `refresh_token` cookies automatically, and the test script saves `userId`.
4. **Listings → Create Listing** saves `listingId`; **Bookings → Create Booking** saves `bookingId` (sign in as a second user first).
5. For uploads: **Uploads → Upload Images** → Body → form-data → key `images` (type *File*) → pick images.
6. To publish docs: right-click the collection → **View documentation** → **Publish**.

Tip: you can also send the access token as a header: `Authorization: Bearer <token>`.

---

## 9. API reference

All responses are JSON. Errors always look like:

```json
{ "success": false, "statusCode": 403, "message": "You can only update your own listings" }
```

🔒 = needs to be signed in (access-token cookie or Bearer header).

### Auth: `/api/auth`

| Method | Path | Body | Result |
|---|---|---|---|
| POST | `/signup` | `{ username, email, password }` | 201 · 400 invalid · 409 duplicate |
| POST | `/signin` | `{ email, password }` | 200 user + cookies · 401 wrong credentials |
| POST | `/google` | `{ name, email, photo, idToken }` | 200 user + cookies (creates user if new) |
| POST | `/refresh` | (refresh cookie) | 200 new cookies · 401 revoked/expired |
| GET | `/signout` | | 200, cookies cleared, refresh token revoked |

### Listings: `/api/listing`

| Method | Path | Notes |
|---|---|---|
| POST | `/create` 🔒 | body: `name, description, address, regularPrice, discountPrice, bedrooms, bathrooms, furnished, parking, offer, type ('rent'/'sale'), imageUrls[]` |
| GET | `/get/:id` | 400 bad id · 404 missing |
| GET | `/get?searchTerm=&type=&offer=&parking=&furnished=&sort=&order=&limit=&startIndex=` | `type`: rent / sale / all · `sort`: createdAt / regularPrice · `order`: asc / desc · `limit` max 50 (default 9) |
| POST | `/update/:id` 🔒 | owner only, else 403 |
| DELETE | `/delete/:id` 🔒 | owner only, also deletes its bookings |

### Bookings: `/api/booking`

| Method | Path | Notes |
|---|---|---|
| POST | `/create` 🔒 | `{ listingId, visitDate, message? }`, date must be in the future, can't book own listing, one pending booking per listing |
| GET | `/user` 🔒 | bookings I made (listing populated) |
| GET | `/owner` 🔒 | requests on my listings (listing + guest populated) |
| PATCH | `/:id/status` 🔒 | `{ status: 'confirmed' \| 'cancelled' }`: owner can confirm/cancel, guest can cancel |

### Users: `/api/user`

| Method | Path | Notes |
|---|---|---|
| POST | `/update/:id` 🔒 | self only; `username, email, avatar, password?` |
| DELETE | `/delete/:id` 🔒 | self only; also deletes their listings and bookings |
| GET | `/listings/:id` 🔒 | self only |
| GET | `/:id` 🔒 | public contact info: username, email, avatar |

### Uploads: `/api/upload`

| Method | Path | Notes |
|---|---|---|
| POST | `/` 🔒 | `multipart/form-data`, field `images`, up to 6 files, 2 MB each, JPEG/PNG/WEBP/GIF → `201 { urls: ['/uploads/....png'] }` |

---

## 10. How each feature works (and where the code is)

### Modular backend (separation of concerns)
`routes/` only map URLs to functions, `controllers/` hold the logic, `models/` define data, `middleware/` handles cross-cutting work (auth, validation, uploads, errors). Adding "reviews" means a new route + controller + model with no changes to existing files.

### Centralized error handling
Every controller does `try { ... } catch (error) { next(error) }` or `return next(errorHandler(403, '...'))` (`utils/error.js`). One middleware at the end (`middleware/error.middleware.js`) formats everything and also converts Mongo duplicate-key errors (code 11000) to **409**, Mongoose validation errors to **400**, Multer errors to **400**.

### Search, filters, pagination
`controllers/listing.controller.js → getListings` builds the Mongo query from query params. The search term is **regex-escaped** (so `.*` can't be used to match everything or slow the server), the sort field is **whitelisted**, and `limit` is capped at 50. Pagination is `.skip(startIndex).limit(limit)`; the frontend shows "Show more" when a full page (9) came back.

### Input validation (two levels)
- **Frontend:** instant feedback (password length, image count/size, discount < price). UX only.
- **Backend:** `middleware/validate.js` (fields must be strings → blocks `{"$gt": ""}`), `express-mongo-sanitize` (removes `$` keys), Mongoose schema validators (required, min/max, enum, unique), and business rules in `utils/validateListing.js` (discount < regular price, 1–6 images). `pickListingFields` whitelists fields, so a user can't set `userRef` to someone else.

### File uploads
Images are uploaded to **this server with Multer** (`middleware/upload.js`, `controllers/upload.controller.js`):
1. Frontend checks type/size, then uploads all files **in parallel with `Promise.all`**, one request per file so each has its own progress bar (`client/src/utils/uploadImages.js`).
2. Multer (`memoryStorage`) enforces 2 MB / 6 files and allowed MIME types.
3. The controller checks the file's **magic bytes** (a script renamed `photo.png` is rejected), saves it under a random name, and returns its URL.
4. Only the URLs are stored in the listing's `imageUrls` array, never the binary data (MongoDB documents max out at 16 MB and DBs aren't built for large files).

Why not Firebase Storage? New Firebase projects need the paid Blaze plan for Storage, and Multer shows more backend skill. To move to the cloud later (Cloudinary, S3, Firebase Storage), only `upload.controller.js` changes.

### Authentication
- **bcrypt** (`bcryptjs`, same API, no native build): `bcrypt.hash(password, 10)` on signup, `bcrypt.compare()` on signin. The salt is stored inside the hash string (`$2a$10$<22-char salt><31-char hash>`).
- **Passwords are never returned:** `utils/sanitizeUser.js` strips `password` and `refreshTokenHash` (`const { password, ...rest } = user._doc`).
- **JWT access token** (15 min) + **refresh token** (7 days), both in **httpOnly cookies** with `sameSite: 'lax'` and `secure` in production (`utils/tokens.js`). The refresh cookie is scoped to `/api/auth` so it's only sent to refresh/signout.
- **Refresh rotation:** only a SHA-256 hash of the current refresh token is stored on the user. Each `/refresh` issues a new pair and the old token stops working. Reusing an old one revokes the session.
- **Silent refresh on the frontend:** `client/src/api/client.js` catches a 401, calls `/api/auth/refresh` once (shared by parallel requests), then retries.
- **verifyToken** (`middleware/verifyToken.js`) checks the signature, attaches `req.user`, or returns 401.
- **Authorization:** controllers compare `listing.userRef` with `req.user.id` and return **403** if they differ.

### Google OAuth via Firebase
`client/src/components/OAuth.jsx` opens the Google popup with Firebase and sends `{ name, email, photo, idToken }` to `POST /api/auth/google`. If `FIREBASE_SERVICE_ACCOUNT` is set, the backend **verifies the ID token with firebase-admin** and uses the verified email, so someone can't log in as another user by posting their email. New Google users get a random bcrypt-hashed password. After that, it's the same JWT flow as normal login.

### Database design
- **User:** username (unique), email (unique, lowercase), password (hash), avatar, refreshTokenHash, timestamps.
- **Listing:** name, description, address, regularPrice, discountPrice, bedrooms, bathrooms, furnished, parking, offer, type (enum), `imageUrls` (**embedded**, max 6), `userRef` (**reference**, indexed), timestamps. Compound index `{ type: 1, offer: 1, createdAt: -1 }`.
- **Booking:** listingId, userId, ownerId (all references, indexed), visitDate, message, status (`pending` / `confirmed` / `cancelled`), timestamps. `populate()` fills in the listing and guest details.

### Frontend
Reusable components (`ListingCard` used on Home, Search and Profile; `FormInput`, `Button`, `ImageSlider`, `FilterSidebar`). `PrivateRoute` redirects logged-out users to `/sign-in` and back afterwards. **This is only for UX**: the API checks the token on every protected request. Redux keeps only the public profile (persisted to localStorage); the token itself is never readable by JavaScript.

---

## 11. Build it yourself from scratch (the order I'd follow)

If you want to recreate the project by hand (best way to be able to explain it in an interview), go in this order. Use the files in this repo as the reference for each step.

### Phase 1: Backend skeleton
```bash
mkdir fullstack-estate && cd fullstack-estate
mkdir server && cd server
npm init -y
npm install express mongoose dotenv cookie-parser cors
npm install -D nodemon
```
1. Add `"dev": "nodemon index.js"` to `scripts`.
2. Create `config/db.js` (connect Mongoose), `app.js` (express + `express.json()` + `cookieParser()`), `index.js` (load `.env`, connect, listen).
3. Create `.env` with `MONGO_URI` and a `.gitignore` containing `node_modules` and `.env`.
4. Add `GET /api/health` and check it in the browser.

### Phase 2: Error handling first
5. `utils/error.js` → `errorHandler(statusCode, message)`.
6. `middleware/error.middleware.js` → the single error formatter, registered **last** in `app.js`.

### Phase 3: Users and authentication
```bash
npm install bcryptjs jsonwebtoken
```
7. `models/user.model.js`.
8. `controllers/auth.controller.js` → `signup` (hash with bcrypt) and `signin` (compare, sign JWT, set httpOnly cookie).
9. `routes/auth.route.js` → mount at `/api/auth`. Test both in Postman.
10. `middleware/verifyToken.js`.
11. Add refresh tokens: `utils/tokens.js` (`issueTokens`, rotation with a stored hash), `/refresh` and `/signout`.

### Phase 4: Listings CRUD + search
12. `models/listing.model.js` with validators and indexes.
13. `utils/validateListing.js` (business rules + field whitelist).
14. `controllers/listing.controller.js` → create, get one, update (owner check), delete (owner check), search with filters/sort/pagination.
15. `routes/listing.route.js`. Test every endpoint in Postman, including the 403 case with a second user.

### Phase 5: Users, bookings, uploads
16. `controllers/user.controller.js` + routes (update profile, delete account, my listings, contact info).
17. `models/booking.model.js` + `controllers/booking.controller.js` + routes.
18. `npm install multer` → `config/upload.js`, `middleware/upload.js`, `controllers/upload.controller.js`, serve `/uploads` statically.

### Phase 6: Hardening
```bash
npm install express-mongo-sanitize
```
19. `middleware/validate.js` (`requireStrings`, `validateObjectId`), `app.use(mongoSanitize())`, JSON body limit.

### Phase 7: Tests
```bash
npm install -D jest supertest mongodb-memory-server
```
20. Add the `jest` block to `package.json` and `"test": "jest --runInBand"`.
21. `tests/env.js`, `tests/helpers/db.js`, `tests/helpers/factory.js`, then the test files. Make sure `app.js` **exports** the app and `index.js` is the only file that calls `listen()`. That split is what lets Supertest run the app without starting a server.

### Phase 8: Frontend skeleton
```bash
cd ..
npm create vite@latest client -- --template react
cd client
npm install react-router-dom @reduxjs/toolkit react-redux redux-persist react-icons firebase
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p
```
22. Configure `tailwind.config.js` content paths and the three `@tailwind` lines in `src/index.css`.
23. Add the `/api` and `/uploads` **proxy** in `vite.config.js`.
24. `src/api/client.js` (fetch wrapper with `credentials: 'include'`).
25. Redux store + `userSlice`, wrap the app in `Provider`, `PersistGate`, `BrowserRouter` (`main.jsx`).

### Phase 9: Frontend pages and components
26. `Header`, `PrivateRoute`, `Button`, `FormInput`, `Status`.
27. `SignUp`, `SignIn` → then `OAuth` + `firebase.js` once Firebase is set up.
28. `Profile` (update, avatar upload, sign out, delete, my listings).
29. `CreateListing` with `utils/uploadImages.js` (parallel uploads + progress), reused for editing.
30. `ListingCard`, `ImageSlider`, `Listing` page (booking form, contact owner).
31. `FilterSidebar` + `Search` page (URL query params, Show more), then `Home`.
32. `MyBookings`, `NotFound`.

### Phase 10: Docs and deploy
33. Build the Postman collection while you test (folders: Auth, Listings, Bookings, Users, Uploads).
34. Root `package.json` with `build` / `start` scripts, then deploy (next section).

Commit after every phase (`git add . && git commit -m "phase 3: auth"`). A clean commit history looks good to interviewers too.

---

## 12. Deploy to Render (one service)

The Express server serves the built React app in production, so you deploy one thing.

1. Push the project to GitHub (check that `.env` files are **not** committed).
2. https://render.com → **New → Web Service** → connect your repo.
3. Settings:
   - **Root directory:** *(leave empty: project root)*
   - **Build command:** `npm run build`
   - **Start command:** `npm start`
4. **Environment variables:** `NODE_ENV=production`, `MONGO_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CLIENT_URL=https://<your-app>.onrender.com`, optionally `FIREBASE_SERVICE_ACCOUNT`, and the four `VITE_FIREBASE_*` values (Vite reads them at build time).
5. MongoDB Atlas → Network Access → allow `0.0.0.0/0`.
6. Firebase → Authentication → Settings → **Authorized domains** → add `<your-app>.onrender.com`.

Note: on Render's free plan the disk is **wiped on every deploy/restart**, so uploaded images disappear. For a permanent demo, attach a Render Disk and set `UPLOAD_DIR` to its mount path, or move uploads to Cloudinary/S3 (only `upload.controller.js` changes).

---

## 13. Troubleshooting

| Problem | Fix |
|---|---|
| `Missing environment variables` on start | You didn't create `server/.env` (Step 3). |
| `MongoServerError: bad auth` | Wrong DB user/password in `MONGO_URI`, or a special character in the password that isn't URL-encoded. |
| `querySrv ENOTFOUND` / timeout connecting to Atlas | Your IP isn't in Network Access, or your network blocks port 27017 (try a phone hotspot). |
| Logged in, but every API call returns 401 | Open the app on `http://localhost:5173` (not `127.0.0.1`), and make sure the backend is on port 3000 so the Vite proxy works. |
| Google popup: `auth/unauthorized-domain` | Add the domain in Firebase → Authentication → Settings → Authorized domains. |
| Google popup: `auth/configuration-not-found` | Google provider isn't enabled in Firebase Authentication. |
| `/api/auth/google` returns 401 "Missing Google ID token" | `FIREBASE_SERVICE_ACCOUNT` is set (good). The frontend must send `idToken`, which `OAuth.jsx` already does. In Postman you need a real token. |
| Image upload: "is not a valid image file" | The file isn't really a JPEG/PNG/WEBP/GIF (e.g. HEIC from iPhone). Convert it first. |
| First `npm test` is slow or fails downloading | mongodb-memory-server downloads MongoDB on the first run; check your internet and re-run. |
| Port 3000 already in use | Change `PORT` in `server/.env` **and** the proxy target in `client/vite.config.js`. |

---

## 14. Interview notes: what this build actually does

Your notes had a "verify before the interview" list. Here's what's true for this code:

| Question | Answer for this build |
|---|---|
| Where are images stored? | On the server via **Multer** (`server/uploads`), max **6** per listing, **2 MB** each, checked by MIME type **and** magic bytes. |
| JWT in cookie or localStorage? Expiry? | **httpOnly cookies.** Access token **15 min**, refresh token **7 days** (configurable in `.env`). |
| Does the Booking model exist? | Yes: `listingId`, `userId`, `ownerId`, `visitDate`, `message`, `status` (pending / confirmed / cancelled), timestamps. |
| Do you verify the Firebase ID token on the backend? | **Yes, when `FIREBASE_SERVICE_ACCOUNT` is set** (`admin.auth().verifyIdToken`). Without it (local demo), the backend falls back to trusting the email. Say you'd always set it in production. |
| Refresh tokens: "pluggable" or real? | **Implemented:** `POST /api/auth/refresh` with rotation and reuse detection; only a hash is stored. |
| Which Jest tests? Which DB? | See [section 7](#7-run-the-tests). In-memory DB (**mongodb-memory-server**), Firebase mocked with `jest.mock()`. |
| bcrypt or bcryptjs? | `bcryptjs`: same API and algorithm, pure JS (no native build). Hashes start with `$2a$10$`. |

**Good "what would you improve?" answers:**
- Rate limiting on `/api/auth/*` (e.g. `express-rate-limit`) against brute-force login.
- A MongoDB **text index** or Atlas Search instead of `$regex` once there's a lot of data.
- Move uploads to Cloudinary / S3 + CDN, and delete image files when a listing is deleted.
- Store several refresh tokens per user (one per device) so you can log out of one device.
- Email verification and "forgot password".
- Frontend tests with React Testing Library, and a GitHub Actions workflow running `npm test` on every push.
