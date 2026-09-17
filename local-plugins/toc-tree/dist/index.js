// 目录插件（@quartz-community/table-of-contents）输出的是平铺 <li>，
// 只带 depth-0/1/2… 类名，默认仅 1rem 缩进、字号与颜色完全一致，
// 所以不同级标题在视觉上看不出层级。这里注入一段样式，把层级做成树：
// 顶层加粗，子层缩进 + 左侧引导线 + 更小字号 + 更淡颜色（悬停/阅读到该节时恢复）。
// 注意：quartz/styles/custom.scss 在当前 Quartz 5 里没有接入构建，所以走插件注入。
const TOC_TREE_CSS = `
.toc-content.overflow > li.depth-0 > a { font-weight: 600; opacity: 0.5; }
.toc-content.overflow > li.depth-0 > a.in-view { opacity: 0.95; }

.toc-content.overflow > li.depth-1,
.toc-content.overflow > li.depth-2,
.toc-content.overflow > li.depth-3 {
  margin-left: 0.3rem;
  padding-left: 0.7rem;
  border-left: 1px solid var(--lightgray);
}
.toc-content.overflow > li.depth-1 > a,
.toc-content.overflow > li.depth-2 > a,
.toc-content.overflow > li.depth-3 > a { font-size: 0.93rem; font-weight: 400; opacity: 0.45; }
.toc-content.overflow > li.depth-1 > a.in-view,
.toc-content.overflow > li.depth-2 > a.in-view,
.toc-content.overflow > li.depth-3 > a.in-view { opacity: 0.85; }

.toc-content.overflow > li.depth-2 { margin-left: 1.3rem; }
.toc-content.overflow > li.depth-2 > a { font-size: 0.89rem; }

.toc-content.overflow > li.depth-3 { margin-left: 2.3rem; }
.toc-content.overflow > li.depth-3 > a { font-size: 0.86rem; }
`

export function TocTree() {
  return {
    htmlPlugins() {
      return []
    },
    externalResources() {
      return {
        css: [{ content: TOC_TREE_CSS, inline: true }],
      }
    },
  }
}