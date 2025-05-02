import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import TestResourceModal from "@/components/test-management/TestResourceModal";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TestResourceApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  LoaderCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function TestSuccessRate({ project = {} }) {
  const [openModal, setOpenModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState(null);

  const { data, refetch } = useQuery({
    enabled: project.id ? true : false,
    queryKey: ["test-resource"],
    queryFn: () => {
      return TestResourceApi().list({ projectId: project.id });
    },
  });

  const openDeleteDialog = (resource) => {
    setResourceToDelete(resource);
    setDeleteDialogOpen(true);
  };

  const handleDeleteResource = async () => {
    if (!resourceToDelete) return;

    try {
      setIsDeleting(true);
      await TestResourceApi().delete(resourceToDelete.id);
      toast.success("Test resource deleted successfully");
      refetch(); // Refresh the list after deletion
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting test resource:", error);
      toast.error("Failed to delete test resource");
    } finally {
      setIsDeleting(false);
      setResourceToDelete(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="">
          <CardTitle className="flex gap-3 items-center">
            <span className="text-ml font-semibold">Test Resource</span>
            <div className="ml-auto"></div>
            <TestResourceModal
              dialogChild={<Button className="">Create Test Resource</Button>}
              openModal={openModal}
              setOpenModal={setOpenModal}
              projectId={project.id}
              refetch={refetch}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3">
            {data?.listTestResource.map((item) => {
              return (
                <div className="flex gap-3 items-center" key={item.id}>
                  <div>
                    <p className="text-lg font-semibold">{item.title}</p>
                    <div className="max-w-80 text-xs text-muted-foreground truncate">
                      {item.description}
                    </div>
                  </div>
                  <div className="ml-auto"></div>
                  <div>
                    <Button className="h-8 w-8" variant="ghost">
                      <Edit className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      className="h-8 w-8 text-red-700 hover:text-red-800"
                      onClick={() => openDeleteDialog(item)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-1 mt-3 justify-end">
            <Button variant="outline" size="icon" className="h-7 w-7">
              <ChevronLeft className="size-4" />
            </Button>
            {[1, 2, 3, 4, 5].map((page) => (
              <Button
                key={page}
                variant={1 === page ? "default" : "outline"}
                size="icon"
                className="h-7 w-7"
              >
                {page}
              </Button>
            ))}
            <Button variant="outline" size="icon" className="h-7 w-7">
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Test Resource</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this test resource? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-4">
            {resourceToDelete && (
              <div className="border p-3 rounded-md">
                <p className="font-medium">{resourceToDelete.title}</p>
                <p className="text-sm text-muted-foreground">
                  {resourceToDelete.description}
                </p>
              </div>
            )}
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
    </>
  );
}
