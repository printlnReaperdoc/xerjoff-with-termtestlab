const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');

// Option 1: Try using a require-compatible version
let Filter;
try {
  // Try CommonJS require first (works with older versions of bad-words)
  Filter = require('bad-words');
} catch (e) {
  console.log('Could not load bad-words via require, will try dynamic import');
}

// Option 2: If require doesn't work, use dynamic import
let filterPromise;
if (!Filter) {
  filterPromise = (async () => {
    try {
      const badWords = await import('bad-words');
      Filter = badWords.default || badWords.Filter || badWords;
      console.log('Loaded Filter via import:', typeof Filter);
    } catch (error) {
      console.error('Failed to load bad-words:', error);
    }
  })();
}

// Helper function to clean text
async function cleanText(text) {
  // Wait for the filter to be initialized if needed
  if (!Filter && filterPromise) {
    await filterPromise;
  }
  
  // If we still don't have Filter, just return the text
  if (!Filter || typeof Filter !== 'function') {
    console.warn('Filter not available, returning unfiltered text');
    return text;
  }
  
  try {
    const filter = new Filter();
    return filter.clean(text);
  } catch (error) {
    console.error('Error filtering text:', error);
    return text;
  }
}

// Helper function to check if user has completed transaction for product
async function hasCompletedPurchase(userId, productId) {
  try {
    // Find all completed transactions for this user
    const completedTransactions = await Transaction.find({
      userId: userId,  // Note: schema uses userId, not user
      status: 'completed'
    });
    
    console.log(`Found ${completedTransactions.length} completed transactions for user ${userId}`);
    
    // Check if any of these transactions contain the product
    for (const transaction of completedTransactions) {
      if (transaction.items && Array.isArray(transaction.items)) {
        const hasProduct = transaction.items.some(item => {
          // Schema uses productId field in items array
          const itemProductId = item.productId ? item.productId.toString() : null;
          const targetProductId = productId.toString();
          const match = itemProductId === targetProductId;
          if (match) {
            console.log(`Found matching product in transaction ${transaction._id}`);
          }
          return match;
        });
        
        if (hasProduct) {
          console.log(`✓ User ${userId} has completed purchase for product ${productId}`);
          return true;
        }
      }
    }
    
    console.log(`✗ User ${userId} does NOT have completed purchase for product ${productId}`);
    return false;
  } catch (error) {
    console.error('Error checking completed purchase:', error);
    return false;
  }
}

// Get ALL reviews from the database (for admin) with product details populated
router.get('/all/reviews', async (req, res) => {
  try {
    const reviews = await Review.find({})
      .sort({ createdAt: -1 })
      .populate('user', 'name email')
      .populate('product', 'name image price');
    
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching all reviews:', error);
    res.status(500).json({ message: error.message });
  }
});

