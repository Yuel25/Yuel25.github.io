"use client";

import { useState } from "react";
import Link from "next/link";

const copy = {
  zh: {
    nav: ["关于", "作品", "文章", "联系"],
    hello: "你好，我是 Yuel。",
    intro: "我在代码、设计与文字之间，创造安静而有温度的数字体验。",
    location: "中国 · 在互联网的一隅",
    explore: "看看我的作品",
    github: "访问 GitHub",
    aboutEyebrow: "01 / 关于",
    aboutTitle: "保持好奇，认真创造。",
    aboutBody: "这里是我的个人主页，也是我收集灵感、记录成长的数字庭院。我喜欢把复杂的问题梳理清楚，再用简单、自然的方式呈现出来。",
    facts: ["开发与创作", "持续学习中", "开放合作"],
    workEyebrow: "02 / 精选作品",
    workTitle: "最近在做的事",
    projects: [
      ["个人数字花园", "一个用于沉淀知识、灵感与长期思考的私人空间。", "设计 · 开发"],
      ["轻量效率工具", "从日常摩擦中寻找问题，用小工具让工作流更顺畅。", "产品 · 前端"],
      ["视觉实验室", "关于排版、颜色和交互节奏的小型创意实验。", "创意编码"],
    ],
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
    nav: ["About", "Work", "Writing", "Contact"],
    hello: "Hi, I’m Yuel.",
    intro: "I create quiet, thoughtful digital experiences at the intersection of code, design, and words.",
    location: "China · A small corner of the web",
    explore: "Explore my work",
    github: "Visit GitHub",
    aboutEyebrow: "01 / ABOUT",
    aboutTitle: "Stay curious. Make with care.",
    aboutBody: "This is my personal home and a digital garden for ideas, inspiration, and growth. I enjoy making sense of complex problems, then presenting them in ways that feel simple and natural.",
    facts: ["Developer & maker", "Always learning", "Open to collaborate"],
    workEyebrow: "02 / SELECTED WORK",
    workTitle: "Things I’m making",
    projects: [
      ["Digital Garden", "A personal space for cultivating knowledge, inspiration, and long-term thinking.", "Design · Development"],
      ["Tiny Productivity Tools", "Small tools that remove everyday friction and make workflows feel effortless.", "Product · Frontend"],
      ["Visual Playground", "Small creative experiments in type, color, and the rhythm of interaction.", "Creative coding"],
    ],
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

export default function Home() {
  const [language, setLanguage] = useState<"zh" | "en">("zh");
  const t = copy[language];

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
        <div className="about-copy"><p>{t.aboutBody}</p><div className="facts">{t.facts.map((fact, i) => <span key={fact}><b>0{i + 1}</b>{fact}</span>)}</div></div>
      </section>

      <section className="section work" id="work">
        <p className="eyebrow">{t.workEyebrow}</p><h2>{t.workTitle}</h2>
        <div className="project-grid">
          {t.projects.map((project, i) => <article className="project" key={project[0]}><div className={`project-art art-${i + 1}`}><span>0{i + 1}</span></div><p className="tag">{project[2]}</p><h3>{project[0]}</h3><p>{project[1]}</p><span className="arrow">↗</span></article>)}
        </div>
      </section>

      <section className="section writing" id="writing">
        <p className="eyebrow">{t.writingEyebrow}</p><h2>{t.writingTitle}</h2>
        <div className="post-list">{t.posts.map((post, i) => <Link className="post" href={post[3]} key={post[0]}><span className="post-number">0{i + 1}</span><div><h3>{post[0]}</h3><p>{post[2]}</p></div><time>{post[1]}</time><span className="post-status">{t.soon}</span></Link>)}</div>
        <Link className="button secondary notes-link" href="/notes/">{language === "zh" ? "浏览公开笔记" : "Browse public notes"}<span>→</span></Link>
      </section>

      <section className="contact" id="contact"><p className="eyebrow">{t.contactEyebrow}</p><h2>{t.contactTitle}</h2><p>{t.contactBody}</p><a className="button primary" href="https://github.com/Yuel25" target="_blank" rel="noreferrer">{t.contactButton}<span>↗</span></a></section>
      <footer><a className="brand" href="#top">Yuel<span>25</span></a><p>{t.footer}</p><p>© 2026 Yuel</p></footer>
    </main>
  );
}
