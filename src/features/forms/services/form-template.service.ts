import { FormFieldType, FormType } from "@/generated/prisma/client";

export const formTemplates = {
  contact: {
    name: "Contact Form",
    key: "contact",
    type: FormType.CONTACT,
    fields: [
      ["name", "Name", FormFieldType.TEXT, true],
      ["email", "Email", FormFieldType.EMAIL, true],
      ["phone", "Phone", FormFieldType.PHONE, false],
      ["message", "Message", FormFieldType.TEXTAREA, false],
    ],
  },
  quote: {
    name: "Quote Request",
    key: "quote-request",
    type: FormType.QUOTE,
    fields: [
      ["name", "Name", FormFieldType.TEXT, true],
      ["email", "Email", FormFieldType.EMAIL, true],
      ["phone", "Phone", FormFieldType.PHONE, true],
      ["service", "Service", FormFieldType.SELECT, true],
      ["message", "Project Details", FormFieldType.TEXTAREA, false],
    ],
  },
  appointment: {
    name: "Appointment Request",
    key: "appointment",
    type: FormType.APPOINTMENT,
    fields: [
      ["name", "Name", FormFieldType.TEXT, true],
      ["email", "Email", FormFieldType.EMAIL, true],
      ["phone", "Phone", FormFieldType.PHONE, true],
      ["date", "Preferred Date", FormFieldType.DATE, false],
      ["time", "Preferred Time", FormFieldType.TEXT, false],
    ],
  },
  newsletter: {
    name: "Newsletter Signup",
    key: "newsletter",
    type: FormType.NEWSLETTER,
    fields: [["email", "Email", FormFieldType.EMAIL, true]],
  },
} as const;

export type FormTemplateKey = keyof typeof formTemplates;
