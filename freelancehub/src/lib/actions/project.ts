"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { projects, projectMembers, boardColumns } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod/v4";
import { getWorkspaceMembership, canCreateProject } from "@/lib/permissions";

const createProjectSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().max(500).optional(),
});

export type ProjectResult = {
  error?: string;
  success?: boolean;
};

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}

const DEFAULT_COLUMNS = ["Backlog", "To Do", "In Progress", "Review", "Done"];

export async function createProject(
  workspaceId: string,
  workspaceSlug: string,
  _prevState: ProjectResult,
  formData: FormData,
): Promise<ProjectResult> {
  const parsed = createProjectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);
    return { error: flat.fieldErrors.name?.[0] ?? "Invalid input" };
  }

  const user = await requireAuth();
  const member = await getWorkspaceMembership(workspaceId, user.id);

  if (!member || !canCreateProject(member.role)) {
    return { error: "You don't have permission to create projects" };
  }

  const [project] = await db
    .insert(projects)
    .values({
      workspaceId,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      createdBy: user.id,
    })
    .returning();

  // Add creator as project member
  await db.insert(projectMembers).values({
    projectId: project.id,
    userId: user.id,
  });

  // Create default board columns
  await db.insert(boardColumns).values(
    DEFAULT_COLUMNS.map((name, i) => ({
      projectId: project.id,
      name,
      position: i,
    })),
  );

  redirect(`/${workspaceSlug}/${project.id}/board`);
}

const updateProjectSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().max(500).optional(),
});

export async function updateProject(
  projectId: string,
  _prevState: ProjectResult,
  formData: FormData,
): Promise<ProjectResult> {
  const parsed = updateProjectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);
    return { error: flat.fieldErrors.name?.[0] ?? "Invalid input" };
  }

  const user = await requireAuth();

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) return { error: "Project not found" };

  const member = await getWorkspaceMembership(project.workspaceId, user.id);
  if (!member || !canCreateProject(member.role)) {
    return { error: "You don't have permission to edit this project" };
  }

  await db
    .update(projects)
    .set({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, projectId));

  return { success: true };
}

export async function getProject(projectId: string) {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  return project ?? null;
}

export async function deleteProject(
  projectId: string,
  workspaceSlug: string,
): Promise<ProjectResult> {
  const user = await requireAuth();

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) return { error: "Project not found" };

  const member = await getWorkspaceMembership(project.workspaceId, user.id);
  if (!member || !canCreateProject(member.role)) {
    return { error: "You don't have permission to delete projects" };
  }

  await db.delete(projects).where(eq(projects.id, projectId));
  redirect(`/${workspaceSlug}/projects`);
}
