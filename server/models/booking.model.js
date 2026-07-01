const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // who booked
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // listing owner
    visitDate: { type: Date, required: [true, 'Visit date is required'] },
    message: { type: String, trim: true, maxlength: 500, default: '' },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
