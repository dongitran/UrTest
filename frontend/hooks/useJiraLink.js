import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";

export function useJiraLink() {
  const [isLoading, setIsLoading] = useState(false);
  const [jiraTasks, setJiraTasks] = useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  const getToken = () => {
    return localStorage.getItem("keycloak_token")
      ? JSON.parse(localStorage.getItem("keycloak_token")).access_token
      : "";
  };

  const fetchJiraTasks = async () => {
    try {
      setIsLoadingTasks(true);
      const token = getToken();

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/jira/my-assigned-tasks?excludeStatuses=Done%2CRelease%2CRELEASED%2CTask%20Done%2CStory%20Done%2CLIVE`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success && response.data.data.issues) {
        setJiraTasks(response.data.data.issues);
      }
    } catch (error) {
      console.error("Error fetching Jira tasks:", error);
      toast.error("Failed to fetch Jira tasks");
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const linkTestSuiteToJira = async (
    testSuiteId,
    issueKey,
    testSuiteName,
    projectId,
    projectName
  ) => {
    try {
      setIsLoading(true);
      const token = getToken();

      const url = `${window.location.origin
        }/automation-test/ur-editor?project=${encodeURIComponent(
          projectName
        )}&projectId=${projectId}&testSuiteId=${testSuiteId}`;

      const payload = {
        issueKey,
        testSuiteId,
        object: {
          url,
          title: `Test Suite: ${testSuiteName}`,
          summary: `Automated test suite for ${testSuiteName}`,
        },
        application: {
          name: "UrTest",
          type: "TestSuite",
        },
      };

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/jira-link/link-testsuite-to-issue`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.status === "success") {
        toast.success(`Test suite successfully linked to ${issueKey}`);
        return true;
      }
    } catch (error) {
      console.error("Error linking test suite to Jira:", error);
      toast.error("Failed to link test suite to Jira task");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const unlinkTestSuiteFromJira = async (testSuiteId, issueKey) => {
    try {
      setIsLoading(true);
      const token = getToken();

      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/jira-link/unlink-testsuite-from-issue`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          data: {
            issueKey,
            testSuiteId,
          },
        }
      );

      if (response.data.status === "success") {
        toast.success("Test suite unlinked from Jira task");
        return true;
      }
    } catch (error) {
      console.error("Error unlinking test suite from Jira:", error);
      toast.error("Failed to unlink test suite from Jira task");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    jiraTasks,
    isLoadingTasks,
    fetchJiraTasks,
    linkTestSuiteToJira,
    unlinkTestSuiteFromJira,
  };
}
