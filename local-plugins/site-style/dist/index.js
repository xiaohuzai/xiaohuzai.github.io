// 全站视觉精修层。两块内容：
//
// 1) 字体自托管：Inter（正文/标题）+ JetBrains Mono（代码），woff2 在 quartz/static/fonts/，
//    构建时随 static/ 复制进 public/static/。不走 Google Fonts CDN——运行时零外网依赖，
//    国内访问不会卡在 fonts.googleapis.com（与 mermaid 镜像、viz.wasm 同一哲学）。
//    停用了 @quartz-community/quartz-fonts，因此 --bodyFont 等变量由这里定义（不定义会退化成衬线默认字体）。
//    只取 latin / latin-ext 子集（中文走系统字体栈），全部加起来约 240KB。
//
// 2) 排版与组件精修：中文阅读的行高/字距节奏、callout/代码块/表格/侧栏/页脚的细节。
//    颜色一律走主题变量（--light/--dark/--secondary…），亮暗两套主题自动适配；
//    调色板本身在 quartz.config.yaml 的 configuration.theme.colors（config-palette 注入）。
//
// 与 toc-tree/folder-listing 同理：quartz/styles/custom.scss 未接入构建，样式只能从插件注入；
// 无 layer 的注入优先级高于主题包 @layer 里的规则。
import { h } from "preact"

const FONT_FACES_CSS = `
@font-face {
  font-family: "Inter";
  font-style: normal;
  font-weight: 400 700;
  font-display: swap;
  src: url("/static/fonts/inter-latin-normal.woff2") format("woff2");
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
@font-face {
  font-family: "Inter";
  font-style: normal;
  font-weight: 400 700;
  font-display: swap;
  src: url("/static/fonts/inter-latin-ext-normal.woff2") format("woff2");
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
@font-face {
  font-family: "Inter";
  font-style: italic;
  font-weight: 400;
  font-display: swap;
  src: url("/static/fonts/inter-latin-italic.woff2") format("woff2");
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
@font-face {
  font-family: "Inter";
  font-style: italic;
  font-weight: 400;
  font-display: swap;
  src: url("/static/fonts/inter-latin-ext-italic.woff2") format("woff2");
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
@font-face {
  font-family: "JetBrains Mono";
  font-style: normal;
  font-weight: 400 700;
  font-display: swap;
  src: url("/static/fonts/jbmono-latin-normal.woff2") format("woff2");
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
@font-face {
  font-family: "JetBrains Mono";
  font-style: normal;
  font-weight: 400 700;
  font-display: swap;
  src: url("/static/fonts/jbmono-latin-ext-normal.woff2") format("woff2");
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
`

