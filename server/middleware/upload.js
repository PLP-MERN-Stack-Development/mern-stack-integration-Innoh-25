// server/middleware/upload.js - Updated for Base64 processing
const multer = require('multer');
const path = require('path');

// Configure storage - we'll use memory storage to get Buffer
const storage = multer.memoryStorage(); // Changed from diskStorage to memoryStorage

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, JPG, PNG, GIF, WEBP) are allowed!'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage, // Now using memory storage
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter
});

module.exports = upload;