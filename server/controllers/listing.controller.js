const Listing = require('../models/listing.model');
const Booking = require('../models/booking.model');
const { errorHandler } = require('../utils/error');
const { pickListingFields, validateListingInput } = require('../utils/validateListing');

const SORTABLE_FIELDS = ['createdAt', 'regularPrice'];
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// POST /api/listing/create  (protected)
exports.createListing = async (req, res, next) => {
  try {
    const data = pickListingFields(req.body);
    const problem = validateListingInput(data);
    if (problem) return next(errorHandler(400, problem));

    const listing = await Listing.create({ ...data, userRef: req.user.id });
    res.status(201).json(listing);
  } catch (error) {
    next(error);
  }
};

// GET /api/listing/get/:id
exports.getListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return next(errorHandler(404, 'Listing not found'));
    res.status(200).json(listing);
  } catch (error) {
    next(error);
  }
};

// POST /api/listing/update/:id  (protected, owner only)
exports.updateListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return next(errorHandler(404, 'Listing not found'));
    if (listing.userRef.toString() !== req.user.id) {
      return next(errorHandler(403, 'You can only update your own listings'));
    }

    const updates = pickListingFields(req.body);
    const problem = validateListingInput({ ...listing.toObject(), ...updates });
    if (problem) return next(errorHandler(400, problem));

    const updated = await Listing.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: true });
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/listing/delete/:id  (protected, owner only)
exports.deleteListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return next(errorHandler(404, 'Listing not found'));
    if (listing.userRef.toString() !== req.user.id) {
      return next(errorHandler(403, 'You can only delete your own listings'));
    }

    await Listing.findByIdAndDelete(req.params.id);
    await Booking.deleteMany({ listingId: req.params.id });
    res.status(200).json({ success: true, message: 'Listing has been deleted' });
  } catch (error) {
    next(error);
  }
};

// GET /api/listing/get?searchTerm=&type=&offer=&parking=&furnished=&sort=&order=&limit=&startIndex=
exports.getListings = async (req, res, next) => {
  try {
    const q = req.query;
    const limit = Math.min(Math.max(parseInt(q.limit, 10) || 9, 1), 50);
    const startIndex = Math.max(parseInt(q.startIndex, 10) || 0, 0);

    const filter = {};
    if (q.offer === 'true') filter.offer = true;
    if (q.parking === 'true') filter.parking = true;
    if (q.furnished === 'true') filter.furnished = true;
    if (q.type === 'rent' || q.type === 'sale') filter.type = q.type; // 'all' or missing = both

    const searchTerm = typeof q.searchTerm === 'string' ? q.searchTerm.trim().slice(0, 100) : '';
    if (searchTerm) {
      // Escaped so user input can't inject regex patterns (ReDoS); 'i' = case-insensitive
      filter.name = { $regex: escapeRegex(searchTerm), $options: 'i' };
    }

    const sortField = SORTABLE_FIELDS.includes(q.sort) ? q.sort : 'createdAt';
    const order = q.order === 'asc' ? 1 : -1;

    const listings = await Listing.find(filter)
      .sort({ [sortField]: order })
      .skip(startIndex)
      .limit(limit);

    res.status(200).json(listings);
  } catch (error) {
    next(error);
  }
};
