import Link from "next/link";
import { notFound } from "next/navigation";
import { getNote, getNotes } from "@/lib/notes";

export function generateStaticParams() {
  return getNotes().map((note) => ({ slug: note.slug.split("/") }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }) {
  const note = getNote((await params).slug);
  return note ? { title: `${note.title} · Yuel25` } : {};
}

export default async function NotePage({ params }: { params: Promise<{ slug: string[] }> }) {
  const note = getNote((await params).slug);
  if (!note) notFound();
  return <main className="article-shell">
    <header className="notes-header"><Link className="brand" href="/">Yuel<span>25</span></Link><Link href="/notes/">全部笔记</Link></header>
    <article><p className="eyebrow">{note.section.replace(/^\d+-/, "")}</p><h1>{note.title}</h1><time>更新于 {new Intl.DateTimeFormat("zh-CN", { dateStyle: "long" }).format(new Date(note.updatedAt))}</time><div className="markdown-body" dangerouslySetInnerHTML={{ __html: note.html }} /></article>
  </main>;
}
