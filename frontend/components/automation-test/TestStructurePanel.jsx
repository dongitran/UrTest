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
    <Card className="flex flex-col border rounded-lg bg-card overflow-hidden mt-2">
      <CardHeader className="py-3 px-4 border-b">
        <CardTitle className="text-base font-semibold">
          Test Structure
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="flex flex-col gap-1 p-2">
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
            <hr className="my-1 border-border" />
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
            {parsedSections.testCases.length > 0 && (
              <>
                <div className="text-xs font-semibold text-muted-foreground uppercase mt-2 mb-1 px-3">
                  Test Cases ({parsedSections.testCases.length})
                </div>
                <ul className="space-y-1">
                  {parsedSections.testCases.map((testCase, index) => (
                    <li key={`TestCase_${index}`}>
                      <button
                        className={cn(
                          "flex items-center w-full px-3 py-1.5 text-sm rounded-md transition-colors text-left",
                          isActive(`TestCase_${index}`)
                            ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 font-medium"
                            : "hover:bg-muted-foreground/10 text-muted-foreground"
                        )}
                        onClick={() => handleSectionClick(`TestCase_${index}`)}
                        title={testCase.name}
                      >
                        {testCase.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
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
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
