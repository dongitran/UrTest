---
sidebar_position: 1
---

# Robot Framework Integration

UrTest integrates deeply with Robot Framework to provide a seamless test automation experience.

## What is Robot Framework?

Robot Framework is a generic open-source automation framework for acceptance testing, acceptance test-driven development (ATDD), and robotic process automation (RPA). It has easy-to-use tabular test data syntax and uses keyword-driven testing approach.

## Robot Framework in UrTest

UrTest provides:

- A powerful editor for Robot Framework test scripts
- Test execution capabilities
- Results reporting
- Resource management
- Version control

## Test Case Structure

Robot Framework test cases follow this structure:

```robot
*** Settings ***
Documentation     Example test suite
Library           SeleniumLibrary
Resource          resources/common.robot

*** Variables ***
      https://example.com/login
        chrome

*** Test Cases ***
Valid Login
    Open Browser        
    Input Text      id=username    validuser
    Input Text      id=password    validpass
    Click Button    id=login-button
    Page Should Contain    Welcome, valid user!
    [Teardown]    Close Browser
```

In UrTest, you can create and edit these test files using the integrated editor, which provides syntax highlighting and auto-completion.
