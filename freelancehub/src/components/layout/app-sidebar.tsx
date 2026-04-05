"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
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
  Users,
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
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { ProjectSwitcher } from "./project-switcher";

export function AppSidebar() {
  const pathname = usePathname();
  const params = useParams<{ workspaceSlug?: string; projectId?: string }>();

  const workspaceSlug = params.workspaceSlug;
  const projectId = params.projectId;

  const workspaceBase = workspaceSlug ? `/${workspaceSlug}` : "";
  const projectBase =
    workspaceSlug && projectId ? `/${workspaceSlug}/${projectId}` : "";

  const workspaceItems = workspaceSlug
    ? [
        { title: "Dashboard", url: workspaceBase, icon: LayoutDashboard },
        { title: "Projects", url: `${workspaceBase}/projects`, icon: FolderKanban },
        { title: "Invoices", url: `${workspaceBase}/invoices`, icon: Receipt },
        { title: "AI Summaries", url: `${workspaceBase}/summaries`, icon: Sparkles },
        { title: "Members", url: `${workspaceBase}/settings/members`, icon: Users },
        { title: "Settings", url: `${workspaceBase}/settings`, icon: Settings },
      ]
    : [];

  const projectItems =
    workspaceSlug && projectId
      ? [
          { title: "Board", url: `${projectBase}/board`, icon: KanbanSquare },
          { title: "Time Tracking", url: `${projectBase}/time`, icon: Clock },
          { title: "Reports", url: `${projectBase}/reports`, icon: FileText },
          { title: "Calendar", url: `${projectBase}/calendar`, icon: CalendarDays },
        ]
      : [];

  return (
    <Sidebar>
      <SidebarHeader>
        <WorkspaceSwitcher currentSlug={workspaceSlug} />
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
                      isActive={
                        item.url === workspaceBase
                          ? pathname === item.url
                          : pathname.startsWith(item.url)
                      }
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

        {workspaceSlug && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Project</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <ProjectSwitcher
                      workspaceSlug={workspaceSlug}
                      currentProjectId={projectId}
                    />
                  </SidebarMenuItem>
                </SidebarMenu>
                {projectItems.length > 0 && (
                  <SidebarMenu>
                    {projectItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          render={<Link href={item.url} />}
                          isActive={pathname.startsWith(item.url)}
                        >
                          <item.icon />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                )}
              </SidebarGroupContent>
            </SidebarGroup>
          </>
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
