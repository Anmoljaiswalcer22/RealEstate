const bcrypt = require('bcryptjs');

const User = require('../models/user.model');
const Listing = require('../models/listing.model');
const Booking = require('../models/booking.model');
const { errorHandler } = require('../utils/error');
const sanitizeUser = require('../utils/sanitizeUser');
const { clearAuthCookies } = require('../utils/tokens');

const isSelf = (req) => req.user.id === req.params.id;

// POST /api/user/update/:id
exports.updateUser = async (req, res, next) => {
  try {
    if (!isSelf(req)) return next(errorHandler(403, 'You can only update your own account'));

    const updates = {};
    for (const field of ['username', 'email', 'avatar']) {
      const value = req.body[field];
      if (value === undefined) continue;
      if (typeof value !== 'string' || !value.trim()) return next(errorHandler(400, `${field} must be a non-empty string`));
      updates[field] = value.trim();
    }

    const { password } = req.body;
    if (password !== undefined && password !== '') {
      if (typeof password !== 'string' || password.length < 6) {
        return next(errorHandler(400, 'Password must be at least 6 characters'));
      }
      updates.password = await bcrypt.hash(password, 10);
    }

    const user = await User.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: true });
    if (!user) return next(errorHandler(404, 'User not found'));

    res.status(200).json(sanitizeUser(user));
  } catch (error) {
    next(error);
  }
};

// DELETE /api/user/delete/:id
exports.deleteUser = async (req, res, next) => {
  try {
    if (!isSelf(req)) return next(errorHandler(403, 'You can only delete your own account'));

    const listingIds = (await Listing.find({ userRef: req.params.id }).select('_id')).map((l) => l._id);
    await Booking.deleteMany({
      $or: [{ userId: req.params.id }, { ownerId: req.params.id }, { listingId: { $in: listingIds } }],
    });
    await Listing.deleteMany({ userRef: req.params.id });
    await User.findByIdAndDelete(req.params.id);

    clearAuthCookies(res);
    res.status(200).json({ success: true, message: 'User has been deleted' });
  } catch (error) {
    next(error);
  }
};

// GET /api/user/listings/:id  — a user's own listings
exports.getUserListings = async (req, res, next) => {
  try {
    if (!isSelf(req)) return next(errorHandler(403, 'You can only view your own listings'));
    const listings = await Listing.find({ userRef: req.params.id }).sort({ createdAt: -1 });
    res.status(200).json(listings);
  } catch (error) {
    next(error);
  }
};

// GET /api/user/:id  — public contact info of a listing owner (signed-in users only)
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('username email avatar');
    if (!user) return next(errorHandler(404, 'User not found'));
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};
