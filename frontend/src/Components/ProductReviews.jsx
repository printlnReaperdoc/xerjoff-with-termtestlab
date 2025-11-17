import { useState, useEffect } from 'react';

export default function ProductReviews({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('recent');
  const [filterRating, setFilterRating] = useState('all');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userReview, setUserReview] = useState(null);
  const [canReview, setCanReview] = useState(false);
  const [hasCompletedPurchase, setHasCompletedPurchase] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    comment: '',
    verifiedPurchase: false
  });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
      } catch (err) {
        console.error('Error parsing user from localStorage:', err);
      }
    }
  }, []);

  useEffect(() => {
    fetchReviews();
    if (currentUser) {
      checkUserReview();
    }
  }, [productId, sortBy, filterRating, currentUser]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/reviews/${productId}?sortBy=${sortBy}&filterRating=${filterRating}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setReviews(data);
        setError(null);
      } else if (data && Array.isArray(data.reviews)) {
        setReviews(data.reviews);
        setError(null);
      } else {
        setReviews([]);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setReviews([]);
      setError('Failed to load reviews. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const checkUserReview = async () => {
    if (!currentUser) return;
    
    try {
      const userId = currentUser._id || currentUser.id;
      const response = await fetch(`http://localhost:5000/api/reviews/${productId}/user/${userId}/check`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.hasReviewed && data.review) {
          setUserReview(data.review);
        }
        // Set whether user can review (has completed purchase)
        setCanReview(data.canReview || false);
        setHasCompletedPurchase(data.hasCompletedPurchase || false);
      }
    } catch (err) {
      console.error('Error checking user review:', err);
    }
  };

  const handleWriteReviewClick = () => {
    if (!currentUser) {
      alert('Please log in to write a review.');
      return;
    }
    
    if (!hasCompletedPurchase) {
      alert('You can only review products you have purchased and received (with completed transactions).');
      return;
    }
    
    setIsEditing(false);
    setShowReviewForm(true);
  };

  const handleSubmitReview = async () => {
    if (!currentUser) {
      alert('Please log in to submit a review.');
      return;
    }

    if (!newReview.title || !newReview.comment) {
      alert('Please fill in all required fields.');
      return;
    }

    try {
      const userId = currentUser._id || currentUser.id;
      
      if (isEditing && userReview) {
        const response = await fetch(`http://localhost:5000/api/reviews/${userReview._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userId,
            rating: newReview.rating,
            title: newReview.title,
            comment: newReview.comment
          })
        });
        
        if (response.ok) {
          setNewReview({ rating: 5, title: '', comment: '', verifiedPurchase: false });
          setShowReviewForm(false);
          setIsEditing(false);
          await fetchReviews();
          await checkUserReview();
          alert('Review updated successfully!');
        } else {
          const errorData = await response.json();
          alert(`Failed to update review: ${errorData.message || 'Please try again.'}`);
        }
      } else {
        const response = await fetch(`http://localhost:5000/api/reviews/${productId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: productId,
            userId: userId,
            userName: currentUser.name,
            userEmail: currentUser.email,
            rating: newReview.rating,
            title: newReview.title,
            comment: newReview.comment,
            verifiedPurchase: true // Will be set by backend based on completed transaction
          })
        });
        
        if (response.ok) {
          setNewReview({ rating: 5, title: '', comment: '', verifiedPurchase: false });
          setShowReviewForm(false);
          await fetchReviews();
          await checkUserReview();
          alert('Review submitted successfully!');
        } else {
          const errorData = await response.json();
          alert(`Failed to submit review: ${errorData.message || 'Please try again.'}`);
        }
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      alert('Failed to submit review. Please try again.');
    }
  };

  const handleEditReview = () => {
    if (userReview) {
      setNewReview({
        rating: userReview.rating,
        title: userReview.title,
        comment: userReview.comment,
        verifiedPurchase: userReview.verifiedPurchase || false
      });
      setIsEditing(true);
      setShowReviewForm(true);
    }
  };

  const calculateRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      distribution[review.rating] = (distribution[review.rating] || 0) + 1;
    });
    return distribution;
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const renderStars = (rating) => {
    return '⭐'.repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? '⭐' : '');
  };

  const isUserReview = (review) => {
    if (!currentUser || !review.user) return false;
    const userId = currentUser._id || currentUser.id;
    const reviewUserId = typeof review.user === 'object' ? review.user._id : review.user;
    return reviewUserId === userId;
  };

  const styles = {
    container: { maxWidth: '1200px', margin: '4rem auto', padding: '0 2rem', fontFamily: "'Playfair Display', serif" },
    header: { borderBottom: '2px solid #e0e0e0', paddingBottom: '2rem', marginBottom: '3rem' },
    title: { fontSize: '2.5rem', fontWeight: 700, marginBottom: '2rem', color: '#1a1a1a' },
    summarySection: { display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '3rem', marginBottom: '2rem' },
    ratingOverview: { textAlign: 'center', padding: '2rem', backgroundColor: '#faf8f3', borderRadius: '15px' },
    averageRating: { fontSize: '4rem', fontWeight: 700, color: '#8b6914', marginBottom: '0.5rem' },
    stars: { fontSize: '1.5rem', marginBottom: '0.5rem' },
    totalReviews: { fontSize: '0.95rem', color: '#666' },
    ratingBars: { display: 'flex', flexDirection: 'column', gap: '1rem' },
    ratingBar: { display: 'flex', alignItems: 'center', gap: '1rem' },
    ratingLabel: { fontSize: '0.9rem', color: '#666', minWidth: '60px' },
    barContainer: { flex: 1, height: '8px', backgroundColor: '#e0e0e0', borderRadius: '10px', overflow: 'hidden' },
    barFill: { height: '100%', backgroundColor: '#b8860b', transition: 'width 0.3s' },
    barCount: { fontSize: '0.9rem', color: '#666', minWidth: '40px', textAlign: 'right' },
    controls: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' },
    filters: { display: 'flex', gap: '1rem', alignItems: 'center' },
    select: { padding: '0.7rem 1rem', borderRadius: '10px', border: '2px solid #e0e0e0', backgroundColor: 'white', color: '#333', fontSize: '0.95rem', cursor: 'pointer', fontFamily: "'Playfair Display', serif" },
    writeReviewButton: { backgroundColor: '#8b6914', color: 'white', padding: '0.8rem 2rem', borderRadius: '50px', border: 'none', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s' },
    writeReviewButtonDisabled: { backgroundColor: '#ccc', color: '#666', padding: '0.8rem 2rem', borderRadius: '50px', border: 'none', fontSize: '0.95rem', fontWeight: 600, cursor: 'not-allowed', opacity: 0.6 },
    editReviewButton: { backgroundColor: '#6c757d', color: 'white', padding: '0.8rem 2rem', borderRadius: '50px', border: 'none', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s' },
    purchaseNotice: { backgroundColor: '#fff3cd', color: '#856404', padding: '0.8rem 1.5rem', borderRadius: '10px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' },
    reviewsList: { display: 'flex', flexDirection: 'column', gap: '2rem' },
    reviewCard: { backgroundColor: 'white', padding: '2rem', borderRadius: '15px', border: '1px solid #e0e0e0', transition: 'all 0.3s' },
    userReviewCard: { backgroundColor: '#faf8f3', border: '2px solid #8b6914' },
    reviewHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' },
    reviewerInfo: { display: 'flex', alignItems: 'center', gap: '1rem' },
    avatar: { width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#b8860b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 600 },
    reviewerDetails: { display: 'flex', flexDirection: 'column' },
    reviewerName: { fontWeight: 600, fontSize: '1.1rem', color: '#1a1a1a' },
    reviewDate: { fontSize: '0.85rem', color: '#999', marginTop: '0.25rem' },
    badgeContainer: { display: 'flex', gap: '0.5rem', flexDirection: 'column', alignItems: 'flex-end' },
    verifiedBadge: { display: 'inline-flex', alignItems: 'center', gap: '0.3rem', backgroundColor: '#d4edda', color: '#155724', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 },
    yourReviewBadge: { display: 'inline-flex', alignItems: 'center', gap: '0.3rem', backgroundColor: '#8b6914', color: 'white', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 },
    reviewRating: { fontSize: '1.1rem', marginBottom: '0.5rem' },
    reviewTitle: { fontSize: '1.3rem', fontWeight: 600, marginBottom: '0.8rem', color: '#1a1a1a' },
    reviewText: { fontSize: '1rem', color: '#666', lineHeight: 1.7, marginBottom: '1rem' },
    reviewActions: { display: 'flex', gap: '2rem', alignItems: 'center', fontSize: '0.9rem', color: '#999' },
    actionButton: { background: 'none', border: 'none', cursor: 'pointer', color: '#666', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem', transition: 'color 0.3s' },
    editButton: { background: 'none', border: 'none', cursor: 'pointer', color: '#8b6914', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600, transition: 'color 0.3s' },
    formOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '2rem' },
    formContainer: { backgroundColor: 'white', padding: '3rem', borderRadius: '20px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' },
    formTitle: { fontSize: '2rem', fontWeight: 700, marginBottom: '1rem', color: '#1a1a1a' },
    formSubtitle: { fontSize: '1rem', color: '#666', marginBottom: '2rem' },
    userInfo: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: '#faf8f3', borderRadius: '10px', marginBottom: '2rem' },
    userAvatar: { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#8b6914', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 600 },
    userName: { fontSize: '1rem', fontWeight: 600, color: '#1a1a1a' },
    formGroup: { marginBottom: '1.5rem' },
    label: { display: 'block', fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#333' },
    input: { width: '100%', padding: '0.8rem', borderRadius: '10px', border: '2px solid #e0e0e0', fontSize: '1rem', fontFamily: "'Playfair Display', serif", boxSizing: 'border-box' },
    textarea: { width: '100%', padding: '0.8rem', borderRadius: '10px', border: '2px solid #e0e0e0', fontSize: '1rem', fontFamily: "'Playfair Display', serif", minHeight: '120px', resize: 'vertical', boxSizing: 'border-box' },
    starSelector: { display: 'flex', gap: '0.5rem', fontSize: '2rem' },
    starButton: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '2rem', padding: '0', transition: 'transform 0.2s' },
    formButtons: { display: 'flex', gap: '1rem', marginTop: '2rem' },
    submitButton: { flex: 1, backgroundColor: '#8b6914', color: 'white', padding: '1rem 2rem', borderRadius: '50px', border: 'none', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s' },
    cancelButton: { flex: 1, backgroundColor: 'white', color: '#8b6914', padding: '1rem 2rem', borderRadius: '50px', border: '2px solid #8b6914', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s' },
    loader: { textAlign: 'center', padding: '3rem', color: '#666' },
    emptyState: { textAlign: 'center', padding: '4rem 2rem', color: '#666' },
    emptyStateIcon: { fontSize: '4rem', marginBottom: '1rem' }
  };

  const ratingDistribution = calculateRatingDistribution();
  const averageRating = calculateAverageRating();

  if (loading) {
    return <div style={styles.container}><div style={styles.loader}>Loading reviews...</div></div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Customer Reviews</h2>
        {reviews.length > 0 && (
          <div style={styles.summarySection}>
            <div style={styles.ratingOverview}>
              <div style={styles.averageRating}>{averageRating}</div>
              <div style={styles.stars}>{renderStars(parseFloat(averageRating))}</div>
              <div style={styles.totalReviews}>Based on {reviews.length} reviews</div>
            </div>
            <div style={styles.ratingBars}>
              {[5, 4, 3, 2, 1].map(star => {
                const count = ratingDistribution[star] || 0;
                const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={star} style={styles.ratingBar}>
                    <div style={styles.ratingLabel}>{star} ⭐</div>
                    <div style={styles.barContainer}>
                      <div style={{ ...styles.barFill, width: `${percentage}%` }} />
                    </div>
                    <div style={styles.barCount}>{count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {currentUser && !hasCompletedPurchase && (
        <div style={styles.purchaseNotice}>
          ℹ️ You can write a review after purchasing and receiving this product (completed transaction required)
        </div>
      )}

      <div style={styles.controls}>
        <div style={styles.filters}>
          <select style={styles.select} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="recent">Most Recent</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
            <option value="helpful">Most Helpful</option>
          </select>
          <select style={styles.select} value={filterRating} onChange={(e) => setFilterRating(e.target.value)}>
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
        <div>
          {userReview ? (
            <button style={styles.editReviewButton} onClick={handleEditReview} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#5a6268'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6c757d'}>
              Edit Your Review
            </button>
          ) : (
            <button 
              style={hasCompletedPurchase ? styles.writeReviewButton : styles.writeReviewButtonDisabled} 
              onClick={handleWriteReviewClick}
              disabled={!hasCompletedPurchase}
              onMouseOver={(e) => { if (hasCompletedPurchase) e.currentTarget.style.backgroundColor = '#6d5010'; }}
              onMouseOut={(e) => { if (hasCompletedPurchase) e.currentTarget.style.backgroundColor = '#8b6914'; }}
            >
              Write a Review
            </button>
          )}
        </div>
      </div>

      {reviews.length > 0 ? (
        <div style={styles.reviewsList}>
          {reviews.map((review, index) => {
            const isOwn = isUserReview(review);
            return (
              <div key={index} style={{ ...styles.reviewCard, ...(isOwn ? styles.userReviewCard : {}) }}>
                <div style={styles.reviewHeader}>
                  <div style={styles.reviewerInfo}>
                    <div style={styles.avatar}>{(review.userName || review.name || 'A').charAt(0).toUpperCase()}</div>
                    <div style={styles.reviewerDetails}>
                      <div style={styles.reviewerName}>{review.userName || review.name || 'Anonymous'}</div>
                      <div style={styles.reviewDate}>
                        {new Date(review.date || review.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  <div style={styles.badgeContainer}>
                    {isOwn && <div style={styles.yourReviewBadge}>Your Review</div>}
                    {review.verifiedPurchase && <div style={styles.verifiedBadge}>✓ Verified Purchase</div>}
                  </div>
                </div>
                <div style={styles.reviewRating}>{renderStars(review.rating)}</div>
                {review.title && <h3 style={styles.reviewTitle}>{review.title}</h3>}
                <p style={styles.reviewText}>{review.comment}</p>
                <div style={styles.reviewActions}>
                  <button style={styles.actionButton}>👍 Helpful ({review.helpfulCount || 0})</button>
                  {isOwn && <button style={styles.editButton} onClick={handleEditReview}>✏️ Edit</button>}
                  <button style={styles.actionButton}>Report</button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={styles.emptyState}>
          <div style={styles.emptyStateIcon}>✍️</div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No reviews yet</h3>
          <p>Be the first to share your experience with this fragrance!</p>
        </div>
      )}

      {showReviewForm && currentUser && (
        <div style={styles.formOverlay} onClick={() => setShowReviewForm(false)}>
          <div style={styles.formContainer} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.formTitle}>{isEditing ? 'Edit Your Review' : 'Write a Review'}</h3>
            <p style={styles.formSubtitle}>Share your experience with this fragrance</p>
            <div style={styles.userInfo}>
              <div style={styles.userAvatar}>{currentUser.name.charAt(0).toUpperCase()}</div>
              <div style={styles.userName}>Posting as {currentUser.name}</div>
            </div>
            <div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Your Rating *</label>
                <div style={styles.starSelector}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} type="button" style={styles.starButton} onClick={() => setNewReview({ ...newReview, rating: star })} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.2)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                      {star <= newReview.rating ? '⭐' : '☆'}
                    </button>
                  ))}
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Review Title *</label>
                <input type="text" style={styles.input} value={newReview.title} onChange={(e) => setNewReview({ ...newReview, title: e.target.value })} placeholder="Sum up your experience" />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Your Review *</label>
                <textarea style={styles.textarea} value={newReview.comment} onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })} placeholder="Share your thoughts about this fragrance..." />
              </div>
              <div style={styles.formButtons}>
                <button type="button" style={styles.cancelButton} onClick={() => setShowReviewForm(false)} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}>
                  Cancel
                </button>
                <button type="button" style={styles.submitButton} onClick={handleSubmitReview} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#6d5010'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#8b6914'}>
                  {isEditing ? 'Update Review' : 'Submit Review'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}