import {
  BarChart3Icon,
  BookOpenIcon,
  LayoutDashboardIcon,
  SearchIcon,
  SettingsIcon,
  ClipboardListIcon,
  ZapIcon,
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
import { useEffect, useState } from "react";
import { useProjects } from "@/hooks/useProjects";

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
      name: "Automation Test",
      description: "Manage your test cases",
      icon: ClipboardListIcon,
      url: "/automation-test",
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
                url: `/automation-test?projectId=${firstProjectId}`,
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
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-0 h-auto hover:bg-transparent"
            >
              <a href="#" className="block w-full p-0">
                <img
                  src="https://s0.dtur.xyz/cover/urtest-dash-banner.jpg"
                  alt="UrTest Dashboard Banner"
                  className="w-full h-auto object-cover"
                />
              </a>
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
