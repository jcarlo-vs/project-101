"use client";

import { Button } from "@/components/ui/button";
import { removeMember, updateMemberRole } from "@/lib/actions/workspace";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

interface Member {
  id: string;
  role: "admin" | "freelancer" | "cofounder";
  inviteStatus: string | null;
  invitedEmail: string | null;
  inviteToken: string | null;
  hourlyRate: string | null;
  currency: string | null;
  joinedAt: Date | null;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
}

interface MembersListProps {
  members: Member[];
  workspaceId: string;
  currentUserId: string;
  isManager: boolean;
}

export function MembersList({
  members,
  workspaceId,
  currentUserId,
  isManager,
}: MembersListProps) {
  const router = useRouter();

  const accepted = members.filter((m) => m.inviteStatus === "accepted");
  const pending = members.filter((m) => m.inviteStatus === "pending");

  async function handleRemove(memberId: string) {
    await removeMember(workspaceId, memberId);
    router.refresh();
  }

  async function handleRoleChange(memberId: string, role: "admin" | "freelancer" | "cofounder") {
    await updateMemberRole(workspaceId, memberId, role);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Active members ({accepted.length})
        </h3>
        <div className="space-y-2">
          {accepted.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-lg border px-4 py-3"
            >
              <div>
                <p className="font-medium text-sm">
                  {member.userName ?? member.userEmail}
                  {member.userId === currentUserId && (
                    <span className="text-xs text-muted-foreground ml-2">(you)</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">{member.userEmail}</p>
              </div>
              <div className="flex items-center gap-2">
                {member.hourlyRate && (
                  <span className="text-xs text-muted-foreground">
                    {member.currency ?? "USD"} {member.hourlyRate}/hr
                  </span>
                )}
                {isManager && member.userId !== currentUserId ? (
                  <select
                    value={member.role}
                    onChange={(e) =>
                      handleRoleChange(member.id, e.target.value as "admin" | "freelancer" | "cofounder")
                    }
                    className="h-8 rounded-md border bg-transparent px-2 text-xs"
                  >
                    <option value="freelancer">Freelancer</option>
                    <option value="cofounder">Co-founder</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : (
                  <span className="text-xs capitalize bg-muted px-2 py-1 rounded">
                    {member.role}
                  </span>
                )}
                {isManager && member.userId !== currentUserId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleRemove(member.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {pending.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Pending invitations ({pending.length})
          </h3>
          <div className="space-y-2">
            {pending.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border border-dashed px-4 py-3"
              >
                <div>
                  <p className="font-medium text-sm">{member.invitedEmail}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    Invited as {member.role}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded">
                    Pending
                  </span>
                  {isManager && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleRemove(member.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
