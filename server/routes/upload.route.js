const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const upload = require('../middleware/upload');
const { MAX_FILES } = require('../config/upload');
const { uploadImages } = require('../controllers/upload.controller');

const router = express.Router();

router.post('/', verifyToken, upload.array('images', MAX_FILES), uploadImages);

module.exports = router;
