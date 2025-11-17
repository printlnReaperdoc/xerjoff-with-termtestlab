import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from '../Header';

export default function Admin() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalReviews: 0,
    totalSales: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);

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

    // Fetch dashboard statistics
    fetchStats();
  }, [navigate]);

  const fetchStats = async () => {
    try {
      // Fetch products count
      const productsRes = await fetch('/api/products?limit=1');
      const productsData = await productsRes.json();
      
      // Simulate other stats (replace with actual API calls)
      setStats({
        totalProducts: productsData.length > 0 ? 50 : 0, // Placeholder
        totalReviews: 128, // Placeholder
        totalSales: 342, // Placeholder
        revenue: 45690.50, // Placeholder
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Header cart={[]} />
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading dashboard...</p>
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
            <h1 style={styles.title}>Admin Dashboard</h1>
            <p style={styles.subtitle}>
              Welcome back, {user?.name}. Manage your luxury perfume store.
            </p>
          </div>
          <button 
            style={styles.backButton}
            onClick={() => navigate('/')}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#8b6914';
              e.currentTarget.style.color = 'white';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.color = '#8b6914';
            }}
          >
            ← Back to Store
          </button>
        </div>

        {/* Management Sections */}
        <div style={styles.sectionsGrid}>
          {/* Products Management */}
          <ManagementCard
            icon="📦"
            title="Products Management"
            description="Add, edit, or remove products from your catalog. Manage inventory, pricing, and product details."
            buttonText="Manage Products"
            buttonColor="#8b6914"
            onClick={() => navigate('/admin/products')}
            features={[
              'Add new products',
              'Edit product details',
              'Update inventory',
              'Manage collections',
            ]}
          />

          {/* Reviews Management */}
          <ManagementCard
            icon="⭐"
            title="Reviews Management"
            description="Monitor and moderate customer reviews. Approve, reject, or respond to product feedback."
            buttonText="Manage Reviews"
            buttonColor="#d4af37"
            onClick={() => navigate('/admin/reviews')}
            features={[
              'View all reviews',
              'Approve pending reviews',
              'Remove inappropriate content',
              'Respond to customers',
            ]}
          />

          {/* Sales Analytics */}
          <ManagementCard
            icon="📊"
            title="Sales Analytics"
            description="Track sales performance, analyze trends, and view detailed reports on product performance."
            buttonText="View Sales"
            buttonColor="#6d5010"
            onClick={() => navigate('/admin/sales')}
            features={[
              'Sales reports',
              'Top selling products',
              'Revenue analytics',
              'Customer insights',
            ]}
          />

                    {/* Transactions Management */}
          <ManagementCard
            icon="💳"
            title="Transactions Management"
            description="Monitor all payment transactions, refunds, and financial records. Track order payments and processing status."
            buttonText="Manage Transactions"
            buttonColor="#4a5568"
            onClick={() => navigate('/admin/transactions')}
            features={[
              'View all transactions',
              'Process refunds',
              'Track payment status',
              'Export financial reports',
            ]}
          />
        </div>
        
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

// Management Card Component
function ManagementCard({ icon, title, description, buttonText, buttonColor, onClick, features }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div style={styles.managementCard}>
      <div style={styles.cardHeader}>
        <div style={{ ...styles.cardIcon, backgroundColor: `${buttonColor}15` }}>
          {icon}
        </div>
        <h3 style={styles.cardTitle}>{title}</h3>
      </div>
      <p style={styles.cardDescription}>{description}</p>
      <ul style={styles.featureList}>
        {features.map((feature, index) => (
          <li key={index} style={styles.featureItem}>
            <span style={styles.checkmark}>✓</span> {feature}
          </li>
        ))}
      </ul>
      <button
        style={{
          ...styles.cardButton,
          backgroundColor: isHovered ? `${buttonColor}dd` : buttonColor,
        }}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {buttonText} →
      </button>
    </div>
  );
}

// Quick Action Button Component
function QuickActionButton({ icon, label, onClick }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      style={{
        ...styles.quickActionBtn,
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 8px 20px rgba(139, 105, 20, 0.2)' : '0 4px 12px rgba(0, 0, 0, 0.1)',
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span style={styles.quickActionIcon}>{icon}</span>
      <span style={styles.quickActionLabel}>{label}</span>
    </button>
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
  sectionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: '2rem',
    marginBottom: '3rem',
  },
  managementCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '2rem',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    display: 'flex',
    flexDirection: 'column',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1rem',
  },
  cardIcon: {
    width: '50px',
    height: '50px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
  },
  cardTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#1a1a1a',
  },
  cardDescription: {
    fontSize: '1rem',
    color: '#666',
    lineHeight: 1.6,
    marginBottom: '1.5rem',
  },
  featureList: {
    listStyle: 'none',
    padding: 0,
    margin: '0 0 1.5rem 0',
    flex: 1,
  },
  featureItem: {
    fontSize: '0.95rem',
    color: '#555',
    marginBottom: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  checkmark: {
    color: '#8b6914',
    fontWeight: 'bold',
    fontSize: '1.1rem',
  },
  cardButton: {
    padding: '1rem',
    borderRadius: '8px',
    border: 'none',
    color: 'white',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s',
    fontFamily: 'inherit',
  },
  quickActions: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '2rem',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  },
  sectionTitle: {
    fontSize: '1.8rem',
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: '1.5rem',
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
  },
  quickActionBtn: {
    backgroundColor: 'white',
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
    cursor: 'pointer',
    transition: 'all 0.3s',
    fontFamily: 'inherit',
  },
  quickActionIcon: {
    fontSize: '2rem',
  },
  quickActionLabel: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#333',
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