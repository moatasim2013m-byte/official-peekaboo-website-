const express = require('express');
const User = require('../models/User');
const Child = require('../models/Child');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get profile
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const children = await Child.find({ parent_id: req.userId });
    
    res.json({
      user: user.toJSON(),
      children: children.map(c => c.toJSON())
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update profile
router.put('/', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    
    const user = await User.findById(req.userId);
    if (name) user.name = name;
    await user.save();
    
    res.json({ user: user.toJSON() });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Add child
router.post('/children', authMiddleware, async (req, res) => {
  try {
    const { name, birthday } = req.body;
    
    if (!name || !birthday) {
      return res.status(400).json({ error: 'Name and birthday are required' });
    }

    const child = new Child({
      parent_id: req.userId,
      name,
      birthday: new Date(birthday)
    });
    await child.save();
    
    res.status(201).json({ child: child.toJSON() });
  } catch (error) {
    console.error('Add child error:', error);
    res.status(500).json({ error: 'Failed to add child' });
  }
});

// Update child
router.put('/children/:id', authMiddleware, async (req, res) => {
  try {
    const { name, birthday } = req.body;
    
    const child = await Child.findOne({ _id: req.params.id, parent_id: req.userId });
    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    if (name) child.name = name;
    if (birthday) child.birthday = new Date(birthday);
    await child.save();
    
    res.json({ child: child.toJSON() });
  } catch (error) {
    console.error('Update child error:', error);
    res.status(500).json({ error: 'Failed to update child' });
  }
});

// Delete child
router.delete('/children/:id', authMiddleware, async (req, res) => {
  try {
    const child = await Child.findOneAndDelete({ _id: req.params.id, parent_id: req.userId });
    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }
    
    res.json({ message: 'Child removed' });
  } catch (error) {
    console.error('Delete child error:', error);
    res.status(500).json({ error: 'Failed to delete child' });
  }
});

// Get children
router.get('/children', authMiddleware, async (req, res) => {
  try {
    const children = await Child.find({ parent_id: req.userId });
    res.json({ children: children.map(c => c.toJSON()) });
  } catch (error) {
    console.error('Get children error:', error);
    res.status(500).json({ error: 'Failed to get children' });
  }
});

module.exports = router;
