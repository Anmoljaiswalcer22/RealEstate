const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true, // creates a unique index (not a validator): duplicates throw error 11000
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username must be at most 30 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String, // bcrypt hash, never plain text
      required: [true, 'Password is required'],
    },
    avatar: {
      type: String,
      default: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
    },
    refreshTokenHash: {
      type: String, // SHA-256 of the current refresh token (for rotation / logout)
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
