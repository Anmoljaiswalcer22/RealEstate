const multer = require('multer');
const { MAX_FILE_SIZE, MAX_FILES, ALLOWED_MIME_TYPES } = require('../config/upload');
const { errorHandler } = require('../utils/error');

// memoryStorage keeps the file in RAM so we can inspect its bytes before saving it
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) return cb(null, true);
    cb(errorHandler(400, 'Only JPEG, PNG, WEBP or GIF images are allowed'));
  },
});

module.exports = upload;
