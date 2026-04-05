"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, Plus, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getProjectsByWorkspaceSlug } from "@/lib/actions/workspace";

interface Project {
  id: string;
  name: string;
  status: string;
}

export function ProjectSwitcher({
  workspaceSlug,
  currentProjectId,
}: {
  workspaceSlug: string;
  currentProjectId?: string;
}) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getProjectsByWorkspaceSlug(workspaceSlug).then(setProjects);
  }, [workspaceSlug]);

  const current = projects.find((p) => p.id === currentProjectId);

  if (projects.length === 0 && !currentProjectId) return null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-muted transition-colors">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground text-[10px] font-bold">
          {current ? current.name.slice(0, 1).toUpperCase() : "#"}
        </div>
        <p className="text-sm font-medium truncate flex-1">
          {current ? current.name : "Select Project"}
        </p>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[220px]">
        {projects.map((project) => (
          <DropdownMenuItem
            key={project.id}
            onClick={() => {
              router.push(`/${workspaceSlug}/${project.id}/board`);
              setOpen(false);
            }}
          >
            <span className="truncate flex-1">{project.name}</span>
            {project.id === currentProjectId && (
              <Check className="h-4 w-4 shrink-0 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        {projects.length > 0 && <DropdownMenuSeparator />}
        <DropdownMenuItem
          onClick={() => {
            router.push(`/${workspaceSlug}/projects/new`);
            setOpen(false);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
