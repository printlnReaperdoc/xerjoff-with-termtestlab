import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from '../Header';

export default function ManageReviews() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, 5, 4, 3, 2, 1
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    // Check if user is logged in and is admin
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      alert('Please login to access admin dashboard');
      navigate('/login');
      return;
    }

    try {
      const userData = JSON.parse(storedUser);
      if (!userData.isAdmin) {
        alert('Access denied. Admin privileges required.');
        navigate('/');
        return;
      }
      setUser(userData);
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/login');
      return;
    }

    fetchAllReviews();
  }, [navigate]);

  const fetchAllReviews = async () => {
    try {
      setLoading(true);
      
      // Fetch all reviews directly from the database (with product details populated)
      const reviewsRes = await fetch('/api/reviews/all/reviews');
      const reviewsData = await reviewsRes.json();
      
      // Reviews already have product info populated from backend
      // Map it to productInfo for consistent access
      const reviewsWithProduct = reviewsData.map(review => ({
        ...review,
        productInfo: review.product || { name: 'Unknown Product' }
      }));

      // Already sorted by creation date from backend
      setReviews(reviewsWithProduct);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      alert('Failed to load reviews. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          isAdmin: user.isAdmin,
        }),
      });

      if (response.ok) {
        setReviews(reviews.filter(review => review._id !== reviewId));
        setDeleteConfirm(null);
        alert('Review deleted successfully');
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to delete review');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review. Please try again.');
    }
  };

  const getFilteredReviews = () => {
    let filtered = reviews;

    // Filter by rating
    if (filter !== 'all') {
      filtered = filtered.filter(review => review.rating === parseInt(filter));
    }

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(review => 
        review.title?.toLowerCase().includes(search) ||
        review.comment?.toLowerCase().includes(search) ||
        review.name?.toLowerCase().includes(search) ||
        review.productInfo?.name?.toLowerCase().includes(search)
      );
    }

    return filtered;
  };

  const filteredReviews = getFilteredReviews();

  const getStats = () => {
    const total = reviews.length;
    const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalRating = 0;

    reviews.forEach(review => {
      ratingCounts[review.rating]++;
      totalRating += review.rating;
    });

    const averageRating = total > 0 ? (totalRating / total).toFixed(1) : 0;

    return { total, ratingCounts, averageRating };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div style={styles.container}>
        <Header cart={[]} />
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Header cart={[]} />

      <div style={styles.content}>
        {/* Page Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Reviews Management</h1>
            <p style={styles.subtitle}>
              Monitor and moderate customer reviews across all products
            </p>
          </div>
          <button 
            style={styles.backButton}
            onClick={() => navigate('/admin')}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#8b6914';
              e.currentTarget.style.color = 'white';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.color = '#8b6914';
            }}
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Statistics */}
        <div style={styles.statsGrid}>
          <StatCard
            icon="⭐"
            title="Total Reviews"
            value={stats.total}
            color="#8b6914"
          />
          <StatCard
            icon="📊"
            title="Average Rating"
            value={`${stats.averageRating} / 5.0`}
            color="#d4af37"
          />
          <StatCard
            icon="👍"
            title="5-Star Reviews"
            value={stats.ratingCounts[5]}
            color="#10b981"
          />
          <StatCard
            icon="⚠️"
            title="Low Ratings (1-2 ★)"
            value={stats.ratingCounts[1] + stats.ratingCounts[2]}
            color="#ef4444"
          />
        </div>

        {/* Filters and Search */}
        <div style={styles.filtersContainer}>
          <div style={styles.filterButtons}>
            <FilterButton
              label="All Reviews"
              count={reviews.length}
              active={filter === 'all'}
              onClick={() => setFilter('all')}
            />
            {[5, 4, 3, 2, 1].map(rating => (
              <FilterButton
                key={rating}
                label={`${rating} Star`}
                count={stats.ratingCounts[rating]}
                active={filter === rating.toString()}
                onClick={() => setFilter(rating.toString())}
              />
            ))}
          </div>
          
          <div style={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search reviews, products, or reviewers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>
        </div>

        {/* Reviews List */}
        <div style={styles.reviewsContainer}>
          {filteredReviews.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyIcon}>📭</p>
              <p style={styles.emptyText}>No reviews found</p>
              <p style={styles.emptySubtext}>
                {searchTerm || filter !== 'all' 
                  ? 'Try adjusting your filters or search term'
                  : 'Reviews will appear here once customers start reviewing products'}
              </p>
            </div>
          ) : (
            filteredReviews.map(review => (
              <ReviewCard
                key={review._id}
                review={review}
                onDelete={() => setDeleteConfirm(review._id)}
              />
            ))
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div style={styles.modalOverlay} onClick={() => setDeleteConfirm(null)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h3 style={styles.modalTitle}>Delete Review?</h3>
              <p style={styles.modalText}>
                Are you sure you want to delete this review? This action cannot be undone.
              </p>
              <div style={styles.modalButtons}>
                <button
                  style={styles.cancelButton}
                  onClick={() => setDeleteConfirm(null)}
                >
                  Cancel
                </button>
                <button
                  style={styles.deleteButton}
                  onClick={() => handleDeleteReview(deleteConfirm)}
                >
                  Delete Review
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ icon, title, value, color }) {
  return (
    <div style={{ ...styles.statCard, borderLeftColor: color }}>
      <div style={styles.statIcon}>{icon}</div>
      <div style={styles.statContent}>
        <p style={styles.statTitle}>{title}</p>
        <p style={{ ...styles.statValue, color }}>{value}</p>
      </div>
    </div>
  );
}

// Filter Button Component
function FilterButton({ label, count, active, onClick }) {
  return (
    <button
      style={{
        ...styles.filterButton,
        ...(active ? styles.filterButtonActive : {}),
      }}
      onClick={onClick}
    >
      {label}
      <span style={active ? styles.countActive : styles.count}>({count})</span>
    </button>
  );
}

// Review Card Component
function ReviewCard({ review, onDelete }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderStars = (rating) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  return (
    <div style={styles.reviewCard}>
      <div style={styles.reviewHeader}>
        <div style={styles.reviewProduct}>
          <img
            src={review.productInfo?.image || '/placeholder-product.jpg'}
            alt={review.productInfo?.name}
            style={styles.productImage}
          />
          <div>
            <h4 style={styles.productName}>{review.productInfo?.name}</h4>
            <p style={styles.reviewDate}>{formatDate(review.createdAt)}</p>
          </div>
        </div>
        
        <button
          style={styles.deleteBtn}
          onClick={onDelete}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#fee';
            e.currentTarget.style.color = '#ef4444';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#999';
          }}
        >
          🗑️ Delete
        </button>
      </div>

      <div style={styles.reviewBody}>
        <div style={styles.reviewRating}>
          <span style={styles.stars}>{renderStars(review.rating)}</span>
          <span style={styles.ratingNumber}>{review.rating}.0</span>
        </div>

        <h3 style={styles.reviewTitle}>{review.title}</h3>
        
        <p style={isExpanded ? styles.reviewCommentExpanded : styles.reviewComment}>
          {review.comment}
        </p>
        
        {review.comment.length > 200 && (
          <button
            style={styles.expandButton}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        )}

        <div style={styles.reviewFooter}>
          <div style={styles.reviewerInfo}>
            <span style={styles.reviewerName}>👤 {review.name}</span>
            {review.verifiedPurchase && (
              <span style={styles.verifiedBadge}>✓ Verified Purchase</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    fontFamily: "'Playfair Display', serif",
    backgroundColor: '#faf8f3',
    minHeight: '100vh',
  },
  content: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '120px 2rem 4rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '3rem',
    flexWrap: 'wrap',
    gap: '1.5rem',
  },
  title: {
    fontSize: '3rem',
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: '0.5rem',
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#666',
  },
  backButton: {
    backgroundColor: 'white',
    color: '#8b6914',
    border: '2px solid #8b6914',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s',
    fontFamily: 'inherit',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '3rem',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    borderLeft: '4px solid',
  },
  statIcon: {
    fontSize: '2.5rem',
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    fontSize: '0.9rem',
    color: '#666',
    marginBottom: '0.5rem',
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: 700,
  },
  filtersContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '2rem',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
  },
  filterButtons: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
  },
  filterButton: {
    backgroundColor: '#f5f5f5',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s',
    fontFamily: 'inherit',
    color: '#666',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  filterButtonActive: {
    backgroundColor: '#8b6914',
    color: 'white',
  },
  count: {
    color: '#999',
  },
  countActive: {
    color: '#f5e6d3',
  },
  searchContainer: {
    display: 'flex',
    gap: '1rem',
  },
  searchInput: {
    flex: 1,
    padding: '0.875rem 1.25rem',
    borderRadius: '8px',
    border: '2px solid #e0e0e0',
    fontSize: '1rem',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.3s',
  },
  reviewsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  reviewCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
  },
  reviewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #f0f0f0',
  },
  reviewProduct: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  productImage: {
    width: '50px',
    height: '50px',
    objectFit: 'cover',
    borderRadius: '8px',
  },
  productName: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#1a1a1a',
    marginBottom: '0.25rem',
  },
  reviewDate: {
    fontSize: '0.85rem',
    color: '#999',
  },
  deleteBtn: {
    backgroundColor: 'transparent',
    color: '#999',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'all 0.3s',
    fontFamily: 'inherit',
  },
  reviewBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  reviewRating: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  stars: {
    fontSize: '1.2rem',
    color: '#d4af37',
  },
  ratingNumber: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#8b6914',
  },
  reviewTitle: {
    fontSize: '1.2rem',
    fontWeight: 600,
    color: '#1a1a1a',
    margin: 0,
  },
  reviewComment: {
    fontSize: '1rem',
    color: '#555',
    lineHeight: 1.6,
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
  },
  reviewCommentExpanded: {
    fontSize: '1rem',
    color: '#555',
    lineHeight: 1.6,
    margin: 0,
  },
  expandButton: {
    backgroundColor: 'transparent',
    color: '#8b6914',
    border: 'none',
    padding: '0',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    alignSelf: 'flex-start',
    fontFamily: 'inherit',
  },
  reviewFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '1rem',
    borderTop: '1px solid #f0f0f0',
  },
  reviewerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  reviewerName: {
    fontSize: '0.9rem',
    color: '#666',
  },
  verifiedBadge: {
    backgroundColor: '#10b98115',
    color: '#10b981',
    padding: '0.25rem 0.75rem',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: 600,
  },
  emptyState: {
    textAlign: 'center',
    padding: '4rem 2rem',
    backgroundColor: 'white',
    borderRadius: '12px',
  },
  emptyIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
  },
  emptyText: {
    fontSize: '1.5rem',
    fontWeight: 600,
    color: '#1a1a1a',
    marginBottom: '0.5rem',
  },
  emptySubtext: {
    fontSize: '1rem',
    color: '#666',
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
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '2rem',
    maxWidth: '500px',
    width: '90%',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  modalTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: '1rem',
  },
  modalText: {
    fontSize: '1rem',
    color: '#666',
    lineHeight: 1.6,
    marginBottom: '2rem',
  },
  modalButtons: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    color: '#666',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s',
    fontFamily: 'inherit',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s',
    fontFamily: 'inherit',
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