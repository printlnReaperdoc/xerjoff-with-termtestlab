const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Get user's cart
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    let cart = await Cart.findOne({ userId }).populate('items.productId');
    
    // If cart doesn't exist, create a new one
    if (!cart) {
      cart = new Cart({ userId, items: [] });
      await cart.save();
    }

    // Format the response to include product details
    const formattedItems = cart.items.map(item => ({
      _id: item._id,
      productId: item.productId._id,
      name: item.productId.name,
      price: item.productId.price,
      image: item.productId.image,
      collection: item.productId.collection,
      quantity: item.quantity
    }));

    res.json({ items: formattedItems });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ message: 'Failed to fetch cart', error: error.message });
  }
});

// Add item to cart
router.post('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let cart = await Cart.findOne({ userId });

    // Create cart if it doesn't exist
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update quantity if item exists
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item to cart
      cart.items.push({ productId, quantity });
    }

    await cart.save();
    await cart.populate('items.productId');

    // Format the response
    const formattedItems = cart.items.map(item => ({
      _id: item._id,
      productId: item.productId._id,
      name: item.productId.name,
      price: item.productId.price,
      image: item.productId.image,
      collection: item.productId.collection,
      quantity: item.quantity
    }));

    res.json({ message: 'Item added to cart', items: formattedItems });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ message: 'Failed to add item to cart', error: error.message });
  }
});

// Update item quantity
router.patch('/:userId/item/:itemId', async (req, res) => {
  try {
    const { userId, itemId } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    item.quantity = quantity;
    await cart.save();
    await cart.populate('items.productId');

    // Format the response
    const formattedItems = cart.items.map(item => ({
      _id: item._id,
      productId: item.productId._id,
      name: item.productId.name,
      price: item.productId.price,
      image: item.productId.image,
      collection: item.productId.collection,
      quantity: item.quantity
    }));

    res.json({ message: 'Quantity updated', items: formattedItems });
  } catch (error) {
    console.error('Error updating quantity:', error);
    res.status(500).json({ message: 'Failed to update quantity', error: error.message });
  }
});

// Remove item from cart
router.delete('/:userId/item/:itemId', async (req, res) => {
  try {
    const { userId, itemId } = req.params;

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Remove the item using Mongoose subdocument id() method
    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    item.deleteOne();
    await cart.save();
    await cart.populate('items.productId');

    // Format the response
    const formattedItems = cart.items.map(item => ({
      _id: item._id,
      productId: item.productId._id,
      name: item.productId.name,
      price: item.productId.price,
      image: item.productId.image,
      collection: item.productId.collection,
      quantity: item.quantity
    }));

    res.json({ message: 'Item removed from cart', items: formattedItems });
  } catch (error) {
    console.error('Error removing item:', error);
    res.status(500).json({ message: 'Failed to remove item', error: error.message });
  }
});

// Clear entire cart
router.delete('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = [];
    await cart.save();

    res.json({ message: 'Cart cleared', items: [] });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ message: 'Failed to clear cart', error: error.message });
  }
});

module.exports = router;