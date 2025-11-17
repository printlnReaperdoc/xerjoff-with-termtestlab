import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../Header';

export default function ShopPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]);
  const [filter, setFilter] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [minRating, setMinRating] = useState(0);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      const maxPrice = Math.max(...products.map(p => p.price));
      setPriceRange([0, maxPrice]);
    }
  }, [products]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/products');
      setProducts(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item, e) => {
    e.stopPropagation();
    setCart([...cart, item]);
    alert(`${item.name} added to cart!`);
  };

  const handleCardClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  const filteredProducts = products
    .filter(p => filter === 'all' || p.collection === filter)
    .filter(p => p.price >= priceRange[0] && p.price <= priceRange[1])
    .filter(p => p.rating >= minRating);

  const collections = [...new Set(products.map(p => p.collection))];
  
  const maxPrice = products.length > 0 ? Math.max(...products.map(p => p.price)) : 1000;
  
  const resetFilters = () => {
    setFilter('all');
    setPriceRange([0, maxPrice]);
    setMinRating(0);
  };

  const styles = {
    container: {
      fontFamily: "'Playfair Display', serif",
      backgroundColor: '#faf8f3',
      minHeight: '100vh',
    },
    hero: {
      paddingTop: '140px',
      paddingBottom: '60px',
      background: 'linear-gradient(135deg, #faf8f3 0%, #f5f0e8 100%)',
    },
    heroTitle: {
      fontSize: '3.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      marginBottom: '1rem',
      color: '#1a1a1a',
      textAlign: 'center',
    },
    heroText: {
      fontSize: '1.1rem',
      color: '#666',
      lineHeight: 1.8,
      marginBottom: '2rem',
      textAlign: 'center',
    },
    section: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '3rem 2rem 5rem',
    },
    filtersWrapper: {
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '2rem',
      marginBottom: '3rem',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    },
    filtersTitle: {
      fontSize: '1.3rem',
      fontWeight: 700,
      marginBottom: '1.5rem',
      color: '#1a1a1a',
    },
    filterRow: {
      marginBottom: '2rem',
    },
    filterLabel: {
      fontSize: '0.95rem',
      fontWeight: 600,
      color: '#666',
      marginBottom: '0.8rem',
      display: 'block',
    },
    filterContainer: {
      display: 'flex',
      gap: '1rem',
      flexWrap: 'wrap',
    },
    filterButton: {
      padding: '0.7rem 1.5rem',
      borderRadius: '50px',
      border: '2px solid #e0e0e0',
      backgroundColor: 'white',
      color: '#666',
      fontSize: '0.95rem',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.3s',
    },
    filterButtonActive: {
      padding: '0.7rem 1.5rem',
      borderRadius: '50px',
      border: '2px solid #8b6914',
      backgroundColor: '#8b6914',
      color: 'white',
      fontSize: '0.95rem',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.3s',
    },
    priceInputs: {
      display: 'flex',
      gap: '1rem',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    priceInput: {
      padding: '0.6rem 1rem',
      borderRadius: '8px',
      border: '2px solid #e0e0e0',
      fontSize: '0.95rem',
      width: '120px',
    },
    slider: {
      width: '100%',
      height: '6px',
      borderRadius: '3px',
      background: 'linear-gradient(to right, #8b6914 0%, #8b6914 ' + ((priceRange[1] / maxPrice) * 100) + '%, #e0e0e0 ' + ((priceRange[1] / maxPrice) * 100) + '%, #e0e0e0 100%)',
      outline: 'none',
      cursor: 'pointer',
      marginTop: '1rem',
    },
    ratingButtons: {
      display: 'flex',
      gap: '0.8rem',
      flexWrap: 'wrap',
    },
    ratingButton: {
      padding: '0.6rem 1.2rem',
      borderRadius: '8px',
      border: '2px solid #e0e0e0',
      backgroundColor: 'white',
      color: '#666',
      fontSize: '0.9rem',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.3s',
      display: 'flex',
      alignItems: 'center',
      gap: '0.3rem',
    },
    ratingButtonActive: {
      padding: '0.6rem 1.2rem',
      borderRadius: '8px',
      border: '2px solid #8b6914',
      backgroundColor: '#f5e6d3',
      color: '#8b6914',
      fontSize: '0.9rem',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.3s',
      display: 'flex',
      alignItems: 'center',
      gap: '0.3rem',
    },
    resetButton: {
      padding: '0.7rem 1.5rem',
      borderRadius: '8px',
      border: 'none',
      backgroundColor: '#ff4444',
      color: 'white',
      fontSize: '0.95rem',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.3s',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '2rem',
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      transition: 'all 0.3s',
      cursor: 'pointer',
    },
    cardImage: {
      width: '100%',
      height: '300px',
      objectFit: 'cover',
    },
    cardChip: {
      position: 'absolute',
      top: '16px',
      right: '16px',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      padding: '0.4rem 1rem',
      borderRadius: '20px',
      fontSize: '0.75rem',
      fontWeight: 600,
      color: '#8b6914',
    },
    cardContent: {
      padding: '1.5rem',
    },
    cardTitle: {
      fontSize: '1.5rem',
      fontWeight: 700,
      marginBottom: '0.5rem',
      color: '#1a1a1a',
    },
    cardNotes: {
      fontSize: '0.9rem',
      color: '#999',
      fontStyle: 'italic',
      marginBottom: '0.5rem',
    },
    cardPrice: {
      fontSize: '1.8rem',
      fontWeight: 700,
      color: '#8b6914',
      marginBottom: '1rem',
    },
    cardButton: {
      width: '100%',
      backgroundColor: '#f5e6d3',
      color: '#8b6914',
      padding: '0.9rem',
      borderRadius: '8px',
      border: 'none',
      fontSize: '1rem',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.3s',
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

  return (
    <div style={styles.container}>
      <Header cart={cart} />

      {/* Shop Header */}
      <div style={styles.hero}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
          <h1 style={styles.heroTitle}>Our Collections</h1>
          <p style={styles.heroText}>Explore all our exquisite fragrances</p>
        </div>
      </div>

      {/* Filters & Products */}
      <div style={styles.section}>
        {/* Filters Panel */}
        <div style={styles.filtersWrapper}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={styles.filtersTitle}>Filter Products</h3>
            <button 
              style={styles.resetButton}
              onClick={resetFilters}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#cc0000'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ff4444'}
            >
              Reset All
            </button>
          </div>

          {/* Collection Filter */}
          <div style={styles.filterRow}>
            <label style={styles.filterLabel}>Collection</label>
            <div style={styles.filterContainer}>
              <button 
                style={filter === 'all' ? styles.filterButtonActive : styles.filterButton}
                onClick={() => setFilter('all')}
              >
                All Products ({products.length})
              </button>
              {collections.map((collection, idx) => (
                <button 
                  key={idx}
                  style={filter === collection ? styles.filterButtonActive : styles.filterButton}
                  onClick={() => setFilter(collection)}
                >
                  {collection}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div style={styles.filterRow}>
            <label style={styles.filterLabel}>
              Price Range: ${priceRange[0]} - ${priceRange[1]}
            </label>
            <div style={styles.priceInputs}>
              <input 
                type="number"
                value={priceRange[0]}
                onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                style={styles.priceInput}
                placeholder="Min"
                min="0"
              />
              <span style={{ color: '#666' }}>to</span>
              <input 
                type="number"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                style={styles.priceInput}
                placeholder="Max"
                min="0"
              />
            </div>
            <input 
              type="range"
              min="0"
              max={maxPrice}
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
              style={styles.slider}
            />
          </div>

          {/* Rating Filter */}
          <div style={styles.filterRow}>
            <label style={styles.filterLabel}>Minimum Rating</label>
            <div style={styles.ratingButtons}>
              {[0, 3, 3.5, 4, 4.5].map(rating => (
                <button 
                  key={rating}
                  style={minRating === rating ? styles.ratingButtonActive : styles.ratingButton}
                  onClick={() => setMinRating(rating)}
                >
                  {rating === 0 ? 'All Ratings' : `${rating}⭐ & up`}
                </button>
              ))}
            </div>
          </div>

          {/* Results Count */}
          <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f5e6d3', borderRadius: '8px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.95rem', color: '#8b6914', fontWeight: 600 }}>
              Showing {filteredProducts.length} of {products.length} products
            </span>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div style={styles.loader}></div>
            <p style={{ marginTop: '1rem', color: '#666' }}>Loading products...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#ff4444' }}>
            <p>{error}</p>
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
              onClick={fetchProducts}
            >
              Retry
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#666' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No products found matching your filters.</p>
            <p style={{ fontSize: '0.95rem' }}>Try adjusting your filter criteria.</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {filteredProducts.map((product) => (
              <div 
                key={product._id} 
                style={styles.card}
                onClick={() => handleCardClick(product._id)}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(139, 105, 20, 0.2)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                }}
              >
                <div style={{ position: 'relative' }}>
                  <img src={product.image} alt={product.name} style={styles.cardImage} />
                  <span style={styles.cardChip}>{product.collection}</span>
                  {!product.inStock && (
                    <span style={{ ...styles.cardChip, right: 'auto', left: '16px', backgroundColor: '#ff4444', color: 'white' }}>
                      Out of Stock
                    </span>
                  )}
                </div>
                <div style={styles.cardContent}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h3 style={styles.cardTitle}>{product.name}</h3>
                    <span style={{ color: '#b8860b' }}>⭐ {product.rating}</span>
                  </div>
                  <p style={styles.cardNotes}>{product.notes}</p>
                  <p style={{ fontSize: '0.85rem', color: '#999', marginBottom: '0.5rem' }}>
                    {product.volume} • {product.category}
                  </p>
                  <div style={styles.cardPrice}>${product.price}</div>
                  <button 
                    style={product.inStock ? styles.cardButton : { ...styles.cardButton, opacity: 0.5, cursor: 'not-allowed' }}
                    onClick={(e) => product.inStock && addToCart(product, e)}
                    disabled={!product.inStock}
                    onMouseOver={(e) => {
                      if (product.inStock) {
                        e.currentTarget.style.backgroundColor = '#8b6914';
                        e.currentTarget.style.color = 'white';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (product.inStock) {
                        e.currentTarget.style.backgroundColor = '#f5e6d3';
                        e.currentTarget.style.color = '#8b6914';
                      }
                    }}
                  >
                    {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
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

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}