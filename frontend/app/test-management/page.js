"use client";

import ProjectFields from "@/components/test-management/ProjectFields";
import ProjectSelector from "@/components/test-management/ProjectSelector";
import RecentTestRuns from "@/components/test-management/RecentTestRuns";
import TestCaseList from "@/components/test-management/TestCaseList";
import TestSuccessRate from "@/components/test-management/TestSuccessRate";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import { useSearchParams } from "next/navigation";

import { Fragment, useState } from "react";

dayjs.extend(advancedFormat);

export default function TestManagement() {
  const [project, setProject] = useState();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("id");

  return (
    <div className="flex flex-col gap-6">
      <ProjectSelector setProject={setProject} projectId={projectId} />
      {project && (
        <Fragment>
          <ProjectFields project={project} />
          <TestCaseList project={project} listTestSuite={project.listTestSuite} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RecentTestRuns />
            <TestSuccessRate />
          </div>
        </Fragment>
      )}
    </div>
  );
}
