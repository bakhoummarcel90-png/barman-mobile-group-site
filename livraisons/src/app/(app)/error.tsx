"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="card mx-auto max-w-md p-6 text-center">
      <h1 className="text-lg font-semibold text-ink">Un problème est survenu</h1>
      <p className="mt-2 text-sm text-ink-muted">
        La page n'a pas pu s'afficher. Vérifiez votre connexion internet puis réessayez.
      </p>
      <button type="button" className="btn-primary mt-4" onClick={reset}>
        Réessayer
      </button>
    </div>
  );
}
