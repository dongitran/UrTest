"use client";

import {
  BarChart3Icon,
  BookOpenIcon,
  HelpCircleIcon,
  LayoutDashboardIcon,
  Lightbulb,
  SearchIcon,
  SettingsIcon,
  ClipboardListIcon,
  BugIcon,
  ZapIcon,
  CodeIcon,
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

const navMainItems = [
  {
    id: "1",
    name: "Dashboard",
    description: "View dashboard and analytics",
    icon: LayoutDashboardIcon,
    url: "/workspace",
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
];

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

export function AppSidebar({ ...props }) {
  const { user } = useAuth();

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#" className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                <span className="text-base font-semibold">UrTest</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainItems} />
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
