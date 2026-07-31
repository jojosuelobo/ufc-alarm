import Link from "next/link";

export default function UserMenuButton() {
  return (
    <Link
      href="/minha-conta"
      aria-label="Minha conta"
      className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-border bg-surface-raised text-muted transition hover:border-accent hover:text-accent"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" />
        <path d="M4 21a8 8 0 0 1 16 0 1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z" />
      </svg>
    </Link>
  );
}
