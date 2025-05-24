import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { ManualTestApi } from "@/lib/api";

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
      color: "border-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      textColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Passed",
      value: stats?.passed || 18,
      color: "border-green-500",
      bgColor: "bg-green-50 dark:bg-green-950/30",
      textColor: "text-green-600 dark:text-green-400",
    },
    {
      title: "Progress",
      value: `${stats?.progress || 75}%`,
      color: "border-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-950/30",
      textColor: "text-orange-600 dark:text-orange-400",
    },
    {
      title: "Active Bugs",
      value: stats?.activeBugs || 5,
      color: "border-red-500",
      bgColor: "bg-red-50 dark:bg-red-950/30",
      textColor: "text-red-600 dark:text-red-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsData.map((stat, index) => (
        <Card
          key={index}
          className={`${stat.bgColor} border-l-4 ${stat.color} shadow-sm hover:shadow-md transition-shadow`}
        >
          <CardContent className="p-4">
            <div className="flex flex-col">
              <div className={`text-2xl font-bold ${stat.textColor} mb-1`}>
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
