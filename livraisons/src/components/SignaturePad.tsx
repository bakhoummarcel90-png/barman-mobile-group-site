"use client";

import { useEffect, useRef, useState } from "react";

/** Zone de signature du client ; l'image est jointe au formulaire (champ « signature »). */
export function SignaturePad() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const drawing = useRef(false);
  const inked = useRef(false);
  const [signed, setSigned] = useState(false);

  useEffect(() => {
    const c = canvas.current!;
    const ratio = window.devicePixelRatio || 1;
    c.width = c.offsetWidth * ratio;
    c.height = c.offsetHeight * ratio;
    const ctx = c.getContext("2d")!;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0f172a";
  }, []);

  const pos = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top] as const;
  };

  const save = () => {
    canvas.current!.toBlob((blob) => {
      if (!blob || !input.current) return;
      const dt = new DataTransfer();
      dt.items.add(new File([blob], "signature.png", { type: "image/png" }));
      input.current.files = dt.files;
    }, "image/png");
  };

  const clear = () => {
    const c = canvas.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    if (input.current) input.current.value = "";
    inked.current = false;
    setSigned(false);
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="label mb-0">
          Signature du client <span className="font-normal text-ink-muted">(facultatif)</span>
        </span>
        {signed ? (
          <button type="button" onClick={clear} className="text-sm font-medium text-brand-700">
            Effacer
          </button>
        ) : null}
      </div>
      <canvas
        ref={canvas}
        className="h-32 w-full touch-none rounded-xl border border-dashed border-slate-300 bg-white"
        aria-label="Zone de signature"
        onPointerDown={(e) => {
          drawing.current = true;
          const ctx = canvas.current!.getContext("2d")!;
          const [x, y] = pos(e);
          ctx.beginPath();
          ctx.moveTo(x, y);
          canvas.current!.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const ctx = canvas.current!.getContext("2d")!;
          const [x, y] = pos(e);
          ctx.lineTo(x, y);
          ctx.stroke();
          inked.current = true;
          setSigned(true);
        }}
        onPointerUp={() => {
          drawing.current = false;
          if (inked.current) save();
        }}
      />
      {!signed ? <p className="mt-1 text-xs text-ink-muted">Faites signer le client avec le doigt.</p> : null}
      <input ref={input} type="file" name="signature" className="hidden" tabIndex={-1} aria-hidden />
    </div>
  );
}
