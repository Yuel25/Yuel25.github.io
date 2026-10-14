import fs from "node:fs";
import path from "node:path";
import hljs from "highlight.js";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import markedKatex from "marked-katex-extension";
import sanitizeHtml from "sanitize-html";

const contentRoot = path.join(process.cwd(), "content", "notes");
marked.use(markedKatex({ throwOnError: false, strict: "ignore", nonStandard: true }));
marked.use(markedHighlight({
  langPrefix: "hljs language-",
  highlight(code, language) {
    if (language && hljs.getLanguage(language)) return hljs.highlight(code, { language }).value;
    return hljs.highlightAuto(code).value;
  },
}));

export type NoteSummary = { slug: string; title: string; section: string; updatedAt: string };
export type TocItem = { id: string; text: string; level: number };
export type NoteGroup = { key: string; name: string; parentPath: string[]; notes: NoteSummary[] };
export type NoteSection = { name: string; groups: NoteGroup[]; total: number };
type Manifest = { notes: NoteSummary[]; links: Record<string, string>; assets?: Record<string, string> };

const sectionOrder = ["大学学习", "兴趣生活"];

function unescapeHtml(value: string) {
  return value.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
}

// 给 h2/h3 注入锚点 id，同时提取目录；KaTeX 注解决不进入目录文字
function addHeadingIdsAndToc(html: string) {
  const toc: TocItem[] = [];
  let index = 0;
  const withIds = html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (whole, level, inner) => {
    const text = unescapeHtml(
      String(inner).replace(/<annotation[\s\S]*?<\/annotation>/g, "").replace(/<[^>]+>/g, "")
    ).trim();
    if (!text) return whole;
    const id = `sec-${index++}`;
    toc.push({ id, text, level: Number(level) });
    return `<h${level} id="${id}">${inner}</h${level}>`;
  });
  return { html: withIds, toc };
}

// 组内排序：课程总览置顶，编号章节按标题升序，其余按更新时间倒序
function sortGroupNotes(list: NoteSummary[]) {
  return [...list].sort((a, b) => {
    const overviewA = a.title.includes("总览") ? 0 : 1;
    const overviewB = b.title.includes("总览") ? 0 : 1;
    if (overviewA !== overviewB) return overviewA - overviewB;
    const numberedA = /^\d{2}\s/.test(a.title);
    const numberedB = /^\d{2}\s/.test(b.title);
    if (numberedA && numberedB) return a.title.localeCompare(b.title, "zh-Hans-CN");
    if (numberedA !== numberedB) return numberedA ? -1 : 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

// 按目录路径把笔记分组：section（大学学习）→ group（进行中/26-27秋冬学期/ADS）
export function getNoteGroups(): NoteSection[] {
  const bySection = new Map<string, Map<string, NoteSummary[]>>();
  for (const note of getNotes()) {
    const parts = note.slug.split("/");
    const section = parts[0];
    const directory = parts.slice(0, -1).join("/");
    if (!bySection.has(section)) bySection.set(section, new Map());
    const groups = bySection.get(section)!;
    if (!groups.has(directory)) groups.set(directory, []);
    groups.get(directory)!.push(note);
  }
  const sections = [...bySection.entries()].map(([name, groups]) => {
    const list = [...groups.entries()].map(([key, groupNotes]) => {
      const parts = key.split("/").slice(1);
      return { key, name: parts[parts.length - 1], parentPath: parts.slice(0, -1), notes: sortGroupNotes(groupNotes) };
    }).sort((a, b) => (b.notes[0]?.updatedAt ?? "").localeCompare(a.notes[0]?.updatedAt ?? ""));
    return { name, groups: list, total: list.reduce((sum, group) => sum + group.notes.length, 0) };
  });
  sections.sort((a, b) => {
    const orderA = sectionOrder.indexOf(a.name);
    const orderB = sectionOrder.indexOf(b.name);
    return (orderA === -1 ? 99 : orderA) - (orderB === -1 ? 99 : orderB);
  });
  return sections;
}

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
      code: ["class"],
      span: ["class", "style", "aria-hidden"],
      math: ["xmlns"],
      annotation: ["encoding"],
      svg: ["xmlns", "width", "height", "viewBox", "preserveAspectRatio"],
      path: ["d"],
    },
    allowedSchemes: ["http", "https", "mailto"],
  });
  const { html: withIds, toc } = addHeadingIdsAndToc(html);
  return { ...note, html: withIds, toc };
}
