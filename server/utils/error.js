// Creates an Error with an HTTP status code. Controllers call
// next(errorHandler(403, 'message')) and the error middleware formats it.
const errorHandler = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

module.exports = { errorHandler };
