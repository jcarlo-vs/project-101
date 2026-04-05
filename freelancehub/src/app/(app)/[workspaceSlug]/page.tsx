import { getWorkspaceBySlug, getWorkspaceMembership } from "@/lib/permissions";
import { getWorkspaceMembers, getWorkspaceProjects } from "@/lib/actions/workspace";
import { createClient } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { Users, FolderKanban, Clock, Receipt } from "lucide-react";

export default async function WorkspaceDashboardPage({
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

  const [members, projects] = await Promise.all([
    getWorkspaceMembers(workspace.id),
    getWorkspaceProjects(workspace.id),
  ]);

  const activeMembers = members.filter((m) => m.inviteStatus === "accepted");
  const freelancers = activeMembers.filter((m) => m.role === "freelancer");

  const stats = [
    {
      label: "Members",
      value: activeMembers.length,
      icon: Users,
    },
    {
      label: "Projects",
      value: projects.length,
      icon: FolderKanban,
    },
    {
      label: "Freelancers",
      value: freelancers.length,
      icon: Clock,
    },
    {
      label: "Pending Invites",
      value: members.filter((m) => m.inviteStatus === "pending").length,
      icon: Receipt,
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{workspace.name}</h1>
        <p className="text-sm text-muted-foreground">Workspace dashboard</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-card p-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <stat.icon className="h-4 w-4" />
              <p className="text-sm">{stat.label}</p>
            </div>
            <p className="text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
