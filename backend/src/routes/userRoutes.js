const express = require('express');
const router = express.Router();
const { syncUser, updateProfile, getProfile } = require('../controllers/userController');

// Customer User Routes
router.post('/sync', syncUser);
router.put('/profile', updateProfile);
router.get('/profile/:uid', getProfile);

module.exports = router;
