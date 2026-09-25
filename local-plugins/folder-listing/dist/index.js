// 文件夹自动列表页（@quartz-community/folder-page 输出的 .page-listing）目前只有
// Flexoki 主题给的少量颜色规则，没有任何布局，裸出来的效果是：
//   · h3 标题字号巨大；日期列窄到「2026年9月25日」折成两行；
//   · 标签胶囊带着 ul 默认的圆点 marker 悬在行尾，与标题错位；
//   · 子文件夹渲染成一个没有内容的孤立标题行。
// 这里注入布局样式：标题在左、日期靠右（不换行、缩小变淡）、标签收进第二行、
// 行间用分隔线组织。颜色全部走主题变量，浅色深色自适应。
// 与 toc-tree 同理：quartz/styles/custom.scss 未接入构建，样式只能从插件注入；
// 无 layer 的注入优先级高于主题包 @layer 里的规则。
const FOLDER_LISTING_CSS = `
.page-listing > p {
  color: var(--gray);
  font-size: 0.85rem;
  margin: 0 0 1.1rem;
}

.page-listing ul.section-ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.page-listing li.section-li {
  border-bottom: 1px solid var(--lightgray);
  list-style: none;
  margin: 0;
  padding: 0.55rem 0.1rem;
}
.page-listing li.section-li:last-child {
  border-bottom: none;
}

.page-listing li.section-li .section {
  align-items: baseline;
  column-gap: 1rem;
  display: flex;
  flex-wrap: wrap;
}
.page-listing li.section-li .section .desc {
  flex: 1 1 auto;
  min-width: 0;
  order: 1;
}
.page-listing li.section-li .section .desc h3 {
  font-size: 1.02rem;
  font-weight: 600;
  margin: 0;
}
.page-listing li.section-li .section .meta {
  color: var(--gray);
  flex: 0 0 auto;
  font-size: 0.78rem;
  margin: 0;
  order: 2;
  white-space: nowrap;
}
.page-listing li.section-li .section ul.tags {
  display: flex;
  flex: 1 1 100%;
  flex-wrap: wrap;
  gap: 0.2rem 0.45rem;
  list-style: none;
  margin: 0;
  order: 3;
  padding: 0;
}
.page-listing li.section-li .section ul.tags > li {
  list-style: none;
}
`

export function FolderListing() {
  return {
    htmlPlugins() {
      return []
    },
    externalResources() {
      return {
        css: [{ content: FOLDER_LISTING_CSS, inline: true }],
      }
    },
  }
}
