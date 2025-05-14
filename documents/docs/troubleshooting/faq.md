---
sidebar_position: 3
---

# Frequently Asked Questions

## General Questions

### What is UrTest?

UrTest is a test automation management platform that integrates with Robot Framework to provide a comprehensive solution for creating, managing, and executing automated tests.

### What browsers are supported?

UrTest works best with modern browsers like:
- Google Chrome (recommended)
- Mozilla Firefox
- Microsoft Edge

### Can multiple people work on the same project?

Yes, UrTest supports team collaboration. Multiple users can be assigned to a project and work on different test suites simultaneously.

## Test Management

### How do I organize my test cases?

We recommend organizing test cases by:
- Feature area
- Test level (unit, integration, system, etc.)
- Test priority (critical, high, medium, low)

Use tags to add additional categorization.

### What's the difference between a test suite and a test resource?

- A **test suite** contains actual test cases that will be executed
- A **test resource** contains reusable keywords, variables, or settings that can be used across multiple test suites

### Can I import existing Robot Framework tests?

Yes, you can copy and paste your existing Robot Framework test scripts into UrTest test suites.

## Test Execution

### How do I view test results?

After running a test, click the "View Results" button to see the detailed test report.

### Can I run tests in parallel?

Currently, tests are executed sequentially. Parallel execution is on our roadmap for future releases.

### How long are test results stored?

Test results are stored indefinitely unless manually deleted or the project is removed.

## Robot Framework

### What version of Robot Framework does UrTest use?

UrTest uses Robot Framework version 6.0 or higher.

### What Robot Framework libraries are supported?

UrTest supports all standard Robot Framework libraries. If you need a custom library, contact your administrator.

### Can I use custom Python libraries with UrTest?

Yes, you can use custom Python libraries. The libraries need to be installed on the test execution environment.

## Collaboration

### How do I share test cases with my team?

Simply add team members to your project, and they'll have access to all test suites and resources within that project.

### Can I export test cases to share outside UrTest?

Currently, there's no direct export feature, but you can copy the test script content and save it to a file.

### How do I get help with writing test cases?

Use the AI Assistant feature by clicking on the "Assistant" tab when editing a test suite.
