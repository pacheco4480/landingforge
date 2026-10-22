import { PortfolioManager } from "@/features/portfolio/components/portfolio-manager";
import { getPortfolioManagement } from "@/features/portfolio/services/portfolio.service";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";

export default async function PortfolioManagementPage() {
  await requirePermission(permissions.adminAccess);
  const workspace = await getPortfolioManagement();
  return <PortfolioManager workspace={workspace} />;
}
