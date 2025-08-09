"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { castArray, compact } from "lodash";
import { MoreHorizontalIcon, Pen, Trash2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Fragment, useState } from "react";

export function NavMain({ items }) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {compact(castArray(items)).map((item) => (
            <MySidebarMenuItem key={item.id} item={item} />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

const stripTrailingSlash = (p) => (p.length > 1 ? p.replace(/\/+$/, "") : p);

const MySidebarMenuItem = ({ item = {} }) => {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();

  const current = stripTrailingSlash(pathname);
  const targetUrl = new URL(item.url, "https://urtest.click");
  const target = stripTrailingSlash(targetUrl.pathname);

  const isTestManagement =
    target === "/automation-test" && current === "/automation-test";
  const isActive =
    current === target || current.startsWith(`${target}/`) || isTestManagement;

  const [openWorkspaceModal, setOpenWorkspaceModal] = useState("");

  return (
    <Fragment>
      <SidebarMenuItem onClick={() => router.push(item.url || "/")}>
        <SidebarMenuButton
          tooltip={item.description}
          isActive={isActive}
          className="flex items-center gap-3"
        >
          {item.icon && (
            <item.icon
              className={`h-4 w-4 shrink-0 ${
                isActive ? "text-sidebar-primary" : "text-sidebar-foreground/70"
              }`}
            />
          )}
          <span>{item.name}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </Fragment>
  );
};
