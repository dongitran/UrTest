import MyPagination from "@/components/MyPagination";
import TestResourceModal from "@/components/test-management/TestResourceModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Edit, LoaderCircle, Trash2 } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { toast } from "sonner";

const itemsPerPage = 4;

export default function TestRoute({ project = {} }) {
  const [openModal, setOpenModal] = useState(false);
  const [page, setPage] = useState(1);
  const [listTestResource, setListTestResource] = useState([]);
  const { data, refetch } = useQuery({
    enabled: project.id ? true : false,
    queryKey: ["test-resource"],
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
        <CardContent className="min-h-[235px]">
          <div className="grid grid-cols-1 gap-3">
            {listTestResource.map((item) => {
              return <TestResourceItem refetch={refetch} item={item} project={project} key={item.id} />;
            })}
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <MyPagination setPage={setPage} page={page} total={data ? data.listTestResource.length : 1} />
        </CardFooter>
      </Card>
    </>
  );
}

const TestResourceItem = ({ item, refetch, project }) => {
  const [openModal, setOpenModal] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const openDeleteDialog = () => {
    setDeleteDialogOpen(true);
  };
  const handleDeleteResource = async () => {
    try {
      setIsDeleting(true);
      await TestResourceApi().delete(item.id);
      toast.success("Test resource deleted successfully");
      if (refetch) {
        refetch(); // Refresh the list after deletion
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
      <div className="flex gap-3 items-center" key={item.id}>
        <div>
          <p className="text-lg font-semibold">{item.title}</p>
          <div className="max-w-80 text-xs text-muted-foreground truncate">{item.description}</div>
        </div>
        <div className="ml-auto"></div>
        <div>
          <TestResourceModal
            dialogChild={
              <Button className="h-8 w-8" variant="ghost">
                <Edit className="size-4" />
              </Button>
            }
            openModal={openModal}
            setOpenModal={setOpenModal}
            projectId={project.id}
            refetch={refetch}
            testResource={item}
          />
          <Button
            variant="ghost"
            className="h-8 w-8 text-red-700 hover:text-red-800"
            onClick={() => openDeleteDialog(item)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Test Resource</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this test resource? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-4">
            <div className="border p-3 rounded-md">
              <p className="font-medium">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteResource} disabled={isDeleting}>
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
