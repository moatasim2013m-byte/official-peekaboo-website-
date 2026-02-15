const express = require('express');
const Product = require('../models/Product');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

const sanitizeProductPayload = (body = {}, { forUpdate = false } = {}) => ({
  nameAr: body.nameAr !== undefined ? String(body.nameAr).trim() : (forUpdate ? undefined : ''),
  nameEn: body.nameEn !== undefined ? String(body.nameEn).trim() : (forUpdate ? undefined : ''),
  priceJD: body.priceJD !== undefined ? Number(body.priceJD) : (forUpdate ? undefined : Number.NaN),
  imageUrl: body.imageUrl !== undefined ? String(body.imageUrl).trim() : (forUpdate ? undefined : ''),
  active: typeof body.active === 'boolean' ? body.active : (forUpdate ? undefined : true),
  sku: body.sku !== undefined ? String(body.sku).trim() : (forUpdate ? undefined : ''),
  ...(body.stockQty !== undefined && body.stockQty !== null ? { stockQty: Number(body.stockQty) } : {})
});

// Public products endpoint
router.get('/products', async (req, res) => {
  try {
    const filter = {};
    if (req.query.active === 'true') {
      filter.active = true;
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json({ products: products.map((p) => p.toJSON()) });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to load products' });
  }
});

// Admin products endpoints
router.get('/admin/products', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
    res.json({ products: products.map((p) => p.toJSON()) });
  } catch (error) {
    console.error('Admin list products error:', error);
    res.status(500).json({ error: 'Failed to load products' });
  }
});

router.post('/admin/products', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const payload = sanitizeProductPayload(req.body);

    if (!payload.nameAr || !payload.nameEn || !payload.sku || Number.isNaN(payload.priceJD)) {
      return res.status(400).json({ error: 'Missing required product fields' });
    }

    const product = new Product(payload);
    await product.save();
    res.status(201).json({ product: product.toJSON() });
  } catch (error) {
    console.error('Admin create product error:', error);
    if (error?.code === 11000) {
      return res.status(400).json({ error: 'SKU already exists' });
    }
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.patch('/admin/products/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const payload = sanitizeProductPayload(req.body, { forUpdate: true });
    const updates = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));

    const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ product: product.toJSON() });
  } catch (error) {
    console.error('Admin update product error:', error);
    if (error?.code === 11000) {
      return res.status(400).json({ error: 'SKU already exists' });
    }
    res.status(500).json({ error: 'Failed to update product' });
  }
});

module.exports = router;
