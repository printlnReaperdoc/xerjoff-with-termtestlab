const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');

// Email configuration - wrapped in try/catch for graceful degradation
let transporter = null;
try {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    console.log('Email service configured successfully');
  } else {
    console.warn('Email credentials not configured. Email notifications will be disabled.');
  }
} catch (error) {
  console.error('Failed to configure email service:', error);
  transporter = null;
}

// Function to generate PDF receipt
async function generatePDFReceipt(transaction) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header with logo/brand
      doc.fontSize(28)
         .fillColor('#8b6914')
         .text('XERJOFF', { align: 'center' })
         .moveDown(0.3);

      doc.fontSize(12)
         .fillColor('#666')
         .text('Luxury Fragrance Collection', { align: 'center' })
         .moveDown(2);

      // Receipt Title
      doc.fontSize(20)
         .fillColor('#1a1a1a')
         .text('RECEIPT', { align: 'center' })
         .moveDown(1);

      // Transaction Information
      const statusColors = {
        pending: '#856404',
        completed: '#155724',
        cancelled: '#721c24',
        failed: '#721c24'
      };

      doc.fontSize(10)
         .fillColor('#666')
         .text(`Transaction ID: `, { continued: true })
         .fillColor('#1a1a1a')
         .text(transaction._id.toString());

      doc.fillColor('#666')
         .text(`Date: `, { continued: true })
         .fillColor('#1a1a1a')
         .text(new Date(transaction.createdAt).toLocaleString('en-US', {
           year: 'numeric',
           month: 'long',
           day: 'numeric',
           hour: '2-digit',
           minute: '2-digit'
         }));

      doc.fillColor('#666')
         .text(`Status: `, { continued: true })
         .fillColor(statusColors[transaction.status] || '#1a1a1a')
         .text(transaction.status.toUpperCase());

      doc.fillColor('#666')
         .text(`Customer: `, { continued: true })
         .fillColor('#1a1a1a')
         .text(transaction.email);

      doc.moveDown(2);

      // Items Table Header
      const tableTop = doc.y;
      const itemX = 50;
      const qtyX = 280;
      const priceX = 350;
      const totalX = 450;

      doc.fontSize(11)
         .fillColor('#8b6914')
         .font('Helvetica-Bold')
         .text('ITEM', itemX, tableTop)
         .text('QTY', qtyX, tableTop)
         .text('PRICE', priceX, tableTop)
         .text('TOTAL', totalX, tableTop);

      // Line under header
      doc.strokeColor('#8b6914')
         .lineWidth(2)
         .moveTo(50, tableTop + 20)
         .lineTo(550, tableTop + 20)
         .stroke();

      // Items
      let yPosition = tableTop + 35;
      doc.font('Helvetica').fontSize(10).fillColor('#1a1a1a');

      transaction.items.forEach((item, index) => {
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }

        // Item name and collection
        doc.text(item.name, itemX, yPosition, { width: 200 })
           .fontSize(8)
           .fillColor('#8b6914')
           .text(item.collection, itemX, yPosition + 15)
           .fontSize(10)
           .fillColor('#1a1a1a');

        // Quantity
        doc.text(item.quantity.toString(), qtyX, yPosition);

        // Price
        doc.text(`$${item.price.toFixed(2)}`, priceX, yPosition);

        // Total
        doc.text(`$${(item.price * item.quantity).toFixed(2)}`, totalX, yPosition);

        yPosition += 40;

        // Line between items
        if (index < transaction.items.length - 1) {
          doc.strokeColor('#e0e0e0')
             .lineWidth(0.5)
             .moveTo(50, yPosition - 10)
             .lineTo(550, yPosition - 10)
             .stroke();
        }
      });

      // Summary section
      yPosition += 20;

      // Line before summary
      doc.strokeColor('#8b6914')
         .lineWidth(1)
         .moveTo(350, yPosition)
         .lineTo(550, yPosition)
         .stroke();

      yPosition += 15;

      // Subtotal
      doc.fontSize(10)
         .fillColor('#666')
         .text('Subtotal:', 350, yPosition)
         .fillColor('#1a1a1a')
         .text(`$${transaction.subtotal.toFixed(2)}`, totalX, yPosition);

      yPosition += 20;

      // Tax
      doc.fillColor('#666')
         .text('Tax:', 350, yPosition)
         .fillColor('#1a1a1a')
         .text(`$${transaction.tax.toFixed(2)}`, totalX, yPosition);

      yPosition += 20;

      // Shipping
      doc.fillColor('#666')
         .text('Shipping:', 350, yPosition)
         .fillColor('#1a1a1a')
         .text(`$${transaction.shipping.toFixed(2)}`, totalX, yPosition);

      yPosition += 25;

      // Total line
      doc.strokeColor('#8b6914')
         .lineWidth(2)
         .moveTo(350, yPosition)
         .lineTo(550, yPosition)
         .stroke();

      yPosition += 15;

      // Total
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#8b6914')
         .text('TOTAL:', 350, yPosition)
         .text(`$${transaction.total.toFixed(2)}`, totalX, yPosition);

      // Footer
      doc.fontSize(9)
         .fillColor('#999')
         .font('Helvetica')
         .text('Thank you for your purchase!', 50, 750, { align: 'center' })
         .text('XERJOFF - Luxury Fragrance Collection', 50, 765, { align: 'center' })
         .fontSize(8)
         .text(`Generated on ${new Date().toLocaleString()}`, 50, 780, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Function to send status update email
async function sendStatusUpdateEmail(transaction, oldStatus) {
  // Check if email service is configured
  if (!transporter) {
    console.log('Email service not configured. Skipping email notification.');
    return { sent: false, reason: 'Email service not configured' };
  }

  try {
    const statusEmojis = {
      pending: '⏳',
      completed: '✅',
      cancelled: '❌',
      failed: '⚠️'
    };

    const statusMessages = {
      pending: 'Your order is being processed',
      completed: 'Your order has been completed successfully',
      cancelled: 'Your order has been cancelled',
      failed: 'There was an issue with your order'
    };

    // Generate PDF receipt
    let pdfBuffer;
    try {
      pdfBuffer = await generatePDFReceipt(transaction);
    } catch (error) {
      console.error('Error generating PDF receipt:', error);
      // Continue without PDF if generation fails
    }

    const emailContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(45deg, #b8860b 30%, #8b6914 90%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; }
    .status-badge { display: inline-block; padding: 10px 20px; border-radius: 20px; font-weight: bold; margin: 20px 0; }
    .status-completed { background: #d4edda; color: #155724; }
    .status-pending { background: #fff3cd; color: #856404; }
    .status-cancelled { background: #f8d7da; color: #721c24; }
    .status-failed { background: #f8d7da; color: #721c24; }
    .items { background: #f5f0e8; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .item { margin: 10px 0; }
    .total-section { background: #faf8f3; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .total-row { display: flex; justify-content: space-between; margin: 10px 0; }
    .total-row.final { font-size: 1.3em; font-weight: bold; color: #8b6914; border-top: 2px solid #8b6914; padding-top: 10px; margin-top: 10px; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 0.9em; }
    .transaction-id { font-family: monospace; background: #f5f0e8; padding: 5px 10px; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>XERJOFF</h1>
      <p style="margin: 10px 0 0 0; font-size: 1.1em;">Order Status Update</p>
    </div>
    
    <div class="content">
      <h2>${statusEmojis[transaction.status]} ${statusMessages[transaction.status]}</h2>
      
      <p>Hello,</p>
      <p>Your order status has been updated from <strong>${oldStatus}</strong> to <strong>${transaction.status}</strong>.</p>
      ${pdfBuffer ? '<p><strong>📎 A detailed receipt is attached to this email as a PDF.</strong></p>' : ''}
      
      <div class="status-badge status-${transaction.status}">
        Status: ${transaction.status.toUpperCase()}
      </div>
      
      <p><strong>Transaction ID:</strong> <span class="transaction-id">${transaction._id.toString()}</span></p>
      <p><strong>Date:</strong> ${new Date(transaction.createdAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}</p>
      
      <div class="items">
        <h3>Order Items:</h3>
        ${transaction.items.map(item => `
          <div class="item">
            <strong>${item.name}</strong> (${item.collection})<br>
            Quantity: ${item.quantity} × $${item.price.toFixed(2)} = $${(item.price * item.quantity).toFixed(2)}
          </div>
        `).join('')}
      </div>
      
      <div class="total-section">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>$${transaction.subtotal.toFixed(2)}</span>
        </div>
        <div class="total-row">
          <span>Tax:</span>
          <span>$${transaction.tax.toFixed(2)}</span>
        </div>
        <div class="total-row">
          <span>Shipping:</span>
          <span>$${transaction.shipping.toFixed(2)}</span>
        </div>
        <div class="total-row final">
          <span>Total:</span>
          <span>$${transaction.total.toFixed(2)}</span>
        </div>
      </div>
      
      ${transaction.status === 'completed' ? `
        <p style="background: #d4edda; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
          <strong>✅ Thank you for your purchase!</strong><br>
          Your order has been successfully completed. If you have any questions, please contact our support team.
        </p>
      ` : ''}
      
      ${transaction.status === 'cancelled' || transaction.status === 'failed' ? `
        <p style="background: #f8d7da; padding: 15px; border-radius: 8px; border-left: 4px solid #dc3545;">
          <strong>Note:</strong> If you have any questions about this ${transaction.status} order, please contact our support team.
        </p>
      ` : ''}
      
      <div class="footer">
        <p>This is an automated email from XERJOFF. Please do not reply to this email.</p>
        <p>© ${new Date().getFullYear()} XERJOFF. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    const itemsList = transaction.items.map(item => 
      `- ${item.name} (${item.collection}) - Qty: ${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`
    ).join('\n');

    const mailOptions = {
      from: `"XERJOFF" <${process.env.EMAIL_USER}>`,
      to: transaction.email,
      subject: `Order Status Update - ${statusEmojis[transaction.status]} ${transaction.status.toUpperCase()} - XERJOFF`,
      html: emailContent,
      text: `
XERJOFF - Order Status Update

Your order status has been updated from ${oldStatus} to ${transaction.status}.

Transaction ID: ${transaction._id.toString()}
Status: ${transaction.status.toUpperCase()}
Date: ${new Date(transaction.createdAt).toLocaleString()}

Items:
${itemsList}

Subtotal: $${transaction.subtotal.toFixed(2)}
Tax: $${transaction.tax.toFixed(2)}
Shipping: $${transaction.shipping.toFixed(2)}
Total: $${transaction.total.toFixed(2)}

${statusMessages[transaction.status]}

Thank you for choosing XERJOFF.
      `
    };

    // Add PDF attachment if generated successfully
    if (pdfBuffer) {
      const receiptFilename = `XERJOFF_Receipt_${transaction._id.toString().slice(-8)}.pdf`;
      mailOptions.attachments = [
        {
          filename: receiptFilename,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ];
    }

    await transporter.sendMail(mailOptions);
    console.log(`Status update email sent successfully to ${transaction.email}`);
    return { sent: true, reason: null };
  } catch (error) {
    console.error('Error sending email:', error);
    return { sent: false, reason: error.message };
  }
}

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
      status: 'pending',
      createdAt: new Date(),
      completedAt: null
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
      .sort({ createdAt: -1 });

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
      .sort({ createdAt: -1 });

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

    // Get the old transaction to compare status
    const oldTransaction = await Transaction.findById(transactionId);
    if (!oldTransaction) {
      return res.status(404).json({ 
        error: 'Transaction not found' 
      });
    }

    const oldStatus = oldTransaction.status;

    const updateData = { status };
    if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    // Update the transaction first (this should always succeed)
    const transaction = await Transaction.findByIdAndUpdate(
      transactionId,
      updateData,
      { new: true, runValidators: true }
    );

    // Try to send email notification if status changed (non-blocking)
    let emailResult = { sent: false, reason: 'Status unchanged' };
    if (oldStatus !== status) {
      emailResult = await sendStatusUpdateEmail(transaction, oldStatus);
    }

    // Always return success if transaction was updated
    res.json({
      message: 'Transaction updated successfully',
      transaction,
      emailNotification: emailResult
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ 
      error: 'Failed to update transaction',
      details: error.message 
    });
  }
});

// Delete a transaction (admin only)
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

// Get all transactions (admin view)
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