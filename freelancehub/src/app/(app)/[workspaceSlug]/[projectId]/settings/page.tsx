import { redirect } from "next/navigation";
import { createClient } from "@/lib/auth/server";
import { getWorkspaceBySlug, getWorkspaceMembership, canCreateProject } from "@/lib/permissions";
import { getProject } from "@/lib/actions/project";
import { ProjectSettingsForm } from "./project-settings-form";

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; projectId: string }>;
}) {
  const { workspaceSlug, projectId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const workspace = await getWorkspaceBySlug(workspaceSlug);
  if (!workspace) redirect("/workspaces");

  const membership = await getWorkspaceMembership(workspace.id, user.id);
  if (!membership) redirect("/workspaces");

  const project = await getProject(projectId);
  if (!project) redirect(`/${workspaceSlug}/projects`);

  const canEdit = canCreateProject(membership.role);

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Project Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your project configuration
        </p>
      </div>

      {canEdit ? (
        <ProjectSettingsForm
          projectId={project.id}
          name={project.name}
          description={project.description ?? ""}
          workspaceSlug={workspaceSlug}
        />
      ) : (
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Project Name</p>
            <p className="text-sm text-muted-foreground">{project.name}</p>
          </div>
          {project.description && (
            <div className="space-y-1">
              <p className="text-sm font-medium">Description</p>
              <p className="text-sm text-muted-foreground">{project.description}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
