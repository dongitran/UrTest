let cachedKeywords = null;
let lastFetchTime = 0;
const CACHE_TTL = 60000; // 60s

export async function fetchRobotFrameworkKeywords(slug = null) {
  const currentTime = Date.now();

  if (cachedKeywords && currentTime - lastFetchTime < CACHE_TTL) {
    return cachedKeywords;
  }

  try {
    let url = "http://s0.dtur.xyz/urtest/robotFrameworkKeywords.json"; // TODO: remove
    if (slug) {
      url = `http://s0.dtur.xyz/urtest/keywords/${slug}/robotFrameworkKeywords.json`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch keywords: ${response.status}`);
    }

    const keywords = await response.json();
    cachedKeywords = keywords;
    lastFetchTime = currentTime;
    return keywords;
  } catch (error) {
    console.error("Error fetching Robot Framework keywords:", error);

    if (cachedKeywords) {
      console.warn("Using cached keywords due to fetch error");
      return cachedKeywords;
    }

    throw error;
  }
}

export async function registerRobotFrameworkLanguage(monaco, slug = null) {
  if (
    monaco.languages.getLanguages().some((lang) => lang.id === "robotframework")
  ) {
    return;
  }

  const keywords = await fetchRobotFrameworkKeywords(slug);

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
    triggerCharacters: ["*"],
    provideCompletionItems: (model, position) => {
      const lineContent = model.getLineContent(position.lineNumber);
      const wordUntil = model.getWordUntilPosition(position);
      const trimmedLineBefore = lineContent
        .substring(0, position.column - 1)
        .trim();

      if (trimmedLineBefore.match(/^\*{1,2}$/)) {
        const sectionHeaders = keywords.filter(
          (item) => item.label.startsWith("***") && item.label.endsWith("***")
        );

        const asteriskStart = lineContent.indexOf("*");

        return {
          suggestions: sectionHeaders.map((item) => {
            let insertText = item.insertText;

            return {
              label: item.label,
              kind: monaco.languages.CompletionItemKind[item.kind],
              insertText: insertText,
              insertTextRules:
                item.kind === "Snippet" || insertText.includes("${")
                  ? monaco.languages.CompletionItemInsertTextRule
                      .InsertAsSnippet
                  : undefined,
              documentation: item.documentation,
              range: {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: asteriskStart + 1,
                endColumn: position.column,
              },
            };
          }),
        };
      }

      if (trimmedLineBefore.includes("  ") && position.column > 2) {
        return { suggestions: [] };
      }

      return {
        suggestions: keywords.map((item) => {
          let insertText = item.insertText;

          if (item.kind === "Function" && insertText.includes("    ")) {
            const parts = insertText.split(/\s{2,}/);
            const funcName = parts[0];

            if (parts.length > 1) {
              const parameters = parts.slice(1);

              insertText = funcName + "\n";
              parameters.forEach((param) => {
                insertText += "    ...    " + param + "\n";
              });

              insertText = insertText.slice(0, -1);
            }
          }

          return {
            label: item.label,
            kind: monaco.languages.CompletionItemKind[item.kind],
            insertText: insertText,
            insertTextRules:
              item.kind === "Snippet" || insertText.includes("${")
                ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                : undefined,
            documentation: item.documentation,
            range: {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: wordUntil.startColumn,
              endColumn: wordUntil.endColumn,
            },
          };
        }),
      };
    },
  });
}
