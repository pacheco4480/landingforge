import { CmsPageHeader } from "@/features/cms/components/cms-page-header";
import { FieldEditor } from "@/features/forms/components/field-editor";
import { FieldsTable } from "@/features/forms/components/fields-table";
import { FormPreview } from "@/features/forms/components/form-preview";
import { FormSettingsForm } from "@/features/forms/components/form-settings-form";
import { FormTemplateForm } from "@/features/forms/components/form-template-form";
import { FormsTable } from "@/features/forms/components/forms-table";
import { SubmissionsSummary } from "@/features/forms/components/submissions-summary";
import { getFormsWorkspace } from "@/features/forms/services/form.service";
import { permissions } from "@/features/rbac/permissions";
import { hasPermission } from "@/features/rbac/rbac.service";
import { requirePermission } from "@/lib/auth/require-permission";

export default async function FormsPage({
  searchParams,
}: {
  searchParams: Promise<{ formId?: string }>;
}) {
  const user = await requirePermission(permissions.formsRead);
  const { formId } = await searchParams;
  const workspace = await getFormsWorkspace(user.roles, formId);
  const canWrite = hasPermission(user.permissions, permissions.formsWrite);

  return (
    <div className="grid gap-8">
      <CmsPageHeader
        eyebrow="Lead Capture"
        title="Forms"
        description="Create, validate and reuse lead capture forms across landing pages."
      />
      <FormTemplateForm pages={workspace.pages} canWrite={canWrite} />
      <FormsTable
        forms={workspace.forms}
        selectedFormId={workspace.selectedForm?.id}
        canWrite={canWrite}
      />
      <FormSettingsForm
        form={workspace.selectedForm}
        pages={workspace.pages}
        canWrite={canWrite}
      />
      {workspace.selectedForm ? (
        <>
          <FieldsTable
            fields={workspace.selectedForm.fields}
            canWrite={canWrite}
          />
          <FieldEditor formId={workspace.selectedForm.id} canWrite={canWrite} />
          <FormPreview
            form={workspace.selectedForm}
            fields={workspace.selectedForm.fields}
          />
          <SubmissionsSummary
            submissions={workspace.selectedForm.submissions}
          />
        </>
      ) : null}
    </div>
  );
}
