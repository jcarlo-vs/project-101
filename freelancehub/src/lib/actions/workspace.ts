"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/auth/server";
import { db } from "@/lib/db";
import {
  workspaces,
  workspaceMembers,
  users,
  projects,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod/v4";
import {
  getWorkspaceBySlug,
  getWorkspaceMembership,
  canManageWorkspace,
  canManageMembers,
} from "@/lib/permissions";
import crypto from "crypto";

// ─── Schemas ────────────────────────────────────────────────────────────────

const createWorkspaceSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
});

const updateWorkspaceSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
});

const inviteMemberSchema = z.object({
  email: z.email("Please enter a valid email"),
  role: z.enum(["admin", "freelancer", "cofounder"]),
  hourlyRate: z.string().optional(),
  currency: z.string().optional(),
});

// ─── Helpers ────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function getUniqueSlug(name: string): Promise<string> {
  let slug = slugify(name);
  let existing = await getWorkspaceBySlug(slug);
  let i = 1;
  while (existing) {
    slug = `${slugify(name)}-${i}`;
    existing = await getWorkspaceBySlug(slug);
    i++;
  }
  return slug;
}

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}

// ─── Types ──────────────────────────────────────────────────────────────────

export type ActionResult = {
  error?: string;
  success?: boolean;
  message?: string;
};

// ─── Actions ────────────────────────────────────────────────────────────────

export async function createWorkspace(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = createWorkspaceSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);
    return { error: flat.fieldErrors.name?.[0] ?? "Invalid input" };
  }

  const user = await requireAuth();
  const slug = await getUniqueSlug(parsed.data.name);

  const [workspace] = await db
    .insert(workspaces)
    .values({
      name: parsed.data.name,
      slug,
      ownerId: user.id,
    })
    .returning();

  // Add creator as admin member
  await db.insert(workspaceMembers).values({
    workspaceId: workspace.id,
    userId: user.id,
    role: "admin",
    inviteStatus: "accepted",
    joinedAt: new Date(),
  });

  redirect(`/${slug}`);
}

export async function updateWorkspace(
  workspaceId: string,
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = updateWorkspaceSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);
    return { error: flat.fieldErrors.name?.[0] ?? "Invalid input" };
  }

  const user = await requireAuth();
  const member = await getWorkspaceMembership(workspaceId, user.id);

  if (!member || !canManageWorkspace(member.role)) {
    return { error: "You don't have permission to update this workspace" };
  }

  await db
    .update(workspaces)
    .set({ name: parsed.data.name, updatedAt: new Date() })
    .where(eq(workspaces.id, workspaceId));

  return { success: true, message: "Workspace updated" };
}

export async function deleteWorkspace(workspaceId: string): Promise<ActionResult> {
  const user = await requireAuth();
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!workspace || workspace.ownerId !== user.id) {
    return { error: "Only the owner can delete a workspace" };
  }

  await db.delete(workspaces).where(eq(workspaces.id, workspaceId));
  redirect("/workspaces");
}

export async function inviteMember(
  workspaceId: string,
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = inviteMemberSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
    hourlyRate: formData.get("hourlyRate") || undefined,
    currency: formData.get("currency") || undefined,
  });

  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);
    const firstError = Object.values(flat.fieldErrors)[0]?.[0];
    return { error: firstError ?? "Invalid input" };
  }

  const user = await requireAuth();
  const member = await getWorkspaceMembership(workspaceId, user.id);

  if (!member || !canManageMembers(member.role)) {
    return { error: "You don't have permission to invite members" };
  }

  // Check if already a member
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);

  if (existingUser) {
    const existingMember = await getWorkspaceMembership(workspaceId, existingUser.id);
    if (existingMember) {
      return { error: "This user is already a member of this workspace" };
    }
  }

  // Check if already invited
  const [existingInvite] = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.invitedEmail, parsed.data.email),
        eq(workspaceMembers.inviteStatus, "pending"),
      ),
    )
    .limit(1);

  if (existingInvite) {
    return { error: "An invitation has already been sent to this email" };
  }

  const token = crypto.randomBytes(32).toString("hex");

  await db.insert(workspaceMembers).values({
    workspaceId,
    userId: existingUser?.id ?? null,
    role: parsed.data.role,
    invitedEmail: parsed.data.email,
    inviteToken: token,
    inviteStatus: "pending",
    hourlyRate: parsed.data.hourlyRate ?? null,
    currency: parsed.data.currency ?? "USD",
  });

  return {
    success: true,
    message: `Invitation sent to ${parsed.data.email}. Share this link: /invite/${token}`,
  };
}

