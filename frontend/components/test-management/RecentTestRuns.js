import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoaderCircle } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

export default function RecentTestRuns({ recentTestRun = [] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center">
          <CardTitle>Recent Test Runs</CardTitle>
          <div className="ml-auto"></div>
          <Button variant="outline" size="sm" className="">
            <span>View All</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentTestRun.map((item) => {
            return (
              <div key={item.id} className="flex items-start gap-3">
                {item.status === "success" && (
                  <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
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
                      className="text-green-600"
                    >
                      <path d="M20 6L9 17l-5-5"></path>
                    </svg>
                  </div>
                )}
                {item.status === "failed" && (
                  <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
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
                      className="text-red-600"
                    >
                      <path d="M18 6L6 18M6 6l12 12"></path>
                    </svg>
                  </div>
                )}
                {item.status === "processing" && (
                  <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                    <LoaderCircle className="text-blue-600 size-4 animate-spin" />
                  </div>
                )}
                <div className="flex flex-col">
                  <div className="text-sm font-medium">{item.testSuiteName}</div>
                  <div className="text-xs text-muted-foreground">
                    <span>{dayjs(item.createdAt).fromNow()}</span>
                    <span> - </span>
                    <span>{item.createdBy}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
