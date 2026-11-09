"use client";

import { useRef, useState, useTransition } from "react";

export type MediaUploadResult =
  | { ok: true; message: string; publicUrl?: string }
  | { ok: false; message: string };
export type MediaUploadAction = (formData: FormData) => Promise<MediaUploadResult>;

export function MediaUploadForm({ uploadAction }: { uploadAction: MediaUploadAction }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<MediaUploadResult | null>(null);

  function submit(formData: FormData) {
    setFeedback(null);
    startTransition(async () => {
      try {
        const result = await uploadAction(formData);
        setFeedback(result);
        if (result.ok) formRef.current?.reset();
      } catch {
        setFeedback({ ok: false, message: "Ocorreu um erro inesperado. A página e os dados mantêm-se; tenta novamente." });
      }
    });
  }

  return (
    <form
      action={submit}
      className="grid gap-3 border p-4 sm:grid-cols-[1fr_1fr_auto]"
      ref={formRef}
      onChange={() => setFeedback(null)}
    >
      <label className="grid gap-2 text-sm">
        Imagem
        <input
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="min-h-11"
          disabled={pending}
          name="file"
          required
          type="file"
        />
      </label>
      <label className="grid gap-2 text-sm">
        Texto alternativo
        <input className="min-h-11 border px-3" disabled={pending} maxLength={300} name="altText" />
      </label>
      <button className="min-h-11 self-end bg-primary px-4 text-primary-foreground disabled:opacity-60" disabled={pending} type="submit">
        {pending ? "A carregar…" : "Carregar imagem"}
      </button>
      {feedback ? (
        <p className="sm:col-span-3" role={feedback.ok ? "status" : "alert"}>
          {feedback.message}
        </p>
      ) : null}
      {pending ? <p aria-live="polite" className="sm:col-span-3" role="status">A carregar a imagem…</p> : null}
      {feedback?.ok && feedback.publicUrl ? (
        <label className="grid gap-2 text-sm sm:col-span-3">
          URL pública da imagem
          <input
            className="min-h-11 border px-3"
            readOnly
            value={feedback.publicUrl}
            onFocus={(event) => event.currentTarget.select()}
          />
        </label>
      ) : null}
    </form>
  );
}
