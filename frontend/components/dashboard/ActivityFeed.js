import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import dayjs from "dayjs";
import { formatTimeAgo } from "@/utils/projectUtils";

const recentActivities = [
  {
    id: 1,
    type: "success",
    content: "Completed 12 test cases in E-Commerce project",
    time: dayjs().subtract(12, "minute").toDate(),
  },
  {
    id: 2,
    type: "info",
    content: "Created new Mobile App project",
    time: dayjs().subtract(2, "hour").toDate(),
  },
  {
    id: 3,
    type: "error",
    content: "Detected 5 errors in Payment Gateway",
    time: dayjs().subtract(1, "day").toDate(),
  },
  {
    id: 4,
    type: "warning",
    content: "Admin updated test configuration",
    time: dayjs().subtract(2, "day").toDate(),
  },
];

export default function ActivityFeed() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>Recent Activities</CardTitle>
          <Button variant="ghost" size="sm" className="gap-1">
            <span>View All</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-4">
              <div
                className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full ${
                  activity.type === "success"
                    ? "bg-green-100"
                    : activity.type === "error"
                    ? "bg-red-100"
                    : activity.type === "warning"
                    ? "bg-yellow-100"
                    : "bg-blue-100"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={
                    activity.type === "success"
                      ? "text-green-600"
                      : activity.type === "error"
                      ? "text-red-600"
                      : activity.type === "warning"
                      ? "text-yellow-600"
                      : "text-blue-600"
                  }
                >
                  {activity.type === "success" && (
                    <path d="M20 6L9 17l-5-5"></path>
                  )}
                  {activity.type === "error" && (
                    <path d="M18 6L6 18M6 6l12 12"></path>
                  )}
                  {activity.type === "warning" && (
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                  )}
                  {activity.type === "info" && (
                    <path d="M12 16v-4m0-4h.01M12 21a9 9 0 100-18 9 9 0 000 18z"></path>
                  )}
                </svg>
              </div>
              <div className="flex flex-col">
                <div className="text-sm font-medium">{activity.content}</div>
                <div className="text-xs text-muted-foreground">
                  {formatTimeAgo(activity.time)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
