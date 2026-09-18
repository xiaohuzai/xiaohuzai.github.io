# Obsidian 语法在本站的实际支持情况（实测）

通用语法写法见隔壁 `obsidian-markdown` skill。**这张表只记「这个站真的渲染成什么」**——原生 Obsidian 支持不等于 Quartz 支持。

**验证方法**：把一个临时 `.md` 放进 `content/`，用探针构建到独立目录，检查**正文 `<article>` 范围内**的 HTML，然后删掉临时文件：

```bash
# content/_syntax-probe.md 里放待验证的语法
npx quartz build -o /tmp/probe-out
python3 - <<'PY'
import re, pathlib
s = pathlib.Path("/tmp/probe-out/_syntax-probe.html").read_text(encoding="utf-8")
m = re.search(r'<article[^>]*>(.*?)</article>', s, re.S)   # 必须限定在 article 内
body = m.group(1) if m else s
print('目标标记存在:', '目标标记' in body)
PY
rm -f content/_syntax-probe.md && npx quartz build   # 收尾：清掉探针并重建
```

> 注意：整页 HTML 里还含 `<meta name="description">`，它会把所有标记剥成纯文本。**只搜整页会得出错误结论**（比如看不出 `==高亮==` 用的是什么标签）。务必限定在 `<article>` 内。

**实测基准**：Quartz 5.0.0，2026-09-18，配置见 `quartz.config.yaml`。

## 支持良好

| 语法 | 站上渲染成 | 备注 |
| --- | --- | --- |
| `[[双链]]` / `[[名\|别名]]` | 站内链接 | 用完整文件名，别名用 `\|` |
| `![[图片.png]]` | `<img>` | |
| `![[图片.png\|200]]` | `<img width="200">` | 指定宽度可用 |
| `![[整篇笔记]]` | 内嵌内容 | |
| `^block-id` + `[[#^block-id]]` | 锚点 + 锚点链接 | 块引用完整可用（配置里 `parseBlockReferences: true`） |
| `> [!note]` 等 callout | callout 块 | |
| `> [!note]-` / `+` | `is-collapsible` / `is-collapsed` | **可折叠 callout 可用** |
| `[^1]` + `[^1]: …` | `<sup>` 引用 + 文末 Footnotes 区 | 标准脚注可用 |
| `#标签` | 标签页链接 | |
| `#父/子` | `/tags/父/子` 页面 | **嵌套标签可用**，会真的生成子级标签页 |
| `%%注释%%` | 完全移除 | 不会出现在产物里 |
| `==高亮==` | `<span class="text-highlight">` | **不是 `<mark>`**，按 `mark` 去查会误判成"不支持" |
| `$…$` / `$$…$$` | KaTeX | 见下方"化学式"一条 |
| ` ```mermaid ` | `<svg>` | 用离线插件渲染 |
| 任务列表 `- [ ]` | checkbox | |
| 表格、标题、列表、加粗、斜体、引用 | 标准输出 | |

## 已知会坏 / 需注意

| 语法 | 实际行为 | 怎么办 |
| --- | --- | --- |
| **行内脚注 `^[文字]`** | **破损**。渲染成 `<p id="[行内脚注内容]。">` 这样的垃圾段落，脚注本身丢失 | **不要用**，改用标准脚注 `[^1]` + `[^1]: …` |
| `\ce{…}`（mhchem 化学式） | 构建链路的 KaTeX 没注册 mhchem，直接写会渲染成红色的 `\ce` | 本站有 `local-plugins/mhchem-lite` 在解析前把 `\ce{}` 翻译成等价 KaTeX；Obsidian 端 MathJax 本来就认，两边都能看 |
| 标题被塞进列表项（`1. # 标题`） | 站点的目录（TOC）会漏掉这个标题、层级错乱 | 标题必须独立成行。见 `AGENTS.md` |
| 加粗闭合处紧跟中文（`**…（…）**然后`） | CommonMark 的 flanking 规则导致 `**` 不闭合，页面上显示字面星号 | 闭合 `**` 后加空格，或改写句子。见 `AGENTS.md` |
| 表头行是空的（`\| \| \|`） | 表格渲染异常 | 把首行数据提升为表头。见 `AGENTS.md` |
| 社区插件产物（Dataview、看板等） | 不渲染 | 站点的承诺范围只有 Obsidian 原生语法 |

## 注意这类"看起来坏了其实没坏"的情况

- `==高亮==` 渲染成 `<span class="text-highlight">` 而不是 `<mark>`
- `<strong>` 的字体栈只有 `"Source Sans Pro"`（无中文字形），中文回退到系统字体——**这是正常的**，实测 400→600 字重墨量增长约 30%，加粗可见。不要据此判断"加粗失效"
- 新文件构建警告 `isn't yet tracked by git, dates will be inaccurate` 是日期回退，不是错误

## 升级 Quartz 或换插件后

上面的结论是实测快照，会随 Quartz 与插件升级变化。改过 `quartz.config.yaml` 里的插件开关、或 `git merge upstream/v5` 之后，**建议用上面的探针方法重跑一遍**，尤其确认那两个"已知会坏"的条目是否仍然如此。
