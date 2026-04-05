"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createWorkspace, type ActionResult } from "@/lib/actions/workspace";

export default function NewWorkspacePage() {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    createWorkspace,
    {},
  );

  return (
    <div className="max-w-lg mx-auto">
      <Link
        href="/workspaces"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to workspaces
      </Link>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Create Workspace</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Set up a new workspace for your team
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          {state.error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Workspace Name</Label>
            <Input id="name" name="name" placeholder="My Agency" autoFocus />
            <p className="text-xs text-muted-foreground">
              A URL-friendly slug will be created automatically from the name.
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creating..." : "Create Workspace"}
          </Button>
        </form>
      </div>
    </div>
  );
}
