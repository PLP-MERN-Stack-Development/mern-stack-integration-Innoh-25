// client/src/pages/CreatePost.jsx - Updated with image upload
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useApi from '../hooks/useApi';
import { postService, categoryService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ImageUpload from '../components/ImageUpload';

const CreatePost = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: '',
    tags: '',
    isPublished: true
  });
  const [featuredImage, setFeaturedImage] = useState(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);

  const { data: categories, loading: categoriesLoading, error: categoriesError, execute: fetchCategories } = useApi(
    categoryService.getAllCategories,
    [],
    true
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNewCategoryChange = (e) => {
    const { name, value } = e.target;
    setNewCategory(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.name.trim()) return;

    try {
      await categoryService.createCategory(newCategory);
      setNewCategory({ name: '', description: '' });
      setShowCategoryForm(false);
      fetchCategories();
    } catch (error) {
      console.error('Failed to create category:', error);
      alert('Failed to create category: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleImageSelect = (file) => {
    setFeaturedImage(file);
  };

  const handleRemoveImage = () => {
    setFeaturedImage(null);
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  
  if (!formData.category) {
    alert('Please select a category');
    setLoading(false);
    return;
  }
  
  try {
    const postData = {
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      isPublished: true
    };

    // Add featured image file if selected
    if (featuredImage) {
      postData.featuredImage = featuredImage;
    }
    
    console.log('Creating post with image...');
    
    const result = await postService.createPost(postData);
    console.log('Post created successfully:', result);
    navigate(`/posts/${result.data.slug}`);
  } catch (error) {
    console.error('Failed to create post:', error);
    alert('Failed to create post: ' + (error.response?.data?.error || error.message));
  } finally {
    setLoading(false);
  }
};

  if (categoriesLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="container">
      <h1>Create New Post</h1>
      
      <div style={{ 
        backgroundColor: '#e8f5e8', 
        padding: '1rem', 
        borderRadius: '8px', 
        marginBottom: '2rem',
        border: '1px solid #4caf50'
      }}>
        <strong>Note:</strong> Posts are published immediately by default.
      </div>
      
      <form onSubmit={handleSubmit} className="card">
        <div className="form-group">
          <label className="form-label">Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="form-control"
            required
            placeholder="Enter post title"
          />
        </div>

        {/* Image Upload Component */}
        <div className="form-group">
          <ImageUpload 
            onImageSelect={handleImageSelect}
            onRemoveImage={handleRemoveImage}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Content *</label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            className="form-control"
            rows="10"
            required
            placeholder="Write your post content here..."
          />
        </div>

        <div className="form-group">
          <label className="form-label">Excerpt (Optional)</label>
          <textarea
            name="excerpt"
            value={formData.excerpt}
            onChange={handleChange}
            className="form-control"
            rows="3"
            maxLength="200"
            placeholder="Brief description of your post (optional)"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Category *</label>
          
          {categoriesError ? (
            <div className="error">Error loading categories</div>
          ) : categories.length === 0 ? (
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ color: '#e74c3c', marginBottom: '1rem' }}>
                No categories available. Please create a category first.
              </p>
              <button 
                type="button" 
                onClick={() => setShowCategoryForm(true)}
                className="btn btn-primary"
              >
                Create New Category
              </button>
            </div>
          ) : (
            <>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="form-control"
                required
              >
                <option value="">Select a category *</option>
                {categories.map(category => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <button 
                type="button" 
                onClick={() => setShowCategoryForm(true)}
                className="btn"
                style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}
              >
                + Add New Category
              </button>
            </>
          )}
        </div>

        {/* New Category Form */}
        {showCategoryForm && (
          <div className="card" style={{ backgroundColor: '#f8f9fa', marginBottom: '1rem' }}>
            <h4>Create New Category</h4>
            <form onSubmit={handleCreateCategory}>
              <div className="form-group">
                <label className="form-label">Category Name *</label>
                <input
                  type="text"
                  name="name"
                  value={newCategory.name}
                  onChange={handleNewCategoryChange}
                  className="form-control"
                  required
                  placeholder="Enter category name"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <textarea
                  name="description"
                  value={newCategory.description}
                  onChange={handleNewCategoryChange}
                  className="form-control"
                  rows="2"
                  placeholder="Enter category description (optional)"
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className="btn btn-primary">
                  Create Category
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowCategoryForm(false)}
                  className="btn btn-danger"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Tags (comma separated)</label>
          <input
            type="text"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            className="form-control"
            placeholder="react, javascript, web-development"
          />
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              name="isPublished"
              checked={formData.isPublished}
              onChange={handleChange}
            />
            <strong>Publish immediately</strong>
          </label>
          <small style={{ color: '#666', marginLeft: '1.5rem' }}>
            Uncheck to save as draft (not visible on homepage)
          </small>
        </div>

        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading || !formData.category}
          style={{ fontSize: '1.1rem', padding: '0.75rem 2rem' }}
        >
          {loading ? '📤 Creating Post...' : '📝 Create Post'}
        </button>
      </form>
    </div>
  );
};

export default CreatePost;