const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDb } = require('./models');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/social', require('./routes/social'));
app.use('/api/projects', require('./routes/projects'));

// Basic health check route
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Welcome to the CodeAlpha internship shared API backend!',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      social: '/api/social',
      projects: '/api/projects'
    }
  });
});

// Start DB connection then start Server
async function startServer() {
  await connectDb();
  app.listen(PORT, () => {
    console.log(`🚀 Shared Backend server is running on port ${PORT}`);
    console.log(`🔗 API Health check: http://localhost:${PORT}/`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
