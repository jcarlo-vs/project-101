import { redirect } from "next/navigation";
import { createClient } from "@/lib/auth/server";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="max-w-lg mx-auto">
      <ProfileForm
        email={user.email ?? ""}
        fullName={user.user_metadata?.full_name ?? ""}
      />
    </div>
  );
}
