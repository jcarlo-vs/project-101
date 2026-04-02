"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function WorkspacesPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Workspaces</h1>
          <p className="text-muted-foreground">
            Manage your workspaces and projects
          </p>
        </div>
        <Link href="/workspaces/new" className={buttonVariants()}>
          <Plus className="mr-2 h-4 w-4" />
          New Workspace
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <p className="text-muted-foreground col-span-full text-center py-12">
          No workspaces yet. Create your first workspace to get started.
        </p>
      </div>
    </div>
  );
}
