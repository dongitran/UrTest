---
sidebar_position: 2
---

# Creating Your First Test Suite

This guide will walk you through creating your first test suite in UrTest.

## What is a Test Suite?

A test suite is a collection of test cases focused on testing a specific feature or component. In UrTest, test suites are created using Robot Framework syntax.

## Creating a New Test Suite

To create a new test suite:

1. Navigate to your project
2. Click the "Create Test Suite" button
3. Enter a name for your test suite
4. Start writing your test cases in the editor

## Writing Your First Test Case

Here's a simple example of a test case in Robot Framework syntax:

```robot
*** Settings ***
Documentation     A simple example test suite
Resource          common-resources.robot

*** Test Cases ***
My First Test Case
    Log    Hello, UrTest!
    Should Be Equal        
```

## Adding Tags

Tags help you organize and filter your test suites:

1. Look for the "Tags" field above the editor
2. Enter relevant tags (e.g., "smoke", "regression", "login")
3. Press Enter after each tag

## Saving Your Test Suite

When you're done writing your test suite:

1. Click the "Save" button in the top right corner
2. Your test suite is now saved to the project

## Running Your Test Suite

To run your newly created test suite:

1. Click the "Run Test" button next to your test suite
2. UrTest will execute the test and show you the results
3. Click "View Results" to see the detailed test report

Congratulations! You've created and run your first test suite in UrTest.
