import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoaderCircle, ChevronRight } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

export default function RecentTestRuns({ recentTestRun = [] }) {
  return (
    <Card className="overflow-hidden border rounded-lg shadow-sm">
      <CardHeader className="pb-2 p-6 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Recent Test Runs</CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8"
          >
            <span>View All</span>
            <ChevronRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-5">
          {recentTestRun.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No recent test runs available
            </div>
          ) : (
            recentTestRun.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                {item.status === "success" && (
                  <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
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
                      className="text-green-600 dark:text-green-300"
                    >
                      <path d="M20 6L9 17l-5-5"></path>
                    </svg>
                  </div>
                )}
                {item.status === "failed" && (
                  <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
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
                      className="text-red-600 dark:text-red-300"
                    >
                      <path d="M18 6L6 18M6 6l12 12"></path>
                    </svg>
                  </div>
                )}
                {item.status === "processing" && (
                  <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                    <LoaderCircle className="text-blue-600 dark:text-blue-300 size-4 animate-spin" />
                  </div>
                )}
                <div className="flex flex-col">
                  <div className="text-sm font-medium">{item.testSuiteName}</div>
                  <div className="text-xs text-muted-foreground">
                    <span>{dayjs(item.createdAt).fromNow()}</span>
                    <span className="mx-1">•</span>
                    <span>{item.createdBy}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
