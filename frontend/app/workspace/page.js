"use client";

import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Eye, MoreVertical, Plus, Search, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

dayjs.extend(advancedFormat);

const mockProjects = [
  {
    id: 1,
    name: "E-Commerce Platform",
    testCases: 32,
    status: "Stable",
    progress: 85,
    successRate: 92,
    lastUpdated: dayjs().subtract(1, 'hour').toDate(),
    statusColor: "bg-green-500"
  },
  {
    id: 2,
    name: "Mobile App",
    testCases: 24,
    status: "Needs Attention",
    progress: 70,
    successRate: 78,
    lastUpdated: dayjs().subtract(3, 'hour').toDate(),
    statusColor: "bg-yellow-500"
  },
  {
    id: 3,
    name: "Payment Gateway",
    testCases: 18,
    status: "Critical Error",
    progress: 55,
    successRate: 45,
    lastUpdated: dayjs().subtract(2, 'day').toDate(),
    statusColor: "bg-red-500"
  }
];

const recentActivities = [
  {
    id: 1,
    type: "success",
    content: "Completed 12 test cases in E-Commerce project",
    time: dayjs().subtract(12, 'minute').toDate()
  },
  {
    id: 2,
    type: "info",
    content: "Created new Mobile App project",
    time: dayjs().subtract(2, 'hour').toDate()
  },
  {
    id: 3,
    type: "error",
    content: "Detected 5 errors in Payment Gateway",
    time: dayjs().subtract(1, 'day').toDate()
  },
  {
    id: 4,
    type: "warning",
    content: "Admin updated test configuration",
    time: dayjs().subtract(2, 'day').toDate()
  }
];

const testTypeStats = [
  { name: "UI Tests", rate: 85 },
  { name: "API Tests", rate: 92 },
  { name: "Integration Tests", rate: 78 },
];

export default function WorkspacePageV2() {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 5;

  const totalProjects = mockProjects.length;
  const totalTestCases = mockProjects.reduce((sum, project) => sum + project.testCases, 0);
  const avgSuccessRate = Math.round(mockProjects.reduce((sum, project) => sum + project.successRate, 0) / totalProjects);
  const activeProjects = mockProjects.filter(p => p.status !== "Completed").length;

  return (
    <div className="flex flex-col gap-6">
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

      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle>Project List</CardTitle>
            <div className="flex gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search projects..." className="pl-8" />
              </div>
              <Button className="gap-1 items-center">
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-6 bg-muted/50 p-3 text-sm font-medium">
              <div className="col-span-2">PROJECT NAME</div>
              <div>STATUS</div>
              <div>PROGRESS</div>
              <div>SUCCESS RATE</div>
              <div>LAST RUN</div>
            </div>
            <div className="divide-y">
              {mockProjects.map((project) => (
                <div key={project.id} className="grid grid-cols-6 items-center p-3">
                  <div className="col-span-2 flex items-center">
                    <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-full bg-blue-100">
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
                        className="text-blue-700"
                      >
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium">{project.name}</div>
                      <div className="text-xs text-muted-foreground">{project.testCases} test cases</div>
                    </div>
                  </div>
                  <div>
                    <Badge
                      variant="outline"
                      className={`px-2 py-0.5 ${project.status === 'Stable' ? 'bg-green-100 text-green-800 border-green-200' :
                        project.status === 'Needs Attention' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          project.status === 'Critical Error' ? 'bg-red-100 text-red-800 border-red-200' :
                            project.status === 'In Development' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                              'bg-gray-100 text-gray-800 border-gray-200'}`}
                    >
                      {project.status}
                    </Badge>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${project.progress >= 80 ? 'bg-green-500' :
                            project.progress >= 60 ? 'bg-yellow-500' :
                              project.progress >= 40 ? 'bg-blue-500' : 'bg-red-500'}`}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${project.successRate >= 80 ? 'text-green-600' :
                        project.successRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {project.successRate}%
                      </span>
                      <div className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor: project.successRate >= 80 ? '#22c55e' :
                            project.successRate >= 60 ? '#eab308' : '#ef4444'
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {project.lastUpdated > dayjs().subtract(1, 'day')
                        ? `${dayjs().diff(dayjs(project.lastUpdated), 'hour') > 0
                          ? dayjs().diff(dayjs(project.lastUpdated), 'hour') + ' hours'
                          : dayjs().diff(dayjs(project.lastUpdated), 'minute') + ' minutes'} ago`
                        : `${dayjs().diff(dayjs(project.lastUpdated), 'day')} days ago`}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Duplicate</DropdownMenuItem>
                          <DropdownMenuItem>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between p-3">
              <div className="text-sm text-muted-foreground">
                Showing {currentPage} to {Math.min(totalPages, 5)} of {totalPages} projects
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {[1, 2, 3, 4, 5].map(page => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle>Recent Activities</CardTitle>
              <Button variant="ghost" size="sm" className="gap-1">
                <span>View All</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map(activity => (
                <div key={activity.id} className="flex items-start gap-4">
                  <div className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full ${activity.type === 'success' ? 'bg-green-100' :
                    activity.type === 'error' ? 'bg-red-100' :
                      activity.type === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
                    }`}>
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
                      className={
                        activity.type === 'success' ? 'text-green-600' :
                          activity.type === 'error' ? 'text-red-600' :
                            activity.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                      }
                    >
                      {activity.type === 'success' && <path d="M20 6L9 17l-5-5"></path>}
                      {activity.type === 'error' && <path d="M18 6L6 18M6 6l12 12"></path>}
                      {activity.type === 'warning' && <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>}
                      {activity.type === 'info' && <path d="M12 16v-4m0-4h.01M12 21a9 9 0 100-18 9 9 0 000 18z"></path>}
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <div className="text-sm font-medium">{activity.content}</div>
                    <div className="text-xs text-muted-foreground">
                      {activity.time > dayjs().subtract(1, 'day')
                        ? `${dayjs().diff(dayjs(activity.time), 'hour') > 0
                          ? dayjs().diff(dayjs(activity.time), 'hour') + ' hours'
                          : dayjs().diff(dayjs(activity.time), 'minute') + ' minutes'} ago`
                        : `${dayjs().diff(dayjs(activity.time), 'day')} days ago`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
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
              {testTypeStats.map(stat => (
                <div key={stat.name} className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <div className="text-sm font-medium">{stat.name}</div>
                    <div className="text-xs text-muted-foreground">{stat.rate}%</div>
                  </div>
                  <div className="w-2/3">
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${stat.rate >= 80 ? 'bg-green-500' :
                          stat.rate >= 60 ? 'bg-yellow-500' :
                            'bg-red-500'
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
      </div>
    </div>
  );
}