const express = require('express');
const {
  createListing,
  getListing,
  updateListing,
  deleteListing,
  getListings,
} = require('../controllers/listing.controller');
const verifyToken = require('../middleware/verifyToken');
const { validateObjectId } = require('../middleware/validate');

const router = express.Router();

router.post('/create', verifyToken, createListing);
router.get('/get', getListings);
router.get('/get/:id', validateObjectId('id'), getListing);
router.post('/update/:id', verifyToken, validateObjectId('id'), updateListing);
router.delete('/delete/:id', verifyToken, validateObjectId('id'), deleteListing);

module.exports = router;
