import { redirect } from "next/navigation";
import { createClient } from "@/lib/auth/server";
import { getWorkspaceBySlug, getWorkspaceMembership, canManageWorkspace } from "@/lib/permissions";
import { SettingsForm } from "./settings-form";

export default async function WorkspaceSettingsPage({
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

  const isManager = canManageWorkspace(membership.role);

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Workspace Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your workspace configuration
        </p>
      </div>

      {isManager ? (
        <SettingsForm workspace={{ id: workspace.id, name: workspace.name, slug: workspace.slug }} />
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Workspace Name</p>
            <p className="text-sm text-muted-foreground">{workspace.name}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">URL Slug</p>
            <p className="text-sm text-muted-foreground">{workspace.slug}</p>
          </div>
        </div>
      )}
    </div>
  );
}
