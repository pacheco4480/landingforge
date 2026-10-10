"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/form";
import { saveCookieConsentAction } from "@/features/legal/actions/legal.actions";

type CookieConsentState = {
  consentId: string;
  version: string;
  analytics: boolean;
  marketing: boolean;
};

const storageKey = "landingforge-cookie-consent";
const emptySubscribe = () => () => undefined;

export function CookieConsentBanner({
  analyticsEnabled,
  cookiePolicyHref,
  enabled,
  marketingEnabled,
  version,
}: {
  analyticsEnabled: boolean;
  cookiePolicyHref: string;
  enabled: boolean;
  marketingEnabled: boolean;
  version: string;
}) {
  const storedConsentSnapshot = React.useSyncExternalStore(
    emptySubscribe,
    readStoredConsentSnapshot,
    () => null,
  );
  const storedConsent = React.useMemo(
    () => parseStoredConsent(storedConsentSnapshot),
    [storedConsentSnapshot],
  );
  const hasCurrentConsent = storedConsent?.version === version;
  const [isDismissed, setIsDismissed] = React.useState(false);
  const [isCustomizing, setIsCustomizing] = React.useState(false);
  const [analytics, setAnalytics] = React.useState(false);
  const [marketing, setMarketing] = React.useState(false);
  const rejectButtonRef = React.useRef<HTMLButtonElement>(null);
  const isVisible = enabled && !hasCurrentConsent && !isDismissed;

  const saveConsent = React.useCallback(
    async (next: { analytics: boolean; marketing: boolean }) => {
      const consent: CookieConsentState = {
        consentId: readStoredConsent()?.consentId ?? crypto.randomUUID(),
        version,
        analytics: next.analytics,
        marketing: next.marketing,
      };
      window.localStorage.setItem(storageKey, JSON.stringify(consent));
      const formData = new FormData();
      formData.set("consentId", consent.consentId);
      formData.set("version", consent.version);
      if (consent.analytics) formData.set("analytics", "on");
      if (consent.marketing) formData.set("marketing", "on");
      await saveCookieConsentAction(formData);
      setIsDismissed(true);
    },
    [version],
  );

  React.useEffect(() => {
    if (!enabled || !isVisible) return;
    rejectButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        void saveConsent({ analytics: false, marketing: false });
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, isVisible, saveConsent]);

  if (!enabled || !isVisible) return null;

  return (
    <section
      aria-labelledby="cookie-consent-title"
      aria-modal="true"
      className="fixed inset-x-3 bottom-3 z-50 rounded-md border border-black/10 bg-white p-4 text-slate-900 shadow-2xl sm:left-auto sm:right-4 sm:max-w-md"
      role="dialog"
    >
      <div className="grid gap-3">
        <div>
          <h2 className="text-base font-semibold" id="cookie-consent-title">
            Cookies e privacidade
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Usamos cookies necessarios e, com o teu consentimento, cookies de
            analytics e marketing. Podes alterar a decisao a qualquer momento.
          </p>
          <a className="mt-2 inline-flex text-sm font-semibold underline" href={cookiePolicyHref}>
            Ver Politica de Cookies
          </a>
        </div>
        {isCustomizing ? (
          <div className="grid gap-2 rounded-md bg-slate-50 p-3 text-sm">
            <label className="flex min-h-11 items-center justify-between gap-3">
              <span>Necessarios</span>
              <Checkbox checked disabled readOnly />
            </label>
            <label className="flex min-h-11 items-center justify-between gap-3">
              <span>Analytics</span>
              <Checkbox
                checked={analytics}
                disabled={!analyticsEnabled}
                onChange={(event) => setAnalytics(event.currentTarget.checked)}
              />
            </label>
            <label className="flex min-h-11 items-center justify-between gap-3">
              <span>Marketing</span>
              <Checkbox
                checked={marketing}
                disabled={!marketingEnabled}
                onChange={(event) => setMarketing(event.currentTarget.checked)}
              />
            </label>
          </div>
        ) : null}
        <div className="grid gap-2 sm:grid-cols-3">
          <Button
            ref={rejectButtonRef}
            type="button"
            variant="outline"
            onClick={() => saveConsent({ analytics: false, marketing: false })}
          >
            Recusar
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsCustomizing((current) => !current)}
          >
            Personalizar
          </Button>
          <Button
            type="button"
            onClick={() =>
              isCustomizing
                ? saveConsent({ analytics, marketing })
                : saveConsent({
                    analytics: analyticsEnabled,
                    marketing: marketingEnabled,
                  })
            }
          >
            {isCustomizing ? "Guardar" : "Aceitar"}
          </Button>
        </div>
      </div>
    </section>
  );
}

function readStoredConsent(): CookieConsentState | null {
  return parseStoredConsent(readStoredConsentSnapshot());
}

function readStoredConsentSnapshot() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

function parseStoredConsent(raw: string | null): CookieConsentState | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CookieConsentState;
  } catch {
    return null;
  }
}
