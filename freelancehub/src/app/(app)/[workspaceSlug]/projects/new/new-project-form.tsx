"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createProject, type ProjectResult } from "@/lib/actions/project";

interface NewProjectFormProps {
  workspaceId: string;
  workspaceSlug: string;
}

export function NewProjectForm({ workspaceId, workspaceSlug }: NewProjectFormProps) {
  const boundAction = createProject.bind(null, workspaceId, workspaceSlug);
  const [state, formAction, pending] = useActionState<ProjectResult, FormData>(
    boundAction,
    {},
  );

  return (
    <div className="max-w-lg mx-auto">
      <Link
        href={`/${workspaceSlug}/projects`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to projects
      </Link>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Create Project</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Set up a new project with default board columns
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          {state.error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input id="name" name="name" placeholder="Website Redesign" autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe the project..."
              rows={3}
            />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creating..." : "Create Project"}
          </Button>
        </form>
      </div>
    </div>
  );
}
