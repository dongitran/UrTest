import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchProjects } from "@/services/api";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function ProjectSelector({ onNavigateToNewTestCase }) {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getProjects = async () => {
      try {
        const projectData = await fetchProjects();
        setProjects(projectData);

        if (projectData.length > 0) {
          setSelectedProject(projectData[0].id);
        }

        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch projects:", err);
        setError("Failed to load projects. Please try again later.");
        setLoading(false);
      }
    };

    getProjects();
  }, []);

  const handleProjectChange = (value) => {
    setSelectedProject(value);
  };

  const navigateToNewTestCase = () => {
    const selectedProjectName =
      projects.find((p) => p.id === selectedProject)?.title || "";
    onNavigateToNewTestCase(selectedProjectName);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-16">
        <LoadingSpinner size="small" message="Loading projects..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-16">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="font-medium">Project:</span>
          <Select value={selectedProject} onValueChange={handleProjectChange}>
            <SelectTrigger className="w-[400px]">
              <SelectValue
                placeholder={
                  projects.length > 0
                    ? projects.find((p) => p.id === selectedProject)?.title
                    : "Select a project"
                }
              />
            </SelectTrigger>
            <SelectContent className="min-w-[200px] w-auto">
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium">Test cases:</span>
          <span>32</span>
        </div>
      </div>
      <div className="flex gap-2">
        <Button className="gap-1 items-center bg-blue-600 hover:bg-blue-700">
          <Play className="h-4 w-4" />
          Run All Tests
        </Button>
        <Button className="gap-1 items-center" onClick={navigateToNewTestCase}>
          <Plus className="h-4 w-4" />
          New Test Case
        </Button>
      </div>
    </div>
  );
}
