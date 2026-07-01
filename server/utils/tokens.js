const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const accessMinutes = () => Number(process.env.ACCESS_TOKEN_MINUTES) || 15;
const refreshDays = () => Number(process.env.REFRESH_TOKEN_DAYS) || 7;

const baseCookie = () => ({
  httpOnly: true, // JavaScript in the browser cannot read it (XSS protection)
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'lax', // basic CSRF protection
});

// Refresh cookie is only sent to /api/auth/* (refresh + signout), never to other routes
const REFRESH_COOKIE_PATH = '/api/auth';

const signAccessToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: `${accessMinutes()}m` });

const signRefreshToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: `${refreshDays()}d`,
    jwtid: crypto.randomUUID(), // makes every refresh token unique
  });

// Only a SHA-256 hash of the refresh token is stored, so a DB leak doesn't leak sessions
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// Issues a new access + refresh token pair and stores the refresh token hash.
// Calling this on every refresh = refresh token ROTATION (old token stops working).
async function issueTokens(res, user) {
  const accessToken = signAccessToken(user._id.toString());
  const refreshToken = signRefreshToken(user._id.toString());

  user.refreshTokenHash = hashToken(refreshToken);
  await user.save({ validateBeforeSave: false });

  res.cookie('access_token', accessToken, {
    ...baseCookie(),
    maxAge: accessMinutes() * 60 * 1000,
  });
  res.cookie('refresh_token', refreshToken, {
    ...baseCookie(),
    path: REFRESH_COOKIE_PATH,
    maxAge: refreshDays() * 24 * 60 * 60 * 1000,
  });

  return { accessToken, refreshToken };
}

function clearAuthCookies(res) {
  res.clearCookie('access_token', baseCookie());
  res.clearCookie('refresh_token', { ...baseCookie(), path: REFRESH_COOKIE_PATH });
}

module.exports = { signAccessToken, signRefreshToken, hashToken, issueTokens, clearAuthCookies };
