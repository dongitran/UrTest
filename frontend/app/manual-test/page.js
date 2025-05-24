"use client";

import ManualTestStats from "@/components/manual-test/ManualTestStats";
import ManualTestCaseList from "@/components/manual-test/ManualTestCaseList";
import ProjectSelector from "@/components/automation-test/ProjectSelector";
import EditProjectModal from "@/components/automation-test/EditProjectModal";
import ManageStaffModal from "@/components/ManageStaffModal";
import { Button } from "@/components/ui/button";
import { Edit, Users } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Fragment, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { PROJECT_DETAIL_QUERY_KEY } from "@/hooks/useProjects";
import { useAuth } from "@/contexts/AuthContext";
import { isAdminOrManager } from "@/utils/authUtils";

export default function ManualTestManagement() {
  const [project, setProject] = useState();
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openManageStaffModal, setOpenManageStaffModal] = useState(false);
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const [reRender, setReRender] = useState({});
  const [headerContainer, setHeaderContainer] = useState(null);
  const queryClient = useQueryClient();

  const { user } = useAuth();
  const hasAdminManagerAccess = isAdminOrManager(user);

  useEffect(() => {
    const container = document.getElementById("page-header-controls");
    if (container) {
      setHeaderContainer(container);
    }

    return () => {
      setHeaderContainer(null);
    };
  }, []);

  useEffect(() => {
    if (localStorage.getItem("manual_test_updated") === "true" && projectId) {
      localStorage.removeItem("manual_test_updated");

      queryClient.invalidateQueries([PROJECT_DETAIL_QUERY_KEY, projectId]);
      queryClient.invalidateQueries(["manual-test-cases", projectId]);

      setReRender({});
    }
  }, [projectId, queryClient]);

  return (
    <div className="flex flex-col">
      {headerContainer &&
        createPortal(
          <div className="flex items-center gap-4">
            <ProjectSelector
              reRender={reRender}
              setProject={setProject}
              projectId={projectId}
            />
            {project && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpenManageStaffModal(true)}
                  className="flex gap-2 items-center"
                >
                  <Users className="h-4 w-4" />
                  Manage Staff
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpenEditModal(true)}
                  className="flex gap-2 items-center"
                  disabled={!hasAdminManagerAccess}
                >
                  <Edit className="h-4 w-4" />
                  Edit Project
                </Button>
              </>
            )}
          </div>,
          headerContainer
        )}

      {project && (
        <Fragment>
          <div className="mt-6">
            <ManualTestStats project={project} />
          </div>

          <div className="mt-6">
            <ManualTestCaseList setReRender={setReRender} project={project} />
          </div>

          <EditProjectModal
            project={project}
            open={openEditModal}
            setOpen={setOpenEditModal}
            onSuccess={(data) => {
              setProject({
                ...project,
                title: data.title,
                description: data.description,
              });
              setReRender({});
            }}
          />

          <ManageStaffModal
            open={openManageStaffModal}
            setOpen={setOpenManageStaffModal}
            project={project}
            hasAdminManagerAccess={hasAdminManagerAccess}
          />
        </Fragment>
      )}
    </div>
  );
}
