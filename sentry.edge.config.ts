import * as Sentry from "@sentry/nextjs";

import { sanitizeMonitoringMetadata } from "@/features/monitoring/services/sanitize.service";

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
  enabled: Boolean(process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN),
  beforeSend(event) {
    return sanitizeMonitoringMetadata(event) as typeof event;
  },
});
