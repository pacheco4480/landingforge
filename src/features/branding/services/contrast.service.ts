function normalizeHex(hex: string) {
  const value = hex.trim().replace("#", "");
  if (value.length === 3) {
    return value
      .split("")
      .map((part) => `${part}${part}`)
      .join("");
  }
  return value;
}

export function isHexColor(value: string) {
  return /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(value);
}

export function getContrastRatio(foreground: string, background: string) {
  const foregroundLuminance = getRelativeLuminance(foreground);
  const backgroundLuminance = getRelativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

export function meetsWcagAa(foreground: string, background: string) {
  return getContrastRatio(foreground, background) >= 4.5;
}

function getRelativeLuminance(hex: string) {
  const normalized = normalizeHex(hex);
  const channels = [0, 2, 4].map(
    (start) => Number.parseInt(normalized.slice(start, start + 2), 16) / 255,
  );

  const [r, g, b] = channels.map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
