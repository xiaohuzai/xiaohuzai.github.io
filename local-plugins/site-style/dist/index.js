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

/* ---------- ==高亮== 浅色模式可读性修正（换 catppuccin 后补） ----------
   主题包直接给 .text-highlight 画了不透明 rosewater 底 + 浅色文字，浅色（Latte）
   下实测对比度只有 2.17:1（WCAG AA 要求 4.5）。只在浅色模式把文字压回正文色、
   底色改用 colors: 里的半透明 rosewater；深色模式主题本身对比 13.9，保持原样。
   本注入无 layer 且选择器特异度高，稳压主题包 @layer 里的同名定义。 */
:root:root[saved-theme="light"] .text-highlight,
:root:root[saved-theme="light"] article mark {
  background-color: var(--textHighlight);
  color: var(--darkgray);
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

/* ---------- 顶部留白与页头 ----------
   Quartz 默认给 .page-header 6rem 上边距、侧栏 6rem 上内边距，首屏有近 100px
   空白；收到 4rem 后页头与左侧搜索/探索树顶端对齐，首屏能多放一段正文。 */
.page-header {
  margin-top: 4rem;
}
@media all and (min-width: 801px) {
  .sidebar.left,
  .sidebar.right {
    padding-top: 4rem;
  }
}

/* 站标与图标导航原来分两行，中间还夹一条分割线；桌面端并成一行，
   站标靠左、导航靠右，页头高度从约 130px 降到 60px 左右。 */
header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.9rem;
  border-bottom: 1px solid color-mix(in srgb, var(--dark) 8%, transparent);
}
#links-nav-container {
  flex: 0 1 auto;
  min-width: 0;
}
#links-nav {
  margin: 0;
  flex-wrap: nowrap;
}
#links-nav-container hr {
  display: none;
}
@media all and (max-width: 800px) {
  header {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.35rem;
  }
  /* 核心样式在窄屏把 .page-title 隐藏了（原意是侧栏里有站名），
     本站没用 page-title 插件、站名只在这里出现，所以要把站标放回来 */
  .site-logo.page-title {
    display: block;
  }
  .page-header {
    margin-top: 2rem;
  }
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
/* 标题用正文色，强调色只留给链接与交互元素；整页蓝色标题会显得像默认模板 */
article h2,
article h3,
article h4,
article h5,
article h6 {
  color: var(--darkgray);
}
/* 文章标题由 article-title 插件放在 .page-header 里，不在 article 内 */
.page-header h1.article-title {
  font-size: 2.05rem;
  font-weight: 700;
  letter-spacing: -0.022em;
  line-height: 1.35;
  margin: 0.6rem 0 1rem;
}
article h2 {
  font-size: 1.52rem;
  margin: 2.7rem 0 1rem;
}
/* 小节标题前的短竖条：提供层级锚点，又不用把整行字染成强调色 */
article h2::before {
  content: "";
  display: inline-block;
  width: 0.26rem;
  height: 0.92em;
  margin-right: 0.55rem;
  vertical-align: -0.07em;
  border-radius: 999px;
  background: var(--secondary);
}
article h3 {
  font-size: 1.22rem;
  margin: 2.15rem 0 0.85rem;
}
article h4, article h5, article h6 {
  margin: 1.8rem 0 0.75rem;
}

/* ---------- 链接 ---------- */
article a {
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
  transition: color 0.15s ease;
}
/* 双链默认给淡底 chip（反链、标签等短列表里仍然好看），
   但正文里的双链用下划线就够；整段文字里散布橙色底片会割裂阅读。 */
a.internal {
  background-color: color-mix(in srgb, var(--secondary) 9%, transparent);
  border-radius: 4px;
  padding: 0.04em 0.22em;
  line-height: inherit;
}
a.internal:hover {
  background-color: color-mix(in srgb, var(--secondary) 16%, transparent);
}
article a.internal {
  background: none;
  padding: 0;
  border-radius: 0;
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, var(--secondary) 40%, transparent);
}
article a.internal:hover {
  background: none;
  text-decoration-color: var(--secondary);
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
/* 树展开后可能比视口高。给列表自己一个滚动区，避免条目把整页顶下去；
   同时也让插件对当前页的 scrollIntoView 作用在列表内，而不是滚动整个窗口。 */
@media all and (min-width: 801px) {
  .explorer {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: visible;
  }
  .explorer-content {
    overflow-y: auto;
    max-height: calc(100vh - 13rem);
    overscroll-behavior: contain;
    padding-right: 0.35rem;
  }
}
.explorer-content ul li > a {
  border-radius: 6px;
  padding: 0.14rem 0.45rem;
  font-size: 0.9rem;
  line-height: 1.5;
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
.folder-container div > a,
.folder-container div > button span {
  font-family: var(--headerFont);
  font-size: 0.9rem;
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
/* toc-tree 用 opacity 压层级，浅色下会灰得发虚；改为直接取色，当前节用强调色 */
ul.toc-content.overflow > li.depth-0 > a {
  color: var(--darkgray);
  opacity: 0.72;
}
ul.toc-content.overflow > li.depth-0 > a.in-view {
  color: var(--secondary);
  opacity: 1;
}
ul.toc-content.overflow > li.depth-1 > a,
ul.toc-content.overflow > li.depth-2 > a,
ul.toc-content.overflow > li.depth-3 > a {
  color: var(--gray);
  opacity: 0.9;
}
ul.toc-content.overflow > li.depth-1 > a.in-view,
ul.toc-content.overflow > li.depth-2 > a.in-view,
ul.toc-content.overflow > li.depth-3 > a.in-view {
  color: var(--secondary);
  opacity: 1;
}
.backlinks > ul.overflow > li > a {
  border-radius: 6px;
  padding: 0.22rem 0.55rem;
}
.backlinks > ul.overflow > li > a:hover {
  background-color: var(--highlight);
}

/* ---------- 面包屑 / 属性 / 文章元信息 ---------- */
.breadcrumb-container {
  margin-top: 0.9rem;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: var(--gray);
}
.breadcrumb-element p {
  margin-left: 0.35rem;
  opacity: 0.55;
}
.breadcrumb-element a {
  color: var(--gray);
}
.breadcrumb-element a:hover {
  color: var(--secondary);
}
.content-meta {
  font-size: 0.82rem;
  color: var(--gray);
  margin-bottom: 0.9rem;
}
/* note-properties 的折叠条标题是硬编码英文 "Properties"，这里用伪元素换成中文，
   并收成一枚小胶囊，避免夹在标题和日期之间像一行系统输出。 */
.note-properties {
  margin: 0.1rem 0 0.55rem;
}
.note-properties-header {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.12rem 0.55rem;
  border-radius: 999px;
  background: var(--lightgray);
  color: var(--gray);
  font-size: 0.76rem;
  cursor: pointer;
  list-style: none;
}
.note-properties-header::-webkit-details-marker {
  display: none;
}
.note-properties-title {
  font-size: 0;
}
.note-properties-title::before {
  content: "属性";
  font-size: 0.76rem;
}
.note-properties-count {
  font-size: 0.7rem;
  opacity: 0.75;
}
.note-properties-table {
  margin-top: 0.55rem;
  font-size: 0.85rem;
}

/* 文件夹/标签/404 页的右栏被 layout 清空，但三列网格仍预留 320px 空白条。
   收掉空右栏、让中间内容用满宽度；浏览器不支持 :has 时退回原布局。 */
@media all and (min-width: 1200px) {
  .page > #quartz-body:has(> .sidebar.right:empty) {
    grid-template-columns: 320px minmax(0, 1fr);
    grid-template-areas:
      "grid-sidebar-left grid-header"
      "grid-sidebar-left grid-center"
      "grid-sidebar-left grid-footer";
  }
  .page > #quartz-body:has(> .sidebar.right:empty) > .sidebar.right {
    display: none;
  }
}

/* ---------- 导航 / 页脚 ---------- */
.links-nav-item {
  font-weight: 500;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 0.95rem;
}
.site-logo .logo-mark svg {
  width: 2.1rem;
  height: 2rem;
}
.site-logo .logo-word {
  font-family: var(--headerFont);
  font-weight: 700;
  letter-spacing: 0.015em;
  font-size: 1.45rem;
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

/* ---------- 首页 ----------
   首页只有一段欢迎语和两条入口。把首段做成导语、两条入口做成两列卡片，
   空着的左右栏配合展开的探索树，首屏不再像一张没写完的模板页。 */
body[data-slug="index"] .content-meta {
  display: none;
}
body[data-slug="index"] article .markdown-preview-view > p:first-child {
  font-size: 1.12rem;
  line-height: 1.75;
  color: var(--gray);
  margin-top: 0.35rem;
}
body[data-slug="index"] article .markdown-preview-view > ul:first-of-type {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.7rem;
  margin: 1.15rem 0 1.5rem;
  padding: 0;
  list-style: none;
}
body[data-slug="index"] article .markdown-preview-view > ul:first-of-type > li {
  margin: 0;
  padding: 0.85rem 1rem;
  border: 1px solid color-mix(in srgb, var(--dark) 8%, transparent);
  border-radius: 10px;
  background: var(--lightgray);
  line-height: 1.65;
}
body[data-slug="index"] article .markdown-preview-view > ul:first-of-type > li > a {
  font-weight: 650;
}

/* ---------- 窄屏 ---------- */
@media screen and (max-width: 720px) {
  article {
    font-size: 0.98rem;
  }
  .page-header h1.article-title {
    font-size: 1.72rem;
  }
  article h2 {
    font-size: 1.38rem;
    margin-top: 2.25rem;
  }
  article h3 {
    font-size: 1.14rem;
  }
  body[data-slug="index"] article .markdown-preview-view > ul:first-of-type {
    grid-template-columns: 1fr;
  }
}
`

// 探索树（@quartz-community/explorer）在首次渲染时会对当前页条目调用
// scrollIntoView({behavior:"smooth"})。该调用没有限定滚动容器，深链接页面一打开
// 就会把整个文档滚到正文中部（实测 /notes/.../分子 自动 scrollY≈500）。
// 这里在插件脚本之前写入一个 explorerScrollTop，让它走「恢复列表滚动位置」分支、
// 跳过 scrollIntoView；随后再只把当前条目滚进探索树自己的滚动区。
// 另外该版本的 folderDefaultState 选项只写进 data-collapsed、渲染时并未读取，
// 所以首访目录树总是折叠的；这里按「localStorage 里没有记录才算默认」补开一次，
// 用户手动折叠过的目录仍保持折叠。
const EXPLORER_SCROLL_GUARD = `(function () {
  try {
    if (sessionStorage.getItem("explorerScrollTop") === null) {
      sessionStorage.setItem("explorerScrollTop", "0");
    }
  } catch (e) {}

  function savedState() {
    var map = {};
    try {
      JSON.parse(localStorage.getItem("fileTree") || "[]").forEach(function (n) {
        map[n.path] = n.collapsed;
      });
    } catch (e) {}
    return map;
  }

  function openFolders() {
    var saved = savedState();
    var folders = document.querySelectorAll(".explorer .folder-container");
    var count = 0;
    for (var i = 0; i < folders.length; i++) {
      var path = folders[i].dataset.folderpath;
      var outer = folders[i].nextElementSibling;
      if (!outer) continue;
      count++;
      if (saved[path] === undefined) outer.classList.add("open");
    }
    return count;
  }

  function revealActive() {
    var box = document.querySelector(".explorer-ul") || document.querySelector(".explorer-content");
    if (!box) return;
    var active = box.querySelector("a.active");
    if (!active) return;
    var b = box.getBoundingClientRect();
    var a = active.getBoundingClientRect();
    if (a.top < b.top || a.bottom > b.bottom) {
      box.scrollTop += (a.top - b.top) - box.clientHeight / 2 + a.height / 2;
    }
  }

  function refresh(tries) {
    tries = tries || 0;
    if (openFolders() === 0) {
      if (tries < 20) setTimeout(function () { refresh(tries + 1); }, 150);
      return;
    }
    revealActive();
  }

  window.addEventListener("load", function () { setTimeout(refresh, 100); });
  document.addEventListener("nav", function () { setTimeout(refresh, 100); });
})();`

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
        additionalHead: [
          h("script", { dangerouslySetInnerHTML: { __html: EXPLORER_SCROLL_GUARD } }),
        ],
      }
    },
  }
}
