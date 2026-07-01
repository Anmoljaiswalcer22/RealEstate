const { errorHandler } = require('../utils/error');

// Ensures the given body fields exist AND are strings.
// Blocks NoSQL injection like {"email": {"$gt": ""}} even if sanitizing were skipped.
const requireStrings = (...fields) => (req, res, next) => {
  for (const field of fields) {
    const value = req.body?.[field];
    if (value === undefined || value === null || value === '') {
      return next(errorHandler(400, `${field} is required`));
    }
    if (typeof value !== 'string') {
      return next(errorHandler(400, `${field} must be a string`));
    }
  }
  next();
};

const OBJECT_ID = /^[a-f\d]{24}$/i;

// Rejects malformed MongoDB ids with 400 instead of letting Mongoose throw
const validateObjectId = (param = 'id') => (req, res, next) => {
  if (!OBJECT_ID.test(req.params[param])) return next(errorHandler(400, `Invalid ${param}`));
  next();
};

const isObjectId = (value) => typeof value === 'string' && OBJECT_ID.test(value);

module.exports = { requireStrings, validateObjectId, isObjectId };
