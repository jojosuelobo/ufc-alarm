function Block({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md bg-surface-raised ${className}`} />;
}

export default function EventDetailSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-6 pt-10 sm:px-10">
      <Block className="h-3 w-24" />
      <Block className="mt-3 h-8 w-3/4" />
      <Block className="mt-2 h-4 w-1/2" />
      <div className="mt-6 flex gap-3">
        <Block className="h-14 w-14" />
        <Block className="h-14 w-14" />
        <Block className="h-14 w-14" />
        <Block className="h-14 w-14" />
      </div>
      <Block className="mt-8 h-48 w-full" />
      <div className="mt-6 flex flex-col gap-3">
        <Block className="h-24 w-full" />
        <Block className="h-24 w-full" />
        <Block className="h-24 w-full" />
      </div>
    </div>
  );
}
