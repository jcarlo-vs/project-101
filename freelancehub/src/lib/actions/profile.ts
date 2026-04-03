"use server";

import { createClient } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";

const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
});

export type ProfileResult = {
  error?: string;
  success?: boolean;
};

export async function updateProfile(
  _prevState: ProfileResult,
  formData: FormData,
): Promise<ProfileResult> {
  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
  });

  if (!parsed.success) {
    const tree = z.treeifyError(parsed.error);
    const firstError = Object.values(tree.properties ?? {})[0];
    return {
      error:
        firstError && "errors" in firstError
          ? firstError.errors[0]
          : "Invalid input",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  await supabase.auth.updateUser({
    data: { full_name: parsed.data.fullName },
  });

  await db
    .update(users)
    .set({ fullName: parsed.data.fullName, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  return { success: true };
}
