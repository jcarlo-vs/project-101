import { redirect } from "next/navigation";
import { createClient } from "@/lib/auth/server";
import { getWorkspaceBySlug, getWorkspaceMembership } from "@/lib/permissions";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
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

  const member = await getWorkspaceMembership(workspace.id, user.id);
  if (!member) redirect("/workspaces");

  return <>{children}</>;
}
