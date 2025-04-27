"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import LoadingSpinner from "@/components/LoadingSpinner";
import ProjectModal from "@/components/ProjectModal";
import { fetchProjects } from "@/services/api";
import {
  mapProjectToUIFormat,
  calculateProjectStats,
} from "@/utils/projectUtils";
import DashboardStats from "@/components/workspace/DashboardStats";
import ProjectList from "@/components/workspace/ProjectList";
import ActivityFeed from "@/components/workspace/ActivityFeed";
import TestTypeStats from "@/components/workspace/TestTypeStats";

export default function WorkspacePageV2() {
  const [projectModalOpen, setProjectModalOpen] = useState(false);

  const {
    data: projectsData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["/api/project"],
    queryFn: fetchProjects,
  });

  const projects = projectsData ? projectsData.map(mapProjectToUIFormat) : [];

  const projectStats = calculateProjectStats(projects);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <LoadingSpinner size="medium" message="Loading projects..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-red-500 p-4 rounded-md bg-red-50 border border-red-200">
          Error loading projects. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <DashboardStats stats={projectStats} />

      <ProjectList
        projects={projects}
        onCreateClick={() => setProjectModalOpen(true)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ActivityFeed />
        <TestTypeStats />
      </div>

      <ProjectModal open={projectModalOpen} setOpen={setProjectModalOpen} />
    </div>
  );
}
