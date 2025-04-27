import { Card, CardContent } from "@/components/ui/card";

export default function DashboardStats({ stats }) {
  const { totalProjects, totalTestCases, avgSuccessRate, activeProjects } =
    stats;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="flex items-center p-6">
          <div className="mr-4 bg-blue-100 rounded-full p-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-blue-500"
            >
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium">Total Projects</p>
            <h2 className="text-3xl font-bold">{totalProjects}</h2>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center p-6">
          <div className="mr-4 bg-green-100 rounded-full p-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-green-500"
            >
              <path d="m9 11-6 6v3h9l3-3"></path>
              <path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"></path>
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium">Total Test Cases</p>
            <h2 className="text-3xl font-bold">{totalTestCases}</h2>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center p-6">
          <div className="mr-4 bg-purple-100 rounded-full p-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-purple-500"
            >
              <path d="M12 20v-6M6 20V10M18 20V4"></path>
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium">Success Rate</p>
            <h2 className="text-3xl font-bold">{avgSuccessRate}%</h2>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center p-6">
          <div className="mr-4 bg-amber-100 rounded-full p-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-amber-500"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium">Active</p>
            <h2 className="text-3xl font-bold">{activeProjects}</h2>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
