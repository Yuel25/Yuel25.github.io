import Link from "next/link";
import { getNoteGroups } from "@/lib/notes";

export const metadata = { title: "公开笔记 · Yuel25", description: "Yuel 的公开 Obsidian 笔记" };

export default function NotesPage() {
  const sections = getNoteGroups();
  const total = sections.reduce((sum, section) => sum + section.total, 0);
  return <main className="notes-shell">
    <header className="notes-header"><Link className="brand" href="/">Yuel<span>25</span></Link><Link className="notes-action" href="/">返回首页</Link></header>
    <section className="notes-hero">
      <p className="eyebrow">DIGITAL GARDEN</p><h1>公开笔记</h1>
      <p>从我的 Obsidian 数字花园同步而来，按目录分级整理，共 {total} 篇。日记与私人内容不在此处发布。</p>
      <nav className="notes-jump" aria-label="跳转到分组">
        {sections.flatMap((section) => section.groups.map((group) => (
          <a key={group.key} href={`#dir-${group.key}`}>{group.name}<i>{group.notes.length}</i></a>
        )))}
      </nav>
    </section>
    <div className="notes-sections">
      {sections.map((section) => (
        <section className="notes-section" key={section.name}>
          <h2 className="notes-section-title">{section.name}<span>{section.total} 篇</span></h2>
          {section.groups.map((group) => (
            <details className="notes-group" id={`dir-${group.key}`} key={group.key} open>
              <summary>
                <span className="notes-group-heading">
                  {group.parentPath.length > 0 && <small>{group.parentPath.join(" / ")}</small>}
                  <strong>{group.name}</strong>
                </span>
                <span className="notes-group-meta">{group.notes.length} 篇<i className="notes-group-caret" aria-hidden="true" /></span>
              </summary>
              <div className="notes-grid">
                {group.notes.map((note) => <Link className="note-card" href={`/notes/${note.slug}/`} key={note.slug}>
                  <h2>{note.title}</h2>
                  <time>{new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" }).format(new Date(note.updatedAt))}</time>
                </Link>)}
              </div>
            </details>
          ))}
        </section>
      ))}
    </div>
  </main>;
}
