// posts.js - Routes for blog posts

const express = require('express');
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const Category = require('../models/Category');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');

const router = express.Router();

// Validation rules
const postValidationRules = [
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('category').isMongoId().withMessage('Valid category is required'),
];

// @route   GET /api/posts
// @desc    Get all posts with pagination and filtering
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category;
    const skip = (page - 1) * limit;

    let query = { isPublished: true };
    if (category) {
      query.category = category;
    }

    const posts = await Post.find(query)
      .populate('author', 'username')
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments(query);

    res.json({
      success: true,
      data: posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// @route   GET /api/posts/:id
// @desc    Get a single post by ID or slug
// @access  Public
// Enhanced version with better error logging
router.get('/:id', async (req, res) => {
  try {
    console.log(`Fetching post with identifier: ${req.params.id}`);
    
    let post;
    const identifier = req.params.id;
    
    // Check if the parameter is a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      console.log('Identifier is a valid ObjectId, searching by ID');
      post = await Post.findById(identifier)
        .populate('author', 'username avatar')
        .populate('category', 'name')
        .populate('comments.user', 'username');
    } else {
      console.log('Identifier is not an ObjectId, searching by slug:', identifier);
      post = await Post.findOne({ slug: identifier })
        .populate('author', 'username avatar')
        .populate('category', 'name')
        .populate('comments.user', 'username');
    }

    console.log('Post found:', post ? 'Yes' : 'No');
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: `Post not found with identifier: ${identifier}`,
      });
    }

    // Increment view count
    await post.incrementViewCount();
    console.log('View count incremented');

    res.json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error('Error fetching post:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: 'Server error while fetching post',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});
// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
router.post('/', [auth, postValidationRules], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    // Generate unique slug
    const slug = await Post.generateUniqueSlug(req.body.title);

    const post = new Post({
      ...req.body,
      slug: slug,
      author: req.user.id,
    });

    await post.save();
    await post.populate('category', 'name');
    await post.populate('author', 'username');

    res.status(201).json({
      success: true,
      data: post,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Post with this title already exists',
      });
    }
    console.error('Error creating post:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// @route   PUT /api/posts/:id
// @desc    Update a post
// @access  Private
router.put('/:id', [auth, postValidationRules], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    let post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    // Check if user owns the post or is admin
    if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this post',
      });
    }

    post = await Post.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    )
      .populate('author', 'username')
      .populate('category', 'name');

    res.json({
      success: true,
      data: post,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// @route   DELETE /api/posts/:id
// @desc    Delete a post
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    // Check if user owns the post or is admin
    if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this post',
      });
    }

    await Post.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// @route   POST /api/posts/:id/comments
// @desc    Add a comment to a post
// @access  Private
router.post('/:id/comments', [
  auth,
  body('content').notEmpty().withMessage('Comment content is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    await post.addComment(req.user.id, req.body.content);
    await post.populate('comments.user', 'username');

    res.status(201).json({
      success: true,
      data: post.comments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// @route   GET /api/posts/search
// @desc    Search posts
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
      });
    }

    const posts = await Post.find({
      isPublished: true,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } },
      ],
    })
      .populate('author', 'username')
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      data: posts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;