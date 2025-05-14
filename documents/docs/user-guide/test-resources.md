---
sidebar_position: 4
---

# Test Resource Management

Test resources are reusable components like keywords, variables, or settings that can be shared across test suites.

## What Are Test Resources?

In Robot Framework, resources typically include:

- Custom keywords
- Variables
- Library imports
- Common settings

By creating resources, you can avoid duplicating code across test suites.

## Creating a Test Resource

To create a new resource:

1. Navigate to your project
2. Click the "Create Resource" button
3. Enter a name and description for the resource
4. Write your resource content in the editor
5. Click "Save" to create the resource

## Resource Content Example

Here's an example of a simple resource file:

```robot
*** Settings ***
Library    SeleniumLibrary

*** Variables ***
    https://example.com
     chrome

*** Keywords ***
Open Application
    Open Browser        
    Maximize Browser Window

Login To Application
    [Arguments]        
    Input Text    id=username    
    Input Text    id=password    
    Click Button    id=login-button
```

## Using Resources in Test Suites

To use a resource in a test suite:

1. Add a Resource statement in the Settings section
2. Reference the resource file path

Example:

```robot
*** Settings ***
Resource    ./resources/common.robot

*** Test Cases ***
Login Test
    Open Application
    Login To Application    testuser    password123
```

## Managing Resources

To edit or delete a resource:

1. Navigate to the "Test Resources" section of your project
2. Click the "Edit" icon next to the resource to modify it
3. Click the "Delete" icon to remove a resource

:::warning
When deleting a resource, check if it's used by any test suites first!
:::

## Best Practices

- Keep resources focused on a specific area of functionality
- Use descriptive names for resources and keywords
- Document your resources with comments
- Organize resources in a logical structure
