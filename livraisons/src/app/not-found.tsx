import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="card max-w-md p-6 text-center">
        <h1 className="text-lg font-semibold text-ink">Page introuvable</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Cette page n'existe pas, ou vous n'avez pas accès à cet élément.
        </p>
        <Link href="/" className="btn-primary mt-4">
          Retour à l'accueil
        </Link>
      </div>
    </main>
  );
}
