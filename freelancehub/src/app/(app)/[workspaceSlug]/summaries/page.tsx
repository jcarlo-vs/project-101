import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default function SummariesPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">AI Summaries</h1>
          <p className="text-muted-foreground">
            AI-generated work summaries
          </p>
        </div>
        <Button>
          <Sparkles className="mr-2 h-4 w-4" />
          Generate Summary
        </Button>
      </div>
      <p className="text-muted-foreground text-center py-12">
        No summaries generated yet.
      </p>
    </div>
  );
}
