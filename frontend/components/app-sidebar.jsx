import {
  BarChart3Icon,
  BookOpenIcon,
  ClipboardListIcon,
  FlaskConical,
  LayoutDashboardIcon,
  SettingsIcon,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects } from "@/hooks/useProjects";
import { useEffect, useState } from "react";

export function AppSidebar({ ...props }) {
  const { user } = useAuth();
  const [navItems, setNavItems] = useState([
    {
      id: "1",
      name: "Dashboard",
      description: "View dashboard and analytics",
      icon: LayoutDashboardIcon,
      url: "/dashboard",
    },
    {
      id: "2",
      name: "Test Management",
      description: "Manage your test cases",
      icon: ClipboardListIcon,
      url: "/test-management",
    },
    {
      id: "3",
      name: "Reports",
      description: "View test reports and metrics",
      icon: BarChart3Icon,
      url: "/reports",
    },
  ]);

  const { data } = useProjects();

  useEffect(() => {
    if (data?.projects?.length > 0) {
      const firstProjectId = data.projects[0].id;

      setNavItems((prevItems) =>
        prevItems.map((item) =>
          item.id === "2"
            ? {
                ...item,
                url: `/test-management?projectId=${firstProjectId}`,
              }
            : item
        )
      );
    }
  }, [data?.projects]);

  const navSecondaryItems = [
    {
      title: "Documentation",
      url: "https://docs.urtest.click",
      icon: BookOpenIcon,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: SettingsIcon,
    },
  ];

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="p-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <div>
                <FlaskConical className="h-5 w-5" />
                <span className="text-base font-semibold">Ur Draw</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
        <NavSecondary items={navSecondaryItems} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            avatar: "https://ui.shadcn.com/avatars/shadcn.jpg",
            username: user.username,
            email: user.email || "m@shadcn.com",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
