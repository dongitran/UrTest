"use client";

import { createContext, useContext, useEffect, useState } from "react";

const SETTINGS_STORAGE_KEY = "urtest_settings";

const defaultSettings = {
  editor: {
    fontSize: 13,
    fontFamily: "Menlo, Monaco, 'Courier New', monospace",
    tabSize: 4,
    wordWrap: true,
    lineNumbers: true,
    minimap: true,
    padding: { top: 8, bottom: 8 },
  },
};

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (storedSettings) {
        try {
          const parsedSettings = JSON.parse(storedSettings);
          setSettings(parsedSettings);
        } catch (error) {
          console.error("Error parsing stored settings:", error);
        }
      }
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && typeof window !== "undefined") {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    }
  }, [settings, isLoaded]);

  const updateSettings = (newSettings) => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      ...newSettings,
    }));
  };

  const updateEditorSettings = (editorSettings) => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      editor: {
        ...prevSettings.editor,
        ...editorSettings,
      },
    }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        updateEditorSettings,
        resetSettings,
        isLoaded,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

export default SettingsContext;
