import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ManageTransactions() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showModal, setShowModal] = useState(false);

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

    fetchTransactions();
  }, [navigate]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/transactions');
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const updateTransactionStatus = async (transactionId, newStatus) => {
    setUpdatingId(transactionId);

    try {
      const response = await fetch(`http://localhost:5000/api/transactions/${transactionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update transaction status');
      }

      // Refresh transactions list
      await fetchTransactions();
      alert(`Transaction status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating transaction:', error);
      alert('Failed to update transaction status. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteTransaction = async (transactionId) => {
    if (!confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/transactions/${transactionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete transaction');
      }

      await fetchTransactions();
      alert('Transaction deleted successfully');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Failed to delete transaction. Please try again.');
    }
  };

  const openTransactionDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowModal(true);
  };

  // Filter transactions
  const filteredTransactions = filterStatus === 'all' 
    ? transactions 
    : transactions.filter(t => t.status === filterStatus);

  // Calculate statistics
  const stats = {
    total: transactions.length,
    pending: transactions.filter(t => t.status === 'pending').length,
    completed: transactions.filter(t => t.status === 'completed').length,
    cancelled: transactions.filter(t => t.status === 'cancelled').length,
    failed: transactions.filter(t => t.status === 'failed').length,
    totalRevenue: transactions
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + t.total, 0),
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Header />
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <Header />
        <div style={styles.errorContainer}>
          <p style={styles.errorText}>{error}</p>
          <button style={styles.button} onClick={fetchTransactions}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Header />

      {/* Transaction Details Modal */}
      {showModal && selectedTransaction && (
        <TransactionModal 
          transaction={selectedTransaction}
          onClose={() => {
            setShowModal(false);
            setSelectedTransaction(null);
          }}
          onUpdateStatus={updateTransactionStatus}
          updatingId={updatingId}
        />
      )}

      <div style={styles.content}>
        {/* Page Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Transactions Management</h1>
            <p style={styles.subtitle}>
              Monitor and manage all payment transactions
            </p>
          </div>
          <button 
            style={styles.backButton}
            onClick={() => navigate('/admin')}
          >
            ← Back to Admin
          </button>
        </div>

        {/* Statistics Cards */}
        <div style={styles.statsGrid}>
          <StatCard
            icon="💳"
            title="Total Transactions"
            value={stats.total}
            color="#8b6914"
          />
          <StatCard
            icon="⏳"
            title="Pending"
            value={stats.pending}
            color="#ff9800"
          />
          <StatCard
            icon="✓"
            title="Completed"
            value={stats.completed}
            color="#4caf50"
          />
          <StatCard
            icon="💰"
            title="Total Revenue"
            value={`$${stats.totalRevenue.toFixed(2)}`}
            color="#2196f3"
          />
        </div>

        {/* Filter Tabs */}
        <div style={styles.filterContainer}>
          <button
            style={{
              ...styles.filterTab,
              ...(filterStatus === 'all' ? styles.filterTabActive : {}),
            }}
            onClick={() => setFilterStatus('all')}
          >
            All ({stats.total})
          </button>
          <button
            style={{
              ...styles.filterTab,
              ...(filterStatus === 'pending' ? styles.filterTabActive : {}),
            }}
            onClick={() => setFilterStatus('pending')}
          >
            Pending ({stats.pending})
          </button>
          <button
            style={{
              ...styles.filterTab,
              ...(filterStatus === 'completed' ? styles.filterTabActive : {}),
            }}
            onClick={() => setFilterStatus('completed')}
          >
            Completed ({stats.completed})
          </button>
          <button
            style={{
              ...styles.filterTab,
              ...(filterStatus === 'cancelled' ? styles.filterTabActive : {}),
            }}
            onClick={() => setFilterStatus('cancelled')}
          >
            Cancelled ({stats.cancelled})
          </button>
          <button
            style={{
              ...styles.filterTab,
              ...(filterStatus === 'failed' ? styles.filterTabActive : {}),
            }}
            onClick={() => setFilterStatus('failed')}
          >
            Failed ({stats.failed})
          </button>
        </div>

        {/* Transactions Table */}
        <div style={styles.tableContainer}>
          {filteredTransactions.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📭</div>
              <h3 style={styles.emptyTitle}>No transactions found</h3>
              <p style={styles.emptyText}>
                {filterStatus === 'all' 
                  ? 'No transactions have been created yet.'
                  : `No ${filterStatus} transactions found.`}
              </p>
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>Transaction ID</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Items</th>
                  <th style={styles.th}>Total</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction._id} style={styles.tableRow}>
                    <td style={styles.td}>
                      <span style={styles.transactionId}>
                        {transaction._id.slice(-8).toUpperCase()}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {new Date(transaction.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td style={styles.td}>
                      {transaction.items.length} item{transaction.items.length !== 1 ? 's' : ''}
                    </td>
                    <td style={styles.td}>
                      <span style={styles.totalAmount}>
                        ${transaction.total.toFixed(2)}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <StatusBadge status={transaction.status} />
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionButtons}>
                        <button
                          style={styles.viewButton}
                          onClick={() => openTransactionDetails(transaction)}
                          title="View Details"
                        >
                          👁️
                        </button>
                        <select
                          style={styles.statusDropdown}
                          value={transaction.status}
                          onChange={(e) => updateTransactionStatus(transaction._id, e.target.value)}
                          disabled={updatingId === transaction._id}
                        >
                          <option value="pending">Pending</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="failed">Failed</option>
                        </select>
                        <button
                          style={styles.deleteButton}
                          onClick={() => deleteTransaction(transaction._id)}
                          title="Delete Transaction"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// Header Component
function Header() {
  return (
    <nav style={styles.navbar}>
      <a href="/" style={{ textDecoration: 'none' }}>
        <div style={styles.logo}>XERJOFF</div>
      </a>
    </nav>
  );
}

// Status Badge Component
function StatusBadge({ status }) {
  const statusStyles = {
    pending: { backgroundColor: '#fff3cd', color: '#856404', border: '1px solid #ffc107' },
    completed: { backgroundColor: '#d4edda', color: '#155724', border: '1px solid #28a745' },
    cancelled: { backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #dc3545' },
    failed: { backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #dc3545' },
  };

  return (
    <span style={{ ...styles.statusBadge, ...statusStyles[status] }}>
      {status.toUpperCase()}
    </span>
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

// Transaction Details Modal
function TransactionModal({ transaction, onClose, onUpdateStatus, updatingId }) {
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Transaction Details</h2>
          <button style={styles.closeButton} onClick={onClose}>✕</button>
        </div>

        <div style={styles.modalContent}>
          {/* Transaction Info */}
          <div style={styles.infoSection}>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Transaction ID:</span>
              <span style={styles.infoValue}>{transaction._id}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Date Created:</span>
              <span style={styles.infoValue}>
                {new Date(transaction.createdAt).toLocaleString()}
              </span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Status:</span>
              <StatusBadge status={transaction.status} />
            </div>
            {transaction.completedAt && (
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Completed At:</span>
                <span style={styles.infoValue}>
                  {new Date(transaction.completedAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Items */}
          <div style={styles.itemsSection}>
            <h3 style={styles.sectionTitle}>Items Purchased</h3>
            {transaction.items.map((item, index) => (
              <div key={index} style={styles.itemRow}>
                <img 
                  src={item.image || '/defaultproductpic.jpg'} 
                  alt={item.name}
                  style={styles.itemImage}
                />
                <div style={styles.itemDetails}>
                  <p style={styles.itemName}>{item.name}</p>
                  <p style={styles.itemCollection}>{item.collection}</p>
                </div>
                <div style={styles.itemPricing}>
                  <p style={styles.itemQuantity}>Qty: {item.quantity}</p>
                  <p style={styles.itemPrice}>${item.price.toFixed(2)} each</p>
                  <p style={styles.itemTotal}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Summary */}
          <div style={styles.pricingSection}>
            <div style={styles.pricingRow}>
              <span>Subtotal:</span>
              <span>${transaction.subtotal.toFixed(2)}</span>
            </div>
            <div style={styles.pricingRow}>
              <span>Tax:</span>
              <span>${transaction.tax.toFixed(2)}</span>
            </div>
            <div style={styles.pricingRow}>
              <span>Shipping:</span>
              <span>${transaction.shipping.toFixed(2)}</span>
            </div>
            <div style={{ ...styles.pricingRow, ...styles.totalRow }}>
              <span>Total:</span>
              <span>${transaction.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Status Dropdown in Modal */}
          <div style={styles.modalStatusSection}>
            <label style={styles.modalStatusLabel}>Update Status:</label>
            <select
              style={styles.modalStatusDropdown}
              value={transaction.status}
              onChange={(e) => {
                onUpdateStatus(transaction._id, e.target.value);
                onClose();
              }}
              disabled={updatingId === transaction._id}
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="failed">Failed</option>
            </select>
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
    marginBottom: '2rem',
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
  filterContainer: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
    flexWrap: 'wrap',
  },
  filterTab: {
    backgroundColor: 'white',
    border: '2px solid #e0e0e0',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s',
    fontFamily: 'inherit',
    color: '#666',
  },
  filterTabActive: {
    backgroundColor: '#8b6914',
    borderColor: '#8b6914',
    color: 'white',
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    backgroundColor: '#f5f0e8',
  },
  th: {
    padding: '1rem',
    textAlign: 'left',
    fontSize: '0.9rem',
    fontWeight: 700,
    color: '#1a1a1a',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  tableRow: {
    borderBottom: '1px solid #f0f0f0',
    transition: 'background-color 0.2s',
  },
  td: {
    padding: '1rem',
    fontSize: '0.95rem',
    color: '#333',
  },
  transactionId: {
    fontFamily: 'monospace',
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#8b6914',
  },
  totalAmount: {
    fontWeight: 700,
    color: '#8b6914',
    fontSize: '1.1rem',
  },
  statusBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: 700,
    display: 'inline-block',
  },
  actionButtons: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  },
  statusDropdown: {
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    border: '2px solid #e0e0e0',
    backgroundColor: 'white',
    color: '#333',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.3s',
  },
  viewButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.2rem',
    cursor: 'pointer',
    padding: '0.25rem',
    opacity: 0.7,
    transition: 'opacity 0.2s',
  },
  deleteButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.2rem',
    cursor: 'pointer',
    padding: '0.25rem',
    opacity: 0.7,
    transition: 'opacity 0.2s',
  },
  emptyState: {
    textAlign: 'center',
    padding: '4rem 2rem',
  },
  emptyIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: '0.5rem',
  },
  emptyText: {
    fontSize: '1rem',
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
    borderRadius: '16px',
    maxWidth: '800px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '2rem',
    borderBottom: '1px solid #e0e0e0',
  },
  modalTitle: {
    fontSize: '1.8rem',
    fontWeight: 700,
    color: '#1a1a1a',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#666',
    padding: '0.5rem',
  },
  modalContent: {
    padding: '2rem',
  },
  infoSection: {
    marginBottom: '2rem',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 0',
    borderBottom: '1px solid #f0f0f0',
  },
  infoLabel: {
    fontSize: '0.95rem',
    color: '#666',
    fontWeight: 600,
  },
  infoValue: {
    fontSize: '0.95rem',
    color: '#333',
    fontFamily: 'monospace',
  },
  itemsSection: {
    marginBottom: '2rem',
  },
  sectionTitle: {
    fontSize: '1.3rem',
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: '1rem',
  },
  itemRow: {
    display: 'flex',
    gap: '1rem',
    padding: '1rem',
    backgroundColor: '#f5f0e8',
    borderRadius: '8px',
    marginBottom: '0.75rem',
    alignItems: 'center',
  },
  itemImage: {
    width: '60px',
    height: '60px',
    objectFit: 'cover',
    borderRadius: '8px',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#1a1a1a',
    marginBottom: '0.25rem',
  },
  itemCollection: {
    fontSize: '0.85rem',
    color: '#8b6914',
    fontWeight: 600,
    textTransform: 'uppercase',
  },
  itemPricing: {
    textAlign: 'right',
  },
  itemQuantity: {
    fontSize: '0.85rem',
    color: '#666',
    marginBottom: '0.25rem',
  },
  itemPrice: {
    fontSize: '0.9rem',
    color: '#666',
    marginBottom: '0.25rem',
  },
  itemTotal: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#8b6914',
  },
  pricingSection: {
    backgroundColor: '#f5f0e8',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '2rem',
  },
  pricingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.75rem',
    fontSize: '1rem',
    color: '#333',
  },
  totalRow: {
    borderTop: '2px solid #8b6914',
    paddingTop: '0.75rem',
    marginTop: '0.75rem',
    fontSize: '1.3rem',
    fontWeight: 700,
    color: '#8b6914',
  },
  modalStatusSection: {
    backgroundColor: '#f5f0e8',
    padding: '1.5rem',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  modalStatusLabel: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#1a1a1a',
  },
  modalStatusDropdown: {
    flex: 1,
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: '2px solid #8b6914',
    backgroundColor: 'white',
    color: '#333',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
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
  
  @media (max-width: 1200px) {
    .statsGrid {
      grid-template-columns: repeat(2, 1fr) !important;
    }
  }
  
  @media (max-width: 768px) {
    .statsGrid {
      grid-template-columns: 1fr !important;
    }
    
    .filterContainer {
      overflow-x: auto;
    }
    
    .table {
      font-size: 0.85rem;
    }
    
    .th, .td {
      padding: 0.75rem 0.5rem !important;
    }
  }
  
  @media (hover: hover) {
    .backButton:hover {
      background-color: #8b6914 !important;
      color: white !important;
    }
    
    .filterTab:hover {
      border-color: #8b6914 !important;
    }
    
    .viewButton:hover,
    .deleteButton:hover {
      opacity: 1 !important;
    }
    
    .tableRow:hover {
      background-color: #faf8f3 !important;
    }
    
    .statusDropdown:hover {
      border-color: #8b6914 !important;
    }
    
    .statusDropdown:focus {
      outline: none !important;
      border-color: #8b6914 !important;
      box-shadow: 0 0 0 3px rgba(139, 105, 20, 0.1) !important;
    }
    
    .modalStatusDropdown:hover {
      background-color: #f5f0e8 !important;
    }
    
    .modalStatusDropdown:focus {
      outline: none !important;
      box-shadow: 0 0 0 3px rgba(139, 105, 20, 0.2) !important;
    }
  }
`;
document.head.appendChild(styleSheet);