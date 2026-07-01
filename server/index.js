require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 3000;

const required = ['MONGO_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing environment variables: ${missing.join(', ')}`);
  console.error('Copy server/.env.example to server/.env and fill it in.');
  process.exit(1);
}

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Could not connect to MongoDB:', err.message);
    process.exit(1);
  });
