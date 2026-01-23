const express = require('express');
const {
    register,
    login,
    getMe,
    checkUsername,
} = require('../controllers/authController');

const router = express.Router();

const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/check-username/:username', checkUsername);

module.exports = router;
