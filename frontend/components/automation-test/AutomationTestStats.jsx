import { Card, CardContent } from "@/components/ui/card";

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

    const runningTests = listTestSuite.filter(
      (suite) => suite.status === "Running"
    ).length;

    return {
      totalTestSuites,
      totalTestCases,
      passedTestCases,
      successRate,
      runningTests,
    };
  };

  const stats = calculateStats();

  const statsData = [
    {
      title: "Total Test Suites",
      value: stats.totalTestSuites,
      color: "border-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      textColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Total Test Cases",
      value: stats.totalTestCases,
      color: "border-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
      textColor: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "Passed Cases",
      value: stats.passedTestCases,
      color: "border-green-500",
      bgColor: "bg-green-50 dark:bg-green-950/30",
      textColor: "text-green-600 dark:text-green-400",
    },
    {
      title: "Success Rate",
      value: `${stats.successRate}%`,
      color: "border-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-950/30",
      textColor: "text-orange-600 dark:text-orange-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsData.map((stat, index) => (
        <Card
          key={index}
          className={`${stat.bgColor} border-l-4 ${stat.color} shadow-sm hover:shadow-md transition-shadow`}
        >
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className={`text-xl font-bold ${stat.textColor}`}>
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
