"use client";

import Link from "next/link";
import { Bell, User } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/actions/auth";

interface TopNavProps {
  userEmail?: string;
  userName?: string;
}

export function TopNav({ userEmail, userName }: TopNavProps) {
  return (
    <header className="flex h-14 items-center gap-2 border-b px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-6" />

      <div className="flex-1" />

      {/* Timer placeholder — will show active timer here */}
      <div id="active-timer-slot" />

      <Link
        href="/notifications"
        className={buttonVariants({ variant: "ghost", size: "icon" })}
      >
        <Bell className="h-5 w-5" />
        <span className="sr-only">Notifications</span>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <User className="h-5 w-5" />
          <span className="sr-only">User menu</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {(userName || userEmail) && (
            <>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  {userName && (
                    <p className="text-sm font-medium leading-none">{userName}</p>
                  )}
                  {userEmail && (
                    <p className="text-xs leading-none text-muted-foreground">
                      {userEmail}
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem render={<Link href="/profile" />}>
            Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => signOut()}
          >
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
