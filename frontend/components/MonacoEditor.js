"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { registerRobotFrameworkLanguage } from "../utils/robotFrameworkLanguage";

const MonacoEditorLib = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-full" />,
});

export default function MonacoEditor({
  language = "javascript",
  value = "",
  onChange,
  readOnly = false,
  slug = null,
}) {
  const editorRef = useRef(null);
  const { theme } = useTheme();
  const [editorTheme, setEditorTheme] = useState("vs-dark");
  const [monaco, setMonaco] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    setEditorTheme(theme === "dark" ? "vs-dark" : "vs");
  }, [theme]);

  useEffect(() => {
    async function setupRobotFramework() {
      if (monaco && language === "robotframework" && !isRegistering) {
        try {
          setIsRegistering(true);
          await registerRobotFrameworkLanguage(monaco, slug);
        } catch (error) {
          console.error("Failed to register Robot Framework language:", error);
        } finally {
          setIsRegistering(false);
        }
      }
    }

    setupRobotFramework();
  }, [monaco, language, isRegistering, slug]);

  const options = useMemo(
    () => ({
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
      quickSuggestions:
        language === "robotframework"
          ? {
              other: true,
              comments: true,
              strings: true,
            }
          : undefined,
      suggestOnTriggerCharacters:
        language === "robotframework" ? true : undefined,
      parameterHints:
        language === "robotframework"
          ? {
              enabled: true,
            }
          : undefined,
    }),
    [language, readOnly]
  );

  const handleEditorDidMount = useCallback((editor, monacoInstance) => {
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

            if (!lineBefore.trim() || lineBefore.trim() === "") {
              editor.trigger("keyboard", "editor.action.triggerSuggest", {});
            }
          }
        }, 100);
      }
    });
  }, []);

  const handleEditorChange = useCallback(
    (value) => {
      if (onChange) {
        onChange(value);
      }
    },
    [onChange]
  );

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
