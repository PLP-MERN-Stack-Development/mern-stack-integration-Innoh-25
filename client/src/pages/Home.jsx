// client/src/pages/Home.jsx - Updated with debugging
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useApi from '../hooks/useApi';
import { postService, categoryService } from '../services/api';

const Home = () => {
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');
  
  const { 
    data: postsData, 
    loading: postsLoading, 
    error: postsError,
    execute: fetchPosts 
  } = useApi(
    () => postService.getAllPosts(page, 10, selectedCategory),
    { data: [], pagination: {} },
    true
  );

  const { 
    data: categories, 
    loading: categoriesLoading,
    error: categoriesError 
  } = useApi(
    categoryService.getAllCategories,
    [],
    true
  );

  // Debug effect
  useEffect(() => {
    console.log('Home component - Posts data:', postsData);
    console.log('Home component - Posts loading:', postsLoading);
    console.log('Home component - Posts error:', postsError);
  }, [postsData, postsLoading, postsError]);

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setPage(1);
  };

  const handleRetry = () => {
    fetchPosts();
  };

  if (postsLoading || categoriesLoading) {
    return <div className="loading">Loading posts...</div>;
  }

  if (postsError) {
    return (
      <div className="error">
        <h3>Error loading posts</h3>
        <p>{postsError.message || 'Unable to connect to server'}</p>
        <button onClick={handleRetry} className="btn btn-primary">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1>Latest Posts</h1>
        
        {/* Debug info */}
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '1rem', 
          borderRadius: '4px', 
          marginBottom: '1rem',
          fontSize: '0.9rem'
        }}>
          <strong>Debug Info:</strong> 
          Showing {postsData.data?.length || 0} posts | 
          Page: {page} | 
          Category: {selectedCategory || 'All'}
        </div>
        
        {/* Category Filter */}
        {categoriesError ? (
          <div className="error" style={{ marginBottom: '1rem' }}>
            Error loading categories
          </div>
        ) : (
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
        )}
      </div>

      {/* Posts List */}
      {postsData.data && postsData.data.length > 0 ? (
        postsData.data.map(post => (
          <div key={post._id} className="card post-card">
            <Link to={`/posts/${post.slug}`} className="post-title">
              {post.title}
            </Link>
            <div className="post-meta">
              By {post.author?.username} • {new Date(post.createdAt).toLocaleDateString()} • 
              Category: {post.category?.name} • Views: {post.viewCount}
              {!post.isPublished && <span style={{color: 'red', marginLeft: '1rem'}}>(Draft)</span>}
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
          <p>This could be because:</p>
          <ul>
            <li>All posts are drafts (not published)</li>
            <li>No posts have been created yet</li>
            <li>There's a filter applied that matches no posts</li>
          </ul>
          <Link to="/create-post" className="btn btn-primary">
            Create Your First Post
          </Link>
        </div>
      )}

      {/* Pagination */}
      {postsData.pagination && postsData.pagination.pages > 1 && (
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
          <button 
            onClick={() => setPage(page - 1)} 
            disabled={page === 1}
            className="btn btn-primary"
          >
            Previous
          </button>
          <span>Page {page} of {postsData.pagination.pages}</span>
          <button 
            onClick={() => setPage(page + 1)} 
            disabled={page === postsData.pagination.pages}
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