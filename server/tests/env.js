// Runs before every test file (see "setupFiles" in package.json)
const os = require('os');
const path = require('path');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.UPLOAD_DIR = path.join(os.tmpdir(), 'estate-test-uploads');
delete process.env.FIREBASE_SERVICE_ACCOUNT;
