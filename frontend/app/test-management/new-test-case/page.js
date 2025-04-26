"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronRight, Play } from "lucide-react";
import MonacoEditor from "@/components/MonacoEditor";

export default function NewTestCasePage() {
  const router = useRouter();
  const [testName, setTestName] = useState("");
  const [tags, setTags] = useState("");
  const [scriptContent, setScriptContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!testName.trim()) {
      toast.error("Test name is required");
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

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
      <div className="flex justify-between items-center">
        <div className="flex items-center text-sm">
          <Link href="/test-management" className="text-blue-500 hover:underline">
            Projects
          </Link>
          <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />
          <Link href="/test-management" className="text-blue-500 hover:underline">
            E-Commerce Platform
          </Link>
          <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />
          <span>New Test Case</span>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="grid gap-2">
          <h1 className="text-2xl font-bold">New Test Case</h1>
        </div>

        <div className="grid gap-4 p-6 border rounded-lg">
          <div className="grid gap-2">
            <label htmlFor="test-name" className="text-sm font-medium">
              Test Name*
            </label>
            <Input
              id="test-name"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              placeholder="Enter test case name"
              className="w-full"
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="tags" className="text-sm font-medium">
              Tags
            </label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="login, robot, api, etc."
              className="w-full"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Test Script</label>
            <div className="h-[500px] border rounded-sm">
              <MonacoEditor
                language="javascript"
                value={scriptContent}
                onChange={setScriptContent}
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-4">
            <div>
              <Button
                variant="outline"
                onClick={() => router.push("/test-management")}
                className="mr-2"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Save
              </Button>
            </div>
            <Button
              onClick={handleRunTest}
              className="bg-green-600 hover:bg-green-700"
            >
              <Play className="h-4 w-4 mr-2" />
              Run Test
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}