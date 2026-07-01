const express = require('express');
const {
  createBooking,
  getUserBookings,
  getOwnerBookings,
  updateBookingStatus,
} = require('../controllers/booking.controller');
const verifyToken = require('../middleware/verifyToken');
const { validateObjectId } = require('../middleware/validate');

const router = express.Router();

router.post('/create', verifyToken, createBooking);
router.get('/user', verifyToken, getUserBookings);
router.get('/owner', verifyToken, getOwnerBookings);
router.patch('/:id/status', verifyToken, validateObjectId('id'), updateBookingStatus);

module.exports = router;
