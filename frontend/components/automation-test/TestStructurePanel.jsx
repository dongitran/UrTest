import React from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export default function TestStructurePanel({
  parsedSections,
  activeSection,
  setActiveSection,
}) {
  const handleSectionClick = (sectionKey) => {
    setActiveSection(sectionKey);
  };

  const isActive = (sectionKey) => activeSection === sectionKey;

  return (
    <Card className="flex flex-col border rounded-lg bg-card overflow-hidden h-full">
      <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
        <div className="flex flex-col h-full">
          <div className="flex-shrink-0 p-2 space-y-1">
            <button
              className={cn(
                "flex items-center w-full px-3 py-1.5 text-sm rounded-md transition-colors",
                isActive("FullCode")
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 font-medium"
                  : "hover:bg-muted-foreground/10 text-muted-foreground"
              )}
              onClick={() => handleSectionClick("FullCode")}
            >
              Full Code
            </button>

            <div className="border-t border-border my-2"></div>

            {parsedSections.settings.trim() !== "" && (
              <button
                className={cn(
                  "flex items-center w-full px-3 py-1.5 text-sm rounded-md transition-colors",
                  isActive("Settings")
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 font-medium"
                    : "hover:bg-muted-foreground/10 text-muted-foreground"
                )}
                onClick={() => handleSectionClick("Settings")}
              >
                Settings
              </button>
            )}

            {parsedSections.variables.trim() !== "" && (
              <button
                className={cn(
                  "flex items-center w-full px-3 py-1.5 text-sm rounded-md transition-colors",
                  isActive("Variables")
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 font-medium"
                    : "hover:bg-muted-foreground/10 text-muted-foreground"
                )}
                onClick={() => handleSectionClick("Variables")}
              >
                Variables
              </button>
            )}

            {parsedSections.keywords.trim() !== "" && (
              <button
                className={cn(
                  "flex items-center w-full px-3 py-1.5 text-sm rounded-md transition-colors",
                  isActive("Keywords")
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 font-medium"
                    : "hover:bg-muted-foreground/10 text-muted-foreground"
                )}
                onClick={() => handleSectionClick("Keywords")}
              >
                Keywords
              </button>
            )}

            {parsedSections.tasks.trim() !== "" && (
              <button
                className={cn(
                  "flex items-center w-full px-3 py-1.5 text-sm rounded-md transition-colors",
                  isActive("Tasks")
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 font-medium"
                    : "hover:bg-muted-foreground/10 text-muted-foreground"
                )}
                onClick={() => handleSectionClick("Tasks")}
              >
                Tasks
              </button>
            )}
          </div>

          {parsedSections.testCases.length > 0 && (
            <>
              <div className="border-t border-border mx-2"></div>

              <div className="flex-shrink-0 px-2 py-2">
                <div className="px-3 py-1 bg-muted/50 rounded-md border">
                  <span className="text-xs font-bold text-foreground uppercase tracking-wide">
                    Test Cases ({parsedSections.testCases.length})
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="px-2 pb-2 space-y-1">
                    {parsedSections.testCases.map((testCase, index) => (
                      <button
                        key={`TestCase_${index}`}
                        className={cn(
                          "flex items-center w-full px-3 py-1.5 text-sm rounded-md transition-colors text-left group",
                          isActive(`TestCase_${index}`)
                            ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 font-medium"
                            : "hover:bg-muted-foreground/10 text-muted-foreground"
                        )}
                        onClick={() => handleSectionClick(`TestCase_${index}`)}
                        title={testCase.name}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="line-clamp-2 break-words leading-tight">
                            {testCase.name}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
