import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function NewWorkspacePage() {
  return (
    <div className="max-w-lg mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create Workspace</CardTitle>
          <CardDescription>
            Set up a new workspace for your team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Workspace Name</Label>
              <Input id="name" placeholder="My Agency" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <Input id="slug" placeholder="my-agency" />
              <p className="text-xs text-muted-foreground">
                This will be used in your workspace URL
              </p>
            </div>
            <Button type="submit" className="w-full">
              Create Workspace
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
