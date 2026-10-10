import { personalDataExportSchema } from "@/features/legal/schemas/legal.schema";
import { db } from "@/lib/db";

export async function exportPersonalData(input: unknown) {
  const { email } = personalDataExportSchema.parse(input);
  const [leads, submissions] = await Promise.all([
    db.lead.findMany({
      where: { email, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        formSubmission: {
          include: {
            form: { select: { id: true, name: true, key: true } },
            page: { select: { id: true, title: true, slug: true } },
          },
        },
      },
    }),
    db.formSubmission.findMany({
      where: {
        data: { path: ["email"], equals: email },
      },
      orderBy: { createdAt: "desc" },
      include: {
        form: { select: { id: true, name: true, key: true } },
        page: { select: { id: true, title: true, slug: true } },
      },
    }),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    subject: { email },
    leads: leads.map((lead) => ({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      message: lead.message,
      source: lead.source,
      status: lead.status,
      consent: {
        given: lead.consentGiven,
        version: lead.consentVersion,
        givenAt: lead.consentGivenAt?.toISOString() ?? null,
        source: lead.consentSource,
      },
      createdAt: lead.createdAt.toISOString(),
      form: lead.formSubmission?.form ?? null,
      page: lead.formSubmission?.page ?? null,
    })),
    submissions: submissions.map((submission) => ({
      id: submission.id,
      data: submission.data,
      status: submission.status,
      referrer: submission.referrer,
      consent: {
        given: submission.consentGiven,
        version: submission.consentVersion,
        givenAt: submission.consentGivenAt?.toISOString() ?? null,
        source: submission.consentSource,
      },
      createdAt: submission.createdAt.toISOString(),
      form: submission.form,
      page: submission.page,
    })),
  };
}
