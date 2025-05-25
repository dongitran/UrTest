import { Fragment, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ManualTestApi, ProjectApi } from "@/lib/api";

const severityOptions = ["Critical", "High", "Medium", "Low"];

const UNASSIGNED_VALUE = "null";

const CreateBugModal = ({
  open,
  setOpen,
  testCaseId,
  projectId,
  onBugCreated,
}) => {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
      severity: "Medium",
      assignedToEmail: UNASSIGNED_VALUE,
    },
  });

  const { data: staffQueryData, isLoading: staffLoading } = useQuery({
    queryKey: ["available-staff", projectId],
    queryFn: () => ProjectApi().getAvailableStaff(projectId),
    enabled: !!projectId && open,
    select: (response) => response.availableStaff,
  });
  const availableStaff = staffQueryData || [];

  const mutation = useMutation({
    mutationFn: (data) =>
      ManualTestApi().createBugForTestCase(testCaseId, data),
    onSuccess: () => {
      toast.success("Bug created successfully");
      queryClient.invalidateQueries(["bugs-for-test-case", testCaseId]);
      if (onBugCreated) {
        onBugCreated();
      }
      setOpen(false);
      reset();
    },
    onError: (error) => {
      console.error("Error creating bug:", error);
      toast.error(error.response?.data?.message || "Failed to create bug");
    },
  });

  const onSubmit = (data) => {
    const payload = {
      ...data,
      assignedToEmail:
        data.assignedToEmail === UNASSIGNED_VALUE ? null : data.assignedToEmail,
      manualTestCaseId: testCaseId,
      projectId,
      priority: "Medium",
    };
    mutation.mutate(payload);
  };

  useEffect(() => {
    if (!open) {
      reset({
        title: "",
        description: "",
        severity: "Medium",
        assignedToEmail: UNASSIGNED_VALUE,
      });
    }
  }, [open, reset]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create New Bug</DialogTitle>
          <DialogDescription>
            Fill in the details for the new bug related to this test case.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                {...register("title", { required: "Title is required" })}
                placeholder="Enter bug title"
              />
              {errors.title && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Describe the bug, steps to reproduce, etc."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="severity">Severity *</Label>
              <Controller
                name="severity"
                control={control}
                rules={{ required: "Severity is required" }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      {severityOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.severity && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.severity.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignedToEmail">Assign To</Label>
              <Controller
                name="assignedToEmail"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={staffLoading}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          staffLoading ? "Loading staff..." : "Select assignee"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNASSIGNED_VALUE}>
                        Unassigned
                      </SelectItem>
                      {availableStaff.map((user) => (
                        <SelectItem key={user.email} value={user.email}>
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                              {user.username
                                ? user.username.substring(0, 2).toUpperCase()
                                : user.email.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">
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
                )}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || staffLoading}>
              {isSubmitting && (
                <LoaderCircle className="animate-spin mr-2 h-4 w-4" />
              )}
              Create Bug
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateBugModal;
