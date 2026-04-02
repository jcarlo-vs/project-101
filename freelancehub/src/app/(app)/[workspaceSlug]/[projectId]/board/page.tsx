export default function BoardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Board</h1>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {["Backlog", "To Do", "In Progress", "Testing", "Ready to Deploy", "Done"].map(
          (column) => (
            <div
              key={column}
              className="min-w-[280px] rounded-lg border bg-muted/40 p-4"
            >
              <h3 className="font-semibold mb-3">{column}</h3>
              <p className="text-sm text-muted-foreground">No tasks</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
