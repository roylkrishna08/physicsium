const express = require('express');
const {
    register,
    login,
    getMe,
    checkUsername,
} = require('../controllers/authController');

const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const {
    registerValidation,
    loginValidation,
    validate
} = require('../middleware/sanitize');
const { authLimiter, registerLimiter } = require('../middleware/rateLimitAuth');

router.post('/register', registerLimiter, registerValidation, validate, register);
router.post('/login', authLimiter, loginValidation, validate, login);
router.get('/me', protect, getMe);
router.get('/check-username/:username', checkUsername);

module.exports = router;
