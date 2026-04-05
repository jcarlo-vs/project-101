import Link from "next/link";
import { Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUserWorkspaces } from "@/lib/actions/workspace";

export default async function WorkspacesPage() {
  const memberships = await getUserWorkspaces();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Workspaces</h1>
          <p className="text-sm text-muted-foreground">
            Manage your workspaces and projects
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/workspaces/new" />}>
          <Plus className="mr-2 h-4 w-4" />
          New Workspace
        </Button>
      </div>

      {memberships.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <h3 className="text-lg font-medium mb-1">No workspaces yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first workspace to start managing projects and freelancers.
          </p>
          <Button variant="outline" nativeButton={false} render={<Link href="/workspaces/new" />}>
            <Plus className="mr-2 h-4 w-4" />
            Create Workspace
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {memberships.map(({ workspace, role }) => (
            <Link
              key={workspace.id}
              href={`/${workspace.slug}`}
              className="group rounded-xl border bg-card p-6 transition-colors hover:border-primary/30"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">
                  {workspace.name.slice(0, 2).toUpperCase()}
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="mt-3 font-semibold">{workspace.name}</h3>
              <p className="text-xs text-muted-foreground mt-1 capitalize">{role}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
