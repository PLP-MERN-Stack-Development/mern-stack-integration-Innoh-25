// Post.jsx - Single post page
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useApi from '../hooks/useApi';
import { postService } from '../services/api';

const Post = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [comment, setComment] = useState('');
  
  const { data: post, loading, error, execute } = useApi(
    () => postService.getPost(id),
    null,
    true
  );

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      await postService.addComment(post._id, { content: comment });
      setComment('');
      // Refresh post data to show new comment
      execute();
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  if (loading) return <div className="loading">Loading post...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!post) return <div className="error">Post not found</div>;

  return (
    <div>
      <Link to="/" className="btn btn-primary" style={{ marginBottom: '1rem' }}>
        ← Back to Posts
      </Link>
      
      <article className="card">
        <h1>{post.title}</h1>
        <div className="post-meta">
          By {post.author?.username} • {new Date(post.createdAt).toLocaleDateString()} • 
          Category: {post.category?.name} • Views: {post.viewCount}
        </div>
        
        {post.featuredImage && post.featuredImage !== 'default-post.jpg' && (
          <img 
            src={`/uploads/${post.featuredImage}`} 
            alt={post.title}
            style={{ maxWidth: '100%', margin: '1rem 0', borderRadius: '8px' }}
          />
        )}
        
        <div style={{ marginTop: '2rem', lineHeight: '1.8' }}>
          {post.content}
        </div>
      </article>

      {/* Comments Section */}
      <section className="card" style={{ marginTop: '2rem' }}>
        <h3>Comments ({post.comments?.length || 0})</h3>
        
        {/* Add Comment Form */}
        {isAuthenticated && (
          <form onSubmit={handleAddComment} style={{ marginBottom: '2rem' }}>
            <div className="form-group">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                className="form-control"
                rows="4"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Add Comment
            </button>
          </form>
        )}

        {/* Comments List */}
        {post.comments && post.comments.length > 0 ? (
          post.comments.map((comment, index) => (
            <div key={index} style={{ 
              padding: '1rem', 
              borderBottom: '1px solid #eee',
              marginBottom: '1rem'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {comment.user?.username || 'Anonymous'}
              </div>
              <div>{comment.content}</div>
              <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
                {new Date(comment.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))
        ) : (
          <p>No comments yet. Be the first to comment!</p>
        )}
      </section>
    </div>
  );
};

export default Post;