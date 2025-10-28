// client/src/pages/Home.jsx 
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
    return <div className="loading">Loading...</div>;
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <h1>Welcome to Our Blog</h1>
        <p>Please log in to view posts</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
          <Link to="/login" className="btn btn-primary">
            Login
          </Link>
          <Link to="/register" className="btn">
            Register
          </Link>
        </div>
      </div>
    );
  }

  // Show loading while fetching posts
  if (loading) {
    return <div className="loading">Loading posts...</div>;
  }

  // Show error if posts failed to load
  if (error) {
    return (
      <div className="error">
        <h3>Error loading posts</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1>Welcome back, {user?.username}! 👋</h1>
        
        {/* Category Filter */}
        <select 
          value={selectedCategory} 
          onChange={handleCategoryChange}
          className="form-control"
          style={{ width: '200px', marginBottom: '1rem' }}
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
        posts.map(post => (
          <div key={post._id} className="card post-card">
            <Link to={`/posts/${post.slug}`} className="post-title">
              {post.title}
            </Link>
            <div className="post-meta">
              By {post.author?.username} • {new Date(post.createdAt).toLocaleDateString()} • 
              Category: {post.category?.name} • Views: {post.viewCount}
            </div>
            {post.excerpt && (
              <p className="post-excerpt">{post.excerpt}</p>
            )}
          </div>
        ))
      ) : (
        <div className="card">
          <h3>No posts found</h3>
          <p>There are no published posts to display.</p>
          <Link to="/create-post" className="btn btn-primary">
            Create Your First Post
          </Link>
        </div>
      )}

      {/* Simple Pagination - You can remove this if it's causing issues */}
      {posts.length > 0 && (
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
          <button 
            onClick={() => setPage(page - 1)} 
            disabled={page === 1}
            className="btn btn-primary"
          >
            Previous
          </button>
          <span>Page {page}</span>
          <button 
            onClick={() => setPage(page + 1)} 
            className="btn btn-primary"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Home;