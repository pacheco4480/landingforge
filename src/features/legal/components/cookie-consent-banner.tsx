"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/form";

type CookieConsentState = {
  consentId: string;
  version: string;
  analytics: boolean;
  marketing: boolean;
};

const storageKey = "landingforge-cookie-consent";
const emptySubscribe = () => () => undefined;
type SaveCookieConsentAction = (formData: FormData) => Promise<void>;

export function CookieConsentBanner({
  saveConsentAction,
  analyticsEnabled,
  cookiePolicyHref,
  enabled,
  marketingEnabled,
  version,
}: {
  saveConsentAction: SaveCookieConsentAction;
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
      await saveConsentAction(formData);
      setIsDismissed(true);
    },
    [saveConsentAction, version],
  );

  React.useEffect(() => {
    if (!enabled || !isVisible) return;

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
      className="fixed inset-x-2 bottom-0 z-50 max-h-[calc(100dvh-1rem)] overflow-y-auto rounded-md border border-black/10 bg-white p-1 text-slate-900 shadow-2xl sm:inset-x-auto sm:bottom-4 sm:right-4 sm:max-h-[calc(100vh-2rem)] sm:w-[min(28rem,calc(100vw-2rem))] sm:p-4"
      role="dialog"
    >
      <div className="grid gap-0.5 sm:gap-3">
        <div>
          <h2 className="sr-only sm:not-sr-only sm:text-base sm:font-semibold" id="cookie-consent-title">
            Cookies e privacidade
          </h2>
          <p className="text-xs leading-[14px] text-slate-600 sm:mt-1 sm:text-sm sm:leading-normal">
            <span className="sm:hidden">
              Necessários ativos; opcionais só com consentimento.{" "}
            </span>
            <span className="hidden sm:inline">
              Cookies necessários sempre ativos. Analytics e marketing só com
              consentimento.{" "}
            </span>
            <a
              aria-label="Política de Cookies"
              className="font-semibold text-slate-900 underline"
              href={cookiePolicyHref}
            >
              <span className="sm:hidden">Política</span>
              <span className="hidden sm:inline">Política de Cookies</span>
            </a>
          </p>
        </div>
        {isCustomizing ? (
          <div className="grid gap-1 rounded-md bg-slate-50 p-2 text-sm sm:gap-2 sm:p-3">
            <label className="flex min-h-11 items-center justify-between gap-3">
              <span>Necessários</span>
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
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11 min-w-0 whitespace-normal px-1 leading-tight sm:px-3 sm:text-sm"
            onClick={() => saveConsent({ analytics: false, marketing: false })}
          >
            Recusar
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11 min-w-0 whitespace-normal px-1 leading-tight sm:px-3 sm:text-sm"
            onClick={() => setIsCustomizing((current) => !current)}
          >
            Personalizar
          </Button>
          <Button
            type="button"
            size="sm"
            className="min-h-11 min-w-0 whitespace-normal px-1 leading-tight sm:px-3 sm:text-sm"
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
