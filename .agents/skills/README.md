# 本仓库的 agent skills

这些 skill 随仓库提交，clone 到别处就能直接用——不需要重新下载。

## 目录

| Skill | 来源 | 说明 |
| --- | --- | --- |
| `obsidian-markdown/` | [kepano/obsidian-skills](https://github.com/kepano/obsidian-skills)（MIT） | Obsidian 原生语法参考：双链、嵌入、callout、属性、标签、公式、mermaid。讲的是**通用 Obsidian 怎么写** |
| `quartz-site/` | 本仓库自建 | **本站**（Quartz 5）的外观改动与渲染验证：主题机制、配色分层、截图取证流程、实测过的语法支持矩阵 |

两者的分工：写笔记不确定某个语法能不能用，先查 `quartz-site/references/SYNTAX.md`（实测表，含已知会坏的语法），再看 `obsidian-markdown`（写法参考）。

## 安装位置与发现顺序

- `.agents/skills/` — 通用位置，ZCode / Codex / OpenCode / Claude Code 等都会读取
- `.claude/skills/<名>` — 指向 `../../.agents/skills/<名>` 的**相对**符号链接，供 Claude Code 识别。相对路径保证换机器后仍然有效
- `skills-lock.json`（仓库根）— 记录第三方 skill 的来源与内容哈希，用于校验与重新拉取

## 第三方 skill 的维护

`obsidian-markdown` 是从上游 vendor 进来的（MIT 许可，版权归 kepano）。升级方式：

```bash
npx skills update            # 按 skills-lock.json 拉取最新版
# 或重新安装
npx skills add https://github.com/kepano/obsidian-skills --skill obsidian-markdown
```

升级后建议重跑一次 `quartz-site` 里的语法探针（见 `quartz-site/references/SYNTAX.md` 顶部的方法），确认上游新增的语法在本站是否真的渲染——上游是原生 Obsidian 的参考，本站是 Quartz，两者支持范围不同。

`quartz-site/` 是本仓库自己的，直接改即可。
