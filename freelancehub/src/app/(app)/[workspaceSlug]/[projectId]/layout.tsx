"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { cn } from "@/lib/utils";

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();
  const base = `/${params.workspaceSlug}/${params.projectId}`;

  const tabs = [
    { label: "Board", href: `${base}/board` },
    { label: "Time", href: `${base}/time` },
    { label: "Reports", href: `${base}/reports` },
    { label: "Calendar", href: `${base}/calendar` },
    { label: "Settings", href: `${base}/settings` },
  ];

  return (
    <div>
      <nav className="mb-6 flex gap-1 rounded-lg bg-muted p-1 w-fit">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              pathname.startsWith(tab.href)
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
