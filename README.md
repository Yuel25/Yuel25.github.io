# Yuel25.github.io

Yuel 的个人网站：个人介绍、作品集与文章，支持中英文切换。

## 本地预览

```bash
npm install
npm run dev
```

访问 `http://localhost:3000`。

## 同步 Obsidian 公开笔记

```bash
npm run notes:sync
```

脚本默认从 `D:\Notes` 读取，只同步 `0-InBox` 至 `4-Archives` 中的 Markdown 文件。`5-Journals`、`Journals`、模板、Obsidian 配置以及未被笔记引用的附件均不会同步；公开笔记一旦链接到私密日记，同步会直接失败。本地绝对路径、文件 URI、localhost 与内网地址会在发布副本中自动隐藏。可通过 `OBSIDIAN_VAULT` 指定其他仓库位置。

## 发布

将仓库命名为 `Yuel25.github.io` 并推送到 GitHub 的 `main` 分支。仓库内的 GitHub Actions 会自动构建并部署到 GitHub Pages。

首次发布时，请在仓库的 **Settings → Pages → Build and deployment** 中将 Source 设为 **GitHub Actions**。
