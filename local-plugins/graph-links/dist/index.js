// 关系图谱的连线看不见，原因不在数据而在颜色：
//   · 图谱把「非激活的边」画成 CSS 变量 --lightgray（本主题亮色下是 #f6f6f6，白底 ≈ 隐形），
//     只有悬停某节点时「激活的边」才用 --gray。边本身是存在且被正确创建的。
//   · graph 插件没有颜色配置项（只有 depth/fontSize/showTags 这些）；而 --lightgray 同时用于
//     全站多处背景与分隔线，直接改这个变量会把面板底色一起压暗，代价太大。
// 所以这里在运行时做一次「精确重映射」：只动画布描边，把极浅/极深的近中性灰换成可辨识的灰。
// 失效安全：上游若改了颜色（不再匹配），补丁退化为空操作，只是连线重新变淡，不会报错。
import { h } from "preact"

const GRAPH_LINKS_JS = `(function () {
  var LINK_COLOR = { light: "#b9b9b9", dark: "#5f5f5f" };
  function theme() {
    return document.documentElement.getAttribute("saved-theme") === "dark" ? "dark" : "light";
  }
  function isFaintNeutral(color) {
    var m = String(color).match(/[0-9]+(\\.[0-9]+)?/g);
    if (!m || m.length < 3) return false;
    var r = +m[0], g = +m[1], b = +m[2];
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    if (max - min > 12) return false;            // 非中性色（节点用的紫/灰不在其中）
    return theme() === "dark" ? max <= 80 : min >= 225;
  }
  function patch() {
    var proto = window.PIXI && window.PIXI.Graphics && window.PIXI.Graphics.prototype;
    if (!proto) return false;
    if (proto.__graphLinksPatched) return true;
    var original = proto.stroke;
    proto.stroke = function (options) {
      if (options && typeof options === "object" && isFaintNeutral(options.color)) {
        options = Object.assign({}, options, { color: LINK_COLOR[theme()] });
      }
      return original.apply(this, arguments);
    };
    proto.__graphLinksPatched = true;
    return true;
  }
  var timer = setInterval(function () { if (patch()) clearInterval(timer); }, 200);
  setTimeout(function () { clearInterval(timer); }, 20000);
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