"use client";

import EditProjectModal from "@/components/test-management/EditProjectModal";
import ProjectSelector from "@/components/test-management/ProjectSelector";
import RecentTestRuns from "@/components/test-management/RecentTestRuns";
import TestCaseList from "@/components/test-management/TestCaseList";
import TestRoute from "@/components/test-management/TestResource";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import { useSearchParams } from "next/navigation";
import ManageStaffModal from "@/components/ManageStaffModal";
import { Fragment, useState } from "react";

dayjs.extend(advancedFormat);

export default function TestManagement() {
  const [project, setProject] = useState();
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openStaffModal, setOpenStaffModal] = useState(false);
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const [reRender, setReRender] = useState({});

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <ProjectSelector
            reRender={reRender}
            setProject={setProject}
            projectId={projectId}
          />
        </div>

        {project && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenStaffModal(true)}
              className="text-gray-700 border-gray-300 hover:bg-gray-100"
            >
              Manage Staff
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenEditModal(true)}
              className="flex gap-2 items-center text-gray-700 border-gray-300 hover:bg-gray-100"
            >
              <Edit className="h-4 w-4" />
              Edit Project
            </Button>
          </div>
        )}
      </div>

      {project && (
        <Fragment>
          <TestCaseList
            setReRender={setReRender}
            project={project}
            listTestSuite={project.listTestSuite}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RecentTestRuns recentTestRun={project.recentTestRun} />
            <TestRoute project={project} />
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
            open={openStaffModal}
            setOpen={setOpenStaffModal}
            project={project}
          />
        </Fragment>
      )}
    </div>
  );
}
