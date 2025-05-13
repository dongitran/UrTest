const { cloneRepository } = require("../services/gitService");

exports.refreshRepository = async (req, res) => {
  try {
    const repoPath = await cloneRepository();

    res.status(200).json({
      success: true,
      message: "Repository refreshed successfully",
      repoPath
    });
  } catch (error) {
    console.error("Error refreshing repository:", error);
    res.status(500).json({
      error: true,
      message: error.message || "Failed to refresh repository"
    });
  }
};