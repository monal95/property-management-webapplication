const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const propertyRoutes = require('./routes/properties');
const tenantRoutes = require('./routes/tenants');
const complaintRoutes = require('./routes/complaints');
const paymentRoutes = require('./routes/payments');
const razorpayRoutes = require('./routes/razorpay');
const maintenanceRoutes = require('./routes/maintenance');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  "http://localhost:5173",             // for local dev
  "https://rentify-rho.vercel.app",    // your Vercel domain
  "https://rentifyy-rho.vercel.app",   // alternative domain
  "https://lprt-web.vercel.app",       // new deployment domain
  "https://lprt-property.vercel.app",  // alternative domain
  process.env.FRONTEND_URL,             // dynamic frontend URL from env
].filter(Boolean);

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// Razorpay webhook must receive raw body to verify signature
app.use('/api/razorpay/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/razorpay', razorpayRoutes);
app.use('/api/maintenance', maintenanceRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'LPRT Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lprt_db')
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = app;
