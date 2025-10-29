// server/routes/posts.js - Fixed and optimized version
const express = require('express');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Post = require('../models/Post');
const Category = require('../models/Category');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Validation rules
const postValidationRules = [
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('category').isMongoId().withMessage('Valid category is required'),
];

// @route   GET /api/posts
// @desc    Get all posts with pagination and filtering
// @access  Private (requires authentication)
router.get('/', auth, async (req, res) => {
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
      .select('-featuredImage.data') // Exclude image data to reduce payload
      .populate('author', 'username')
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments(query);

    // Add hasFeaturedImage flag to each post
    const postsWithImageFlag = posts.map(post => ({
      ...post.toObject(),
      hasFeaturedImage: !!post.featuredImage
    }));

    res.json({
      success: true,
      data: postsWithImageFlag,
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
router.get('/:id', async (req, res) => {
  try {
    let post;
    const identifier = req.params.id;

    if (mongoose.Types.ObjectId.isValid(identifier)) {
      post = await Post.findById(identifier)
        .select('-featuredImage.data') // Exclude image data
        .populate('author', 'username avatar')
        .populate('category', 'name')
        .populate('comments.user', 'username');
    } else {
      post = await Post.findOne({ slug: identifier })
        .select('-featuredImage.data') // Exclude image data
        .populate('author', 'username avatar')
        .populate('category', 'name')
        .populate('comments.user', 'username');
    }

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    // Add hasFeaturedImage flag
    const responsePost = {
      ...post.toObject(),
      hasFeaturedImage: !!post.featuredImage
    };

    // Increment view count
    await Post.findByIdAndUpdate(post._id, { $inc: { viewCount: 1 } });

    res.json({
      success: true,
      data: responsePost,
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching post',
    });
  }
});

// @route   GET /api/posts/:id/image
// @desc    Get featured image for a post
// @access  Public
router.get('/:id/image', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).select('featuredImage');
    
    if (!post || !post.featuredImage || !post.featuredImage.data) {
      return res.status(404).json({
        success: false,
        error: 'Image not found'
      });
    }

    // Set appropriate content type
    res.set('Content-Type', post.featuredImage.contentType);
    
    // Send the image buffer
    res.send(post.featuredImage.data);
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching image'
    });
  }
});

// @route   POST /api/posts
// @desc    Create a new post with image
// @access  Private
router.post('/', [auth, upload.single('featuredImage')], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { title, content, excerpt, category, tags, isPublished } = req.body;

    // Generate unique slug
    const slug = await Post.generateUniqueSlug(title);

    const postData = {
      title,
      content,
      excerpt,
      category,
      tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
      isPublished: isPublished === 'true' || isPublished === true,
      slug,
      author: req.user.id,
    };

    // Add featured image if uploaded (Base64 storage)
    if (req.file) {
      postData.featuredImage = {
        data: req.file.buffer, // Store the file buffer directly in database
        contentType: req.file.mimetype,
        filename: req.file.originalname
      };
    }

    const post = new Post(postData);
    await post.save();
    
    // Populate author and category for response
    await post.populate('category', 'name');
    await post.populate('author', 'username');

    // Don't send image data in response to avoid huge payloads
    const responsePost = post.toObject();
    delete responsePost.featuredImage;

    res.status(201).json({
      success: true,
      data: {
        ...responsePost,
        hasFeaturedImage: !!post.featuredImage
      },
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
// @desc    Update a post with image
// @access  Private
router.put('/:id', [auth, upload.single('featuredImage')], async (req, res) => {
  try {
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

    const { title, content, excerpt, category, tags, isPublished, removeFeaturedImage } = req.body;

    const updateData = {
      title,
      content,
      excerpt,
      category,
      tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
      isPublished: isPublished === 'true' || isPublished === true,
    };

    // Handle featured image
    if (req.file) {
      // Store new image in database (Base64)
      updateData.featuredImage = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
        filename: req.file.originalname
      };
    } else if (removeFeaturedImage === 'true') {
      // Remove featured image if requested
      updateData.featuredImage = null;
    }

    post = await Post.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .select('-featuredImage.data') // Exclude image data from response
      .populate('author', 'username')
      .populate('category', 'name');

    // Add hasFeaturedImage flag to response
    const responsePost = {
      ...post.toObject(),
      hasFeaturedImage: !!post.featuredImage
    };

    res.json({
      success: true,
      data: responsePost,
    });
  } catch (error) {
    console.error('Error updating post:', error);
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
      .select('-featuredImage.data') // Exclude image data
      .populate('author', 'username')
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .limit(20);

    // Add hasFeaturedImage flag to each post
    const postsWithImageFlag = posts.map(post => ({
      ...post.toObject(),
      hasFeaturedImage: !!post.featuredImage
    }));

    res.json({
      success: true,
      data: postsWithImageFlag,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;