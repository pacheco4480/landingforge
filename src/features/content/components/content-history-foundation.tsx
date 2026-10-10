import { Alert } from "@/components/ui/feedback";

export function ContentHistoryFoundation() {
  return (
    <Alert tone="info" title="History foundation">
      Content changes are audit logged. Full revisions, rollback and
      side-by-side comparison are reserved for the versioning task.
    </Alert>
  );
}
