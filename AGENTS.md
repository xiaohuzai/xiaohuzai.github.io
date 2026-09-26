# AGENTS.md

给 AI 助手的作业说明。**改笔记时按下面的清单逐项过一遍**，别只看一半。

站点的写作循环、目录约定、Obsidian 设置见 [README.md](README.md)，这里不重复。本文件只讲「改笔记/加笔记时怎么算改好了」。

**相关 skill（随仓库提交，在 `.agents/skills/`）**

| Skill | 什么时候看 |
| --- | --- |
| `quartz-site` | 改外观（主题、配色、布局、`local-plugins` 样式）、验证渲染结果、或想知道某个 Obsidian 语法在这个站上到底渲不渲染 |
| `obsidian-markdown` | 查 Obsidian 原生语法怎么写（第三方，kepano/obsidian-skills，MIT） |

下面第五节的「怎么验证」是速查版；**要动外观或做截图取证，看 `quartz-site` 的完整流程**（含可用的截图脚本与实测语法矩阵）。

## 关键路径

| 位置 | 是什么 |
| --- | --- |
| `content/` | Obsidian vault **同时是** Quartz 的内容根；笔记改动都在这 |
| `content/notes/` | 概念笔记，文件名即标题，`[[文件名]]` 引用 |
| `content/posts/` | 文章，`YYYY-MM-DD-ascii-slug.md`，标题在 frontmatter |
| `content/attachments/` | 图片附件 |
| `local-plugins/` | 站点样式/行为定制（**唯一**该放样式与构建改写的地方）；`mhchem-lite` 负责 `\ce{}` → KaTeX |
| `quartz/` | Quartz 上游源码，**不参与本站构建**，不要改 |
| `quartz.config.yaml` | 站点与插件总开关；外观主题见 `@quartz-themes/core` 的 `theme:` 与 `configuration.theme.colors`（换主题要两处一起改，见 README「外观主题」） |
| `.agents/skills/` | 随仓库提交的 skill：`quartz-site`（本站外观改动与渲染验证）、`obsidian-markdown`（第三方，Obsidian 语法参考）。**改外观或验证渲染前先看 `quartz-site`** |

## 一、渲染效果（Obsidian 和站点两边都要好看）

站点渲染规则来自 `quartz.config.yaml` 里启用的插件，改完必须**两边都过目**。

**结构**

- 标题必须独立成行、层级连续。**最常犯的错**：从大纲粘贴时标题被塞进有序列表项——`1. # 标题`、`2. ## 标题`。后果是站点的目录（TOC）漏掉这些标题、层级错乱（文末脚本会查，已在你 6 篇笔记里出现过）
- 正文里不要用 H1（页面标题由插件渲染）；文件里最小标题层级应为 `##`，子节 `###`
- 标题里不要整体加粗（`## **十、xxx**` → `## 十、xxx`）
- 一篇笔记如果通篇没有标题，站点的目录面板会是空的；按内容补 `## 小标题`（用原有句子概括，不加新内容）

**文字与标点**

- 中文语境的标点用全角：`，。：；（）“”`；ASCII 标点只留给代码、URL、数字、链接语法
- **加粗闭合的坑**：`**…**` 后面紧跟汉字时，如果闭合的 `**` 前一个字符是标点（`）`、`”`、`。`），CommonMark 不认它是闭合标记，站点会原样显示 `**`。写 `**…（…）**的过程` 要么留一个空格，要么让标点收尾
- 段落之间空一行。`hard-line-breaks` 插件已启用：**单个换行会渲染成 `<br>`**，所以不要把一句话折成两行
- 列表项之间不要留「只有空白的行」（会造成松散列表和多余空行）；`-` 项与 `1.` 项各自统一
- 表格第一行必须是真表头：**空表头（`|   |   |` + `|---|`）要把首行数据提上来当表头**，别让表头空着；一张表里只允许一条分隔行。写双链别名要转义：`| [[完整文件名\|显示文字]] |`（脚本会查）

**每篇开头的要点块**

- **课程/书页类笔记**在 `原文：` 之下、第一个 `##` 之前放一个「本节要点」块，让读者三秒知道这一页讲什么：

  ```markdown
  > [!note] 本节要点
  > - 第一条；
  > - 第二条；
  > - 第三条。
  ```

- 不超过 3 条，每条一句话，全角标点、末条以 `。` 收尾；要点从这一篇自己的内容里提炼（一般是开头的总纲加各节结论），**不引入笔记里没有的说法**
- 只用在课程/书页类笔记（一页一个）；整章文章那种长文笔记（`0 基础各种 knowhow`、`MIT Introductory Biology`）不加
- AlphaFold 课程的第 1–6 篇是现成范例

