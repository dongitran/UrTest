"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import LoadingSpinner from "@/components/LoadingSpinner";
import ProjectModal from "@/components/ProjectModal";
import { fetchProjects } from "@/services/api";
import { mapProjectToUIFormat, calculateProjectStats } from "@/utils/projectUtils";
import DashboardStats from "@/components/dashboard/DashboardStats";
import ProjectList from "@/components/dashboard/ProjectList";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import TestTypeStats from "@/components/dashboard/TestTypeStats";
import { DashboardApi } from "@/lib/api";
import ProjectTable from "@/components/dashboard/ProjectTable";

export default function WorkspacePageV2() {
  const [projectModalOpen, setProjectModalOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["/api/dashboard"],
    queryFn: () => {
      return DashboardApi().get();
    },
  });

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
      <DashboardStats data={data} />

      <ProjectTable refetch={refetch} dataTable={data.dataTable} setProjectModalOpen={setProjectModalOpen} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ActivityFeed />
        <TestTypeStats />
      </div>

      <ProjectModal open={projectModalOpen} setOpen={setProjectModalOpen} />
    </div>
  );
}
