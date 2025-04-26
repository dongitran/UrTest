"use client";

import { useEffect, useRef, useState } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "next-themes";

import dynamic from 'next/dynamic';
const MonacoEditorLib = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-full" />,
});

export default function MonacoEditor({
  language = "javascript",
  value = "",
  onChange,
  readOnly = false
}) {
  const editorRef = useRef(null);
  const { theme } = useTheme();
  const [editorTheme, setEditorTheme] = useState("vs-dark");

  useEffect(() => {
    setEditorTheme(theme === "dark" ? "vs-dark" : "vs");
  }, [theme]);

  function handleEditorDidMount(editor) {
    editorRef.current = editor;
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
    tabSize: 2,
    wordWrap: "on",
    fontFamily: "Menlo, Monaco, 'Courier New', monospace",
    fontSize: 14,
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