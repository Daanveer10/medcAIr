// Vercel serverless function wrapper for Express app
const serverless = require('serverless-http');
const app = require('../server');

// Export the handler for Vercel with optimized settings
module.exports = serverless(app, {
  binary: ['image/*', 'application/pdf'],
  request(request, event, context) {
    // Set timeout context
    context.callbackWaitsForEmptyEventLoop = false;
  }
});
