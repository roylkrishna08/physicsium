const express = require('express');
const {
    updateDetails,
    updatePassword,
    updateProfilePicture,
    deleteAccount,
} = require('../controllers/userController');

const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
    updateDetailsValidation,
    updatePasswordValidation,
    validate
} = require('../middleware/sanitize');
const { passwordResetLimiter } = require('../middleware/rateLimitAuth');

router.use(protect);

router.put('/updatedetails', updateDetailsValidation, validate, updateDetails);
router.put('/updatepassword', passwordResetLimiter, updatePasswordValidation, validate, updatePassword);
router.put('/profilepicture', upload.single('image'), updateProfilePicture);
router.delete('/account', deleteAccount);

module.exports = router;
