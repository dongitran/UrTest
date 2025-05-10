"use client";

import { useState, useEffect, Fragment, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";
import MonacoEditor from "@/components/MonacoEditor";
import { TestResourceApi } from "@/lib/api";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import ChatPanel from "@/components/ChatPanel";

export default function NewResourcePage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const resourceId = searchParams.get("resourceId");
  const slug = searchParams.get("slug");
  const router = useRouter();

  const [scriptContent, setScriptContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editorHeight, setEditorHeight] = useState("calc(100vh - 260px)");

  const { data: resourceDetail } = useQuery({
    queryKey: ["detail-test-resource" + resourceId],
    queryFn: () => {
      return TestResourceApi().get(resourceId, { projectId });
    },
    enabled: resourceId ? true : false,
  });

  const { register, getValues, setValue } = useForm();

  useEffect(() => {
    if (resourceDetail?.testResource && resourceId) {
      setValue("title", resourceDetail.testResource.title);
      setValue("description", resourceDetail.testResource.description);
      setScriptContent(resourceDetail.testResource.content);
    }
  }, [resourceDetail, resourceId, setValue]);

  const handleEdit = async () => {
    const data = getValues();
    if (!data.title?.trim()) {
      toast.error("Resource name is required");
      return;
    }
    if (!resourceId) {
      toast.error("Missing resourceId value, cannot edit");
      return;
    }
    try {
      setIsLoading(true);
      await TestResourceApi().patch(resourceId, {
        ...data,
        content: scriptContent,
        projectId,
      });

      toast.success("Resource edited successfully");
      router.push(`/test-management?projectId=${projectId}`);
    } catch (error) {
      toast.error("Error editing resource");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    const data = getValues();
    if (!data.title?.trim()) {
      toast.error("Resource name is required");
      return;
    }
    if (!projectId) {
      toast.error("Missing ProjectId value, cannot create");
      return;
    }
    if (!scriptContent || !scriptContent.trim()) {
      toast.error("Please enter content for the resource");
      return;
    }
    try {
      setIsLoading(true);
      await TestResourceApi().create({
        ...data,
        content: scriptContent,
        projectId,
      });

      toast.success("Resource created successfully");
      router.push(`/test-management?projectId=${projectId}`);
    } catch (error) {
      console.error("Error saving resource:", error);
      toast.error("Failed to save resource");
    } finally {
      setIsLoading(false);
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
        <div className="flex gap-6">
          <div className="w-[70%] gap-4 p-6 border rounded-lg bg-card">
            <div className="flex items-center gap-6">
              <div className="flex-1 flex items-center gap-2">
                <span className="whitespace-nowrap font-medium">
                  Resource Name:
                </span>
                <Input
                  id="resource-name"
                  {...register("title")}
                  placeholder="Enter resource name"
                  className="w-full"
                />
              </div>
              <div className="flex-1 flex items-center gap-2">
                <span className="whitespace-nowrap font-medium">
                  Description:
                </span>
                <Input
                  id="resource-description"
                  {...register("description")}
                  placeholder="Enter description"
                  className="w-full"
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
                  {resourceId ? (
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
            </div>
          </div>

          <div className="w-[30%]">
            <ChatPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