**公式与图**

- 行内公式 `$...$`；**块级必须写成独占多行的 `$$`**，写成一行会被当行内
- **化学式一律用渲染公式，不要用 `text` 代码块**。`\ce{...}` 可用（`local-plugins/mhchem-lite` 在构建时翻译成 KaTeX，Obsidian 那边 MathJax 本来就认），例：
  `$$\ce{R-NH2 + H+ <=> R-NH3+}$$`、`\ce{CH3-CH2-OH}`、`\ce{H2N-CH(R)-COOH}`、`\ce{Ca2+ + 2Cl- -> CaCl2}`
  - 写法要点：`->` `<-` `<=>` `<->` 是箭头，`-` 是化学键（自动转成连字符），`Ca2+` 是电荷、`NH3+` 是下标+电荷，`\ddot{N}` 这类 LaTeX 宏原样透传（画孤对电子用）
  - **`\pu{}`（物理单位）没有实现**，别用；单位照常写作正文（`约 80–100 kcal/mol`）
  - 转换器遇到不认识的写法会退化成直立方块并在构建时打 `[mhchem-lite]` 警告——看到警告就改写法，不要放着
- **二维结构式（带键线条的那种）KaTeX 画不了**：改用 `attachments/` 里的图片，或退成缩合式（`\ce{H2N-CH(R)-COOH}`）；不要把带竖线的 ASCII 结构图留在 `text` 块里
- 流程图/「A → B → C」的链条也别用 `text` 块：短链条写成加粗行内（`**目标功能 → 结构 → 序列**`），真流程用 mermaid
- mermaid 走本地镜像（无外网依赖），常规流程图/时序图可用；**mermaid 不支持化学结构**；流程图的边标签不要以 `+ ` 开头（会被当 markdown 列表报错）；**节点文本同理不要用裸 `+`**（`A((+))` 会渲染成 "Unsupported markdown: list" 错误节点，加法节点写 `A((⊕))`）；节点里换行用 `<br/>`
- 图片用相对路径 `attachments/xxx.png`；文件名避免空格和全角括号
- 裸 URL 会自动变成链接，`原文：https://…` 这种写法直接用

**站上认的 Obsidian 语法**（活例子：`content/posts/2026-09-17-hello-world.md`）

- 双链 `[[…]]`、别名 `[[…|…]]`、整篇嵌入、块引用、反链面板
- callout `> [!note]` / `> [!warning]`（渲染成带图标的提示框，实测可用）
- frontmatter 的 `tags` 渲染成属性条；`==高亮==`、`%%注释%%`（注释站上隐藏）
- 社区插件产出的内容（Dataview 等）站上不渲染；`.excalidraw.md` 由 excalidraw 插件接管，正文里的 `# Excalidraw Data` 之类是插件格式，不算问题

## 二、文档有没有错误

- **数字、单位、年份、人名、术语逐条核对**原始出处（笔记顶部一般有 `原文：` 链接）；对不上就修，拿不准就标注不确定
- 二手材料里的「示意性数字」要写明口径（例：讲稿说「75% 水」→ 标注这是帮助理解概念的示意，不是常数）
- 公式与正文描述必须一致；**上下标丢了要补**（`3^100`、`5×1047`、`10−13` 这类是 `$3^{100}$`、`$5\times10^{47}$`、`$10^{-13}$`）
- 找前后矛盾、重复段落、说了一半的句子
- 占位符和断句（`暂时无法在飞书文档外展示此内容`、`关系可以简化为：` 后面什么都没有）：要么补内容，要么换成 `> [!warning] 原文档的配图缺失` 之类的明确提示——不要留着一句让人看不懂的机器话

## 三、帮忙写 tag

- **先查现状再选，不要为同一个概念造近义标签**：`grep -rh -A6 "^tags:" content/notes | grep '  - ' | sort -u`。当前大致是 `生物`（各篇都挂）、`基础知识`、`AI制药`、`AlphaFold`、`Rosetta`、`工具`、`元`
- 标签不能含空格（Obsidian 会判为无效标签）：是 `AI制药`，不是 `AI 制药`
- 每篇 1–3 个：领域 + 层级/课程（例：`生物` + `AlphaFold`）
- 要新建标签时先跟用户说一声（会多出一个标签页）

## 四、帮忙做反链

