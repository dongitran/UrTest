"use client";

import { useSettings } from "@/contexts/SettingsContext";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
  const { settings, updateEditorSettings, resetSettings, isLoaded } =
    useSettings();
  const [fontSizeInput, setFontSizeInput] = useState("");

  useEffect(() => {
    if (isLoaded && settings?.editor?.fontSize) {
      setFontSizeInput(settings.editor.fontSize.toString());
    }
  }, [isLoaded, settings?.editor?.fontSize]);

  const handleFontSizeChange = (e) => {
    setFontSizeInput(e.target.value);
  };

  const handleFontSizeBlur = () => {
    const fontSize = parseInt(fontSizeInput, 10);
    if (!isNaN(fontSize) && fontSize >= 8 && fontSize <= 32) {
      updateEditorSettings({ fontSize });
      toast.success("Font size updated");
    } else {
      setFontSizeInput(settings.editor.fontSize.toString());
      toast.error("Font size must be between 8 and 32");
    }
  };

  useEffect(() => {
    const headerContainer = document.getElementById("page-header-controls");
    if (headerContainer) {
      const resetButton = document.createElement("div");
      resetButton.innerHTML = `
        <button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3 text-xs">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M3 21v-5h5"></path></svg>
          Reset to Defaults
        </button>
      `;
      headerContainer.appendChild(resetButton);

      const resetButtonEl = resetButton.querySelector("button");
      resetButtonEl.addEventListener("click", () => {
        resetSettings();
        toast.success("Settings reset to defaults");
      });

      return () => {
        headerContainer.removeChild(resetButton);
      };
    }
  }, [resetSettings]);

  return (
    <div className="w-full mt-2">
      <div className="space-y-2 bg-card rounded-lg border shadow-sm">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Editor Settings</h2>
          <p className="text-muted-foreground text-sm">
            Customize the Monaco editor appearance and behavior
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="fontSize">
                Font Size
              </label>
              <Input
                id="fontSize"
                value={fontSizeInput}
                onChange={handleFontSizeChange}
                onBlur={handleFontSizeBlur}
                onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
                type="number"
                min={8}
                max={32}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Font size in pixels (8-32)
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="tabSize">
                Tab Size
              </label>
              <select
                id="tabSize"
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                value={settings.editor.tabSize}
                onChange={(e) => {
                  updateEditorSettings({
                    tabSize: parseInt(e.target.value, 10),
                  });
                  toast.success("Tab size updated");
                }}
              >
                <option value="2">2 spaces</option>
                <option value="4">4 spaces</option>
                <option value="8">8 spaces</option>
              </select>
              <p className="text-xs text-muted-foreground">
                Number of spaces per tab
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="fontFamily">
              Font Family
            </label>
            <select
              id="fontFamily"
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              value={settings.editor.fontFamily}
              onChange={(e) => {
                updateEditorSettings({ fontFamily: e.target.value });
                toast.success("Font family updated");
              }}
            >
              <option value="Menlo, Monaco, 'Courier New', monospace">
                Menlo, Monaco, Courier New (Default)
              </option>
              <option value="'Fira Code', monospace">Fira Code</option>
              <option value="'JetBrains Mono', monospace">
                JetBrains Mono
              </option>
              <option value="'Source Code Pro', monospace">
                Source Code Pro
              </option>
              <option value="Consolas, 'Liberation Mono', monospace">
                Consolas
              </option>
            </select>
            <p className="text-xs text-muted-foreground">
              Font family for the editor
            </p>
          </div>

          <div className="border-t border-border pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Word Wrap</label>
                <p className="text-xs text-muted-foreground">
                  Wrap long lines to fit in the editor
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.editor.wordWrap}
                  onChange={() => {
                    updateEditorSettings({
                      wordWrap: !settings.editor.wordWrap,
                    });
                    toast.success("Word wrap setting updated");
                  }}
                />
                <div className="w-11 h-6 bg-gray-700 rounded-full peer-checked:bg-blue-600 peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Line Numbers</label>
                <p className="text-xs text-muted-foreground">
                  Show line numbers in the editor
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.editor.lineNumbers}
                  onChange={() => {
                    updateEditorSettings({
                      lineNumbers: !settings.editor.lineNumbers,
                    });
                    toast.success("Line numbers setting updated");
                  }}
                />
                <div className="w-11 h-6 bg-gray-700 rounded-full peer-checked:bg-blue-600 peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Minimap</label>
                <p className="text-xs text-muted-foreground">
                  Show minimap for navigating through code
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.editor.minimap}
                  onChange={() => {
                    updateEditorSettings({ minimap: !settings.editor.minimap });
                    toast.success("Minimap setting updated");
                  }}
                />
                <div className="w-11 h-6 bg-gray-700 rounded-full peer-checked:bg-blue-600 peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
