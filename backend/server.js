import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/stocklink';

// CORS configuration - supports Vercel, Netlify, Render, and local dev
app.use(
  cors({
    origin: (origin, callback) => {
      // Permissive CORS for academic/capstone demo so deployed frontend is never blocked
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'StockLink B2B Commerce Backend API',
    mongoStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected (in-memory fallback active)',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Optional: Serve Frontend statically if deployed as a single full-stack service
const distPath = path.resolve(__dirname, '../frontend/dist');
if (fs.existsSync(distPath)) {
  console.log(`Serving static frontend build from: ${distPath}`);
  app.use(express.static(distPath));

  // Handle SPA client-side routing fallback for non-API requests
  app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// 404 Handler for API
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Wildcard 404 when frontend is not bundled locally
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Connect to MongoDB with graceful timeout fallback
async function connectDB() {
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`MongoDB Connected successfully to: ${MONGODB_URI}`);
  } catch (err) {
    console.warn(`MongoDB connection notice: ${err.message}`);
    console.warn('Running with resilient in-memory session store. MongoDB Atlas/Local connection can be configured via MONGODB_URI.');
  }
}

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` StockLink Backend Server running on port ${PORT}`);
    console.log(` Health check: http://localhost:${PORT}/api/health`);
    console.log(` Auth endpoints: http://localhost:${PORT}/api/auth/login`);
    console.log(` Dashboard endpoints: http://localhost:${PORT}/api/dashboard/*`);
    console.log(`====================================================`);
  });
});
