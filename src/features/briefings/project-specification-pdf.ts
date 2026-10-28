import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const LEFT = 54;
const RIGHT = PAGE_WIDTH - 54;
const BOTTOM = 58;

type TextFont = Awaited<ReturnType<PDFDocument["embedFont"]>>;

function safeFontText(value: string, font: TextFont) {
  try {
    font.encodeText(value);
    return value;
  } catch {
    // Fall back per glyph only when the standard PDF font lacks a character.
  }
  return [...value]
    .map((character) => {
      try {
        font.encodeText(character);
        return character;
      } catch {
        return "?";
      }
    })
    .join("");
}

function cleanMarkdownText(value: string) {
  return value
    .replace(/\\([\\`*_{}\[\]()#+.!|>~-])/g, "$1")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}

function wrapText(
  value: string,
  font: TextFont,
  size: number,
  maxWidth: number,
) {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    line = "";
    for (const character of word) {
      const chunk = `${line}${character}`;
      if (line && font.widthOfTextAtSize(chunk, size) > maxWidth) {
        lines.push(line);
        line = character;
      } else {
        line = chunk;
      }
    }
  }

  if (line) lines.push(line);
  return lines;
}

export async function buildProjectSpecificationPdf(markdown: string) {
  if (markdown.length > 180_000) {
    throw new Error("A especificação excede o limite para exportação PDF.");
  }

  const document = await PDFDocument.create();
  document.setTitle("Especificação do projeto LandingForge");
  document.setAuthor("LandingForge");
  document.setCreator("LandingForge");
  document.setSubject("Briefing consolidado do projeto");

  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const italic = await document.embedFont(StandardFonts.HelveticaOblique);
  const pages = [];
  let page = document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - 54;
  pages.push(page);

  const addPage = () => {
    page = document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    pages.push(page);
    y = PAGE_HEIGHT - 54;
    page.drawText("LANDINGFORGE  /  ESPECIFICAÇÃO DE PROJETO", {
      x: LEFT,
      y,
      size: 8,
      font: bold,
      color: rgb(0.25, 0.31, 0.32),
    });
    page.drawLine({
      start: { x: LEFT, y: y - 10 },
      end: { x: RIGHT, y: y - 10 },
      thickness: 0.7,
      color: rgb(0.82, 0.86, 0.85),
    });
    y -= 32;
  };

  const ensureSpace = (height: number) => {
    if (y - height < BOTTOM) addPage();
  };

  const drawParagraph = (
    value: string,
    options: {
      size: number;
      font: TextFont;
      color: ReturnType<typeof rgb>;
      indent?: number;
      gap?: number;
    },
  ) => {
    const indent = options.indent ?? 0;
    const size = options.size;
    const lineHeight = size * 1.48;
    const lines = wrapText(
      safeFontText(value, options.font),
      options.font,
      size,
      RIGHT - LEFT - indent,
    );

    for (const line of lines) {
      ensureSpace(lineHeight);
      page.drawText(line, {
        x: LEFT + indent,
        y: y - size,
        size,
        font: options.font,
        color: options.color,
      });
      y -= lineHeight;
    }
    y -= options.gap ?? 5;
  };

  page.drawText("LANDINGFORGE", {
    x: LEFT,
    y,
    size: 9,
    font: bold,
    color: rgb(0.25, 0.43, 0.39),
  });
  y -= 30;

  const lines = markdown.replaceAll("\r\n", "\n").split("\n");
  let paragraph: string[] = [];
  const flushParagraph = () => {
    if (!paragraph.length) return;
    drawParagraph(cleanMarkdownText(paragraph.join(" ")), {
      size: 10,
      font: regular,
      color: rgb(0.17, 0.21, 0.22),
      gap: 7,
    });
    paragraph = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      const level = heading[1].length;
      const text = cleanMarkdownText(heading[2]);
      if (level === 1) {
        drawParagraph(text, {
          size: 20,
          font: bold,
          color: rgb(0.13, 0.2, 0.2),
          gap: 14,
        });
      } else {
        ensureSpace(level === 2 ? 31 : 23);
        y -= level === 2 ? 7 : 4;
        drawParagraph(text, {
          size: level === 2 ? 13 : 10.5,
          font: bold,
          color: level === 2 ? rgb(0.25, 0.43, 0.39) : rgb(0.17, 0.21, 0.22),
          gap: 5,
        });
      }
      continue;
    }

    const bullet = /^[-*]\s+(.+)$/.exec(line);
    if (bullet) {
      flushParagraph();
      drawParagraph(`•  ${cleanMarkdownText(bullet[1])}`, {
        size: 9.5,
        font: regular,
        color: rgb(0.17, 0.21, 0.22),
        indent: 8,
        gap: 3,
      });
      continue;
    }

    paragraph.push(line);
  }
  flushParagraph();

  pages.forEach((currentPage, index) => {
    currentPage.drawLine({
      start: { x: LEFT, y: 39 },
      end: { x: RIGHT, y: 39 },
      thickness: 0.6,
      color: rgb(0.84, 0.87, 0.86),
    });
    currentPage.drawText(
      "Documento de trabalho · confirmar conteúdo antes de partilhar",
      {
        x: LEFT,
        y: 25,
        size: 7.5,
        font: italic,
        color: rgb(0.39, 0.44, 0.44),
      },
    );
    const pageNumber = `${index + 1} / ${pages.length}`;
    currentPage.drawText(pageNumber, {
      x: RIGHT - regular.widthOfTextAtSize(pageNumber, 8),
      y: 25,
      size: 8,
      font: regular,
      color: rgb(0.39, 0.44, 0.44),
    });
  });

  return document.save();
}
