const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  email: { type: String, required: true },
  items: [{
    productId: String,
    name: String,
    price: Number,
    quantity: Number,
    image: String,
    collection: String
  }],
  subtotal: Number,
  tax: Number,
  shipping: Number,
  total: Number,
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'cancelled', 'failed'],
    default: 'pending' 
  },
  createdAt: { type: Date, default: Date.now },
  completedAt: Date
});

module.exports = mongoose.model('Transaction', transactionSchema);