"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  LoaderCircle,
  ArrowLeft,
  FileText,
  Tag,
  Clock,
  User,
  Calendar,
  Zap,
  Target,
  Hash,
} from "lucide-react";
import TagInput from "@/components/TagInput";
import { useForm } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ManualTestApi } from "@/lib/api";
import { PROJECT_DETAIL_QUERY_KEY } from "@/hooks/useProjects";

const priorityOptions = [
  {
    value: "high",
    label: "High",
    color: "bg-red-500 hover:bg-red-600",
    icon: "🔥",
  },
  {
    value: "medium",
    label: "Medium",
    color: "bg-amber-500 hover:bg-amber-600",
    icon: "⚡",
  },
  {
    value: "low",
    label: "Low",
    color: "bg-green-500 hover:bg-green-600",
    icon: "🌱",
  },
];

const categoryOptions = [
  { value: "functional", label: "Functional Test", icon: "⚙️" },
  { value: "ui", label: "UI Test", icon: "🎨" },
  { value: "integration", label: "Integration Test", icon: "🔗" },
  { value: "api", label: "API Test", icon: "🌐" },
  { value: "performance", label: "Performance Test", icon: "🚀" },
  { value: "security", label: "Security Test", icon: "🔒" },
];

const mockUsers = [
  { id: 1, name: "John Doe", email: "john.doe@company.com", avatar: "JD" },
  {
    id: 2,
    name: "Alice Smith",
    email: "alice.smith@company.com",
    avatar: "AS",
  },
  {
    id: 3,
    name: "Bob Johnson",
    email: "bob.johnson@company.com",
    avatar: "BJ",
  },
  { id: 4, name: "Sarah Chen", email: "sarah.chen@company.com", avatar: "SC" },
];

