let cachedKeywords = null;
let lastFetchTime = 0;
const CACHE_TTL = 60000; // 60s

export async function fetchRobotFrameworkKeywords() {
  const currentTime = Date.now();

  if (cachedKeywords && currentTime - lastFetchTime < CACHE_TTL) {
    return cachedKeywords;
  }

  try {
    const response = await fetch("http://s0.dtur.xyz/urtest/robotFrameworkKeywords.json");
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

export async function registerRobotFrameworkLanguage(monaco) {
  if (
    monaco.languages.getLanguages().some((lang) => lang.id === "robotframework")
  ) {
    return;
  }

  const keywords = await fetchRobotFrameworkKeywords();

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
        suggestions: keywords.map((item) => ({
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
