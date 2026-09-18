---
name: quartz-site
description: Use when changing THIS repository's site appearance or verifying that it renders correctly — switching the color theme, editing configuration.theme.colors or the palette, layout and plugin options, or local-plugins styles — and when checking rendered output (light/dark, narrow screens, tables, code, formulas, callouts) instead of trusting a screenshot. Also use when deciding whether a given Obsidian syntax actually renders on this Quartz site, since the site supports only a subset.
---

# 本站（Quartz 5）外观与渲染验证

这个仓库是「Obsidian vault + Quartz 构建」的站点。改笔记内容看 `AGENTS.md`；**改外观、改渲染行为、验证渲染结果，看这里**。

通用 Obsidian 语法参考在隔壁 `obsidian-markdown` skill（kepano 官方，`.agents/skills/obsidian-markdown/`）。那份讲的是原生 Obsidian 怎么写；本 skill 讲的是**哪些语法在这个站上真的渲染**、以及**怎么验证你改完确实生效**。

## 一、三个必须先知道的机制

**1. 主题由主题包决定，换主题要三处同改**

主题来自 `@quartz-themes/core` 的 `options.theme`（当前 `flexoki`）。换主题必须同时：

| 改哪里 | 为什么 |
| --- | --- |
| `quartz.config.yaml` → `options.theme` | 决定用哪个主题包 |
| `quartz.config.yaml` → `configuration.theme.colors` | 见下面第 2 条 |
| `package.json` 依赖（`npm install @quartz-themes/<名>`） | CI 与部署都跑 `npm ci`，没写进依赖会构建失败 |

主题色值可以从 `node_modules/@quartz-themes/<名>/theme.json` 里查，或在浏览器里读 `getComputedStyle(document.documentElement).getPropertyValue('--light')` 等变量拿到实际值。

**2. 配置里的 colors 会压过主题自带的调色板**

`local-plugins/config-palette` 把 `configuration.theme.colors` 以**无 layer** 的样式注入，而无 layer 声明优先于任何 `@layer`（主题包的调色板在 `@layer obsidian-theme` 里）。所以只改 `theme:` 不改 `colors:`，看到的是「新主题的排版 + 旧主题的配色」，很容易误判成「换了没效果」。

反过来，这也是保留「改配置即生效」这个开关的原因——想临时微调配色直接改 `colors:` 即可。

**3. `--serve` 不会重载插件代码和配置**

watch 只重跑内容管线。改动 `local-plugins/`、`quartz.config.yaml` 之后必须重启 `--serve`，否则浏览器里一直是旧样式，会误判成「改了没用」。验证插件类改动时，先 `npx quartz build` 看产物，再重启预览。

## 二、标准流程

```bash
npx quartz build                      # 先构建，看有没有警告
npx quartz build --serve --port 8899  # 本地预览（改配置/插件后必须重启）
```

然后**截图取证**，不要只靠肉眼扫一眼：

```bash
node .agents/skills/quartz-site/scripts/render-shots.mjs \
  --out /tmp/shots \
  --page notes/ai4s/0-基础各种-knowhow/分子.html \
  --target "now=file:///Users/yan.huang/work/xiaohuzai.github.io/public"
```

每个 target 会出亮/暗两张 PNG，并拼一张对比版式图。多个 `--target` 就是横向对比（例如多个主题的构建产物）。

**批量对比多个主题**的做法：

```bash
# 1) 一次性装齐所有候选（见「坑」第 1 条，不要分开装）
npm install --no-save @quartz-themes/minimal @quartz-themes/catppuccin ...
# 2) 逐个改 theme: 并构建到独立目录
npx quartz build -o public-<主题名>
# 3) 用 render-shots.mjs 批量截图拼版
```

对比期间要临时把 `config-palette` 设为 `enabled: false`，否则所有主题显示的都是同一套 `colors:` 配色，对比没有意义。

## 三、什么算「改好了」

- **亮色与暗色都要看。** 只验证一种模式是最常见的漏检
- **窄屏（约 390px 宽）也要看**：左侧文件树应收回抽屉，顶部导航（文章/笔记/标签/GitHub）应横排一行不换行
- **技术内容要专门看一遍**：表格边框与表头、代码块、行内/块级公式、callout、mermaid（要确认渲染出 `<svg>` 而不是原始文本）
- **反向链接面板**：新增或改名的笔记，确认它的入链在其它页面上显示出来了
- 构建后的站内 `href` 要指向实际存在的 `.html`（双链没解析出来会留下死链）

