"use client";

import { useState, useEffect, Fragment, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { LoaderCircle, Play, RefreshCw, History } from "lucide-react";
import MonacoEditor from "@/components/MonacoEditor";
import TagInput from "@/components/TagInput";
import { TestSuiteApi } from "@/lib/api";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChatPanel from "@/components/ChatPanel";
import CommentPanel from "@/components/CommentPanel";
import {
  saveTestSuiteDraft,
  getTestSuiteDraft,
  clearTestSuiteDraft,
  formatDraftSavedTime,
} from "@/utils/testSuiteDrafts";

export default function NewTestCasePage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const testSuiteId = searchParams.get("testSuiteId");
  const slug = searchParams.get("slug");
  const router = useRouter();

  const [tags, setTags] = useState([]);
  const [showProgress, setShowProgress] = useState(false);
  const [scriptContent, setScriptContent] = useState(
    `*** Settings ***\nResource    ../common-imports.robot\nResource    ./resources/init.robot\n`
  );
  const [isLoading, setIsLoading] = useState(false);
  const [editorHeight, setEditorHeight] = useState("calc(100vh - 260px)");
  const [hasDraft, setHasDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [draftChecked, setDraftChecked] = useState(false);

  const { data: testSuiteDetail } = useQuery({
    queryKey: ["detail-test-suite" + testSuiteId],
    queryFn: () => {
      return TestSuiteApi().detail(testSuiteId);
    },
    enabled: testSuiteId ? true : false,
  });

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

  const autoSave = useCallback(() => {
    if (!autoSaveEnabled || !projectId) return;

    const data = getValues();
    const draftData = {
      name: data.name || "",
      tags: tags,
      content: scriptContent,
    };

    if (saveTestSuiteDraft(projectId, testSuiteId, draftData)) {
      setLastSaved(new Date().toISOString());
      setHasDraft(true);
    }
  }, [autoSaveEnabled, projectId, testSuiteId, getValues, tags, scriptContent]);

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
  }, [scriptContent, tags, autoSave]);

  useEffect(() => {
    if (!projectId) return;

    setDraftChecked(false);

    const draft = getTestSuiteDraft(projectId, testSuiteId);
    if (draft) {
      setHasDraft(true);
      setLastSaved(draft.lastSaved);

      setValue("name", draft.name);
      setTags(draft.tags || []);
      setScriptContent(draft.content);
    } else {
      setHasDraft(false);
    }

    setDraftChecked(true);
  }, [projectId, testSuiteId, setValue]);

  useEffect(() => {
    if (testSuiteDetail && draftChecked && !hasDraft) {
      setValue("name", testSuiteDetail.name);
      setTags(testSuiteDetail.tags || []);
      setScriptContent(testSuiteDetail.content);
      if (testSuiteDetail?.params?.resultRuner) {
        setValue("resultRuner", testSuiteDetail.params.resultRuner);
      }
    }
  }, [testSuiteDetail, hasDraft, draftChecked, setValue]);

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
      await TestSuiteApi().patch(testSuiteId, {
        ...data,
        tags,
        content: scriptContent,
        projectId,
      });

      clearTestSuiteDraft(projectId, testSuiteId);
      setHasDraft(false);

      toast.success(`Test script edited successfully`);
      router.push(`/test-management?projectId=${projectId}`);
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
      await TestSuiteApi().post({
        ...data,
        tags,
        content: scriptContent,
        projectId,
      });

      clearTestSuiteDraft(projectId, testSuiteId || "new");
      setHasDraft(false);

      toast.success("Test case saved successfully");
      router.push(`/test-management?projectId=${projectId}`);
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
      const { resultRuner, duration } = await TestSuiteApi().draftExecute({
        content: scriptContent,
        projectId,
      });
      setValue("resultRuner", resultRuner);
      setValue("duration", duration);
    } catch (error) {
      toast.error("Failed to run test");
    } finally {
      setShowProgress(false);
      setIsLoading(false);
    }
  };

  const handleResetToOriginal = () => {
    if (testSuiteDetail) {
      setValue("name", testSuiteDetail.name);
      setTags(testSuiteDetail.tags || []);
      setScriptContent(testSuiteDetail.content);
      if (testSuiteDetail?.params?.resultRuner) {
        setValue("resultRuner", testSuiteDetail.params.resultRuner);
      }

      clearTestSuiteDraft(projectId, testSuiteId);
      setHasDraft(false);
      setLastSaved(null);

      toast.success("Restored to original version");
    } else {
      setValue("name", "");
      setTags([]);
      setScriptContent(
        `*** Settings ***\nResource    ../common-imports.robot\nResource    ./resources/init.robot\n`
      );

      clearTestSuiteDraft(projectId, "new");
      setHasDraft(false);
      setLastSaved(null);

      toast.success("Draft deleted");
    }
  };

  useEffect(() => {
    const updateEditorHeight = () => {
      setEditorHeight("calc(100vh - 260px)");
    };
    updateEditorHeight();
    window.addEventListener("resize", updateEditorHeight);
    return () => window.removeEventListener("resize", updateEditorHeight);
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="grid gap-6">
        <div className="flex gap-6 h-[calc(100vh-120px)]">
          <div className="w-[70%] gap-4 p-6 border rounded-lg bg-card">
            <div className="flex items-center gap-4">
              <div className="flex-1 flex items-center gap-2">
                <span className="whitespace-nowrap font-medium">
                  Test Suite:
                </span>
                <Input
                  id="test-name"
                  {...register("name")}
                  placeholder="Enter test case name"
                  className="w-full"
                />
              </div>
              <div className="flex-1 flex items-center gap-2">
                <span className="whitespace-nowrap font-medium">Tags:</span>
                <TagInput
                  value={tags}
                  onChange={setTags}
                  placeholder="Press Enter to add tags"
                />
              </div>
            </div>

            <div className="grid gap-2 mt-4">
              <div
                className="border rounded-sm bg-card overflow-hidden"
                style={{ height: editorHeight }}
              >
                <MonacoEditor
                  language="robotframework"
                  value={scriptContent}
                  onChange={setScriptContent}
                  slug={slug}
                />
              </div>
            </div>

            {showProgress && (
              <div className="w-full bg-blue-700 rounded-full h-2 overflow-hidden mt-4">
                <div className="bg-blue-700 w-full h-full rounded-full transition-all duration-300 progress-stripes"></div>
              </div>
            )}

            {!showProgress && watch("resultRuner")?.reportUrl && (
              <div className="w-full min-h-[650px] overflow-auto mt-4">
                <iframe
                  src={`${watch("resultRuner").reportUrl}/report.html`}
                  className="w-full h-full border-none"
                  allowFullScreen
                ></iframe>
              </div>
            )}

            <div className="flex items-center pt-4">
              <Button
                variant="outline"
                onClick={() =>
                  router.push(`/test-management?projectId=${projectId}`)
                }
                size="sm"
                className="mr-2"
              >
                {isLoading && <LoaderCircle className="animate-spin mr-2" />}
                Cancel
              </Button>

              {projectId && (
                <Fragment>
                  {testSuiteId ? (
                    <Fragment>
                      <Button
                        onClick={handleEdit}
                        disabled={isLoading}
                        className=""
                        size="sm"
                      >
                        {isLoading && (
                          <LoaderCircle className="animate-spin mr-2" />
                        )}
                        Edit
                      </Button>
                    </Fragment>
                  ) : (
                    <Fragment>
                      <Button
                        onClick={handleSave}
                        disabled={isLoading}
                        className=""
                        size="sm"
                      >
                        {isLoading && (
                          <LoaderCircle className="animate-spin mr-2" />
                        )}
                        Create
                      </Button>
                    </Fragment>
                  )}
                </Fragment>
              )}

              <div className="ml-auto flex items-center gap-3">
                {hasDraft && (
                  <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                    <History className="h-3 w-3" />
                    <span>Auto-saved {formatDraftSavedTime(lastSaved)}</span>
                    <Button
                      onClick={handleResetToOriginal}
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 py-0 text-xs"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      {testSuiteId ? "Restore original" : "Delete draft"}
                    </Button>
                  </div>
                )}

                <Button
                  onClick={handleRunTest}
                  disabled={isLoading}
                  className="bg-green-700 text-white hover:bg-green-800"
                  size="sm"
                >
                  {isLoading ? (
                    <LoaderCircle className="animate-spin mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Run Test
                </Button>
              </div>
            </div>
          </div>

          <div className="w-[30%] h-full">
            <Tabs defaultValue="assistant" className="h-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="assistant">UrTest Assistant</TabsTrigger>
                <TabsTrigger value="comments">Comments</TabsTrigger>
              </TabsList>
              <TabsContent
                value="assistant"
                className="mt-2 h-[calc(100%-40px)]"
              >
                <ChatPanel />
              </TabsContent>
              <TabsContent
                value="comments"
                className="mt-2 h-[calc(100%-40px)]"
              >
                <CommentPanel projectId={projectId} testSuiteId={testSuiteId} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
