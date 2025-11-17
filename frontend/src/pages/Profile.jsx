import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewImage, setPreviewImage] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    profilePicture: null
  });

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    
    try {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setFormData({
        name: userData.name || '',
        username: userData.username || '',
        profilePicture: null
      });
      if (userData.profilePicture) {
        setPreviewImage(`http://localhost:5000${userData.profilePicture}`);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      navigate('/login');
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setError('Please select a valid image file (JPEG, PNG, or GIF)');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      setFormData(prev => ({
        ...prev,
        profilePicture: file
      }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('username', formData.username);
      if (formData.profilePicture) {
        submitData.append('profilePicture', formData.profilePicture);
      }

      const response = await fetch(`http://localhost:5000/api/auth/update/${user.id}`, {
        method: 'PUT',
        body: submitData
      });

      const data = await response.json();

      if (data.success) {
        // Update localStorage with new user data
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Update local state
        setUser(data.user);
        if (data.user.profilePicture) {
          setPreviewImage(`http://localhost:5000${data.user.profilePicture}`);
        }
        
        // Dispatch event to update header
        window.dispatchEvent(new Event('userLogin'));
        
        setSuccess('Profile updated successfully!');
        setTimeout(() => {
          setShowModal(false);
          setSuccess('');
        }, 2000);
      } else {
        setError(data.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Update error:', err);
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const closeModal = () => {
    setShowModal(false);
    setError('');
    setSuccess('');
    // Reset form to current user data
    if (user) {
      setFormData({
        name: user.name || '',
        username: user.username || '',
        profilePicture: null
      });
      if (user.profilePicture) {
        setPreviewImage(`http://localhost:5000${user.profilePicture}`);
      }
    }
  };

  if (!user) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.profileCard}>
        <div style={styles.profileHeader}>
          <div style={styles.avatarContainer}>
            {user.profilePicture ? (
              <img 
                src={`http://localhost:5000${user.profilePicture}`} 
                alt={user.name}
                style={styles.avatar}
              />
            ) : (
              <div style={styles.avatarPlaceholder}>
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h1 style={styles.name}>{user.name}</h1>
          <p style={styles.username}>@{user.username}</p>
          <p style={styles.email}>{user.email}</p>
          {user.isAdmin && (
            <span style={styles.adminBadge}>Admin</span>
          )}
        </div>

        <div style={styles.profileBody}>
          <h2 style={styles.sectionTitle}>Profile Information</h2>
          
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Full Name</span>
              <span style={styles.infoValue}>{user.name}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Username</span>
              <span style={styles.infoValue}>@{user.username}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Email Address</span>
              <span style={styles.infoValue}>{user.email}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Account Type</span>
              <span style={styles.infoValue}>{user.isAdmin ? 'Administrator' : 'User'}</span>
            </div>
          </div>

          <button 
            style={styles.editButton}
            onClick={openModal}
          >
            Edit Profile
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Update Profile</h2>
              <button style={styles.closeButton} onClick={closeModal}>×</button>
            </div>

            {error && (
              <div style={styles.errorMessage}>{error}</div>
            )}

            {success && (
              <div style={styles.successMessage}>{success}</div>
            )}

            <form onSubmit={handleSubmit} style={styles.form}>
              {/* Profile Picture Upload */}
              <div style={styles.imageUploadSection}>
                <div style={styles.imagePreview}>
                  {previewImage ? (
                    <img src={previewImage} alt="Preview" style={styles.previewImg} />
                  ) : (
                    <div style={styles.previewPlaceholder}>
                      {formData.name.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                </div>
                <div style={styles.uploadButtonContainer}>
                  <label style={styles.uploadLabel}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={styles.fileInput}
                      disabled={loading}
                    />
                    Choose Photo
                  </label>
                  <p style={styles.uploadHint}>JPG, PNG or GIF (Max 5MB)</p>
                </div>
              </div>


              {/* Name Input */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Enter your full name"
                  disabled={loading}
                />
              </div>

              {/* Username Input */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Enter your username"
                  disabled={loading}
                />
              </div>

              {/* Buttons */}
              <div style={styles.buttonGroup}>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={closeModal}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    ...styles.saveButton,
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    fontFamily: "'Playfair Display', serif",
    backgroundColor: '#faf8f3',
    minHeight: '100vh',
    padding: '100px 2rem 2rem',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontSize: '1.2rem',
    color: '#666',
  },
  profileCard: {
    maxWidth: '800px',
    margin: '0 auto',
    backgroundColor: 'white',
    borderRadius: '20px',
    boxShadow: '0 20px 60px rgba(139, 105, 20, 0.15)',
    overflow: 'hidden',
  },
  profileHeader: {
    background: 'linear-gradient(135deg, #b8860b 0%, #8b6914 100%)',
    padding: '3rem 2rem',
    textAlign: 'center',
    color: 'white',
  },
  avatarContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '1.5rem',
  },
  avatar: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '4px solid white',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
  },
  avatarPlaceholder: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    border: '4px solid white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '3rem',
    fontWeight: 'bold',
    color: 'white',
  },
  name: {
    fontSize: '2rem',
    fontWeight: 700,
    margin: '0 0 0.5rem',
  },
  username: {
    fontSize: '1.1rem',
    margin: '0 0 0.5rem',
    opacity: 0.9,
  },
  email: {
    fontSize: '0.95rem',
    margin: '0',
    opacity: 0.8,
  },
  adminBadge: {
    display: 'inline-block',
    marginTop: '1rem',
    padding: '0.5rem 1rem',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: '20px',
    fontSize: '0.9rem',
    fontWeight: 600,
  },
  profileBody: {
    padding: '2rem',
  },
  sectionTitle: {
    fontSize: '1.5rem',
    fontWeight: 600,
    color: '#333',
    marginBottom: '1.5rem',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  infoLabel: {
    fontSize: '0.85rem',
    color: '#666',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  infoValue: {
    fontSize: '1rem',
    color: '#333',
  },
  editButton: {
    backgroundColor: '#8b6914',
    color: 'white',
    padding: '1rem 2rem',
    borderRadius: '12px',
    border: 'none',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s',
    width: '100%',
    marginTop: '1rem',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
    padding: '1rem',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem 2rem',
    borderBottom: '1px solid #e5e5e5',
  },
  modalTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#333',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '2rem',
    color: '#666',
    cursor: 'pointer',
    lineHeight: 1,
    padding: 0,
    width: '32px',
    height: '32px',
  },
  form: {
    padding: '2rem',
  },
  imageUploadSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
    marginBottom: '2rem',
    paddingBottom: '2rem',
    borderBottom: '1px solid #e5e5e5',
  },
  imagePreview: {
    flexShrink: 0,
  },
  previewImg: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid #b8860b',
  },
  previewPlaceholder: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    backgroundColor: '#f0f0f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#666',
    border: '3px solid #e5e5e5',
  },
  uploadButtonContainer: {
    flex: 1,
  },
  uploadLabel: {
    display: 'inline-block',
    backgroundColor: '#f5f5f5',
    color: '#333',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: 600,
    transition: 'all 0.3s',
    border: '2px solid #e5e5e5',
  },
  fileInput: {
    display: 'none',
  },
  uploadHint: {
    fontSize: '0.85rem',
    color: '#666',
    marginTop: '0.5rem',
    marginBottom: 0,
  },
  inputGroup: {
    marginBottom: '1.5rem',
  },
  label: {
    display: 'block',
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#333',
    marginBottom: '0.5rem',
  },
  input: {
    width: '100%',
    padding: '1rem',
    borderRadius: '12px',
    border: '2px solid #e5e5e5',
    fontSize: '1rem',
    fontFamily: "'Playfair Display', serif",
    transition: 'border-color 0.3s',
    outline: 'none',
    boxSizing: 'border-box',
  },
  errorMessage: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '1rem',
    borderRadius: '8px',
    margin: '0 2rem 1rem',
    textAlign: 'center',
    fontSize: '0.95rem',
    border: '1px solid #fcc',
  },
  successMessage: {
    backgroundColor: '#efe',
    color: '#3c3',
    padding: '1rem',
    borderRadius: '8px',
    margin: '0 2rem 1rem',
    textAlign: 'center',
    fontSize: '0.95rem',
    border: '1px solid #cfc',
  },
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
    marginTop: '2rem',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    color: '#333',
    padding: '1rem',
    borderRadius: '12px',
    border: 'none',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s',
    fontFamily: 'inherit',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#8b6914',
    color: 'white',
    padding: '1rem',
    borderRadius: '12px',
    border: 'none',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s',
    fontFamily: 'inherit',
  },
};