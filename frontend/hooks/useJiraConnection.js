import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";

export function useJiraConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionData, setConnectionData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkJiraConnection = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem("keycloak_token")
        ? JSON.parse(localStorage.getItem("keycloak_token")).access_token
        : "";

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/jira-oauth/check-jira-connection`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.connected) {
        setIsConnected(true);
        setConnectionData(response.data.connectionData);
      } else {
        setIsConnected(false);
      }
    } catch (err) {
      console.error("Error checking Jira connection:", err);
      setError(err);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const getToken = () => {
    return localStorage.getItem("keycloak_token")
      ? JSON.parse(localStorage.getItem("keycloak_token")).access_token
      : "";
  };

  const unlinkJiraConnection = async () => {
    try {
      const token = getToken();

      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/jira-oauth/unlink-jira-connection`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setIsConnected(false);
      setConnectionData(null);

      toast.success("Jira connection has been successfully unlinked");
      return true;
    } catch (error) {
      console.error("Error unlinking Jira:", error);
      toast.error("Failed to unlink Jira connection");
      return false;
    }
  };

  useEffect(() => {
    checkJiraConnection();
  }, []);

  return {
    isConnected,
    connectionData,
    isLoading,
    error,
    checkJiraConnection,
    getToken,
    unlinkJiraConnection,
  };
}
