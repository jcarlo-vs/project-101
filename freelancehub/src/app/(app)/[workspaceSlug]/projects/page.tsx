import Link from "next/link";
import { Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/auth/server";
import { getWorkspaceBySlug, getWorkspaceMembership, canCreateProject } from "@/lib/permissions";
import { getWorkspaceProjects } from "@/lib/actions/workspace";

export default async function ProjectsPage({
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

  const projects = await getWorkspaceProjects(workspace.id);
  const canCreate = canCreateProject(membership.role);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-sm text-muted-foreground">Manage your projects</p>
        </div>
        {canCreate && (
          <Button nativeButton={false} render={<Link href={`/${workspaceSlug}/projects/new`} />}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <h3 className="text-lg font-medium mb-1">No projects yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first project to start tracking tasks and time.
          </p>
          {canCreate && (
            <Button variant="outline" nativeButton={false} render={<Link href={`/${workspaceSlug}/projects/new`} />}>
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/${workspaceSlug}/${project.id}/board`}
              className="group rounded-xl border bg-card p-6 transition-colors hover:border-primary/30"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold">{project.name}</h3>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {project.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {project.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-3 capitalize">
                {project.status}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
