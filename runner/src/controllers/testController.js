const testService = require('../services/testService');

exports.runTest = async (req, res) => {
  try {
    const { requestId, project, content } = req.body;

    if (!requestId || !project || !content) {
      return res.status(400).json({
        error: true,
        message: 'Invalid data'
      });
    }

    const result = await testService.runTest(requestId, project, content);

    res.status(200).json({
      success: true,
      requestId,
      project,
      reportUrl: result.reportUrl
    });
  } catch (error) {
    console.error('Error running test:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Failed to run test'
    });
  }
};
