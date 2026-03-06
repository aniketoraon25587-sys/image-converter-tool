const multer = require('multer');
const sharp = require('sharp');
const express = require('express');
const router = express.Router();

// Set up storage in memory for uploaded files
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});

// Conversion endpoint
router.post('/convert', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image provided' });
        }

        const format = req.body.format;
        if (!['jpeg', 'jpg', 'png', 'webp'].includes(format)) {
            return res.status(400).json({ error: 'Invalid format requested' });
        }

        // Determine output format
        let outputFormat = format === 'jpg' ? 'jpeg' : format;

        // sharp options
        let sharpInstance = sharp(req.file.buffer);

        if (outputFormat === 'jpeg') {
            sharpInstance = sharpInstance.jpeg({ quality: 90 });
        } else if (outputFormat === 'png') {
            sharpInstance = sharpInstance.png();
        } else if (outputFormat === 'webp') {
            sharpInstance = sharpInstance.webp({ quality: 85 });
        }

        const buffer = await sharpInstance.toBuffer();

        // Convert to base64 so frontend can download directly
        const base64Image = buffer.toString('base64');
        const contentTypes = {
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'webp': 'image/webp'
        };

        res.json({
            success: true,
            format: outputFormat,
            size: buffer.length,
            mimetype: contentTypes[outputFormat],
            data: `data:${contentTypes[outputFormat]};base64,${base64Image}`
        });

    } catch (error) {
        console.error('Conversion error:', error);
        res.status(500).json({ error: 'Image conversion failed' });
    }
});

module.exports = router;
