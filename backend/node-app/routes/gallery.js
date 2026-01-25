const express = require('express');
const GalleryMedia = require('../models/GalleryMedia');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all gallery media (public)
router.get('/', async (req, res) => {
  try {
    const media = await GalleryMedia.find({ is_active: true }).sort({ order: 1 });
    res.json({ media: media.map(m => m.toJSON()) });
  } catch (error) {
    console.error('Get gallery error:', error);
    res.status(500).json({ error: 'Failed to get gallery' });
  }
});

// Admin: Add media
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { url, type, title } = req.body;
    
    // Get highest order
    const lastMedia = await GalleryMedia.findOne().sort({ order: -1 });
    const order = lastMedia ? lastMedia.order + 1 : 0;

    const media = new GalleryMedia({ url, type, title, order });
    await media.save();
    
    res.status(201).json({ media: media.toJSON() });
  } catch (error) {
    console.error('Add media error:', error);
    res.status(500).json({ error: 'Failed to add media' });
  }
});

// Admin: Update media
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { url, type, title, is_active } = req.body;
    
    const media = await GalleryMedia.findById(req.params.id);
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    if (url !== undefined) media.url = url;
    if (type !== undefined) media.type = type;
    if (title !== undefined) media.title = title;
    if (is_active !== undefined) media.is_active = is_active;
    
    await media.save();
    res.json({ media: media.toJSON() });
  } catch (error) {
    console.error('Update media error:', error);
    res.status(500).json({ error: 'Failed to update media' });
  }
});

// Admin: Delete media
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await GalleryMedia.findByIdAndDelete(req.params.id);
    res.json({ message: 'Media deleted' });
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({ error: 'Failed to delete media' });
  }
});

// Admin: Reorder media
router.post('/reorder', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { items } = req.body; // [{ id, order }, ...]
    
    for (const item of items) {
      await GalleryMedia.findByIdAndUpdate(item.id, { order: item.order });
    }
    
    res.json({ message: 'Gallery reordered' });
  } catch (error) {
    console.error('Reorder gallery error:', error);
    res.status(500).json({ error: 'Failed to reorder gallery' });
  }
});

module.exports = router;
