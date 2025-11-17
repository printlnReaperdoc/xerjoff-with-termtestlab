import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error for this field
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, profilePicture: 'Image size must be less than 5MB' });
        return;
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setErrors({ ...errors, profilePicture: 'Only JPG, PNG, and GIF images are allowed' });
        return;
      }

      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
      setErrors({ ...errors, profilePicture: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 3) {
      newErrors.password = 'Password must be at least 3 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name.trim());
      formDataToSend.append('username', formData.username.trim());
      formDataToSend.append('email', formData.email.trim());
      formDataToSend.append('password', formData.password);
      
      if (profilePicture) {
        formDataToSend.append('profilePicture', profilePicture);
      }

      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        body: formDataToSend
      });

      const data = await response.json();

      if (data.success) {
        alert('Registration successful! Please login.');
        navigate('/login');
      } else {
        setErrors({ submit: data.message || 'Registration failed' });
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ submit: 'Server error. Please try again later.' });
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

      {/* Register Form */}
      <div style={styles.formContainer}>
        <div style={styles.formCard}>
          <h1 style={styles.title}>Create Account</h1>
          <p style={styles.subtitle}>Join our exclusive community</p>

          <div style={styles.form}>
            {/* Profile Picture Upload */}
            <div style={styles.profilePictureContainer}>
              <div style={styles.profilePictureWrapper}>
                {previewUrl ? (
                  <img src={previewUrl} alt="Profile preview" style={styles.profilePreview} />
                ) : (
                  <div style={styles.profilePlaceholder}>
                    <svg style={styles.uploadIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
                <input
                  type="file"
                  id="profilePicture"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={styles.fileInput}
                />
                <label htmlFor="profilePicture" style={styles.uploadButton}>
                  {previewUrl ? 'Change Photo' : 'Upload Photo'}
                </label>
                {errors.profilePicture && <span style={styles.error}>{errors.profilePicture}</span>}
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                style={{...styles.input, ...(errors.name ? styles.inputError : {})}}
                placeholder="John Doe"
              />
              {errors.name && <span style={styles.error}>{errors.name}</span>}
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                style={{...styles.input, ...(errors.username ? styles.inputError : {})}}
                placeholder="johndoe"
              />
              {errors.username && <span style={styles.error}>{errors.username}</span>}
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                style={{...styles.input, ...(errors.email ? styles.inputError : {})}}
                placeholder="your@email.com"
              />
              {errors.email && <span style={styles.error}>{errors.email}</span>}
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                style={{...styles.input, ...(errors.password ? styles.inputError : {})}}
                placeholder="Create a password"
              />
              {errors.password && <span style={styles.error}>{errors.password}</span>}
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                style={{...styles.input, ...(errors.confirmPassword ? styles.inputError : {})}}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && <span style={styles.error}>{errors.confirmPassword}</span>}
            </div>

            {errors.submit && (
              <div style={styles.submitError}>{errors.submit}</div>
            )}

            <button 
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              style={{
                ...styles.button,
                ...(loading ? styles.buttonDisabled : {})
              }}
              onMouseOver={(e) => !loading && (e.currentTarget.style.backgroundColor = '#6d5010')} 
              onMouseOut={(e) => !loading && (e.currentTarget.style.backgroundColor = '#8b6914')}
            >
              {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
            </button>
          </div>

          <div style={styles.divider}>
            <span style={styles.dividerText}>OR</span>
          </div>

          <div style={styles.loginPrompt}>
            <p style={styles.loginText}>
              Already have an account?{' '}
              <Link to="/login" style={styles.loginLink}>
                Sign In
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
  profilePictureContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '1rem',
  },
  profilePictureWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  },
  profilePreview: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '4px solid #8b6914',
  },
  profilePlaceholder: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    backgroundColor: '#f5f5f5',
    border: '3px dashed #d4af37',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadIcon: {
    width: '48px',
    height: '48px',
    color: '#8b6914',
  },
  fileInput: {
    display: 'none',
  },
  uploadButton: {
    backgroundColor: '#f5f5f5',
    color: '#8b6914',
    padding: '0.6rem 1.5rem',
    borderRadius: '8px',
    border: '2px solid #8b6914',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s',
    fontFamily: "'Playfair Display', serif",
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
  inputError: {
    borderColor: '#dc3545',
  },
  error: {
    color: '#dc3545',
    fontSize: '0.85rem',
    marginTop: '0.25rem',
  },
  submitError: {
    backgroundColor: '#fee',
    color: '#dc3545',
    padding: '1rem',
    borderRadius: '8px',
    textAlign: 'center',
    fontSize: '0.9rem',
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
  buttonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
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
  loginPrompt: {
    textAlign: 'center',
  },
  loginText: {
    fontSize: '0.95rem',
    color: '#666',
  },
  loginLink: {
    color: '#8b6914',
    textDecoration: 'none',
    fontWeight: 600,
  },
};