// Debug endpoint - Check user's transactions for a product
router.get('/debug/user/:userId/product/:productId/transactions', async (req, res) => {
  try {
    const { userId, productId } = req.params;
    
    // Get all transactions for this user (using userId field from schema)
    const allTransactions = await Transaction.find({ userId: userId });
    
    // Get completed transactions
    const completedTransactions = await Transaction.find({
      userId: userId,
      status: 'completed'
    });
    
    // Check which transactions have this product (using productId field from items)
    const transactionsWithProduct = allTransactions.filter(transaction => {
      if (transaction.items && Array.isArray(transaction.items)) {
        return transaction.items.some(item => {
          const itemProductId = item.productId ? item.productId.toString() : null;
          return itemProductId === productId.toString();
        });
      }
      return false;
    });
    
    // Check completed transactions with this product
    const completedWithProduct = completedTransactions.filter(transaction => {
      if (transaction.items && Array.isArray(transaction.items)) {
        return transaction.items.some(item => {
          const itemProductId = item.productId ? item.productId.toString() : null;
          return itemProductId === productId.toString();
        });
      }
      return false;
    });
    
    res.json({
      userId,
      productId,
      totalTransactions: allTransactions.length,
      completedTransactions: completedTransactions.length,
      transactionsWithThisProduct: transactionsWithProduct.length,
      completedTransactionsWithThisProduct: completedWithProduct.length,
      allTransactionsDetails: allTransactions.map(t => ({
        _id: t._id,
        status: t.status,
        items: t.items,
        createdAt: t.createdAt,
        completedAt: t.completedAt
      })),
      completedWithProductDetails: completedWithProduct.map(t => ({
        _id: t._id,
        status: t.status,
        items: t.items,
        createdAt: t.createdAt,
        completedAt: t.completedAt
      })),
      canReview: await hasCompletedPurchase(userId, productId)
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all reviews for a product
router.get('/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .sort({ createdAt: -1 })
      .populate('user', 'name email');
    
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get review statistics for a product
router.get('/:productId/stats', async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId });
    
    if (reviews.length === 0) {
      return res.json({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      });
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      ratingDistribution[review.rating]++;
    });

    res.json({
      averageRating: averageRating.toFixed(1),
      totalReviews: reviews.length,
      ratingDistribution
    });
  } catch (error) {
    console.error('Error fetching review stats:', error);
    res.status(500).json({ message: error.message });
  }
});

// Check if user has reviewed a product AND if they have completed purchase
router.get('/:productId/user/:userId/check', async (req, res) => {
  try {
    const { productId, userId } = req.params;
    
    console.log(`Checking review eligibility for user ${userId} and product ${productId}`);
    
    // Check if user already reviewed this product
    const review = await Review.findOne({
      product: productId,
      user: userId
    });
    
    console.log(`User has reviewed: ${!!review}`);
    
    // Check if user has completed purchase
    const hasCompletedTransaction = await hasCompletedPurchase(userId, productId);
    
    console.log(`User has completed purchase: ${hasCompletedTransaction}`);
    
    res.json({ 
      hasReviewed: !!review,
      review: review || null,
      canReview: hasCompletedTransaction,
      hasCompletedPurchase: hasCompletedTransaction
    });
  } catch (error) {
    console.error('Error checking review:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create a new review (only if user has completed transaction)
router.post('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { userId, userName, userEmail, rating, comment, title, verifiedPurchase } = req.body;

    // Validate required fields
    if (!userId || !userName || !userEmail || !rating || !comment || !title) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user has completed purchase
    const hasCompletedTransaction = await hasCompletedPurchase(userId, productId);
    if (!hasCompletedTransaction) {
      return res.status(403).json({ 
        message: 'You can only review products you have purchased and received (transaction status: completed)' 
      });
    }

    // Filter profanity from title and comment
    const cleanTitle = await cleanText(title);
    const cleanComment = await cleanText(comment);

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      product: productId,
      user: userId
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product. You can update your existing review.' });
    }

    // Create review with verified purchase set to true since we verified the transaction
    const review = new Review({
      product: productId,
      user: userId,
      name: userName,
      rating: Number(rating),
      title: cleanTitle,
      comment: cleanComment,
      verifiedPurchase: true // Always true since we verified the completed transaction
    });

    await review.save();

    // Update product with new average rating
    await updateProductRating(productId);

    res.status(201).json({
      message: 'Review added successfully',
      review
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update a review (user can only update their own)
router.put('/:reviewId', async (req, res) => {
  try {
    const { userId, rating, comment, title } = req.body;
    
    const review = await Review.findById(req.params.reviewId);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if user owns this review
    if (review.user.toString() !== userId) {
      return res.status(403).json({ message: 'You can only update your own reviews' });
    }

    // Filter profanity from title and comment if provided
    if (title) {
      review.title = await cleanText(title);
    }
    if (comment) {
      review.comment = await cleanText(comment);
    }
    if (rating) {
      review.rating = Number(rating);
    }
    
    await review.save();

    // Update product rating
    await updateProductRating(review.product);

    res.json({
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete a review (admin can delete any, user can delete own)
router.delete('/:reviewId', async (req, res) => {
  try {
    const { userId, isAdmin } = req.body;
    
    const review = await Review.findById(req.params.reviewId);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check permissions
    const isOwner = review.user.toString() === userId;
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    const productId = review.product;
    
    await Review.findByIdAndDelete(req.params.reviewId);

    // Update product rating
    await updateProductRating(productId);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: error.message });
  }
});

// Helper function to update product average rating
async function updateProductRating(productId) {
  try {
    const reviews = await Review.find({ product: productId });
    
    if (reviews.length === 0) {
      await Product.findByIdAndUpdate(productId, {
        averageRating: 0,
        reviewCount: 0
      });
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await Product.findByIdAndUpdate(productId, {
      averageRating: averageRating.toFixed(1),
      reviewCount: reviews.length
    });
  } catch (error) {
    console.error('Error updating product rating:', error);
  }
}

module.exports = router;