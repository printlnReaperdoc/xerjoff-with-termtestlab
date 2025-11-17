import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import ProductReviews from "../Components/ProductReviews";
import axios from 'axios';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('100ml');

  // Check if user is logged in and fetch cart
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        // Fetch cart from API
        const fetchCart = async () => {
          try {
            const response = await axios.get(`http://localhost:5000/api/cart/${userData.id}`);
            setCart(response.data.items || []);
          } catch (err) {
            console.error('Failed to fetch cart:', err);
            setCart([]);
          }
        };
        fetchCart();
      } catch (err) {
        console.error('Failed to parse user data:', err);
        setCart([]);
      }
    } else {
      // If not logged in, load from localStorage as fallback
      try {
        const savedCart = localStorage.getItem('shopping-cart');
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        }
      } catch (err) {
        console.error('Failed to load cart:', err);
        setCart([]);
      }
    }
  }, []);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/products/${id}`);
        console.log('Fetched product:', response.data); // Debug log
        setProduct(response.data);
        setSelectedSize(response.data.volume);
        setError(null);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const addToCart = async () => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    
    if (storedUser) {
      // User is logged in - use API
      try {
        const userData = JSON.parse(storedUser);
        console.log('Product ID:', product._id || product.id); // Debug log
        const response = await axios.post(`http://localhost:5000/api/cart/${userData.id}`, {
          productId: product._id || product.id, // Try _id first, fallback to id
          quantity: quantity
        });
        
        // Update cart state with response
        setCart(response.data.items || []);
        alert(`${quantity}x ${product.name} (${selectedSize}) added to cart!`);
        setQuantity(1);
      } catch (err) {
        console.error('Failed to add to cart:', err);
        console.error('Error details:', err.response?.data); // More detailed error
        alert('Failed to add item to cart. Please try again.');
      }
    } else {
      // User not logged in - use localStorage as fallback
      const cartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity,
        selectedSize,
        itemPrice: selectedSize === '50ml' ? Math.round(product.price * 0.6) : product.price
      };
      
      const existingItemIndex = cart.findIndex(
        item => item.id === product.id && item.selectedSize === selectedSize
      );
      
      let updatedCart;
      if (existingItemIndex >= 0) {
        updatedCart = [...cart];
        updatedCart[existingItemIndex].quantity += quantity;
      } else {
        updatedCart = [...cart, cartItem];
      }
      
      setCart(updatedCart);
      
      try {
        localStorage.setItem('shopping-cart', JSON.stringify(updatedCart));
        alert(`${quantity}x ${product.name} (${selectedSize}) added to cart!`);
        setQuantity(1);
      } catch (err) {
        console.error('Failed to save cart:', err);
        alert('Added to cart, but failed to save. Please try again.');
      }
    }
  };

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
    navLinks: {
      display: 'flex',
      gap: '2rem',
      listStyle: 'none',
      margin: 0,
      padding: 0,
    },
    navLink: {
      color: '#333',
      textDecoration: 'none',
      fontWeight: 500,
      fontSize: '0.95rem',
      transition: 'color 0.3s',
      cursor: 'pointer',
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
    breadcrumb: {
      paddingTop: '100px',
      paddingBottom: '2rem',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '100px 2rem 2rem',
      display: 'flex',
      gap: '0.5rem',
      alignItems: 'center',
      fontSize: '0.9rem',
      color: '#666',
    },
    breadcrumbLink: {
      color: '#8b6914',
      textDecoration: 'none',
      transition: 'color 0.3s',
    },
    productContainer: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '4rem',
      alignItems: 'start',
    },
    imageSection: {
      position: 'sticky',
      top: '120px',
    },
    mainImage: {
      width: '100%',
      borderRadius: '20px',
      boxShadow: '0 20px 60px rgba(139, 105, 20, 0.3)',
      marginBottom: '1rem',
    },
    thumbnails: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '1rem',
    },
    thumbnail: {
      width: '100%',
      aspectRatio: '1',
      objectFit: 'cover',
      borderRadius: '10px',
      cursor: 'pointer',
      border: '2px solid transparent',
      transition: 'all 0.3s',
    },
    chip: {
      display: 'inline-block',
      backgroundColor: '#f5e6d3',
      color: '#8b6914',
      padding: '0.5rem 1.5rem',
      borderRadius: '50px',
      fontSize: '0.85rem',
      fontWeight: 600,
      marginBottom: '1rem',
    },
    productTitle: {
      fontSize: '3rem',
      fontWeight: 700,
      marginBottom: '1rem',
      color: '#1a1a1a',
    },
    rating: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      marginBottom: '1.5rem',
      fontSize: '1.1rem',
      color: '#b8860b',
    },
    price: {
      fontSize: '2.5rem',
      fontWeight: 700,
      color: '#8b6914',
      marginBottom: '2rem',
    },
    description: {
      fontSize: '1.1rem',
      color: '#666',
      lineHeight: 1.8,
      marginBottom: '2rem',
      paddingBottom: '2rem',
      borderBottom: '1px solid #e0e0e0',
    },
    section: {
      marginBottom: '2rem',
    },
    sectionTitle: {
      fontSize: '1.2rem',
      fontWeight: 600,
      marginBottom: '1rem',
      color: '#1a1a1a',
    },
    notes: {
      fontSize: '1rem',
      color: '#666',
      fontStyle: 'italic',
      lineHeight: 1.8,
    },
    sizeSelector: {
      display: 'flex',
      gap: '1rem',
      marginBottom: '2rem',
    },
    sizeButton: {
      padding: '0.8rem 1.5rem',
      borderRadius: '10px',
      border: '2px solid #e0e0e0',
      backgroundColor: 'white',
      color: '#666',
      fontSize: '0.95rem',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.3s',
    },
    sizeButtonActive: {
      padding: '0.8rem 1.5rem',
      borderRadius: '10px',
      border: '2px solid #8b6914',
      backgroundColor: '#8b6914',
      color: 'white',
      fontSize: '0.95rem',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.3s',
    },
    quantitySelector: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      marginBottom: '2rem',
    },
    quantityButton: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      border: '2px solid #8b6914',
      backgroundColor: 'white',
      color: '#8b6914',
      fontSize: '1.2rem',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.3s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    quantityDisplay: {
      fontSize: '1.2rem',
      fontWeight: 600,
      minWidth: '40px',
      textAlign: 'center',
    },
    addToCartButton: {
      width: '100%',
      backgroundColor: '#8b6914',
      color: 'white',
      padding: '1.2rem 2rem',
      borderRadius: '50px',
      border: 'none',
      fontSize: '1.1rem',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.3s',
      marginBottom: '1rem',
    },
    buyNowButton: {
      width: '100%',
      backgroundColor: 'white',
      color: '#8b6914',
      padding: '1.2rem 2rem',
      borderRadius: '50px',
      border: '2px solid #8b6914',
      fontSize: '1.1rem',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.3s',
    },
    features: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '1.5rem',
      marginTop: '2rem',
      paddingTop: '2rem',
      borderTop: '1px solid #e0e0e0',
    },
    feature: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
    },
    featureIcon: {
      fontSize: '2rem',
    },
    featureText: {
      fontSize: '0.95rem',
      color: '#666',
      lineHeight: 1.4,
    },
    loader: {
      border: '4px solid #f3f3f3',
      borderTop: '4px solid #8b6914',
      borderRadius: '50%',
      width: '50px',
      height: '50px',
      animation: 'spin 1s linear infinite',
      margin: '0 auto',
    },
    errorContainer: {
      textAlign: 'center',
      padding: '4rem 2rem',
      color: '#ff4444',
    },
    backButton: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      color: '#8b6914',
      textDecoration: 'none',
      fontSize: '0.95rem',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.3s',
    },
    stockBadge: {
      display: 'inline-block',
      padding: '0.5rem 1rem',
      borderRadius: '20px',
      fontSize: '0.85rem',
      fontWeight: 600,
      marginBottom: '1rem',
      marginLeft: '0.5rem',
    },
    inStock: {
      backgroundColor: '#d4edda',
      color: '#155724',
    },
    outOfStock: {
      backgroundColor: '#f8d7da',
      color: '#721c24',
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <nav style={styles.navbar}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <div style={styles.logo}>XERJOFF</div>
          </Link>
        </nav>
        <div style={{ textAlign: 'center', paddingTop: '200px', paddingBottom: '100px' }}>
          <div style={styles.loader}></div>
          <p style={{ marginTop: '1rem', color: '#666' }}>Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={styles.container}>
        <nav style={styles.navbar}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <div style={styles.logo}>XERJOFF</div>
          </Link>
        </nav>
        <div style={styles.errorContainer}>
          <p>{error || 'Product not found'}</p>
          <button 
            style={{ 
              backgroundColor: '#8b6914',
              color: 'white',
              padding: '1rem 2rem',
              borderRadius: '50px',
              border: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: '1rem'
            }}
            onClick={() => navigate('/shop')}
          >
            Back to Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Navigation */}
      <nav style={styles.navbar}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <div style={styles.logo}>XERJOFF</div>
        </Link>
        <ul style={styles.navLinks}>
          <li><Link to="/shop" style={styles.navLink}>Collections</Link></li>
          <li><a style={styles.navLink}>New Arrivals</a></li>
          <li><a style={styles.navLink}>About</a></li>
        </ul>
        <div style={styles.navIcons}>
          <button style={styles.iconButton}>🔍</button>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div style={styles.breadcrumb}>
        <Link to="/" style={styles.breadcrumbLink}>Home</Link>
        <span>/</span>
        <Link to="/shop" style={styles.breadcrumbLink}>Shop</Link>
        <span>/</span>
        <span>{product.name}</span>
      </div>

      {/* Product Detail */}
      <div style={styles.productContainer}>
        {/* Image Section */}
        <div style={styles.imageSection}>
          <img src={product.image} alt={product.name} style={styles.mainImage} />
          <div style={styles.thumbnails}>
            <img src={product.image} alt={product.name} style={styles.thumbnail} />
            <img src={product.image} alt={product.name} style={styles.thumbnail} />
            <img src={product.image} alt={product.name} style={styles.thumbnail} />
            <img src={product.image} alt={product.name} style={styles.thumbnail} />
          </div>
        </div>

        {/* Product Info */}
        <div>
          <button style={styles.backButton} onClick={() => navigate('/shop')}>
            ← Back to Shop
          </button>
          
          <div style={{ marginTop: '1.5rem' }}>
            <span style={styles.chip}>{product.collection}</span>
            <span 
              style={{
                ...styles.stockBadge,
                ...(product.inStock ? styles.inStock : styles.outOfStock)
              }}
            >
              {product.inStock ? '✓ In Stock' : '✗ Out of Stock'}
            </span>
          </div>

          <h1 style={styles.productTitle}>{product.name}</h1>

          <div style={styles.rating}>
            <span>⭐ {product.averageRating || product.rating || 0}</span>
            <span style={{ color: '#999', fontSize: '0.95rem' }}>
              ({product.reviewCount || 0} reviews)
            </span>
          </div>

          <div style={styles.price}>${product.price}</div>

          <p style={styles.description}>{product.description}</p>

          {/* Fragrance Notes */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Fragrance Notes</h3>
            <p style={styles.notes}>{product.notes}</p>
          </div>

          {/* Category */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Category</h3>
            <p style={styles.notes}>{product.category}</p>
          </div>

          {/* Size Selector */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Select Size</h3>
            <div style={styles.sizeSelector}>
              <button 
                style={selectedSize === '50ml' ? styles.sizeButtonActive : styles.sizeButton}
                onClick={() => setSelectedSize('50ml')}
              >
                50ml - ${Math.round(product.price * 0.6)}
              </button>
              <button 
                style={selectedSize === '100ml' ? styles.sizeButtonActive : styles.sizeButton}
                onClick={() => setSelectedSize('100ml')}
              >
                100ml - ${product.price}
              </button>
            </div>
          </div>

          {/* Quantity Selector */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Quantity</h3>
            <div style={styles.quantitySelector}>
              <button 
                style={styles.quantityButton}
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={!product.inStock}
              >
                -
              </button>
              <div style={styles.quantityDisplay}>{quantity}</div>
              <button 
                style={styles.quantityButton}
                onClick={() => setQuantity(quantity + 1)}
                disabled={!product.inStock}
              >
                +
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <button 
            style={{
              ...styles.addToCartButton,
              opacity: product.inStock ? 1 : 0.5,
              cursor: product.inStock ? 'pointer' : 'not-allowed'
            }}
            onClick={addToCart}
            disabled={!product.inStock}
            onMouseOver={(e) => {
              if (product.inStock) {
                e.currentTarget.style.backgroundColor = '#6d5010';
              }
            }}
            onMouseOut={(e) => {
              if (product.inStock) {
                e.currentTarget.style.backgroundColor = '#8b6914';
              }
            }}
          >
            {product.inStock ? 'Add to Cart' : 'Out of Stock'}
          </button>

          <button 
            style={styles.buyNowButton}
            disabled={!product.inStock}
            onMouseOver={(e) => {
              if (product.inStock) {
                e.currentTarget.style.backgroundColor = '#8b6914';
                e.currentTarget.style.color = 'white';
              }
            }}
            onMouseOut={(e) => {
              if (product.inStock) {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.color = '#8b6914';
              }
            }}
          >
            Buy Now
          </button>

          {/* Features */}
          <div style={styles.features}>
            <div style={styles.feature}>
              <div style={styles.featureIcon}>🚚</div>
              <div style={styles.featureText}>
                <strong>Free Shipping</strong><br />
                On orders over $200
              </div>
            </div>
            <div style={styles.feature}>
              <div style={styles.featureIcon}>✓</div>
              <div style={styles.featureText}>
                <strong>Authentic</strong><br />
                100% Original Products
              </div>
            </div>
            <div style={styles.feature}>
              <div style={styles.featureIcon}>↩️</div>
              <div style={styles.featureText}>
                <strong>Easy Returns</strong><br />
                30-day return policy
              </div>
            </div>
            <div style={styles.feature}>
              <div style={styles.featureIcon}>🎁</div>
              <div style={styles.featureText}>
                <strong>Gift Wrapping</strong><br />
                Available at checkout
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* REVIEW COMPONENT */}
      <ProductReviews productId={id} />

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .productContainer {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}