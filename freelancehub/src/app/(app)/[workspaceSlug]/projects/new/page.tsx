import { redirect } from "next/navigation";
import { createClient } from "@/lib/auth/server";
import { getWorkspaceBySlug, getWorkspaceMembership, canCreateProject } from "@/lib/permissions";
import { NewProjectForm } from "./new-project-form";

export default async function NewProjectPage({
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
  if (!membership || !canCreateProject(membership.role)) {
    redirect(`/${workspaceSlug}/projects`);
  }

  return (
    <NewProjectForm workspaceId={workspace.id} workspaceSlug={workspaceSlug} />
  );
}
