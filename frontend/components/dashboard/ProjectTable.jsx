"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { EllipsisVertical, Search, SquarePen, Trash2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProjectApi } from "@/lib/api";
import dayjs from "dayjs";
import { toast } from "sonner";
import { Badge } from "../ui/badge";

export default function ProjectTable({ initDataTable, setDataTable, refetch, dataTable = [], setProjectModalOpen }) {
  const [sorting, setSorting] = React.useState();
  const [columnFilters, setColumnFilters] = React.useState([]);
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [projectNameFilter, setProjectNameFilter] = React.useState("");
  const columns = React.useMemo(() => {
    return [
      {
        accessorKey: "title",
        header: "Tên Project",
        cell: ({ row }) => {
          return (
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
                <div className="font-semibold text-base">{row.getValue("title")}</div>
                <div className="text-xs text-muted-foreground truncate">{row.original["description"]}</div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => (
          <div>
            <Badge
              variant="outline"
              className={`px-2 py-0.5 rounded-sm ${
                row.getValue("status") === "Stable"
                  ? "bg-green-100 text-green-800 border-green-200"
                  : row.getValue("status") === "Needs Attention"
                  ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                  : row.getValue("status") === "Critical Error"
                  ? "bg-red-100 text-red-800 border-red-200"
                  : row.getValue("status") === "In Development"
                  ? "bg-blue-100 text-blue-800 border-blue-200"
                  : "bg-gray-100 text-gray-800 border-gray-200"
              }`}
            >
              {row.getValue("status")}
            </Badge>
          </div>
        ),
      },
      {
        accessorKey: "progress",
        header: () => <div className="text-center">Tiến trình</div>,
        cell: ({ row }) => (
          <div className="flex gap-3 items-center">
            <Progress value={33} className="" indicatorColor="bg-green-700" />
            <span className="text-xs">33%</span>
          </div>
        ),
      },
      {
        accessorKey: "successRate",
        header: () => <div className="text-right">Tỉ lệ thành công</div>,
        cell: ({ row }) => <div className="lowercase">{row.getValue("successRate")}</div>,
      },
      {
        accessorKey: "updatedAt",
        header: () => <div className="text-center">Lần chạy gần nhất</div>,
        cell: ({ row }) => (
          <div className="lowercase">
            {row.getValue("updatedAt") && dayjs(row.getValue("updatedAt")).format("HH:mm DD/MM/YYYY")}
          </div>
        ),
      },
      {
        accessorKey: "actions",
        header: () => <div className="text-center"></div>,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost">
                <EllipsisVertical className="!size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <Link href={`/test-management?id=${row.original["id"]}`}>
                <DropdownMenuItem>
                  Chỉnh sửa
                  <DropdownMenuShortcut>
                    <SquarePen className="size-4" />
                  </DropdownMenuShortcut>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem onClick={handleDeleteProject(row.original["id"])}>
                Xóa
                <DropdownMenuShortcut>
                  <Trash2 className="size-4" />
                </DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ];
  }, []);
  const table = useReactTable({
    data: dataTable,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });
  const handleDeleteProject = (id) => {
    return async () => {
      try {
        await ProjectApi().delete(id);
        if (refetch) refetch();
        toast.success("Bạn đã xóa Project thành công");
      } catch (error) {
        toast.error("Có lỗi khi xóa Project");
      }
    };
  };
  const handleFilterDataTable = () => {
    if (projectNameFilter) {
      setDataTable(initDataTable.filter((item) => new RegExp(projectNameFilter, "i").test(item.title)));
    } else setDataTable(initDataTable);
  };
  return (
    <div className="w-full">
      <div className="flex gap-3 items-center py-4">
        <div className="text-xl font-semibold">Danh sách Project</div>

        <div className="ml-auto"></div>
        <div className="relative w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={projectNameFilter}
            onChange={(e) => {
              setProjectNameFilter(e.target.value);
            }}
            placeholder="Nhập tên Project và Enter để tìm kiếm"
            className="pl-8"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleFilterDataTable();
              }
            }}
          />
        </div>
        <Button
          className="rounded-sm"
          onClick={() => {
            if (setProjectModalOpen) {
              setProjectModalOpen(true);
            }
          }}
        >
          Tạo Project
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
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
          >
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
