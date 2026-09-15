import { ImageIcon } from "lucide-react";

/**
 * Emplacement clairement identifié pour une future photo.
 * Remplacez cet appel par une balise <Image> (next/image) pointant vers
 * votre vraie photo dès qu'elle est disponible — voir README.md.
 */
export default function PlaceholderImage({
  description,
  className = "",
  aspect = "aspect-[4/3]",
}: {
  description: string;
  className?: string;
  aspect?: string;
}) {
  return (
    <div
      className={`flex ${aspect} w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-champagne/30 bg-nuit-light/60 p-6 text-center ${className}`}
      role="img"
      aria-label={`Emplacement photo à compléter : ${description}`}
    >
      <ImageIcon className="h-8 w-8 text-champagne/50" aria-hidden="true" />
      <p className="text-xs uppercase tracking-wide text-ivoire/40">Photo à compléter</p>
      <p className="max-w-xs text-sm text-ivoire/60">{description}</p>
    </div>
  );
}
