import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoaderCircle, Eye } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useState, useEffect } from "react";
import MyPagination from "@/components/MyPagination";

dayjs.extend(relativeTime);

const ITEMS_PER_PAGE = 4;

export default function RecentTestRuns({ recentTestRun = [] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedTestRuns, setPaginatedTestRuns] = useState([]);

  useEffect(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    setPaginatedTestRuns(recentTestRun.slice(startIndex, endIndex));
  }, [currentPage, recentTestRun]);

  return (
    <Card className="overflow-hidden border rounded-lg shadow-lg flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <h3 className="font-medium">Recent Test Runs</h3>
        {recentTestRun.length > ITEMS_PER_PAGE && (
          <MyPagination
            total={recentTestRun.length}
            page={currentPage}
            setPage={setCurrentPage}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        )}
      </div>
      <CardContent className="p-0 flex-1">
        <div className="min-h-[220px]">
          {paginatedTestRuns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No recent test runs available
            </div>
          ) : (
            <div className="divide-y divide-border">
              {paginatedTestRuns.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center px-4 py-2 hover:bg-muted/40 transition-colors group"
                >
                  <div className="flex-shrink-0 mr-3">
                    {item.status === "success" && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-green-600 dark:text-green-400"
                        >
                          <path d="M20 6L9 17l-5-5"></path>
                        </svg>
                      </div>
                    )}
                    {item.status === "failed" && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-red-600 dark:text-red-400"
                        >
                          <path d="M18 6L6 18M6 6l12 12"></path>
                        </svg>
                      </div>
                    )}
                    {item.status === "processing" && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                        <LoaderCircle className="text-blue-600 dark:text-blue-400 size-3 animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-foreground truncate">
                        {item.testSuiteName}
                      </p>
                      {item.results &&
                        typeof item.results.passed === "number" &&
                        typeof item.results.totalTests === "number" && (
                          <span className="px-1.5 py-0.5 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-md whitespace-nowrap">
                            {item.results.passed}/{item.results.totalTests}
                          </span>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {dayjs(item.createdAt).fromNow()} • {item.createdBy}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full text-muted-foreground opacity-60 group-hover:opacity-100 transition-opacity"
                    onClick={() =>
                      window.open(item.reportUrl + "/report.html", "_blank")
                    }
                    title="View Result"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
