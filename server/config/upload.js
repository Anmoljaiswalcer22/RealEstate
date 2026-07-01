const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const MAX_FILES = 6;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

module.exports = { UPLOAD_DIR, MAX_FILE_SIZE, MAX_FILES, ALLOWED_MIME_TYPES };
