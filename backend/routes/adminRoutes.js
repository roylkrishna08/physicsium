const express = require('express');
const {
    getUsers,
    getUser,
    restrictUser,
    updateUserRole,
    deleteUser,
    resetUserPassword,
} = require('../controllers/adminController');

const router = express.Router();

const { protect, authorize } = require('../middleware/authMiddleware');
const {
    idParamValidation,
    resetPasswordValidation,
    validate
} = require('../middleware/sanitize');
const { passwordResetLimiter } = require('../middleware/rateLimitAuth');

router.use(protect);

// Manager and Owner routes
router.get('/users', authorize('manager', 'owner'), getUsers);
router.get('/users/:id', authorize('manager', 'owner'), idParamValidation, validate, getUser);
router.put('/users/:id/restrict', authorize('manager', 'owner'), idParamValidation, validate, restrictUser);
router.put('/users/:id/reset-password', authorize('manager', 'owner'), passwordResetLimiter, idParamValidation, resetPasswordValidation, validate, resetUserPassword);

// Owner only routes
router.put('/users/:id/role', authorize('owner'), idParamValidation, validate, updateUserRole);
router.delete('/users/:id', authorize('owner'), idParamValidation, validate, deleteUser);

module.exports = router;
