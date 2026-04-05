"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { updateProject, deleteProject, type ProjectResult } from "@/lib/actions/project";
import { useState } from "react";

interface ProjectSettingsFormProps {
  projectId: string;
  name: string;
  description: string;
  workspaceSlug: string;
}

export function ProjectSettingsForm({
  projectId,
  name,
  description,
  workspaceSlug,
}: ProjectSettingsFormProps) {
  const boundAction = updateProject.bind(null, projectId);
  const [state, formAction, pending] = useActionState<ProjectResult, FormData>(
    boundAction,
    {},
  );
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this project? This cannot be undone.")) return;
    setDeleting(true);
    await deleteProject(projectId, workspaceSlug);
    setDeleting(false);
  }

  return (
    <div className="space-y-8">
      <form action={formAction} className="space-y-4">
        {state.error && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </div>
        )}
        {state.success && (
          <div className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-500">
            Project updated!
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="name">Project Name</Label>
          <Input id="name" name="name" defaultValue={name} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={description}
            rows={3}
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save changes"}
        </Button>
      </form>

      <Separator />

      <div>
        <h3 className="text-sm font-medium text-destructive mb-1">Danger Zone</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Deleting a project removes all tasks, time entries, and reports permanently.
        </p>
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? "Deleting..." : "Delete Project"}
        </Button>
      </div>
    </div>
  );
}
