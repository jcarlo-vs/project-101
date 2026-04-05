"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateWorkspace, type ActionResult } from "@/lib/actions/workspace";

interface SettingsFormProps {
  workspace: { id: string; name: string; slug: string };
}

export function SettingsForm({ workspace }: SettingsFormProps) {
  const boundAction = updateWorkspace.bind(null, workspace.id);
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    boundAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-500">
          {state.message}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="name">Workspace Name</Label>
        <Input id="name" name="name" defaultValue={workspace.name} />
      </div>
      <div className="space-y-2">
        <Label>URL Slug</Label>
        <Input value={workspace.slug} disabled />
        <p className="text-xs text-muted-foreground">
          The slug cannot be changed after creation.
        </p>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