## 四、判定渲染问题的方法论（重要）

**先测量，再下结论。** 这次的教训：一度根据一张截图断言「中文加粗失效」，还写好了修复——用像素墨量做对照后发现加粗一直是正常的（400→600 墨量增长 29.7%），真正的问题是**截图裁切坐标错位**造成的错觉。差点提交一个错误的"修复"。

要判断渲染差异时，用可量化的办法：

- **字体/颜色**：`getComputedStyle` 读实际生效的值，别猜 CSS 谁赢了
- **字形粗细/密度**：用 canvas 画同一段文字统计非白像素（脚本化对照）
- **元素是否存在**：查**正文 `<article>` 范围内**的 HTML。整页 HTML 里还有 `<meta name="description">`，它会把标记剥掉只剩纯文本，据此判断会得出错误结论（我在探针验证时就先踩了这个）
- **断言「原文没有某内容」之前要用浏览器打开确认**：EBI 那类课程页用 JS 渲染 Mol\* 3D 视图，纯 HTML 抓取里看不到，据此断言「原文缺配图」是错的

## 五、踩过的坑清单

1. **`npm install --no-save` 装的包会被挤掉**：`@quartz-themes/core` 在主题包缺失时会自己跑 `npm install <主题>`，而那条命令会 prune 掉所有 `--no-save` 装的包，导致后续主题构建莫名其妙失败。要对比多个主题就**一次性装齐**（一条命令），或把它们写进 `package.json`。
2. **`public-*` 已在 `.gitignore` 里**（`public-*/`），对比用的产物不会被提交，放心构建。
3. **`--serve` 的 watch 不复制新加/替换的图片**，换过附件必须重跑一次完整 `npx quartz build`。
4. **`--serve` 会被「新建又改名/删除」的临时文件搞崩**（`Failed to process markdown …/未命名.md: ENOENT` 后进程退出）——这是 Obsidian 建新笔记留下的，不是内容问题，重启即可，崩过之后补跑一次完整构建。
5. **构建警告 `isn't yet tracked by git, dates will be inaccurate`** 只是新文件没提交、日期回退到文件系统时间，不是错误。
6. **改了 `local-plugins/` 里插件的代码必须重启 `--serve`**（同机制 3）。
7. 用无头浏览器截图时，**`clip` 坐标要在滚动之后再取**。先取坐标再滚动会导致裁切错位，得出完全错误的视觉结论。
8. macOS 的 `cat` 是 BSD 版，**没有 `-A` 参数**；要查字节/不可见字符用 `python3` 读 `repr()`。
9. **别把颜色假设写进运行时补丁。** `graph-links` 原本判断"淡灰连线"用 `max-min <= 12`，即假定连线是**中性灰**；换成 Flexoki 后 `--lightgray` 变成暖灰 `#F2F0E5`（差值 13），被当作"带色调的颜色"跳过，连线重新变得看不见。**换主题后必须复查所有依赖颜色判定的本地插件**（`graph-links`、`toc-tree`、任一写了颜色阈值的注入样式）。正确做法是**直接读 CSS 变量比对**（`getComputedStyle(...).getPropertyValue("--lightgray")`），而不是猜色相/饱和度——带色调的灰是常态。
10. **避免在页面里直接改 `saved-theme` 属性来"切换主题"做测试**：那样不会派发 `themechange` 事件，带缓存的补丁会保持旧值，测出假结果。要么点真实的主题切换按钮，要么新建 context 并预设好主题。用真实按钮能顺带验证事件监听本身是对的。

## 参考

- `references/SYNTAX.md` — **实测过的** Obsidian 语法支持矩阵：哪些在站上正常、哪些会坏。写笔记前不确定某个语法能不能用，先查这张表
- `scripts/render-shots.mjs` — 无头浏览器批量截图 / 拼版对比
- 仓库根 `AGENTS.md` — 改笔记的清单与红线
- `README.md` 的「外观主题」一节 — 换主题的操作步骤
