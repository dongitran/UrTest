"use client";

import EditProjectModal from "@/components/test-management/EditProjectModal";
import ProjectSelector from "@/components/test-management/ProjectSelector";
import RecentTestRuns from "@/components/test-management/RecentTestRuns";
import TestCaseList from "@/components/test-management/TestCaseList";
import TestRoute from "@/components/test-management/TestResource";
import { Button } from "@/components/ui/button";
import { Edit, Users } from "lucide-react";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import { useSearchParams } from "next/navigation";
import { Fragment, useState, useEffect } from "react";
import ManageStaffModal from "@/components/ManageStaffModal";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { PROJECT_DETAIL_QUERY_KEY } from "@/hooks/useProjects";

dayjs.extend(advancedFormat);

export default function TestManagement() {
  const [project, setProject] = useState();
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openManageStaffModal, setOpenManageStaffModal] = useState(false);
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const [reRender, setReRender] = useState({});
  const [headerContainer, setHeaderContainer] = useState(null);
  const queryClient = useQueryClient();

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
    if (localStorage.getItem("test_suite_updated") === "true" && projectId) {
      localStorage.removeItem("test_suite_updated");

      queryClient.invalidateQueries([PROJECT_DETAIL_QUERY_KEY, projectId]);
      queryClient.invalidateQueries(["test-resource", projectId]);

      setReRender({});
    }
  }, [projectId, queryClient]);

  return (
    <div className="flex flex-col gap-6">
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
          <TestCaseList
            setReRender={setReRender}
            project={project}
            listTestSuite={project.listTestSuite}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TestRoute project={project} />
            <RecentTestRuns recentTestRun={project.recentTestRun} />
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
          />
        </Fragment>
      )}
    </div>
  );
}
