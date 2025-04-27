"use client";

import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import ProjectSelector from "@/components/test-management/ProjectSelector";
import TestCaseList from "@/components/test-management/TestCaseList";
import RecentTestRuns from "@/components/test-management/RecentTestRuns";
import TestSuccessRate from "@/components/test-management/TestSuccessRate";

dayjs.extend(advancedFormat);

export default function TestManagement() {
  const router = useRouter();

  const handleNavigateToNewTestCase = (projectName) => {
    router.push(
      `/test-management/new-test-case?project=${encodeURIComponent(
        projectName
      )}`
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <ProjectSelector onNavigateToNewTestCase={handleNavigateToNewTestCase} />
      <TestCaseList />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RecentTestRuns />
        <TestSuccessRate />
      </div>
    </div>
  );
}
