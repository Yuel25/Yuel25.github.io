import Link from "next/link";
import { getNotes } from "@/lib/notes";

export const metadata = { title: "公开笔记 · Yuel25", description: "Yuel 的公开 Obsidian 笔记" };

export default function NotesPage() {
  const notes = getNotes();
  return <main className="notes-shell">
    <header className="notes-header"><Link className="brand" href="/">Yuel<span>25</span></Link><Link className="notes-action" href="/">返回首页</Link></header>
    <section className="notes-hero"><p className="eyebrow">DIGITAL GARDEN</p><h1>公开笔记</h1><p>从我的 Obsidian 数字花园同步而来。日记与私人内容不在此处发布。</p></section>
    <section className="notes-grid">{notes.map((note) => <Link className="note-card" href={`/notes/${note.slug}/`} key={note.slug}>
      <span>{note.section.replace(/^\d+-/, "")}</span><h2>{note.title}</h2><time>{new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" }).format(new Date(note.updatedAt))}</time>
    </Link>)}</section>
  </main>;
}
