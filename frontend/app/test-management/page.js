"use client";

import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit,
  Eye,
  FileText,
  Play,
  Plus,
  Search,
  Trash2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";

dayjs.extend(advancedFormat);

const testCases = [
  {
    id: 1,
    name: "Verify login with valid credentials",
    type: "Authentication",
    status: "Passed",
    lastRun: "2 hours ago",
    duration: "2.3s",
    fileName: "login_tests.robot"
  },
  {
    id: 2,
    name: "Verify login with invalid credentials",
    type: "Authentication",
    status: "Not Run",
    lastRun: "—",
    duration: "—",
    fileName: "login_tests.robot"
  },
  {
    id: 3,
    name: "Check product search functionality",
    type: "Search",
    status: "Passed",
    lastRun: "2 hours ago",
    duration: "4.1s",
    fileName: "search_tests.robot"
  },
  {
    id: 4,
    name: "Verify product filters work correctly",
    type: "Search",
    status: "Failed",
    lastRun: "3 hours ago",
    duration: "5.7s",
    fileName: "search_tests.robot"
  },
  {
    id: 5,
    name: "Product detail page shows correct info",
    type: "Product",
    status: "Passed",
    lastRun: "1 day ago",
    duration: "3.2s",
    fileName: "product_tests.robot"
  }
];

export default function TestManagement() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const totalTests = 32;
  const itemsPerPage = 7;
  const totalPages = Math.ceil(totalTests / itemsPerPage);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Passed":
        return "bg-green-100 text-green-800 border-green-200";
      case "Failed":
        return "bg-red-100 text-red-800 border-red-200";
      case "Not Run":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  const getTypeBadgeClass = (type) => {
    switch (type) {
      case "Authentication":
        return "bg-purple-100 text-purple-800";
      case "Search":
        return "bg-blue-100 text-blue-800";
      case "Product":
        return "bg-green-100 text-green-800";
      case "Cart":
        return "bg-amber-100 text-amber-800";
      case "Checkout":
        return "bg-teal-100 text-teal-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const navigateToNewTestCase = () => {
    router.push("/test-management/new-test-case?project=E-Commerce%20Platform");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-medium">Project:</span>
            <Select defaultValue="e-commerce">
              <SelectTrigger className="w-[400px]">
                <SelectValue placeholder="E-Commerce Platform" />
              </SelectTrigger>
              <SelectContent className="min-w-[200px] w-auto">
                <SelectItem value="e-commerce">E-Commerce Platform</SelectItem>
                <SelectItem value="mobile-app">Mobile App</SelectItem>
                <SelectItem value="payment">Payment Gateway</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Test cases:</span>
            <span>{totalTests}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button className="gap-1 items-center bg-blue-600 hover:bg-blue-700">
            <Play className="h-4 w-4" />
            Run All Tests
          </Button>
          <Button className="gap-1 items-center" onClick={navigateToNewTestCase}>
            <Plus className="h-4 w-4" />
            New Test Case
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle>Test Cases</CardTitle>
            <div className="flex gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search test cases..." className="pl-8" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-12 bg-muted/50 p-3 text-sm font-medium">
              <div className="col-span-1"></div>
              <div className="col-span-4">TEST CASE</div>
              <div className="col-span-2">TYPE</div>
              <div className="col-span-1">STATUS</div>
              <div className="col-span-1">LAST RUN</div>
              <div className="col-span-1">DURATION</div>
              <div className="col-span-2 text-right pr-2">ACTIONS</div>
            </div>
            <div className="divide-y">
              {testCases.map((test) => (
                <div key={test.id} className="grid grid-cols-12 items-center p-3">
                  <div className="col-span-1">
                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                  </div>
                  <div className="col-span-4">
                    <div className="font-medium">{test.name}</div>
                    <div className="text-xs text-muted-foreground">{test.fileName}</div>
                  </div>
                  <div className="col-span-2">
                    <Badge
                      variant="outline"
                      className={`px-2 py-0.5 ${getTypeBadgeClass(test.type)}`}
                    >
                      {test.type}
                    </Badge>
                  </div>
                  <div className="col-span-1">
                    <Badge
                      variant="outline"
                      className={`px-2 py-0.5 ${getStatusBadgeClass(test.status)}`}
                    >
                      {test.status}
                    </Badge>
                  </div>
                  <div className="col-span-1 text-sm text-muted-foreground">
                    {test.lastRun}
                  </div>
                  <div className="col-span-1 text-sm text-muted-foreground">
                    {test.duration}
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between p-3">
              <div className="text-sm text-muted-foreground">
                Showing 1 to 7 of 32 test cases
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
                  <div className="text-sm font-medium">Authentication tests passed</div>
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
                  <div className="text-sm font-medium">Search filter test failed</div>
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
                  <div className="text-sm font-medium">Checkout process test passed</div>
                  <div className="text-xs text-muted-foreground">2 days ago</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle>Test Success Rate</CardTitle>
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="text-sm font-medium">Authentication</div>
                  <div className="text-xs text-muted-foreground">95%</div>
                </div>
                <div className="w-2/3">
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-green-500"
                      style={{ width: "95%" }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="text-sm font-medium">Search</div>
                  <div className="text-xs text-muted-foreground">75%</div>
                </div>
                <div className="w-2/3">
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-yellow-500"
                      style={{ width: "75%" }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="text-sm font-medium">Product</div>
                  <div className="text-xs text-muted-foreground">90%</div>
                </div>
                <div className="w-2/3">
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-green-500"
                      style={{ width: "90%" }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="text-sm font-medium">Cart</div>
                  <div className="text-xs text-muted-foreground">60%</div>
                </div>
                <div className="w-2/3">
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-yellow-500"
                      style={{ width: "60%" }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="text-sm font-medium">Checkout</div>
                  <div className="text-xs text-muted-foreground">85%</div>
                </div>
                <div className="w-2/3">
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-green-500"
                      style={{ width: "85%" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}