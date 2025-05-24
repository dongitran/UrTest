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
import { LoaderCircle } from "lucide-react";
import TagInput from "@/components/TagInput";
import { useForm } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ManualTestApi } from "@/lib/api";
import { PROJECT_DETAIL_QUERY_KEY } from "@/hooks/useProjects";

const priorityOptions = [
  { value: "high", label: "High", color: "bg-red-500" },
  { value: "medium", label: "Medium", color: "bg-orange-500" },
  { value: "low", label: "Low", color: "bg-green-500" },
];

const categoryOptions = [
  { value: "functional", label: "Functional Test" },
  { value: "ui", label: "UI Test" },
  { value: "integration", label: "Integration Test" },
  { value: "api", label: "API Test" },
  { value: "performance", label: "Performance Test" },
  { value: "security", label: "Security Test" },
];

const mockUsers = [
  { id: 1, name: "John Doe", email: "john.doe@company.com" },
  { id: 2, name: "Alice Smith", email: "alice.smith@company.com" },
  { id: 3, name: "Bob Johnson", email: "bob.johnson@company.com" },
  { id: 4, name: "Sarah Chen", email: "sarah.chen@company.com" },
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
      notes: "",
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
        notes: testCaseDetail.notes,
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

      await queryClient.invalidateQueries([PROJECT_DETAIL_QUERY_KEY, projectId]);
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
      <div className="flex items-center justify-center min-h-screen">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {testCaseId ? "Edit Test Case" : "Create Test Case"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {testCaseId ? "Modify your test case details" : "Create a new manual test case for your project"}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleSaveAsDraft}
              disabled={isLoading}
            >
              Save as Draft
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading && <LoaderCircle className="animate-spin mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Test Case Name *</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder="Enter test case name"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium">Category *</Label>
                  <Select
                    value={watch("category")}
                    onValueChange={(value) => setValue("category", value)}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Priority *</Label>
                  <div className="flex gap-3">
                    {priorityOptions.map((option) => (
                      <Button
                        key={option.value}
                        type="button"
                        variant={priority === option.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPriority(option.value)}
                        className={`${priority === option.value ? option.color : ""} min-w-[80px]`}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimatedTime" className="text-sm font-medium">Estimated Time (minutes)</Label>
                  <Input
                    id="estimatedTime"
                    type="number"
                    {...register("estimatedTime")}
                    placeholder="15"
                    className="h-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">What to Test *</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Describe what needs to be tested and the expected steps"
                  rows={5}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  {...register("notes")}
                  placeholder="Additional notes, test data, or special instructions"
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Tags</Label>
                <TagInput
                  value={tags}
                  onChange={setTags}
                  placeholder="Add tags (press Enter to add)"
                  className="w-full h-10"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="assignedTo" className="text-sm font-medium">Assigned To</Label>
                  <Select
                    value={watch("assignedTo")}
                    onValueChange={(value) => setValue("assignedTo", value)}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          <div className="flex flex-col">
                            <span>{user.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {user.email}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate" className="text-sm font-medium">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    {...register("dueDate")}
                    className="h-10"
                  />
                </div>
              </div>

              {watch("assignedTo") && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-300">
                        {mockUsers.find(u => u.id.toString() === watch("assignedTo"))?.name.split(' ').map(n => n[0]).join('') || 'JD'}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold">
                        {mockUsers.find(u => u.id.toString() === watch("assignedTo"))?.name || 'John Doe'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {mockUsers.find(u => u.id.toString() === watch("assignedTo"))?.email || 'john.doe@company.com'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between pt-6 border-t">
            <p className="text-sm text-muted-foreground">
              Last saved: 2 minutes ago
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handleSaveAsDraft}
                disabled={isLoading}
              >
                Save as Draft
              </Button>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading && <LoaderCircle className="animate-spin mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}