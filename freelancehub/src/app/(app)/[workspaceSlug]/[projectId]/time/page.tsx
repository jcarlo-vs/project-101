import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

export default function TimePage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Time Tracking</h1>
        <Button>
          <Clock className="mr-2 h-4 w-4" />
          Clock In
        </Button>
      </div>
      <p className="text-muted-foreground text-center py-12">
        No time entries yet. Clock in to start tracking.
      </p>
    </div>
  );
}
