---
sidebar_position: 2
---

# Robot Framework Basics

## Keywords and Variables

Robot Framework uses a keyword-driven approach to testing. Keywords are the building blocks of test cases.

### Built-in Keywords

Robot Framework comes with many built-in keywords:

- `Should Be Equal` - Compares two values
- `Log` - Prints a message to the log
- `Sleep` - Pauses execution for a specified time
- `Run Keyword If` - Conditionally runs a keyword

### Library Keywords

Additional keywords come from libraries:

- **SeleniumLibrary** - Web testing
- **RequestsLibrary** - API testing
- **DatabaseLibrary** - Database testing

### Variables

Variables store and pass data in Robot Framework:

- **Scalar variables**: ``
- **List variables**: `@{variable}`
- **Dictionary variables**: `&{variable}`

Example:

```robot
*** Variables ***
    testuser
@{USERS}       user1    user2    user3
&{USER_INFO}   name=John    email=john@example.com

*** Test Cases ***
Example Test
    Log    
    Log Many    @{USERS}
    Log    User name: [name]
```

## Test Setup and Teardown

Setup and teardown keywords define actions to be executed before and after tests:

```robot
*** Settings ***
Test Setup        Open Application
Test Teardown     Close Application

*** Test Cases ***
Login Test
    # Setup runs before this test
    Enter Username    testuser
    Enter Password    password
    Click Login Button
    Verify Login Success
    # Teardown runs after this test
```

You can also define setup and teardown actions for individual test cases:

```robot
*** Test Cases ***
Special Test
    [Setup]    Special Setup
    Perform Test Actions
    [Teardown]    Special Teardown
```
