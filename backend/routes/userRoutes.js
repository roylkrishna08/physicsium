const express = require('express');
const {
    updateDetails,
    updatePassword,
    updateProfilePicture,
} = require('../controllers/userController');

const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);

router.put('/updatedetails', updateDetails);
router.put('/updatepassword', updatePassword);
router.put('/profilepicture', upload.single('image'), updateProfilePicture);

module.exports = router;
