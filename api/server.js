// Vercel serverless function wrapper for Express app
const serverless = require('serverless-http');
const app = require('../server');

// Export the handler for Vercel
module.exports.handler = serverless(app);

