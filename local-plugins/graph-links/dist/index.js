// 关系图谱的连线看不见，原因不在数据而在颜色：
//   · 图谱把「非激活的边」画成 CSS 变量 --lightgray，只有悬停某节点时「激活的边」才用 --gray。
//     边本身是存在且被正确创建的。
//   · graph 插件没有颜色配置项（只有 depth/fontSize/showTags 这些）；而 --lightgray 同时用于
//     全站多处背景与分隔线，直接改这个变量会把面板底色一起压暗，代价太大。
// 所以这里在运行时做一次「精确重映射」：只动画布描边，把与 --lightgray 一致的描边换成可辨识的灰。
//
// 为什么按变量比对，而不是判断"是不是浅灰"：
//   上一版判断「max-min <= 12 且足够浅/深」，即假定连线是中性灰。这在旧主题（#e5e5e5，spread 0）
//   成立，但换成 Flexoki 的暖白后 --lightgray 变成 #F2F0E5——spread 13 > 12，被当成"带色调的
//   颜色"跳过，连线重新变淡（2026-09 实际发生）。带色调的灰是常态，不该建立在"中性"假设上。
//   现在直接读 --lightgray 的实际值来比对：换任何主题都不失效，也不依赖色相。
//
// 失效安全：若上游改成用别的变量画连线，比对不中，补丁退化为空操作（连线恢复原色），不会报错。
import { h } from "preact"

const GRAPH_LINKS_JS = `(function () {
  var LINK_COLOR = { light: "#b9b9b9", dark: "#5f5f5f" };
  var cache = { theme: null, link: null, bg: null };

  function theme() {
    return document.documentElement.getAttribute("saved-theme") === "dark" ? "dark" : "light";
  }

  function parseRgb(s) {
    var m = String(s).match(/[\\d.]+/g);
    if (!m || m.length < 3) return null;
    return { r: +m[0], g: +m[1], b: +m[2] };
  }

  // 把任意 CSS 颜色交给浏览器解析成 rgb(...)，兼容 hex / rgb() / hsl() 等写法
  function resolve(value) {
    if (!value) return null;
    var d = document.createElement("div");
    d.style.color = value;
    if (!d.style.color) return null;
    d.style.position = "absolute";
    d.style.visibility = "hidden";
    document.body.appendChild(d);
    var out = getComputedStyle(d).color;
    d.remove();
    return parseRgb(out);
  }

  // 每帧都会调用 stroke()，CSS 变量只解析一次，主题切换时再刷新
  function ensureCache() {
    var t = theme();
    if (cache.theme === t && cache.link) return;
    var cs = getComputedStyle(document.documentElement);
    cache.theme = t;
    cache.link = resolve(cs.getPropertyValue("--lightgray").trim());
    cache.bg = resolve(cs.getPropertyValue("--light").trim());
  }

  function lum(c) { return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b; }

  function near(a, b, tol) {
    return a && b &&
      Math.abs(a.r - b.r) <= tol && Math.abs(a.g - b.g) <= tol && Math.abs(a.b - b.b) <= tol;
  }

  // 非激活的边用的就是 --lightgray。节点用的是 --gray / --secondary / --tertiary，
  // 不会与它相等，所以这个比对既能命中连线，也不会误伤节点配色。
  function isInactiveEdge(color) {
    ensureCache();
    var c = parseRgb(color);
    if (!c || !cache.link) return false;
    if (!near(c, cache.link, 6)) return false;
    // 只在它确实"淡到与背景分不开"时才换；本来就与背景有对比的主题保持原样
    return cache.bg ? Math.abs(lum(c) - lum(cache.bg)) <= 80 : true;
  }

  function patch() {
    var proto = window.PIXI && window.PIXI.Graphics && window.PIXI.Graphics.prototype;
    if (!proto) return false;
    if (proto.__graphLinksPatched) return true;
    var original = proto.stroke;
    proto.stroke = function (options) {
      if (options && typeof options === "object" && isInactiveEdge(options.color)) {
        options = Object.assign({}, options, { color: LINK_COLOR[theme()] });
      }
      return original.apply(this, arguments);
    };
    proto.__graphLinksPatched = true;
    return true;
  }

  var timer = setInterval(function () { if (patch()) clearInterval(timer); }, 200);
  setTimeout(function () { clearInterval(timer); }, 20000);
  // 切换亮/暗色时让缓存失效，下次描边按新主题重新解析
  document.addEventListener("themechange", function () { cache.theme = null; });
})();`

export function GraphLinks() {
  return {
    htmlPlugins() {
      return []
    },
    externalResources() {
      return {
        additionalHead: [
          h("script", { dangerouslySetInnerHTML: { __html: GRAPH_LINKS_JS } }),
        ],
      }
    },
  }
}
