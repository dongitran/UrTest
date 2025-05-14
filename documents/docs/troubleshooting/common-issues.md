---
sidebar_position: 2
---

# Common Issues

Solutions to frequently encountered problems in UrTest.

## Login Problems

### Issue: Unable to Log In

If you cannot log in to UrTest:

1. Verify your username and password are correct
2. Check that your account has not been locked or disabled
3. Clear your browser cache and cookies
4. Try using a different browser

### Issue: Session Expires Too Quickly

If your session keeps expiring:

1. Check if you're inactive for long periods
2. Ensure your browser accepts cookies
3. Contact your administrator to check session timeout settings

## Test Execution Problems

### Issue: Tests Fail to Start

If your tests don't start running:

1. Check if you have any syntax errors in your test script
2. Ensure the test resources are correctly referenced
3. Verify that the test execution service is running

### Issue: Tests Fail Unexpectedly

If tests are failing unexpectedly:

1. Check the error message in the test report
2. Verify that the application under test is accessible
3. Check for timing issues (add appropriate waits)
4. Review any recent changes to the test or application

## Editor Problems

### Issue: Syntax Highlighting Not Working

If syntax highlighting isn't working:

1. Refresh the page
2. Make sure the file is recognized as a Robot Framework file
3. Check if the browser console shows any errors

### Issue: Auto-Save Not Working

If auto-save isn't working:

1. Check your internet connection
2. Verify you have write permissions for the project
3. Look for any error messages when saving

## Resource Management Issues

### Issue: Cannot Create Resources

If you cannot create resources:

1. Verify you have appropriate permissions in the project
2. Check if the resource name conflicts with an existing resource
3. Ensure your content is valid Robot Framework syntax

### Issue: Resources Not Being Recognized

If resources aren't being recognized in test suites:

1. Check the resource path in your import statement
2. Verify the resource file exists and has been saved
3. Check for syntax errors in the resource file
