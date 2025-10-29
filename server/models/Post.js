// server/models/Post.js - Updated for Base64 image storage
const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    content: {
      type: String,
      required: [true, 'Please provide content'],
    },
    featuredImage: {
      data: Buffer, // Store image data as Buffer
      contentType: String, // Store MIME type
      filename: String, // Original filename
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    excerpt: {
      type: String,
      maxlength: [200, 'Excerpt cannot be more than 200 characters'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    tags: [String],
    isPublished: {
      type: Boolean,
      default: false,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        content: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

// Generate slug function
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
};

// Create slug from title before saving
PostSchema.pre('save', function (next) {
  if (!this.slug || this.isModified('title')) {
    let baseSlug = generateSlug(this.title);
    this.slug = baseSlug;
  }
  next();
});

// Static method to generate unique slug
PostSchema.statics.generateUniqueSlug = async function (title) {
  let slug = generateSlug(title);
  let counter = 1;
  let originalSlug = slug;

  while (await this.findOne({ slug })) {
    slug = `${originalSlug}-${counter}`;
    counter++;
  }

  return slug;
};

// Virtual for post URL
PostSchema.virtual('url').get(function () {
  return `/posts/${this.slug}`;
});

// Virtual for featured image URL (Base64 data URL)
PostSchema.virtual('featuredImageUrl').get(function () {
  if (!this.featuredImage || !this.featuredImage.data) {
    return null;
  }
  return `data:${this.featuredImage.contentType};base64,${this.featuredImage.data.toString('base64')}`;
});

// Method to add a comment
PostSchema.methods.addComment = function (userId, content) {
  this.comments.push({ user: userId, content });
  return this.save();
};

// Method to increment view count
PostSchema.methods.incrementViewCount = async function () {
  this.viewCount += 1;
  return await this.save();
};

module.exports = mongoose.model('Post', PostSchema);