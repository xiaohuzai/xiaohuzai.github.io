# 小虎仔的小站

Obsidian vault + [Quartz 5](https://quartz.jzhao.xyz) 的数字花园。`content/` 文件夹本身就是一个 Obsidian vault：git pull 下来用 Obsidian 打开写作，日常在 `dev` 分支上提交，PR 合并进 `main` 后 GitHub Actions 自动构建，约一分钟后 [xiaohuzai.github.io](https://xiaohuzai.github.io) 就是新内容。

## 用 Obsidian 打开

建这个站的初衷就是「本地 Obsidian 写作，git push 发布」：`content/` 是一个完整的 Obsidian vault，数据始终是你本地的一堆 Markdown 文件，网站只是它的渲染视图，随时可以带着全部笔记迁走。

第一次使用：

1. `git clone https://github.com/xiaohuzai/xiaohuzai.github.io.git`
2. Obsidian → 打开仓库（Open folder as vault）→ 选择仓库里的 **`content/` 文件夹**（是 `content/`，不是仓库根目录）
3. 正常写作，然后在仓库根目录 `git push`（或在 Obsidian 里配 obsidian-git，见下文）

vault 的关键设置已随仓库提交（`content/.obsidian/app.json`），打开即用：

| 设置 | 值 | 效果 |
| --- | --- | --- |
| `attachmentFolderPath` | `attachments` | 粘贴的截图自动进 `attachments/`，不会散落各处 |
| `newLinkFormat` | `shortest` | `[[双链]]` 用最短路径——与站端 `crawl-links` 插件的解析规则一致，本地怎么写站上就怎么解析 |
| `alwaysUpdateLinks` | `true` | 重命名笔记时自动更新全库双链 |
| `useMarkdownLinks` | `false` | 双链保持 `[[wiki 风格]]`，不转成 `[]()` 链接 |

各台机器自己 churn 的状态（`workspace.json`、缓存）在 `.gitignore` 里，换电脑 clone 下来就是干净配置。

**哪些写法站上认**——写笔记完全按 Obsidian 习惯来，这些都 Quartz 会渲染（活例子见 `content/posts/2026-09-17-hello-world.md`，照抄即可）：

- `[[双链]]`、`![[整篇嵌入]]`、块引用，以及右侧的图谱和反链面板
- callout（`> [!tip]`）、`==高亮==`、`%%注释%%`（注释只留在本地，站上隐藏）
- mermaid、LaTeX 公式（行内 `$...$` 和块级 `$$`）、任务 checkbox
- `#标签`，frontmatter 的 `tags` / `aliases` / `description`（站上渲染成属性条）
- `.canvas` 白板和 `.excalidraw.md` 画板（站上可交互）
- frontmatter 加 `password: xxx` → 该页在站上加密（本地始终明文）
- YouTube / 视频链接自动嵌入播放卡片

**哪些不认**——社区插件产出的内容站上不渲染（Dataview 查询、看板之类）。它们留在库里自用完全没问题，只是不会出现在站上；站点承诺渲染的是 Obsidian 原生语法这一层。

## 日常写作循环

`main` 有分支保护（要求 PR，参照 browsa 的规则），日常开发都在 `dev` 上：

```bash
git switch dev
git pull                 # 开写前先拉
# …用 Obsidian 打开 content/ 编辑…
git add -A
git commit -m "写了一篇…"
git push
```

然后开一个 `dev → main` 的 PR（标题随意），等 CI 构建检查过了点 merge，合并即部署。攒几篇一起合也行，不必一篇一个 PR。

嫌手动麻烦，在 Obsidian 里装 [obsidian-git](https://github.com/Vinzent03/obsidian-git) 插件，配成改动即自动 commit/push 到 `dev`，写作循环退化成「只管写，想起来点一下 merge」。

## 本地预览（可选）

需要 Node ≥ 22：

```bash
npm ci
npx quartz build --serve    # http://localhost:8080，改文件自动刷新
```

不预览也行——push 上去让 CI 构建一样能看。

## 目录约定

| 位置 | 放什么 | 命名 |
| --- | --- | --- |
| `content/posts/` | 文章（完整表达，按时间流） | `YYYY-MM-DD-ascii-slug.md`，标题写在 frontmatter 的 `title`（中文随意） |
| `content/notes/` | 概念笔记（长期打磨的卡片） | 文件名直接用中文，`[[文件名]]` 双链引用 |
| `content/attachments/` | 图片等附件 | 随意（Obsidian 已配置粘贴默认进这里） |

frontmatter 常用字段：`title` / `date` / `tags`。posts 用 ASCII 文件名是因为 URL 会被分享，notes 用中文名是因为双链按文件名引用、写着自然。

全部写作语法（双链、callout、整篇嵌入、mermaid、公式）的活例子在 `content/posts/2026-09-17-hello-world.md`，照抄即可。

## 站点配置

- `quartz.config.yaml` — 主配置：站点标题、locale（zh-CN）、baseUrl、主题色、全部插件开关
- `.github/workflows/deploy.yml` — Pages 部署流水线：push/合并进 `main` 自动触发（也支持手动触发）
- `.github/workflows/ci.yml` — PR 构建检查：`dev → main` 的 PR 上先跑一遍完整构建
- 想改站点 UI 文案：`quartz/i18n/locales/zh-CN.ts`（跟随上游，一般不用碰）

以后若通过 `npx quartz plugin add` 装了 git 来源的插件（生成 `quartz.lock.json`），需要把 `npx quartz plugin install` 步骤加回 deploy.yml（参考 [Quartz hosting 文档](https://quartz.jzhao.xyz/docs/hosting)）；目前全部插件都是 npm 依赖，`npm ci` 已覆盖。

## 升级 Quartz

本仓库保留了 Quartz 上游的完整 git 历史，升级就是普通合并：

```bash
git fetch upstream          # 已配好指向 jackyzha0/quartz
git merge upstream/v5
# 我们自己改过的文件：quartz.config.yaml、.gitignore、.github/、README.md、package.json 头部
```

`docs/`、`Dockerfile`、`CODE_OF_CONDUCT.md` 是上游自带文件，留着可减少合并冲突，不用管。

## 致谢

基于 [Quartz](https://github.com/jackyzha0/quartz)（MIT）。Hugo 时代的旧骨架在 `legacy-hugo` 分支留档。
