import MyPagination from "@/components/MyPagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TestResourceApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Edit, LoaderCircle, Trash2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useState } from "react";
import { toast } from "sonner";

const itemsPerPage = 4;

export default function TestRoute({ project = {} }) {
  const [page, setPage] = useState(1);
  const [listTestResource, setListTestResource] = useState([]);
  const router = useRouter();

  const { data, refetch } = useQuery({
    enabled: project.id ? true : false,
    queryKey: ["test-resource", project.id],
    queryFn: () => {
      return TestResourceApi().list({ projectId: project.id });
    },
  });

  useEffect(() => {
    if (data && Array.isArray(data.listTestResource)) {
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      setListTestResource(data.listTestResource.slice(startIndex, endIndex));
    }
  }, [data, page]);

  return (
    <Card className="overflow-hidden border rounded-lg shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <h3 className="font-medium">Test Resources</h3>
        <div className="flex items-center gap-2">
          {data &&
            data.listTestResource &&
            data.listTestResource.length > itemsPerPage && (
              <MyPagination
                setPage={setPage}
                page={page}
                total={data ? data.listTestResource.length : 1}
              />
            )}
          <Button
            onClick={() => {
              router.push(
                `/test-management/ur-editor/resource?project=${encodeURIComponent(
                  project.title
                )}&projectId=${project.id}`
              );
            }}
            variant="outline"
            size="sm"
            className="hover:bg-muted text-xs h-7 flex items-center gap-1"
          >
            <Plus className="h-3 w-3" />
            Create Resource
          </Button>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 gap-2">
          {listTestResource.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No test resources available
            </div>
          ) : (
            listTestResource.map((item) => {
              return (
                <TestResourceItem
                  refetch={refetch}
                  item={item}
                  project={project}
                  key={item.id}
                />
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const TestResourceItem = ({ item, refetch, project }) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const openDeleteDialog = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteResource = async () => {
    try {
      setIsDeleting(true);
      await TestResourceApi().delete(item.id, {
        projectId: project.id,
      });
      toast.success("Test resource deleted successfully");
      if (refetch) {
        refetch();
      }
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting test resource:", error);
      toast.error("Failed to delete test resource");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Fragment>
      <div className="flex gap-3 items-center p-2 border rounded-md bg-muted/50 hover:bg-muted transition-colors">
        <div className="flex-1">
          <p className="text-sm font-medium">{item.title}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            onClick={() => {
              router.push(
                `/test-management/ur-editor/resource?project=${encodeURIComponent(
                  project.title
                )}&projectId=${project.id}&resourceId=${item.id}&slug=${
                  project?.slug
                }`
              );
            }}
            className="h-7 w-7 p-0"
            variant="ghost"
          >
            <Edit className="size-4 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            className="h-7 w-7 p-0 text-red-600 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/50"
            onClick={() => openDeleteDialog(item)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Test Resource</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this test resource? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-3">
            <div className="border p-3 rounded-md">
              <p className="font-medium">{item.title}</p>
              <p className="text-sm text-muted-foreground">
                {item.description}
              </p>
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
              onClick={handleDeleteResource}
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
