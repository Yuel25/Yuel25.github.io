import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";
import markedKatex from "marked-katex-extension";
import sanitizeHtml from "sanitize-html";

const contentRoot = path.join(process.cwd(), "content", "notes");
marked.use(markedKatex({ throwOnError: false, strict: "ignore" }));

export type NoteSummary = { slug: string; title: string; section: string; updatedAt: string };
type Manifest = { notes: NoteSummary[]; links: Record<string, string> };

function normalizeMathDelimiters(markdown: string) {
  return markdown.split(/(```[\s\S]*?```|`[^`\r\n]*`)/g).map((part, index) => {
    if (index % 2 === 1) return part;
    return part
      .replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, "\n$$\n$1\n$$\n")
      .replace(/\\\(([\s\S]*?)\\\)/g, (_, formula: string) => `$${formula}$`)
      .replace(/\$\$\s*([\s\S]*?)\s*\$\$/g, "\n$$\n$1\n$$\n");
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
  if (!note || /(?:^|\/)5-Journals(?:\/|$)/i.test(slug)) return null;
  const file = path.resolve(contentRoot, `${slug}.md`);
  if (!file.startsWith(contentRoot + path.sep)) return null;
  let markdown = fs.readFileSync(file, "utf8");
  markdown = markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
  markdown = markdown.replace(/!??\[\[([^\]|#]+)(#[^\]|]*)?(?:\|([^\]]+))?\]\]/g, (_, target, heading = "", label) => {
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
      "mover", "munder", "munderover", "mpadded", "mphantom",
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ["src", "alt", "title", "loading"],
      span: ["class", "style", "aria-hidden"],
      math: ["xmlns"],
      annotation: ["encoding"],
    },
    allowedSchemes: ["http", "https", "mailto"],
  });
  return { ...note, html };
}
