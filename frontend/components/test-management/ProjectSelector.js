import LoadingSpinner from "@/components/LoadingSpinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useProjects, useProjectDetails } from "@/hooks/useProjects";

export default function ProjectSelector({ setProject, projectId }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedProjectId, setSelectedProject] = useState(projectId || "");

  const { data, isLoading, error } = useProjects();
  const { data: projectDetails } = useProjectDetails(selectedProjectId);

  useEffect(() => {
    if (projectDetails?.project) {
      setProject(projectDetails.project);
    }
  }, [projectDetails, setProject]);

  useEffect(() => {
    if (projectId) {
      setSelectedProject(projectId);
    } else if (data?.projects?.length > 0) {
      setSelectedProject(data.projects[0].id);
    }
  }, [projectId, data]);

  const handleProjectChange = async (value) => {
    try {
      const params = new URLSearchParams(searchParams.toString());
      params.set("projectId", value);

      const selectedProject = data?.projects?.find((p) => p.id === value);
      if (selectedProject) {
        params.set("project", selectedProject.title);
      }

      router.push(`?${params.toString()}`);
    } catch (error) {
      toast.error("Failed to change project");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-10 w-[400px] border rounded-md px-3">
        <LoadingSpinner size="small" message="Loading projects..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-10 border rounded-md px-3 w-[400px]">
        <div className="text-red-500 dark:text-red-400 text-sm">
          Failed to load projects
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Select value={selectedProjectId} onValueChange={handleProjectChange}>
            <SelectTrigger className="w-[400px] h-8">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent className="min-w-[200px] w-auto">
              {data?.projects?.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
