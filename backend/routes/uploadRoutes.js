const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Use Cloudinary for production storage (Render)
const { upload } = require('../services/cloudinaryService');

router.get('/test', (req, res) => {
    res.json({ success: true, message: 'Upload router is reachable' });
});

router.post('/', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        // Cloudinary provides the full URL in req.file.path
        const imageUrl = req.file.path;
        console.log(`🖼️ File uploaded to Cloudinary: ${req.file.filename} -> ${imageUrl}`);

        res.json({
            success: true,
            imageUrl: imageUrl,
            filename: req.file.filename
        });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ success: false, message: 'Upload failed', error: error.message });
    }
});

module.exports = router;
