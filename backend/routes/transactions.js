const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');

// Create a new transaction
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      email,
      items,
      subtotal,
      tax,
      shipping,
      total,
      status
    } = req.body;

    // Validate required fields
    if (!userId || !email || !items || items.length === 0) {
      return res.status(400).json({ 
        error: 'UserId, email, and items are required' 
      });
    }

    // Create new transaction - always start as 'pending'
    const transaction = new Transaction({
      userId,
      email,
      items,
      subtotal: subtotal || 0,
      tax: tax || 0,
      shipping: shipping || 0,
      total: total || 0,
      status: 'pending',  // Always pending on creation
      createdAt: new Date(),
      completedAt: null   // Not completed yet
    });

    await transaction.save();

    res.status(201).json({
      message: 'Transaction created successfully',
      transactionId: transaction._id,
      transaction
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ 
      error: 'Failed to create transaction',
      details: error.message 
    });
  }
});

// Get all transactions for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const transactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 }); // Most recent first

    res.json({
      transactions,
      count: transactions.length
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch transactions',
      details: error.message 
    });
  }
});

// Get all transactions for a user by email
router.get('/email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    const transactions = await Transaction.find({ email })
      .sort({ createdAt: -1 }); // Most recent first

    res.json({
      transactions,
      count: transactions.length
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch transactions',
      details: error.message 
    });
  }
});

// Get a specific transaction by ID
router.get('/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      return res.status(404).json({ 
        error: 'Transaction not found' 
      });
    }

    res.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ 
      error: 'Failed to fetch transaction',
      details: error.message 
    });
  }
});

// Update transaction status
router.patch('/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'completed', 'cancelled', 'failed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status',
        validStatuses 
      });
    }

    const updateData = { status };
    if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    const transaction = await Transaction.findByIdAndUpdate(
      transactionId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res.status(404).json({ 
        error: 'Transaction not found' 
      });
    }

    res.json({
      message: 'Transaction updated successfully',
      transaction
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ 
      error: 'Failed to update transaction',
      details: error.message 
    });
  }
});

// Delete a transaction (admin only - optional)
router.delete('/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    const transaction = await Transaction.findByIdAndDelete(transactionId);

    if (!transaction) {
      return res.status(404).json({ 
        error: 'Transaction not found' 
      });
    }

    res.json({
      message: 'Transaction deleted successfully',
      transaction
    });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ 
      error: 'Failed to delete transaction',
      details: error.message 
    });
  }
});

// Get all transactions (admin view - optional)
router.get('/', async (req, res) => {
  try {
    const { status, limit = 100 } = req.query;
    
    const query = status ? { status } : {};
    
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      transactions,
      count: transactions.length
    });
  } catch (error) {
    console.error('Error fetching all transactions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch transactions',
      details: error.message 
    });
  }
});

module.exports = router;