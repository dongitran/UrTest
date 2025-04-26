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
import WorkspaceModal from "@/components/v2/Workspace/Modal";
import { castArray, compact } from "lodash";
import { MoreHorizontalIcon, Pen, Trash2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Fragment, useState } from "react";

export function NavMain({ items }) {
  const [openWorkspaceModal, setOpenWorkspaceModal] = useState("");
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {compact(castArray(items)).map((item) => {
            return <MySidebarMenuItem item={item} key={item.id} />;
          })}
        </SidebarMenu>
      </SidebarGroupContent>
      <WorkspaceModal
        openWorkspaceModal={openWorkspaceModal}
        setOpenWorkspaceModal={setOpenWorkspaceModal}
      />
    </SidebarGroup>
  );
}

const MySidebarMenuItem = ({ item = {} }) => {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();

  const isActive = pathname === item.url;

  const [openWorkspaceModal, setOpenWorkspaceModal] = useState("");
  return (
    <Fragment>
      <SidebarMenuItem
        key={item.id}
        onClick={() => {
          router.push(item.url || "/");
        }}
      >
        <SidebarMenuButton tooltip={item.description} isActive={isActive}>
          <span>{item.name}</span>
        </SidebarMenuButton>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuAction
              showOnHover
              className="rounded-sm data-[state=open]:bg-accent"
            >
              <MoreHorizontalIcon />
              <span className="sr-only">More</span>
            </SidebarMenuAction>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-24 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align={isMobile ? "end" : "start"}
          >
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setOpenWorkspaceModal("edit");
              }}
            >
              <Pen />
              <span>Edit</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setOpenWorkspaceModal("delete");
              }}
            >
              <Trash2 />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      <WorkspaceModal
        workspace={item}
        openWorkspaceModal={openWorkspaceModal}
        setOpenWorkspaceModal={setOpenWorkspaceModal}
      />
    </Fragment>
  );
};
