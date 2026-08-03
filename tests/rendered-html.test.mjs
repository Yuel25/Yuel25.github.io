import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const output = path.join(root, "out");
const content = path.join(root, "content", "notes");

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

test("exports every public note without private journal content", async () => {
  const { notes } = JSON.parse(await readFile(path.join(content, "manifest.json"), "utf8"));
  assert.equal(notes.length, 12);
  assert.ok(notes.every((note) => !/(?:^|\/)5?-?Journals(?:\/|$)/i.test(note.slug)));

  const contentFiles = await walk(content);
  const privateMarkers = /5-Journals|(?:^|[\\/])Journals(?:[\\/]|$)/i;
  const localEnvironmentMarkers = /(?:file:\/{2,3}|(?<![A-Za-z0-9])[A-Za-z]:\\(?=[\p{L}\p{N}._-])|\\\\[^\\\s]+\\|\b(?:localhost|127\.0\.0\.1|::1)\b|\b(?:10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)\d{1,3}\.\d{1,3})/iu;
  for (const file of contentFiles) {
    const published = await readFile(file, "utf8");
    assert.doesNotMatch(published, privateMarkers, path.relative(root, file));
    assert.doesNotMatch(published, localEnvironmentMarkers, path.relative(root, file));
  }

  for (const note of notes) {
    assert.ok(existsSync(path.join(output, "notes", note.slug, "index.html")), note.slug);
  }
});

test("redacts local environment details from rendered pages", async () => {
  const overview = await readFile(path.join(output, "notes", "3-Resources", "课程复习", "25-26春夏学期", "课程复习总览", "index.html"), "utf8");
  const body = overview.match(/<div class="markdown-body">([\s\S]*?)<\/div><\/article>/)?.[1] ?? "";
  assert.match(body, /本地路径已隐藏/);
  assert.doesNotMatch(body, /(?:file:\/{2,3}|[A-Za-z]:\\|localhost|127\.0\.0\.1)/i);
});

test("renders Obsidian links and mathematics as HTML", async () => {
  const overview = await readFile(path.join(output, "notes", "3-Resources", "课程复习", "25-26春夏学期", "课程复习总览", "index.html"), "utf8");
  const overviewBody = overview.match(/<div class="markdown-body">([\s\S]*?)<\/div><\/article>/)?.[1] ?? "";
  assert.ok(overviewBody);
  assert.doesNotMatch(overviewBody, /\[\[[^\]]+\]\]/);
  assert.doesNotMatch(overviewBody, /<li>\[[^<]+\]\(\/notes\//);
  assert.match(overviewBody, /href="\/notes\/3-Resources\/%E8%AF%BE%E7%A8%8B%E5%A4%8D%E4%B9%A0\//);

  const physics = await readFile(path.join(output, "notes", "3-Resources", "课程复习", "25-26春夏学期", "大物24-25期末解答", "index.html"), "utf8");
  const physicsBody = physics.match(/<div class="markdown-body">([\s\S]*?)<\/div><\/article>/)?.[1] ?? "";
  assert.ok(physicsBody);
  assert.match(physicsBody, /class="katex(?:-display)?"/);
  assert.match(physicsBody, /<annotation encoding="application\/x-tex">M_0=2\\gamma m_0<\/annotation>/);
  assert.doesNotMatch(physicsBody, /\\\(|\\\)|\\\[|\\\]/);
  assert.doesNotMatch(physicsBody, /<p>\$\$/);
});

test("all exported internal links resolve to static files", async () => {
  const htmlFiles = (await walk(output)).filter((file) => file.endsWith(".html") && path.basename(file) !== "404.html");
  const missing = [];
  for (const file of htmlFiles) {
    const html = await readFile(file, "utf8");
    for (const match of html.matchAll(/href="([^"]+)"/g)) {
      const href = match[1];
      if (!href.startsWith("/") || href.startsWith("/_next/")) continue;
      const pathname = decodeURIComponent(href.split(/[?#]/)[0]);
      if (pathname === "/") continue;
      const target = path.join(output, pathname.replace(/^\//, ""));
      if (![target, path.join(target, "index.html"), `${target}.html`].some(existsSync)) {
        missing.push(`${path.relative(output, file)} -> ${href}`);
      }
    }
  }
  assert.deepEqual(missing, []);
});

test("homepage featured notes link to real exported notes", async () => {
  const homepage = await readFile(path.join(output, "index.html"), "utf8");
  const featured = [...homepage.matchAll(/<a class="post" href="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(featured.length, 3);
  for (const href of featured) {
    const target = path.join(output, decodeURIComponent(href).replace(/^\//, ""), "index.html");
    assert.ok(existsSync(target), href);
  }
});
