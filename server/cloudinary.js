const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const express = require('express');
const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Check if Cloudinary is properly configured
const isCloudinaryConfigured = () => {
  return !!cloudinary.config().cloud_name && 
         !!cloudinary.config().api_key && 
         !!cloudinary.config().api_secret;
};

// Log warning if not configured
if (!isCloudinaryConfigured()) {
  console.warn('Cloudinary is not properly configured. Please check your environment variables.');
}

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'forumx-conference',
    resource_type: 'auto',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'webm'],
  },
});

// Configure multer for file uploads
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
});

// File upload route
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Return successful response with file info
    res.status(200).json({
      publicId: req.file.filename,
      url: req.file.path,
      secureUrl: req.file.path.replace('http://', 'https://'),
      format: req.file.format,
      resourceType: req.file.resource_type
    });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Custom upload route with folder organization
router.post('/upload/:conferenceId/:type', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { conferenceId, type } = req.params;
    
    // Validate type
    if (!['chat', 'snapshots', 'recordings'].includes(type)) {
      return res.status(400).json({ error: 'Invalid upload type' });
    }

    // Return successful response with file info and additional metadata
    res.status(200).json({
      publicId: req.file.filename,
      url: req.file.path,
      secureUrl: req.file.path.replace('http://', 'https://'),
      format: req.file.format,
      resourceType: req.file.resource_type,
      conferenceId,
      type
    });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Direct upload from base64
router.post('/upload-base64', async (req, res) => {
  try {
    const { base64Data, folder = 'forumx-conference', resourceType = 'auto' } = req.body;
    
    if (!base64Data) {
      return res.status(400).json({ error: 'No base64 data provided' });
    }

    const result = await cloudinary.uploader.upload(base64Data, {
      folder,
      resource_type: resourceType
    });

    res.status(200).json({
      publicId: result.public_id,
      url: result.url,
      secureUrl: result.secure_url,
      format: result.format,
      width: result.width,
      height: result.height,
      resourceType: result.resource_type
    });
  } catch (error) {
    console.error('Error uploading base64 to Cloudinary:', error);
    res.status(500).json({ error: 'Failed to upload base64 data' });
  }
});

// Delete resource
router.delete('/delete/:publicId', async (req, res) => {
  try {
    const { publicId } = req.params;
    const { resourceType = 'image' } = req.query;
    
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    
    res.status(200).json({
      success: result.result === 'ok'
    });
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    res.status(500).json({ error: 'Failed to delete resource' });
  }
});

module.exports = router; 