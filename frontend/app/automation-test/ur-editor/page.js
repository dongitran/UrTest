"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  LoaderCircle,
  Play,
  History,
  ExternalLink,
  Trash2,
} from "lucide-react";
import MonacoEditor from "@/components/MonacoEditor";
import TagInput from "@/components/TagInput";
import JiraLinkButton from "@/components/JiraLinkButton";
import { TestSuiteApi } from "@/lib/api";
import { useForm } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChatPanel from "@/components/ChatPanel";
import CommentPanel from "@/components/CommentPanel";
import {
  saveTestSuiteDraft,
  getTestSuiteDraft,
  clearTestSuiteDraft,
  formatDraftSavedTime,
} from "@/utils/testSuiteDrafts";
import { PROJECT_DETAIL_QUERY_KEY } from "@/hooks/useProjects";
import {
  parseRobotFramework,
  reconstructRobotFramework,
} from "@/utils/robotFrameworkParser";
import TestStructurePanel from "@/components/automation-test/TestStructurePanel";

export default function NewTestCasePage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const testSuiteId = searchParams.get("testSuiteId");
  const projectName = decodeURIComponent(searchParams.get("project") || "");
  const router = useRouter();
  const queryClient = useQueryClient();

  const [tags, setTags] = useState([]);
  const [showProgress, setShowProgress] = useState(false);

  const defaultScriptContent = `*** Settings ***
Resource    ../common-imports.robot
Resource    ./resources/init.robot

*** Variables ***

*** Test Cases ***
Get Customer ID
    Connect To UC Urcard Database
    @{query_result}=    Query    SELECT id FROM tbl_customers LIMIT ${"${LIMIT_QUERY}"}

    Close All DB Connections
`;

  const [scriptContent, setScriptContent] = useState("");
  const [parsedSections, setParsedSections] = useState({
    settings: "",
    variables: "",
    testCases: [],
    keywords: "",
    tasks: "",
  });
  const [displayedContent, setDisplayedContent] = useState("");
  const [activeSection, setActiveSection] = useState("FullCode");

  const [rightPanelActiveTab, setRightPanelActiveTab] =
    useState("testStructure");

  const [isLoading, setIsLoading] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [draftChecked, setDraftChecked] = useState(false);
  const [contentHeight, setContentHeight] = useState("calc(100vh - 95px)");

  const userInteractedRef = useRef(false);
  const mainContainerRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const previousActiveSectionRef = useRef("FullCode");

  const {
    data: testSuiteDetail,
    isLoading: testSuiteContentLoading,
    refetch: refetchTestSuite,
  } = useQuery({
    queryKey: ["detail-test-suite" + testSuiteId],
    queryFn: () => {
      return TestSuiteApi().detail(testSuiteId, { projectId });
    },
    enabled: testSuiteId ? true : false,
  });

  const editorContentLoading = testSuiteId
    ? testSuiteContentLoading || !draftChecked
    : !draftChecked;

  const { register, getValues, setValue, watch } = useForm();

  const clearChatHistory = useCallback(() => {
    const chatKey = `chat_messages_${testSuiteId || "new"}`;
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(chatKey);
    }
  }, [testSuiteId]);

  useEffect(() => {
    return () => {
      clearChatHistory();
    };
  }, [clearChatHistory]);

  const markUserInteraction = () => {
    userInteractedRef.current = true;
    setAutoSaveEnabled(true);
  };

  const parseTestCaseWithName = (contentWithName) => {
    const lines = contentWithName.split("\n");
    let testCaseName = "";
    let testCaseContent = "";

    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      if (
        firstLine &&
        !firstLine.startsWith(" ") &&
        !firstLine.startsWith("\t")
      ) {
        testCaseName = firstLine;
        testCaseContent = lines.slice(1).join("\n");
      } else {
        testCaseContent = contentWithName;
      }
    }

    return { name: testCaseName, content: testCaseContent };
  };

  const syncScriptContent = useCallback(() => {
    const newScriptContent = reconstructRobotFramework(parsedSections);
    setScriptContent(newScriptContent);
  }, [parsedSections]);

  const debouncedSyncScript = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      syncScriptContent();
    }, 1000);
  }, [syncScriptContent]);

  const handleMonacoEditorChange = useCallback(
    (newContent) => {
      setDisplayedContent(newContent);

      if (activeSection === "FullCode") {
        setScriptContent(newContent);
        setParsedSections(parseRobotFramework(newContent));
      } else {
        setParsedSections((prevParsed) => {
          const updatedParsed = { ...prevParsed };

          if (activeSection === "Settings") {
            updatedParsed.settings = newContent;
          } else if (activeSection === "Variables") {
            updatedParsed.variables = newContent;
          } else if (activeSection.startsWith("TestCase_")) {
            const index = parseInt(activeSection.split("_")[1]);
            if (updatedParsed.testCases[index]) {
              const { name, content } = parseTestCaseWithName(newContent);
              if (name) {
                updatedParsed.testCases[index].name = name;
              }
              updatedParsed.testCases[index].content = content;
            }
          } else if (activeSection === "Keywords") {
            updatedParsed.keywords = newContent;
          } else if (activeSection === "Tasks") {
            updatedParsed.tasks = newContent;
          }

          debouncedSyncScript();
          return updatedParsed;
        });
      }
      markUserInteraction();
    },
    [activeSection, debouncedSyncScript]
  );

  const handleTagsChange = (newTags) => {
    if (JSON.stringify(newTags) !== JSON.stringify(tags)) {
      markUserInteraction();
    }
    setTags(newTags);
  };

  const handleNameChange = (e) => {
    const newValue = e.target.value;
    const currentValue = getValues("name") || "";
    if (newValue !== currentValue) {
      markUserInteraction();
    }
  };

  const autoSave = useCallback(() => {
    if (!autoSaveEnabled || !projectId || !userInteractedRef.current) return;

    const currentScriptContent = reconstructRobotFramework(parsedSections);

    const data = getValues();
    const draftData = {
      name: data.name || "",
      tags: tags,
      content: currentScriptContent,
    };

    const wasSaved = saveTestSuiteDraft(projectId, testSuiteId, draftData);

    if (wasSaved) {
      setLastSaved(new Date().toISOString());
      setHasDraft(true);
    }
  }, [
    autoSaveEnabled,
    projectId,
    testSuiteId,
    getValues,
    tags,
    parsedSections,
  ]);

  useEffect(() => {
    if (!projectId) return;

    const timer = setInterval(() => {
      autoSave();
    }, 30000);

    return () => clearInterval(timer);
  }, [projectId, autoSave]);

  useEffect(() => {
    const timer = setTimeout(() => {
      autoSave();
    }, 2000);

    return () => clearTimeout(timer);
  }, [parsedSections, tags, autoSave]);

  useEffect(() => {
    if (!projectId) return;

    setDraftChecked(false);
    userInteractedRef.current = false;
    setAutoSaveEnabled(false);

    const draft = getTestSuiteDraft(projectId, testSuiteId);
    let contentToLoad = defaultScriptContent;
    let initialName = "";
    let initialTags = [];
    let initialResultRunner = null;

    if (draft) {
      setHasDraft(true);
      setLastSaved(draft.lastSaved);
      contentToLoad = draft.content;
      initialName = draft.name;
      initialTags = draft.tags || [];
    } else if (testSuiteId && testSuiteDetail) {
      contentToLoad = testSuiteDetail.content;
      initialName = testSuiteDetail.name;
      initialTags = testSuiteDetail.tags || [];
      initialResultRunner = testSuiteDetail.params?.resultRunner || null;
    } else {
      setHasDraft(false);
    }

    const parsed = parseRobotFramework(contentToLoad);
    setParsedSections(parsed);
    setScriptContent(contentToLoad);

    setActiveSection("FullCode");
    setDisplayedContent(contentToLoad);

    setValue("name", initialName);
    setTags(initialTags);
    setValue("resultRunner", initialResultRunner);

    setDraftChecked(true);
  }, [projectId, testSuiteId, setValue, testSuiteDetail]);

  const invalidateCaches = async () => {
    await queryClient.invalidateQueries([PROJECT_DETAIL_QUERY_KEY, projectId]);
    await queryClient.invalidateQueries(["test-resource", projectId]);
    await queryClient.invalidateQueries(["detail-test-suite"]);
    await queryClient.resetQueries();
  };

  const handleEdit = async () => {
    const data = getValues();
    if (!data.name?.trim()) {
      toast.error("Test name is required");
      return;
    }
    if (!testSuiteId) {
      toast.error("Missing testSuiteId value, cannot edit");
      return;
    }
    try {
      setIsLoading(true);

      const finalScriptContent = reconstructRobotFramework(parsedSections);

      await TestSuiteApi().patch(testSuiteId, {
        ...data,
        tags,
        content: finalScriptContent,
        projectId,
      });

      clearTestSuiteDraft(projectId, testSuiteId);
      setHasDraft(false);

      toast.success(`Test script edited successfully`);

      await invalidateCaches();
      localStorage.setItem("test_suite_updated", "true");

      router.push(`/automation-test?projectId=${projectId}`);
    } catch (error) {
      toast.error(`Error editing test script`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    const data = getValues();
    if (!data.name?.trim()) {
      toast.error("Test name is required");
      return;
    }
    if (!projectId) {
      toast.error("Missing ProjectId value, cannot create");
      return;
    }
    try {
      setIsLoading(true);

      const finalScriptContent = reconstructRobotFramework(parsedSections);

      await TestSuiteApi().post({
        ...data,
        tags,
        content: finalScriptContent,
        projectId,
      });

      clearTestSuiteDraft(projectId, testSuiteId || "new");
      setHasDraft(false);

      toast.success("Test case saved successfully");

      await invalidateCaches();
      localStorage.setItem("test_suite_updated", "true");

      router.push(`/automation-test?projectId=${projectId}`);
    } catch (error) {
      console.error("Error saving test case:", error);
      toast.error("Failed to save test case");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunTest = async () => {
    try {
      toast.success("Test execution requested. Please wait for results");
      setShowProgress(true);
      setIsLoading(true);

      const finalScriptContent = reconstructRobotFramework(parsedSections);

      const { resultRunner, duration } = await TestSuiteApi().draftExecute({
        content: finalScriptContent,
        projectId,
      });
      setValue("resultRunner", resultRunner);
      setValue("duration", duration);
    } catch (error) {
      toast.error("Failed to run test");
    } finally {
      setShowProgress(false);
      setIsLoading(false);
    }
  };

  const handleOpenResults = () => {
    const resultRunner = watch("resultRunner");
    if (resultRunner?.reportUrl) {
      window.open(`${resultRunner.reportUrl}/report.html`, "_blank");
    }
  };

  const handleResetToOriginal = () => {
    let contentToRestore = "";
    let nameToRestore = "";
    let tagsToRestore = [];
    let resultRunnerToRestore = null;

    if (testSuiteDetail) {
      contentToRestore = testSuiteDetail.content;
      nameToRestore = testSuiteDetail.name;
      tagsToRestore = testSuiteDetail.tags || [];
      resultRunnerToRestore = testSuiteDetail.params?.resultRunner || null;
    } else {
      contentToRestore = defaultScriptContent;
      nameToRestore = "";
      tagsToRestore = [];
    }

    const parsed = parseRobotFramework(contentToRestore);
    setParsedSections(parsed);
    setScriptContent(contentToRestore);

    setActiveSection("FullCode");
    setDisplayedContent(contentToRestore);

    setValue("name", nameToRestore);
    setTags(tagsToRestore);
    setValue("resultRunner", resultRunnerToRestore);

    clearTestSuiteDraft(projectId, testSuiteId || "new");
    setHasDraft(false);
    setLastSaved(null);
    userInteractedRef.current = false;
    setAutoSaveEnabled(false);

    toast.success(
      testSuiteDetail ? "Restored to original version" : "Draft deleted"
    );
  };

  useEffect(() => {
    if (previousActiveSectionRef.current !== activeSection) {
      if (previousActiveSectionRef.current !== "FullCode") {
        syncScriptContent();
      }

      let content = "";
      if (activeSection === "FullCode") {
        content = scriptContent;
      } else if (activeSection === "Settings") {
        content = parsedSections.settings;
      } else if (activeSection === "Variables") {
        content = parsedSections.variables;
      } else if (activeSection.startsWith("TestCase_")) {
        const index = parseInt(activeSection.split("_")[1]);
        const testCase = parsedSections.testCases[index];
        content = testCase ? `${testCase.name}\n${testCase.content}` : "";
      } else if (activeSection === "Keywords") {
        content = parsedSections.keywords;
      } else if (activeSection === "Tasks") {
        content = parsedSections.tasks;
      }
      setDisplayedContent(content);

      previousActiveSectionRef.current = activeSection;
    }
  }, [activeSection, parsedSections, scriptContent, syncScriptContent]);

  useEffect(() => {
    const calculateHeight = () => {
      const headerHeight = 55;
      const safetyMargin = 15;
      const calculatedHeight = window.innerHeight - headerHeight - safetyMargin;
      setContentHeight(`${calculatedHeight}px`);

      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";

      document.documentElement.style.setProperty(
        "--ur-editor-height",
        `${calculatedHeight}px`
      );
    };

    const addScrollLockStyles = () => {
      const styleEl = document.createElement("style");
      styleEl.id = "scroll-lock-styles";
      styleEl.textContent = `
                body, html {
                    overflow: hidden !important;
                    height: 100% !important;
                    position: relative !important;
                }
                .ur-editor-page {
                    height: var(--ur-editor-height, calc(100vh - 95px)) !important;
                    max-height: var(--ur-editor-height, calc(100vh - 95px)) !important;
                    overflow: hidden !important;
                }
            `;
      document.head.appendChild(styleEl);
    };

    calculateHeight();
    addScrollLockStyles();
    window.addEventListener("resize", calculateHeight);

    const preventDefault = (e) => {
      e.preventDefault();
    };

    //document.addEventListener("wheel", preventDefault, { passive: false });

    return () => {
      window.removeEventListener("resize", calculateHeight);
      //document.removeEventListener("wheel", preventDefault);

      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";

      const styleEl = document.getElementById("scroll-lock-styles");
      if (styleEl) {
        styleEl.remove();
      }

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const hasResults =
    !showProgress &&
    watch("resultRunner")?.reportUrl &&
    typeof watch("resultRunner")?.results?.passed === "number" &&
    typeof watch("resultRunner")?.results?.totalTests === "number";

  const isMonacoReadOnly = false;

  return (
    <div
      ref={mainContainerRef}
      className="ur-editor-page flex flex-col w-full"
      style={{
        height: contentHeight,
        maxHeight: contentHeight,
        overflow: "hidden",
      }}
    >
      <div className="grid h-full">
        <div className="flex gap-2 h-full overflow-hidden">
          <div className="flex-1 overflow-hidden relative">
            <div className="overflow-hidden h-full">
              {editorContentLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-card/80 z-10">
                  <div className="flex flex-col items-center">
                    <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                    <span className="mt-2 text-sm text-muted-foreground">
                      Loading test suite content...
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-full pt-1">
                  <MonacoEditor
                    language="robotframework"
                    value={displayedContent}
                    onChange={handleMonacoEditorChange}
                    projectName={projectName}
                    readOnly={isMonacoReadOnly}
                  />
                </div>
              )}

              {hasDraft && (
                <div className="absolute bottom-1 right-4 z-10 flex items-center gap-2 bg-background/70 dark:bg-background/70 backdrop-blur-sm border border-border px-3 py-1.5 rounded-md shadow-sm">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <History className="h-3 w-3" />
                    <span>Auto-saved {formatDraftSavedTime(lastSaved)}</span>
                  </div>
                  <Button
                    onClick={handleResetToOriginal}
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 py-0 text-xs text-muted-foreground hover:text-red-500 hover:bg-background/80"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete draft
                  </Button>
                </div>
              )}

              {showProgress && (
                <div className="absolute bottom-0 left-0 w-full bg-blue-700 rounded-full h-2 overflow-hidden z-50">
                  <div className="bg-blue-700 w-full h-full rounded-full transition-all duration-300 progress-stripes"></div>
                </div>
              )}
            </div>
          </div>

          <div className="w-[35%] flex flex-col overflow-hidden">
            <div className="border rounded-lg bg-card p-2 flex flex-col gap-2 mt-2">
              <div className="flex items-center gap-2">
                <span className="whitespace-nowrap font-medium w-[80px]">
                  Test Suite:
                </span>
                <Input
                  id="test-name"
                  {...register("name")}
                  placeholder="Enter test case name"
                  className="flex-1 h-7"
                  onChange={handleNameChange}
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="whitespace-nowrap font-medium w-[80px]">
                  Tags:
                </span>
                <TagInput
                  value={tags}
                  onChange={handleTagsChange}
                  placeholder="Enter tags"
                  className="flex-1 h-7"
                />
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      router.push(`/automation-test?projectId=${projectId}`)
                    }
                    size="sm"
                    className="w-1/2 h-7"
                  >
                    {isLoading && (
                      <LoaderCircle className="animate-spin mr-2" />
                    )}
                    Cancel
                  </Button>

                  {projectId &&
                    (testSuiteId ? (
                      <Button
                        onClick={handleEdit}
                        disabled={isLoading}
                        className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white h-7"
                        size="sm"
                      >
                        {isLoading && (
                          <LoaderCircle className="animate-spin mr-2" />
                        )}
                        Save
                      </Button>
                    ) : (
                      <Button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white h-7"
                        size="sm"
                      >
                        {isLoading && (
                          <LoaderCircle className="animate-spin mr-2" />
                        )}
                        Create
                      </Button>
                    ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="default"
                    className="w-1/2 bg-gray-600 hover:bg-gray-700 text-white h-7"
                    size="sm"
                    onClick={handleOpenResults}
                    disabled={!hasResults}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Results
                    {hasResults
                      ? ` (${watch("resultRunner").results.passed}/${
                          watch("resultRunner").results.totalTests
                        })`
                      : ""}
                  </Button>

                  <Button
                    onClick={handleRunTest}
                    disabled={isLoading}
                    className="w-1/2 bg-green-700 text-white hover:bg-green-800 h-7"
                    size="sm"
                  >
                    {isLoading ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Run Test
                  </Button>
                </div>

                {testSuiteDetail && (
                  <JiraLinkButton
                    jiraConnection={testSuiteDetail.jiraConnection}
                    testSuiteId={testSuiteId}
                    testSuiteName={testSuiteDetail.name}
                    projectId={projectId}
                    projectName={projectName}
                    onRefresh={refetchTestSuite}
                    size="sm"
                    className="w-full h-7"
                  />
                )}
              </div>
            </div>

            <div className="border rounded-lg bg-card flex-1 overflow-hidden flex flex-col mt-4">
              <Tabs
                value={rightPanelActiveTab}
                onValueChange={setRightPanelActiveTab}
                className="flex flex-col h-full"
              >
                <TabsList className="grid w-full grid-cols-3">
                  {" "}
                  <TabsTrigger value="testStructure">
                    Test Structure
                  </TabsTrigger>{" "}
                  {/* Tab mới */}
                  <TabsTrigger value="assistant">Assistant</TabsTrigger>
                  <TabsTrigger value="comments">Comments</TabsTrigger>
                </TabsList>
                <TabsContent
                  value="testStructure"
                  className="flex-1 overflow-hidden p-0 flex flex-col"
                >
                  <TestStructurePanel
                    parsedSections={parsedSections}
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                  />
                </TabsContent>
                <TabsContent
                  value="assistant"
                  className="flex-1 overflow-hidden p-0"
                >
                  <ChatPanel />
                </TabsContent>
                <TabsContent
                  value="comments"
                  className="flex-1 overflow-hidden p-0"
                >
                  <CommentPanel
                    projectId={projectId}
                    testSuiteId={testSuiteId}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
