# 在笔记里嵌交互式 3D 结构（Mol\*）

结论先说：**能嵌，而且站点和 Obsidian 可以用同一段 HTML。** 下面是实测过的两种做法、各自的代价，以及踩过的坑。

原始参考是 EMBL-EBI 的 AlphaFold 课程页面：它用 `molstar.Viewer.create(...)` 内联 Mol\*，再把一个 `state` 对象 `btoa` 成 `.molj` 快照塞进 `data:` URL 加载（快照里同时带了 AFDB 预测 `AF-Q818B4-F1-model_v6.bcif` 和晶体结构 `7vgm.bcif`）。我们不必照抄整套快照，用 API 直接加载更短。

## 一、站点：两种做法

### A. iframe（零成本、零维护）

```html
<iframe src="https://molstar.org/viewer/?afdb=Q818B4&hide-controls=1&collapse-left-panel=1" width="100%" height="420" style="border:0"></iframe>
```

Mol\* 官方托管的 viewer 支持一串 URL 参数（源码就在 `https://molstar.org/viewer/` 的 HTML 里，可随时复查）：

| 参数 | 作用 |
| --- | --- |
| `pdb=` / `afdb=` / `emdb=` / `pdb-ihm=` / `model-archive=` | 按库加载，内部会自己解析格式 |
| `structure-url=` + `structure-url-format=` + `structure-url-is-binary=1` | 任意 URL |
| `url=` + `url-format=` + `url-is-binary=1` | 同上，别名 |
| `snapshot-url=` + `snapshot-url-type=molj` | 载入快照（EMBL 那套的等价物） |
| `mvs-url=` / `mvs-data=` | MolViewSpec 声明式场景 |
| `hide-controls=1` / `collapse-left-panel=1` | **正文栏里必须加**，见下面的坑 |

代价：多一个第三方运行时依赖；页面自带 Cloudflare Analytics 和 `web3dsurvey.com` 的 1×1 统计 iframe；viewer 自己的浅色背景**不会**跟随站点暗色模式（实测亮色背景 `rgb(224-255)` 在暗色页面上仍是亮块）。

### B. inline Mol\*（可控，能和主题联动）

```html
<div id="molstar-app" style="height:420px;position:relative;border:1px solid var(--lightgray);border-radius:6px;overflow:hidden"></div>
<script src="https://molstar.org/viewer/molstar.js"></script>
<script>
(function () {
  function bgInt() {
    var v = getComputedStyle(document.documentElement).getPropertyValue('--light').trim();
    if (v[0] === '#') return parseInt(v.slice(1), 16);
    var m = v.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
    return m ? (parseInt(m[1]) << 16) + (parseInt(m[2]) << 8) + parseInt(m[3]) : 0xffffff;
  }
  molstar.Viewer.create('molstar-app', {
    layoutShowControls: false, layoutIsExpanded: false, viewportShowControls: false,
    viewportShowExpand: false, viewportShowSettings: false, viewportShowSelectionMode: false,
  })
    .then(function (v) { window.__v = v; return v.loadAlphaFoldDb('Q818B4') })
    .then(function () {
      window.__v.plugin.canvas3d.setProps({ renderer: { backgroundColor: bgInt() } });
      document.addEventListener('themechange', function () {
        setTimeout(function () { window.__v.plugin.canvas3d.setProps({ renderer: { backgroundColor: bgInt() } }) }, 300);
      });
    });
})();
</script>
```

- `loadAlphaFoldDb(id)` / `loadPdb('7vgm')` 走库的接口，**格式由它内部决定**——这是关键，见下面的坑。
- `plugin.canvas3d.setProps({renderer:{backgroundColor}})` 把画布底色设成站点当前底色，`themechange`（darkmode 插件派发）时重设一次，明暗两态都能融进页面。实测亮色 `#FFFCF0`、暗色 `#100F0F` 均生效。
- `molstar.js` 本体 **5.0 MB（gzip 约 1.45 MB）**，只在带这段的页面加载；结构文件本身只有几十 KB。要不要自托管看是否愿意多一份第三方依赖（托管页有统计脚本，`molstar.js` 本体没有）。
- Quartz 会保留原始 HTML：管线是 `remarkRehype { allowDangerousHtml: true }`（`quartz/processors/parse.ts`），并且 `quartz/util/jsx.tsx` 专门给 `script` 做了 `dangerouslySetInnerHTML` 处理，所以 notes 里的 `<script>` 在产物里**会执行**（实测产物中 iframe / div / script 三者都在）。

