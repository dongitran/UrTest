import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TestSuiteApi } from "@/lib/api";
import { handleEventData } from "@/lib/websocket";
import dayjs from "dayjs";
import { get, isEmpty } from "lodash";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Play,
  FileText,
  Edit,
  Trash2,
  Search,
  FilePlus2,
  LoaderCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

export default function TestCaseList({
  project = {},
  listTestSuite = [],
  setReRender,
}) {
  const router = useRouter();
  const socketRef = useRef(null);
  const columns = useMemo(() => {
    return [
      {
        accessorKey: "name",
        header: "Test Suite",
        cell: ({ row }) => {
          return <div className="font-medium">{row.original.name}</div>;
        },
      },
      {
        accessorKey: "tags",
        header: "Tags",
        cell: ({ row }) => {
          return (
            <div className="flex gap-1">
              {row.getValue("tags").map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-900"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ renderValue }) => {
          return (
            <Badge
              variant="outline"
              className={`${getStatusBadgeClass(renderValue())}`}
            >
              {renderValue() === "Running" && (
                <LoaderCircle className="animate-spin size-3 mr-1" />
              )}
              {renderValue()}
            </Badge>
          );
        },
      },
      {
        accessorKey: "lastRunDate",
        header: "Last Run",
        cell: ({ renderValue }) => {
          if (renderValue()) {
            return dayjs(renderValue()).format("HH:mm DD/MM/YYYY");
          }
          return "-";
        },
      },
      {
        accessorKey: "duration",
        header: "Duration",
        cell: ({ row }) => {
          if (get(row.original, "params.duration") >= 0) {
            return `${get(row.original, "params.duration")}s`;
          }
          return "-";
        },
      },
      {
        accessorKey: "actions",
        header: ({ column }) => <div className="text-center">Actions</div>,
        cell: ({ row }) => {
          return (
            <RenderActions
              socketRef={socketRef}
              project={project}
              setReRender={setReRender}
              testSuite={row.original}
            />
          );
        },
      },
    ];
  }, []);

  const table = useReactTable({
    data: listTestSuite,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Passed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800";
      case "Failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border-red-200 dark:border-red-800";
      case "Aborted":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 border-orange-200 dark:border-orange-800";
      case "Completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800";
      case "Not Run":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800";
    }
  };

  const handleExecuteAllTestSuite = async () => {
    try {
      await TestSuiteApi().executeAll({ projectId: project.id });
      setReRender({});
      toast.success("Test execution started for all test suites");
      if (
        socketRef.current &&
        socketRef.current.readyState === WebSocket.OPEN
      ) {
        socketRef.current.send(
          JSON.stringify({
            key: "checkStatusTestSuiteAll",
            projectId: project.id,
          })
        );
      }
    } catch (error) {
      const message =
        get(error, "response.data.message") || "An error occurred";
      toast.error(message);
    }
  };

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:3020/ws");

    socket.onopen = () => {
      console.log("WebSocket connected");
    };

    socket.onmessage = (event) => {
      handleEventData(event.data, ({ key, testSuiteName }) => {
        if (key === "reRenderTestSuiteList") {
          setReRender({});
          toast.success(`Test suite ${testSuiteName} execution completed`);
        } else if (key === "reRenderTestSuiteListAll") {
          setReRender({});
          toast.success(`All test suites execution completed`);
        }
      });
    };

    socket.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
    };

    socketRef.current = socket;

    return () => {
      socket.close();
    };
  }, []);

  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Test Suites</h2>

          <div className="flex items-center gap-4">
            <div className="relative w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search test cases..."
                className="pl-10 h-10 w-full"
              />
            </div>

            <Button
              onClick={handleExecuteAllTestSuite}
              className="bg-blue-600 hover:bg-blue-700 text-white h-10"
            >
              <Play className="mr-2 h-4 w-4" />
              Run All Tests
            </Button>

            <Button
              onClick={() => {
                router.push(
                  `/test-management/new-test-case?project=${encodeURIComponent(
                    project.title
                  )}&projectId=${project.id}`
                );
              }}
              className="bg-green-600 hover:bg-green-700 text-white h-10"
            >
              <FilePlus2 className="mr-2 h-4 w-4" />
              Create Test Suite
            </Button>
          </div>
        </div>

        <div className="w-full border rounded-md overflow-hidden bg-background">
          <Table className="w-full">
            <TableHeader className="bg-muted/50">
              <TableRow>
                {table.getHeaderGroups().map((headerGroup) =>
                  headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="py-3 px-4 text-sm font-medium text-foreground"
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
                  <TableRow key={row.id} className="border-b hover:bg-muted/50">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-4 px-4">
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
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end mt-4">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-7 w-7 rounded-md p-0"
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <Button
              variant="default"
              size="sm"
              className="h-7 w-7 rounded-md p-0 bg-blue-600 text-xs"
            >
              1
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-7 w-7 rounded-md p-0"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

const RenderActions = ({
  socketRef,
  project = {},
  testSuite = {},
  setReRender,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const status = testSuite.status;

  const handleExecuteTestSuite = () => {
    return async () => {
      if (!testSuite || isEmpty(testSuite)) return;
      if (testSuite.status === "Running") {
        return;
      }
      try {
        await TestSuiteApi().execute(testSuite.id, {
          status: "processing",
          testSuiteStatus: "Running",
        });
        setReRender({});
        toast.success("Test execution started");
        const isSocketValid = socketRef && socketRef.current;
        if (isSocketValid && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(
            JSON.stringify({
              key: "checkStatusTestSuite",
              testSuiteId: testSuite.id,
            })
          );
        }
      } catch (error) {
        console.log("error :>> ", error);
        const message =
          get(error, "response.data.message") ||
          "Error starting test execution";
        toast.error(message);
      }
    };
  };

  const handleDeleteTestSuite = async () => {
    try {
      setIsDeleting(true);
      await TestSuiteApi().delete(testSuite.id);
      if (setReRender) {
        setReRender({});
      }
      toast.success(`Test suite ${testSuite.name} deleted successfully`);
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error(`Error deleting test suite`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Fragment>
      <div className="flex items-center justify-center gap-1">
        <Button
          disabled={loading || status === "Running"}
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900 dark:hover:text-blue-300"
          onClick={handleExecuteTestSuite()}
        >
          {loading ? (
            <LoaderCircle className="animate-spin h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-foreground/70 hover:bg-muted"
          onClick={() => {
            router.push(
              `/test-management/new-test-case?project=${encodeURIComponent(
                project.title
              )}&projectId=${project.id}&testSuiteId=${testSuite.id}&slug=${
                project?.slug
              }`
            );
          }}
          disabled={loading || status === "Running"}
        >
          <Edit className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-100 dark:hover:text-red-300 dark:hover:bg-red-900"
          onClick={() => setDeleteDialogOpen(true)}
          disabled={loading || status === "Running"}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Test Suite</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this test suite? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-3">
            <div className="border p-3 rounded-md">
              <p className="font-medium">{testSuite.name}</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTestSuite}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Fragment>
  );
};
