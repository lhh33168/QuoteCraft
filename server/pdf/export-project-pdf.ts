import fs from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { ProjectDetail, ProjectType, QuoteItem } from "@/shared/types/project";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const PAGE_MARGIN_X = 44;
const PAGE_MARGIN_TOP = 46;
const PAGE_MARGIN_BOTTOM = 50;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN_X * 2;

const BRAND = rgb(0.09, 0.2, 0.31);
const PINE = rgb(0.09, 0.3, 0.25);
const TEXT = rgb(0.09, 0.13, 0.11);
const MUTED = rgb(0.36, 0.42, 0.39);
const SOFT_FILL = rgb(0.98, 0.97, 0.94);
const LINE = rgb(0.9, 0.89, 0.84);

const CHINESE_FONT_CANDIDATES = [
  "C:\\Windows\\Fonts\\simhei.ttf",
  "C:\\Windows\\Fonts\\simfang.ttf",
  "C:\\Windows\\Fonts\\simkai.ttf",
  "C:\\Windows\\Fonts\\simsunb.ttf",
  "C:\\Windows\\Fonts\\simsun.ttc"
];

type PdfTextFont = {
  body: Awaited<ReturnType<typeof loadBodyFont>>;
  heading: Awaited<ReturnType<typeof loadHeadingFont>>;
};

type DrawContext = {
  doc: PDFDocument;
  fonts: PdfTextFont;
  page: import("pdf-lib").PDFPage;
  y: number;
  pageCount: number;
};

type FontLike = Awaited<ReturnType<typeof loadBodyFont>>;

function sanitizeFileName(value: string) {
  const normalized = value.trim() || "QuoteCraft-Proposal";
  return normalized.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-").slice(0, 80);
}

function projectTypeLabel(projectType: ProjectType) {
  if (projectType === "website") {
    return "官网开发";
  }

  if (projectType === "mini_program") {
    return "小程序开发";
  }

  if (projectType === "admin_panel") {
    return "后台管理系统";
  }

  return "定制项目";
}

function fallbackText(value: string | null | undefined, fallback: string) {
  return value?.trim() ? value.trim() : fallback;
}

function formatMoney(value: string | number) {
  return `¥${Number(value || 0).toLocaleString("zh-CN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
}

function formatQuantity(item: QuoteItem) {
  return `${item.quantity} ${item.unit?.trim() || "项"}`;
}

function measureWrappedLines(text: string, font: FontLike, size: number, maxWidth: number) {
  const paragraphs = text.replace(/\r/g, "").split("\n");
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const source = paragraph.trim();

    if (!source) {
      lines.push("");
      continue;
    }

    let current = "";

    for (const character of source) {
      const candidate = `${current}${character}`;

      if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !current) {
        current = candidate;
        continue;
      }

      lines.push(current);
      current = character;
    }

    if (current) {
      lines.push(current);
    }
  }

  return lines;
}

function ensureSpace(ctx: DrawContext, requiredHeight: number) {
  const minY = PAGE_MARGIN_BOTTOM;

  if (ctx.y - requiredHeight >= minY) {
    return;
  }

  ctx.page = ctx.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  ctx.pageCount += 1;
  ctx.y = PAGE_HEIGHT - PAGE_MARGIN_TOP;
}

function drawTextBlock(
  ctx: DrawContext,
  text: string,
  options: {
    x?: number;
    font?: FontLike;
    size?: number;
    color?: ReturnType<typeof rgb>;
    lineHeight?: number;
    maxWidth?: number;
  } = {}
) {
  const x = options.x ?? PAGE_MARGIN_X;
  const font = options.font ?? ctx.fonts.body;
  const size = options.size ?? 12;
  const color = options.color ?? TEXT;
  const maxWidth = options.maxWidth ?? CONTENT_WIDTH;
  const lineHeight = options.lineHeight ?? size * 1.65;
  const lines = measureWrappedLines(text, font, size, maxWidth);
  const totalHeight = lines.length * lineHeight;

  ensureSpace(ctx, totalHeight);

  for (const line of lines) {
    ctx.page.drawText(line || " ", {
      x,
      y: ctx.y - size,
      size,
      font,
      color
    });
    ctx.y -= lineHeight;
  }
}

function drawLabelValueCard(
  ctx: DrawContext,
  options: {
    x: number;
    yTop: number;
    width: number;
    height: number;
    label: string;
    value: string;
  }
) {
  ctx.page.drawRectangle({
    x: options.x,
    y: options.yTop - options.height,
    width: options.width,
    height: options.height,
    color: SOFT_FILL,
    borderColor: LINE,
    borderWidth: 1
  });

  ctx.page.drawText(options.label, {
    x: options.x + 14,
    y: options.yTop - 24,
    size: 9,
    font: ctx.fonts.heading,
    color: MUTED
  });

  const valueLines = measureWrappedLines(options.value, ctx.fonts.heading, 14, options.width - 28);
  let currentY = options.yTop - 48;

  for (const line of valueLines.slice(0, 2)) {
    ctx.page.drawText(line, {
      x: options.x + 14,
      y: currentY,
      size: 14,
      font: ctx.fonts.heading,
      color: TEXT
    });
    currentY -= 18;
  }
}

function drawSectionTitle(ctx: DrawContext, title: string) {
  ensureSpace(ctx, 26);
  ctx.page.drawText(title, {
    x: PAGE_MARGIN_X,
    y: ctx.y - 10,
    size: 10,
    font: ctx.fonts.heading,
    color: PINE
  });
  ctx.y -= 22;
}

function drawDivider(ctx: DrawContext) {
  ensureSpace(ctx, 12);
  ctx.page.drawLine({
    start: { x: PAGE_MARGIN_X, y: ctx.y },
    end: { x: PAGE_WIDTH - PAGE_MARGIN_X, y: ctx.y },
    thickness: 1,
    color: LINE
  });
  ctx.y -= 16;
}

function estimateParagraphHeight(text: string, font: FontLike, size: number, width: number, lineHeight: number) {
  return measureWrappedLines(text, font, size, width).length * lineHeight;
}

async function readFontFile(fontPath: string) {
  try {
    return await fs.readFile(fontPath);
  } catch {
    return null;
  }
}

async function loadBodyFont(doc: PDFDocument) {
  for (const candidate of CHINESE_FONT_CANDIDATES) {
    const data = await readFontFile(candidate);

    if (data) {
      return doc.embedFont(data, { subset: true });
    }
  }

  return doc.embedFont(StandardFonts.Helvetica);
}

async function loadHeadingFont(doc: PDFDocument) {
  for (const candidate of CHINESE_FONT_CANDIDATES) {
    const data = await readFontFile(candidate);

    if (data) {
      return doc.embedFont(data, { subset: true });
    }
  }

  return doc.embedFont(StandardFonts.HelveticaBold);
}

function buildFileName(detail: ProjectDetail) {
  return `${sanitizeFileName(detail.project.title || "QuoteCraft-Proposal")}.pdf`;
}

function buildProjectSummaryRows(detail: ProjectDetail) {
  return [
    { label: "客户名称", value: fallbackText(detail.project.clientName, "待确认") },
    { label: "客户公司", value: fallbackText(detail.project.clientCompany, "待确认") },
    { label: "项目类型", value: projectTypeLabel(detail.project.projectType) },
    { label: "所属行业", value: fallbackText(detail.project.industry, "通用企业服务") }
  ];
}

export async function exportProjectPdf(detail: ProjectDetail) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  const fonts = {
    body: await loadBodyFont(doc),
    heading: await loadHeadingFont(doc)
  };

  const ctx: DrawContext = {
    doc,
    fonts,
    page: doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]),
    y: PAGE_HEIGHT - PAGE_MARGIN_TOP,
    pageCount: 1
  };

  const title = fallbackText(detail.project.title, "未命名项目");
  const summary = fallbackText(detail.project.summary, "这是一份用于客户查看和沟通的项目方案。");

  ctx.page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 200,
    width: PAGE_WIDTH,
    height: 200,
    color: BRAND
  });

  ctx.page.drawRectangle({
    x: PAGE_MARGIN_X,
    y: PAGE_HEIGHT - 72,
    width: 176,
    height: 28,
    color: rgb(1, 1, 1),
    opacity: 0.1
  });

  ctx.page.drawText("QUOTECRAFT PROPOSAL", {
    x: PAGE_MARGIN_X + 16,
    y: PAGE_HEIGHT - 62,
    size: 10,
    font: fonts.heading,
    color: rgb(1, 1, 1)
  });

  const titleLines = measureWrappedLines(title, fonts.heading, 26, CONTENT_WIDTH);
  let titleY = PAGE_HEIGHT - 108;

  for (const line of titleLines.slice(0, 3)) {
    ctx.page.drawText(line, {
      x: PAGE_MARGIN_X,
      y: titleY,
      size: 26,
      font: fonts.heading,
      color: rgb(1, 1, 1)
    });
    titleY -= 32;
  }

  const summaryLines = measureWrappedLines(summary, fonts.body, 12, CONTENT_WIDTH);
  let summaryY = titleY - 6;

  for (const line of summaryLines.slice(0, 4)) {
    ctx.page.drawText(line, {
      x: PAGE_MARGIN_X,
      y: summaryY,
      size: 12,
      font: fonts.body,
      color: rgb(0.93, 0.95, 0.94)
    });
    summaryY -= 18;
  }

  ctx.y = PAGE_HEIGHT - 228;

  const cards = buildProjectSummaryRows(detail);
  const cardGap = 12;
  const cardWidth = (CONTENT_WIDTH - cardGap) / 2;
  const cardHeight = 82;
  ensureSpace(ctx, cardHeight * 2 + 28);

  cards.forEach((card, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    drawLabelValueCard(ctx, {
      x: PAGE_MARGIN_X + column * (cardWidth + cardGap),
      yTop: ctx.y - row * (cardHeight + cardGap),
      width: cardWidth,
      height: cardHeight,
      label: card.label,
      value: card.value
    });
  });

  ctx.y -= cardHeight * 2 + cardGap + 18;

  drawDivider(ctx);
  drawSectionTitle(ctx, "项目背景");
  drawTextBlock(ctx, fallbackText(detail.project.background, "暂无项目背景说明。"), {
    size: 11,
    lineHeight: 18,
    color: TEXT
  });

  drawDivider(ctx);
  drawSectionTitle(ctx, "项目目标");
  drawTextBlock(ctx, fallbackText(detail.project.goal, "暂无项目目标说明。"), {
    size: 11,
    lineHeight: 18,
    color: TEXT
  });

  drawDivider(ctx);
  drawSectionTitle(ctx, "服务范围");
  drawTextBlock(ctx, fallbackText(detail.project.scope, "暂无服务范围说明。"), {
    size: 11,
    lineHeight: 18,
    color: TEXT
  });

  drawDivider(ctx);
  drawSectionTitle(ctx, "原始需求摘要");
  drawTextBlock(ctx, fallbackText(detail.project.rawRequirement, "暂无原始需求摘要。"), {
    size: 11,
    lineHeight: 18,
    color: TEXT
  });

  drawDivider(ctx);
  drawSectionTitle(ctx, `报价明细 (${detail.quoteItems.length} 项)`);

  for (const item of detail.quoteItems) {
    const itemDescription = fallbackText(item.description, "暂无报价项说明。");
    const descriptionHeight = estimateParagraphHeight(itemDescription, fonts.body, 10.5, CONTENT_WIDTH - 144, 16);
    const itemHeight = Math.max(82, descriptionHeight + 40);

    ensureSpace(ctx, itemHeight + 12);

    ctx.page.drawRectangle({
      x: PAGE_MARGIN_X,
      y: ctx.y - itemHeight,
      width: CONTENT_WIDTH,
      height: itemHeight,
      color: SOFT_FILL,
      borderColor: LINE,
      borderWidth: 1
    });

    ctx.page.drawText(item.name, {
      x: PAGE_MARGIN_X + 16,
      y: ctx.y - 24,
      size: 13,
      font: fonts.heading,
      color: TEXT
    });

    ctx.page.drawText(formatQuantity(item), {
      x: PAGE_WIDTH - PAGE_MARGIN_X - 110,
      y: ctx.y - 24,
      size: 10,
      font: fonts.body,
      color: MUTED
    });

    const itemLines = measureWrappedLines(itemDescription, fonts.body, 10.5, CONTENT_WIDTH - 144);
    let itemTextY = ctx.y - 44;

    for (const line of itemLines) {
      ctx.page.drawText(line || " ", {
        x: PAGE_MARGIN_X + 16,
        y: itemTextY,
        size: 10.5,
        font: fonts.body,
        color: MUTED
      });
      itemTextY -= 16;
    }

    ctx.page.drawText("小计", {
      x: PAGE_WIDTH - PAGE_MARGIN_X - 110,
      y: ctx.y - 52,
      size: 9,
      font: fonts.heading,
      color: MUTED
    });

    ctx.page.drawText(formatMoney(item.subtotal), {
      x: PAGE_WIDTH - PAGE_MARGIN_X - 110,
      y: ctx.y - 74,
      size: 14,
      font: fonts.heading,
      color: PINE
    });

    ctx.y -= itemHeight + 12;
  }

  ensureSpace(ctx, 112);
  ctx.page.drawRectangle({
    x: PAGE_MARGIN_X,
    y: ctx.y - 104,
    width: CONTENT_WIDTH,
    height: 104,
    color: rgb(0.96, 0.94, 0.9)
  });

  ctx.page.drawText("项目总金额", {
    x: PAGE_MARGIN_X + 18,
    y: ctx.y - 22,
    size: 10,
    font: fonts.heading,
    color: MUTED
  });

  ctx.page.drawText(formatMoney(detail.project.totalPrice), {
    x: PAGE_MARGIN_X + 18,
    y: ctx.y - 56,
    size: 24,
    font: fonts.heading,
    color: PINE
  });

  drawTextBlock(
    { ...ctx, y: ctx.y - 70 },
    `交付说明：${fallbackText(detail.project.deliveryNote, "暂无交付说明。")}`,
    {
      x: PAGE_MARGIN_X + 18,
      size: 10.5,
      lineHeight: 15,
      color: MUTED,
      maxWidth: CONTENT_WIDTH - 36
    }
  );

  drawTextBlock(
    { ...ctx, y: ctx.y - 86 },
    `备注：${fallbackText(detail.project.remark, "暂无备注。")}`,
    {
      x: PAGE_MARGIN_X + 18,
      size: 10.5,
      lineHeight: 15,
      color: MUTED,
      maxWidth: CONTENT_WIDTH - 36
    }
  );

  const pdfBytes = await doc.save();

  return {
    bytes: pdfBytes,
    fileName: buildFileName(detail),
    contentType: "application/pdf"
  };
}
