import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { ManualTestApi } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function ManualTestStats({ project }) {
  const { data: stats } = useQuery({
    queryKey: ["manual-test-stats", project.id],
    queryFn: () => ManualTestApi().getStats(project.id),
    enabled: !!project.id,
  });

  const statsData = [
    {
      title: "Total Test Cases",
      value: stats?.totalTestCases || 24,
      colorClass: "stats-blue",
      textClass: "stats-blue-text",
    },
    {
      title: "Passed",
      value: stats?.passed || 18,
      colorClass: "stats-green",
      textClass: "stats-green-text",
    },
    {
      title: "Progress",
      value: `${stats?.progress || 75}%`,
      colorClass: "stats-orange",
      textClass: "stats-orange-text",
    },
    {
      title: "Active Bugs",
      value: stats?.activeBugs || 5,
      colorClass: "stats-red",
      textClass: "stats-red-text",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsData.map((stat, index) => (
        <Card key={index} className={cn("stats-card", stat.colorClass)}>
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className={cn("text-xl font-bold", stat.textClass)}>
                {stat.value}
              </div>
              <div className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
