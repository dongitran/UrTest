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
  Filter,
  Plus,
} from "lucide-react";
import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { isAdminOrManager } from "@/utils/authUtils";

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
  canCreateProject,
}) {
  const router = useRouter();
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
  const [isMobile, setIsMobile] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const { user } = useAuth();
  const hasAdminManagerAccess = isAdminOrManager(user);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsSearchOpen(false);
      }
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setColumnVisibility({
        title: true,
        status: true,
        actions: true,
        totalTestSuite: false,
        totalTestSuiteExecute: false,
        createdBy: false,
      });
    } else {
      setColumnVisibility({
        title: true,
        status: true,
        actions: true,
        totalTestSuite: true,
        totalTestSuiteExecute: true,
        createdBy: true,
      });
    }
  }, [isMobile]);

  const navigateToProject = (projectId) => {
    router.push(`/automation-test?projectId=${projectId}`);
  };

  const columns = React.useMemo(() => {
    return [
      {
        accessorKey: "title",
        header: "Project Name",
        cell: ({ row }) => {
          return (
            <div className="flex items-center">
              <div className="hidden sm:flex mr-3 h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
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
              <div className="flex-1 pr-4 min-w-0">
                <div
                  className="font-semibold text-base cursor-pointer hover:text-blue-600 transition-colors truncate"
                  onClick={() => navigateToProject(row.original["id"])}
                >
                  {row.getValue("title")}
                </div>
                <div className="text-xs text-muted-foreground truncate max-w-full">
                  {isMobile && (
                    <div className="flex flex-col gap-1 mt-1">
                      <div className="flex items-center">
                        <span className="text-xs text-muted-foreground mr-2">
                          Test Suite:
                        </span>
                        <span className="text-xs">
                          {row.original["totalTestSuite"]}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs text-muted-foreground mr-2">
                          Executions:
                        </span>
                        <span className="text-xs">
                          {row.original["totalTestSuiteExecute"]}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs text-muted-foreground mr-2">
                          Creator:
                        </span>
                        <span className="text-xs">
                          {row.original["createdBy"]}
                        </span>
                      </div>
                    </div>
                  )}
                  {!isMobile && row.original["description"]}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "totalTestSuite",
        header: () => <div className="text-center">Test Suite</div>,
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
        header: () => <div className="text-center">Test Executions</div>,
        cell: ({ row }) => {
          return (
            <div className="text-center">
              {row.getValue("totalTestSuiteExecute")}
            </div>
          );
        },
      },
      {
        accessorKey: "createdBy",
        header: () => <div className="text-center">Creator</div>,
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
                <DropdownMenuItem
                  onClick={() => navigateToProject(row.original["id"])}
                  disabled={!hasAdminManagerAccess}
                >
                  Edit
                  <DropdownMenuShortcut>
                    <SquarePen className="size-4" />
                  </DropdownMenuShortcut>
                </DropdownMenuItem>

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

                <DropdownMenuItem
                  onClick={() => handleDeleteClick(row.original)}
                  disabled={!hasAdminManagerAccess}
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
  }, [hasAdminManagerAccess, isMobile]);

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
    <Card className="shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <CardTitle>Projects List</CardTitle>

          <div className="ml-auto"></div>

          {isMobile && !isSearchOpen && (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsSearchOpen(true)}
                className="ml-auto"
              >
                <Search className="h-4 w-4" />
              </Button>
              <Button
                className="rounded-sm px-2"
                onClick={() => {
                  if (setProjectModalOpen) {
                    setProjectModalOpen(true);
                  }
                }}
                disabled={!canCreateProject}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" /> New
              </Button>
            </div>
          )}

          {(!isMobile || isSearchOpen) && (
            <div
              className={`${
                isMobile
                  ? "flex w-full items-center"
                  : "relative w-full sm:w-80"
              }`}
            >
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={projectNameFilter}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setProjectNameFilter(newValue);
                  handleFilterDataTable(newValue);
                }}
                placeholder="Search projects..."
                className="pl-8 w-full"
              />
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSearchOpen(false)}
                  className="ml-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {!isMobile && !isSearchOpen && (
            <Button
              className="rounded-sm"
              onClick={() => {
                if (setProjectModalOpen) {
                  setProjectModalOpen(true);
                }
              }}
              disabled={!canCreateProject}
            >
              Create Project
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead
                          key={header.id}
                          className={
                            header.id.includes("title")
                              ? "w-1/2 md:w-1/4"
                              : header.id.includes("status")
                              ? "w-1/4 md:w-1/6"
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
                      colSpan={
                        Object.keys(columnVisibility).filter(
                          (key) => columnVisibility[key]
                        ).length
                      }
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
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
          hasAdminManagerAccess={hasAdminManagerAccess}
        />
      </CardContent>
    </Card>
  );
}
