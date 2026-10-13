import Link from "next/link";
import { notFound } from "next/navigation";
import { getNote, getNotes } from "@/lib/notes";
import NoteToc from "../toc";

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
  const parts = note.slug.split("/");
  const directory = parts.slice(0, -1).join("/");
  const crumbs = parts.slice(0, -1);
  return <main className="article-shell">
    <header className="notes-header">
      <Link className="brand" href="/">Yuel<span>25</span></Link>
      <nav className="notes-actions" aria-label="笔记导航">
        <Link className="notes-action" href="/">返回首页</Link>
        <Link className="notes-action" href="/notes/">全部笔记</Link>
      </nav>
    </header>
    <div className="article-layout">
      <article>
        <nav className="article-breadcrumb" aria-label="笔记位置">
          <Link href="/notes/">笔记</Link>
          {crumbs.map((part, index) => (
            <span key={index}><i>/</i>{index === crumbs.length - 1
              ? <Link href={`/notes/#dir-${directory}`}>{part}</Link>
              : part}</span>
          ))}
        </nav>
        <h1>{note.title}</h1>
        <time>更新于 {new Intl.DateTimeFormat("zh-CN", { dateStyle: "long" }).format(new Date(note.updatedAt))}</time>
        {note.toc.length > 1 && (
          <details className="toc-inline">
            <summary>目录 · {note.toc.length} 节</summary>
            <ul>
              {note.toc.map((item) => (
                <li key={item.id} className={`toc-l${item.level}`}><a href={`#${item.id}`}>{item.text}</a></li>
              ))}
            </ul>
          </details>
        )}
        <div className="markdown-body" dangerouslySetInnerHTML={{ __html: note.html }} />
      </article>
      {note.toc.length > 1 && <aside className="article-toc-rail"><NoteToc items={note.toc} /></aside>}
    </div>
  </main>;
}