- 一个课程/主题要有 MOC：`课程总览.md`，用一张表列出各节并双链到笔记
- 每篇笔记首尾加导航：`上一节：[[…]] · 下一节：[[…]] · [[…课程总览|课程总览]]`；同主题的一组笔记用一句 `相关笔记：[[A]]　·　[[B]]` 互相引用
- **双链写完整文件名**，别名用 `|`（例：`[[2. What is the protein folding problem?(什么是蛋白质折叠问题？)|什么是蛋白质折叠问题？]]`）
- 注意同名歧义：两个文件同名会让 `[[短名]]` 解析不确定——所以第二门课的 MOC 叫 `AlphaFold 课程总览.md` 而不是又一个 `课程总览.md`
- 目标：**没有孤儿页面**。每篇至少有一条入链（MOC、相邻篇或相关笔记），加完在站点右侧「反向链接」面板确认
- 双链会不会解析，构建后可以核对：解出来的 `href` 必须指向实际存在的 `.html`

## 五、改完怎么验证（必做）

```bash
npx quartz build                      # 构建，顺带看解析警告
npx quartz build --serve --port 8899  # 本地预览
```

- 浏览器里逐项看：**目录层级（两级树）、公式、表格、callout、mermaid（要看渲染出的 `<svg>`，不是原始文本）、浅色与深色**
- **窄屏（390px 宽）也要看一眼**：左侧文件树收成抽屉、顶部导航（文章/笔记/标签/GitHub）横排一行不换行。导航项被挤成竖排是因为 flex 压扁了，`local-plugins/links-nav` 里已用 `flex: 0 0 auto` + `white-space: nowrap` 锁住
- **改外观（`theme:`、`colors:`、插件 options）后必须重启 `--serve` 并重新截图**：改完不重启会看到旧样式，误判成「改了没用」
- `--serve` 的 watch 不复制新加/替换的图片 → 换过附件必须重跑一次完整 build
- **改了 `local-plugins/` 里的插件代码，必须重启 `--serve`**：watch 只重跑内容管线，插件模块在服务启动时就加载好了，不重启会一直用旧代码（症状：手动 `npx quartz build` 的产物是对的、浏览器里看到的还是旧的）
- **watch 模式会被「新建又改名/删除」的临时文件搞崩**（报 `Failed to process markdown …/未命名.md: ENOENT` 后进程退出）。这是 Obsidian 建新笔记时留下的，不是内容问题，重启 `--serve` 即可；崩过之后记得跑一次完整 build 补上产物
- 构建警告 `isn't yet tracked by git, dates will be inaccurate` 是因为新文件还没提交，日期回退到文件系统时间；提交后消失，不是错误

机械性的几类问题先跑脚本（会跳过 frontmatter、代码块、公式块，并屏蔽链接/代码/URL 里的合法半角符号，输出 `文件:行  [类型] 片段`）：

```bash
python3 - <<'PY'
import re, unicodedata, pathlib

CJK = r"\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u3040-\u30ff"
# 也掩掉 HTML 标签：<iframe title="中文"> 里的引号是语法，不是中文标点问题（标签外的照旧会报）
MASK = (r"<[^>]*>", r"`[^`]*`", r"\$[^$]*\$", r"\[\[[^\]]*\]\]", r"\[[^\]]*\]\([^)]*\)", r"https?://\S+")
def punct(c): return c and unicodedata.category(c).startswith("P")
bold = re.compile(r"(?<!\*)\*\*(?!\s)([^*\n]+?)(?<!\s)\*\*(?!\*)")
half = re.compile(r"[,:;?!()\"']")
CHEM = re.compile(r"[A-Z][a-z]?\d|→|⇌|->|<=>|[A-Z]\s*[—–→⇌-]\s*[A-Z]")

