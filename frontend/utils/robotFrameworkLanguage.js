let cachedKeywords = null;
let lastFetchTime = 0;
const CACHE_TTL = 60000;

export async function fetchRobotFrameworkKeywords(slug = null) {
  const currentTime = Date.now();

  if (cachedKeywords && currentTime - lastFetchTime < CACHE_TTL) {
    return cachedKeywords;
  }

  try {
    let url = "https://s0.dtur.xyz/urtest/robotFrameworkKeywords.json"; // TODO: remove
    if (slug) {
      url = `https://s0.dtur.xyz/urtest/keywords/${slug}/robotFrameworkKeywords.json`;
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

  const functionKeywordsList = keywords
    .filter((item) => item.kind === "Function")
    .map((item) => item.label);

  const keywordKeywordsList = keywords
    .filter((item) => item.kind === "Keyword")
    .map((item) => item.label);

  monaco.languages.register({ id: "robotframework" });

  monaco.editor.defineTheme("vs-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "function", foreground: "FF8C00", fontStyle: "bold" },
      { token: "keyword", foreground: "569CD6" },
      { token: "variable", foreground: "9CDCFE" },
      { token: "tag", foreground: "C586C0" },
      { token: "comment", foreground: "6A9955" },
      { token: "section", foreground: "CC99FF", fontStyle: "bold" },
    ],
    colors: {},
  });

  monaco.editor.defineTheme("vs", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "function", foreground: "FF8C00", fontStyle: "bold" },
      { token: "keyword", foreground: "0000FF" },
      { token: "variable", foreground: "001080" },
      { token: "tag", foreground: "AF00DB" },
      { token: "comment", foreground: "008000" },
      { token: "section", foreground: "8A2BE2", fontStyle: "bold" },
    ],
    colors: {
      'editor.background': '#f9f9f9',
      'editor.lineHighlightBackground': '#f9f9f9',
      'editorGutter.background': '#f9f9f9',
    },
  });

  monaco.languages.setMonarchTokensProvider("robotframework", {
    defaultToken: "",

    functionKeywords: functionKeywordsList,
    keywordKeywords: keywordKeywordsList,

    tokenizer: {
      root: [
        [
          /^\*{3}\s*(Settings|Variables|Test Cases|Keywords|Tasks)\s*\*{3}/,
          "section",
        ],
        [/#.*$/, "comment"],
        [/\${[\w\s.]+}/, "variable"],
        [/@{[\w\s.]+}/, "variable"],
        [/&{[\w\s.]+}/, "variable"],
        [/%{[\w\s.]+}/, "variable"],

        [
          /(\s+|=\s+)([A-Za-z][A-Za-z0-9 ]*)\b/,
          {
            cases: {
              "$2@functionKeywords": ["", "function"],
              "@default": "",
            },
          },
        ],

        [/^(Given|When|Then|And|But)\s+/, "keyword"],

        [
          /^([A-Za-z][A-Za-z0-9 ]*)\b/,
          {
            cases: {
              "@keywordKeywords": "keyword",
              "@default": "",
            },
          },
        ],

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
