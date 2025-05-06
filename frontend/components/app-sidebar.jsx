"use client";

import {
  BarChart3Icon,
  BookOpenIcon,
  HelpCircleIcon,
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
import { ProjectApi } from "@/lib/api";

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
    {
      id: "4",
      name: "Test Execution",
      description: "Execute test cases",
      icon: ZapIcon,
      url: "/test-execution",
    },
  ]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await ProjectApi().get();
        if (data.projects && data.projects.length > 0) {
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
      } catch (error) {
        console.error("Failed to fetch projects for navigation:", error);
      }
    };

    fetchProjects();
  }, []);

  const navSecondaryItems = [
    {
      title: "Documentation",
      url: "/documentation",
      icon: BookOpenIcon,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: SettingsIcon,
    },
    {
      title: "Help",
      url: "/help",
      icon: HelpCircleIcon,
    },
    {
      title: "Search",
      url: "/search",
      icon: SearchIcon,
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
