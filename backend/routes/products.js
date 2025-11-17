const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Product = require('../models/Product');

// Create uploads directory if it doesn't exist
const productsUploadsDir = path.join(__dirname, '../uploads/products');
if (!fs.existsSync(productsUploadsDir)) {
  fs.mkdirSync(productsUploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, productsUploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get products by collection
router.get('/collection/:collection', async (req, res) => {
  try {
    const products = await Product.find({ collection: req.params.collection });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new product with multiple image upload
router.post('/', upload.array('images', 10), async (req, res) => {
  try {
    const productData = {
      name: req.body.name,
      price: req.body.price,
      description: req.body.description,
      collection: req.body.collection,
      stock: req.body.stock || 0,
      images: []
    };

    // Handle multiple images
    if (req.files && req.files.length > 0) {
      productData.images = req.files.map(file => `/uploads/products/${file.filename}`);
    }

    const product = new Product(productData);
    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    // Delete uploaded files if product creation fails
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        fs.unlinkSync(file.path);
      });
    }
    res.status(400).json({ message: error.message });
  }
});

// Update product with optional multiple image upload
router.put('/:id', upload.array('images', 10), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          fs.unlinkSync(file.path);
        });
      }
      return res.status(404).json({ message: 'Product not found' });
    }

    // Update fields
    product.name = req.body.name || product.name;
    product.price = req.body.price || product.price;
    product.description = req.body.description || product.description;
    product.collection = req.body.collection || product.collection;
    product.stock = req.body.stock !== undefined ? req.body.stock : product.stock;

    // Handle images update
    let updatedImages = [];

    // Keep existing images if provided
    if (req.body.existingImages) {
      try {
        const existingImages = JSON.parse(req.body.existingImages);
        updatedImages = [...existingImages];

        // Delete images that were removed
        if (product.images && product.images.length > 0) {
          product.images.forEach(oldImg => {
            if (!existingImages.includes(oldImg) && oldImg.startsWith('/uploads/')) {
              const oldImagePath = path.join(__dirname, '..', oldImg);
              if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
              }
            }
          });
        }
      } catch (e) {
        console.error('Error parsing existing images:', e);
      }
    } else {
      // If no existing images provided, delete all old images
      if (product.images && product.images.length > 0) {
        product.images.forEach(oldImg => {
          if (oldImg.startsWith('/uploads/')) {
            const oldImagePath = path.join(__dirname, '..', oldImg);
            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
            }
          }
        });
      }
    }

    // Add new uploaded images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/uploads/products/${file.filename}`);
      updatedImages = [...updatedImages, ...newImages];
    }

    product.images = updatedImages;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        fs.unlinkSync(file.path);
      });
    }
    res.status(400).json({ message: error.message });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Delete associated image files
    if (product.images && product.images.length > 0) {
      product.images.forEach(img => {
        if (img.startsWith('/uploads/')) {
          const imagePath = path.join(__dirname, '..', img);
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        }
      });
    }

    // Also delete old single image if exists (for backward compatibility)
    if (product.image && product.image.startsWith('/uploads/')) {
      const imagePath = path.join(__dirname, '..', product.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;