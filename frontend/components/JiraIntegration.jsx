import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useJiraConnection } from "@/hooks/useJiraConnection";
import { useAuth } from "@/contexts/AuthContext";
import { LoaderCircle, Unlink } from "lucide-react";

export default function JiraIntegration() {
  const {
    isConnected,
    connectionData,
    isLoading,
    checkJiraConnection,
    getToken,
    unlinkJiraConnection,
  } = useJiraConnection();
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();

  useEffect(() => {
    const jiraIntegration = searchParams.get("jira-integration");

    if (
      jiraIntegration === "success" ||
      jiraIntegration?.startsWith("success?")
    ) {
      setShowSuccessDialog(true);
      window.history.replaceState({}, "", "/settings");
    }
  }, [searchParams]);

  const handleConnectJira = () => {
    const token = getToken();
    const redirectUrl = `${process.env.NEXT_PUBLIC_JIRA_BRIDGE_URL}?email=${auth.user.email}&access_token=${token}&callback_url=https://urtest.click/settings?jira-integration=success`;
    window.location.href = redirectUrl;
  };

  const handleUnlinkJira = async () => {
    setIsUnlinking(true);
    await unlinkJiraConnection();
    setIsUnlinking(false);
  };

  const handleCloseDialog = () => {
    setShowSuccessDialog(false);
    checkJiraConnection();
  };

  return (
    <div className="mt-6">
      <Card className="space-y-2 bg-card rounded-lg border shadow-sm">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Jira Integration</h2>
          <p className="text-muted-foreground text-sm">
            Connect your account with Jira for seamless integration
          </p>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center ">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <p>Checking connection status...</p>
            </div>
          ) : isConnected ? (
            <div>
              <p className="text-sm font-medium">
                You have linked your Jira account.
              </p>
              {connectionData && (
                <div className="mt-2 text-sm text-muted-foreground">
                  <p>
                    Connected at:{" "}
                    {new Date(connectionData.connectedAt).toLocaleString()}
                  </p>
                </div>
              )}
              <div className="mt-4">
                <Button
                  onClick={handleUnlinkJira}
                  disabled={isUnlinking}
                  variant="outline"
                  className="border-red-300 dark:border-red-600/50 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-800/30"
                >
                  {isUnlinking ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
                      Unlinking...
                    </>
                  ) : (
                    <>
                      <Unlink className="h-4 w-4 mr-2" />
                      Unlink from Jira
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col space-y-2">
              <p className="text-sm">
                You haven't linked your Jira account yet.
              </p>
              <div>
                <Button
                  onClick={handleConnectJira}
                  className="mt-2 bg-blue-600 hover:bg-blue-700"
                >
                  Connect with Jira
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle>Success!</DialogTitle>
          <div className="py-4">
            <p>Your Jira account has been successfully linked.</p>
          </div>
          <DialogFooter>
            <Button onClick={handleCloseDialog}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
