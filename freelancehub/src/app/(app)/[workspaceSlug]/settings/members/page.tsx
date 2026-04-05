import { redirect } from "next/navigation";
import { createClient } from "@/lib/auth/server";
import { getWorkspaceBySlug, getWorkspaceMembership, canManageMembers } from "@/lib/permissions";
import { getWorkspaceMembers } from "@/lib/actions/workspace";
import { MembersList } from "./members-list";
import { InviteForm } from "./invite-form";

export default async function MembersPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const workspace = await getWorkspaceBySlug(workspaceSlug);
  if (!workspace) redirect("/workspaces");

  const membership = await getWorkspaceMembership(workspace.id, user.id);
  if (!membership) redirect("/workspaces");

  const members = await getWorkspaceMembers(workspace.id);
  const isManager = canManageMembers(membership.role);

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Members</h1>
        <p className="text-sm text-muted-foreground">
          Manage workspace members and invitations
        </p>
      </div>

      {isManager && (
        <div className="mb-8">
          <InviteForm workspaceId={workspace.id} />
        </div>
      )}

      <MembersList
        members={members}
        workspaceId={workspace.id}
        currentUserId={user.id}
        isManager={isManager}
      />
    </div>
  );
}
