const express = require('express');
const {
    getUsers,
    getUser,
    restrictUser,
    updateUserRole,
    deleteUser,
} = require('../controllers/adminController');

const router = express.Router();

const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// Manager and Owner routes
router.get('/users', authorize('manager', 'owner'), getUsers);
router.get('/users/:id', authorize('manager', 'owner'), getUser);
router.put('/users/:id/restrict', authorize('manager', 'owner'), restrictUser);

// Owner only routes
router.put('/users/:id/role', authorize('owner'), updateUserRole);
router.delete('/users/:id', authorize('owner'), deleteUser);

module.exports = router;
