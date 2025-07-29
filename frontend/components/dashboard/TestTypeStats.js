import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const testTypeStats = [
  { name: "UI Tests", rate: 85 },
  { name: "API Tests", rate: 92 },
  { name: "Integration Tests", rate: 78 },
];

export default function TestTypeStats() {
  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>Success Rate by Test Type</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Last 7 days</DropdownMenuItem>
              <DropdownMenuItem>Last 30 days</DropdownMenuItem>
              <DropdownMenuItem>All</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {testTypeStats.map((stat) => (
            <div key={stat.name} className="flex items-center justify-between">
              <div className="flex flex-col">
                <div className="text-sm font-medium">{stat.name}</div>
                <div className="text-xs text-muted-foreground">
                  {stat.rate}%
                </div>
              </div>
              <div className="w-2/3">
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${
                      stat.rate >= 80
                        ? "bg-green-500"
                        : stat.rate >= 60
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${stat.rate}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
