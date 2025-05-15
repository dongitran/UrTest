---
sidebar_position: 3
---

# Test Suite Management

Test suites are collections of test cases written in Robot Framework syntax.

## Creating a Test Suite

To create a new test suite:

1. Navigate to your project
2. Click the "Create Test Suite" button
3. Enter a name for the test suite
4. Write your test cases in the editor
5. Click "Save" to create the test suite

## Test Suite Editor

The test suite editor provides:

- Syntax highlighting for Robot Framework
- Auto-completion for keywords and variables
- Error detection and warnings
- Auto-save functionality

## Organizing Test Cases

Within a test suite, organize your test cases logically:

- Group related test cases together
- Use descriptive names for your test cases
- Add documentation comments to explain the purpose of test cases
- Use setup and teardown methods for common actions

## Using Tags

Tags help you categorize and filter your test suites:

1. Add tags in the "Tags" field above the editor
2. Use consistent naming conventions for tags
3. Apply multiple tags as needed (e.g., "smoke", "regression", "login")

## Managing Test Suite Versions

UrTest automatically saves your changes:

- A draft is created when you modify a test suite
- You can revert to the original version if needed
- Each test run creates a snapshot of the test suite version

## Running Test Suites

To run a test suite:

1. Click the "Run Test" button next to the test suite
2. UrTest will execute the test and show progress
3. View detailed results after execution completes
