export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div
          className="h-8 w-48 rounded-xl animate-pulse"
          style={{ background: "hsl(var(--surface-elevated))" }}
        />
        <div
          className="h-4 w-32 rounded-lg animate-pulse"
          style={{ background: "hsl(var(--surface))" }}
        />
      </div>

      {/* Stats bar skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-24 rounded-xl p-4 animate-pulse glass"
            style={{ border: "1px solid hsl(var(--border))" }}
          />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-96 rounded-2xl p-4 animate-pulse glass"
            style={{ border: "1px solid hsl(var(--border))" }}
          />
        ))}
      </div>
    </div>
  );
}
