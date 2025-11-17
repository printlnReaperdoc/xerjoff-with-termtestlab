import { useState, useEffect } from 'react';

export default function Cart() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [processingCheckout, setProcessingCheckout] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState(null);

  // Check if user is logged in
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      window.location.href = '/login';
      return;
    }
    
    try {
      const userData = JSON.parse(storedUser);
      setUser(userData);
    } catch (error) {
      console.error('Error parsing user data:', error);
      window.location.href = '/login';
    }
  }, []);

  // Fetch cart items
  useEffect(() => {
    if (!user) return;
    
    const fetchCart = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/api/cart/${user.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch cart');
        }
        
        const data = await response.json();
        setCart(data.items || []);
      } catch (error) {
        console.error('Error fetching cart:', error);
        setError('Failed to load cart items');
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [user]);

  // Update quantity
  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setUpdatingItemId(itemId);
    
    try {
      const response = await fetch(`http://localhost:5000/api/cart/${user.id}/item/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      if (!response.ok) {
        throw new Error('Failed to update quantity');
      }

      const data = await response.json();
      setCart(data.items || []);
    } catch (error) {
      console.error('Error updating quantity:', error);
      alert('Failed to update quantity. Please try again.');
    } finally {
      setUpdatingItemId(null);
    }
  };

  // Remove item from cart
  const removeItem = async (itemId) => {
    if (!confirm('Remove this item from your cart?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/cart/${user.id}/item/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove item');
      }

      const data = await response.json();
      setCart(data.items || []);
    } catch (error) {
      console.error('Error removing item:', error);
      alert('Failed to remove item. Please try again.');
    }
  };

  // Complete transaction and clear cart
  const handleCompleteOrder = async () => {
    if (cart.length === 0) return;

    setProcessingCheckout(true);

    try {
      const transactionData = {
        userId: user.id,
        email: user.email, 
        items: cart.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          collection: item.collection
        })),
        subtotal: subtotal,
        tax: tax,
        shipping: shipping,
        total: total,
        status: 'completed',
        createdAt: new Date().toISOString()
      };

      // Create transaction
      const response = await fetch('http://localhost:5000/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });

      if (!response.ok) {
        throw new Error('Failed to create transaction');
      }

      const data = await response.json();
      
      // Clear the cart after successful transaction
      const clearCartResponse = await fetch(`http://localhost:5000/api/cart/${user.id}`, {
        method: 'DELETE',
      });

      if (!clearCartResponse.ok) {
        console.error('Failed to clear cart');
      }

      // Show success modal
      setCompletedTransaction(data);
      setShowSuccessModal(true);
      setCart([]);
      
    } catch (error) {
      console.error('Error completing order:', error);
      alert('Failed to complete order. Please try again.');
    } finally {
      setProcessingCheckout(false);
    }
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08; // 8% tax
  const shipping = subtotal > 100 ? 0 : 15; // Free shipping over $100
  const total = subtotal + tax + shipping;

  if (loading) {
    return (
      <div style={styles.container}>
        <Header cart={cart} />
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <Header cart={cart} />
        <div style={styles.errorContainer}>
          <p style={styles.errorText}>{error}</p>
          <button style={styles.button} onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Header cart={cart} />
      
      {/* Success Modal */}
      {showSuccessModal && (
        <div style={styles.modalOverlay} onClick={() => setShowSuccessModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.successIcon}>✓</div>
            <h2 style={styles.modalTitle}>Order Complete!</h2>
            <p style={styles.modalText}>
              Your order has been successfully placed.
            </p>
            {completedTransaction && (
              <div style={styles.orderDetails}>
                <p style={styles.orderNumber}>
                  Order #{completedTransaction.transactionId}
                </p>
                <p style={styles.orderTotal}>
                  Total: ${total.toFixed(2)}
                </p>
              </div>
            )}
            <div style={styles.modalButtons}>
              <button 
                style={styles.primaryButton}
                onClick={() => window.location.href = '/shop'}
              >
                Continue Shopping
              </button>
              <button 
                style={styles.secondaryButton}
                onClick={() => window.location.href = '/orders'}
              >
                View Orders
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.content}>
        <div style={styles.pageHeader}>
          <h1 style={styles.pageTitle}>Shopping Cart</h1>
          <p style={styles.itemCount}>
            {cart.length} {cart.length === 1 ? 'item' : 'items'}
          </p>
        </div>

        {cart.length === 0 ? (
          <div style={styles.emptyCart}>
            <div style={styles.emptyIcon}>🛒</div>
            <h2 style={styles.emptyTitle}>Your cart is empty</h2>
            <p style={styles.emptyText}>
              Discover our exquisite collection of luxury fragrances
            </p>
            <button 
              style={styles.button}
              onClick={() => window.location.href = '/shop'}
            >
              EXPLORE COLLECTIONS
            </button>
          </div>
        ) : (
          <div style={styles.cartLayout}>
            {/* Cart Items */}
            <div style={styles.cartItems}>
              {cart.map((item) => (
                <div key={item._id} style={styles.cartItem}>
                  <a href={`/product/${item.productId}`} style={styles.itemImage}>
                    <img 
                      src={item.image || '/defaultproductpic.jpg'} 
                      alt={item.name}
                      style={styles.productImage}
                    />
                  </a>
                  
                  <div style={styles.itemDetails}>
                    <a 
                      href={`/product/${item.productId}`}
                      style={styles.itemName}
                    >
                      {item.name}
                    </a>
                    <p style={styles.itemCollection}>{item.collection || 'Signature Collection'}</p>
                    <p style={styles.itemPrice}>${item.price.toFixed(2)}</p>
                  </div>

                  <div style={styles.itemActions}>
                    <div style={styles.quantityControl}>
                      <button 
                        style={styles.quantityButton}
                        onClick={() => updateQuantity(item._id, item.quantity - 1)}
                        disabled={updatingItemId === item._id || item.quantity <= 1}
                      >
                        −
                      </button>
                      <span style={styles.quantity}>
                        {updatingItemId === item._id ? '...' : item.quantity}
                      </span>
                      <button 
                        style={styles.quantityButton}
                        onClick={() => updateQuantity(item._id, item.quantity + 1)}
                        disabled={updatingItemId === item._id}
                      >
                        +
                      </button>
                    </div>
                    
                    <p style={styles.itemTotal}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                    
                    <button 
                      style={styles.removeButton}
                      onClick={() => removeItem(item._id)}
                      title="Remove item"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div style={styles.summaryContainer}>
              <div style={styles.summary}>
                <h2 style={styles.summaryTitle}>Order Summary</h2>
                
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Subtotal</span>
                  <span style={styles.summaryValue}>${subtotal.toFixed(2)}</span>
                </div>
                
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Tax (8%)</span>
                  <span style={styles.summaryValue}>${tax.toFixed(2)}</span>
                </div>
                
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Shipping</span>
                  <span style={{
                    ...styles.summaryValue,
                    color: shipping === 0 ? '#4caf50' : '#333'
                  }}>
                    {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                  </span>
                </div>

                {subtotal < 100 && (
                  <p style={styles.freeShippingNote}>
                    Add ${(100 - subtotal).toFixed(2)} more for free shipping!
                  </p>
                )}
                
                <div style={styles.summaryDivider}></div>
                
                <div style={styles.summaryRow}>
                  <span style={styles.totalLabel}>Total</span>
                  <span style={styles.totalValue}>${total.toFixed(2)}</span>
                </div>

                <button 
                  style={{
                    ...styles.checkoutButton,
                    opacity: processingCheckout ? 0.7 : 1,
                    cursor: processingCheckout ? 'not-allowed' : 'pointer'
                  }}
                  onClick={handleCompleteOrder}
                  disabled={processingCheckout}
                >
                  {processingCheckout ? 'PROCESSING...' : 'COMPLETE ORDER'}
                </button>

                <button 
                  style={styles.continueShoppingButton}
                  onClick={() => window.location.href = '/shop'}
                >
                  Continue Shopping
                </button>

                <div style={styles.secureCheckout}>
                  <span style={styles.secureIcon}>🔒</span>
                  <span style={styles.secureText}>Secure Checkout</span>
                </div>
              </div>

              {/* Trust Badges */}
              <div style={styles.trustBadges}>
                <div style={styles.trustBadge}>
                  <span style={styles.badgeIcon}>✓</span>
                  <span style={styles.badgeText}>Free Returns</span>
                </div>
                <div style={styles.trustBadge}>
                  <span style={styles.badgeIcon}>✓</span>
                  <span style={styles.badgeText}>Authentic Products</span>
                </div>
                <div style={styles.trustBadge}>
                  <span style={styles.badgeIcon}>✓</span>
                  <span style={styles.badgeText}>Luxury Packaging</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Simplified Header Component
function Header({ cart }) {
  return (
    <nav style={styles.navbar}>
      <a href="/" style={{ textDecoration: 'none' }}>
        <div style={styles.logo}>XERJOFF</div>
      </a>
      <div style={styles.navIcons}>
        <button style={styles.iconButton}>
          🛒
          {cart.length > 0 && <span style={styles.badge}>{cart.length}</span>}
        </button>
      </div>
    </nav>
  );
}

const styles = {
  container: {
    fontFamily: "'Playfair Display', serif",
    backgroundColor: '#faf8f3',
    minHeight: '100vh',
  },
  navbar: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 2px 10px rgba(184, 134, 11, 0.1)',
    zIndex: 1000,
    padding: '1.5rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: '2rem',
    fontWeight: 700,
    background: 'linear-gradient(45deg, #b8860b 30%, #8b6914 90%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  navIcons: {
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'center',
  },
  iconButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.3rem',
    color: '#333',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#b8860b',
    color: 'white',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    fontWeight: 'bold',
  },
  content: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '120px 2rem 4rem',
  },
  pageHeader: {
    marginBottom: '3rem',
    textAlign: 'center',
  },
  pageTitle: {
    fontSize: '3rem',
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: '0.5rem',
  },
  itemCount: {
    fontSize: '1.1rem',
    color: '#666',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: '1rem',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #f5e6d3',
    borderTop: '4px solid #8b6914',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontSize: '1.1rem',
    color: '#666',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: '1.5rem',
  },
  errorText: {
    fontSize: '1.2rem',
    color: '#d32f2f',
  },
  emptyCart: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 2rem',
    backgroundColor: 'white',
    borderRadius: '20px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    maxWidth: '600px',
    margin: '0 auto',
  },
  emptyIcon: {
    fontSize: '5rem',
    marginBottom: '1rem',
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: '2rem',
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: '1rem',
  },
  emptyText: {
    fontSize: '1.1rem',
    color: '#666',
    marginBottom: '2rem',
    textAlign: 'center',
  },
  cartLayout: {
    display: 'grid',
    gridTemplateColumns: '1fr 400px',
    gap: '3rem',
    alignItems: 'start',
  },
  cartItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  cartItem: {
    display: 'grid',
    gridTemplateColumns: '120px 1fr auto',
    gap: '1.5rem',
    padding: '1.5rem',
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    alignItems: 'center',
  },
  itemImage: {
    width: '120px',
    height: '120px',
    borderRadius: '12px',
    overflow: 'hidden',
    backgroundColor: '#f5f0e8',
    display: 'block',
  },
  productImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  itemDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  itemName: {
    fontSize: '1.3rem',
    fontWeight: 700,
    color: '#1a1a1a',
    textDecoration: 'none',
    transition: 'color 0.3s',
  },
  itemCollection: {
    fontSize: '0.9rem',
    color: '#8b6914',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  itemPrice: {
    fontSize: '1.1rem',
    color: '#666',
  },
  itemActions: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '1rem',
  },
  quantityControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#f5f0e8',
    borderRadius: '50px',
    padding: '0.25rem',
  },
  quantityButton: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'white',
    color: '#8b6914',
    fontSize: '1.2rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s',
    fontWeight: 700,
  },
  quantity: {
    fontSize: '1rem',
    fontWeight: 600,
    minWidth: '30px',
    textAlign: 'center',
    color: '#333',
  },
  itemTotal: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#8b6914',
  },
  removeButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.2rem',
    cursor: 'pointer',
    padding: '0.5rem',
    opacity: 0.6,
    transition: 'opacity 0.3s',
  },
  summaryContainer: {
    position: 'sticky',
    top: '120px',
  },
  summary: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '2rem',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  },
  summaryTitle: {
    fontSize: '1.8rem',
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: '1.5rem',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '1rem',
  },
  summaryLabel: {
    fontSize: '1rem',
    color: '#666',
  },
  summaryValue: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#333',
  },
  freeShippingNote: {
    fontSize: '0.9rem',
    color: '#4caf50',
    fontStyle: 'italic',
    marginTop: '0.5rem',
    marginBottom: '1rem',
  },
  summaryDivider: {
    height: '1px',
    backgroundColor: '#e0e0e0',
    margin: '1.5rem 0',
  },
  totalLabel: {
    fontSize: '1.3rem',
    fontWeight: 700,
    color: '#1a1a1a',
  },
  totalValue: {
    fontSize: '1.8rem',
    fontWeight: 700,
    color: '#8b6914',
  },
  checkoutButton: {
    width: '100%',
    backgroundColor: '#8b6914',
    color: 'white',
    padding: '1rem',
    borderRadius: '50px',
    border: 'none',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '1.5rem',
    transition: 'all 0.3s',
  },
  continueShoppingButton: {
    width: '100%',
    backgroundColor: 'transparent',
    color: '#8b6914',
    padding: '1rem',
    borderRadius: '50px',
    border: '2px solid #8b6914',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '1rem',
    transition: 'all 0.3s',
  },
  button: {
    backgroundColor: '#8b6914',
    color: 'white',
    padding: '1rem 2.5rem',
    borderRadius: '50px',
    border: 'none',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  secureCheckout: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    marginTop: '1.5rem',
    padding: '1rem',
    backgroundColor: '#f5f0e8',
    borderRadius: '8px',
  },
  secureIcon: {
    fontSize: '1rem',
  },
  secureText: {
    fontSize: '0.9rem',
    color: '#666',
    fontWeight: 600,
  },
  trustBadges: {
    marginTop: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  trustBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.9rem',
    color: '#666',
  },
  badgeIcon: {
    color: '#4caf50',
    fontWeight: 700,
  },
  badgeText: {
    fontWeight: 500,
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: '2rem',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '24px',
    padding: '3rem',
    maxWidth: '500px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  successIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#4caf50',
    color: 'white',
    fontSize: '3rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.5rem',
    fontWeight: 700,
  },
  modalTitle: {
    fontSize: '2rem',
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: '1rem',
  },
  modalText: {
    fontSize: '1.1rem',
    color: '#666',
    marginBottom: '2rem',
  },
  orderDetails: {
    backgroundColor: '#f5f0e8',
    padding: '1.5rem',
    borderRadius: '12px',
    marginBottom: '2rem',
  },
  orderNumber: {
    fontSize: '1rem',
    color: '#666',
    marginBottom: '0.5rem',
  },
  orderTotal: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#8b6914',
  },
  modalButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#8b6914',
    color: 'white',
    padding: '1rem',
    borderRadius: '50px',
    border: 'none',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: 'transparent',
    color: '#8b6914',
    padding: '1rem',
    borderRadius: '50px',
    border: '2px solid #8b6914',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
};

// Add CSS animation for spinner
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @media (max-width: 1024px) {
    .cartLayout {
      grid-template-columns: 1fr !important;
    }
  }
  
  @media (max-width: 768px) {
    .cartItem {
      grid-template-columns: 80px 1fr !important;
      gap: 1rem !important;
    }
    
    .itemActions {
      grid-column: 1 / -1;
      flex-direction: row;
      justify-content: space-between;
      width: 100%;
    }
  }
`;
document.head.appendChild(styleSheet);