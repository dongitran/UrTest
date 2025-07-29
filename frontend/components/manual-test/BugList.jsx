import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ManualTestApi } from "@/lib/api";
import {
  LoaderCircle,
  AlertTriangle,
  Inbox,
  Edit,
  Send,
  CheckCircle,
  RefreshCcw,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useState } from "react";
import EditBugModal from "./EditBugModal";

dayjs.extend(relativeTime);

const BugItem = ({ bug, onUpdateStatus, onEdit }) => {
  const getSeverityBadgeClass = (severity) => {
    switch (severity) {
      case "Critical":
        return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 border-red-200 dark:border-red-700";
      case "High":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 border-orange-200 dark:border-orange-700";
      case "Medium":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700";
      case "Low":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-700";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300 border-gray-200 dark:border-gray-700";
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Open":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-700";
      case "In Progress":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 border-purple-200 dark:border-purple-700";
      case "Resolved":
        return "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300 border-teal-200 dark:border-teal-700";
      case "Closed":
        return "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400 border-gray-300 dark:border-gray-600";
      case "Reopened":
        return "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300 border-pink-200 dark:border-pink-700";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300 border-gray-200 dark:border-gray-700";
    }
  };

  const availableActions = {
    Open: ["In Progress", "Resolved"],
    "In Progress": ["Resolved", "Open"],
    Resolved: ["Reopened", "Closed"],
    Reopened: ["In Progress", "Resolved"],
    Closed: ["Reopened"],
  };

  const currentActions = availableActions[bug.status] || [];

  return (
    <div
      key={bug.id}
      className="p-4 border rounded-lg bg-card hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-md text-foreground">{bug.title}</h4>
        <Badge className={getStatusBadgeClass(bug.status)}>{bug.status}</Badge>
      </div>
      {bug.description && (
        <p className="text-sm text-muted-foreground mt-1 mb-2 line-clamp-2">
          {bug.description}
        </p>
      )}
      <div className="flex flex-wrap gap-2 items-center text-xs mb-3">
        <Badge
          variant="outline"
          className={getSeverityBadgeClass(bug.severity)}
        >
          Severity: {bug.severity}
        </Badge>
        {bug.assignedToEmail && (
          <Badge variant="secondary">
            Assigned: {bug.assignedToEmail.split("@")[0]}
          </Badge>
        )}
        <Badge variant="secondary">
          Reported: {bug.reporterEmail.split("@")[0]}
        </Badge>
        <span className="text-muted-foreground">
          {dayjs(bug.createdAt).fromNow()}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-xs h-7"
          onClick={() => onEdit(bug)}
        >
          <Edit className="h-3 w-3 mr-1" /> Edit
        </Button>
        {currentActions.includes("In Progress") && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs h-7 text-purple-600 border-purple-300 hover:bg-purple-50 dark:text-purple-300 dark:border-purple-700 dark:hover:bg-purple-900"
            onClick={() => onUpdateStatus(bug.id, "In Progress")}
          >
            <Send className="h-3 w-3 mr-1" /> Mark In Progress
          </Button>
        )}
        {currentActions.includes("Resolved") && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs h-7 text-teal-600 border-teal-300 hover:bg-teal-50 dark:text-teal-300 dark:border-teal-700 dark:hover:bg-teal-900"
            onClick={() => onUpdateStatus(bug.id, "Resolved")}
          >
            <CheckCircle className="h-3 w-3 mr-1" /> Mark Resolved
          </Button>
        )}
        {currentActions.includes("Reopened") && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs h-7 text-pink-600 border-pink-300 hover:bg-pink-50 dark:text-pink-300 dark:border-pink-700 dark:hover:bg-pink-900"
            onClick={() => onUpdateStatus(bug.id, "Reopened")}
          >
            <RefreshCcw className="h-3 w-3 mr-1" /> Mark Reopened
          </Button>
        )}
        {currentActions.includes("Open") && bug.status === "In Progress" && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs h-7 text-blue-600 border-blue-300 hover:bg-blue-50 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-900"
            onClick={() => onUpdateStatus(bug.id, "Open")}
          >
            <RefreshCcw className="h-3 w-3 mr-1" /> Revert to Open
          </Button>
        )}
        {currentActions.includes("Closed") && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs h-7 text-gray-600 border-gray-300 hover:bg-gray-100 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            onClick={() => onUpdateStatus(bug.id, "Closed")}
          >
            <XCircle className="h-3 w-3 mr-1" /> Close Bug
          </Button>
        )}
      </div>
    </div>
  );
};

const BugList = ({ testCaseId }) => {
  const queryClient = useQueryClient();
  const [isEditBugModalOpen, setIsEditBugModalOpen] = useState(false);
  const [selectedBug, setSelectedBug] = useState(null);

  const {
    data: bugs,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["bugs-for-test-case", testCaseId],
    queryFn: () => ManualTestApi().getBugsForTestCase(testCaseId),
    enabled: !!testCaseId,
  });

  const updateBugStatusMutation = useMutation({
    mutationFn: ({ bugId, status }) =>
      ManualTestApi().updateBugStatus(bugId, status),
    onSuccess: () => {
      toast.success("Bug status updated successfully");
      queryClient.invalidateQueries(["bugs-for-test-case", testCaseId]);
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to update bug status"
      );
    },
  });

  const handleUpdateStatus = (bugId, status) => {
    updateBugStatusMutation.mutate({ bugId, status });
  };

  const handleEditBug = (bug) => {
    setSelectedBug(bug);
    setIsEditBugModalOpen(true);
  };

  const handleBugUpdated = () => {
    queryClient.invalidateQueries(["bugs-for-test-case", testCaseId]);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-4">
        <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading bugs...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-4 text-red-500">
        <AlertTriangle className="h-8 w-8 mb-2" />
        <p>Error loading bugs: {error.message}</p>
      </div>
    );
  }

  if (!bugs || bugs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
        <Inbox className="h-10 w-10 mb-2 text-gray-400 dark:text-gray-500" />
        <p>No bugs reported for this test case yet.</p>
        <Button onClick={() => refetch()} variant="link" className="mt-2">
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 mt-4 max-h-[calc(100vh-380px)] overflow-y-auto pr-2 pb-4">
        {bugs.map((bug) => (
          <BugItem
            key={bug.id}
            bug={bug}
            onUpdateStatus={handleUpdateStatus}
            onEdit={handleEditBug}
          />
        ))}
      </div>

      <EditBugModal
        open={isEditBugModalOpen}
        setOpen={setIsEditBugModalOpen}
        bug={selectedBug}
        projectId={selectedBug?.projectId}
        onBugUpdated={handleBugUpdated}
      />
    </>
  );
};

export default BugList;
