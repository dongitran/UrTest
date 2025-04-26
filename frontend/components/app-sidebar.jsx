"use client";

import {
  BarChartIcon,
  HelpCircleIcon,
  LayoutDashboardIcon,
  Lightbulb,
  ListIcon,
  SearchIcon,
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

const navMainItems = [
  {
    id: "1",
    name: "Dashboard",
    description: "View dashboard",
    icon: LayoutDashboardIcon,
    url: "/workspace",
  },
  {
    id: "2",
    name: "Test Management",
    description: "Manage your tests",
    icon: ListIcon,
    url: "/test-management",
  },
  {
    id: "3",
    name: "Reports",
    description: "View reports",
    icon: BarChartIcon,
    url: "/reports",
  },
];

const navSecondaryItems = [
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
              <a href="#">
                <Lightbulb className="h-5 w-5" />
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
