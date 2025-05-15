import { Fragment, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { LoaderCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";

const ProjectModal = ({ open, setOpen, onSuccess }) => {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const onCreateProject = async () => {
    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/project`,
        { title: name, description },
        {
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("keycloak_token")
                ? JSON.parse(localStorage.getItem("keycloak_token"))
                    .access_token
                : ""
            }`,
          },
        }
      );

      setDescription("");
      setName("");
      toast.success("Project created successfully");

      if (onSuccess) {
        onSuccess();
      } else if (setOpen) {
        setOpen(false);
      }

      queryClient.invalidateQueries(["/api/project"]);
      queryClient.invalidateQueries(["/api/dashboard"]);
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Fragment>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>
              Create a new project to manage your test cases.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 items-center gap-4">
              <Label htmlFor="name" className="">
                Name
              </Label>
              <Input
                onChange={(e) => {
                  setName(e.target.value);
                }}
                value={name}
                id="name"
                className="col-span-3"
                placeholder="Enter project name"
              />
            </div>
            <div className="grid grid-cols-1 items-center gap-4">
              <Label htmlFor="description" className="">
                Description
              </Label>
              <Textarea
                onChange={(e) => {
                  setDescription(e.target.value);
                }}
                value={description}
                id="description"
                className="col-span-3"
                placeholder="Enter project description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (setOpen) setOpen(false);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              disabled={loading}
              onClick={onCreateProject}
              className="bg-blue-700 hover:bg-blue-800 text-white"
            >
              {loading && (
                <LoaderCircle className="animate-spin mr-2 h-4 w-4" />
              )}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Fragment>
  );
};

export default ProjectModal;
