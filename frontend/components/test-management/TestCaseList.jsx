import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Copy, Edit, Eye, FileText, Play, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TestSuiteApi } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function TestCaseList({ project = {}, listTestSuite = [] }) {
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
            <Play className="!size-4" />
            Run All Tests
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-12 bg-muted/50 p-3 text-sm font-medium">
            <div className="col-span-4">TEST CASE</div>
            <div className="col-span-2">TAGS</div>
            <div className="col-span-1">STATUS</div>
            <div className="col-span-1">LAST RUN</div>
            <div className="col-span-1">DURATION</div>
            <div className="col-span-2 text-right pr-2">ACTIONS</div>
          </div>
          <div className="divide-y">
            {listTestSuite.map((test) => (
              <div key={test.id} className="grid grid-cols-12 items-center p-3">
                <div className="col-span-4">
                  <div className="font-medium text-xl">{test.name}</div>
                  <div className="text-xs text-muted-foreground">{test.description}</div>
                </div>
                <div className="col-span-2">
                  {test.tags &&
                    test.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className={`px-2 py-0.5 ${getTypeBadgeClass(test.type)}`}>
                        {tag}
                      </Badge>
                    ))}
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
                  <Button
                    onClick={() => {
                      console.log("project :>> ", project, `?`);
                      router.push(
                        `/test-management/new-test-case?project=${encodeURIComponent(project.title)}&projectId=${
                          project.id
                        }&testSuiteId=${test.id}`
                      );
                    }}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <FileText className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        await TestSuiteApi().delete(test.id);

                        toast.success(`Đã xóa kịch bản ${test.name} thành công`);
                      } catch (error) {
                        toast.error(`Có lỗi khi xóa kịch bản test thất bại`);
                      }
                    }}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="text-sm text-muted-foreground">Total {listTestSuite.length} test suite</div>
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
