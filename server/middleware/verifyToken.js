const jwt = require('jsonwebtoken');
const { errorHandler } = require('../utils/error');

// Protects private routes: reads the access token from the httpOnly cookie
// (or an "Authorization: Bearer <token>" header, handy in Postman),
// verifies the signature and attaches req.user.
const verifyToken = (req, res, next) => {
  let token = req.cookies?.access_token;
  const header = req.headers.authorization;
  if (!token && header && header.startsWith('Bearer ')) token = header.slice(7);

  if (!token) return next(errorHandler(401, 'Unauthorized: please sign in'));

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) return next(errorHandler(401, 'Invalid or expired token'));
    req.user = { id: payload.id };
    next();
  });
};

module.exports = verifyToken;
