import dayjs from "dayjs";

export const projectNameToSlug = (projectName) => {
  if (!projectName) return "";

  return projectName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
};

export const mapProjectToUIFormat = (project) => {
  const randomProgress = Math.floor(Math.random() * 100);
  const randomSuccessRate = Math.floor(Math.random() * 100);
  const randomTestCases = Math.floor(Math.random() * 50) + 1;

  let status = "Stable";
  let statusColor = "bg-green-500";

  if (randomProgress < 40) {
    status = "Critical Error";
    statusColor = "bg-red-500";
  } else if (randomProgress < 70) {
    status = "Needs Attention";
    statusColor = "bg-yellow-500";
  }

  return {
    id: project.id,
    name: project.title,
    testCases: project.params?.testCases || randomTestCases,
    status: project.params?.status || status,
    progress: project.params?.progress || randomProgress,
    successRate: project.params?.successRate || randomSuccessRate,
    lastUpdated: project.updatedAt
      ? new Date(project.updatedAt)
      : new Date(project.createdAt),
    statusColor: project.params?.statusColor || statusColor,
    description: project.description,
  };
};

export const formatTimeAgo = (date) => {
  if (date > dayjs().subtract(1, "day")) {
    if (dayjs().diff(dayjs(date), "hour") > 0) {
      return `${dayjs().diff(dayjs(date), "hour")} hours ago`;
    }
    return `${dayjs().diff(dayjs(date), "minute")} minutes ago`;
  }
  return `${dayjs().diff(dayjs(date), "day")} days ago`;
};

export const calculateProjectStats = (projects) => {
  const totalProjects = projects.length;
  const totalTestCases = projects.reduce(
    (sum, project) => sum + project.testCases,
    0
  );
  const avgSuccessRate =
    totalProjects > 0
      ? Math.round(
          projects.reduce((sum, project) => sum + project.successRate, 0) /
            totalProjects
        )
      : 0;
  const activeProjects = projects.filter(
    (p) => p.status !== "Completed"
  ).length;

  return {
    totalProjects,
    totalTestCases,
    avgSuccessRate,
    activeProjects,
  };
};
