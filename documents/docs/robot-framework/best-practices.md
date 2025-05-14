---
sidebar_position: 4
---

# Best Practices

Follow these best practices for effective Robot Framework testing in UrTest.

## Test Case Organization

Organize your test cases for better maintainability:

- **One feature per test suite**: Keep test suites focused on a single feature
- **Logical grouping**: Group related test cases together
- **Consistent naming**: Use clear, descriptive names for test cases
- **Test case independence**: Design test cases to run independently

## Naming Conventions

Consistent naming helps with readability:

- **Test Suites**: Use feature names (e.g., `login.robot`, `checkout.robot`)
- **Test Cases**: Use behavior descriptions (e.g., `Valid User Can Login`)
- **Keywords**: Use verb phrases (e.g., `Enter Username`, `Verify Order Total`)
- **Variables**: Use descriptive names in uppercase (e.g., ``)

## Error Handling Strategies

Robust test cases handle errors gracefully:

- **Timeouts**: Set appropriate timeouts for web elements and operations
- **Error handling keywords**: Use `Run Keyword And Ignore Error` for non-critical steps
- **Proper teardown**: Ensure resources are cleaned up even if tests fail
- **Screenshots on failure**: Capture screenshots when tests fail

Example:

```robot
*** Test Cases ***
Handle Potential Error
        =    Run Keyword And Ignore Error    Click Element    id=might-not-exist
    Run Keyword If    '' == 'FAIL'    Log    Element was not found, continuing test...
    
    # Rest of test continues...
```

## Keyword Development

Create maintainable and reusable keywords:

- **Single responsibility**: Each keyword should do one thing well
- **Appropriate abstraction**: Create high-level keywords that call more detailed ones
- **Proper documentation**: Document the purpose and arguments of each keyword
- **Parameterization**: Use arguments to make keywords flexible

Example:

```robot
*** Keywords ***
Login As
    [Documentation]    Logs in with the specified user type
    [Arguments]    
    =    Get Username    
    =    Get Password    
    Input Text    id=username    
    Input Text    id=password    
    Click Button    id=login-button
    Wait Until Page Contains    Welcome
```

## Data-Driven Testing

Use Robot Framework's data-driven capabilities:

- **Test templates**: Convert test cases into data-driven tests
- **Data files**: Store test data in external files
- **Variable files**: Use Python files to generate complex test data

Example with test template:

```robot
*** Test Cases ***
Login with valid and invalid credentials
    [Template]    Login with credentials
    # USERNAME      PASSWORD        EXPECTED
    valid           valid           Welcome Page
    invalid         valid           Error Message
    valid           invalid         Error Message
            valid           Username Required
    valid                   Password Required

*** Keywords ***
Login with credentials
    [Arguments]            
    Enter Username    
    Enter Password    
    Click Login Button
    Verify Result    
```
