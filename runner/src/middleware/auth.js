const config = require('../config');

module.exports = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== config.API_KEY) {
    return res.status(401).json({
      error: true,
      message: 'Unauthorized: Invalid API key'
    });
  }
  
  next();
};
