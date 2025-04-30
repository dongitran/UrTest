"use client";

import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "next-themes";

import dynamic from "next/dynamic";
const MonacoEditorLib = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-full" />,
});

export default function MonacoEditor({
  language = "javascript",
  value = "",
  onChange,
  readOnly = false,
}) {
  const editorRef = useRef(null);
  const { theme } = useTheme();
  const [editorTheme, setEditorTheme] = useState("vs-dark");
  const [monaco, setMonaco] = useState(null);

  useEffect(() => {
    setEditorTheme(theme === "dark" ? "vs-dark" : "vs");
  }, [theme]);

  useEffect(() => {
    if (monaco && language === "robotframework") {
      registerRobotFrameworkLanguage(monaco);
    }
  }, [monaco, language]);

  function registerRobotFrameworkLanguage(monaco) {
    if (monaco.languages.getLanguages().some(lang => lang.id === "robotframework")) {
      return;
    }

    monaco.languages.register({ id: 'robotframework' });

    monaco.languages.setMonarchTokensProvider('robotframework', {
      defaultToken: '',
      tokenizer: {
        root: [
          [/^\*{3}\s*(Settings|Variables|Test Cases|Keywords|Tasks)\s*\*{3}/, 'keyword'],
          [/#.*$/, 'comment'],
          [/\${[\w\s]+}/, 'variable'],
          [/@{[\w\s]+}/, 'variable'],
          [/&{[\w\s]+}/, 'variable'],
          [/%{[\w\s]+}/, 'variable'],
          [/^(Given|When|Then|And|But)\s+/, 'keyword'],
          [/\[.*?\]/, 'tag'],
          [/^(Library|Resource|Variables|Documentation)/, 'keyword'],
        ]
      }
    });

    const robotFrameworkKeywords = [
      {
        label: '*** Settings ***',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: '*** Settings ***\n',
        documentation: 'Settings section'
      },
      {
        label: '*** Variables ***',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: '*** Variables ***\n',
        documentation: 'Variables section'
      },
      {
        label: '*** Test Cases ***',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: '*** Test Cases ***\n',
        documentation: 'Test Cases section'
      },
      {
        label: '*** Keywords ***',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: '*** Keywords ***\n',
        documentation: 'Keywords section'
      },
      {
        label: '*** Tasks ***',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: '*** Tasks ***\n',
        documentation: 'Tasks section'
      },
      {
        label: 'Library',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: 'Library    ${1:LibraryName}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Import a library'
      },
      {
        label: 'Resource',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: 'Resource    ${1:resource_file.robot}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Import a resource file'
      },
      {
        label: 'Variables',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: 'Variables    ${1:variables_file.py}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Import variables from a file'
      },
      {
        label: 'Documentation',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: 'Documentation    ${1:Documentation text}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Document a test suite or keyword'
      },
      {
        label: 'Suite Setup',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: 'Suite Setup    ${1:Keyword Name}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Setup executed before any test case'
      },
      {
        label: 'Suite Teardown',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: 'Suite Teardown    ${1:Keyword Name}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Teardown executed after all test cases'
      },
      {
        label: 'Test Setup',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: 'Test Setup    ${1:Keyword Name}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Setup executed before each test case'
      },
      {
        label: 'Test Teardown',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: 'Test Teardown    ${1:Keyword Name}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Teardown executed after each test case'
      },
      {
        label: 'Test Template',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: 'Test Template    ${1:Keyword Name}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Default template keyword for test cases'
      },
      {
        label: 'Test Timeout',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: 'Test Timeout    ${1:timeout}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Default timeout for test cases'
      },
      {
        label: 'Force Tags',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: 'Force Tags    ${1:tag1}    ${2:tag2}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Tags added to all test cases'
      },
      {
        label: 'Default Tags',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: 'Default Tags    ${1:tag1}    ${2:tag2}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Default tags for test cases'
      },
      {
        label: 'Log',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'Log    ${1:message}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Logs the given message with the given level.'
      },
      {
        label: 'Log To Console',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'Log To Console    ${1:message}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Logs the given message to the console.'
      },
      {
        label: 'Sleep',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'Sleep    ${1:time}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Pauses the test execution for the given time.'
      },
      {
        label: 'Should Be Equal',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'Should Be Equal    ${1:first}    ${2:second}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Fails if the given objects are not equal.'
      },
      {
        label: 'Should Not Be Equal',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'Should Not Be Equal    ${1:first}    ${2:second}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Fails if the given objects are equal.'
      },
      {
        label: 'Should Contain',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'Should Contain    ${1:container}    ${2:item}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Fails if container does not contain item.'
      },
      {
        label: 'Should Not Contain',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'Should Not Contain    ${1:container}    ${2:item}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Fails if container contains item.'
      },
      {
        label: 'Should Be True',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'Should Be True    ${1:condition}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Fails if the condition is not true.'
      },
      {
        label: 'Should Be False',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'Should Be False    ${1:condition}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Fails if the condition is not false.'
      },
      {
        label: 'Run Keyword',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'Run Keyword    ${1:name}    ${2:args}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Executes the given keyword with the given arguments.'
      },
      {
        label: 'Run Keyword If',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'Run Keyword If    ${1:condition}    ${2:name}    ${3:args}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Runs the given keyword with the given arguments if the condition is true.'
      },
      {
        label: 'Wait Until Keyword Succeeds',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'Wait Until Keyword Succeeds    ${1:timeout}    ${2:retry_interval}    ${3:name}    ${4:args}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Runs the specified keyword and retries if it fails.'
      },
      {
        label: 'Set Variable',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'Set Variable    ${1:value}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Returns the given values as-is.'
      },
      {
        label: 'Create List',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'Create List    ${1:items}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Creates a list containing the given items.'
      },
      {
        label: 'Create Dictionary',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'Create Dictionary    ${1:key1}=${2:value1}    ${3:key2}=${4:value2}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Creates a dictionary based on the given items.'
      },
      {
        label: 'Open Browser',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'Open Browser    ${1:url}    ${2:browser}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Opens a new browser instance to the given URL.'
      },
      {
        label: 'Close Browser',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'Close Browser',
        documentation: 'Closes the current browser.'
      },
      {
        label: 'Input Text',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'Input Text    ${1:locator}    ${2:text}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Types the given text into the text field identified by locator.'
      },
      {
        label: 'Click Element',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'Click Element    ${1:locator}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Clicks the element identified by locator.'
      },
      {
        label: 'Wait Until Element Is Visible',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'Wait Until Element Is Visible    ${1:locator}    ${2:timeout}=${3:None}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Waits until the element specified by locator is visible.'
      },
      {
        label: 'Element Should Be Visible',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'Element Should Be Visible    ${1:locator}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Verifies that the element specified by locator is visible.'
      },
      {
        label: 'Element Should Contain',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'Element Should Contain    ${1:locator}    ${2:text}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Verifies that element contains text.'
      },
      {
        label: 'Page Should Contain',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'Page Should Contain    ${1:text}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Verifies that current page contains text.'
      },
      {
        label: 'Given',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: 'Given ${1:precondition}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Gherkin-style precondition'
      },
      {
        label: 'When',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: 'When ${1:action}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Gherkin-style action'
      },
      {
        label: 'Then',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: 'Then ${1:expectation}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Gherkin-style expectation'
      },
      {
        label: 'And',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: 'And ${1:additional}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Gherkin-style additional step'
      },
      {
        label: 'But',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: 'But ${1:exception}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Gherkin-style exception'
      },
      {
        label: 'Test Case',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: '${1:Test Case Name}\n    [Documentation]    ${2:Description}\n    [Tags]    ${3:tag1}\n    ${4:Step 1}\n    ${5:Step 2}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Basic test case structure'
      },
      {
        label: 'Keyword',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: '${1:Keyword Name}\n    [Arguments]    ${2:\\$\{arg1\}}    ${3:\\$\{arg2\}}\n    [Documentation]    ${4:Description}\n    ${5:Step 1}\n    ${6:Step 2}\n    [Return]    ${7:\\$\{result\}}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Basic keyword structure'
      },
      {
        label: '[Arguments]',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: '[Arguments]    ${1:\\$\{arg1\}}    ${2:\\$\{arg2\}}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Define arguments for a keyword'
      },
      {
        label: '[Documentation]',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: '[Documentation]    ${1:Description}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Document a test case or keyword'
      },
      {
        label: '[Tags]',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: '[Tags]    ${1:tag1}    ${2:tag2}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Add tags to a test case'
      },
      {
        label: '[Setup]',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: '[Setup]    ${1:Keyword Name}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Setup for a test case or keyword'
      },
      {
        label: '[Teardown]',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: '[Teardown]    ${1:Keyword Name}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Teardown for a test case or keyword'
      },
      {
        label: '[Template]',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: '[Template]    ${1:Keyword Name}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Template keyword for a test case'
      },
      {
        label: '[Timeout]',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: '[Timeout]    ${1:timeout}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Timeout for a test case or keyword'
      },
      {
        label: '[Return]',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: '[Return]    ${1:\\$\{value\}}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Return value from a keyword'
      }
    ];

    monaco.languages.registerCompletionItemProvider('robotframework', {
      triggerCharacters: ['\n', '\t'],
      provideCompletionItems: (model, position) => {
        const lineContent = model.getLineContent(position.lineNumber);
        const wordUntil = model.getWordUntilPosition(position);

        const trimmedLineBefore = lineContent.substring(0, position.column - 1).trim();

        if (trimmedLineBefore.includes('  ') && position.column > 2) {
          return { suggestions: [] };
        }

        return {
          suggestions: robotFrameworkKeywords.map(item => ({
            ...item,
            range: {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: wordUntil.startColumn,
              endColumn: wordUntil.endColumn
            }
          }))
        };
      }
    });
  }

  function handleEditorDidMount(editor, monacoInstance) {
    editorRef.current = editor;
    setMonaco(monacoInstance);

    editor.onKeyDown((e) => {
      if (e.keyCode === 13 || e.keyCode === monacoInstance.KeyCode.Enter) {
        setTimeout(() => {
          const position = editor.getPosition();
          const model = editor.getModel();

          if (model && position) {
            const lineContent = model.getLineContent(position.lineNumber);
            const lineBefore = lineContent.substring(0, position.column - 1);

            if (!lineBefore.trim() || lineBefore.trim() === '') {
              editor.trigger('keyboard', 'editor.action.triggerSuggest', {});
            }
          }
        }, 100);
      }
    });
  }

  function handleEditorChange(value) {
    if (onChange) {
      onChange(value);
    }
  }

  const options = {
    readOnly,
    minimap: { enabled: true },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    lineNumbers: "on",
    tabSize: language === "robotframework" ? 4 : 2,
    insertSpaces: true,
    wordWrap: "on",
    fontFamily: "Menlo, Monaco, 'Courier New', monospace",
    fontSize: 14,
    padding: { top: 8, bottom: 8 },
    quickSuggestions: language === "robotframework" ? {
      other: true,
      comments: true,
      strings: true
    } : undefined,
    suggestOnTriggerCharacters: language === "robotframework" ? true : undefined,
    parameterHints: language === "robotframework" ? {
      enabled: true
    } : undefined
  };

  return (
    <MonacoEditorLib
      height="100%"
      language={language}
      value={value}
      theme={editorTheme}
      onChange={handleEditorChange}
      onMount={handleEditorDidMount}
      options={options}
    />
  );
}
