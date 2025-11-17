import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user types
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Dispatch custom event to notify Header component
        window.dispatchEvent(new Event('userLogin'));
        
        // Show success message
        alert('Login successful!');
        
        // Navigate to home
        navigate('/');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Navigation */}
      <nav style={styles.navbar}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <div style={styles.logo}>XERJOFF</div>
        </Link>
      </nav>

      {/* Login Form */}
      <div style={styles.formContainer}>
        <div style={styles.formCard}>
          <h1 style={styles.title}>Welcome Back</h1>
          <p style={styles.subtitle}>Sign in to your account</p>

          {error && (
            <div style={styles.errorMessage}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                style={styles.input}
                placeholder="your@email.com"
                disabled={loading}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                style={styles.input}
                placeholder="Enter your password"
                disabled={loading}
              />
            </div>

            <div style={styles.forgotPassword}>
              <a style={styles.link}>Forgot Password?</a>
            </div>

            <button 
              type="submit" 
              style={{
                ...styles.button,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
              onMouseOver={(e) => !loading && (e.currentTarget.style.backgroundColor = '#6d5010')} 
              onMouseOut={(e) => !loading && (e.currentTarget.style.backgroundColor = '#8b6914')}
              disabled={loading}
            >
              {loading ? 'SIGNING IN...' : 'SIGN IN'}
            </button>
          </form>

          <div style={styles.divider}>
            <span style={styles.dividerText}>OR</span>
          </div>

          <div style={styles.registerPrompt}>
            <p style={styles.registerText}>
              Don't have an account?{' '}
              <Link to="/register" style={styles.registerLink}>
                Create Account
              </Link>
            </p>
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
    justifyContent: 'center',
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
  formContainer: {
    paddingTop: '120px',
    paddingBottom: '80px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '3rem',
    width: '100%',
    maxWidth: '500px',
    boxShadow: '0 20px 60px rgba(139, 105, 20, 0.15)',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: '0.5rem',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#666',
    marginBottom: '2rem',
    textAlign: 'center',
  },
  errorMessage: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
    textAlign: 'center',
    fontSize: '0.95rem',
    border: '1px solid #fcc',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
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
  input: {
    padding: '1rem',
    borderRadius: '12px',
    border: '2px solid #e5e5e5',
    fontSize: '1rem',
    fontFamily: "'Playfair Display', serif",
    transition: 'border-color 0.3s',
    outline: 'none',
  },
  forgotPassword: {
    textAlign: 'right',
    marginTop: '-0.5rem',
  },
  link: {
    color: '#8b6914',
    fontSize: '0.9rem',
    textDecoration: 'none',
    cursor: 'pointer',
    fontWeight: 500,
  },
  button: {
    backgroundColor: '#8b6914',
    color: 'white',
    padding: '1.2rem',
    borderRadius: '12px',
    border: 'none',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s',
    marginTop: '1rem',
  },
  divider: {
    position: 'relative',
    textAlign: 'center',
    margin: '2rem 0',
  },
  dividerText: {
    backgroundColor: 'white',
    padding: '0 1rem',
    color: '#999',
    fontSize: '0.9rem',
    position: 'relative',
    zIndex: 1,
  },
  registerPrompt: {
    textAlign: 'center',
  },
  registerText: {
    fontSize: '0.95rem',
    color: '#666',
  },
  registerLink: {
    color: '#8b6914',
    textDecoration: 'none',
    fontWeight: 600,
  },
};