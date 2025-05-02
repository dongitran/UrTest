import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TestSuiteApi } from "@/lib/api";
import { handleEventData } from "@/lib/websocket";
import dayjs from "dayjs";
import { get } from "lodash";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  FilePlus2,
  FileText,
  LoaderCircle,
  Pause,
  Play,
  Search,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { flexRender, getCoreRowModel, getPaginationRowModel, useReactTable } from "@tanstack/react-table";

export default function TestCaseList({ project = {}, listTestSuite = [], setReRender }) {
  const router = useRouter();
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const socketRef = useRef(null);
  const table = useReactTable({
    data: listTestSuite,
    columns: [
      {
        accessorKey: "name",
        header: "Test Suite",
        cell: ({ row }) => {
          return (
            <div className="col-span-4">
              <div className="font-medium text-xl">{row.original.name}</div>
              <div className="text-xs text-muted-foreground">{row.original.description}</div>
            </div>
          );
        },
      },
      {
        accessorKey: "tags",
        header: "Tags",
        cell: ({ row }) => {
          return (
            <div className="flex gap-1">
              {row.getValue("tags").map((tag) => (
                <Badge key={tag} variant="default">
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
            <Badge variant="outline" className={`${getStatusBadgeClass(renderValue())}`}>
              {renderValue() === "Running" && <LoaderCircle className="animate-spin size-3 mr-1" />}
              {renderValue()}
            </Badge>
          );
        },
      },
      {
        accessorKey: "lastRunDate",
        header: "LAST RUN",
        cell: ({ renderValue }) => {
          if (renderValue()) {
            return dayjs(renderValue()).format("HH:mm DD/MM/YYYY");
          }
        },
      },
      {
        accessorKey: "duration",
        header: "DURATION",
        cell: ({ row }) => {
          if (get(row.original, "params.duration")) {
            return `${get(row.original, "params.duration")}s`;
          }
        },
      },
      {
        accessorKey: "actions",
        header: <div className="justify-end flex">Actions</div>,
        cell: ({ row }) => {
          const status = row.getValue("status");
          return (
            <div className="flex items-center justify-end">
              <Button
                disabled={isButtonLoading || status === "Running"}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleExecuteTestSuite(row.original)}
              >
                {isButtonLoading ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <Fragment>
                    {status === "Running" ? <Pause className="size-4" /> : <Play className="size-4" />}
                  </Fragment>
                )}
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {}}
                    disabled={!(status === "Completed" && get(row.original, "params.resultRuner.reportUrl"))}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  >
                    {isButtonLoading ? <LoaderCircle className="animate-spin" /> : <FileText className="size-4" />}
                  </Button>
                </DialogTrigger>
                <DialogContent className="min-w-[1000px]">
                  <DialogHeader>
                    <DialogTitle>Xem kết quả của kịch bản test {row.original.name}</DialogTitle>
                    <DialogDescription>Chi tiết các thông số về kết quả của kịch bản test</DialogDescription>
                  </DialogHeader>
                  <div className="w-full min-h-[650px] overflow-auto">
                    <iframe
                      src={`${row.original.params?.resultRuner?.reportUrl}/report.html`}
                      className="w-full h-full border-none"
                      allowFullScreen
                    ></iframe>
                  </div>
                </DialogContent>
              </Dialog>
              <Button
                onClick={() => {
                  router.push(
                    `/test-management/new-test-case?project=${encodeURIComponent(project.title)}&projectId=${
                      project.id
                    }&testSuiteId=${row.original.id}&slug=${project?.slug}`
                  );
                }}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={isButtonLoading || status === "Running"}
              >
                {isButtonLoading ? <LoaderCircle className="animate-spin" /> : <Edit className="h-4 w-4" />}
              </Button>
              <Button
                onClick={() => handleDeleteTestSuite(row.original)}
                disabled={isButtonLoading || status === "Running"}
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-600"
              >
                {isButtonLoading ? <LoaderCircle className="animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>
            </div>
          );
        },
      },
    ],
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Passed":
        return "bg-green-100 text-green-800 border-green-200";
      case "Failed":
        return "bg-red-100 text-red-800 border-red-200";
      case "Aborted":
        return "bg-orange-600 text-orange-100 border-orange-600";
      case "Completed":
        return "bg-green-700 text-white border-green-700";
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
  const handleExecuteTestSuite = (testSuite) => {
    return async () => {
      if (!testSuite) return;
      if (testSuite.status === "Running") {
        return;
      }
      try {
        await TestSuiteApi().execute(testSuite.id, {
          status: "processing",
          testSuiteStatus: "Running",
        });
        setReRender({});
        toast.success("Bắt đầu thực thi kịch bản test");
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({ key: "checkStatusTestSuite", testSuiteId: testSuite.id }));
        }
      } catch (error) {
        const message = get(error, "response.data.message") || "Có lỗi khi bắt đầu thực thi kịch bản test";
        toast.error(message);
      }
    };
  };
  const handleExecuteAllTestSuite = async () => {
    try {
      await TestSuiteApi().executeAll({ projectId: project.id });
      setReRender({});
      toast("Đã gửi yêu cầu thực hiện tất cả kịch bản test");
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ key: "checkStatusTestSuiteAll", projectId: project.id }));
      }
    } catch (error) {
      const message = get(error, "response.data.message") || "Có lỗi xảy ra";
      toast.error(message);
    }
  };
  const handleDeleteTestSuite = async (test) => {
    try {
      setIsButtonLoading(true);
      await TestSuiteApi().delete(test.id);
      setReRender({});
      toast.success(`Đã xóa kịch bản ${test.name} thành công`);
    } catch (error) {
      toast.error(`Có lỗi khi xóa kịch bản test thất bại`);
    } finally {
      setIsButtonLoading(false);
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
          toast(`Kịch bản test ${testSuiteName} đã được thực thi xong`);
        } else if (key === "reRenderTestSuiteListAll") {
          setReRender({});
          toast(`Tất cả kịch bản test đã hoàn tất thực thi`);
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
    <Card>
      <CardHeader className="pb-2">
        <div className="flex gap-3 items-center">
          <CardTitle>Danh sách Testsuite</CardTitle>
          <div className="ml-auto"></div>
          <div className="flex gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search test cases..." className="pl-8" />
            </div>
          </div>

          <Button
            size="sm"
            className="rounded-sm gap-1 items-center bg-blue-700 hover:bg-blue-800 text-white"
            onClick={handleExecuteAllTestSuite}
          >
            <Play className="!size-4" />
            Run All Tests
          </Button>
          <Button
            onClick={() => {
              router.push(
                `/test-management/new-test-case?project=${encodeURIComponent(project.title)}&projectId=${project.id}`
              );
            }}
          >
            <FilePlus2 className="size-4" />
            Create Test Suite
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-sm border">
          <Table className="table-fixed">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-7 w-7"
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
