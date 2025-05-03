"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  EllipsisVertical,
  Search,
  SquarePen,
  Trash2,
  LoaderCircle,
  ChevronRight,
  ChevronLeft,
  Users,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProjectApi } from "@/lib/api";
import { toast } from "sonner";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ManageStaffModal from "../ManageStaffModal";

export default function ProjectTable({
  initDataTable,
  setDataTable,
  refetch,
  dataTable = [],
  setProjectModalOpen,
}) {
  const [sorting, setSorting] = React.useState();
  const [columnFilters, setColumnFilters] = React.useState([]);
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [projectNameFilter, setProjectNameFilter] = React.useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [projectToDelete, setProjectToDelete] = React.useState(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [manageStaffModalOpen, setManageStaffModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const isAdminOrManager = () => {
    const tokenInfo = localStorage.getItem("keycloak_token")
      ? JSON.parse(localStorage.getItem("keycloak_token"))
      : null;

    if (!tokenInfo) return false;

    try {
      const tokenData = JSON.parse(atob(tokenInfo.access_token.split(".")[1]));
      const roles = tokenData.realm_access?.roles || [];
      return roles.includes("ADMIN") || roles.includes("MANAGER");
    } catch (error) {
      console.error("Error parsing token:", error);
      return false;
    }
  };

  const columns = React.useMemo(() => {
    return [
      {
        accessorKey: "title",
        header: "Project Name",
        cell: ({ row }) => {
          return (
            <div className="col-span-2 flex items-center">
              <div className="hidden sm:visible mr-3 sm:flex h-9 w-9 items-center justify-center rounded-full bg-blue-100">
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
              <div className="min-w-[200px] flex-1 pr-4">
                <div className="font-semibold text-base">
                  {row.getValue("title")}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {row.original["description"]}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "totalTestSuite",
        header: "Test Suite",
        cell: ({ row }) => {
          return (
            <div className="text-center">{row.getValue("totalTestSuite")}</div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
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
        accessorKey: "totalTestSuiteExecute",
        header: "Total Test Suite Execution",
      },
      {
        accessorKey: "createdBy",
        header: () => <div className="text-center">Người tạo</div>,
        cell: ({ row }) => (
          <div className="lowercase">{row.getValue("createdBy")}</div>
        ),
      },
      {
        accessorKey: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost">
                  <EllipsisVertical className="!size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <Link href={`/test-management?projectId=${row.original["id"]}`}>
                  <DropdownMenuItem>
                    Edit
                    <DropdownMenuShortcut>
                      <SquarePen className="size-4" />
                    </DropdownMenuShortcut>
                  </DropdownMenuItem>
                </Link>

                {isAdminOrManager() && (
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedProject(row.original);
                      setManageStaffModalOpen(true);
                    }}
                  >
                    Manage Staff
                    <DropdownMenuShortcut>
                      <Users className="size-4" />
                    </DropdownMenuShortcut>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem
                  onClick={() => handleDeleteClick(row.original)}
                >
                  Delete
                  <DropdownMenuShortcut>
                    <Trash2 className="size-4" />
                  </DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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

  const handleDeleteClick = (project) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      setIsDeleting(true);
      await ProjectApi().delete(projectToDelete.id);
      if (refetch) refetch();
      toast.success("Project deleted successfully");
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error("Error deleting project");
    } finally {
      setIsDeleting(false);
      setProjectToDelete(null);
    }
  };

  const handleFilterDataTable = (searchTerm = projectNameFilter) => {
    if (searchTerm && searchTerm.trim() !== "") {
      setDataTable(
        initDataTable.filter((item) =>
          new RegExp(searchTerm, "i").test(item.title)
        )
      );
    } else {
      setDataTable(initDataTable);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex gap-3 items-center">
          <CardTitle>Projects List</CardTitle>

          <div className="ml-auto"></div>
          <div className="relative w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={projectNameFilter}
              onChange={(e) => {
                const newValue = e.target.value;
                setProjectNameFilter(newValue);
                handleFilterDataTable(newValue);
              }}
              placeholder="Search projects..."
              className="pl-8"
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
            Create Project
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table className="table-fixed">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        className={
                          header.id.includes("title")
                            ? "w-1/4"
                            : header.id.includes("progress")
                            ? "w-1/6"
                            : ""
                        }
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
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
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Delete Project</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this project? This action cannot
                be undone.
              </DialogDescription>
            </DialogHeader>
            {projectToDelete && (
              <div className="pt-4">
                <div className="border p-3 rounded-md">
                  <p className="font-medium">{projectToDelete.title}</p>
                  {projectToDelete.description && (
                    <p className="text-sm text-muted-foreground">
                      {projectToDelete.description}
                    </p>
                  )}
                </div>
              </div>
            )}
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
                onClick={handleDeleteProject}
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

        <ManageStaffModal
          open={manageStaffModalOpen}
          setOpen={setManageStaffModalOpen}
          project={selectedProject}
        />
      </CardContent>
    </Card>
  );
}
