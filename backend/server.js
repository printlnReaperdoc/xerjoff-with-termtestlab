const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads/profiles');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Vite default port
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// MongoDB connection
mongoose.connect('mongodb+srv://axistheminecraftexpert:0829@cluster0.rzoaucu.mongodb.net/Xerjoff_mern?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
const productRoutes = require('./routes/products');
const authRoutes = require('./routes/auth');
const reviewRoutes = require('./routes/reviews');
const cartRoutes = require('./routes/cart');
const transactionRoutes = require('./routes/transactions');

app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/sales', require('./routes/sales'));
app.use('/api/reviews', reviewRoutes); // NEW: Review routes
app.use('/api/cart', cartRoutes);
app.use('/api/transactions', transactionRoutes);

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Xerjoff API Server' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: err.message 
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));