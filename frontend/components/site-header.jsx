import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

dayjs.extend(advancedFormat);

export function SiteHeader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pageInfo = useMemo(() => {
    if (pathname.startsWith("/test-management/new-test-case")) {
      const projectName = searchParams.get("project");
      const projectId = searchParams.get("projectId");
      return {
        title: "Test Management",
        isBreadcrumb: true,
        breadcrumbs: [
          { title: "Test Management", path: "/test-management" },
          { title: projectName, path: `/test-management?projectId=${projectId}` },
          { title: "New Test Case", path: pathname },
        ],
      };
    }
    if (pathname.startsWith("/test-management")) return { title: "Test Management" };
    if (pathname.startsWith("/test-execution")) return { title: "Test Execution" };
    if (pathname.startsWith("/reports")) return { title: "Reports" };
    if (pathname.startsWith("/dashboard")) return { title: "Dashboard" };
    return { title: "" };
  }, [pathname, searchParams]);

  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />

        <div className="flex justify-between items-center w-full">
          {pageInfo.isBreadcrumb ? (
            <nav className="flex items-center gap-1 text-sm">
              {pageInfo.breadcrumbs.map((crumb, idx) => (
                <div key={idx} className="flex items-center">
                  {idx > 0 && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mx-1 text-muted-foreground"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  )}
                  {idx < pageInfo.breadcrumbs.length - 1 ? (
                    <Link href={crumb.path} className="text-blue-500 hover:underline">
                      {crumb.title}
                    </Link>
                  ) : (
                    <span>{crumb.title}</span>
                  )}
                </div>
              ))}
            </nav>
          ) : (
            <h1 className="text-xl font-bold">{pageInfo.title}</h1>
          )}

          <div className="flex items-center gap-4">
            {pageInfo.title && (
              <div className="hidden md:block text-sm text-muted-foreground">
                Today: {dayjs().format("DD/MM/YYYY")} | Last updated: {dayjs().format("HH:mm A")}
              </div>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
