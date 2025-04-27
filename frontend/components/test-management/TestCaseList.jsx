import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Copy, Edit, Eye, FileText, Play, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const testCases = [
  {
    id: 1,
    name: "Verify login with valid credentials",
    type: "Authentication",
    status: "Passed",
    lastRun: "2 hours ago",
    duration: "2.3s",
    fileName: "login_tests.robot",
  },
  {
    id: 2,
    name: "Verify login with invalid credentials",
    type: "Authentication",
    status: "Not Run",
    lastRun: "—",
    duration: "—",
    fileName: "login_tests.robot",
  },
  {
    id: 3,
    name: "Check product search functionality",
    type: "Search",
    status: "Passed",
    lastRun: "2 hours ago",
    duration: "4.1s",
    fileName: "search_tests.robot",
  },
  {
    id: 4,
    name: "Verify product filters work correctly",
    type: "Search",
    status: "Failed",
    lastRun: "3 hours ago",
    duration: "5.7s",
    fileName: "search_tests.robot",
  },
  {
    id: 5,
    name: "Product detail page shows correct info",
    type: "Product",
    status: "Passed",
    lastRun: "1 day ago",
    duration: "3.2s",
    fileName: "product_tests.robot",
  },
];

export default function TestCaseList() {
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

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex gap-3 items-center">
          <CardTitle>Danh sách testcases</CardTitle>
          <div className="ml-auto"></div>
          <div className="flex gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search test cases..." className="pl-8" />
            </div>
          </div>

          <Button className="rounded-sm gap-1 items-center bg-blue-700 hover:bg-blue-800 text-white">
            <Play className="h-4 w-4" />
            Run All Tests
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-12 bg-muted/50 p-3 text-sm font-medium">
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
                <div className="col-span-4">
                  <div className="font-medium">{test.name}</div>
                  <div className="text-xs text-muted-foreground">{test.fileName}</div>
                </div>
                <div className="col-span-2">
                  <Badge variant="outline" className={`px-2 py-0.5 ${getTypeBadgeClass(test.type)}`}>
                    {test.type}
                  </Badge>
                </div>
                <div className="col-span-1">
                  <Badge variant="outline" className={`px-2 py-0.5 ${getStatusBadgeClass(test.status)}`}>
                    {test.status}
                  </Badge>
                </div>
                <div className="col-span-1 text-sm text-muted-foreground">{test.lastRun}</div>
                <div className="col-span-1 text-sm text-muted-foreground">{test.duration}</div>
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
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="text-sm text-muted-foreground">Showing 1 to 7 of 32 test cases</div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {[1, 2, 3, 4, 5].map((page) => (
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
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
