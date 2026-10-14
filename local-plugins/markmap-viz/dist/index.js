// 把 ```markmap 大纲代码块在浏览器端渲染成交互式脑图（markmap-view：可折叠/缩放）。
//
// 为什么：Obsidian 侧装了 Mindmap NextGen 后，```markmap 块在 Obsidian 里已经是
// 脑图；站点侧本来只显示代码块。这里把 markmap 渲染栈（no-plugins 基座 + js-yaml，
// 砍掉 katex/highlight.js）打成单文件 ESM bundle 放在站内 /static/markmap/bundle.js
// （源文件 quartz/static/markmap/bundle.js，打包入口 src/bundle-entry.mjs），页面上
// 有 markmap 块时才按需 import——同 mermaid 镜像 / viz.js 的 vendoring 手法，
// 无外网依赖（官方 markmap-autoloader 运行时会回 jsdelivr CDN 拉库，不能用）。
//
// 渲染时机：同 dot-viz——站点是 SPA（micromorph 替换正文），挂 nav 事件（首次加载
// 也会派发一次）+ DOMContentLoaded 兜底；dataset 标记防重复渲染。
//
// 深浅色：节点文字走 currentColor（CSS 给 svg color: var(--dark)，主题切换自动跟随）；
// 分支色是 catppuccin 中亮度 accent 调色板（按节点路径哈希取色，同一路径颜色稳定），
// 两套主题下都可读；markmap 自带的底板是透明的，不挡页面背景。
//
// 失效安全：bundle 加载失败、frontmatter/大纲解析失败、渲染抛错，都只保留原始
// 代码块 + console 警告，不影响页面其它行为。
import { h } from "preact"

const MARKMAP_CSS = `
.markmap-graph{margin:.5rem 0 1rem;max-height:70vh;overflow:auto}
.markmap-graph svg{width:100%;height:420px;max-width:100%;color:var(--dark);font-family:var(--bodyFont)}
.markmap-graph svg foreignObject div{color:var(--dark)}
`

const MARKMAP_JS = `(function () {
  if (window.__markmapVizLoaded) return;
  window.__markmapVizLoaded = true;

  var bundlePromise = null;
  function getBundle() {
    if (!bundlePromise) {
      bundlePromise = import("/static/markmap/bundle.js")
        .catch(function (e) { bundlePromise = null; throw e; });
    }
    return bundlePromise;
  }

  // catppuccin 中亮度 accent：在浅色（正文 #4C4F69 / 底 #EFF1F5）和深色
  // （正文 #CDD6F4 / 底 #1E1E2E）下都够对比；按节点路径哈希取色，同一路径恒定
  var PALETTE = ["#E78284", "#EF9F76", "#E5C890", "#A6D189", "#81C8BE", "#8CAAEE", "#B7BDF8", "#F4B8E4"];
  function hashCode(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  function render() {
    // 本站的代码块由 rehype-pretty-code 输出：<figure data-rehype-pretty-code-figure>
    // <pre data-language="markmap"><code data-language="markmap">…行 span…</code></pre>
    var blocks = document.querySelectorAll('pre[data-language="markmap"] > code');
    if (!blocks.length) return;
    getBundle().then(function (b) {
      blocks.forEach(function (code) {
        var pre = code.parentElement;
        if (!pre || pre.dataset.markmapViz) return;
        pre.dataset.markmapViz = "1";
        var root, mo;
        try {
          var t = b.transform(code.textContent);
          root = t.root;
          mo = t.markmapOptions || {};
        } catch (e) {
          console.warn("[markmap-viz] 大纲解析失败，保留原始代码块", e);
          return;
        }
        try {
          var fig = document.createElement("div");
          fig.className = "markmap-graph";
          fig.setAttribute("role", "img");
          fig.setAttribute("aria-label", "markmap 脑图（由大纲源码渲染）");
          var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          fig.appendChild(svg);
          // markmap-view 建图时要量 svg 的实际尺寸（fit/缩放），必须先进 DOM 再 create，
          // 否则拿到 0 尺寸、zoom transform 出 NaN（控制台刷 translate(NaN,NaN)）
          pre.replaceWith(fig);
          var opts = Object.keys(mo).length ? b.deriveOptions(mo) : {};
          if (!opts.color) {
            opts.color = function (node) {
              var path = (node.state && node.state.path) || "";
              return PALETTE[hashCode(path) % PALETTE.length];
            };
          }
          var mm = b.Markmap.create(svg, opts, root);
          mm.fit();
        } catch (e) {
          // 渲染失败把代码块还回去，页面不留空壳
          fig.replaceWith(pre);
          console.warn("[markmap-viz] 渲染失败，保留原始代码块", e);
        }
      });
    }).catch(function (e) {
      console.warn("[markmap-viz] bundle 加载失败，保留原始代码块", e);
    });
  }

  document.addEventListener("nav", render);
  document.addEventListener("DOMContentLoaded", render);
})();`

export function MarkmapViz() {
  return {
    htmlPlugins() {
      return []
    },
    externalResources() {
      return {
        additionalHead: [
          h("style", { dangerouslySetInnerHTML: { __html: MARKMAP_CSS } }),
          h("script", { dangerouslySetInnerHTML: { __html: MARKMAP_JS } }),
        ],
      }
    },
  }
}
