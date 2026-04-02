export default function WorkspaceDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Active Freelancers</p>
          <p className="text-3xl font-bold mt-1">0</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Hours This Week</p>
          <p className="text-3xl font-bold mt-1">0</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Tasks Completed</p>
          <p className="text-3xl font-bold mt-1">0</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Pending Invoices</p>
          <p className="text-3xl font-bold mt-1">0</p>
        </div>
      </div>
    </div>
  );
}
