export function CardSkeleton() {
  return (
    <div className="sk-card">
      <div className="skeleton sk-thumb" />
      <div className="skeleton sk-line" />
      <div className="skeleton sk-line sm" />
    </div>
  );
}

export function GridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
