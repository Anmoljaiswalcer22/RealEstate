const Booking = require('../models/booking.model');
const Listing = require('../models/listing.model');
const { errorHandler } = require('../utils/error');
const { isObjectId } = require('../middleware/validate');

const LISTING_FIELDS = 'name address imageUrls type regularPrice discountPrice offer';

// POST /api/booking/create  (protected)
exports.createBooking = async (req, res, next) => {
  try {
    const { listingId, visitDate, message } = req.body;

    if (!isObjectId(listingId)) return next(errorHandler(400, 'Invalid listingId'));
    if (message !== undefined && typeof message !== 'string') return next(errorHandler(400, 'message must be a string'));

    const date = new Date(visitDate);
    if (!visitDate || Number.isNaN(date.getTime())) return next(errorHandler(400, 'A valid visitDate is required'));
    if (date.getTime() <= Date.now()) return next(errorHandler(400, 'Visit date must be in the future'));

    const listing = await Listing.findById(listingId);
    if (!listing) return next(errorHandler(404, 'Listing not found'));
    if (listing.userRef.toString() === req.user.id) {
      return next(errorHandler(400, 'You cannot book your own listing'));
    }

    const existing = await Booking.findOne({ listingId, userId: req.user.id, status: 'pending' });
    if (existing) return next(errorHandler(409, 'You already have a pending booking for this property'));

    const booking = await Booking.create({
      listingId,
      userId: req.user.id,
      ownerId: listing.userRef,
      visitDate: date,
      message: message || '',
    });

    res.status(201).json(await booking.populate('listingId', LISTING_FIELDS));
  } catch (error) {
    next(error);
  }
};

// GET /api/booking/user  — bookings I made
exports.getUserBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .populate('listingId', LISTING_FIELDS); // populate() works like a JOIN
    res.status(200).json(bookings);
  } catch (error) {
    next(error);
  }
};

// GET /api/booking/owner  — booking requests on my listings
exports.getOwnerBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ ownerId: req.user.id })
      .sort({ createdAt: -1 })
      .populate('listingId', LISTING_FIELDS)
      .populate('userId', 'username email avatar');
    res.status(200).json(bookings);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/booking/:id/status  — owner confirms/cancels, guest can cancel
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['confirmed', 'cancelled'].includes(status)) {
      return next(errorHandler(400, "status must be 'confirmed' or 'cancelled'"));
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return next(errorHandler(404, 'Booking not found'));

    const isOwner = booking.ownerId.toString() === req.user.id;
    const isGuest = booking.userId.toString() === req.user.id;
    if (!isOwner && !isGuest) return next(errorHandler(403, 'You are not part of this booking'));
    if (status === 'confirmed' && !isOwner) {
      return next(errorHandler(403, 'Only the property owner can confirm a booking'));
    }
    if (booking.status === 'cancelled') return next(errorHandler(400, 'This booking is already cancelled'));

    booking.status = status;
    await booking.save();
    res.status(200).json(await booking.populate('listingId', LISTING_FIELDS));
  } catch (error) {
    next(error);
  }
};
