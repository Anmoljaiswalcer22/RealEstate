const express = require('express');
const { updateUser, deleteUser, getUserListings, getUser } = require('../controllers/user.controller');
const verifyToken = require('../middleware/verifyToken');
const { validateObjectId } = require('../middleware/validate');

const router = express.Router();

router.post('/update/:id', verifyToken, validateObjectId('id'), updateUser);
router.delete('/delete/:id', verifyToken, validateObjectId('id'), deleteUser);
router.get('/listings/:id', verifyToken, validateObjectId('id'), getUserListings);
router.get('/:id', verifyToken, validateObjectId('id'), getUser);

module.exports = router;