const SITE_STYLE_CSS = `
/* ---------- 语义色重映射（关键） ----------
   主题包的 aspect 规则（body 背景、侧栏、文字色等）用的是 Obsidian 风格语义变量
   （--background-primary / --text-normal …），它们链到主题包里「硬编码」的
   --color-base-* 色板（#FFFCF0 那套），完全绕过 quartz.config.yaml 的 theme.colors——
   结果是改了 colors 正文背景不变色（2026-09 实测：--light 已是新值，body 背景仍是旧色）。
   这里把语义变量重新绑到调色板变量上；本注入是无 layer 的，层叠上必胜主题包 @layer 里的同名定义。
   引用 var(--light) 而不是写死颜色，亮暗两套主题自动适配（graph-links 同款思路）。 */
:root {
  --color-base-00: var(--light);
  --color-base-05: var(--light);
  --color-base-10: var(--lightgray);
  --color-base-20: var(--lightgray);
  --color-base-25: var(--lightgray);
  --color-base-30: color-mix(in srgb, var(--dark) 12%, var(--light));
  --color-base-35: color-mix(in srgb, var(--dark) 18%, var(--light));
  --color-base-40: color-mix(in srgb, var(--dark) 26%, var(--light));
  --color-base-50: var(--gray);
  --color-base-60: var(--gray);
  --color-base-70: var(--gray);
  --color-base-100: var(--darkgray);
  --color-accent: var(--secondary);
  --color-accent-1: var(--tertiary);
  --color-accent-2: var(--secondary);
  --text-highlight-bg: var(--textHighlight);
}

/* ---------- 字体栈 ---------- */
:root {
  /* Inter 只有拉丁字形；中文显式落到系统黑体栈，避免各平台乱跳 */
  --bodyFont: "Inter", "PingFang SC", "Hiragino Sans GB", "Noto Sans SC", "Microsoft YaHei", system-ui, sans-serif;
  --titleFont: var(--bodyFont);
  --headerFont: var(--bodyFont);
  --codeFont: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  --font-text: var(--bodyFont);
  --font-monospace: var(--codeFont);
  --font-interface: var(--bodyFont);
}

/* ---------- 正文节奏（中文阅读：行高放宽、段落呼吸） ---------- */
body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
article p, article li, article tbody {
  line-height: 1.8;
  letter-spacing: 0.01em;
}
article p {
  margin: 0.85em 0;
}
article {
  font-size: 1.02rem;
}

/* ---------- 标题层级 ---------- */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--headerFont);
  letter-spacing: -0.012em;
  font-weight: 650;
}
.page article > h1 {
  font-size: 2.05rem;
  font-weight: 700;
  letter-spacing: -0.022em;
  line-height: 1.35;
  margin: 0.6rem 0 1.4rem;
}
article > h2 {
  font-size: 1.52rem;
  margin: 2.7rem 0 1rem;
}
article > h3 {
  font-size: 1.22rem;
  margin: 2.15rem 0 0.85rem;
}
article > h4, article > h5, article > h6 {
  margin: 1.8rem 0 0.75rem;
}

/* ---------- 链接 ---------- */
article a {
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
  transition: color 0.15s ease;
}
/* 双链：淡底色 chip，和行内代码一样「标记」而不是「涂鸦」 */
a.internal {
  background-color: var(--highlight);
  border-radius: 4px;
  padding: 0.04em 0.22em;
  line-height: inherit;
}
a.internal:hover {
  background-color: color-mix(in srgb, var(--secondary) 18%, transparent);
}

/* ---------- 行内代码 / 代码块 ---------- */
code {
  font-family: var(--codeFont);
  font-size: 0.87em;
  background: color-mix(in srgb, var(--dark) 6%, transparent);
  border-radius: 4px;
  padding: 0.12em 0.38em;
}
pre {
  font-family: var(--codeFont);
  background: color-mix(in srgb, var(--dark) 4.5%, transparent);
  border: 1px solid color-mix(in srgb, var(--dark) 9%, transparent);
  border-radius: 8px;
  padding: 0.95rem 1.25rem;
  margin: 1.35rem 0;
}
pre > code {
  background: transparent;
  padding: 0;
  font-size: 0.865rem;
  line-height: 1.75;
}
figure[data-rehype-pretty-code-figure] {
  margin: 1.35rem 0;
  line-height: 1.75;
}
figure[data-rehype-pretty-code-figure] > [data-rehype-pretty-code-title] {
  font-family: var(--codeFont);
  background: color-mix(in srgb, var(--dark) 4.5%, transparent);
  border: 1px solid color-mix(in srgb, var(--dark) 9%, transparent);
  border-bottom: none;
  border-radius: 8px 8px 0 0;
  margin-bottom: -1px;
  padding: 0.32rem 0.95rem;
  font-size: 0.82rem;
  color: var(--gray);
}
figure[data-rehype-pretty-code-figure] > pre {
  border-radius: 0 0 8px 8px;
  margin: 0;
}
pre > code [data-highlighted-chars] {
  background-color: color-mix(in srgb, var(--secondary) 25%, transparent);
}

/* ---------- 引用与 callout ---------- */
article blockquote {
  border-left: 3px solid color-mix(in srgb, var(--secondary) 55%, transparent);
  background: color-mix(in srgb, var(--secondary) 4%, transparent);
  border-radius: 3px 8px 8px 3px;
  padding: 0.35rem 1.25rem;
  margin: 1.5rem 0;
}
.callout {
  border: 1px solid color-mix(in srgb, var(--color) 22%, transparent);
  border-left: 3px solid var(--color);
  background: color-mix(in srgb, var(--color) 5%, transparent);
  border-radius: 8px;
  padding: 0 1.25rem;
  margin: 1.5rem 0;
}
.callout-title {
  padding: 0.95rem 0 0.35rem;
  gap: 0.45rem;
}
.callout-title .callout-title-inner {
  font-weight: 650;
}
.callout > .callout-content {
  padding-bottom: 0.95rem;
}

/* ---------- 表格 ---------- */
.table-container > table {
  margin: 1.35rem 0;
  border: 1px solid color-mix(in srgb, var(--dark) 9%, transparent);
  border-radius: 8px;
  border-collapse: separate;
  border-spacing: 0;
  overflow: hidden;
}
.table-container > table > * > tr > * {
  line-height: 1.65;
}
th {
  text-align: left;
  font-weight: 650;
  border-bottom: 1.5px solid color-mix(in srgb, var(--dark) 16%, transparent);
  padding: 0.55rem 0.85rem;
}
td {
  padding: 0.5rem 0.85rem;
}
tr {
  border-bottom: 1px solid color-mix(in srgb, var(--dark) 7%, transparent);
}
tr:last-child {
  border-bottom: none;
}

/* ---------- 分隔线 / 其它 ---------- */
hr {
  border: none;
  border-top: 1px solid color-mix(in srgb, var(--dark) 9%, transparent);
  margin: 2rem 0;
}
article img {
  border-radius: 8px;
}
::selection {
  background: color-mix(in srgb, var(--secondary) 22%, transparent);
}

/* ---------- 侧栏：探索树 ---------- */
.explorer-content ul li > a {
  border-radius: 6px;
  padding: 0.18rem 0.5rem;
  font-size: 0.93rem;
  transition: background-color 0.12s ease;
}
.explorer-content ul li > a:hover {
  background-color: var(--highlight);
  opacity: 1;
}
.explorer-content ul li > a.active {
  color: var(--secondary);
  font-weight: 600;
}
.folder-container div > a {
  font-family: var(--headerFont);
  font-size: 0.93rem;
  font-weight: 600;
}

/* ---------- 右栏：图谱 / 目录 / 反链 ---------- */
.graph > h3,
button.toc-header h3,
.backlinks > h3 {
  font-family: var(--headerFont);
  font-size: 0.92rem;
  font-weight: 650;
  letter-spacing: 0.02em;
  color: var(--gray);
}
ul.toc-content.overflow > li > a {
  line-height: 1.55;
}
.backlinks > ul.overflow > li > a {
  border-radius: 6px;
  padding: 0.22rem 0.55rem;
}
.backlinks > ul.overflow > li > a:hover {
  background-color: var(--highlight);
}

/* ---------- 导航 / 页脚 ---------- */
.links-nav-item {
  font-weight: 500;
  border-radius: 8px;
}
.site-logo .logo-word {
  font-family: var(--headerFont);
  font-weight: 700;
  letter-spacing: 0.015em;
  font-size: 1.62rem;
}
footer {
  font-size: 0.85rem;
}
ul.footer-extras {
  gap: 1.25rem;
}
ul.footer-extras a:hover {
  color: var(--secondary);
}

/* ---------- 窄屏 ---------- */
@media screen and (max-width: 720px) {
  article {
    font-size: 0.98rem;
  }
  .page article > h1 {
    font-size: 1.72rem;
  }
  article > h2 {
    font-size: 1.38rem;
    margin-top: 2.25rem;
  }
  article > h3 {
    font-size: 1.14rem;
  }
}
`

export function SiteStyle() {
  return {
    htmlPlugins() {
      return []
    },
    externalResources() {
      return {
        css: [
          { content: FONT_FACES_CSS, inline: true },
          { content: SITE_STYLE_CSS, inline: true },
        ],
      }
    },
  }
}
