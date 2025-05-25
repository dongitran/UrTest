import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoaderCircle, Search, ExternalLink, Unlink } from "lucide-react";
import { useJiraLink } from "@/hooks/useJiraLink";

export default function JiraTaskSelectorModal({
  open,
  setOpen,
  testSuiteId,
  testSuiteName,
  projectId,
  projectName,
  currentLinkedTask,
  onLinkSuccess,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const {
    jiraTasks,
    isLoadingTasks,
    fetchJiraTasks,
    linkTestSuiteToJira,
    unlinkTestSuiteFromJira,
    isLoading,
  } = useJiraLink();

  const filteredTasks = jiraTasks.filter(
    (task) =>
      task.issueKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (open) {
      fetchJiraTasks();
      setSelectedTask(null);
      setSearchTerm("");
    }
  }, [open]);

  const handleModalOpen = (isOpen) => {
    if (isOpen) {
      setSearchTerm("");
      setSelectedTask(null);
    }
    setOpen(isOpen);
  };

  const handleLinkTask = async () => {
    if (!selectedTask) return;

    const success = await linkTestSuiteToJira(
      testSuiteId,
      selectedTask.issueKey,
      testSuiteName,
      projectId,
      projectName
    );

    if (success) {
      onLinkSuccess();
      setOpen(false);
      setSelectedTask(null);
      setSearchTerm("");
    }
  };

  const handleUnlinkTask = async () => {
    if (!currentLinkedTask) return;

    const success = await unlinkTestSuiteFromJira(
      testSuiteId,
      currentLinkedTask.issueKey
    );

    if (success) {
      onLinkSuccess();
      setOpen(false);
      setSearchTerm("");
    }
  };

  const handleCancel = () => {
    setOpen(false);
    setSelectedTask(null);
    setSearchTerm("");
  };

  const openJiraTask = (issueKey) => {
    const jiraBaseUrl =
      process.env.NEXT_PUBLIC_JIRA_BASE_URL || "https://urbox.atlassian.net";
    window.open(`${jiraBaseUrl}/browse/${issueKey}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={handleModalOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] dialog-content-override shadow-xl dark:shadow-slate-950/50">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-slate-100 text-lg font-semibold dialog-title-override">
            {currentLinkedTask
              ? "Change Linked Jira Task"
              : "Link to Jira Task"}
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-slate-400 dialog-description-override">
            {currentLinkedTask
              ? `Currently linked to ${currentLinkedTask.issueKey}. Select a different task or unlink.`
              : "Select a Jira task to link with this test suite."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {currentLinkedTask && (
            <div className="p-4 bg-blue-50 dark:bg-slate-800/60 rounded-lg border border-blue-200 dark:border-slate-500/50">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-700 dark:text-slate-200">
                    Currently linked to:{" "}
                    <span className="text-blue-600 dark:text-blue-400">
                      {currentLinkedTask.issueKey}
                    </span>
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openJiraTask(currentLinkedTask.issueKey)}
                    className="border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View in Jira
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUnlinkTask}
                    disabled={isLoading}
                    className="border-red-300 dark:border-red-600/50 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-800/30"
                  >
                    {isLoading ? (
                      <LoaderCircle className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <Unlink className="h-4 w-4 mr-1" />
                    )}
                    Unlink
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-400 h-4 w-4" />
            <Input
              key={open ? "open" : "closed"}
              placeholder="Search Jira tasks..."
              className="pl-10 bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-600/50 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="border border-gray-200 dark:border-slate-700 rounded-lg max-h-[400px] overflow-y-auto bg-gray-50 dark:bg-slate-800">
            {isLoadingTasks ? (
              <div className="flex items-center justify-center py-8">
                <LoaderCircle className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-900 dark:text-slate-100">
                  Loading Jira tasks...
                </span>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-slate-400">
                {searchTerm
                  ? "No tasks found matching your search"
                  : "No Jira tasks available"}
              </div>
            ) : (
              <div className="space-y-2 p-3">
                {filteredTasks.map((task) => (
                  <div
                    key={task.issueKey}
                    className={`p-3 rounded-lg cursor-pointer border transition-all duration-200 ${
                      selectedTask?.issueKey === task.issueKey
                        ? "bg-blue-100 dark:bg-blue-900/50 border-blue-300 dark:border-blue-600 shadow-sm"
                        : "bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 hover:border-gray-300 dark:hover:border-slate-500"
                    }`}
                    onClick={() => setSelectedTask(task)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div
                          className={`font-medium text-sm mb-1 ${
                            selectedTask?.issueKey === task.issueKey
                              ? "text-blue-700 dark:text-blue-200"
                              : "text-gray-900 dark:text-slate-200"
                          }`}
                        >
                          {task.issueKey}
                        </div>
                        <div
                          className={`text-sm line-clamp-2 ${
                            selectedTask?.issueKey === task.issueKey
                              ? "text-gray-600 dark:text-slate-300"
                              : "text-gray-600 dark:text-slate-400"
                          }`}
                        >
                          {task.title}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openJiraTask(task.issueKey);
                        }}
                        className="ml-2 flex-shrink-0 h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleLinkTask}
            disabled={!selectedTask || isLoading}
            className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-slate-600 disabled:text-gray-500 dark:disabled:text-slate-400"
          >
            {isLoading ? (
              <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {currentLinkedTask ? "Change Link" : "Link Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
