const express = require('express');
const router = express.Router();

// Helper function to generate sample sales data
function generateSampleData(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dailySales = [];
  
  // Generate daily sales data
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split('T')[0];
    const baseRevenue = 500 + Math.random() * 2000;
    const orders = Math.floor(5 + Math.random() * 25);
    
    dailySales.push({
      date: dateStr,
      revenue: Math.round(baseRevenue * 100) / 100,
      orders: orders,
    });
  }
  
  return dailySales;
}

// Sample product data - Xerjoff Perfume Collection
const sampleProducts = [
  { id: 1, name: 'Italica', baseUnits: 52 },
  { id: 2, name: 'Uden', baseUnits: 38 },
  { id: 3, name: 'Richwood', baseUnits: 45 },
  { id: 4, name: 'Cruz del Sur II', baseUnits: 29 },
  { id: 5, name: 'Amber Gold', baseUnits: 47 },
  { id: 6, name: 'Nio', baseUnits: 33 },
  { id: 7, name: 'Casamorati 1888', baseUnits: 41 },
  { id: 8, name: 'V Absolute', baseUnits: 36 },
  { id: 9, name: 'Naxos', baseUnits: 58 },
  { id: 10, name: 'Erba Pura', baseUnits: 49 },
  { id: 11, name: 'Renaissance', baseUnits: 31 },
  { id: 12, name: 'Accento', baseUnits: 44 },
  { id: 13, name: 'Alexandria II', baseUnits: 42 },
  { id: 14, name: 'Mefisto Gentiluomo', baseUnits: 27 },
  { id: 15, name: 'Torino21', baseUnits: 35 },
];

// GET /api/sales - Fetch sales analytics data
router.get('/', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Start date and end date are required' 
      });
    }
    
    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ 
        error: 'Invalid date format' 
      });
    }
    
    if (start > end) {
      return res.status(400).json({ 
        error: 'Start date must be before end date' 
      });
    }
    
    // Generate sample data
    const dailySales = generateSampleData(startDate, endDate);
    
    // Calculate total stats
    const totalRevenue = dailySales.reduce((sum, day) => sum + day.revenue, 0);
    const totalOrders = dailySales.reduce((sum, day) => sum + day.orders, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Generate top products with some randomization
    const topProducts = sampleProducts
      .map(product => ({
        productId: product.id,
        productName: product.name,
        unitsSold: product.baseUnits + Math.floor(Math.random() * 20),
      }))
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 5); // Top 5 products
    
    const topSellingProduct = topProducts.length > 0 
      ? topProducts[0].productName 
      : 'N/A';
    
    // Return analytics data
    res.json({
      dailySales,
      topProducts,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      topSellingProduct,
      dateRange: {
        start: startDate,
        end: endDate,
      },
    });
    
  } catch (error) {
    console.error('Error fetching sales data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch sales data',
      message: error.message 
    });
  }
});

// GET /api/sales/summary - Get quick summary stats
router.get('/summary', (req, res) => {
  try {
    // Last 30 days summary
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    const dailySales = generateSampleData(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
    
    const totalRevenue = dailySales.reduce((sum, day) => sum + day.revenue, 0);
    const totalOrders = dailySales.reduce((sum, day) => sum + day.orders, 0);
    
    res.json({
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders,
      period: 'Last 30 Days',
    });
    
  } catch (error) {
    console.error('Error fetching sales summary:', error);
    res.status(500).json({ 
      error: 'Failed to fetch sales summary',
      message: error.message 
    });
  }
});

module.exports = router;