"use client";

import * as React from "react";
import {
  CheckCircle2,
  Info,
  Loader2,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "warning" | "info" | "loading";

type Toast = {
  id: string;
  tone: ToastTone;
  title: string;
  message?: string;
};

type ToastContextValue = {
  showToast: (toast: Omit<Toast, "id">) => string;
  updateToast: (id: string, toast: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const dismissToast = React.useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = React.useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = crypto.randomUUID();
      setToasts((current) => [...current, { ...toast, id }].slice(-5));
      if (toast.tone !== "loading") {
        window.setTimeout(() => dismissToast(id), 4500);
      }
      return id;
    },
    [dismissToast],
  );

  const updateToast = React.useCallback(
    (id: string, toast: Omit<Toast, "id">) => {
      setToasts((current) =>
        current.map((item) => (item.id === id ? { ...toast, id } : item)),
      );
      if (toast.tone !== "loading") {
        window.setTimeout(() => dismissToast(id), 4500);
      }
    },
    [dismissToast],
  );

  return (
    <ToastContext.Provider value={{ showToast, updateToast, dismissToast }}>
      {children}
      <div
        className="fixed inset-x-3 top-3 z-50 grid gap-3 sm:inset-x-auto sm:right-4 sm:w-full sm:max-w-sm"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider.");
  }
  return context;
}

export function ActionFeedbackForm({
  action,
  children,
  className,
  loadingMessage = "A guardar...",
  successMessage = "Alterações guardadas.",
  errorMessage = "Não foi possível concluir a ação.",
}: React.FormHTMLAttributes<HTMLFormElement> & {
  action: (formData: FormData) => Promise<void>;
  loadingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
}) {
  const router = useRouter();
  const { showToast, updateToast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [inlineError, setInlineError] = React.useState<string | null>(null);

  return (
    <form
      className={className}
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        setInlineError(null);
        const toastId = showToast({ tone: "loading", title: loadingMessage });

        startTransition(async () => {
          try {
            await action(formData);
            updateToast(toastId, { tone: "success", title: successMessage });
            router.refresh();
          } catch (error) {
            if (isNextRedirect(error)) throw error;
            const message = getActionErrorMessage(error, errorMessage);
            setInlineError(message);
            updateToast(toastId, { tone: "error", title: message });
          }
        });
      }}
    >
      {children}
      {inlineError ? (
        <p className="text-error text-sm" role="alert">
          {inlineError}
        </p>
      ) : null}
      <input
        aria-hidden="true"
        hidden
        readOnly
        name="_pending"
        value={String(isPending)}
      />
    </form>
  );
}

export function ConfirmActionForm({
  action,
  children,
  className,
  title = "Confirmar ação",
  description = "Esta ação não deve ser feita sem confirmação.",
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  loadingMessage = "A processar...",
  successMessage = "Ação concluída.",
  errorMessage = "Não foi possível concluir a ação.",
}: React.FormHTMLAttributes<HTMLFormElement> & {
  action: (formData: FormData) => Promise<void>;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loadingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
}) {
  const router = useRouter();
  const { showToast, updateToast } = useToast();
  const [isOpen, setIsOpen] = React.useState(false);
  const [formData, setFormData] = React.useState<FormData | null>(null);
  const [isPending, startTransition] = React.useTransition();

  return (
    <>
      <form
        className={className}
        onSubmit={(event) => {
          event.preventDefault();
          setFormData(new FormData(event.currentTarget));
          setIsOpen(true);
        }}
      >
        {children}
      </form>
      {isOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <section
            className="border-border bg-background w-full max-w-md rounded-md border p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-description"
          >
            <h2 id="confirm-title" className="text-lg font-semibold">
              {title}
            </h2>
            <p
              id="confirm-description"
              className="text-muted-foreground mt-2 text-sm"
            >
              {description}
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
              >
                {cancelLabel}
              </Button>
              <Button
                type="button"
                variant="destructive"
                isLoading={isPending}
                onClick={() => {
                  if (!formData) return;
                  const toastId = showToast({
                    tone: "loading",
                    title: loadingMessage,
                  });
                  startTransition(async () => {
                    try {
                      await action(formData);
                      updateToast(toastId, {
                        tone: "success",
                        title: successMessage,
                      });
                      router.refresh();
                      setIsOpen(false);
                    } catch (error) {
                      if (isNextRedirect(error)) throw error;
                      updateToast(toastId, {
                        tone: "error",
                        title: getActionErrorMessage(error, errorMessage),
                      });
                    }
                  });
                }}
              >
                {confirmLabel}
              </Button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const Icon =
    toast.tone === "success"
      ? CheckCircle2
      : toast.tone === "error"
        ? XCircle
        : toast.tone === "warning"
          ? TriangleAlert
          : toast.tone === "loading"
            ? Loader2
            : Info;

  return (
    <div
      className={cn(
        "border-border bg-background text-foreground flex gap-3 rounded-md border p-4 shadow-xl",
        toast.tone === "success" && "border-success/30",
        toast.tone === "error" && "border-error/30",
        toast.tone === "warning" && "border-warning/30",
        toast.tone === "info" && "border-info/30",
      )}
      role={toast.tone === "error" ? "alert" : "status"}
    >
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          toast.tone === "loading" && "animate-spin",
        )}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.message ? (
          <p className="text-muted-foreground mt-1 text-sm">{toast.message}</p>
        ) : null}
      </div>
      {toast.tone !== "loading" ? (
        <button
          className="text-muted-foreground hover:text-foreground text-sm"
          type="button"
          onClick={() => onDismiss(toast.id)}
          aria-label="Fechar notificação"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}

function isNextRedirect(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

function getActionErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return normalizeErrorMessage(error.message);
  }
  return fallback;
}

function normalizeErrorMessage(message: string) {
  if (message.includes("Unexpected token") || message.includes("JSON")) {
    return "Verifica os campos JSON antes de guardar.";
  }

  try {
    const parsed = JSON.parse(message) as unknown;
    if (Array.isArray(parsed)) {
      const firstIssue = parsed.find(
        (issue): issue is { path?: unknown[]; message?: string } =>
          issue !== null && typeof issue === "object" && "message" in issue,
      );
      const field = firstIssue?.path?.at(0);
      if (typeof field === "string") {
        return `Verifica o campo ${field}.`;
      }
      if (firstIssue?.message) return firstIssue.message;
    }
  } catch {
    // Keep the original message when it is already readable.
  }

  if (message.length > 140) return "Não foi possível validar os dados.";
  return message;
}
