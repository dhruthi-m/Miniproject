require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const assessmentRoutes = require('./routes/assessments');
const moodRoutes = require('./routes/moods');
const journalRoutes = require('./routes/journals');
const chatRoutes = require('./routes/chat');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    project: 'MindWave: Psychological Response Analyzer',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/screenings', assessmentRoutes); // Direct alias for frontend screening workflows
app.use('/api/recommendations', assessmentRoutes); // Alias for recommendation feedback
app.use('/api/moods', moodRoutes);
app.use('/api/journals', journalRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 Route handler for undefined API routes
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API route not found.' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    message: 'An unexpected internal server error occurred.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` MindWave Backend Server running on port ${PORT}`);
    console.log(` Health Check: http://localhost:${PORT}/api/health`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
