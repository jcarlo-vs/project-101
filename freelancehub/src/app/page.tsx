"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  KanbanSquare,
  Clock,
  Receipt,
  Sparkles,
  FileText,
  Users,
} from "lucide-react";

const features = [
  {
    icon: KanbanSquare,
    title: "Task Management",
    description:
      "Drag-and-drop kanban boards with customizable columns. Assign tasks, set priorities, and track progress.",
  },
  {
    icon: Clock,
    title: "Time Tracking",
    description:
      "Clock in/out with one click. Monitor freelancer hours in real-time. Automatic timesheet generation.",
  },
  {
    icon: Receipt,
    title: "Invoicing",
    description:
      "Generate invoices from tracked hours. Auto-calculate totals. Export to PDF.",
  },
  {
    icon: FileText,
    title: "Daily Reports",
    description:
      "Freelancers submit daily reports. Clients get full visibility into daily achievements.",
  },
  {
    icon: Sparkles,
    title: "AI Summaries",
    description:
      "AI-powered daily, weekly, and monthly achievement summaries for both clients and freelancers.",
  },
  {
    icon: Users,
    title: "Team Management",
    description:
      "Invite freelancers and co-founders. Role-based permissions keep everything secure.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              FH
            </div>
            <span className="text-lg font-semibold">FreelanceHub</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
              Sign in
            </Link>
            <Link href="/register" className={buttonVariants()}>
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Manage freelancers.
            <br />
            <span className="text-muted-foreground">All in one place.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Stop juggling Jira, time trackers, and invoicing tools. FreelanceHub
            combines task management, time tracking, invoicing, and AI-powered
            reporting into one platform.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/register" className={buttonVariants({ size: "lg" })}>
              Start for free
            </Link>
            <Link href="/login" className={buttonVariants({ size: "lg", variant: "outline" })}>
              Sign in
            </Link>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-lg border p-6">
                <feature.icon className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} FreelanceHub. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
