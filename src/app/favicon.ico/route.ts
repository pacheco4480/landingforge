export function GET() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#123c69"/>
  <path d="M14 36 32 18l18 18" fill="none" stroke="#f59e0b" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M21 34v16h22V34" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
