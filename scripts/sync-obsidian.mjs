import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const vault = path.resolve(process.env.OBSIDIAN_VAULT || "D:/Notes");
const destination = path.resolve("content/notes");
const assetDestination = path.resolve("public/notes-assets");
const publicRoots = ["兴趣生活", "大学学习"];
const privateRoots = ["日记", "5-Journals", "Journals"];
// 暂不发布的路径（相对仓库根，统一用 / 分隔）
const excludedPaths = [
  "大学学习/CANN挑战赛", // 挑战赛打卡暂不发布
  "大学学习/已结课/25-26春夏学期/大物24-25期末解答.md", // 期末解答不公开
  "大学学习/已结课/25-26春夏学期/离散数学25期末解答.md",
];
// 注意：PDF 永不上传，保持不在此列表中
const assetExtensions = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"]);
const skipDirectories = new Set([".git", ".obsidian", ".agents", ".trash", "node_modules"]);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(fullPath));
    else files.push(fullPath);
  }
  return files;
}

function relativeFromVault(file) {
  return path.relative(vault, file).split(path.sep).join("/");
}

// 附件目录不进入网址，保持链接简短
function assetRelative(file) {
  return relativeFromVault(file).replace(/^附件\//, "");
}

function assetUrl(file) {
  return "/notes-assets/" + assetRelative(file).split("/").map(encodeURIComponent).join("/");
}

function redactForPublication(markdown) {
  const hidden = "[本地路径已隐藏]";
  return markdown
    .replace(/`(?:file:\/{2,3}|[A-Za-z]:\\|\\\\)[^`\r\n]+`/gi, hidden)
    .replace(/file:\/{2,3}[^\s)>]+/gi, hidden)
    .replace(/\\\\[^\\\s]+\\[^\s`)>]+/g, hidden)
    .replace(/(?<![A-Za-z0-9])[A-Za-z]:\\(?:[\p{L}\p{N}._-]+\\)*[\p{L}\p{N}._-]*/gu, hidden)
    .replace(/\b(?:localhost|127\.0\.0\.1|::1)(?::\d{1,5})?\b/gi, hidden)
    .replace(/\b(?:10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)\d{1,3}\.\d{1,3}(?::\d{1,5})?\b/g, hidden);
}

// Obsidian 按文件名解析附件，这里建立全仓索引
async function buildAssetIndex() {
  const index = new Map();
  const stack = [vault];
  while (stack.length) {
    const directory = stack.pop();
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!skipDirectories.has(entry.name)) stack.push(fullPath);
      } else if (assetExtensions.has(path.extname(entry.name).toLowerCase())) {
        const key = entry.name.toLowerCase();
        if (!index.has(key)) index.set(key, []);
        index.get(key).push(fullPath);
      }
    }
  }
  return index;
}

const assetIndex = await buildAssetIndex();
const ambiguous = new Set();

function resolveAsset(name, noteSource) {
  const candidates = assetIndex.get(path.basename(name).toLowerCase()) ?? [];
  if (candidates.length === 0) return null;
  if (candidates.length > 1) ambiguous.add(name);
  const noteDirectory = path.dirname(noteSource);
  const sameDirectory = candidates.find((candidate) => path.dirname(candidate) === noteDirectory);
  if (sameDirectory) return sameDirectory;
  // 优先级：笔记所在课程目录 → 第一个命中
  const course = path.basename(noteDirectory);
  const sameCourse = candidates.find((candidate) => candidate.includes(path.sep + course + path.sep));
  return sameCourse ?? candidates[0];
}

