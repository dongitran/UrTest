"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Download,
  FileText,
  Filter,
  LineChart,
  BarChart,
  PieChart,
  Search,
  Share2
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState("week");
  const [reportType, setReportType] = useState("all");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Test Reports</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-1 items-center">
            <Calendar className="h-4 w-4" />
            Last 7 days
          </Button>
          <Button variant="outline" className="gap-1 items-center">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Button variant="outline" className="gap-1 items-center">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="gap-1 items-center">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <path d="M20 6L9 17l-5-5"></path>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium">Passed Tests</p>
              <h2 className="text-3xl font-bold">85%</h2>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="mr-4 bg-red-100 rounded-full p-3">
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
                className="text-red-500"
              >
                <path d="M18 6L6 18M6 6l12 12"></path>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium">Failed Tests</p>
              <h2 className="text-3xl font-bold">12%</h2>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="mr-4 bg-yellow-100 rounded-full p-3">
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
                className="text-yellow-500"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium">Skipped Tests</p>
              <h2 className="text-3xl font-bold">3%</h2>
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
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium">Average Duration</p>
              <h2 className="text-3xl font-bold">3.5s</h2>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="failures">Failures</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle>Recent Test Runs</CardTitle>
                  <Select defaultValue="7days">
                    <SelectTrigger className="w-[130px] h-8">
                      <SelectValue placeholder="Last 7 days" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7days">Last 7 days</SelectItem>
                      <SelectItem value="30days">Last 30 days</SelectItem>
                      <SelectItem value="90days">Last 90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="w-full aspect-[4/3] rounded-lg bg-gradient-to-b from-muted/50 to-muted p-6 flex items-center justify-center">
                  <LineChart className="h-16 w-16 text-muted-foreground" />
                  <span className="sr-only">Line chart showing trend of test results over time</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle>Test Results by Type</CardTitle>
                  <Button variant="ghost" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="w-full aspect-[4/3] rounded-lg bg-gradient-to-b from-muted/50 to-muted p-6 flex items-center justify-center">
                  <PieChart className="h-16 w-16 text-muted-foreground" />
                  <span className="sr-only">Pie chart showing test results by type</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>Test Results by Project</CardTitle>
                <div className="flex gap-2">
                  <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search projects..." className="pl-8" />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full aspect-[3/1] rounded-lg bg-gradient-to-b from-muted/50 to-muted p-6 flex items-center justify-center">
                <BarChart className="h-16 w-16 text-muted-foreground" />
                <span className="sr-only">Bar chart showing test results by project</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Test Trends Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full aspect-[3/1] rounded-lg bg-gradient-to-b from-muted/50 to-muted p-6 flex items-center justify-center">
                <LineChart className="h-16 w-16 text-muted-foreground" />
                <span className="sr-only">Line chart showing test trends over time</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failures">
          <Card>
            <CardHeader>
              <CardTitle>Test Failures Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full aspect-[3/1] rounded-lg bg-gradient-to-b from-muted/50 to-muted p-6 flex items-center justify-center">
                <BarChart className="h-16 w-16 text-muted-foreground" />
                <span className="sr-only">Bar chart showing test failures analysis</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full aspect-[3/1] rounded-lg bg-gradient-to-b from-muted/50 to-muted p-6 flex items-center justify-center">
                <LineChart className="h-16 w-16 text-muted-foreground" />
                <span className="sr-only">Line chart showing performance metrics</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle>Latest Test Executions</CardTitle>
            <Button variant="ghost" size="sm" className="gap-1">
              <span>View All</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-12 bg-muted/50 p-3 text-sm font-medium">
              <div className="col-span-4">TEST NAME</div>
              <div className="col-span-2">PROJECT</div>
              <div className="col-span-2">DATE</div>
              <div className="col-span-1">DURATION</div>
              <div className="col-span-1">STATUS</div>
              <div className="col-span-2 text-right">DETAILS</div>
            </div>
            <div className="divide-y">
              {[
                {
                  name: "Authentication Login Test",
                  project: "E-Commerce Platform",
                  date: "2 hours ago",
                  duration: "2.3s",
                  status: "Passed"
                },
                {
                  name: "Product Search Filter",
                  project: "E-Commerce Platform",
                  date: "3 hours ago",
                  duration: "5.7s",
                  status: "Failed"
                },
                {
                  name: "Payment Gateway Integration",
                  project: "Payment Gateway",
                  date: "4 hours ago",
                  duration: "3.8s",
                  status: "Passed"
                },
                {
                  name: "User Registration",
                  project: "Mobile App",
                  date: "5 hours ago",
                  duration: "4.1s",
                  status: "Passed"
                },
                {
                  name: "Checkout Process",
                  project: "E-Commerce Platform",
                  date: "1 day ago",
                  duration: "7.2s",
                  status: "Failed"
                }
              ].map((test, index) => (
                <div key={index} className="grid grid-cols-12 items-center p-3">
                  <div className="col-span-4">
                    <div className="font-medium">{test.name}</div>
                  </div>
                  <div className="col-span-2 text-sm text-muted-foreground">
                    {test.project}
                  </div>
                  <div className="col-span-2 text-sm text-muted-foreground">
                    {test.date}
                  </div>
                  <div className="col-span-1 text-sm text-muted-foreground">
                    {test.duration}
                  </div>
                  <div className="col-span-1">
                    <div className={`text-sm px-2 py-1 rounded-full text-center ${test.status === 'Passed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                      }`}>
                      {test.status}
                    </div>
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <Button variant="ghost" size="sm">
                      View Report
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}