import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProjectApi } from "@/lib/api";
import { Play, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function ProjectSelector({ setProject }) {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProject] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const handleNavigateToNewTestCase = (projectName) => {
    router.push(`/test-management/new-test-case?project=${encodeURIComponent(projectName)}`);
  };
  useEffect(() => {
    const getProjects = async () => {
      try {
        const data = await ProjectApi().get();
        setProjects(data.projects);
        setLoading(false);
      } catch (err) {
        toast.error("Không thể tải danh sách Project");
        console.error("Failed to fetch projects:", err);
        setError("Failed to load projects. Please try again later.");
        setLoading(false);
      }
    };

    getProjects();
  }, []);
  const handleGetProjectDetail = async (projectId) => {
    try {
      const data = await ProjectApi().detail(projectId);
      setProject(data.project);
    } catch (error) {}
  };

  useEffect(() => {
    if (selectedProjectId) {
      handleGetProjectDetail(selectedProjectId);
    }
  }, [selectedProjectId]);

  const handleProjectChange = (value) => {
    setSelectedProject(value);
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
          <Select value={selectedProjectId} onValueChange={handleProjectChange}>
            <SelectTrigger className="w-[400px]">
              <SelectValue placeholder={`Chọn Project để xem thông tin`} />
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
      </div>
      <div className="flex gap-2">
        <Button className="rounded-sm gap-1 items-center bg-blue-700 hover:bg-blue-800 text-white">
          <Play className="h-4 w-4" />
          Run All Tests
        </Button>
        <Button
          className="gap-1 items-center rounded-sm"
          onClick={() => {
            handleNavigateToNewTestCase(selectedProjectId);
          }}
        >
          <Plus className="h-4 w-4" />
          New Test Case
        </Button>
      </div>
    </div>
  );
}
