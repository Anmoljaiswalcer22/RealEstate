const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');

const { UPLOAD_DIR } = require('./config/upload');
const authRouter = require('./routes/auth.route');
const userRouter = require('./routes/user.route');
const listingRouter = require('./routes/listing.route');
const bookingRouter = require('./routes/booking.route');
const uploadRouter = require('./routes/upload.route');
const errorMiddleware = require('./middleware/error.middleware');
const { errorHandler } = require('./utils/error');

const app = express();

// ---- Global middleware ----
app.use(express.json({ limit: '100kb' })); // blocks oversized JSON payloads
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
// Removes keys starting with "$" or containing "." from body/query/params,
// so {"email": {"$gt": ""}} cannot reach MongoDB as an operator.
app.use(mongoSanitize());

// Uploaded images are served as static files
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));

// ---- API routes ----
app.get('/api/health', (req, res) => res.json({ success: true, status: 'ok' }));
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/listing', listingRouter);
app.use('/api/booking', bookingRouter);
app.use('/api/upload', uploadRouter);

// ---- Serve the React build in production (single deploy) ----
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get(/^\/(?!api|uploads).*/, (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

// ---- 404 + centralized error handler (must be last) ----
app.use('/api', (req, res, next) => next(errorHandler(404, 'Route not found')));
app.use(errorMiddleware);

module.exports = app;
