import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function InvitePage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">You&apos;ve been invited!</CardTitle>
        <CardDescription>
          Accept the invitation to join the workspace
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Button className="w-full">Accept invitation</Button>
        <Button variant="outline" className="w-full">
          Decline
        </Button>
      </CardContent>
    </Card>
  );
}
