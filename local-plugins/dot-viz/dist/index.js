// 把 ```dot（Graphviz）代码块在浏览器端渲染成 SVG。
//
// 为什么：Obsidian 侧装了 graphviz 插件后，笔记里的 dot 源码两边共用；站点侧
// mermaid 表达不了 Graphviz 的分簇（cluster）、自由回流边这些能力，所以内置
// viz.js（Graphviz 编译成 WASM，二进制已内嵌进 JS 单文件）放在站内
// /static/viz/viz.esm.js（源文件 quartz/static/viz/viz.esm.js，与 mermaid 镜像
// 同一摆放方式），无外网依赖。
//
// 渲染时机：站点是 SPA（micromorph 替换正文），所以挂在 nav 事件上——站内跳转
// 和首次加载（spa.inline.ts 启动时也会派发一次 nav）都会触发；再挂 DOMContentLoaded
// 兜底 SPA 被关的情形。dataset 标记防止重复渲染。
//
// 深浅色：Graphviz 默认描边/文字是 #000000，暗色主题下会隐形。渲染后把恰好等于
// #000000 的 fill/stroke 换成 currentColor，由 CSS 按主题给色（--dark / --light）；
// dot 源码里显式指定的其它颜色一律不动。graphviz 写死的 font-family 一并去掉，
// 让图随正文字体（--bodyFont）。
//
// 失效安全：viz 加载失败、dot 语法错误、页面结构对不上，都只是保留原始代码块 +
// console 警告，不影响页面其它行为。
import { h } from "preact"

const DOT_VIZ_CSS = `
.dot-graph{display:flex;justify-content:center;padding:.5rem 0 1rem;overflow-x:auto}
/* --dark 在本站两套主题下都是"文字色"（Flexoki 亮=#100f0f 暗=#cecdc3，实测），
   所以 currentColor 不用按主题切换；别用 --light，那是背景色，暗色下会把描边隐形 */
.dot-graph svg{max-width:100%;height:auto;color:var(--dark);font-family:var(--bodyFont)}
`

const DOT_VIZ_JS = `(function () {
  if (window.__dotVizLoaded) return;
  window.__dotVizLoaded = true;

  var vizPromise = null;
  function getViz() {
    if (!vizPromise) {
      vizPromise = import("/static/viz/viz.esm.js")
        .then(function (m) { return m.instance(); })
        .catch(function (e) { vizPromise = null; throw e; });
    }
    return vizPromise;
  }

  // graphviz（内嵌的是 16.x）默认输出命名色：黑描边/文字 = "black"，白底/白填充 =
  // "white"（整张图的底板、cluster 的底都是白填充）。
  //   black → currentColor：由 CSS 按主题给色（--dark / --light）
  //   白填充 → none：透明，跟随页面背景，免得暗色主题下整块白板
  //   （白描边不动——暗色底下刻意要白线是用户的事）
  // dot 源码里显式指定的其它颜色一律不动。text 元素没有 fill 属性时默认纯黑、
  // 不随 currentColor，要补上。graphviz 写死的 font-family 去掉，图随正文字体。
  var BLACK = /^(black|#000000)$/i;
  var WHITE = /^(white|#ffffff|#fff)$/i;

  function themize(svg) {
    var els = [svg].concat(Array.prototype.slice.call(svg.querySelectorAll("*")));
    els.forEach(function (el) {
      ["fill", "stroke"].forEach(function (attr) {
        var v = el.getAttribute(attr);
        if (!v) return;
        if (BLACK.test(v)) el.setAttribute(attr, "currentColor");
        else if (WHITE.test(v) && attr === "fill") el.setAttribute(attr, "none");
      });
      if (el.tagName.toLowerCase() === "text" && !el.hasAttribute("fill")) {
        el.setAttribute("fill", "currentColor");
      }
      if (el.hasAttribute("font-family")) el.removeAttribute("font-family");
    });
  }

  function render() {
    // 本站的代码块由 rehype-pretty-code 输出：<figure data-rehype-pretty-code-figure>
    // <pre data-language="dot"><code data-language="dot">…行 span…</code></pre>
    var blocks = document.querySelectorAll('pre[data-language="dot"] > code');
    if (!blocks.length) return;
    getViz().then(function (viz) {
      blocks.forEach(function (code) {
        var pre = code.parentElement;
        if (!pre || pre.dataset.dotViz) return;
        pre.dataset.dotViz = "1";
        var svg;
        try {
          svg = viz.renderSVGElement(code.textContent);
        } catch (e) {
          console.warn("[dot-viz] dot 语法渲染失败，保留原始代码块", e);
          return;
        }
        themize(svg);
        var fig = document.createElement("div");
        fig.className = "dot-graph";
        fig.setAttribute("role", "img");
        fig.setAttribute("aria-label", "Graphviz 图（由 dot 源码渲染）");
        fig.appendChild(svg);
        pre.replaceWith(fig);
      });
    }).catch(function (e) {
      console.warn("[dot-viz] viz.js 加载失败，保留原始代码块", e);
    });
  }

  document.addEventListener("nav", render);
  document.addEventListener("DOMContentLoaded", render);
})();`

export function DotViz() {
  return {
    htmlPlugins() {
      return []
    },
    externalResources() {
      return {
        additionalHead: [
          h("style", { dangerouslySetInnerHTML: { __html: DOT_VIZ_CSS } }),
          h("script", { dangerouslySetInnerHTML: { __html: DOT_VIZ_JS } }),
        ],
      }
    },
  }
}
