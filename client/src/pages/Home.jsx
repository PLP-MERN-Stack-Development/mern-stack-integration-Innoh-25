// client/src/pages/Home.jsx - Styled version of your existing code
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { postService, categoryService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { isAuthenticated, user, loading: authLoading } = useAuth();

  // Fetch posts when authenticated or when page/category changes
  useEffect(() => {
    const fetchPosts = async () => {
      if (!isAuthenticated) return;
      
      setLoading(true);
      setError('');
      try {
        const result = await postService.getAllPosts(page, 10, selectedCategory);
        setPosts(result.data || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [isAuthenticated, page, selectedCategory]);

  // Fetch categories once
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const result = await categoryService.getAllCategories();
        setCategories(result.data || []);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };

    fetchCategories();
  }, []);

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setPage(1);
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="loading">
        <h3>Loading...</h3>
        <p>Please wait while we verify your access</p>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="auth-container">
        <div className="hero-section">
          <h1>📝 Welcome to Our Blog</h1>
          <p style={{color:'white'}}>Join our community to read and share amazing content</p>
        </div>
        <div className="auth-card">
          <h4>Please log in to view posts and interact with our community</h4>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
            <Link to="/login" className="btn btn-primary">
              🔐 Login
            </Link>
            <Link to="/register" className="btn">
              📝 Register
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while fetching posts
  if (loading) {
    return (
      <div className="loading">
        <h3>Loading posts...</h3>
        <p>Fetching the latest content for you, {user?.username}!</p>
      </div>
    );
  }

  // Show error if posts failed to load
  if (error) {
    return (
      <div className="error">
        <h3>🚫 Error loading posts</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="btn btn-primary">
          🔄 Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header Section */}
      <div className="welcome-message">
        <h1>🎉 Welcome back, {user?.username}!</h1>
        <p className="mb-0">Here are the latest posts from our community</p>
      </div>

      {/* Category Filter */}
      <div className="category-filter">
        <label htmlFor="category-select" style={{ fontWeight: '600', color: 'var(--text-dark)' }}>
          📂 Filter by Category:
        </label>
        <select 
          id="category-select"
          value={selectedCategory} 
          onChange={handleCategoryChange}
          className="form-control"
          style={{ width: '200px' }}
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Posts List */}
      {posts.length > 0 ? (
        <div>
          <div style={{ marginBottom: '1rem', color: 'black' }}>
            📚 Showing <b>{posts.length}</b> posts
          </div>
          {posts.map(post => (
            <div key={post._id} className="post-card">
              <Link to={`/posts/${post.slug}`} className="post-title">
                {post.title}
              </Link>
              <div className="post-meta">
                <span>👤 By {post.author?.username}</span>
                <span>📅 {new Date(post.createdAt).toLocaleDateString()}</span>
                <span>🏷️ {post.category?.name}</span>
                <span>👁️ {post.viewCount} views</span>
              </div>
              {post.excerpt && (
                <p className="post-excerpt">{post.excerpt}</p>
              )}
              <div style={{ marginTop: '1rem' }}>
                <Link to={`/posts/${post.slug}`} className="btn btn-primary" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                  📖 Read More →
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center">
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📝</div>
          <h3>No posts found</h3>
          <p style={{ color: 'var(--text-light)', marginBottom: '2rem' }}>
            There are no published posts to display at the moment.
          </p>
          <Link to="/create-post" className="btn btn-primary">
            ✨ Create Your First Post
          </Link>
        </div>
      )}

      {/* Pagination */}
      {posts.length > 0 && (
        <div className="pagination">
          <button 
            onClick={() => setPage(page - 1)} 
            disabled={page === 1}
            className="btn btn-primary"
          >
            ← Previous
          </button>
          <span style={{ fontWeight: '600', color: 'var(--text-dark)' }}>Page {page}</span>
          <button 
            onClick={() => setPage(page + 1)} 
            className="btn btn-primary"
          >
            Next →
          </button>
        </div>
      )}

      {/* Quick Action Buttons */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
        <Link to="/create-post" className="btn btn-primary">
          ✏️ Create New Post
        </Link>
        <button 
          onClick={() => window.location.reload()} 
          className="btn"
        >
          🔄 Refresh Posts
        </button>
      </div>
    </div>
  );
};

export default Home;