"use server";

import { z } from "zod";

import { requireClientCmsActor } from "./authorization";
import {
  getClientCmsDashboard,
  getClientCmsForms,
  getClientCmsPage,
  listClientCmsLeads,
  setClientCmsFormActive,
  setClientCmsPageStatus,
  updateClientCmsLeadStatus,
  updateClientCmsSection,
} from "./content.service";
import { assertClientCmsSubmissionLimit, submitClientCmsLead } from "./form-submission.service";
import { headers } from "next/headers";

export async function clientCmsGetPage() {
  return getClientCmsPage(await requireClientCmsActor("content.read"));
}

export async function clientCmsGetDashboard() {
  return getClientCmsDashboard(await requireClientCmsActor("content.read"));
}

export async function clientCmsUpdateSection(input: unknown) {
  const parsed = z.object({ pageId: z.string().uuid(), sectionId: z.string().uuid(), content: z.unknown() }).strict().parse(input);
  return updateClientCmsSection(await requireClientCmsActor("content.write"), parsed);
}

export async function clientCmsGetForms() {
  return getClientCmsForms(await requireClientCmsActor("forms.read"));
}

export async function clientCmsSetPageStatus(input: unknown) {
  const parsed = z.object({ pageId: z.string().uuid(), status: z.enum(["draft", "published"]) }).strict().parse(input);
  return setClientCmsPageStatus(await requireClientCmsActor("content.write"), parsed.pageId, parsed.status);
}

export async function clientCmsSetFormActive(input: unknown) {
  const parsed = z.object({ formId: z.string().uuid(), isActive: z.boolean() }).strict().parse(input);
  return setClientCmsFormActive(await requireClientCmsActor("forms.write"), parsed.formId, parsed.isActive);
}

export async function clientCmsGetLeads() {
  return listClientCmsLeads(await requireClientCmsActor("leads.read"));
}

export async function clientCmsSetLeadStatus(input: unknown) {
  const parsed = z.object({
    leadId: z.string().uuid(),
    status: z.enum(["new", "contacted", "converted", "lost"]),
  }).strict().parse(input);
  return updateClientCmsLeadStatus(await requireClientCmsActor("leads.write"), parsed.leadId, parsed.status);
}

export async function clientCmsSubmitLead(input: unknown) {
  const requestHeaders = await headers();
  const ipAddress = requestHeaders.get("x-vercel-forwarded-for") ?? requestHeaders.get("x-real-ip") ?? requestHeaders.get("x-forwarded-for")?.split(",")[0];
  await assertClientCmsSubmissionLimit(ipAddress?.slice(0, 100));
  return submitClientCmsLead(input);
}
