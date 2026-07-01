const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { UPLOAD_DIR } = require('../config/upload');
const { errorHandler } = require('../utils/error');

// Checks the file's real bytes ("magic numbers"), not just the name or MIME type
// the browser claims. A script renamed to photo.png will fail here.
function detectImageType(buffer) {
  if (!buffer || buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp';
  if (buffer.subarray(0, 3).toString('ascii') === 'GIF') return 'gif';
  return null;
}

// POST /api/upload  (protected, multipart/form-data, field name "images")
exports.uploadImages = async (req, res, next) => {
  try {
    const files = req.files || [];
    if (!files.length) return next(errorHandler(400, 'No images uploaded'));

    const checked = files.map((file) => ({ file, ext: detectImageType(file.buffer) }));
    const bad = checked.find((c) => !c.ext);
    if (bad) return next(errorHandler(400, `${bad.file.originalname} is not a valid image file`));

    // Random file names: never trust (or reuse) the user's file name
    const urls = await Promise.all(
      checked.map(async ({ file, ext }) => {
        const fileName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
        await fs.promises.writeFile(path.join(UPLOAD_DIR, fileName), file.buffer);
        return `/uploads/${fileName}`;
      })
    );

    res.status(201).json({ success: true, urls });
  } catch (error) {
    next(error);
  }
};

exports.detectImageType = detectImageType;
