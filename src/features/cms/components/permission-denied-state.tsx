import { Alert } from "@/components/ui/feedback";

export function PermissionDeniedState() {
  return (
    <Alert tone="error" title="Permission denied">
      You do not have permission to access this CMS area.
    </Alert>
  );
}
