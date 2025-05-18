import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, LinkIcon, AlertCircle } from "lucide-react";
import JiraTaskSelectorModal from "@/components/JiraTaskSelectorModal";

export default function JiraLinkButton({
  jiraConnection,
  testSuiteId,
  testSuiteName,
  onRefresh,
  size = "sm",
  className = "",
}) {
  const [modalOpen, setModalOpen] = useState(false);

  if (!jiraConnection?.isJiraLinked) {
    return (
      <Button
        variant="outline"
        size={size}
        className={`text-orange-600 border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-950 ${className}`}
        onClick={() => {
          window.open("/settings#jira-integration", "_blank");
        }}
      >
        <AlertCircle className="h-4 w-4 mr-2" />
        Jira Connection Required
      </Button>
    );
  }

  if (!jiraConnection.remoteLinkData) {
    return (
      <>
        <Button
          variant="outline"
          size={size}
          className={`text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950 ${className}`}
          onClick={() => setModalOpen(true)}
        >
          <Link className="h-4 w-4 mr-2" />
          Link to Jira Task
        </Button>

        <JiraTaskSelectorModal
          open={modalOpen}
          setOpen={setModalOpen}
          testSuiteId={testSuiteId}
          testSuiteName={testSuiteName}
          currentLinkedTask={null}
          onLinkSuccess={onRefresh}
        />
      </>
    );
  }

  const linkedTask = jiraConnection.remoteLinkData;

  return (
    <>
      <Button
        variant="outline"
        size={size}
        className={`text-green-600 border-green-200 hover:bg-green-50 dark:hover:bg-green-950 ${className}`}
        onClick={() => setModalOpen(true)}
      >
        <LinkIcon className="h-4 w-4 mr-2" />
        Linked to {linkedTask.issueKey}
      </Button>

      <JiraTaskSelectorModal
        open={modalOpen}
        setOpen={setModalOpen}
        testSuiteId={testSuiteId}
        testSuiteName={testSuiteName}
        currentLinkedTask={linkedTask}
        onLinkSuccess={onRefresh}
      />
    </>
  );
}
