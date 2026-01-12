// Vercel serverless function wrapper for Express app
const serverless = require('serverless-http');
const app = require('../server');

// Export the handler for Vercel with optimized settings
module.exports = serverless(app, {
  binary: ['image/*', 'application/pdf'],
  request(request, event, context) {
    // Optimize for serverless - don't wait for empty event loop
    context.callbackWaitsForEmptyEventLoop = false;
  },
  response(response) {
    // Ensure response is sent quickly
    response.headers = response.headers || {};
    response.headers['X-Content-Type-Options'] = 'nosniff';
  }
});
