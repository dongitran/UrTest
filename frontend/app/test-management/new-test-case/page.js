"use client";

import { useState, useEffect, Fragment } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Copy, LoaderCircle, Play, Terminal } from "lucide-react";
import MonacoEditor from "@/components/MonacoEditor";
import TagInput from "@/components/TagInput";
import { TestSuiteApi } from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";

export default function NewTestCasePage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const testSuiteId = searchParams.get("testSuiteId");
  const router = useRouter();
  const [tags, setTags] = useState([]);
  const [showProgress, setShowProgress] = useState(false);
  const [scriptContent, setScriptContent] = useState(
    `*** Settings ***\nResource    ../../resources/common_imports.robot\n`
  );
  const [isLoading, setIsLoading] = useState(false);
  const [editorHeight, setEditorHeight] = useState("calc(100vh - 320px)");
  const { data: testSuiteDetail } = useQuery({
    queryKey: ["detail-test-suite" + testSuiteId],
    queryFn: () => {
      return TestSuiteApi().detail(testSuiteId);
    },
    enabled: testSuiteId ? true : false,
  });
  const { register, getValues, setValue, watch } = useForm();

  const handleEdit = async () => {
    const data = getValues();
    if (!data.name?.trim()) {
      toast.error("Test name is required");
      return;
    }
    if (!testSuiteId) {
      toast.error("Không có giá trị testSuiteId nên không thể chỉnh sửa");
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
      toast.success(`Chỉnh sửa kịch bản test thành công`);
    } catch (error) {
      toast.error(`Có lỗi khi chỉnh sửa kịch bản test`);
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
      toast.success("Đã yêu cầu thực hiện kịch bản test. Vui lòng đợi kết quả");
      setShowProgress(true);
      setIsLoading(true);
      const { resultRuner, duration } = await TestSuiteApi().draftExecute({
        content: scriptContent,
        projectId,
      });
      setValue("resultRuner", resultRuner);
      setValue("duration", duration);
    } catch (error) {
    } finally {
      setShowProgress(false);
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

  useEffect(() => {
    if (testSuiteDetail) {
      setValue("name", testSuiteDetail.name);
      setValue("description", testSuiteDetail.description);
      setTags(testSuiteDetail.tags || []);
      setScriptContent(testSuiteDetail.content);
      setValue("fileName", testSuiteDetail.fileName ? `${testSuiteDetail.fileName}.robot` : null);
      if (testSuiteDetail?.params?.resultRuner) {
        setValue("resultRuner", testSuiteDetail.params.resultRuner);
      }
    }
  }, [testSuiteDetail]);
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
            <div className="flex gap-3">
              <Input
                className="w-full"
                placeholder="Tên file sẽ được tự động tạo ra khi bạn tạo thành công kịch bản test"
                disabled
                {...register("fileName")}
              />
              <Button
                size="icon"
                disabled={testSuiteDetail && testSuiteDetail.fileName ? false : true}
                onClick={async () => {
                  const fileName = `${testSuiteDetail.fileName}.robot`;
                  await navigator.clipboard.writeText(fileName);
                  toast(`Đã copy tên file: ${fileName}.robot`);
                }}
              >
                <Copy />
              </Button>
            </div>
          </div>

          <Alert className="">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Lưu ý</AlertTitle>
            <AlertDescription>Khi viết 1 kịch bản test, thì có thể có 1 hoặc nhiều testcase.</AlertDescription>
          </Alert>

          <div className="grid gap-2">
            <div className="border rounded-sm bg-card overflow-hidden" style={{ height: editorHeight }}>
              <MonacoEditor language="robotframework" value={scriptContent} onChange={setScriptContent} />
            </div>
          </div>
          {showProgress && (
            <div className="w-full bg-blue-700 rounded-full h-2 overflow-hidden">
              <div className="bg-blue-700 w-full h-full rounded-full transition-all duration-300 progress-stripes"></div>
            </div>
          )}
          {!showProgress && watch("resultRuner")?.reportUrl && (
            <div className="w-full min-h-[650px] overflow-auto">
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
              onClick={() => router.push(`/test-management?projectId=${projectId}`)}
              size="sm"
              className="mr-2"
            >
              {isLoading && <LoaderCircle className="animate-spin" />}
              Cancel
            </Button>
            {projectId && (
              <Fragment>
                {testSuiteId ? (
                  <Fragment>
                    <Button onClick={handleEdit} disabled={isLoading} className="" size="sm">
                      {isLoading && <LoaderCircle className="animate-spin" />}
                      Edit
                    </Button>
                  </Fragment>
                ) : (
                  <Fragment>
                    <Button onClick={handleSave} disabled={isLoading} className="" size="sm">
                      {isLoading && <LoaderCircle className="animate-spin" />}
                      Create
                    </Button>
                  </Fragment>
                )}
              </Fragment>
            )}
            <div className="ml-auto"></div>
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
