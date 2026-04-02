"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function ProjectsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-muted-foreground">Manage your projects</p>
        </div>
        <Link href="projects/new" className={buttonVariants()}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Link>
      </div>
      <p className="text-muted-foreground text-center py-12">
        No projects yet. Create your first project.
      </p>
    </div>
  );
}
