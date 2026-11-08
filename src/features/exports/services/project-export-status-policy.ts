const exportableStatuses = new Set(["APPROVED", "DELIVERED"]);

export function isProjectExportStatusEligible(status: string) {
  return exportableStatuses.has(status);
}
