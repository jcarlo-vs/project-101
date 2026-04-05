"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { inviteMember, type ActionResult } from "@/lib/actions/workspace";

export function InviteForm({ workspaceId }: { workspaceId: string }) {
  const boundAction = inviteMember.bind(null, workspaceId);
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    boundAction,
    {},
  );

  return (
    <div className="rounded-xl border p-4">
      <h3 className="font-medium mb-3">Invite a member</h3>
      <form action={formAction} className="space-y-3">
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="user@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              name="role"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              defaultValue="freelancer"
            >
              <option value="freelancer">Freelancer</option>
              <option value="cofounder">Co-founder</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hourlyRate">Hourly Rate</Label>
            <Input id="hourlyRate" name="hourlyRate" type="number" placeholder="0.00" step="0.01" />
          </div>
        </div>
        <Button type="submit" disabled={pending} size="sm">
          {pending ? "Sending..." : "Send Invite"}
        </Button>
      </form>
    </div>
  );
}
