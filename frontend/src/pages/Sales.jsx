import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Calendar } from 'lucide-react';

export default function Sales() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    topSellingProduct: '',
  });
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    // Check if user is logged in and is admin
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      alert('Please login to access sales analytics');
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

    // Set default date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    });

    // Fetch initial sales data
    fetchSalesData(startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]);
  }, [navigate]);

  const fetchSalesData = async (start, end) => {
    setLoading(true);
    try {
      // Fetch sales data from API
      const response = await fetch(`/api/sales?startDate=${start}&endDate=${end}`);
      const data = await response.json();

      if (data && data.dailySales) {
        setSalesData(data.dailySales);
        setTopProducts(data.topProducts || []);
        setStats({
          totalRevenue: data.totalRevenue || 0,
          totalOrders: data.totalOrders || 0,
          averageOrderValue: data.averageOrderValue || 0,
          topSellingProduct: data.topSellingProduct || 'N/A',
        });
      } else {
        // No data available
        setSalesData([]);
        setTopProducts([]);
        setStats({
          totalRevenue: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          topSellingProduct: 'N/A',
        });
      }
    } catch (error) {
      console.error('Error fetching sales data:', error);
      setSalesData([]);
      setTopProducts([]);
      setStats({
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        topSellingProduct: 'N/A',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Select date';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleDateSelect = (dateStr, type) => {
    setDateRange(prev => ({
      ...prev,
      [type]: dateStr,
    }));
    if (type === 'startDate') {
      setShowStartPicker(false);
    } else {
      setShowEndPicker(false);
    }
  };

  const handleApplyFilter = () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      alert('Please select both start and end dates');
      return;
    }

    if (new Date(dateRange.startDate) > new Date(dateRange.endDate)) {
      alert('Start date must be before end date');
      return;
    }

    fetchSalesData(dateRange.startDate, dateRange.endDate);
  };

  const handleResetFilter = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    const newDateRange = {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
    
    setDateRange(newDateRange);
    fetchSalesData(newDateRange.startDate, newDateRange.endDate);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading sales data...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Page Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Sales Analytics</h1>
            <p style={styles.subtitle}>
              Track your store's performance and revenue trends
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

        {/* Date Range Filter */}
        <div style={styles.filterCard}>
          <h3 style={styles.filterTitle}>📅 Date Range Filter</h3>
          <div style={styles.filterControls}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Start Date</label>
              <div style={styles.datePickerWrapper}>
                <button
                  style={styles.dateButton}
                  onClick={() => {
                    setShowStartPicker(!showStartPicker);
                    setShowEndPicker(false);
                  }}
                >
                  <Calendar size={18} />
                  <span>{formatDate(dateRange.startDate)}</span>
                </button>
                {showStartPicker && (
                  <DatePicker
                    selectedDate={dateRange.startDate}
                    onDateSelect={(date) => handleDateSelect(date, 'startDate')}
                    onClose={() => setShowStartPicker(false)}
                  />
                )}
              </div>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>End Date</label>
              <div style={styles.datePickerWrapper}>
                <button
                  style={styles.dateButton}
                  onClick={() => {
                    setShowEndPicker(!showEndPicker);
                    setShowStartPicker(false);
                  }}
                >
                  <Calendar size={18} />
                  <span>{formatDate(dateRange.endDate)}</span>
                </button>
                {showEndPicker && (
                  <DatePicker
                    selectedDate={dateRange.endDate}
                    onDateSelect={(date) => handleDateSelect(date, 'endDate')}
                    onClose={() => setShowEndPicker(false)}
                  />
                )}
              </div>
            </div>
            <div style={styles.buttonGroup}>
              <button 
                style={styles.applyButton}
                onClick={handleApplyFilter}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#6d5010'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#8b6914'}
              >
                Apply Filter
              </button>
              <button 
                style={styles.resetButton}
                onClick={handleResetFilter}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                Reset (Last 30 Days)
              </button>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        {salesData.length > 0 ? (
          <>
            {/* Revenue Line Chart */}
            <div style={styles.chartCard}>
              <h3 style={styles.chartTitle}>📈 Daily Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={salesData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#666"
                    style={{ fontSize: '0.85rem' }}
                  />
                  <YAxis 
                    stroke="#666"
                    style={{ fontSize: '0.85rem' }}
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      padding: '12px',
                    }}
                    formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#8b6914" 
                    strokeWidth={3}
                    dot={{ fill: '#8b6914', r: 5 }}
                    activeDot={{ r: 7 }}
                    name="Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Orders Line Chart */}
            <div style={styles.chartCard}>
              <h3 style={styles.chartTitle}>📦 Daily Orders Volume</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={salesData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#666"
                    style={{ fontSize: '0.85rem' }}
                  />
                  <YAxis 
                    stroke="#666"
                    style={{ fontSize: '0.85rem' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      padding: '12px',
                    }}
                    formatter={(value) => [value, 'Orders']}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="orders" 
                    stroke="#d4af37" 
                    strokeWidth={3}
                    dot={{ fill: '#d4af37', r: 5 }}
                    activeDot={{ r: 7 }}
                    name="Orders"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <div style={styles.noDataCard}>
            <div style={styles.noDataIcon}>📊</div>
            <h3 style={styles.noDataTitle}>No Sales Data Available</h3>
            <p style={styles.noDataText}>
              There are no sales recorded for the selected date range. Try adjusting your filter or check back later.
            </p>
          </div>
        )}

        {/* Top Products Bar Chart */}
        {topProducts.length > 0 && (
          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>🏆 Top Selling Products</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topProducts} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                  dataKey="productName" 
                  stroke="#666"
                  style={{ fontSize: '0.85rem' }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis 
                  stroke="#666"
                  style={{ fontSize: '0.85rem' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '12px',
                  }}
                  formatter={(value) => [value, 'Units Sold']}
                />
                <Legend />
                <Bar 
                  dataKey="unitsSold" 
                  fill="#8b6914" 
                  name="Units Sold"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

// Custom Date Picker Component
function DatePicker({ selectedDate, onDateSelect, onClose }) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    return selectedDate ? new Date(selectedDate) : new Date();
  });

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDayClick = (day) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onDateSelect(dateStr);
  };

  const isSelectedDay = (day) => {
    if (!selectedDate) return false;
    const selected = new Date(selectedDate);
    return selected.getDate() === day &&
           selected.getMonth() === currentMonth.getMonth() &&
           selected.getFullYear() === currentMonth.getFullYear();
  };

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} style={styles.emptyDay}></div>);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const isSelected = isSelectedDay(day);
    days.push(
      <button
        key={day}
        style={{
          ...styles.dayButton,
          ...(isSelected ? styles.selectedDay : {}),
        }}
        onClick={() => handleDayClick(day)}
        onMouseOver={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = '#f5e6d3';
          }
        }}
        onMouseOut={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        {day}
      </button>
    );
  }

  return (
    <>
      <div style={styles.pickerOverlay} onClick={onClose} />
      <div style={styles.pickerContainer}>
        <div style={styles.pickerHeader}>
          <button style={styles.navButton} onClick={handlePrevMonth}>‹</button>
          <div style={styles.monthYear}>
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </div>
          <button style={styles.navButton} onClick={handleNextMonth}>›</button>
        </div>
        <div style={styles.weekDays}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} style={styles.weekDay}>{day}</div>
          ))}
        </div>
        <div style={styles.daysGrid}>
          {days}
        </div>
      </div>
    </>
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
    marginBottom: '2rem',
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
  filterCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '2rem',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    marginBottom: '2rem',
  },
  filterTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: '1.5rem',
  },
  filterControls: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.5rem',
    alignItems: 'end',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#333',
  },
  datePickerWrapper: {
    position: 'relative',
  },
  dateButton: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '8px',
    border: '2px solid #e0e0e0',
    fontSize: '1rem',
    fontFamily: 'inherit',
    backgroundColor: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'border-color 0.3s',
  },
  pickerOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  pickerContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: '0.5rem',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
    padding: '1rem',
    zIndex: 1000,
    minWidth: '300px',
  },
  pickerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  navButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: '0.25rem 0.5rem',
    color: '#8b6914',
    fontWeight: 'bold',
  },
  monthYear: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#1a1a1a',
  },
  weekDays: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '0.25rem',
    marginBottom: '0.5rem',
  },
  weekDay: {
    textAlign: 'center',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#666',
    padding: '0.5rem 0',
  },
  daysGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '0.25rem',
  },
  emptyDay: {
    padding: '0.5rem',
  },
  dayButton: {
    background: 'none',
    border: 'none',
    padding: '0.5rem',
    cursor: 'pointer',
    borderRadius: '6px',
    fontSize: '0.95rem',
    fontFamily: 'inherit',
    transition: 'background-color 0.2s',
  },
  selectedDay: {
    backgroundColor: '#8b6914',
    color: 'white',
    fontWeight: 600,
  },
  buttonGroup: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  applyButton: {
    backgroundColor: '#8b6914',
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
  resetButton: {
    backgroundColor: 'white',
    color: '#666',
    border: '2px solid #e0e0e0',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s',
    fontFamily: 'inherit',
  },
  chartCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '2rem',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    marginBottom: '2rem',
  },
  chartTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: '1.5rem',
  },
  noDataCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '4rem 2rem',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    textAlign: 'center',
    marginBottom: '2rem',
  },
  noDataIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
  },
  noDataTitle: {
    fontSize: '1.8rem',
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: '0.5rem',
  },
  noDataText: {
    fontSize: '1.1rem',
    color: '#666',
    maxWidth: '600px',
    margin: '0 auto',
    lineHeight: 1.6,
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