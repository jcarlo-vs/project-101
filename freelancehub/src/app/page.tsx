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
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const features = [
  {
    icon: KanbanSquare,
    title: "Kanban Boards",
    description:
      "Organize work with drag-and-drop boards. Assign tasks, set priorities, and never lose track of progress.",
  },
  {
    icon: Clock,
    title: "Time Tracking",
    description:
      "One-click clock in/out. Real-time hour monitoring and automatic timesheet generation for accurate billing.",
  },
  {
    icon: Receipt,
    title: "Invoicing",
    description:
      "Turn tracked hours into professional invoices instantly. Auto-calculated totals with PDF export.",
  },
  {
    icon: FileText,
    title: "Daily Reports",
    description:
      "Freelancers submit quick daily updates. Clients stay informed without micromanaging.",
  },
  {
    icon: Sparkles,
    title: "AI Summaries",
    description:
      "Get AI-generated daily, weekly, and monthly summaries. Know exactly what got done without reading every update.",
  },
  {
    icon: Users,
    title: "Team & Roles",
    description:
      "Invite freelancers and co-founders with role-based access. Everyone sees what they need, nothing more.",
  },
];

const benefits = [
  "No more juggling Jira, Toggl, and QuickBooks",
  "Built for small teams and solo founders",
  "Free to start, scales as you grow",
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-50">
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
        {/* Hero */}
        <section className="container mx-auto px-4 py-20 md:py-32 text-center">
          <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm text-muted-foreground mb-6">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Now with AI-powered summaries
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Freelancer management
            <br />
            <span className="text-muted-foreground">without the chaos.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Tasks, time tracking, invoicing, and reporting in one place.
            Built for founders who work with freelancers and want
            to stop duct-taping five different tools together.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <Link href="/register" className={buttonVariants({ size: "lg" })}>
              Start for free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href="/login" className={buttonVariants({ size: "lg", variant: "outline" })}>
              Sign in to your account
            </Link>
          </div>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                {benefit}
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="border-t bg-muted/30">
          <div className="container mx-auto px-4 py-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight">
                Everything you need, nothing you don&apos;t
              </h2>
              <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
                Six core features designed to replace your scattered toolchain
                with one clean workflow.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border bg-background p-6 transition-colors hover:border-primary/30"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-4">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t">
          <div className="container mx-auto px-4 py-20 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Ready to simplify your workflow?
            </h2>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              Create your first workspace in under a minute.
              No credit card required.
            </p>
            <div className="mt-8">
              <Link href="/register" className={buttonVariants({ size: "lg" })}>
                Get started for free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
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
