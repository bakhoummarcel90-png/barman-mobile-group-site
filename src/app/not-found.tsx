import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center px-5 pt-24 text-center">
      <p className="text-sm uppercase tracking-[0.2em] text-champagne/80">Page introuvable</p>
      <h1 className="mt-4 font-display text-3xl text-ivoire md:text-4xl">
        Cette page n'existe pas ou plus
      </h1>
      <p className="mt-4 max-w-md text-ivoire/60">
        Retournez à l'accueil ou consultez directement nos services.
      </p>
      <div className="mt-8 flex gap-4">
        <Link href="/" className="focus-ring rounded-full bg-champagne px-6 py-3 text-sm font-medium text-nuit hover:bg-champagne-light">
          Retour à l'accueil
        </Link>
        <Link href="/services" className="focus-ring rounded-full border border-ivoire/25 px-6 py-3 text-sm text-ivoire hover:border-ivoire/60">
          Nos services
        </Link>
      </div>
    </section>
  );
}
