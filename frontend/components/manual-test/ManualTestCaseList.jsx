import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Edit,
  Trash2,
  Search,
  FilePlus2,
  Eye,
  Bug,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Fragment, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { ManualTestApi } from "@/lib/api";

const mockTestCases = [
  {
    id: 1,
    name: "Login with valid credentials",
    category: "Functional Test",
    priority: "High",
    assignedTo: { name: "John Doe", email: "john@example.com", avatar: null },
    status: "Passed",
    bugStatus: { type: "none", message: "No Issues" },
    lastUpdated: "2 hours ago",
  },
  {
    id: 2,
    name: "Payment processing flow",
    category: "Integration Test",
    priority: "High",
    assignedTo: {
      name: "Alice Smith",
      email: "alice@example.com",
      avatar: null,
    },
    status: "Failed",
    bugStatus: { type: "bug", reporter: "Mike Wilson", message: "Bug Found" },
    lastUpdated: "1 hour ago",
  },
  {
    id: 3,
    name: "User profile update",
    category: "UI Test",
    priority: "Medium",
    assignedTo: { name: "Bob Johnson", email: "bob@example.com", avatar: null },
    status: "In Progress",
    bugStatus: { type: "testing", message: "Testing" },
    lastUpdated: "30 minutes ago",
  },
  {
    id: 4,
    name: "Data export functionality",
    category: "Functional Test",
    priority: "Low",
    assignedTo: { name: "John Doe", email: "john@example.com", avatar: null },
    status: "Not Started",
    bugStatus: { type: "pending", message: "Pending" },
    lastUpdated: "Never",
  },
  {
    id: 5,
    name: "Mobile responsive layout",
    category: "UI Test",
    priority: "Medium",
    assignedTo: {
      name: "Alice Smith",
      email: "alice@example.com",
      avatar: null,
    },
    status: "Passed",
    bugStatus: { type: "fixed", reporter: "Sarah Chen", message: "Bug Fixed" },
    lastUpdated: "45 minutes ago",
  },
  {
    id: 6,
    name: "API authentication security",
    category: "Security Test",
    priority: "High",
    assignedTo: {
      name: "Sarah Chen",
      email: "sarah@example.com",
      avatar: null,
    },
    status: "In Progress",
    bugStatus: { type: "testing", message: "Testing" },
    lastUpdated: "15 minutes ago",
  },
  {
    id: 7,
    name: "Database performance load",
    category: "Performance Test",
    priority: "Medium",
    assignedTo: {
      name: "Mike Wilson",
      email: "mike@example.com",
      avatar: null,
    },
    status: "Passed",
    bugStatus: { type: "none", message: "No Issues" },
    lastUpdated: "3 hours ago",
  },
  {
    id: 8,
    name: "Email notification system",
    category: "Integration Test",
    priority: "Medium",
    assignedTo: { name: "Bob Johnson", email: "bob@example.com", avatar: null },
    status: "Failed",
    bugStatus: { type: "bug", reporter: "John Doe", message: "Bug Found" },
    lastUpdated: "2 hours ago",
  },
  {
    id: 9,
    name: "Shopping cart functionality",
    category: "Functional Test",
    priority: "High",
    assignedTo: {
      name: "Alice Smith",
      email: "alice@example.com",
      avatar: null,
    },
    status: "Passed",
    bugStatus: { type: "none", message: "No Issues" },
    lastUpdated: "1 hour ago",
  },
  {
    id: 10,
    name: "Cross-browser compatibility",
    category: "UI Test",
    priority: "Medium",
    assignedTo: {
      name: "Sarah Chen",
      email: "sarah@example.com",
      avatar: null,
    },
    status: "In Progress",
    bugStatus: { type: "testing", message: "Testing" },
    lastUpdated: "20 minutes ago",
  },
  {
    id: 11,
    name: "File upload validation",
    category: "Security Test",
    priority: "High",
    assignedTo: {
      name: "Mike Wilson",
      email: "mike@example.com",
      avatar: null,
    },
    status: "Not Started",
    bugStatus: { type: "pending", message: "Pending" },
    lastUpdated: "Never",
  },
  {
    id: 12,
    name: "Search functionality accuracy",
    category: "Functional Test",
    priority: "Medium",
    assignedTo: { name: "John Doe", email: "john@example.com", avatar: null },
    status: "Passed",
    bugStatus: { type: "fixed", reporter: "Alice Smith", message: "Bug Fixed" },
    lastUpdated: "4 hours ago",
  },
  {
    id: 13,
    name: "Social media integration",
    category: "Integration Test",
    priority: "Low",
    assignedTo: { name: "Bob Johnson", email: "bob@example.com", avatar: null },
    status: "In Progress",
    bugStatus: { type: "testing", message: "Testing" },
    lastUpdated: "1 hour ago",
  },
  {
    id: 14,
    name: "Page loading speed optimization",
    category: "Performance Test",
    priority: "High",
    assignedTo: {
      name: "Sarah Chen",
      email: "sarah@example.com",
      avatar: null,
    },
    status: "Failed",
    bugStatus: { type: "bug", reporter: "Mike Wilson", message: "Bug Found" },
    lastUpdated: "30 minutes ago",
  },
  {
    id: 15,
    name: "Form validation messages",
    category: "UI Test",
    priority: "Medium",
    assignedTo: {
      name: "Alice Smith",
      email: "alice@example.com",
      avatar: null,
    },
    status: "Passed",
    bugStatus: { type: "none", message: "No Issues" },
    lastUpdated: "2 hours ago",
  },
];