## 二、Obsidian：同一段 iframe 就能用

Obsidian 的 sanitizer 配置（`/Applications/Obsidian.app/Contents/Resources/obsidian.asar`，导出为 `sanitizeHTMLToDom`）是：

```js
{ ALLOW_UNKNOWN_PROTOCOLS: true, RETURN_DOM_FRAGMENT: true,
  FORBID_TAGS: ["style"], ADD_TAGS: ["iframe"],
  ADD_ATTR: ["frameborder","allowfullscreen","allow","sandbox","data-tooltip-position"] }
```

`iframe` 是**显式加进白名单的**，所以上面 A 方案那段 HTML 直接粘进笔记，阅读视图里就能看到 3D 结构；`<script>` 会被剥掉（因此 B 方案在 Obsidian 里不可行，只有 iframe 这条路）。

注意：

- 只在**阅读视图**生效，实时预览不渲染 HTML。
- 需要联网（viewer 与结构文件都在远端）。
- 想离线看本地 `.cif/.pdb`，可考虑社区插件 **ChemRender3D**（`ruzx/chemrender3d`，MIT，内部就是 Mol\* 4.18）——但它是未经官方人工审核的插件、装机量极低，装之前自己评估。

## 三、想一次装多条结构：MVS 路线（能跑，但有硬限制）

托管 viewer 支持用 **MolViewSpec**（MVS）声明式地描述场景，`mvs-data=<URL 编码的 JSON>` 就能一次装两条结构。JSON 的形状有讲究，这个 bundle 实测只接受下面这一种：

```json
{ "metadata": { "version": "1.0.0" }, "root": { "kind": "root", "children": [
  { "kind": "download", "params": { "url": "https://.../AF-Q818B4-F1-model_v6.cif" },
    "children": [{ "kind": "parse", "params": { "format": "mmcif" },
      "children": [{ "kind": "structure", "params": { "type": "model" },
        "children": [{ "kind": "component", "params": { "selector": "polymer" },
          "children": [{ "kind": "representation", "params": { "type": "cartoon" },
            "children": [{ "kind": "color", "params": { "color": "#2b7fd0" } }] }] }] }] }] }] }] }
```

节点种类只有：`camera canvas clip color component coordinates download focus instance interpolate label opacity parse primitive primitives representation source transform uri`。踩到的三个限制：

1. **版本号必须在 `metadata.version` 里。** 写成顶层 `{"version":"1.0.0","root":...}` 会报 `Version should be a string, not undefined` + `Loaded MVS does not contain valid version info.`，画布全空。
2. **参数是白名单校验收紧的。** `download` 只认 `url`（多传 `format` → `Unknown parameter "format"`）；`color` 只认 `color`（多传 `kind` → `Unknown parameter "kind"`），所以**没法用 MVS 指定 pLDDT/uncertainty 这类按属性上色**，只能给统一色。
3. **没有叠合（superposition）。** 节点列表里没有对齐/叠合节点，两条坐标框架不同的结构会**并排**摆着，不会叠在一起。EMBL 那个 Figure 11 的叠合效果是他们把 `.molj` 快照（含变换与配色）一起发出来实现的，靠 URL 参数复刻不了。要让两条真正叠合，得自己在内联方案里算变换矩阵，或者直接用他们的快照。

另外 MVS 会多出 Mol\* 的 state 快照控件（`msp-state-snapshot-viewport-controls`，界面上是个带时间戳的 `[1/1] … [▶]` 条），`?afdb=` 这种单结构加载方式没有这个控件。托管 viewer 也**没有**关掉右上角那排视口按钮（Reset Zoom / Orient Axes …）的 URL 参数——`hide-controls=1` 只管右侧的 Structure Tools 面板。

## 四、坑（都是实测踩出来的）

