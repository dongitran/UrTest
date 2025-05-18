"use client";

import { useAuth } from "@/contexts/AuthContext";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import DashboardStats from "@/components/dashboard/DashboardStats";
import ProjectTable from "@/components/dashboard/ProjectTable";
import TestTypeStats from "@/components/dashboard/TestTypeStats";
import LoadingSpinner from "@/components/LoadingSpinner";
import ProjectModal from "@/components/ProjectModal";
import { DashboardApi } from "@/lib/api";
import { isAdminOrManager } from "@/utils/authUtils";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export default function WorkspacePageV2() {
  const { user } = useAuth();
  const canCreateProject = isAdminOrManager(user);

  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [dataTable, setDataTable] = useState([]);
  const [activityRefreshKey, setActivityRefreshKey] = useState(0);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["/api/dashboard"],
    queryFn: () => {
      return DashboardApi().get();
    },
  });

  useEffect(() => {
    if (data) {
      setDataTable(data.dataTable);
    }
  }, [data]);

  const handleProjectModalClose = (success) => {
    setProjectModalOpen(false);
    if (success) {
      setActivityRefreshKey((prev) => prev + 1);
      refetch();
    }
  };

  const handleSetProjectModalOpen = (value) => {
    if (canCreateProject) {
      setProjectModalOpen(value);
    }
  };

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

      <ProjectTable
        dataTable={dataTable}
        setDataTable={setDataTable}
        refetch={refetch}
        setProjectModalOpen={handleSetProjectModalOpen}
        initDataTable={data.dataTable}
        canCreateProject={canCreateProject}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ActivityFeed refreshKey={activityRefreshKey} />
        <TestTypeStats />
      </div>

      <ProjectModal
        open={projectModalOpen}
        setOpen={setProjectModalOpen}
        onSuccess={() => handleProjectModalClose(true)}
      />
    </div>
  );
}