export default function ManualTestCaseEditor() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const testCaseId = searchParams.get("testCaseId");
  const projectName = decodeURIComponent(searchParams.get("project") || "");
  const router = useRouter();
  const queryClient = useQueryClient();

  const [tags, setTags] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [priority, setPriority] = useState("medium");

  const { register, getValues, setValue, watch, reset } = useForm({
    defaultValues: {
      name: "",
      category: "",
      estimatedTime: "",
      description: "",
      assignedTo: "",
      dueDate: "",
    },
  });

  const { data: testCaseDetail, isLoading: testCaseLoading } = useQuery({
    queryKey: ["manual-test-case", testCaseId],
    queryFn: () => ManualTestApi().getTestCase(testCaseId),
    enabled: !!testCaseId,
  });

  useEffect(() => {
    if (testCaseDetail && testCaseId) {
      reset({
        name: testCaseDetail.name,
        category: testCaseDetail.category,
        estimatedTime: testCaseDetail.estimatedTime,
        description: testCaseDetail.description,
        assignedTo: testCaseDetail.assignedTo,
        dueDate: testCaseDetail.dueDate,
      });
      setPriority(testCaseDetail.priority || "medium");
      setTags(testCaseDetail.tags || []);
    }
  }, [testCaseDetail, testCaseId, reset]);

  const handleSave = async () => {
    const data = getValues();
    if (!data.name?.trim()) {
      toast.error("Test case name is required");
      return;
    }
    if (!data.category) {
      toast.error("Category is required");
      return;
    }
    if (!data.description?.trim()) {
      toast.error("Test description is required");
      return;
    }

    try {
      setIsLoading(true);
      const payload = {
        ...data,
        priority,
        tags,
        projectId,
      };

      if (testCaseId) {
        await ManualTestApi().updateTestCase(testCaseId, payload);
        toast.success("Test case updated successfully");
      } else {
        await ManualTestApi().createTestCase(payload);
        toast.success("Test case created successfully");
      }

      await queryClient.invalidateQueries([
        PROJECT_DETAIL_QUERY_KEY,
        projectId,
      ]);
      await queryClient.invalidateQueries(["manual-test-cases", projectId]);

      localStorage.setItem("manual_test_updated", "true");
      router.push(`/manual-test?projectId=${projectId}`);
    } catch (error) {
      console.error("Error saving test case:", error);
      toast.error("Failed to save test case");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/manual-test?projectId=${projectId}`);
  };

  const handleSaveAsDraft = async () => {
    try {
      const data = getValues();
      const payload = {
        ...data,
        priority,
        tags,
        projectId,
        status: "draft",
      };

      if (testCaseId) {
        await ManualTestApi().updateTestCase(testCaseId, payload);
      } else {
        await ManualTestApi().createTestCase(payload);
      }

      toast.success("Draft saved successfully");
    } catch (error) {
      toast.error("Failed to save draft");
    }
  };

  if (testCaseLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedCategory = categoryOptions.find(
    (cat) => cat.value === watch("category")
  );
  const selectedUser = mockUsers.find(
    (u) => u.id.toString() === watch("assignedTo")
  );

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 min-h-screen">
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
                {testCaseId ? "Edit Test Case" : "Create Test Case"}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {testCaseId
                  ? "Modify your test case details"
                  : "Create a new manual test case for your project"}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleSaveAsDraft}
              disabled={isLoading}
              className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 dark:hover:bg-blue-900/20"
            >
              Save as Draft
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isLoading && (
                <LoaderCircle className="animate-spin mr-2 h-4 w-4" />
              )}
              {testCaseId ? "Update Test Case" : "Create Test Case"}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-xl border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-xl">Test Case Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="name"
                      className="text-sm font-medium flex items-center gap-2"
                    >
                      <Hash className="h-4 w-4 text-slate-500" />
                      Test Case Name *
                    </Label>
                    <Input
                      id="name"
                      {...register("name")}
                      placeholder="Enter descriptive test case name"
                      className="h-11 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="category"
                      className="text-sm font-medium flex items-center gap-2"
                    >
                      <Target className="h-4 w-4 text-slate-500" />
                      Category *
                    </Label>
                    <Select
                      value={watch("category")}
                      onValueChange={(value) => setValue("category", value)}
                    >
                      <SelectTrigger className="h-11 border-slate-200 dark:border-slate-700 focus:border-blue-500">
                        <div className="flex items-center gap-2">
                          {selectedCategory && (
                            <span>{selectedCategory.icon}</span>
                          )}
                          <SelectValue placeholder="Select test category" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <span>{option.icon}</span>
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Zap className="h-4 w-4 text-slate-500" />
                      Priority *
                    </Label>
                    <div className="flex gap-2">
                      {priorityOptions.map((option) => (
                        <Button
                          key={option.value}
                          type="button"
                          variant={
                            priority === option.value ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setPriority(option.value)}
                          className={`flex-1 gap-2 h-10 transition-all duration-200 ${
                            priority === option.value
                              ? `${option.color} text-white shadow-lg`
                              : "hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
                        >
                          <span>{option.icon}</span>
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="estimatedTime"
                      className="text-sm font-medium flex items-center gap-2"
                    >
                      <Clock className="h-4 w-4 text-slate-500" />
                      Estimated Time (minutes)
                    </Label>
                    <Input
                      id="estimatedTime"
                      type="number"
                      {...register("estimatedTime")}
                      placeholder="15"
                      className="h-11 border-slate-200 dark:border-slate-700 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="description"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4 text-slate-500" />
                    What to Test *
                  </Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    placeholder="Describe the test steps, expected results, and acceptance criteria..."
                    rows={6}
                    className="resize-none border-slate-200 dark:border-slate-700 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Tag className="h-4 w-4 text-slate-500" />
                    Tags
                  </Label>
                  <TagInput
                    value={tags}
                    onChange={setTags}
                    placeholder="Add tags to categorize your test case..."
                    className="w-full h-11 border-slate-200 dark:border-slate-700 focus:border-blue-500 transition-colors"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="shadow-xl border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <User className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle className="text-lg">Assignment</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="assignedTo" className="text-sm font-medium">
                    Assigned To
                  </Label>
                  <Select
                    value={watch("assignedTo")}
                    onValueChange={(value) => setValue("assignedTo", value)}
                  >
                    <SelectTrigger className="h-11 border-slate-200 dark:border-slate-700">
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                              {user.avatar}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium">{user.name}</span>
                              <span className="text-xs text-slate-500">
                                {user.email}
                              </span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="dueDate"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <Calendar className="h-4 w-4 text-slate-500" />
                    Due Date
                  </Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    {...register("dueDate")}
                    className="h-11 border-slate-200 dark:border-slate-700 focus:border-blue-500 transition-colors"
                  />
                </div>

                {selectedUser && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                        {selectedUser.avatar}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {selectedUser.name}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {selectedUser.email}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-xl border-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50">
              <CardContent className="p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Last saved:</span>
                    <span className="font-medium">2 minutes ago</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Status:</span>
                    <span className="font-medium text-amber-600 dark:text-amber-400">
                      Draft
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center">
          <div className="flex gap-4 p-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleSaveAsDraft}
              disabled={isLoading}
              className="px-6 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
            >
              Save as Draft
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="px-8 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isLoading && (
                <LoaderCircle className="animate-spin mr-2 h-4 w-4" />
              )}
              {testCaseId ? "Update Test Case" : "Create Test Case"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
