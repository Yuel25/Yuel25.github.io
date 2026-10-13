"use client";

import { useEffect, useState } from "react";
import type { TocItem } from "@/lib/notes";

// 右侧吸顶目录：滚动时高亮当前所在小节
export default function NoteToc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => element !== null);
    if (!headings.length) return;
    const onScroll = () => {
      let current = headings[0].id;
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top <= 120) current = heading.id;
        else break;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [items]);

  return (
    <nav className="toc-rail" aria-label="本页目录">
      <p className="toc-title">目录</p>
      <ul>
        {items.map((item) => (
          <li key={item.id} className={`toc-l${item.level}`}>
            <a
              href={`#${item.id}`}
              aria-current={active === item.id ? "true" : undefined}
              onClick={() => setActive(item.id)}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
