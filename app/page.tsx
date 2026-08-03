"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { galleryImages } from "./gallery.generated";

const copy = {
  zh: {
    nav: ["关于", "作品", "文章", "联系"],
    hello: "你好，我是 Yuel。",
    intro: "我在代码、设计与文字之间，创造安静而有温度的数字体验。",
    location: "中国 · 在互联网的一隅",
    explore: "看看今日画选",
    github: "访问 GitHub",
    aboutEyebrow: "01 / 关于",
    aboutTitle: "Petals linger about,awaiting one last dance",
    aboutBody: "这里是我的个人主页，也是我收集灵感、记录成长的数字庭院。我喜欢把复杂的问题梳理清楚，再用简单、自然的方式呈现出来。",
    workEyebrow: "02 / 每日画选",
    workTitle: "今日的三束光",
    workBody: "从我的私人收藏中，每天抽取三幅画面。明天零点，它们会悄悄换一组。",
    daily: "每日 00:00 更新",
    collection: "私人收藏",
    openArtwork: "查看完整画面",
    closeArtwork: "关闭画面",
    writingEyebrow: "03 / 文章",
    writingTitle: "一些近期思考",
    posts: [
      ["2026 七月看番计划", "2026.07", "七月新番的个人观看清单与记录。", "/notes/2-Aeras/动漫/2026七月看番计划/"],
      ["2026 四月看番计划", "2026.07", "四月新番的个人观看清单与记录。", "/notes/2-Aeras/动漫/2026四月看番计划/"],
      ["OI-ICPC 算法模板", "2026.07", "算法竞赛常用数据结构与算法模板汇总。", "/notes/3-Resources/算法竞赛/OI-ICPC算法模板/"],
    ],
    soon: "阅读笔记 →",
    contactEyebrow: "04 / 联系",
    contactTitle: "有好点子？一起聊聊。",
    contactBody: "如果你对我的作品感兴趣，或想一起创造些什么，欢迎通过 GitHub 联系我。",
    contactButton: "在 GitHub 找到我",
    footer: "认真生活，自由创造。",
  },
  en: {
    nav: ["About", "Gallery", "Writing", "Contact"],
    hello: "Hi, I’m Yuel.",
    intro: "I create quiet, thoughtful digital experiences at the intersection of code, design, and words.",
    location: "China · A small corner of the web",
    explore: "See today’s selection",
    github: "Visit GitHub",
    aboutEyebrow: "01 / ABOUT",
    aboutTitle: "Petals linger about,awaiting one last dance",
    aboutBody: "This is my personal home and a digital garden for ideas, inspiration, and growth. I enjoy making sense of complex problems, then presenting them in ways that feel simple and natural.",
    workEyebrow: "02 / DAILY GALLERY",
    workTitle: "Three quiet sparks, today",
    workBody: "Three images are drawn from my private collection each day. At midnight, a new set quietly takes their place.",
    daily: "Refreshes daily at 00:00",
    collection: "Private collection",
    openArtwork: "View full artwork",
    closeArtwork: "Close artwork",
    writingEyebrow: "03 / WRITING",
    writingTitle: "Recent thoughts",
    posts: [
      ["July 2026 Anime List", "2026.07", "My personal watch list and notes for the July season.", "/notes/2-Aeras/动漫/2026七月看番计划/"],
      ["April 2026 Anime List", "2026.07", "My personal watch list and notes for the April season.", "/notes/2-Aeras/动漫/2026四月看番计划/"],
      ["OI-ICPC Algorithm Templates", "2026.07", "A collection of common competitive-programming templates.", "/notes/3-Resources/算法竞赛/OI-ICPC算法模板/"],
    ],
    soon: "Read note →",
    contactEyebrow: "04 / CONTACT",
    contactTitle: "Have an idea? Let’s talk.",
    contactBody: "If my work resonates with you, or you’d like to make something together, come say hello on GitHub.",
    contactButton: "Find me on GitHub",
    footer: "Live thoughtfully. Create freely.",
  },
} as const;

function getShanghaiDateKey() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function getDailySelection(dateKey: string) {
  let seed = [...dateKey].reduce((value, character) => (value * 31 + character.charCodeAt(0)) >>> 0, 2166136261);
  const indexes = galleryImages.map((_, index) => index);

  for (let index = indexes.length - 1; index > 0; index -= 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const swapIndex = seed % (index + 1);
    [indexes[index], indexes[swapIndex]] = [indexes[swapIndex], indexes[index]];
  }

  return indexes.slice(0, 3);
}

