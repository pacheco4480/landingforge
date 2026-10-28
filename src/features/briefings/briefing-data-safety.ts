export function redactSensitiveBriefingText(value: string) {
  return value
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[EMAIL REDIGIDO]")
    .replace(/\b(?:\+?\d[\d\s().-]{7,}\d)\b/g, "[TELEFONE REDIGIDO]")
    .replace(
      /(?:sk-[A-Za-z0-9_-]{12,}|sb_secret_[A-Za-z0-9_-]+|re_[A-Za-z0-9_-]{12,})/g,
      "[SEGREDO REDIGIDO]",
    )
    .replace(
      /\b(?:api[_ -]?key|access[_ -]?token|password|palavra-passe|senha)\s*[:=]\s*\S+/gi,
      "[CREDENCIAL REDIGIDA]",
    )
    .replace(
      /\b(?:diagn[oó]stico|sintomas?|hist[oó]rico cl[ií]nico|n[uú]mero de utente|processo cl[ií]nico)\b[^.!?\n]*/gi,
      "[DADO DE SAÚDE OMITIDO]",
    );
}
