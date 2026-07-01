const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, minlength: 3, maxlength: 100 },
    description: { type: String, required: [true, 'Description is required'], trim: true, maxlength: 2000 },
    address: { type: String, required: [true, 'Address is required'], trim: true, maxlength: 200 },
    regularPrice: { type: Number, required: true, min: [1, 'Regular price must be at least 1'] },
    discountPrice: { type: Number, default: 0, min: [0, 'Discount price cannot be negative'] },
    bedrooms: { type: Number, required: true, min: 1, max: 50 },
    bathrooms: { type: Number, required: true, min: 1, max: 50 },
    furnished: { type: Boolean, default: false },
    parking: { type: Boolean, default: false },
    offer: { type: Boolean, default: false },
    type: { type: String, required: true, enum: { values: ['rent', 'sale'], message: "type must be 'rent' or 'sale'" } },
    // Embedded: always read with the listing, small, max 6
    imageUrls: {
      type: [String],
      validate: {
        validator: (arr) => arr.length >= 1 && arr.length <= 6,
        message: 'A listing needs between 1 and 6 images',
      },
    },
    // Referenced: one user can own unlimited listings
    userRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

// Compound index for the most common search filters + sort
listingSchema.index({ type: 1, offer: 1, createdAt: -1 });

module.exports = mongoose.model('Listing', listingSchema);
