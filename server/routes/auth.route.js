const express = require('express');
const { signup, signin, google, refresh, signout } = require('../controllers/auth.controller');
const { requireStrings } = require('../middleware/validate');

const router = express.Router();

router.post('/signup', requireStrings('username', 'email', 'password'), signup);
router.post('/signin', requireStrings('email', 'password'), signin);
router.post('/google', google);
router.post('/refresh', refresh);
router.get('/signout', signout);

module.exports = router;
