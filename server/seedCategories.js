// server/seedCategories.js - Fixed script to create initial categories
const mongoose = require('mongoose');
const Category = require('./models/Category');
const dotenv = require('dotenv');

dotenv.config();

const categories = [
  { name: 'Technology', description: 'Posts about technology and programming' },
  { name: 'Lifestyle', description: 'Posts about lifestyle and personal development' },
  { name: 'Travel', description: 'Travel experiences and tips' },
  { name: 'Food', description: 'Recipes and food experiences' },
  { name: 'Health', description: 'Health and wellness topics' },
  { name: 'Business', description: 'Business and entrepreneurship' },
  { name: 'Education', description: 'Educational content and tutorials' },
  { name: 'Entertainment', description: 'Entertainment and media' }
];

// Function to generate slug from name
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
};

const seedCategories = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing categories
    await Category.deleteMany({});
    console.log('Cleared existing categories');

    // Add slugs to categories
    const categoriesWithSlugs = categories.map(category => ({
      ...category,
      slug: generateSlug(category.name)
    }));

    // Create new categories one by one to trigger pre-save hooks
    const createdCategories = [];
    for (const categoryData of categoriesWithSlugs) {
      const category = new Category(categoryData);
      await category.save();
      createdCategories.push(category);
    }

    console.log(`Created ${createdCategories.length} categories:`);
    
    createdCategories.forEach(cat => {
      console.log(`- ${cat.name} (${cat.slug})`);
    });

    console.log('Categories seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
};

seedCategories();