---
sidebar_position: 3
---

# Working with Resources

Resource files in Robot Framework help you organize and reuse keywords and variables across multiple test suites.

## Creating Resource Files

In UrTest, you can create resource files:

1. Navigate to your project
2. Click the "Create Resource" button
3. Enter a name and description
4. Add your resource content
5. Click "Save"

A typical resource file looks like this:

```robot
*** Settings ***
Documentation    Common keywords for the application
Library    SeleniumLibrary

*** Variables ***
    https://example.com
     chrome

*** Keywords ***
Open Application
    Open Browser        
    Maximize Browser Window

Login
    [Arguments]        
    Input Text    id=username    
    Input Text    id=password    
    Click Button    id=login-button
    Wait Until Page Contains    Welcome
```

## Using Resources in Test Suites

To use a resource in a test suite:

```robot
*** Settings ***
Resource    ../resources/common.robot

*** Test Cases ***
Login Test
    Open Application
    Login    validuser    validpass
    # More test steps...
```

## Resource Organization

Best practices for organizing resources:

1. **Common Resources**: Create a common resource file for frequently used keywords
2. **Feature-specific Resources**: Create resources for specific features or areas
3. **Page Objects**: For web testing, create resources that represent pages or components

Example project structure:



## Resource Dependencies

Resources can import other resources:

```robot
*** Settings ***
Resource    ./common.robot
Resource    ./login.robot

*** Keywords ***
Complete Workflow
    Open Application
    Login        
    Navigate To Dashboard
    Verify Dashboard Elements
```

When working with resources in UrTest, the platform ensures that dependencies are correctly maintained and updated.
