"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { LoaderCircle, Play } from "lucide-react";
import MonacoEditor from "@/components/MonacoEditor";
import TagInput from "@/components/TagInput";

export default function NewTestCasePage() {
  const router = useRouter();
  const [testName, setTestName] = useState("");
  const [tags, setTags] = useState([]);
  const [scriptContent, setScriptContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editorHeight, setEditorHeight] = useState("calc(100vh - 320px)");

  useEffect(() => {
    const updateEditorHeight = () => {
      setEditorHeight("calc(100vh - 260px)");
    };
    updateEditorHeight();
    window.addEventListener("resize", updateEditorHeight);
    return () => window.removeEventListener("resize", updateEditorHeight);
  }, []);

  const handleSave = async () => {
    if (!testName.trim()) {
      toast.error("Test name is required");
      return;
    }
    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
      toast.success("Test case saved successfully");
      router.push("/test-management");
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
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2 flex-1">
              <label htmlFor="test-name" className="text-sm font-medium whitespace-nowrap">
                Test Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="test-name"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                placeholder="Enter test case name"
                className="w-full"
              />
            </div>

            <div className="flex items-center gap-2 w-1/3">
              <label htmlFor="tags" className="text-sm font-medium whitespace-nowrap">
                Tags
              </label>
              <TagInput value={tags} onChange={setTags} placeholder="Press Enter to add tags" />
            </div>
          </div>

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
