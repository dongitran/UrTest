import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Check,
  X,
  Calendar,
  MessageSquare,
  FileText,
  PlayCircle,
  Plus,
  Edit,
  Trash2,
  UserPlus,
  UserMinus,
} from "lucide-react";
import axios from "axios";
import { formatTimeAgo } from "@/utils/projectUtils";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function ActivityFeed({ limit = 5, refreshKey = 0 }) {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("keycloak_token")
          ? JSON.parse(localStorage.getItem("keycloak_token")).access_token
          : "";

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/activities?limit=${limit}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setActivities(response.data.activities || []);
      } catch (error) {
        console.error("Error fetching activities:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, [limit, refreshKey]);

  const getActivityIcon = (activityType) => {
    switch (activityType) {
      case "PROJECT_CREATED":
        return <Plus className="h-4 w-4 text-green-500" />;
      case "PROJECT_UPDATED":
        return <Edit className="h-4 w-4 text-blue-500" />;
      case "PROJECT_DELETED":
        return <Trash2 className="h-4 w-4 text-red-500" />;
      case "PROJECT_STAFF_ADDED":
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case "PROJECT_STAFF_REMOVED":
        return <UserMinus className="h-4 w-4 text-orange-500" />;
      case "TEST_SUITE_CREATED":
        return <Plus className="h-4 w-4 text-green-500" />;
      case "TEST_SUITE_UPDATED":
        return <Edit className="h-4 w-4 text-blue-500" />;
      case "TEST_SUITE_DELETED":
        return <Trash2 className="h-4 w-4 text-red-500" />;
      case "TEST_SUITE_EXECUTION_STARTED":
        return <PlayCircle className="h-4 w-4 text-blue-500" />;
      case "TEST_SUITE_EXECUTION_COMPLETED":
        return <Check className="h-4 w-4 text-green-500" />;
      case "TEST_SUITE_EXECUTION_FAILED":
        return <X className="h-4 w-4 text-red-500" />;
      case "TEST_RESOURCE_CREATED":
        return <FileText className="h-4 w-4 text-green-500" />;
      case "TEST_RESOURCE_UPDATED":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "TEST_RESOURCE_DELETED":
        return <Trash2 className="h-4 w-4 text-red-500" />;
      case "COMMENT_ADDED":
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      case "COMMENT_DELETED":
        return <Trash2 className="h-4 w-4 text-red-500" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card className="overflow-hidden border rounded-lg shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <h3 className="font-medium">Recent Activities</h3>
      </div>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <LoadingSpinner size="small" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No recent activities
          </div>
        ) : (
          <div className="divide-y divide-border">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-shrink-0 mr-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                    {getActivityIcon(activity.activityType)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    {activity.description}
                  </p>
                  <div className="flex items-center mt-1">
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(new Date(activity.createdAt))}
                    </span>
                    <span className="text-xs text-muted-foreground mx-1">
                      •
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {activity.userEmail}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
