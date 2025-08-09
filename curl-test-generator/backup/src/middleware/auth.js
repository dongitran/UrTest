export function authMiddleware(req, res, next) {
  if (req.path === '/health') {
    return next();
  }

  const accessToken = req.headers.accesstoken;
  const expectedToken = process.env.ACCESS_TOKEN;

  if (!accessToken) {
    return res.status(401).json({
      success: false,
      message: 'Access token is required'
    });
  }

  if (accessToken !== expectedToken) {
    return res.status(401).json({
      success: false,
      message: 'Invalid access token'
    });
  }

  next();
}
