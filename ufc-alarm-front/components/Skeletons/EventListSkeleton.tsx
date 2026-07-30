export default function EventListSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-6 pt-10 sm:px-10">
      <div className="h-4 w-28 animate-pulse rounded bg-surface-raised" />
      <div className="mt-3 flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-20 w-full animate-pulse rounded-lg bg-surface-raised"
          />
        ))}
      </div>
    </div>
  );
}
