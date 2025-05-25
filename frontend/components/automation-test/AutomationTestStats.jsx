import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function AutomationTestStats({ project }) {
  const calculateStats = () => {
    const listTestSuite = project?.listTestSuite || [];
    const totalTestSuites = listTestSuite.length;
    let totalTestCases = 0;
    let passedTestCases = 0;

    listTestSuite.forEach((suite) => {
      if (suite.params?.resultRunner?.results) {
        const results = suite.params.resultRunner.results;
        totalTestCases += results.totalTests || 0;
        passedTestCases += results.passed || 0;
      } else {
        const estimatedCases = suite.testCaseCount || 3;
        totalTestCases += estimatedCases;
        if (suite.status === "Passed" || suite.status === "Completed") {
          passedTestCases += estimatedCases;
        }
      }
    });

    if (totalTestCases === 0 && totalTestSuites > 0) {
      totalTestCases = totalTestSuites * 3;
      const passedSuites = listTestSuite.filter(
        (suite) => suite.status === "Passed" || suite.status === "Completed"
      ).length;
      passedTestCases = passedSuites * 3;
    }

    const successRate =
      totalTestCases > 0
        ? Math.round((passedTestCases / totalTestCases) * 100)
        : 0;

    return {
      totalTestSuites,
      totalTestCases,
      passedTestCases,
      successRate,
    };
  };

  const stats = calculateStats();

  const statsData = [
    {
      title: "Total Test Suites",
      value: stats.totalTestSuites,
      colorClass: "stats-blue",
      textClass: "stats-blue-text",
    },
    {
      title: "Total Test Cases",
      value: stats.totalTestCases,
      colorClass: "stats-purple",
      textClass: "stats-purple-text",
    },
    {
      title: "Passed Cases",
      value: stats.passedTestCases,
      colorClass: "stats-green",
      textClass: "stats-green-text",
    },
    {
      title: "Success Rate",
      value: `${stats.successRate}%`,
      colorClass: "stats-orange",
      textClass: "stats-orange-text",
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
