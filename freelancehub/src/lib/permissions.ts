import { db } from "@/lib/db";
import { workspaceMembers, workspaces } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export type WorkspaceRole = "admin" | "freelancer" | "cofounder";

export async function getWorkspaceMembership(workspaceId: string, userId: string) {
  const [member] = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, userId),
      ),
    )
    .limit(1);
  return member ?? null;
}

export async function getWorkspaceBySlug(slug: string) {
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.slug, slug))
    .limit(1);
  return workspace ?? null;
}

export function canManageWorkspace(role: WorkspaceRole): boolean {
  return role === "admin" || role === "cofounder";
}

export function canManageMembers(role: WorkspaceRole): boolean {
  return role === "admin" || role === "cofounder";
}

export function canCreateProject(role: WorkspaceRole): boolean {
  return role === "admin" || role === "cofounder";
}

export function canManageInvoices(role: WorkspaceRole): boolean {
  return role === "admin" || role === "cofounder";
}
