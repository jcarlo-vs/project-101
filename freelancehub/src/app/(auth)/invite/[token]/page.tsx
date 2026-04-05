"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { acceptInvite, type ActionResult } from "@/lib/actions/workspace";
import { Loader2 } from "lucide-react";

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const [state, setState] = useState<ActionResult>({});
  const [loading, setLoading] = useState(false);

  async function handleAccept() {
    setLoading(true);
    const result = await acceptInvite(params.token);
    setState(result);
    setLoading(false);
  }

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">
          Workspace Invitation
        </h1>
        <p className="text-sm text-muted-foreground">
          You&apos;ve been invited to join a workspace on FreelanceHub.
        </p>
      </div>

      {state.error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <Button onClick={handleAccept} disabled={loading} className="w-full">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {loading ? "Accepting..." : "Accept Invitation"}
      </Button>
    </div>
  );
}
