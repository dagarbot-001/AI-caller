// Load environment variables from .env file.
require('dotenv').config();

const express = require('express');
const path = require('path');
const callRoutes = require('./routes/callRoutes');

const app = express();
const port = Number(process.env.PORT) || 3000;

// Parse JSON payloads where needed.
app.use(express.json({ limit: '2mb' }));

// Health check endpoint for monitoring.
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'ai-voice-sales-agent' });
});

// Mount voice processing routes.
app.use('/api/call', callRoutes);

// Serve generated output files so Asterisk can fetch them over HTTP.
app.use('/audio', express.static(path.join(__dirname, 'output')));

// Centralized error handler.
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(err.statusCode || 500).json({
    error: 'Internal server error',
    details: err.message || 'Unexpected failure'
  });
});

app.listen(port, () => {
  console.log(`AI Voice Sales Agent listening on port ${port}`);
});
