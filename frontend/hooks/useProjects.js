import { useQuery } from "@tanstack/react-query";
import { ProjectApi } from "@/lib/api";

export const PROJECT_LIST_QUERY_KEY = "project-list";
export const PROJECT_DETAIL_QUERY_KEY = "project-detail";

export function useProjects() {
  return useQuery({
    queryKey: [PROJECT_LIST_QUERY_KEY],
    queryFn: () => ProjectApi().get(),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
}

export function useProjectDetails(projectId) {
  return useQuery({
    queryKey: [PROJECT_DETAIL_QUERY_KEY, projectId],
    queryFn: () => (projectId ? ProjectApi().detail(projectId) : null),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    enabled: !!projectId,
  });
}