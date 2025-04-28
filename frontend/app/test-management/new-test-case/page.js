"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { LoaderCircle, Play, Terminal } from "lucide-react";
import MonacoEditor from "@/components/MonacoEditor";
import TagInput from "@/components/TagInput";
import { TestSuiteApi } from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function NewTestCasePage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const router = useRouter();
  const [tags, setTags] = useState([]);
  const [scriptContent, setScriptContent] = useState(
    `*** Settings ***\nResource    ../../resources/common_imports.robot\n`
  );
  const [isLoading, setIsLoading] = useState(false);
  const [editorHeight, setEditorHeight] = useState("calc(100vh - 320px)");
  const { register, getValues } = useForm();
  useEffect(() => {
    const updateEditorHeight = () => {
      setEditorHeight("calc(100vh - 260px)");
    };
    updateEditorHeight();
    window.addEventListener("resize", updateEditorHeight);
    return () => window.removeEventListener("resize", updateEditorHeight);
  }, []);

  const handleSave = async () => {
    const data = getValues();
    if (!data.name?.trim()) {
      toast.error("Test name is required");
      return;
    }
    if (!projectId) {
      toast.error("Không có giá trị ProjectId nên không thể tạo");
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
      toast.success("Test case saved successfully");
      router.push(`/test-management?id=${projectId}`);
    } catch (error) {
      console.error("Error saving test case:", error);
      toast.error("Failed to save test case");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunTest = () => {
    if (!testName.trim()) {
      toast.error("Test name is required");
      return;
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="grid gap-6">
        <div className="grid gap-4 p-6 border rounded-lg bg-card">
          <div className="grid grid-cols-1 gap-3 ">
            <div className="flex items-center gap-2 flex-1">
              <Input id="test-name" {...register("name")} placeholder="Enter test case name" className="w-full" />
            </div>

            <div className="flex items-center gap-2">
              <TagInput value={tags} onChange={setTags} placeholder="Press Enter to add tags" />
            </div>
            <Textarea placeholder="Mô tả nội dung của kịch bản test..." {...register("description")} />
          </div>

          <Alert className="">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Lưu ý</AlertTitle>
            <AlertDescription>Khi viết 1 kịch bản test, thì có thể có 1 hoặc nhiều testcase.</AlertDescription>
          </Alert>

          <div className="grid gap-2">
            <div className="border rounded-sm bg-card overflow-hidden" style={{ height: editorHeight }}>
              <MonacoEditor language="javascript" value={scriptContent} onChange={setScriptContent} />
            </div>
          </div>

          <div className="flex justify-between items-center pt-4">
            <div>
              <Button variant="outline" onClick={() => router.push("/test-management")} size="sm" className="mr-2">
                {isLoading && <LoaderCircle className="animate-spin" />}
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isLoading} className="" size="sm">
                {isLoading && <LoaderCircle className="animate-spin" />}
                Save
              </Button>
            </div>
            <Button
              onClick={handleRunTest}
              disabled={isLoading}
              className="bg-green-700 text-white hover:bg-green-800"
              size="sm"
            >
              {isLoading ? <LoaderCircle className="animate-spin" /> : <Play className="h-4 w-4" />}
              Run Test
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