const statusFilters = [
  { key: "all", label: "All Cases", count: 24 },
  { key: "not-started", label: "Not Started", count: 6 },
  { key: "in-progress", label: "In Progress", count: 8 },
  { key: "passed", label: "Passed", count: 7 },
  { key: "failed", label: "Failed", count: 3 },
];

export default function ManualTestCaseList({ project, setReRender }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTestCase, setSelectedTestCase] = useState(null);

  const { data: testCases = mockTestCases } = useQuery({
    queryKey: ["manual-test-cases", project.id, activeFilter],
    queryFn: () =>
      ManualTestApi().getTestCases(project.id, { status: activeFilter }),
    enabled: !!project.id,
  });

  const columns = useMemo(() => {
    return [
      {
        accessorKey: "name",
        header: "Test Case",
        cell: ({ row }) => {
          const testCase = row.original;
          return <div className="font-medium">{testCase.name}</div>;
        },
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => {
          const category = row.getValue("category");
          return (
            <span className="text-sm text-muted-foreground">{category}</span>
          );
        },
      },
      {
        accessorKey: "priority",
        header: "Priority",
        cell: ({ row }) => {
          const priority = row.getValue("priority");
          const priorityClass = {
            High: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border-red-200 dark:border-red-800",
            Medium:
              "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 border-orange-200 dark:border-orange-800",
            Low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800",
          };
          return (
            <Badge variant="outline" className={priorityClass[priority]}>
              {priority}
            </Badge>
          );
        },
      },
      {
        accessorKey: "assignedTo",
        header: "Assigned To",
        cell: ({ row }) => {
          const assignedTo = row.getValue("assignedTo");
          const initials = assignedTo.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2);
          return (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={assignedTo.avatar} />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <span className="text-sm">{assignedTo.name}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue("status");
          const statusClass = {
            Passed:
              "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800",
            Failed:
              "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border-red-200 dark:border-red-800",
            "Not Started":
              "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
            "In Progress":
              "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800",
          };
          return (
            <Badge variant="outline" className={statusClass[status]}>
              {status}
            </Badge>
          );
        },
      },
      {
        accessorKey: "bugStatus",
        header: "Bug Status",
        cell: ({ row }) => {
          const bugStatus = row.getValue("bugStatus");
          const bugStatusIcons = {
            none: <CheckCircle className="h-4 w-4 text-green-500" />,
            bug: <Bug className="h-4 w-4 text-red-500" />,
            fixed: <CheckCircle className="h-4 w-4 text-green-500" />,
            testing: (
              <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse" />
            ),
            pending: <div className="h-2 w-2 bg-gray-400 rounded-full" />,
          };

          return (
            <div className="flex items-center gap-2">
              {bugStatusIcons[bugStatus.type]}
              <span className="text-sm">{bugStatus.message}</span>
              {bugStatus.reporter && (
                <Avatar className="h-4 w-4">
                  <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                    {bugStatus.reporter
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "lastUpdated",
        header: "Last Updated",
        cell: ({ renderValue }) => {
          return <span className="text-sm">{renderValue()}</span>;
        },
      },
      {
        accessorKey: "actions",
        header: ({ column }) => <div className="text-center">Actions</div>,
        cell: ({ row }) => {
          return (
            <div className="flex items-center justify-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-blue-600 hover:text-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900 dark:hover:text-blue-300"
                onClick={() => {
                  // View test case details
                }}
              >
                <Eye className="h-3 w-3" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-foreground/70 hover:bg-muted"
                onClick={() => {
                  router.push(
                    `/manual-test/ur-editor?project=${encodeURIComponent(
                      project.title
                    )}&projectId=${project.id}&testCaseId=${row.original.id}`
                  );
                }}
              >
                <Edit className="h-3 w-3" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-600 hover:text-red-800 hover:bg-red-100 dark:hover:text-red-300 dark:hover:bg-red-900"
                onClick={() => {
                  setSelectedTestCase(row.original);
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          );
        },
      },
    ];
  }, [project, router]);

  const filteredData = useMemo(() => {
    let filtered = testCases;

    if (activeFilter !== "all") {
      filtered = filtered.filter((testCase) => {
        const statusMap = {
          "not-started": "Not Started",
          "in-progress": "In Progress",
          passed: "Passed",
          failed: "Failed",
        };
        return testCase.status === statusMap[activeFilter];
      });
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (testCase) =>
          testCase.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          testCase.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          testCase.assignedTo.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [testCases, activeFilter, searchQuery]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const handleDeleteTestCase = async () => {
    try {
      // await ManualTestApi().deleteTestCase(selectedTestCase.id);
      toast.success("Test case deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedTestCase(null);
      if (setReRender) setReRender({});
    } catch (error) {
      toast.error("Failed to delete test case");
    }
  };

  return (
    <div className="border rounded-lg bg-card overflow-hidden shadow-sm mx-2">
      <Tabs
        value={activeFilter}
        onValueChange={setActiveFilter}
        className="w-full"
      >
        <div className="px-4 py-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h2 className="text-lg font-semibold">Test Cases</h2>

              <TabsList className="bg-background">
                {statusFilters.map((filter) => (
                  <TabsTrigger
                    key={filter.key}
                    value={filter.key}
                    className="text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {filter.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-[280px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search test cases..."
                  className="pl-10 h-9 w-full text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Button
                onClick={() => {
                  router.push(
                    `/manual-test/ur-editor?project=${encodeURIComponent(
                      project.title
                    )}&projectId=${project.id}`
                  );
                }}
                className="bg-green-600 hover:bg-green-700 text-white h-9 text-sm px-4"
              >
                <FilePlus2 className="mr-2 h-4 w-4" />
                Create Test Case
              </Button>
            </div>
          </div>
        </div>

        <div className="p-4">
          <TabsContent value={activeFilter} className="mt-0">
            <div className="w-full border rounded-md overflow-hidden bg-card">
              <Table className="w-full">
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    {table.getHeaderGroups().map((headerGroup) =>
                      headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className="py-2 px-3 text-sm font-semibold text-foreground"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className="border-b hover:bg-muted/30 transition-colors"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="py-2 px-3">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-32 text-center"
                      >
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <div className="text-lg mb-2">
                            {searchQuery ? "🔍" : "📋"}
                          </div>
                          <div className="text-sm">
                            {searchQuery
                              ? "No test cases found matching your search criteria."
                              : "No test cases found. Create your first test case to get started."}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Showing {table.getRowModel().rows.length} of{" "}
                {filteredData.length} test cases
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="h-8 w-8 rounded-md p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm"
                >
                  {table.getState().pagination.pageIndex + 1}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="h-8 w-8 rounded-md p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Test Case</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this test case? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedTestCase && (
            <div className="pt-3">
              <div className="border p-3 rounded-md">
                <p className="font-medium">{selectedTestCase.name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedTestCase.category}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTestCase}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
