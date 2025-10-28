# MERN Stack Blog Application

A full-stack blog application built with the MERN stack (MongoDB, Express.js, React.js, Node.js) featuring user authentication, post management, categories, and comments.

## 🚀 Features

- **User Authentication**: Register, login, and logout functionality
- **Post Management**: Create, read, update, and delete blog posts
- **Categories**: Organize posts by categories
- **Comments**: Add comments to posts
- **Responsive Design**: Modern UI that works on all devices
- **Private Content**: Posts are only visible to authenticated users

## 🛠️ Tech Stack

### Frontend
- **React.js** - UI framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Context API** - State management

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **express-validator** - Input validation

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd mern-stack-integration-Innoh-25
```

### 2. Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mern-blog
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_secure
```

### 3. Frontend Setup

```bash
# Navigate to client directory
cd ../client

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

Edit the `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Database Setup

Make sure MongoDB is running on your system:

**Local MongoDB:**

```bash
# Start MongoDB service (Ubuntu/Linux)
sudo systemctl start mongod

# Or (macOS with Homebrew)
brew services start mongodb/brew/mongodb-community

# Or (Windows)
net start MongoDB
```

Initialize the database with sample data:

```bash
# From the server directory
cd server

# Create initial categories
npm run seed

# (Optional) Create a test published post
npm run create-published-post
```

## 🏃‍♂️ Running the Application

### Start the Backend Server

```bash
# From the server directory
cd server
npm run dev
```

The server will start on http://localhost:5000

### Start the Frontend Development Server

```bash
# From the client directory (in a new terminal)
cd client
npm run dev
```

The client will start on http://localhost:3000

### Access the Application

Open your browser and navigate to:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 📁 Project Structure

```
mern-blog/
├── client/                 # React frontend
│   ├── public/            # Static files
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   │   ├── Navbar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/       # React context
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/         # Custom hooks
│   │   │   └── useApi.js
│   │   ├── pages/         # Page components
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── CreatePost.jsx
│   │   │   ├── EditPost.jsx
│   │   │   └── Post.jsx
│   │   ├── services/      # API services
│   │   │   └── api.js
│   │   └── App.jsx        # Main app component
│   └── package.json
├── server/                # Express backend
│   ├── config/            # Configuration files
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Custom middleware
│   │   └── auth.js
│   ├── models/            # Mongoose models
│   │   ├── Post.js
│   │   ├── User.js
│   │   └── Category.js
│   ├── routes/            # API routes
│   │   ├── posts.js
│   │   ├── auth.js
│   │   └── categories.js
│   ├── server.js          # Main server file
│   └── package.json
└── README.md
```

## 🔑 API Documentation

### Authentication Endpoints

#### POST /api/auth/register
Register a new user.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

#### POST /api/auth/login
Login user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** Same as register endpoint.

#### GET /api/auth/me
Get current user (requires authentication).

### Posts Endpoints

#### GET /api/posts
Get all published posts (requires authentication).

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Posts per page (default: 10)
- `category` - Filter by category ID

#### GET /api/posts/:id
Get a single post by ID or slug (public).

#### POST /api/posts
Create a new post (requires authentication).

**Request Body:**
```json
{
  "title": "Post Title",
  "content": "Post content...",
  "excerpt": "Brief excerpt...",
  "category": "category_id",
  "tags": ["tag1", "tag2"],
  "isPublished": true
}
```

#### PUT /api/posts/:id
Update a post (requires authentication, must be author or admin).

#### DELETE /api/posts/:id
Delete a post (requires authentication, must be author or admin).

#### POST /api/posts/:id/comments
Add a comment to a post (requires authentication).

**Request Body:**
```json
{
  "content": "Comment text here"
}
```

#### GET /api/posts/search?q=query
Search posts by title, content, or tags.

### Categories Endpoints

#### GET /api/categories
Get all categories (public).

#### POST /api/categories
Create a new category (requires admin role).

**Request Body:**
```json
{
  "name": "Technology",
  "description": "Posts about technology"
}
```

## 🗄️ Database Models

### User Model
```javascript
{
  username: String (required, unique),
  email: String (required, unique),
  password: String (required),
  role: String (enum: ['user', 'admin']),
  avatar: String
}
```

### Post Model
```javascript
{
  title: String (required),
  content: String (required),
  slug: String (required, unique),
  excerpt: String,
  featuredImage: String,
  author: ObjectId (ref: 'User'),
  category: ObjectId (ref: 'Category'),
  tags: [String],
  isPublished: Boolean,
  viewCount: Number,
  comments: [{
    user: ObjectId (ref: 'User'),
    content: String,
    createdAt: Date
  }]
}
```

### Category Model
```javascript
{
  name: String (required, unique),
  description: String,
  slug: String (required, unique)
}
```

## 🔧 Available Scripts

### Server Scripts
```bash
npm run dev          # Start development server with nodemon
npm start           # Start production server
npm run seed        # Seed database with sample categories
npm run create-published-post  # Create a test published post
npm run check-all-posts        # Check all posts in database
npm run publish-posts          # Publish all draft posts
```

### Client Scripts
```bash
npm run dev          # Start Vite development server
npm run build        # Build for production
npm run preview      # Preview production build
```

## 🛡️ Authentication Flow

1. **Registration/Login**: User registers or logs in, receives JWT token
2. **Token Storage**: Token stored in localStorage
3. **API Calls**: Token included in Authorization header for protected routes
4. **Route Protection**: React Router protects routes requiring authentication
5. **Auto-logout**: Token expiration and invalid token handling

## 🎨 Styling

The application uses custom CSS with:

- Modern gradient backgrounds
- Glass morphism effects
- Responsive design
- Smooth animations and transitions
- Professional color scheme
- Emoji icons for better UX

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Error**
- Ensure MongoDB is running
- Check MONGODB_URI in .env file

**Port Already in Use**
- Change PORT in server/.env
- Kill process using the port: `npx kill-port 5000`

**CORS Errors**
- Ensure backend is running on port 5000
- Check VITE_API_URL in client/.env

**Authentication Issues**
- Clear localStorage and login again
- Check JWT_SECRET in server/.env

### Debugging Scripts
```bash
# Check database connection and posts
cd server && npm run check-all-posts

# Check server logs for API errors
# Check browser console for frontend errors
# Check Network tab for failed API calls
```

## 📝 Environment Variables

### Server (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mern-blog
JWT_SECRET=your_jwt_secret_here
```

### Client (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

