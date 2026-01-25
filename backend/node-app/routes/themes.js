const express = require('express');
const Theme = require('../models/Theme');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all active themes
router.get('/', async (req, res) => {
  try {
    const themes = await Theme.find({ is_active: true }).sort({ name: 1 });
    res.json({ themes: themes.map(t => t.toJSON()) });
  } catch (error) {
    console.error('Get themes error:', error);
    res.status(500).json({ error: 'Failed to get themes' });
  }
});

// Get single theme
router.get('/:id', async (req, res) => {
  try {
    const theme = await Theme.findById(req.params.id);
    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }
    res.json({ theme: theme.toJSON() });
  } catch (error) {
    console.error('Get theme error:', error);
    res.status(500).json({ error: 'Failed to get theme' });
  }
});

// Admin: Create theme
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, description, price, image_url } = req.body;
    
    const theme = new Theme({ name, description, price, image_url });
    await theme.save();
    
    res.status(201).json({ theme: theme.toJSON() });
  } catch (error) {
    console.error('Create theme error:', error);
    res.status(500).json({ error: 'Failed to create theme' });
  }
});

// Admin: Update theme
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, description, price, image_url, is_active } = req.body;
    
    const theme = await Theme.findById(req.params.id);
    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }

    if (name !== undefined) theme.name = name;
    if (description !== undefined) theme.description = description;
    if (price !== undefined) theme.price = price;
    if (image_url !== undefined) theme.image_url = image_url;
    if (is_active !== undefined) theme.is_active = is_active;
    
    await theme.save();
    res.json({ theme: theme.toJSON() });
  } catch (error) {
    console.error('Update theme error:', error);
    res.status(500).json({ error: 'Failed to update theme' });
  }
});

// Admin: Delete theme
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const theme = await Theme.findById(req.params.id);
    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }

    theme.is_active = false;
    await theme.save();
    
    res.json({ message: 'Theme deleted' });
  } catch (error) {
    console.error('Delete theme error:', error);
    res.status(500).json({ error: 'Failed to delete theme' });
  }
});

module.exports = router;
