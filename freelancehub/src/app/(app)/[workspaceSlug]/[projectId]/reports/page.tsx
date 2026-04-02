import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function ReportsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Daily Reports</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Submit Report
        </Button>
      </div>
      <p className="text-muted-foreground text-center py-12">
        No reports submitted yet.
      </p>
    </div>
  );
}
