const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Product, Order } = require('../models');

// Initial seed products for premium design preview
const SEED_PRODUCTS = [
  {
    title: 'AeroSound Pro - Active Noise Cancelling Headphones',
    price: 249.99,
    description: 'Immersive sound experience with advanced active hybrid noise cancellation, 40-hour battery life, and premium memory foam cups.',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=60',
    category: 'Electronics',
    rating: { rate: 4.8, count: 128 }
  },
  {
    title: 'VoltTrack V3 - Minimalist Smart Watch',
    price: 189.99,
    description: 'Sleek, lightweight body featuring a 1.4-inch AMOLED display, advanced heart rate tracker, blood oxygen sensor, and built-in GPS.',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=60',
    category: 'Electronics',
    rating: { rate: 4.6, count: 95 }
  },
  {
    title: 'AeroGel Ergo - Orthopedic Office Chair',
    price: 349.00,
    description: 'Ergonomic office chair designed with self-adaptive lumbar support, AeroGel mesh fabric, and 3D adjustable armrests for maximum comfort.',
    image: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=800&auto=format&fit=crop&q=60',
    category: 'Home & Office',
    rating: { rate: 4.9, count: 74 }
  },
  {
    title: 'Lumina Arch - Smart RGB Floor Lamp',
    price: 89.99,
    description: 'Modern arch floor lamp offering 16 million colors, voice control compatibility, music synchronization, and a sleek brushed metallic finish.',
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=60',
    category: 'Home & Office',
    rating: { rate: 4.5, count: 142 }
  },
  {
    title: 'UrbanShield - Waterproof Anti-Theft Backpack',
    price: 79.99,
    description: 'Water-resistant carbon fiber shell backpack with hidden zippers, TSA-approved combination lock, and integrated USB charging port.',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=60',
    category: 'Accessories',
    rating: { rate: 4.7, count: 210 }
  },
  {
    title: 'ThermaBrew - Precision Smart Coffee Kettle',
    price: 119.50,
    description: 'Gooseneck electric kettle with degree-accurate temperature control, LCD display screen, and 30-minute hold function for perfect pour-overs.',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=60',
    category: 'Kitchen',
    rating: { rate: 4.8, count: 83 }
  }
];

// Seed database helper
async function ensureProductsSeeded() {
  const count = await Product.find({});
  if (count.length === 0) {
    console.log('🌱 Seeding products to database...');
    for (const prod of SEED_PRODUCTS) {
      await Product.create(prod);
    }
  }
}

// @route   GET api/products
// @desc    Get all products (auto-seeds if database is empty)
router.get('/', async (req, res) => {
  try {
    await ensureProductsSeeded();
    const products = await Product.find({});
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching products' });
  }
});

// @route   GET api/products/:id
// @desc    Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching product details' });
  }
});

// @route   POST api/products/order
// @desc    Place a new order
router.post('/order', auth, async (req, res) => {
  const { items, totalAmount } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'No items in the order' });
  }

  try {
    const newOrder = await Order.create({
      userId: req.user.id,
      items,
      totalAmount,
      status: 'Processing'
    });

    res.status(201).json(newOrder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error placing order' });
  }
});

// @route   GET api/products/orders/history
// @desc    Get order history for authenticated user
router.get('/orders/history', auth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id });
    // Sort orders by most recent
    const sortedOrders = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(sortedOrders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching order history' });
  }
});

module.exports = router;
