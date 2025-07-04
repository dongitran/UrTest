"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { registerRobotFrameworkLanguage } from "../../utils/robotFrameworkLanguage";
import { useSettings } from "@/contexts/SettingsContext";

const MonacoEditorLib = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-full" />,
});

export default function MonacoEditor({
  language = "javascript",
  value = "",
  onChange,
  readOnly = false,
  projectName = null,
}) {
  const editorRef = useRef(null);
  const { theme } = useTheme();
  const [editorTheme, setEditorTheme] = useState("vs-dark");
  const [monaco, setMonaco] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const { settings, isLoaded } = useSettings();

  useEffect(() => {
    setEditorTheme(theme === "dark" ? "vs-dark" : "vs");
  }, [theme]);

  useEffect(() => {
    async function setupRobotFramework() {
      if (monaco && language === "robotframework" && !isRegistering) {
        try {
          setIsRegistering(true);
          await registerRobotFrameworkLanguage(monaco, projectName);
        } catch (error) {
          console.error("Failed to register Robot Framework language:", error);
        } finally {
          setIsRegistering(false);
        }
      }
    }

    setupRobotFramework();
  }, [monaco, language, isRegistering, projectName]);

  const options = useMemo(
    () => ({
      readOnly,
      minimap: { enabled: isLoaded ? settings.editor.minimap : true },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      lineNumbers: isLoaded
        ? settings.editor.lineNumbers
          ? "on"
          : "off"
        : "on",
      tabSize:
        language === "robotframework"
          ? isLoaded
            ? settings.editor.tabSize
            : 4
          : 2,
      insertSpaces: true,
      wordWrap: isLoaded ? (settings.editor.wordWrap ? "on" : "off") : "on",
      fontFamily: isLoaded
        ? settings.editor.fontFamily
        : "Menlo, Monaco, 'Courier New', monospace",
      fontSize: isLoaded ? settings.editor.fontSize : 13,
      padding: isLoaded ? settings.editor.padding : { top: 8, bottom: 8 },
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
    [language, readOnly, settings?.editor, isLoaded]
  );

  const handleEditorDidMount = useCallback(
    (editor, monacoInstance) => {
      editorRef.current = editor;
      setMonaco(monacoInstance);

      if (language === "robotframework") {
        editor.onKeyDown((e) => {
          if (e.keyCode === 56 && e.shiftKey) {
            setTimeout(() => {
              const position = editor.getPosition();
              const model = editor.getModel();

              if (model && position) {
                const lineContent = model.getLineContent(position.lineNumber);
                const lineBefore = lineContent.substring(
                  0,
                  position.column - 1
                );

                if (lineBefore.trim().match(/^\*{1,2}$/)) {
                  editor.trigger(
                    "keyboard",
                    "editor.action.triggerSuggest",
                    {}
                  );
                }
              }
            }, 100);
          }
        });
      }
    },
    [language]
  );

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
