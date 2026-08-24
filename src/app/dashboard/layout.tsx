import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              ✓
            </span>
            <span className="font-bold">Checklist</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/dashboard/checklists/new" className="btn-primary">
              + Nouvelle checklist
            </Link>
            <form action="/api/logout" method="post">
              <button type="submit" className="btn-secondary">
                Déconnexion
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