export async function acceptInvite(token: string): Promise<ActionResult> {
  const user = await requireAuth();

  const [invite] = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.inviteToken, token),
        eq(workspaceMembers.inviteStatus, "pending"),
      ),
    )
    .limit(1);

  if (!invite) {
    return { error: "Invalid or expired invitation" };
  }

  await db
    .update(workspaceMembers)
    .set({
      userId: user.id,
      inviteStatus: "accepted",
      joinedAt: new Date(),
      inviteToken: null,
    })
    .where(eq(workspaceMembers.id, invite.id));

  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, invite.workspaceId))
    .limit(1);

  redirect(`/${workspace?.slug ?? "/workspaces"}`);
}

export async function removeMember(
  workspaceId: string,
  memberId: string,
): Promise<ActionResult> {
  const user = await requireAuth();
  const member = await getWorkspaceMembership(workspaceId, user.id);

  if (!member || !canManageMembers(member.role)) {
    return { error: "You don't have permission to remove members" };
  }

  // Prevent removing yourself
  const [target] = await db
    .select()
    .from(workspaceMembers)
    .where(eq(workspaceMembers.id, memberId))
    .limit(1);

  if (target?.userId === user.id) {
    return { error: "You cannot remove yourself" };
  }

  await db.delete(workspaceMembers).where(eq(workspaceMembers.id, memberId));
  return { success: true, message: "Member removed" };
}

export async function updateMemberRole(
  workspaceId: string,
  memberId: string,
  role: "admin" | "freelancer" | "cofounder",
): Promise<ActionResult> {
  const user = await requireAuth();
  const member = await getWorkspaceMembership(workspaceId, user.id);

  if (!member || !canManageMembers(member.role)) {
    return { error: "You don't have permission to change roles" };
  }

  await db
    .update(workspaceMembers)
    .set({ role })
    .where(eq(workspaceMembers.id, memberId));

  return { success: true, message: "Role updated" };
}

// ─── Queries ────────────────────────────────────────────────────────────────

export async function getUserWorkspaces() {
  const user = await requireAuth();

  const memberships = await db
    .select({
      workspace: workspaces,
      role: workspaceMembers.role,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(
      and(
        eq(workspaceMembers.userId, user.id),
        eq(workspaceMembers.inviteStatus, "accepted"),
      ),
    );

  return memberships;
}

export async function getWorkspaceMembers(workspaceId: string) {
  const members = await db
    .select({
      id: workspaceMembers.id,
      role: workspaceMembers.role,
      inviteStatus: workspaceMembers.inviteStatus,
      invitedEmail: workspaceMembers.invitedEmail,
      inviteToken: workspaceMembers.inviteToken,
      hourlyRate: workspaceMembers.hourlyRate,
      currency: workspaceMembers.currency,
      joinedAt: workspaceMembers.joinedAt,
      userId: workspaceMembers.userId,
      userEmail: users.email,
      userName: users.fullName,
    })
    .from(workspaceMembers)
    .leftJoin(users, eq(workspaceMembers.userId, users.id))
    .where(eq(workspaceMembers.workspaceId, workspaceId));

  return members;
}

export async function getWorkspaceProjects(workspaceId: string) {
  return db
    .select()
    .from(projects)
    .where(eq(projects.workspaceId, workspaceId));
}

export async function getProjectsByWorkspaceSlug(slug: string) {
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.slug, slug))
    .limit(1);

  if (!workspace) return [];

  return db
    .select()
    .from(projects)
    .where(eq(projects.workspaceId, workspace.id));
}
