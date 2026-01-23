const multer = require('multer');
const { storage } = require('../config/cloudinary');

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 500 * 1024, // 500 KB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'), false);
        }
    },
});

module.exports = upload;
