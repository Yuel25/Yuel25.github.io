"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { galleryImages } from "./gallery.generated";

const copy = {
  zh: {
    nav: ["关于", "项目", "画廊", "文章", "联系"],
    hello: "你好，我是 Yuel。",
    intro: "我在代码、设计与文字之间，创造安静而有温度的数字体验。",
    location: "中国 · 在互联网的一隅",
    explore: "看看今日画选",
    github: "访问 GitHub",
    aboutEyebrow: "01 / 关于",
    aboutTitle: "Petals linger about, awaiting one last dance",
    aboutBody: "这里是我的个人主页，也是我收集灵感、记录成长的数字庭院。我喜欢把复杂的问题梳理清楚，再用简单、自然的方式呈现出来。",
    projectEyebrow: "02 / 近期项目",
    projects: [
      {
        status: "0.3.4 · 正式版",
        title: "Mizuki",
        tagline: "追番、订阅与下载，都收进一个安静的桌面窗口。",
        body: "面向 Windows 的 Bangumi 动漫追踪与 Mikan RSS 下载管理器，采用本地优先的数据与隐私设计。",
        features: ["收藏同步保护连续修改的追番进度", "下载队列后台调度与失败重试", "重启后离线选集与文件删除重试"],
        source: "https://github.com/Yuel25/Mizuki",
        release: "https://github.com/Yuel25/Mizuki/releases",
        note: "Windows x64 · Rust · Tauri 2 · React · MIT",
        icon: "/mizuki.png",
        mark: "MIZU",
        platform: "ANIME TRACKER & RSS MANAGER",
        tone: "mizuki",
      },
      {
        status: "1.3.4 · 正式版",
        title: "celechron-next",
        tagline: "为浙大学生重新整理每一天。",
        body: "基于 Flutter 的 Android 时间管理应用，把课表、考试、日程、DDL 与成绩收进同一套本地优先的体验。",
        features: ["课表、考试与时间线总览", "DDL 助手、日程与系统日历同步", "成绩查询、绩点换算与更新提醒"],
        source: "https://github.com/Yuel25/Celechron-Next",
        release: "https://github.com/Yuel25/Celechron-Next/releases",
        note: "Android 9+ · Dart · Flutter · GPL-3.0 · 上游延续版",
        icon: "/celechron-next.png",
        mark: "CELE",
        platform: "ZJU STUDENT TIME MANAGER",
        tone: "celechron",
      },
      {
        status: "1.1.2 · 正式版",
        title: "neko player",
        tagline: "轻巧、漂亮，也足够强大的本地播放器。",
        body: "使用 Rust、Slint 与 libmpv 构建的现代 Windows 媒体播放器，专注于流畅播放、顺手的播放列表和克制的深色界面。",
        features: ["硬件加速与进度缩略图", "播放列表、断点续播与 LRC 歌词", "安装包、格式关联与拖放播放"],
        source: "https://github.com/Yuel25/neko-player",
        release: "https://github.com/Yuel25/neko-player/releases",
        note: "Windows 10/11 x64 · Rust · Slint · libmpv · MIT",
        icon: "/neko-player.png",
        mark: "NEKO",
        platform: "WINDOWS MEDIA PLAYER",
        tone: "neko",
      },
      {
        status: "1.2.4 · 正式版",
        title: "dsh-desktop",
        tagline: "把 DeepSeek Harness，安静地放进桌面。",
        body: "一个面向 Windows 的非官方 DeepSeek Harness 桌面客户端，可直接启动和管理本机 DSH，并为不同 Profile 打开相互独立的窗口。",
        features: ["全新鲸鱼娘图标与随主题切换的启动页", "启动认证兼容与多 Profile 崩溃恢复", "日志认证信息脱敏与自动发布安装包"],
        source: "https://github.com/Yuel25/dsh-desktop",
        release: "https://github.com/Yuel25/dsh-desktop/releases",
        note: "Windows x64 · TypeScript · Electron · MIT",
        icon: "/dsh-desktop-v1.2.4.png",
        mark: "DSH",
        platform: "DEEPSEEK HARNESS DESKTOP",
        tone: "dsh",
      },
    ],
    projectSource: "查看源码",
    projectRelease: "下载发行版",
    workEyebrow: "03 / 每日画选",
    workTitle: "今日的三束光",
    workBody: "从我的私人收藏中，每天抽取三幅画面。明天零点，它们会悄悄换一组。",
    daily: "每日 00:00 更新",
    collection: "私人收藏",
    openArtwork: "查看完整画面",
    closeArtwork: "关闭画面",
    prevArtwork: "上一幅作品",
    nextArtwork: "下一幅作品",
    menuOpen: "打开导航菜单",
    menuClose: "关闭导航菜单",
    writingEyebrow: "04 / 文章",
    writingTitle: "一些近期思考",
    posts: [
      ["2026 七月看番计划", "2026.07", "七月新番的个人观看清单与记录。", "/notes/2-Aeras/动漫/2026七月看番计划/"],
      ["2026 四月看番计划", "2026.07", "四月新番的个人观看清单与记录。", "/notes/2-Aeras/动漫/2026四月看番计划/"],
      ["OI-ICPC 算法模板", "2026.07", "算法竞赛常用数据结构与算法模板汇总。", "/notes/3-Resources/算法竞赛/OI-ICPC算法模板/"],
    ],
    soon: "阅读笔记 →",
    contactEyebrow: "05 / 联系",
    contactTitle: "有好点子？一起聊聊。",
    contactBody: "如果你对我的作品感兴趣，或想一起创造些什么，欢迎通过 GitHub 联系我。",
    contactButton: "在 GitHub 找到我",
    footer: "认真生活，自由创造。",
  },
  en: {
    nav: ["About", "Project", "Gallery", "Writing", "Contact"],
    hello: "Hi, I’m Yuel.",
    intro: "I create quiet, thoughtful digital experiences at the intersection of code, design, and words.",
    location: "China · A small corner of the web",
    explore: "See today’s selection",
    github: "Visit GitHub",
    aboutEyebrow: "01 / ABOUT",
    aboutTitle: "Petals linger about, awaiting one last dance",
    aboutBody: "This is my personal home and a digital garden for ideas, inspiration, and growth. I enjoy making sense of complex problems, then presenting them in ways that feel simple and natural.",
    projectEyebrow: "02 / RECENT PROJECTS",
    projects: [
      {
        status: "0.3.4 · Stable",
        title: "Mizuki",
        tagline: "Tracking, subscriptions, and downloads in one quiet desktop home.",
        body: "A Windows anime tracker and Mikan RSS download manager with a local-first approach to data and privacy.",
        features: ["Preserve tracking edits during collection sync", "Background download queue with failure retries", "Offline episode selection & file deletion retries"],
        source: "https://github.com/Yuel25/Mizuki",
        release: "https://github.com/Yuel25/Mizuki/releases",
        note: "Windows x64 · Rust · Tauri 2 · React · MIT",
        icon: "/mizuki.png",
        mark: "MIZU",
        platform: "ANIME TRACKER & RSS MANAGER",
        tone: "mizuki",
      },
      {
        status: "1.3.4 · Stable",
        title: "celechron-next",
        tagline: "A clearer rhythm for every day at Zhejiang University.",
        body: "A Flutter-based Android planner that brings classes, exams, schedules, deadlines, and grades into one local-first experience.",
        features: ["Class, exam & timeline overview", "Deadline assistant and calendar sync", "Grades, GPA conversion & update alerts"],
        source: "https://github.com/Yuel25/Celechron-Next",
        release: "https://github.com/Yuel25/Celechron-Next/releases",
        note: "Android 9+ · Dart · Flutter · GPL-3.0 · Continued from upstream",
        icon: "/celechron-next.png",
        mark: "CELE",
        platform: "ZJU STUDENT TIME MANAGER",
        tone: "celechron",
      },
      {
        status: "1.1.2 · Stable",
        title: "neko player",
        tagline: "A small, beautiful player with serious playback power.",
        body: "A modern Windows media player built with Rust, Slint, and libmpv, focused on smooth playback, a practical playlist, and a restrained dark interface.",
        features: ["Hardware acceleration & timeline previews", "Playlists, resume playback & LRC lyrics", "Installer, file associations & drag-and-drop"],
        source: "https://github.com/Yuel25/neko-player",
        release: "https://github.com/Yuel25/neko-player/releases",
        note: "Windows 10/11 x64 · Rust · Slint · libmpv · MIT",
        icon: "/neko-player.png",
        mark: "NEKO",
        platform: "WINDOWS MEDIA PLAYER",
        tone: "neko",
      },
      {
        status: "1.2.4 · Stable",
        title: "dsh-desktop",
        tagline: "DeepSeek Harness, quietly at home on your desktop.",
        body: "An unofficial Windows desktop client for DeepSeek Harness that launches and manages a local DSH installation, with independent windows for multiple profiles.",
        features: ["New whale-girl icon & theme-aware startup", "Launch authentication & profile crash recovery", "Auth token redaction & automated installer releases"],
        source: "https://github.com/Yuel25/dsh-desktop",
        release: "https://github.com/Yuel25/dsh-desktop/releases",
        note: "Windows x64 · TypeScript · Electron · MIT",
        icon: "/dsh-desktop-v1.2.4.png",
        mark: "DSH",
        platform: "DEEPSEEK HARNESS DESKTOP",
        tone: "dsh",
      },
    ],
    projectSource: "View source",
    projectRelease: "Download release",
    workEyebrow: "03 / DAILY GALLERY",
    workTitle: "Three quiet sparks, today",
    workBody: "Three images are drawn from my private collection each day. At midnight, a new set quietly takes their place.",
    daily: "Refreshes daily at 00:00",
    collection: "Private collection",
    openArtwork: "View full artwork",
    closeArtwork: "Close artwork",
    prevArtwork: "Previous artwork",
    nextArtwork: "Next artwork",
    menuOpen: "Open navigation menu",
    menuClose: "Close navigation menu",
    writingEyebrow: "04 / WRITING",
    writingTitle: "Recent thoughts",
    posts: [
      ["July 2026 Anime List", "2026.07", "My personal watch list and notes for the July season.", "/notes/2-Aeras/动漫/2026七月看番计划/"],
      ["April 2026 Anime List", "2026.07", "My personal watch list and notes for the April season.", "/notes/2-Aeras/动漫/2026四月看番计划/"],
      ["OI-ICPC Algorithm Templates", "2026.07", "A collection of common competitive-programming templates.", "/notes/3-Resources/算法竞赛/OI-ICPC算法模板/"],
    ],
    soon: "Read note →",
    contactEyebrow: "05 / CONTACT",
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

const subscribeToDate = () => () => {};

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
  const [activeArtwork, setActiveArtwork] = useState<number | null>(null);
  const [activeProject, setActiveProject] = useState(0);
  const [navScrolled, setNavScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dailyDate = useSyncExternalStore(subscribeToDate, getShanghaiDateKey, () => "");
  const dailyIndexes = dailyDate ? getDailySelection(dailyDate) : [0, 1, 2];
  const dailyArtworks = dailyIndexes.map((index) => galleryImages[index]);
  const t = copy[language];
  const project = t.projects[activeProject];

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // JS 注入 .reveal：禁用脚本时内容保持可见
  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>("main .section, main .contact, main footer"));
    if (!targets.length) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });
    for (const target of targets) {
      target.classList.add("reveal");
      observer.observe(target);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (activeArtwork === null) return;
    const previousOverflow = document.body.style.overflow;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveArtwork(null);
      if (event.key === "ArrowLeft") setActiveArtwork((current) => current === null ? null : (current + dailyArtworks.length - 1) % dailyArtworks.length);
      if (event.key === "ArrowRight") setActiveArtwork((current) => current === null ? null : (current + 1) % dailyArtworks.length);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [activeArtwork]);

  return (
    <main>
      <header className={`nav-shell${navScrolled ? " scrolled" : ""}${menuOpen ? " menu-open" : ""}`}>
        <a className="brand" href="#top" aria-label="Yuel home">Yuel<span>25</span></a>
        <nav className="site-nav" aria-label="Main navigation">
          {t.nav.map((item, index) => <a key={item} onClick={() => setMenuOpen(false)} href={`#${["about", "project", "work", "writing", "contact"][index]}`}>{item}</a>)}
        </nav>
        <div className="nav-controls">
          <button className="language" onClick={() => setLanguage(language === "zh" ? "en" : "zh")} aria-label="Switch language">
            <span className={language === "zh" ? "active" : ""}>中</span><i>/</i><span className={language === "en" ? "active" : ""}>EN</span>
          </button>
          <button className="menu-toggle" aria-expanded={menuOpen} aria-label={menuOpen ? t.menuClose : t.menuOpen} onClick={() => setMenuOpen((open) => !open)}>
            <span /><span /><span />
          </button>
        </div>
      </header>

      <section className="hero" id="top">
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

      <section className="section project" id="project">
        <p className="eyebrow project-eyebrow">{t.projectEyebrow}</p>
        <div className="project-workspace">
          <div className="project-picker" role="tablist" aria-label={language === "zh" ? "选择项目" : "Select a project"}>
            {t.projects.map((item, index) => (
              <button
                key={item.title}
                id={`project-tab-${index}`}
                className="project-tab"
                role="tab"
                aria-selected={activeProject === index}
                aria-controls={`project-panel-${index}`}
                tabIndex={activeProject === index ? 0 : -1}
                onClick={() => setActiveProject(index)}
                onKeyDown={(event) => {
                  const count = t.projects.length;
                  const next = event.key === "Home" ? 0 : event.key === "End" ? count - 1
                    : ["ArrowRight", "ArrowDown"].includes(event.key) ? (index + 1) % count
                    : ["ArrowLeft", "ArrowUp"].includes(event.key) ? (index + count - 1) % count : null;
                  if (next === null) return;
                  event.preventDefault();
                  setActiveProject(next);
                  document.getElementById(`project-tab-${next}`)?.focus();
                }}
              >
                <Image src={item.icon} alt="" width={48} height={48} />
                <span className="project-tab-copy"><strong>{item.title}</strong><small>{item.status}</small></span>
                <span className="project-tab-arrow" aria-hidden="true">↗</span>
              </button>
            ))}
          </div>
          {t.projects.map((item, index) => (
            <div key={item.title} id={`project-panel-${index}`} role="tabpanel" aria-labelledby={`project-tab-${index}`} hidden={activeProject !== index} tabIndex={0}>
              {activeProject === index && (
                <article className={`project-detail ${project.tone}`}>
                  <header className="project-detail-heading">
                    <div><p className="project-platform">{project.platform}</p><h2>{project.title}</h2></div>
                    <Image src={project.icon} alt="" width={88} height={88} className="project-detail-icon" />
                  </header>
                  <p className="project-tagline">{project.tagline}</p>
                  <p className="project-body">{project.body}</p>
                  <ul>{project.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
                  <div className="project-actions">
                    <a className="button primary" href={project.source} target="_blank" rel="noreferrer">{t.projectSource}<span>↗</span></a>
                    <a className="button secondary" href={project.release} target="_blank" rel="noreferrer">{t.projectRelease}<span>↓</span></a>
                  </div>
                  <p className="project-note">{project.note}</p>
                </article>
              )}
            </div>
          ))}
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
                onClick={() => setActiveArtwork(index)}
                aria-label={`${t.openArtwork} ${index + 1}`}
              >
                <Image className="gallery-image" src={artwork} alt={`${t.collection} · 0${index + 1}`} fill sizes={index === 0 ? "(max-width: 800px) 100vw, 62vw" : "(max-width: 800px) 100vw, 32vw"} />
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

      {activeArtwork !== null && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={t.openArtwork} onClick={() => setActiveArtwork(null)}>
          <button className="lightbox-close" onClick={() => setActiveArtwork(null)} aria-label={t.closeArtwork}>×</button>
          <button className="lightbox-nav prev" aria-label={t.prevArtwork} onClick={(event) => { event.stopPropagation(); setActiveArtwork((current) => current === null ? null : (current + dailyArtworks.length - 1) % dailyArtworks.length); }}>‹</button>
          <div className="lightbox-stage" onClick={(event) => event.stopPropagation()}>
            <Image className="lightbox-image" src={dailyArtworks[activeArtwork]} alt={`${t.collection} · 0${activeArtwork + 1}`} fill sizes="96vw" priority />
          </div>
          <button className="lightbox-nav next" aria-label={t.nextArtwork} onClick={(event) => { event.stopPropagation(); setActiveArtwork((current) => current === null ? null : (current + 1) % dailyArtworks.length); }}>›</button>
          <p className="lightbox-counter" aria-hidden="true">{activeArtwork + 1} / {dailyArtworks.length}</p>
        </div>
      )}
    </main>
  );
}
