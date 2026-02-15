const express = require('express');
const Product = require('../models/Product');

const router = express.Router();

// Public products endpoint (simple active add-ons list)
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find({ active: true }).sort({ createdAt: -1 });
    res.json({ products: products.map((p) => p.toJSON()) });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to load products' });
  }
});

module.exports = router;
