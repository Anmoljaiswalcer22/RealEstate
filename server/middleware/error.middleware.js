// Centralized error handler: every controller calls next(error),
// and every error leaves the API in the same JSON shape.
// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (err.code === 11000) {
    // Duplicate key from a unique index (email / username)
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'Value';
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}`;
  } else if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') message = 'Each image must be under 2 MB';
    else if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') message = 'You can upload at most 6 images';
  } else if (err.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Request body is too large';
  } else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Malformed JSON body';
  }

  if (statusCode >= 500) {
    if (process.env.NODE_ENV !== 'test') console.error(err);
    if (process.env.NODE_ENV === 'production') message = 'Internal Server Error';
  }

  res.status(statusCode).json({ success: false, statusCode, message });
};
