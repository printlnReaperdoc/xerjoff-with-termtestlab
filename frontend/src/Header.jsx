import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';

export default function Header({ cart = [] }) {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const dropdownRef = useRef(null);

  // Check localStorage for user on component mount and when localStorage changes
  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setIsLoggedIn(true);
        } catch (error) {
          console.error('Error parsing user data:', error);
          localStorage.removeItem('user');
          setIsLoggedIn(false);
          setUser(null);
        }
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
    };

    // Check on mount
    checkAuth();

    // Listen for storage events (when localStorage changes in other tabs)
    window.addEventListener('storage', checkAuth);

    // Custom event for same-tab localStorage changes
    window.addEventListener('userLogin', checkAuth);
    window.addEventListener('userLogout', checkAuth);

    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('userLogin', checkAuth);
      window.removeEventListener('userLogout', checkAuth);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    // Remove user from localStorage
    localStorage.removeItem('user');
    
    // Update state
    setIsLoggedIn(false);
    setUser(null);
    setShowDropdown(false);
    
    // Dispatch custom event for other components
    window.dispatchEvent(new Event('userLogout'));
    
    // Navigate to home
    navigate('/');
    
    // Show logout message
    alert('You have been logged out successfully');
  };

  return (
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
        
        {!isLoggedIn ? (
          <>
            <Link to="/login" style={styles.authLink}>Login</Link>
            <Link to="/register" style={styles.authLink}>Register</Link>
          </>
        ) : (
          <div style={styles.userMenuContainer} ref={dropdownRef}>
            <button 
              style={styles.userButton}
              onClick={() => setShowDropdown(!showDropdown)}
              title={user?.name || 'User Menu'}
            >
              {user?.profilePicture ? (
                <img 
                  src={`http://localhost:5000${user.profilePicture}`} 
                  alt={user.name}
                  style={styles.profileImage}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '👤';
                  }}
                />
              ) : (
                '👤'
              )}
            </button>
            {showDropdown && (
              <div style={styles.dropdown}>
                <div style={styles.dropdownItem}>
                  <span style={styles.userName}>{user?.name || 'User'}</span>
                  <span style={styles.userEmail}>{user?.email || ''}</span>
                </div>
                <Link 
                  to="/profile" 
                  style={styles.dropdownLink}
                  onClick={() => setShowDropdown(false)}
                >
                  Update Profile
                </Link>
                {user?.isAdmin && (
                  <Link 
                    to="/admin" 
                    style={styles.dropdownLink}
                    onClick={() => setShowDropdown(false)}
                  >
                    Admin Dashboard
                  </Link>
                )}
                <button 
                  style={styles.logoutButton}
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
        
        <button 
  style={styles.iconButton}
  onClick={() => navigate('/cart')}
>
  🛒
  {cart.length > 0 && <span style={styles.badge}>{cart.length}</span>}
</button>
      </div>
    </nav>
  );
}

const styles = {
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
  authLink: {
    color: '#333',
    textDecoration: 'none',
    fontWeight: 500,
    fontSize: '0.95rem',
    transition: 'color 0.3s',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
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
  userMenuContainer: {
    position: 'relative',
  },
  userButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.3rem',
    color: '#333',
    padding: '0.25rem',
    borderRadius: '50%',
    transition: 'background-color 0.3s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #b8860b',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '0.5rem',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    minWidth: '200px',
    overflow: 'hidden',
    zIndex: 1001,
  },
  dropdownItem: {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #f0f0f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  userName: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#333',
  },
  userEmail: {
    fontSize: '0.8rem',
    color: '#666',
  },
  dropdownLink: {
    display: 'block',
    padding: '0.75rem 1rem',
    color: '#333',
    textDecoration: 'none',
    fontSize: '0.9rem',
    transition: 'background-color 0.2s',
    cursor: 'pointer',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    backgroundColor: 'transparent',
  },
  logoutButton: {
    display: 'block',
    padding: '0.75rem 1rem',
    color: '#d32f2f',
    textDecoration: 'none',
    fontSize: '0.9rem',
    transition: 'background-color 0.2s',
    cursor: 'pointer',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    backgroundColor: 'transparent',
    fontWeight: 500,
    fontFamily: 'inherit',
  },
};