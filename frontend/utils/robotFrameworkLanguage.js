import robotFrameworkKeywords from "./robotFrameworkKeywords.json";

export function registerRobotFrameworkLanguage(monaco) {
  if (
    monaco.languages.getLanguages().some((lang) => lang.id === "robotframework")
  ) {
    return;
  }

  monaco.languages.register({ id: "robotframework" });

  monaco.languages.setMonarchTokensProvider("robotframework", {
    defaultToken: "",
    tokenizer: {
      root: [
        [
          /^\*{3}\s*(Settings|Variables|Test Cases|Keywords|Tasks)\s*\*{3}/,
          "keyword",
        ],
        [/#.*$/, "comment"],
        [/\${[\w\s]+}/, "variable"],
        [/@{[\w\s]+}/, "variable"],
        [/&{[\w\s]+}/, "variable"],
        [/%{[\w\s]+}/, "variable"],
        [/^(Given|When|Then|And|But)\s+/, "keyword"],
        [/\[.*?\]/, "tag"],
        [/^(Library|Resource|Variables|Documentation)/, "keyword"],
      ],
    },
  });

  monaco.languages.registerCompletionItemProvider("robotframework", {
    triggerCharacters: ["\n", "\t"],
    provideCompletionItems: (model, position) => {
      const lineContent = model.getLineContent(position.lineNumber);
      const wordUntil = model.getWordUntilPosition(position);
      const trimmedLineBefore = lineContent
        .substring(0, position.column - 1)
        .trim();

      if (trimmedLineBefore.includes("  ") && position.column > 2) {
        return { suggestions: [] };
      }

      return {
        suggestions: robotFrameworkKeywords.map((item) => ({
          label: item.label,
          kind: monaco.languages.CompletionItemKind[item.kind],
          insertText: item.insertText,
          insertTextRules:
            item.kind === "Snippet" || item.insertText.includes("${")
              ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
              : undefined,
          documentation: item.documentation,
          range: {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: wordUntil.startColumn,
            endColumn: wordUntil.endColumn,
          },
        })),
      };
    },
  });
}