const privateFiles = [];
for (const root of privateRoots) {
  const fullPath = path.join(vault, root);
  try {
    privateFiles.push(...(await walk(fullPath)).filter((file) => file.endsWith(".md")));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
const privateNames = new Set(privateFiles.map((file) => path.basename(file, ".md").toLowerCase()));

const isExcluded = (file) => {
  const relative = relativeFromVault(file);
  return excludedPaths.some((excluded) => relative === excluded || relative.startsWith(excluded + "/"));
};

const notes = [];
for (const root of publicRoots) {
  const fullPath = path.join(vault, root);
  try {
    for (const file of await walk(fullPath)) {
      if (file.endsWith(".md") && !isExcluded(file)) notes.push(file);
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

const titleToSlug = new Map(notes.map((file) => [path.basename(file, ".md").toLowerCase(), relativeFromVault(file).replace(/\.md$/i, "")]));
const manifest = [];
const assetSources = new Map(); // 源文件绝对路径 -> 站点地址
const missingEmbeds = [];

await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
await rm(assetDestination, { recursive: true, force: true });
await mkdir(assetDestination, { recursive: true });

for (const source of notes) {
  const relative = relativeFromVault(source);
  let content = await readFile(source, "utf8");
  const unsafePath = /(?:^|[\\/])(?:5-Journals|Journals|日记)(?:[\\/#]|$)/i.test(content);
  const wikiTargets = [...content.matchAll(/!??\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/g)].map((match) => match[1].trim());
  const privateLink = wikiTargets.find((target) => privateNames.has(path.basename(target).toLowerCase()));
  if (unsafePath || privateLink) {
    throw new Error(`Refusing to publish ${relative}: it links to a private journal.`);
  }

  // Obsidian 嵌入：![[图片.png]] / ![[图片.png|240]]
  for (const match of content.matchAll(/!\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/g)) {
    const name = match[1].trim();
    if (!assetExtensions.has(path.extname(name).toLowerCase())) continue; // PDF 等一律忽略
    const assetSource = resolveAsset(name, source);
    if (!assetSource) {
      missingEmbeds.push(`${relative} -> ${name}`);
      continue;
    }
    assetSources.set(assetSource, assetUrl(assetSource));
  }

  // 标准 Markdown 图片：把相对路径改写为站点地址
  content = content.replace(/(!\[[^\]]*\]\()([^)]+)(\))/g, (whole, head, target, tail) => {
    const rawTarget = decodeURIComponent(target.split(/\s+/)[0].replace(/^<|>$/g, ""));
    if (/^(?:https?:|data:|#)/i.test(rawTarget)) return whole;
    const assetSource = path.resolve(path.dirname(source), rawTarget);
    if (!assetSource.startsWith(vault + path.sep) || !assetExtensions.has(path.extname(assetSource).toLowerCase())) return whole;
    assetSources.set(assetSource, assetUrl(assetSource));
    return `${head}${assetUrl(assetSource)}${tail}`;
  });

  const target = path.join(destination, relative);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, redactForPublication(content), "utf8");
  const info = await stat(source);
  manifest.push({
    slug: relative.replace(/\.md$/i, ""),
    title: path.basename(source, ".md"),
    section: relative.split("/")[0],
    updatedAt: info.mtime.toISOString(),
  });
}

const assetMap = {};
for (const [assetSource, url] of assetSources) {
  const target = path.join(assetDestination, assetRelative(assetSource));
  await mkdir(path.dirname(target), { recursive: true });
  await cp(assetSource, target);
  assetMap[path.basename(assetSource).toLowerCase()] = url;
}

await writeFile(path.join(destination, "manifest.json"), JSON.stringify({ notes: manifest, links: Object.fromEntries(titleToSlug), assets: assetMap }, null, 2));

// 首页「近期思考」数据：每个分组取最新一篇（跳过总览目录页），按时间倒序取前 4
const latestByGroup = new Map();
for (const note of manifest) {
  if (note.title.includes("总览")) continue;
  const directory = note.slug.split("/").slice(0, -1).join("/");
  const current = latestByGroup.get(directory);
  if (!current || note.updatedAt > current.updatedAt) latestByGroup.set(directory, note);
}
const recentPosts = [...latestByGroup.values()]
  .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  .slice(0, 4)
  .map((note) => ({
    title: note.title,
    slug: note.slug,
    date: note.updatedAt.slice(0, 7).replace("-", "."),
    path: note.slug.split("/").slice(0, -1).join(" / "),
  }));
await writeFile(
  path.resolve("app/posts.generated.ts"),
  `// This file is generated by scripts/sync-obsidian.mjs.\nexport const recentPosts = ${JSON.stringify(recentPosts, null, 2)} as const;\n`,
  "utf8"
);

console.log(`Synced ${manifest.length} public notes and ${assetSources.size} referenced assets. Private journals were excluded.`);
if (ambiguous.size) console.warn(`Warning: ${ambiguous.size} asset name(s) exist in multiple folders: ${[...ambiguous].join(", ")}`);
if (missingEmbeds.length) console.warn(`Warning: ${missingEmbeds.length} embedded asset(s) not found:\n  ${missingEmbeds.join("\n  ")}`);
