"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function InvoicesPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">Manage invoices</p>
        </div>
        <Link href="invoices/new" className={buttonVariants()}>
          <Plus className="mr-2 h-4 w-4" />
          New Invoice
        </Link>
      </div>
      <p className="text-muted-foreground text-center py-12">
        No invoices yet.
      </p>
    </div>
  );
}
