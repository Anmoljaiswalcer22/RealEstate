const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user.model');
const { errorHandler } = require('../utils/error');
const sanitizeUser = require('../utils/sanitizeUser');
const { issueTokens, clearAuthCookies, hashToken } = require('../utils/tokens');
const firebaseAdmin = require('../utils/firebaseAdmin');

const SALT_ROUNDS = 10; // cost factor: 2^10 iterations

// POST /api/auth/signup
exports.signup = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    if (password.length < 6) return next(errorHandler(400, 'Password must be at least 6 characters'));

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS); // salt is generated + stored inside the hash
    await User.create({ username: username.trim(), email, password: hashedPassword });

    res.status(201).json({ success: true, message: 'User created successfully' });
  } catch (error) {
    next(error); // duplicate email/username -> 409 in the error middleware
  }
};

// POST /api/auth/signin
exports.signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Same message for "no user" and "wrong password" so attackers can't discover emails
    const valid = user && (await bcrypt.compare(password, user.password));
    if (!valid) return next(errorHandler(401, 'Invalid email or password'));

    await issueTokens(res, user);
    res.status(200).json(sanitizeUser(user));
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/google
exports.google = async (req, res, next) => {
  try {
    let { email, name, photo } = req.body;
    const { idToken } = req.body;

    // Production-grade: verify the Firebase ID token and use the VERIFIED email
    if (firebaseAdmin.isConfigured()) {
      if (typeof idToken !== 'string' || !idToken) return next(errorHandler(401, 'Missing Google ID token'));
      let decoded;
      try {
        decoded = await firebaseAdmin.verifyIdToken(idToken);
      } catch {
        return next(errorHandler(401, 'Invalid Google ID token'));
      }
      email = decoded.email;
      name = decoded.name || name;
      photo = decoded.picture || photo;
    }

    if (typeof email !== 'string' || !email) return next(errorHandler(400, 'email is required'));

    let user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      // The schema requires a password; a random hashed one means nobody can
      // log in to this account with a password unless they set one later.
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, SALT_ROUNDS);
      const base =
        (typeof name === 'string' && name ? name : email.split('@')[0])
          .replace(/\s+/g, '')
          .toLowerCase()
          .slice(0, 20) || 'user';

      user = await User.create({
        username: `${base}${crypto.randomBytes(2).toString('hex')}`,
        email,
        password: hashedPassword,
        avatar: typeof photo === 'string' && photo ? photo : undefined,
      });
    }

    // From here it's exactly the same as a normal login
    await issueTokens(res, user);
    res.status(200).json(sanitizeUser(user));
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/refresh  — rotates the refresh token
exports.refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refresh_token;
    if (!token) return next(errorHandler(401, 'No refresh token'));

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      clearAuthCookies(res);
      return next(errorHandler(401, 'Invalid or expired refresh token'));
    }

    const user = await User.findById(payload.id);
    if (!user || user.refreshTokenHash !== hashToken(token)) {
      // Token was already used (or user logged out): possible theft -> revoke the session
      if (user) {
        user.refreshTokenHash = null;
        await user.save({ validateBeforeSave: false });
      }
      clearAuthCookies(res);
      return next(errorHandler(401, 'Refresh token has been revoked'));
    }

    await issueTokens(res, user); // new access token + new refresh token
    res.status(200).json(sanitizeUser(user));
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/signout
exports.signout = async (req, res, next) => {
  try {
    const token = req.cookies?.refresh_token;
    if (token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        await User.findByIdAndUpdate(payload.id, { refreshTokenHash: null }); // revoke server-side
      } catch {
        // token already invalid, nothing to revoke
      }
    }
    clearAuthCookies(res);
    res.status(200).json({ success: true, message: 'User has been logged out' });
  } catch (error) {
    next(error);
  }
};
