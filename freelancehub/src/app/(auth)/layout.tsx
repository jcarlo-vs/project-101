import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
          FH
        </div>
        <span className="text-xl font-semibold tracking-tight">FreelanceHub</span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
