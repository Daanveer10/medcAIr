// Vercel serverless function wrapper for Express app
const serverless = require('serverless-http');

let app;
let handler;

try {
  console.log('Initializing Express app...');
  app = require('../server');
  console.log('Express app loaded successfully');
  
  handler = serverless(app, {
    binary: ['image/*', 'application/pdf']
  });
  console.log('Serverless handler created');
} catch (error) {
  console.error('Error initializing server:', error);
  // Create a minimal error handler
  handler = async (req, res) => {
    console.error('Server initialization failed:', error.message);
    res.status(500).json({ 
      error: 'Server initialization failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  };
}

// Export the handler for Vercel
module.exports = handler;
