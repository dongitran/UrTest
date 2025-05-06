import { Fragment, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoaderCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { ProjectApi } from "@/lib/api";

const EditProjectModal = ({ project, open, setOpen, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { register, getValues, reset } = useForm({});

  useEffect(() => {
    if (project && open) {
      reset({ title: project.title, description: project.description });
    }
  }, [project, reset, open]);

  const handleUpdateProject = async () => {
    try {
      setLoading(true);
      const data = getValues();
      await ProjectApi().patch(project.id, data);
      toast.success("Data updated successfully");
      if (onSuccess) onSuccess(data);
      if (setOpen) setOpen(false);
    } catch (error) {
      toast.error("Error updating data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Fragment>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Project Information</DialogTitle>
            <DialogDescription>
              Edit project name and description
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 items-center gap-4">
              <Input
                {...register("title")}
                placeholder="Project Name"
                className="rounded-sm"
              />
              <Textarea
                {...register("description")}
                placeholder="Project Description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (setOpen) setOpen(false);
              }}
              disabled={loading}
              variant="outline"
            >
              {loading && (
                <LoaderCircle className="animate-spin mr-2 h-4 w-4" />
              )}
              Cancel
            </Button>
            <Button
              disabled={loading}
              onClick={handleUpdateProject}
              className="bg-blue-700 hover:bg-blue-800 text-white"
            >
              {loading && (
                <LoaderCircle className="animate-spin mr-2 h-4 w-4" />
              )}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Fragment>
  );
};

export default EditProjectModal;
