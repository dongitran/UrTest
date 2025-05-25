"use client";

import { useState, useEffect, useCallback } from "react";
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
  FileText,
  Tag,
  Clock,
  User,
  Calendar,
  Zap,
  Target,
  Hash,
  Plus,
  Bug,
} from "lucide-react";
import TagInput from "@/components/TagInput";
import { useForm } from "react-hook-form";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { ManualTestApi, ProjectApi } from "@/lib/api";
import { PROJECT_DETAIL_QUERY_KEY } from "@/hooks/useProjects";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import CreateBugModal from "@/components/manual-test/CreateBugModal";
import BugList from "@/components/manual-test/BugList";

dayjs.extend(utc);
dayjs.extend(timezone);

const priorityOptions = [
  {
    value: "High",
    label: "High",
    unselectedColor:
      "bg-gray-50 hover:bg-red-100 text-red-500 border-gray-200 " +
      "dark:bg-red-900 dark:text-red-300 dark:border-red-700 " +
      "dark:hover:bg-red-800 dark:hover:text-red-100 dark:hover:border-red-600",
    selectedColor:
      "bg-red-300 hover:bg-red-400 text-white border-red-300 " +
      "dark:bg-red-500 dark:hover:bg-red-600 dark:text-white dark:border-red-500 shadow-sm ring-2 ring-red-50 dark:ring-red-400",
    icon: "🔥",
  },
  {
    value: "Medium",
    label: "Medium",
    unselectedColor:
      "bg-gray-50 hover:bg-amber-100 text-amber-500 border-gray-200 " +
      "dark:bg-amber-900 dark:text-amber-300 dark:border-amber-700 " +
      "dark:hover:bg-amber-800 dark:hover:text-amber-100 dark:hover:border-amber-600",
    selectedColor:
      "bg-amber-300 hover:bg-amber-400 text-white border-amber-300 " +
      "dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-white dark:border-amber-500 shadow-sm ring-2 ring-amber-50 dark:ring-amber-400",
    icon: "⚡",
  },
  {
    value: "Low",
    label: "Low",
    unselectedColor:
      "bg-gray-50 hover:bg-green-100 text-green-500 border-gray-200 " +
      "dark:bg-green-900 dark:text-green-300 dark:border-green-700 " +
      "dark:hover:bg-green-800 dark:hover:text-green-100 dark:hover:border-green-600",
    selectedColor:
      "bg-green-300 hover:bg-green-400 text-white border-green-300 " +
      "dark:bg-green-500 dark:hover:bg-green-600 dark:text-white dark:border-green-500 shadow-sm ring-2 ring-green-50 dark:ring-green-400",
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

export default function ManualTestCaseEditor() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const testCaseId = searchParams.get("testCaseId");
  const router = useRouter();
  const queryClient = useQueryClient();

  const [tags, setTags] = useState([]);
  const [priority, setPriority] = useState("Medium");
  const [lastSaved, setLastSaved] = useState(null);
  const [currentStatus, setCurrentStatus] = useState("Not Started");
  const [isCreateBugModalOpen, setIsCreateBugModalOpen] = useState(false);

  const isEditMode = !!testCaseId;

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting: isTestCaseFormSubmitting },
  } = useForm({
    defaultValues: {
      name: "",
      category: "",
      estimatedTime: "",
      description: "",
      assignedTo: "",
      dueDate: "",
    },
  });

  const {
    data: testCaseDetail,
    isLoading: testCaseLoading,
    isSuccess: testCaseFetched,
  } = useQuery({
    queryKey: ["manual-test-case", testCaseId],
    queryFn: () => ManualTestApi().getTestCase(testCaseId),
    enabled: isEditMode,
  });

  const {
    data: staffQueryData,
    isLoading: staffLoading,
    isSuccess: staffFetched,
  } = useQuery({
    queryKey: ["available-staff", projectId],
    queryFn: () => ProjectApi().getAvailableStaff(projectId),
    enabled: !!projectId,
    select: (response) => response.availableStaff,
  });
  const availableStaff = staffQueryData || [];

  const resetFormWithData = useCallback(
    (data) => {
      const defaultValues = {
        name: data?.name || "",
        category: data?.category || "",
        estimatedTime: data?.estimatedTime?.toString() || "",
        description: data?.description || "",
        assignedTo: data?.assignedToEmail || "",
        dueDate: data?.dueDate ? dayjs(data.dueDate).format("YYYY-MM-DD") : "",
      };
      reset(defaultValues);
      setValue("category", defaultValues.category);
      if (availableStaff && availableStaff.length > 0) {
        const staffExists = availableStaff.some(
          (s) => s.email === defaultValues.assignedTo
        );
        if (staffExists) {
          setValue("assignedTo", defaultValues.assignedTo);
        } else {
          setValue("assignedTo", "");
        }
      } else if (!data?.assignedToEmail) {
        setValue("assignedTo", "");
      }
      setPriority(data?.priority || "Medium");
      setTags(data?.tags || []);
      setCurrentStatus(data?.status || "Not Started");
      setLastSaved(data?.updatedAt || data?.createdAt || null);
    },
    [reset, setValue, availableStaff]
  );

  useEffect(() => {
    if (isEditMode && testCaseFetched && testCaseDetail) {
      if (staffFetched || !testCaseDetail.assignedToEmail) {
        resetFormWithData(testCaseDetail);
      }
    } else if (!isEditMode) {
      resetFormWithData(null);
    }
  }, [
    isEditMode,
    testCaseDetail,
    testCaseFetched,
    staffFetched,
    resetFormWithData,
  ]);

  const testCaseMutation = useMutation({
    mutationFn: (payload) => {
      if (isEditMode) {
        return ManualTestApi().updateTestCase(testCaseId, payload.data);
      } else {
        return ManualTestApi().createTestCase(payload.data);
      }
    },
    onSuccess: async (data, variables) => {
      if (variables.action === "create") {
        toast.success("Test case created successfully");
      } else if (variables.action === "update") {
        toast.success("Test case updated successfully");
      }

      if (isEditMode) {
        await queryClient.invalidateQueries({
          queryKey: ["manual-test-case", testCaseId],
        });
      }
      await queryClient.invalidateQueries({
        queryKey: ["available-staff", projectId],
      });
      await queryClient.invalidateQueries({
        queryKey: [PROJECT_DETAIL_QUERY_KEY, projectId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["manual-test-cases", projectId],
      });

      localStorage.setItem("manual_test_updated", "true");

      if (data && data.id && variables.action === "create") {
        setLastSaved(data.createdAt);
        setCurrentStatus(data.status);
        if (!variables.isSaveAndAddAnother) {
          router.replace(
            `/manual-test/ur-editor?project=${encodeURIComponent(
              searchParams.get("project") || ""
            )}&projectId=${projectId}&testCaseId=${data.id}`
          );
        }
      } else if (data && variables.action === "update") {
        setLastSaved(data.updatedAt || data.createdAt);
        setCurrentStatus(data.status);
      }
    },
    onError: (error) => {
      console.error("Error saving test case:", error);
      toast.error(error.response?.data?.message || "Failed to save test case");
    },
  });

  const processSaveTestCase = async (
    formData,
    statusOverride = null,
    redirectAfterSave = true,
    shouldResetForm = false
  ) => {
    const estTime = formData.estimatedTime;
    const estimatedTimeValue =
      estTime && !isNaN(parseInt(estTime, 10))
        ? parseInt(estTime, 10)
        : undefined;

    const apiPayload = {
      ...formData,
      priority,
      tags,
      projectId,
      estimatedTime: estimatedTimeValue,
      status: statusOverride || currentStatus || "Not Started",
      dueDate: formData.dueDate
        ? dayjs(formData.dueDate).endOf("day").toISOString()
        : null,
    };

    const actionType = isEditMode ? "update" : "create";

    await testCaseMutation.mutateAsync({
      data: apiPayload,
      action: actionType,
      isSaveAndAddAnother: shouldResetForm,
    });

    if (redirectAfterSave && actionType === "update") {
      router.push(`/manual-test?projectId=${projectId}`);
    }
    if (shouldResetForm) {
      resetFormWithData(null);
      toast.success("Ready to create another test case");
    }
  };

  const onValidSubmitTestCase = (data) => {
    processSaveTestCase(data, null, isEditMode, false);
  };

  const handleCancel = () => {
    router.push(`/manual-test?projectId=${projectId}`);
  };

  const handleSaveAndAddAnother = async () => {
    const data = getValues();
    let valid = true;
    if (!data.name?.trim()) {
      toast.error("Test case name is required");
      valid = false;
    }
    if (!data.category) {
      toast.error("Category is required");
      valid = false;
    }
    if (!data.description?.trim()) {
      toast.error("Test description is required");
      valid = false;
    }
    if (!valid) return;

    processSaveTestCase(data, null, false, true);
  };

  const handleBugCreated = () => {
    queryClient.invalidateQueries(["bugs-for-test-case", testCaseId]);
  };

  const openCreateBugModal = (e) => {
    setIsCreateBugModalOpen(true);
  };

  if (
    (isEditMode && testCaseLoading) ||
    (!isEditMode && staffLoading && !staffFetched) ||
    (isEditMode && !testCaseFetched && testCaseLoading)
  ) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const categorySelectKey = `category-${testCaseId || "new"}-${watch(
    "category"
  )}`;
  const assignedToSelectKey = `assignedTo-${testCaseId || "new"}-${watch(
    "assignedTo"
  )}-${availableStaff.length}`;

  const renderAssignmentCard = () => (
    <Card className="shadow-2xl border border-slate-200 dark:border-slate-700 bg-card backdrop-blur-sm">
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
            key={assignedToSelectKey}
            value={watch("assignedTo")}
            onValueChange={(value) => setValue("assignedTo", value)}
            {...register("assignedTo")}
          >
            <SelectTrigger className="h-11 border-slate-200 dark:border-slate-700 bg-background">
              <SelectValue placeholder="Select assignee" />
            </SelectTrigger>
            <SelectContent>
              {availableStaff.map((user) => (
                <SelectItem key={user.email} value={user.email}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                      {user.username
                        ? user.username.substring(0, 2).toUpperCase()
                        : user.email.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {user.username || user.email.split("@")[0]}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
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
            <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            Due Date
          </Label>
          <Input
            id="dueDate"
            type="date"
            {...register("dueDate")}
            className="h-11 border-slate-200 dark:border-slate-700 focus:border-blue-500 transition-colors bg-background"
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderActionsCard = () => (
    <Card className="shadow-2xl border border-slate-200 dark:border-slate-700 bg-card backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isTestCaseFormSubmitting}
              className="flex-1 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isTestCaseFormSubmitting}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isTestCaseFormSubmitting && (
                <LoaderCircle className="animate-spin mr-2 h-4 w-4" />
              )}
              {isEditMode ? "Update Test Case" : "Create Test Case"}
            </Button>
          </div>
          {!isEditMode && (
            <Button
              type="button"
              onClick={handleSaveAndAddAnother}
              disabled={isTestCaseFormSubmitting}
              variant="outline"
              className="w-full mt-2 border-dashed border-2 
border-green-300 text-green-700 hover:bg-green-50 hover:text-green-700 hover:border-green-400 
dark:border-green-500 dark:text-green-300 
dark:hover:bg-green-700 dark:hover:text-green-100 dark:hover:border-green-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create and Add Another Test Case
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <form onSubmit={handleSubmit(onValidSubmitTestCase)} className="w-full">
        <div
          className={`mx-auto px-6 py-8 ${isEditMode ? "w-full" : "max-w-6xl"}`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="shadow-2xl border border-slate-200 dark:border-slate-700 bg-card backdrop-blur-sm">
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
                        <Hash className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        Test Case Name *
                      </Label>
                      <Input
                        id="name"
                        {...register("name", {
                          required: "Test case name is required",
                        })}
                        placeholder="Enter descriptive test case name"
                        className="h-11 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 transition-colors bg-background"
                      />
                      {errors.name && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.name.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="category"
                        className="text-sm font-medium flex items-center gap-2"
                      >
                        <Target className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        Category *
                      </Label>
                      <Select
                        key={categorySelectKey}
                        value={watch("category")}
                        onValueChange={(value) =>
                          setValue("category", value, { shouldValidate: true })
                        }
                        {...register("category", {
                          required: "Category is required",
                        })}
                      >
                        <SelectTrigger className="h-11 border-slate-200 dark:border-slate-700 focus:border-blue-500 bg-background">
                          <SelectValue placeholder="Select test category" />
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
                      {errors.category && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.category.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Zap className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        Priority *
                      </Label>
                      <div className="flex gap-2">
                        {priorityOptions.map((option) => (
                          <Button
                            key={option.value}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setPriority(option.value)}
                            className={`flex-1 gap-2 h-10 transition-all duration-200 border ${
                              priority === option.value
                                ? `${option.selectedColor}`
                                : `${option.unselectedColor}`
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
                        <Clock className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        Estimated Time (minutes)
                      </Label>
                      <Input
                        id="estimatedTime"
                        type="number"
                        {...register("estimatedTime", {
                          min: {
                            value: 0,
                            message: "Estimated time cannot be negative",
                          },
                        })}
                        placeholder="15"
                        className="h-11 border-slate-200 dark:border-slate-700 focus:border-blue-500 transition-colors bg-background"
                      />
                      {errors.estimatedTime && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.estimatedTime.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="description"
                      className="text-sm font-medium flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                      What to Test *
                    </Label>
                    <Textarea
                      id="description"
                      {...register("description", {
                        required: "Description is required",
                      })}
                      placeholder="Describe the test steps, expected results, and acceptance criteria..."
                      rows={3}
                      className="resize-none border-slate-200 dark:border-slate-700 focus:border-blue-500 transition-colors bg-background"
                    />
                    {errors.description && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.description.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Tag className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                      Tags
                    </Label>
                    <TagInput
                      value={tags}
                      onChange={setTags}
                      placeholder="Add tags to categorize your test case..."
                      className="w-full h-11 border-slate-200 dark:border-slate-700 focus:border-blue-500 transition-colors bg-background"
                    />
                  </div>
                </CardContent>
              </Card>

              {isEditMode && renderAssignmentCard()}
              {isEditMode && renderActionsCard()}
            </div>

            <div className="lg:col-span-3 space-y-6">
              {isEditMode ? (
                <Card className="shadow-2xl border border-slate-200 dark:border-slate-700 bg-card backdrop-blur-sm">
                  <CardHeader className="pb-4 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                        <Bug className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <CardTitle className="text-lg">Bug Management</CardTitle>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={openCreateBugModal}
                      className="flex items-center gap-1 text-sm"
                    >
                      <Plus className="h-4 w-4" /> Add New Bug
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <BugList testCaseId={testCaseId} />
                  </CardContent>
                </Card>
              ) : (
                <>
                  {renderAssignmentCard()}
                  {renderActionsCard()}
                </>
              )}
            </div>
          </div>
        </div>
      </form>
      {isEditMode && (
        <CreateBugModal
          open={isCreateBugModalOpen}
          setOpen={setIsCreateBugModalOpen}
          testCaseId={testCaseId}
          projectId={projectId}
          onBugCreated={handleBugCreated}
        />
      )}
    </>
  );
}
