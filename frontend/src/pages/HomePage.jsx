import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import Header from '../Header';

// HomePage Component
export default function HomePage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef(null);

  // Fetch products
  const fetchProducts = useCallback(async (pageNum) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/products?page=${pageNum}&limit=12`);
      const data = await response.json();
      
      if (data.length === 0) {
        setHasMore(false);
      } else {
        setProducts(prev => pageNum === 1 ? data : [...prev, ...data]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // Initial load
  useEffect(() => {
    fetchProducts(1);
  }, []);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loading]);

  // Fetch when page changes
  useEffect(() => {
    if (page > 1) {
      fetchProducts(page);
    }
  }, [page, fetchProducts]);

  return (
    <div style={styles.container}>
      {/* Navigation */}
      <Header cart={cart} />

      {/* Hero Section */}
      <div style={styles.hero}>
        <div style={styles.heroContainer}>
          <div>
            <span style={styles.chip}>SPRING 2024 COLLECTION</span>
            <h1 style={styles.heroTitle}>
              The Art of<br />Italian<br />Perfumery
            </h1>
            <p style={styles.heroText}>
              Experience the pinnacle of luxury fragrance craftsmanship. Each scent tells a story of elegance, tradition, and timeless beauty.
            </p>
            <button 
              style={styles.button} 
              onClick={() => navigate('/shop')}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#6d5010'} 
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#8b6914'}
            >
              EXPLORE COLLECTIONS →
            </button>
          </div>
          <div>
            <img 
              src="https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600&h=700&fit=crop" 
              alt="Luxury Perfume"
              style={styles.heroImage}
            />
          </div>
        </div>
      </div>

      {/* Products Section with Infinite Scroll */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Featured Collections</h2>
        <p style={styles.sectionSubtitle}>
          Discover our most coveted fragrances, meticulously crafted with the finest ingredients from around the world.
        </p>

        {/* Products Grid */}
        <div style={styles.productsGrid}>
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>Loading more fragrances...</p>
          </div>
        )}

        {/* Intersection Observer Target */}
        {hasMore && <div ref={observerTarget} style={styles.observerTarget}></div>}

        {/* No More Products Message */}
        {!hasMore && products.length > 0 && (
          <p style={styles.endMessage}>You've viewed all our exquisite fragrances</p>
        )}

        {/* No Products Message */}
        {!loading && products.length === 0 && (
          <p style={styles.noProducts}>No products available at the moment</p>
        )}
      </div>

      {/* Experience Section */}
      <div style={styles.experienceSection}>
        <div style={styles.experienceGrid}>
          <div style={styles.experienceCard}>
            <div style={styles.experienceIcon}>💎</div>
            <h3 style={styles.experienceTitle}>Artisanal Craftsmanship</h3>
            <p style={styles.experienceText}>
              Each fragrance is handcrafted by master perfumers using time-honored techniques
            </p>
          </div>
          <div style={styles.experienceCard}>
            <div style={styles.experienceIcon}>🌸</div>
            <h3 style={styles.experienceTitle}>Rare Ingredients</h3>
            <p style={styles.experienceText}>
              Sourced from the most exotic locations, ensuring unparalleled quality and uniqueness
            </p>
          </div>
          <div style={styles.experienceCard}>
            <div style={styles.experienceIcon}>❤️</div>
            <h3 style={styles.experienceTitle}>Timeless Elegance</h3>
            <p style={styles.experienceText}>
              Sophisticated scents that transcend trends and become your signature
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

// Product Card Component
function ProductCard({ product }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link 
      to={`/product/${product._id}`} 
      style={styles.productCard}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={styles.productImageContainer}>
        <img 
          src={product.image || 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=500&fit=crop'} 
          alt={product.name}
          style={{
            ...styles.productImage,
            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          }}
        />
        {product.featured && (
          <span style={styles.featuredBadge}>FEATURED</span>
        )}
      </div>
      <div style={styles.productInfo}>
        <p style={styles.productCollection}>{product.collection || 'Signature Collection'}</p>
        <h3 style={styles.productName}>{product.name}</h3>
        <p style={styles.productDescription}>
          {product.description?.substring(0, 80)}...
        </p>
        <div style={styles.productFooter}>
          <span style={styles.productPrice}>
            ${product.price ? product.price.toFixed(2) : '0.00'}
          </span>
          <span style={{
            ...styles.viewDetails,
            opacity: isHovered ? 1 : 0,
          }}>
            View Details →
          </span>
        </div>
      </div>
    </Link>
  );
}

// Footer Component
function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={styles.footerContainer}>
        <div>
          <h4 style={styles.footerTitle}>XERJOFF</h4>
          <p style={styles.footerText}>
            The pinnacle of Italian luxury perfumery since 2003.
          </p>
        </div>
        <div>
          <h5 style={{ ...styles.footerTitle, fontSize: '1.2rem' }}>Collections</h5>
          <ul style={styles.footerLinks}>
            <li><Link to="/shop" style={styles.footerLink}>V Collection</Link></li>
            <li><Link to="/shop" style={styles.footerLink}>XJ Collection</Link></li>
            <li><Link to="/shop" style={styles.footerLink}>Casamorati</Link></li>
          </ul>
        </div>
        <div>
          <h5 style={{ ...styles.footerTitle, fontSize: '1.2rem' }}>Customer Care</h5>
          <ul style={styles.footerLinks}>
            <li><a style={styles.footerLink}>Contact Us</a></li>
            <li><a style={styles.footerLink}>Shipping</a></li>
            <li><a style={styles.footerLink}>Returns</a></li>
          </ul>
        </div>
        <div>
          <h5 style={{ ...styles.footerTitle, fontSize: '1.2rem' }}>Newsletter</h5>
          <p style={{ ...styles.footerText, marginBottom: '1rem' }}>
            Subscribe for exclusive offers
          </p>
          <input type="email" placeholder="Your email" style={styles.input} />
        </div>
      </div>
      <div style={styles.footerBottom}>
        © 2024 Xerjoff. All rights reserved. Luxury Italian Perfumery.
      </div>
    </footer>
  );
}

// Styles
const styles = {
  container: {
    fontFamily: "'Playfair Display', serif",
    backgroundColor: '#faf8f3',
    minHeight: '100vh',
  },
  hero: {
    paddingTop: '120px',
    paddingBottom: '80px',
    background: 'linear-gradient(135deg, #faf8f3 0%, #f5f0e8 100%)',
  },
  heroContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 2rem',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '4rem',
    alignItems: 'center',
  },
  chip: {
    display: 'inline-block',
    backgroundColor: '#f5e6d3',
    color: '#8b6914',
    padding: '0.5rem 1.5rem',
    borderRadius: '50px',
    fontSize: '0.85rem',
    fontWeight: 600,
    marginBottom: '2rem',
  },
  heroTitle: {
    fontSize: '4rem',
    fontWeight: 700,
    lineHeight: 1.2,
    marginBottom: '1.5rem',
    color: '#1a1a1a',
  },
  heroText: {
    fontSize: '1.1rem',
    color: '#666',
    lineHeight: 1.8,
    marginBottom: '2rem',
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
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.3s',
  },
  heroImage: {
    width: '100%',
    borderRadius: '20px',
    boxShadow: '0 20px 60px rgba(139, 105, 20, 0.3)',
  },
  section: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '5rem 2rem',
  },
  sectionTitle: {
    textAlign: 'center',
    fontSize: '3rem',
    fontWeight: 700,
    marginBottom: '1rem',
    color: '#1a1a1a',
  },
  sectionSubtitle: {
    textAlign: 'center',
    fontSize: '1.1rem',
    color: '#666',
    maxWidth: '700px',
    margin: '0 auto 4rem',
    lineHeight: 1.6,
  },
  productsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '2rem',
    marginBottom: '3rem',
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    textDecoration: 'none',
    color: 'inherit',
    display: 'flex',
    flexDirection: 'column',
  },
  productImageContainer: {
    position: 'relative',
    width: '100%',
    height: '320px',
    overflow: 'hidden',
    backgroundColor: '#f5f0e8',
  },
  productImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.4s ease',
  },
  featuredBadge: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    backgroundColor: '#8b6914',
    color: 'white',
    padding: '0.4rem 1rem',
    borderRadius: '50px',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  productInfo: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    flex: 1,
  },
  productCollection: {
    fontSize: '0.85rem',
    color: '#8b6914',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  productName: {
    fontSize: '1.3rem',
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: '0.5rem',
  },
  productDescription: {
    fontSize: '0.95rem',
    color: '#666',
    lineHeight: 1.5,
    flex: 1,
  },
  productFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #f0f0f0',
  },
  productPrice: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#8b6914',
  },
  viewDetails: {
    fontSize: '0.9rem',
    color: '#8b6914',
    fontWeight: 600,
    transition: 'opacity 0.3s ease',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 0',
    gap: '1rem',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f5e6d3',
    borderTop: '4px solid #8b6914',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontSize: '1rem',
    color: '#666',
    fontStyle: 'italic',
  },
  observerTarget: {
    height: '20px',
    margin: '2rem 0',
  },
  endMessage: {
    textAlign: 'center',
    fontSize: '1.1rem',
    color: '#8b6914',
    fontStyle: 'italic',
    padding: '2rem 0',
  },
  noProducts: {
    textAlign: 'center',
    fontSize: '1.2rem',
    color: '#666',
    padding: '3rem 0',
  },
  experienceSection: {
    background: 'linear-gradient(135deg, #8b6914 0%, #6d5010 100%)',
    color: 'white',
    padding: '5rem 2rem',
  },
  experienceGrid: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '3rem',
  },
  experienceCard: {
    textAlign: 'center',
    padding: '2rem',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
  },
  experienceIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.5rem',
    fontSize: '2rem',
  },
  experienceTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    marginBottom: '1rem',
  },
  experienceText: {
    fontSize: '1rem',
    opacity: 0.9,
    lineHeight: 1.6,
  },
  footer: {
    backgroundColor: '#1a1a1a',
    color: 'white',
    padding: '4rem 2rem',
  },
  footerContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '3rem',
    marginBottom: '3rem',
  },
  footerTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    marginBottom: '1rem',
  },
  footerText: {
    fontSize: '0.95rem',
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 1.6,
  },
  footerLinks: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.8rem',
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  footerLink: {
    color: 'rgba(255,255,255,0.7)',
    textDecoration: 'none',
    fontSize: '0.95rem',
    transition: 'color 0.3s',
    cursor: 'pointer',
  },
  input: {
    width: '100%',
    padding: '0.9rem',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: 'white',
    fontSize: '0.95rem',
  },
  footerBottom: {
    borderTop: '1px solid rgba(255,255,255,0.1)',
    paddingTop: '2rem',
    textAlign: 'center',
    fontSize: '0.9rem',
    color: 'rgba(255,255,255,0.7)',
  },
};

// Add CSS animation for spinner
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);