function formatGalleryDate(dateKey: string, language: "zh" | "en") {
  if (!dateKey) return "···· · ··";
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: language === "zh" ? "2-digit" : "short",
    day: "2-digit",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export default function Home() {
  const [language, setLanguage] = useState<"zh" | "en">("zh");
  const [dailyIndexes, setDailyIndexes] = useState([0, 1, 2]);
  const [dailyDate, setDailyDate] = useState("");
  const [activeArtwork, setActiveArtwork] = useState<string | null>(null);
  const t = copy[language];

  useEffect(() => {
    const dateKey = getShanghaiDateKey();
    setDailyDate(dateKey);
    setDailyIndexes(getDailySelection(dateKey));
  }, []);

  useEffect(() => {
    if (!activeArtwork) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveArtwork(null);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [activeArtwork]);

  return (
    <main>
      <header className="nav-shell">
        <a className="brand" href="#top" aria-label="Yuel home">Yuel<span>25</span></a>
        <nav aria-label="Main navigation">
          {t.nav.map((item, index) => <a key={item} href={`#${["about", "work", "writing", "contact"][index]}`}>{item}</a>)}
        </nav>
        <button className="language" onClick={() => setLanguage(language === "zh" ? "en" : "zh")} aria-label="Switch language">
          <span className={language === "zh" ? "active" : ""}>中</span><i>/</i><span className={language === "en" ? "active" : ""}>EN</span>
        </button>
      </header>

      <section className="hero" id="top">
        <div className="sun" aria-hidden="true" />
        <div className="hero-copy">
          <p className="kicker">WELCOME TO MY LITTLE CORNER</p>
          <h1>{t.hello}</h1>
          <p className="intro">{t.intro}</p>
          <p className="location"><span>⌖</span>{t.location}</p>
          <div className="actions">
            <a className="button primary" href="#work">{t.explore}<span>↓</span></a>
            <a className="button secondary" href="https://github.com/Yuel25" target="_blank" rel="noreferrer">{t.github}<span>↗</span></a>
          </div>
        </div>
        <div className="vertical-note" aria-hidden="true">余白 · 好奇心 · ものづくり</div>
        <div className="scroll-cue" aria-hidden="true">SCROLL <span /></div>
      </section>

      <section className="section about" id="about">
        <div><p className="eyebrow">{t.aboutEyebrow}</p><h2>{t.aboutTitle}</h2></div>
        <div className="about-copy">
          <div className="avatar-frame">
            <Image className="about-avatar" src="/avatar.png" alt={language === "zh" ? "Yuel 的头像" : "Portrait of Yuel"} width={260} height={260} priority />
          </div>
          <p>{t.aboutBody}</p>
        </div>
      </section>

      <section className="section work" id="work">
        <div className="work-heading">
          <div>
            <p className="eyebrow">{t.workEyebrow}</p>
            <h2>{t.workTitle}</h2>
            <p className="work-body">{t.workBody}</p>
          </div>
          <div className="gallery-meta" aria-label={t.daily}>
            <span>{formatGalleryDate(dailyDate, language)}</span>
            <i />
            <span>{t.daily}</span>
            <small>03 / {String(galleryImages.length).padStart(2, "0")}</small>
          </div>
        </div>

        <div className="daily-gallery">
          {dailyIndexes.map((artworkIndex, index) => {
            const artwork = galleryImages[artworkIndex];
            return (
              <button
                className="gallery-card"
                key={artwork}
                onClick={() => setActiveArtwork(artwork)}
                aria-label={`${t.openArtwork} ${index + 1}`}
              >
                <Image className="gallery-image" src={artwork} alt="" fill sizes={index === 0 ? "(max-width: 800px) 100vw, 62vw" : "(max-width: 800px) 100vw, 32vw"} />
                <span className="gallery-wash" />
                <span className="gallery-number">0{index + 1}</span>
                <span className="gallery-caption"><small>{t.collection}</small>{t.openArtwork}<i>↗</i></span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="section writing" id="writing">
        <p className="eyebrow">{t.writingEyebrow}</p><h2>{t.writingTitle}</h2>
        <div className="post-list">{t.posts.map((post, index) => <Link className="post" href={post[3]} key={post[0]}><span className="post-number">0{index + 1}</span><div><h3>{post[0]}</h3><p>{post[2]}</p></div><time>{post[1]}</time><span className="post-status">{t.soon}</span></Link>)}</div>
        <Link className="button secondary notes-link" href="/notes/">{language === "zh" ? "浏览公开笔记" : "Browse public notes"}<span>→</span></Link>
      </section>

      <section className="contact" id="contact"><p className="eyebrow">{t.contactEyebrow}</p><h2>{t.contactTitle}</h2><p>{t.contactBody}</p><a className="button primary" href="https://github.com/Yuel25" target="_blank" rel="noreferrer">{t.contactButton}<span>↗</span></a></section>
      <footer><a className="brand" href="#top">Yuel<span>25</span></a><p>{t.footer}</p><p>© 2026 Yuel</p></footer>

      {activeArtwork && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={t.openArtwork} onClick={() => setActiveArtwork(null)}>
          <button className="lightbox-close" onClick={() => setActiveArtwork(null)} aria-label={t.closeArtwork}>×</button>
          <div className="lightbox-stage" onClick={(event) => event.stopPropagation()}>
            <Image className="lightbox-image" src={activeArtwork} alt="" fill sizes="96vw" priority />
          </div>
        </div>
      )}
    </main>
  );
}
