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

router.post('/', (req, res, next) => {
    console.log(`📡 [UPLOAD] Incoming request headers:`, req.headers['content-type']);
    next();
}, upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        // Cloudinary provides the full URL in req.file.path.
        // Local storage provides req.file.path as a file path relative to the root.
        let imageUrl = req.file.path;

        // If it's local storage (filesystem path), convert it to a URL
        if (!imageUrl.startsWith('http')) {
            const protocol = req.protocol;
            const host = req.get('host');
            imageUrl = `${protocol}://${host}/${imageUrl.replace(/\\/g, '/')}`;
        }

        console.log(`🖼️ File uploaded: ${req.file.filename} -> ${imageUrl}`);

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
