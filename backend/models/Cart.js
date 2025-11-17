const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  }
}, {
  timestamps: true
});

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update the updatedAt timestamp whenever the cart is modified
cartSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to calculate cart totals
cartSchema.methods.calculateTotals = async function() {
  await this.populate('items.productId');
  
  const subtotal = this.items.reduce((sum, item) => {
    return sum + (item.productId.price * item.quantity);
  }, 0);
  
  const tax = subtotal * 0.08; // 8% tax
  const shipping = subtotal > 100 ? 0 : 15; // Free shipping over $100
  const total = subtotal + tax + shipping;
  
  return {
    subtotal: Number(subtotal.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    shipping: Number(shipping.toFixed(2)),
    total: Number(total.toFixed(2)),
    itemCount: this.items.reduce((sum, item) => sum + item.quantity, 0)
  };
};

// Method to get item count
cartSchema.methods.getItemCount = function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
};

// Static method to find or create cart for a user
cartSchema.statics.findOrCreate = async function(userId) {
  let cart = await this.findOne({ userId });
  
  if (!cart) {
    cart = await this.create({ userId, items: [] });
  }
  
  return cart;
};

// Index for faster queries
cartSchema.index({ userId: 1 });
cartSchema.index({ 'items.productId': 1 });

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;