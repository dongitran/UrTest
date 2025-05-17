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
import { useTheme } from "next-themes";

export default function ProjectSelector({ setProject, projectId }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedProjectId, setSelectedProject] = useState(projectId || "");
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";

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

  const triggerBgClass = isDarkTheme ? "bg-gray-800/50" : "bg-gray-100/80";
  const triggerHoverClass = isDarkTheme ? "hover:bg-gray-700/50" : "hover:bg-gray-200/80";
  const triggerBorderClass = isDarkTheme ? "border-gray-700" : "border-gray-300";
  const focusBorderClass = isDarkTheme ? "focus:border-blue-400" : "focus:border-blue-500";
  const focusRingClass = isDarkTheme ? "focus:ring-blue-500/30" : "focus:ring-blue-300";
  const textClass = isDarkTheme ? "text-gray-200" : "text-foreground";

  const badgeBgClass = isDarkTheme ? "bg-blue-900/50" : "bg-blue-100/80";
  const badgeTextClass = isDarkTheme ? "text-blue-300" : "text-blue-700";
  const badgeBorderClass = isDarkTheme ? "border-blue-800/50" : "border-blue-200/50";

  const dropdownBgClass = isDarkTheme ? "bg-[#121212]" : "bg-white";
  const dropdownBorderClass = isDarkTheme ? "border-gray-800" : "border-gray-200";
  const dropdownTextClass = isDarkTheme ? "text-gray-100" : "text-gray-900";

  const itemHoverClass = isDarkTheme ? "hover:bg-gray-800" : "hover:bg-gray-100";
  const itemSelectedBgClass = isDarkTheme ? "data-[state=checked]:bg-blue-950" : "data-[state=checked]:bg-blue-50";
  const itemSelectedTextClass = isDarkTheme ? "data-[state=checked]:text-blue-300" : "data-[state=checked]:text-blue-700";

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
        <div className={isDarkTheme ? "text-red-400" : "text-red-500"}>
          Failed to load projects
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground font-medium">
        Current Project:
      </span>
      <div className="relative z-30">
        <Select value={selectedProjectId} onValueChange={handleProjectChange}>
          <SelectTrigger
            className={`w-[280px] h-8 ${triggerBgClass} border ${triggerBorderClass} 
                      ${triggerHoverClass} transition-colors
                      ${focusBorderClass} focus:ring-1 ${focusRingClass}
                      rounded-md shadow-sm`}
          >
            <div className="flex justify-between items-center w-full pr-6">
              <span className={`truncate font-medium ${textClass}`}>
                {data?.projects?.find((p) => p.id === selectedProjectId)
                  ?.title || "Select project"}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded ${badgeBgClass} 
                            ${badgeTextClass} border ${badgeBorderClass}
                            ml-2 whitespace-nowrap`}
              >
                Project
              </span>
            </div>
          </SelectTrigger>
          <SelectContent
            className={`min-w-[280px] w-auto z-50 overflow-hidden rounded-md border ${dropdownBorderClass} 
                      ${dropdownBgClass} ${dropdownTextClass} shadow-md`}
            align="start"
            position="popper"
            side="bottom"
            sideOffset={4}
          >
            <div className="max-h-[300px] overflow-y-auto p-1">
              {data?.projects?.map((project) => (
                <SelectItem
                  key={project.id}
                  value={project.id}
                  className={`px-2 py-1.5 rounded-sm text-sm cursor-pointer flex items-center ${itemHoverClass} 
                            ${itemSelectedBgClass} ${itemSelectedTextClass}`}
                >
                  {project.title}
                </SelectItem>
              ))}
            </div>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
