"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  KanbanSquare,
  Clock,
  FileText,
  Receipt,
  Sparkles,
  Bell,
  Settings,
  FolderKanban,
  CalendarDays,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

interface AppSidebarProps {
  workspaceSlug?: string;
  projectId?: string;
}

export function AppSidebar({ workspaceSlug, projectId }: AppSidebarProps) {
  const pathname = usePathname();

  const workspaceBase = workspaceSlug ? `/${workspaceSlug}` : "";
  const projectBase =
    workspaceSlug && projectId
      ? `/${workspaceSlug}/${projectId}`
      : "";

  const workspaceItems = workspaceSlug
    ? [
        {
          title: "Dashboard",
          url: workspaceBase,
          icon: LayoutDashboard,
        },
        {
          title: "Projects",
          url: `${workspaceBase}/projects`,
          icon: FolderKanban,
        },
        {
          title: "Invoices",
          url: `${workspaceBase}/invoices`,
          icon: Receipt,
        },
        {
          title: "AI Summaries",
          url: `${workspaceBase}/summaries`,
          icon: Sparkles,
        },
        {
          title: "Settings",
          url: `${workspaceBase}/settings`,
          icon: Settings,
        },
      ]
    : [];

  const projectItems =
    workspaceSlug && projectId
      ? [
          {
            title: "Board",
            url: `${projectBase}/board`,
            icon: KanbanSquare,
          },
          {
            title: "Time Tracking",
            url: `${projectBase}/time`,
            icon: Clock,
          },
          {
            title: "Reports",
            url: `${projectBase}/reports`,
            icon: FileText,
          },
          {
            title: "Calendar",
            url: `${projectBase}/calendar`,
            icon: CalendarDays,
          },
        ]
      : [];

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/workspaces" className="flex items-center gap-2 px-2 py-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            FH
          </div>
          <span className="text-lg font-semibold">FreelanceHub</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {workspaceItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {workspaceItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      render={<Link href={item.url} />}
                      isActive={pathname === item.url}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {projectItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Project</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {projectItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      render={<Link href={item.url} />}
                      isActive={pathname === item.url}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {!workspaceSlug && (
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<Link href="/workspaces" />}
                    isActive={pathname === "/workspaces"}
                  >
                    <LayoutDashboard />
                    <span>Workspaces</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<Link href="/notifications" />}
                    isActive={pathname === "/notifications"}
                  >
                    <Bell />
                    <span>Notifications</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/profile" />}
              isActive={pathname === "/profile"}
            >
              <Settings />
              <span>Profile</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
