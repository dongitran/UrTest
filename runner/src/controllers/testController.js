const testService = require("../services/testService");

exports.runTest = async (req, res) => {
  try {
    const { requestId, project, content, testResultTitle } = req.body;

    if (!requestId || !project || !content) {
      return res.status(400).json({
        error: true,
        message: "Invalid data",
      });
    }

    const result = await testService.runTest(
      requestId,
      project,
      content,
      testResultTitle
    );

    res.status(200).json({
      success: true,
      requestId,
      project,
      reportUrl: result.reportUrl,
      results: result.results,
    });
  } catch (error) {
    console.error("Error running test:", error);
    res.status(500).json({
      error: true,
      message: error.message || "Failed to run test",
    });
  }
};

exports.runProjectTests = async (req, res) => {
  try {
    const { requestId, project } = req.body;

    if (!requestId || !project) {
      return res.status(400).json({
        error: true,
        message: "RequestId and project are required",
      });
    }

    const result = await testService.runProjectTests(requestId, project);

    res.status(200).json({
      success: true,
      requestId,
      project,
      reportUrl: result.reportUrl,
      results: result.results,
    });
  } catch (error) {
    console.error("Error running project tests:", error);
    res.status(500).json({
      error: true,
      message: error.message || "Failed to run project tests",
    });
  }
};