bad = 0
for p in sorted(pathlib.Path("content").rglob("*.md")):
    if set(p.parts) & {".obsidian", ".trash", "templates"} or p.name.endswith(".excalidraw.md"):
        continue                      # excalidraw 等插件文件由插件接管
    fence = in_fm = text_block = math_block = False
    FENCE = "`" * 3          # 不写成三个连续反引号，否则会截断本文档自己的代码块
    lines = p.read_text(encoding="utf-8").split("\n")
    for i, ln in enumerate(lines, 1):
        if i == 1 and ln.strip() == "---": in_fm = True; continue
        if in_fm:
            if ln.strip() == "---": in_fm = False
            continue
        if ln.strip() == "$$": math_block = not math_block; continue
        if math_block: continue
        if ln.lstrip().startswith(FENCE):
            if not fence:
                fence = True
                text_block = ln.strip()[len(FENCE):].strip().lower() in ("", "text", "plain")
            else:
                fence = False
            continue
        if fence:
            # 化学式/流程链应该用渲染公式，不要躺在 text 代码块里
            if text_block and CHEM.search(ln):
                report("代码块里的化学式", ln.strip()[:44])
            continue
        def report(kind, detail):
            global bad; bad += 1
            print(f"{p}:{i}  [{kind}] {detail}")
        if re.match(r"^\s*\d+\.\s+#{1,6}\s", ln):
            report("列表套标题", ln.strip()[:50])          # 站点 TOC 会漏掉这种标题
        if re.match(r"^#\s+\S", ln):
            report("正文 H1", ln.strip()[:50])              # 正文里不该有 H1
        for m in bold.finditer(ln):                        # **…（…）**的 → 站点显示字面 **
            if punct(ln[m.end()-3]) and re.match(f"[{CJK}A-Za-z0-9]", ln[m.end():m.end()+1] or ""):
                report("加粗闭合失效", ln[max(0,m.start()-12):m.end()+8])
        # 表格：空表头 / 多余分隔行（首行数据应提升为表头）
        nxt = lines[i] if i < len(lines) else ""
        if "|" in ln and re.match(r"^\s*\|?[\s:\-|]+\|?\s*$", nxt) and "-" in nxt:
            hdr = [c.strip() for c in ln.strip().strip("|").split("|")]
            if all(c == "" for c in hdr):
                report("空表头", ln.strip()[:40])
            rest = []
            for x in lines[i + 1:i + 30]:
                # 只在同一张表内找第二条分隔行：遇到空行或标题就停。
                # 否则相邻两张表（各自有表头）会被误报成"多余分隔行"
                if not x.strip() or x.lstrip().startswith("#"):
                    break
                rest.append(x)
            if any(re.match(r"^\s*\|?[\s:\-|]+\|?\s*$", x) and "-" in x for x in rest):
                report("多余分隔行", ln.strip()[:40])
        masked = ln
        for pat in MASK:
            masked = re.sub(pat, lambda m: " " * len(m.group(0)), masked)
        for m in half.finditer(masked):                    # 中文语境里的半角标点
            a, b = ln[m.start()-1:m.start()], ln[m.end():m.end()+1]
            if re.match(f"[{CJK}]", a or "") or re.match(f"[{CJK}]", b or ""):
                report("半角标点", ln[max(0,m.start()-16):m.end()+16])
print(f"\n共 {bad} 处")
PY
```

脚本只覆盖机械问题，**内容错误、tag 是否合适、有没有反链、渲染好不好看，仍然要人（或你）逐页判断**。

**脚本的已知盲区与误报**（别被它误导）：

- **方括号残留查不出来**：像 `[图3]（对应 Figure 9）` 这种机器残留不在检测范围内（屏蔽规则只吃掉 `[文字](半角括号)` 形式的链接，半角标点表也不含 `[]`）。这类要靠人眼过一遍
- **换引号要循环处理到稳定**：一行里出现**两对以上**直引号时，只替换一对的写法会漏。用 `while` 反复替换直到本行不再变化
- 脚本报出「你刚修好的问题」——先怀疑是**用户在你的编辑之间又改了同一个文件**，重新读一遍再动手

## 六、改外观（主题、配色、布局、样式）

对外观动手前**先看 `quartz-site` skill**，这里只列最要紧的三条：

- **换主题要三处同改**：`@quartz-themes/core` 的 `theme:`、`configuration.theme.colors`（否则 `config-palette` 会继续注入旧配色，看着像「换了没效果」）、`package.json` 依赖（CI 是 `npm ci`，不写进依赖会构建失败）
- **改了 `local-plugins/` 或配置后必须重启 `--serve`**：watch 不重载插件与配置，不重启就会拿旧样式下结论
- **先测量，再下结论**。不要凭一张截图断言渲染有问题——本次差点据此提交一个错误的"中文加粗失效"修复，实测墨量后才发现加粗一直正常，真正的问题是截图裁切坐标错位。判断字体/颜色用 `getComputedStyle`，判断元素是否存在要限定在正文 `<article>` 范围内（整页 HTML 里的 `<meta name="description">` 会把标记剥成纯文本，据此判断会得出错误结论）

## 红线

- **只改结构、标点、链接。** 正文的措辞、观点、数据以用户原文为准；发现内容错误先指出来，不擅自改写
- `quartz/` 目录不是构建链路的一部分，样式与行为改动一律放进 `local-plugins/`（每个插件是 `package.json` 带 `quartz.category` + 手写 ESM 的 `dist/index.js`）
- **提交、推送、开 PR、合并前先问**；`main` 有分支保护，PR 由用户点合并
- 用户的 Obsidian 可能同时开着同一个文件。写完告知改了哪些文件，避免编辑互相覆盖
