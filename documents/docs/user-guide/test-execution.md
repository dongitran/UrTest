---
sidebar_position: 5
---

# Test Execution

UrTest allows you to run your test suites and view the results directly in the platform.

## Running Individual Tests

To run a single test suite:

1. Navigate to your project
2. Find the test suite you want to run
3. Click the "Run" (play) button next to the test suite
4. The test will execute and show progress

## Running All Tests in a Project

To execute all test suites in a project:

1. Navigate to your project
2. Click the "Run All Tests" button at the top of the test suite list
3. All tests will be executed in sequence

## Viewing Test Results

After a test run completes:

1. Click the "View Results" button
2. The detailed test report will open in a new tab
3. Review passed and failed tests, execution times, and logs

## Test Report Components

The test report includes:

- Summary of test results (pass/fail statistics)
- Execution time for each test case
- Detailed logs for each step
- Screenshots for failed UI tests (if configured)
- Error messages for failed tests

## Re-running Failed Tests

To re-run a failed test:

1. Navigate to the test suite
2. Click the "Run" button to execute it again
3. Review the new results to see if the issue is resolved

## Troubleshooting Failed Tests

When a test fails:

1. Check the error message in the test report
2. Review the test steps that were executed before the failure
3. Examine any screenshots or logs that were captured
4. Update your test case to fix the issue
5. Run the test again to verify the fix
