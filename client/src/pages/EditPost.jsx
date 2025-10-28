// EditPost.jsx - Edit post page
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useApi from '../hooks/useApi';
import { postService, categoryService } from '../services/api';

const EditPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: '',
    tags: '',
    isPublished: true
  });

  const { data: post, loading: postLoading, error: postError } = useApi(
    () => postService.getPost(id),
    null,
    true
  );

  const { data: categories, loading: categoriesLoading } = useApi(
    categoryService.getAllCategories,
    [],
    true
  );

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title || '',
        content: post.content || '',
        excerpt: post.excerpt || '',
        category: post.category?._id || '',
        tags: post.tags?.join(', ') || '',
        isPublished: post.isPublished || false
      });
    }
  }, [post]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const postData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };
      
      await postService.updatePost(post._id, postData);
      navigate(`/posts/${post.slug}`);
    } catch (error) {
      console.error('Failed to update post:', error);
      alert('Failed to update post: ' + (error.response?.data?.error || error.message));
    }
  };

  if (postLoading || categoriesLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (postError) {
    return <div className="error">Error: {postError}</div>;
  }

  return (
    <div>
      <h1>Edit Post</h1>
      
      <form onSubmit={handleSubmit} className="card">
        <div className="form-group">
          <label className="form-label">Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Content</label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            className="form-control"
            rows="10"
            required
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
          />
        </div>

        <div className="form-group">
          <label className="form-label">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="form-control"
            required
          >
            <option value="">Select a category</option>
            {categories.map(category => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

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
            Published
          </label>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button type="submit" className="btn btn-primary">
            Update Post
          </button>
          <button 
            type="button" 
            className="btn btn-danger"
            onClick={() => navigate(`/posts/${post.slug}`)}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditPost;