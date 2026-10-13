import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";
import markedKatex from "marked-katex-extension";
import sanitizeHtml from "sanitize-html";

const contentRoot = path.join(process.cwd(), "content", "notes");
marked.use(markedKatex({ throwOnError: false, strict: "ignore", nonStandard: true }));

export type NoteSummary = { slug: string; title: string; section: string; updatedAt: string };
type Manifest = { notes: NoteSummary[]; links: Record<string, string>; assets?: Record<string, string> };

function escapeHtmlAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ![[图.png|240]] → <img>；未同步成功的资源退化成文字，避免出现断图
function renderEmbeds(markdown: string, assets: Record<string, string>) {
  return markdown.replace(/!\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]*))?\]\]/g, (whole, target, label) => {
    const name = String(target).trim();
    const url = assets[path.basename(name).toLowerCase()];
    const size = /^(\d+)(?:x(\d+))?$/.exec(String(label ?? "").trim());
    if (!url) return size || !label ? name : String(label);
    const width = size ? ` width="${size[1]}"` : "";
    const height = size?.[2] ? ` height="${size[2]}"` : "";
    const alt = size || !label ? path.basename(name) : String(label);
    return `<img src="${url}" alt="${escapeHtmlAttribute(alt)}"${width}${height} loading="lazy" />`;
  });
}

function normalizeMathDelimiters(markdown: string) {
  return markdown.split(/(```[\s\S]*?```|`[^`\r\n]*`)/g).map((part, index) => {
    if (index % 2 === 1) return part;
    return part
      .replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, (_, formula: string) => `\n$$\n${formula.trim()}\n$$\n`)
      .replace(/\\\(([\s\S]*?)\\\)/g, (_, formula: string) => `$${formula}$`)
      .replace(/\$\$\s*([\s\S]*?)\s*\$\$/g, (_, formula: string) => `\n$$\n${formula.trim()}\n$$\n`);
  }).join("");
}

function manifest(): Manifest {
  return JSON.parse(fs.readFileSync(path.join(contentRoot, "manifest.json"), "utf8"));
}

export function getNotes(): NoteSummary[] {
  return manifest().notes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getNote(slugParts: string[]) {
  const slug = slugParts.map((part) => decodeURIComponent(part)).join("/").normalize("NFC");
  const data = manifest();
  const note = data.notes.find((item) => item.slug === slug);
  if (!note || /(?:^|\/)(?:5-Journals|日记)(?:\/|$)/i.test(slug)) return null;
  const file = path.resolve(contentRoot, `${slug}.md`);
  if (!file.startsWith(contentRoot + path.sep)) return null;
  let markdown = fs.readFileSync(file, "utf8");
  markdown = markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
  markdown = renderEmbeds(markdown, data.assets ?? {});
  markdown = markdown.replace(/\[\[([^\]|#]+)(#[^\]|]*)?(?:\|([^\]]+))?\]\]/g, (_, target, heading = "", label) => {
    const linkedSlug = data.links[String(target).trim().toLowerCase()];
    const text = label || String(target).split("/").pop();
    if (!linkedSlug) return text;
    const encodedSlug = linkedSlug.split("/").map(encodeURIComponent).join("/");
    const anchor = heading ? `#${encodeURIComponent(String(heading).slice(1))}` : "";
    return `[${text}](/notes/${encodedSlug}/${anchor})`;
  });
  markdown = markdown.replace(/^> \[!(\w+)\][+-]?\s*(.*)$/gm, "> **$2**");
  markdown = normalizeMathDelimiters(markdown);
  const rendered = marked.parse(markdown, { gfm: true, breaks: false }) as string;
  const html = sanitizeHtml(rendered, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "img", "details", "summary", "span", "math", "semantics", "annotation", "mrow", "mi", "mo", "mn",
      "mtext", "mspace", "msup", "msub", "msubsup", "mfrac", "msqrt", "mroot", "mtable", "mtr", "mtd",
      "mover", "munder", "munderover", "mpadded", "mphantom", "svg", "path",
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ["src", "alt", "title", "loading", "width", "height"],
      span: ["class", "style", "aria-hidden"],
      math: ["xmlns"],
      annotation: ["encoding"],
      svg: ["xmlns", "width", "height", "viewBox", "preserveAspectRatio"],
      path: ["d"],
    },
    allowedSchemes: ["http", "https", "mailto"],
  });
  return { ...note, html };
}
