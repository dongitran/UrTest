const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey || apiKey !== process.env.JIRA_BRIDGE_API_KEY) {
    return res.status(401).json({
      status: "error",
      message: "Unauthorized: Invalid API key",
    });
  }

  next();
};

module.exports = apiKeyAuth;
