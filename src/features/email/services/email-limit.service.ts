import { countSentEmailsToday } from "@/features/email/services/email-log.service";

const defaultDailyLimit = 90;

export async function assertEmailDailyLimit() {
  const limit = Number(process.env.EMAIL_DAILY_LIMIT ?? defaultDailyLimit);
  const sentToday = await countSentEmailsToday();
  if (sentToday >= limit) {
    throw new Error("Limite diário de emails atingido.");
  }
}