1. **正文栏宽度会把视口挤成 0。** 托管 viewer 默认展开左（Structure，约 290px）和右（Structure Tools，约 283px）两个面板；本站正文栏在 1280 宽的桌面视口下只有 582px，两个面板正好吃光，3D 视口宽度变成 0——看起来"加载了但没画面"。必须带 `hide-controls=1&collapse-left-panel=1`。别用 `?afdb=` 单参数就下结论。
2. **`loadStructureFromUrl` 的格式名是陷阱。** `structure-url-format=bcif` 直接报 `unknown data format name 'bcif'`；参数里写 `'bcif'` 或 `'mmcif'` 也都失败。更坑的是**不传格式时 Promise 照样 resolve**，只有 console 里报 `Unexpected token. Expected data_, loop_, or data name.`（拿文本 CIF 解析器去吃二进制）。于是"加载完成"的标志位是 true、画布却是空白 —— 这就是为什么必须验像素，见 `SKILL.md` 第四节。用 `loadAlphaFoldDb(id)` / `loadPdb(id)` 绕开格式名。
3. **别用截图判断嵌进来了没有。** 空白画布和渲染好的画布在低分辨率缩略图里都像"一块灰"。用 `scripts/render-shots.mjs` 出图后，对元素区域做像素统计：渲染成功会有上百个颜色桶并把主体色压到 90% 左右，空白画布只有几十个桶且单一颜色接近 100%。
4. **headless Chromium 默认没有 WebGL**，Mol\* 会直接空白。启动参数要带 `--enable-unsafe-swiftshader --use-gl=angle --use-angle=swiftshader`，否则测出来的"失败"是假的。
5. **探针服务要确认真的绑上了端口。** 本机的 `--serve` 常驻在 8899，随手 `python3 -m http.server 8899` 会静默失败（`Address already in use`）而 curl 照样 200——你测的其实是用户正在跑的站点，会得出"内容没生效"的错误结论。选冷门端口并检查启动日志。
6. **别直接写 `saved-theme` 测暗色**（会绕过 `themechange`，缓存与背景都不刷新），点真实的暗色切换按钮。
7. 探测渲染时用 `npx quartz build -d <临时目录> -o <临时输出>` 就能在 `/tmp` 下整站验证，**不碰 `content/`**，不会和同时开着的 Obsidian 打架。
8. **`fullPage: true` 的整屏截图会把嵌进去的结构截成空白。** 全页截图会触发视口尺寸变化，Mol\* 的 WebGL 画布重排后这一帧还没画完，于是"章节截图里是一块空的格子"——很容易误判成没嵌进去。正确做法：先 `scrollIntoView`，用**视口坐标** `clip` 截图（不要 `fullPage`），并等几秒让画布重绘。用元素级 `elementHandle.screenshot()` 也正常。
9. **暗色模式下 iframe 里的画布不会跟着变暗。** 托管 viewer 的背景色是它自己的，`?afdb=` 这类加载在 Flexoki 暗色页面上就是一块亮色面板（想让它跟随主题只有内联方案那条路）。当前取舍是接受它——交互式结构查看器自带浅底，视觉上和一个"工具面板"差不多。

## 五、本仓库当前用法

第 6 篇 `6. How accurate are AlphaFold 2 structure predictions?.md` 的「四、页面里的 Figure 11」用的是 A 方案的简化版：

```html
<div style="height:440px">
<iframe src="https://molstar.org/viewer/?afdb=Q818B4&hide-controls=1&collapse-left-panel=1" style="width:100%;height:100%;border:0;border-radius:6px" title="苯丙氨酸羟化酶 AlphaFold 模型 AF-Q818B4-F1"></iframe>
</div>
```

选它的理由：iframe 在 **Obsidian 阅读视图里也能显示**（笔记主要在 vault 里读），而内联方案在 Obsidian 只会留一个空 div；`?afdb=` 单结构加载既没有 MVS 那个状态条，也是唯一能免费拿到 **pLDDT 上色**的路径。原文 Figure 11 的"灰色 7VGM 叠合对比"复刻不了（见第三节第 3 条），所以图注里点明这一点，把叠合留给原文。
