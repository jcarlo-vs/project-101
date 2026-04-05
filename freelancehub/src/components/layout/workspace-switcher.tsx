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
import { getUserWorkspaces } from "@/lib/actions/workspace";

interface Workspace {
  id: string;
  name: string;
  slug: string;
}

export function WorkspaceSwitcher({ currentSlug }: { currentSlug?: string }) {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<{ workspace: Workspace; role: string }[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getUserWorkspaces().then(setWorkspaces);
  }, []);

  const current = workspaces.find((w) => w.workspace.slug === currentSlug);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-muted transition-colors">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-bold">
          {current ? current.workspace.name.slice(0, 2).toUpperCase() : "FH"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {current ? current.workspace.name : "FreelanceHub"}
          </p>
          {current && (
            <p className="text-xs text-muted-foreground capitalize">{current.role}</p>
          )}
        </div>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[220px]">
        {workspaces.map(({ workspace, role }) => (
          <DropdownMenuItem
            key={workspace.id}
            onClick={() => {
              router.push(`/${workspace.slug}`);
              setOpen(false);
            }}
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/10 text-primary text-[10px] font-bold">
              {workspace.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 ml-2">
              <p className="text-sm truncate">{workspace.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{role}</p>
            </div>
            {workspace.slug === currentSlug && (
              <Check className="h-4 w-4 shrink-0 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        {workspaces.length > 0 && <DropdownMenuSeparator />}
        <DropdownMenuItem
          onClick={() => {
            router.push("/workspaces/new");
            setOpen(false);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
