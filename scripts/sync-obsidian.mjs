import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const vault = path.resolve(process.env.OBSIDIAN_VAULT || "D:/Notes");
const destination = path.resolve("content/notes");
const publicRoots = ["0-InBox", "1-Projects", "2-Aeras", "3-Resources", "4-Archives"];
const privateRoots = ["5-Journals", "Journals"];
const assetExtensions = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".pdf"]);

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

const notes = [];
for (const root of publicRoots) {
  const fullPath = path.join(vault, root);
  try {
    for (const file of await walk(fullPath)) {
      if (file.endsWith(".md")) notes.push(file);
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

const titleToSlug = new Map(notes.map((file) => [path.basename(file, ".md").toLowerCase(), relativeFromVault(file).replace(/\.md$/i, "")]));
const manifest = [];
const assets = new Set();

await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });

for (const source of notes) {
  const relative = relativeFromVault(source);
  const content = await readFile(source, "utf8");
  const unsafePath = /(?:^|[\\/])(?:5-Journals|Journals)(?:[\\/#]|$)/i.test(content);
  const wikiTargets = [...content.matchAll(/!??\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/g)].map((match) => match[1].trim());
  const privateLink = wikiTargets.find((target) => privateNames.has(path.basename(target).toLowerCase()));
  if (unsafePath || privateLink) {
    throw new Error(`Refusing to publish ${relative}: it links to a private journal.`);
  }

  for (const match of content.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) {
    const rawTarget = decodeURIComponent(match[1].split(/\s+/)[0].replace(/^<|>$/g, ""));
    if (/^(?:https?:|data:|#)/i.test(rawTarget)) continue;
    const sourceAsset = path.resolve(path.dirname(source), rawTarget);
    if (!sourceAsset.startsWith(vault + path.sep) || !assetExtensions.has(path.extname(sourceAsset).toLowerCase())) continue;
    assets.add(sourceAsset);
  }

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

for (const source of assets) {
  const relative = relativeFromVault(source);
  const target = path.join(destination, "_assets", relative);
  await mkdir(path.dirname(target), { recursive: true });
  await cp(source, target);
}

await writeFile(path.join(destination, "manifest.json"), JSON.stringify({ notes: manifest, links: Object.fromEntries(titleToSlug) }, null, 2));
console.log(`Synced ${manifest.length} public notes and ${assets.size} referenced assets. Private journals were excluded.`);
