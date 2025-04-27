import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function RecentTestRuns() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>Recent Test Runs</CardTitle>
          <Button variant="ghost" size="sm" className="gap-1">
            <span>View All</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
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
            <div className="flex flex-col">
              <div className="text-sm font-medium">
                Authentication tests passed
              </div>
              <div className="text-xs text-muted-foreground">2 hours ago</div>
            </div>
          </div>
          <div className="flex items-start gap-4">
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
            <div className="flex flex-col">
              <div className="text-sm font-medium">
                Search filter test failed
              </div>
              <div className="text-xs text-muted-foreground">3 hours ago</div>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
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
                className="text-blue-600"
              >
                <path d="M12 16v-4m0-4h.01M12 21a9 9 0 100-18 9 9 0 000 18z"></path>
              </svg>
            </div>
            <div className="flex flex-col">
              <div className="text-sm font-medium">New test case created</div>
              <div className="text-xs text-muted-foreground">5 hours ago</div>
            </div>
          </div>
          <div className="flex items-start gap-4">
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
            <div className="flex flex-col">
              <div className="text-sm font-medium">
                Checkout process test passed
              </div>
              <div className="text-xs text-muted-foreground">2 days ago</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
