import Link from "next/link";
import { Button } from "@/components/ui";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              ✓
            </span>
            <span className="font-bold text-ink">Checklist</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/dashboard/checklists/new">
              <Button size="sm">+ Nouvelle checklist</Button>
            </Link>
            <form action="/api/logout" method="post">
              <Button type="submit" variant="secondary" size="sm">
                Déconnexion
              </Button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
