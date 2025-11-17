import { useState, useEffect } from 'react';

// Mock Header component since we don't have the actual one
const Header = ({ cart }) => (
  <div style={{ 
    backgroundColor: '#8b6914', 
    color: 'white', 
    padding: '1rem 2rem',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999
  }}>
    <h2>Xerjoff Perfume Admin</h2>
  </div>
);

export default function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCollection, setFilterCollection] = useState('all');
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    images: [],
    collection: 'mens',
    stock: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setError(null);
      console.log('Fetching products from: http://localhost:5000/api/products');
      
      const response = await fetch('http://localhost:5000/api/products');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Products fetched:', data);
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(`Failed to fetch products: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;

    const validFiles = [];
    const validPreviews = [];

    for (let file of files) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert(`${file.name} is not a valid image file`);
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large (max 5MB)`);
        continue;
      }

      validFiles.push(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        validPreviews.push(reader.result);
        if (validPreviews.length === validFiles.length) {
          setImagePreviews(prev => [...prev, ...validPreviews]);
        }
      };
      reader.readAsDataURL(file);
    }

    setImageFiles(prev => [...prev, ...validFiles]);
  };

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      description: '',
      images: [],
      collection: 'mens',
      stock: ''
    });
    setImageFiles([]);
    setImagePreviews([]);
    setEditMode(false);
    setSelectedProduct(null);
    setError(null);
  };

  const handleAddProduct = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEditProduct = (product) => {
    setFormData({
      name: product.name,
      price: product.price,
      description: product.description,
      images: product.images || [],
      collection: product.collection,
      stock: product.stock || 0
    });
    setSelectedProduct(product);
    setImageFiles([]);
    setImagePreviews([]);
    setEditMode(true);
    setShowModal(true);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.price || !formData.description || !formData.collection) {
      alert('Please fill in all required fields');
      return;
    }

    if (editMode && formData.images.length === 0 && imageFiles.length === 0) {
      alert('Please add at least one image');
      return;
    }

    if (!editMode && imageFiles.length === 0) {
      alert('Please add at least one image');
      return;
    }
    
    try {
      setError(null);
      const url = editMode 
        ? `http://localhost:5000/api/products/${selectedProduct._id}` 
        : 'http://localhost:5000/api/products';
      
      const method = editMode ? 'PUT' : 'POST';
      
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('collection', formData.collection);
      formDataToSend.append('stock', formData.stock || 0);
      
      if (editMode && formData.images.length > 0) {
        formDataToSend.append('existingImages', JSON.stringify(formData.images));
      }
      
      imageFiles.forEach((file) => {
        formDataToSend.append('images', file);
      });

      console.log('Submitting to:', url);
      console.log('Method:', method);

      const response = await fetch(url, {
        method,
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Success:', result);
      
      alert(editMode ? 'Product updated successfully!' : 'Product added successfully!');
      setShowModal(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      setError(`Error saving product: ${error.message}`);
      alert(`Error: ${error.message}`);
    }
  };

  const handleDeleteProduct = async (productId, productName) => {
    if (window.confirm(`Are you sure you want to delete "${productName}"?`)) {
      try {
        setError(null);
        const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        alert('Product deleted successfully!');
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        setError(`Error deleting product: ${error.message}`);
        alert(`Error: ${error.message}`);
      }
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCollection = filterCollection === 'all' || product.collection === filterCollection;
    return matchesSearch && matchesCollection;
  });

  if (loading) {
    return (
      <div style={styles.container}>
        <Header cart={[]} />
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Header cart={[]} />
      
      <div style={styles.content}>
        {/* Error Display */}
        {error && (
          <div style={styles.errorBanner}>
            <strong>⚠️ Error:</strong> {error}
            <button onClick={() => setError(null)} style={styles.errorClose}>×</button>
          </div>
        )}

        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Products Management</h1>
            <p style={styles.subtitle}>Manage your perfume inventory</p>
          </div>
          <div style={styles.headerActions}>
            <button 
              style={styles.addButton}
              onClick={handleAddProduct}
            >
              + Add New Product
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={styles.filterBar}>
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          <select
            value={filterCollection}
            onChange={(e) => setFilterCollection(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All Collections</option>
            <option value="mens">Men's</option>
            <option value="womens">Women's</option>
            <option value="unisex">Unisex</option>
          </select>
          <div style={styles.statsChip}>
            {filteredProducts.length} Products
          </div>
        </div>

        {/* Products Table */}
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.th}>Image</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Collection</th>
                <th style={styles.th}>Price</th>
                <th style={styles.th}>Stock</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" style={styles.emptyState}>
                    No products found. Add your first product to get started!
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product._id} style={styles.tableRow}>
                    <td style={styles.td}>
                      <img 
                        src={
                          product.images && product.images.length > 0 
                            ? (product.images[0].startsWith('http') ? product.images[0] : `http://localhost:5000${product.images[0]}`)
                            : 'https://via.placeholder.com/60'
                        }
                        alt={product.name}
                        style={styles.productImage}
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/60'; }}
                      />
                    </td>
                    <td style={styles.td}>
                      <div style={styles.productName}>{product.name}</div>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.collectionBadge}>
                        {product.collection}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <strong>${Number(product.price).toFixed(2)}</strong>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.stockBadge,
                        backgroundColor: product.stock > 10 ? '#d4edda' : '#f8d7da',
                        color: product.stock > 10 ? '#155724' : '#721c24'
                      }}>
                        {product.stock || 0}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionButtons}>
                        <button
                          style={styles.editBtn}
                          onClick={() => handleEditProduct(product)}
                        >
                          Edit
                        </button>
                        <button
                          style={styles.deleteBtn}
                          onClick={() => handleDeleteProduct(product._id, product.name)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {editMode ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                style={styles.closeButton}
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={styles.formContainer}>
              <div style={styles.formGrid}>
                <div style={{...styles.formGroup, gridColumn: '1 / -1'}}>
                  <label style={styles.label}>Product Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Price ($) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    style={styles.input}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Stock *</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    style={styles.input}
                    min="0"
                    required
                  />
                </div>

                <div style={{...styles.formGroup, gridColumn: '1 / -1'}}>
                  <label style={styles.label}>Collection *</label>
                  <select
                    name="collection"
                    value={formData.collection}
                    onChange={handleInputChange}
                    style={styles.input}
                    required
                  >
                    <option value="mens">Men's</option>
                    <option value="womens">Women's</option>
                    <option value="unisex">Unisex</option>
                  </select>
                </div>

                <div style={{...styles.formGroup, gridColumn: '1 / -1'}}>
                  <label style={styles.label}>Product Images *</label>
                  <div style={styles.imageUploadContainer}>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      style={styles.fileInput}
                      id="imageUpload"
                    />
                    <label htmlFor="imageUpload" style={styles.fileInputLabel}>
                      📁 Choose Images (Multiple)
                    </label>
                    
                    {editMode && formData.images.length > 0 && (
                      <div>
                        <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '1rem', marginBottom: '0.5rem' }}>
                          Existing Images:
                        </p>
                        <div style={styles.imageGrid}>
                          {formData.images.map((img, index) => (
                            <div key={`existing-${index}`} style={styles.imagePreviewContainer}>
                              <img 
                                src={img.startsWith('http') ? img : `http://localhost:5000${img}`}
                                alt={`Existing ${index + 1}`} 
                                style={styles.imagePreview}
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/120'; }}
                              />
                              <button
                                type="button"
                                style={styles.removeImageBtn}
                                onClick={() => removeExistingImage(index)}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {imagePreviews.length > 0 && (
                      <div>
                        <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '1rem', marginBottom: '0.5rem' }}>
                          New Images:
                        </p>
                        <div style={styles.imageGrid}>
                          {imagePreviews.map((preview, index) => (
                            <div key={`new-${index}`} style={styles.imagePreviewContainer}>
                              <img 
                                src={preview} 
                                alt={`Preview ${index + 1}`} 
                                style={styles.imagePreview}
                              />
                              <button
                                type="button"
                                style={styles.removeImageBtn}
                                onClick={() => removeImage(index)}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <small style={styles.helpText}>
                    Supported formats: JPEG, PNG, GIF, WebP (Max 5MB each)
                  </small>
                </div>

                <div style={{...styles.formGroup, gridColumn: '1 / -1'}}>
                  <label style={styles.label}>Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    style={{...styles.input, minHeight: '100px'}}
                    required
                  />
                </div>
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.submitButton}
                >
                  {editMode ? 'Update Product' : 'Add Product'}
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
  },
  content: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '120px 2rem 4rem',
  },
  errorBanner: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: '1px solid #f5c6cb'
  },
  errorClose: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#721c24'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: '0.5rem',
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#666',
  },
  headerActions: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  addButton: {
    backgroundColor: '#8b6914',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  filterBar: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    marginBottom: '2rem',
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
    alignItems: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  searchInput: {
    flex: 1,
    minWidth: '200px',
    padding: '0.75rem 1rem',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '1rem',
    fontFamily: 'inherit',
  },
  filterSelect: {
    padding: '0.75rem 1rem',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '1rem',
    fontFamily: 'inherit',
    cursor: 'pointer',
  },
  statsChip: {
    backgroundColor: '#8b6914',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    fontSize: '0.9rem',
    fontWeight: 600,
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    backgroundColor: '#f5f5f5',
  },
  th: {
    padding: '1rem',
    textAlign: 'left',
    fontWeight: 600,
    color: '#333',
    borderBottom: '2px solid #e0e0e0',
  },
  tableRow: {
    borderBottom: '1px solid #f0f0f0',
    transition: 'background-color 0.2s',
  },
  td: {
    padding: '1rem',
    verticalAlign: 'middle',
  },
  productImage: {
    width: '60px',
    height: '60px',
    objectFit: 'cover',
    borderRadius: '8px',
  },
  productName: {
    fontWeight: 600,
    color: '#1a1a1a',
  },
  collectionBadge: {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.85rem',
    backgroundColor: '#e8f4f8',
    color: '#0066cc',
    textTransform: 'capitalize',
  },
  stockBadge: {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.85rem',
    fontWeight: 600,
  },
  actionButtons: {
    display: 'flex',
    gap: '0.5rem',
  },
  editBtn: {
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 600,
  },
  deleteBtn: {
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 600,
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem',
    color: '#999',
    fontSize: '1.1rem',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '1rem',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '16px',
    maxWidth: '700px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem 2rem',
    borderBottom: '2px solid #f0f0f0',
  },
  modalTitle: {
    fontSize: '1.8rem',
    fontWeight: 700,
    color: '#1a1a1a',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '2rem',
    cursor: 'pointer',
    color: '#999',
    lineHeight: 1,
  },
  formContainer: {
    padding: '2rem',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#333',
    marginBottom: '0.5rem',
  },
  input: {
    padding: '0.75rem',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '1rem',
    fontFamily: 'inherit',
    transition: 'border-color 0.3s',
  },
  imageUploadContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  fileInput: {
    display: 'none',
  },
  fileInputLabel: {
    display: 'inline-block',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#8b6914',
    color: 'white',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 600,
    textAlign: 'center',
    transition: 'all 0.3s',
    width: 'fit-content',
  },
  imageGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: '1rem',
  },
  imagePreviewContainer: {
    position: 'relative',
    display: 'inline-block',
  },
  imagePreview: {
    width: '100%',
    height: '120px',
    borderRadius: '8px',
    border: '2px solid #e0e0e0',
    objectFit: 'cover',
  },
  removeImageBtn: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '26px',
    height: '26px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpText: {
    color: '#666',
    fontSize: '0.85rem',
    fontStyle: 'italic',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
    paddingTop: '1rem',
    borderTop: '2px solid #f0f0f0',
  },
  cancelButton: {
    backgroundColor: 'white',
    color: '#666',
    border: '2px solid #e0e0e0',
    padding: '0.75rem 2rem',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  submitButton: {
    backgroundColor: '#8b6914',
    color: 'white',
    border: 'none',
    padding: '0.75rem 2rem',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
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
};