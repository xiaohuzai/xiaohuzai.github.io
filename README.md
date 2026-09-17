# 小虎仔的小站

Obsidian vault + [Quartz 5](https://quartz.jzhao.xyz) 的数字花园。`content/` 文件夹本身就是一个 Obsidian vault：git pull 下来用 Obsidian 打开写作，push 之后 GitHub Actions 自动构建，约一分钟后 [xiaohuzai.github.io](https://xiaohuzai.github.io) 就是新内容。

## 日常写作循环

```bash
git pull                 # 开写前先拉
# …用 Obsidian 打开 content/ 编辑…
git add -A
git commit -m "写了一篇…"
git push                 # push 即部署
```

嫌手动麻烦，在 Obsidian 里装 [obsidian-git](https://github.com/Vinzent03/obsidian-git) 插件，配成改动即自动 commit/push，写作循环退化成「只管写」。

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
- `.github/workflows/deploy.yml` — Pages 部署流水线（repo 的 Pages 源已设为 GitHub Actions，无需再动设置）
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
