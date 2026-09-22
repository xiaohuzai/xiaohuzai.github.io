// 正文里的图片点击放大。
//
// 为什么需要：正文栏（约 742px）会把大图整体缩放，torchview 这类数据流图原始宽 1500px+，
// 缩放后节点小字不可读（实测 MHA 数据流图被缩到 46%）。站上没有现成的查看器，
// 这里补一个最轻的：点正文图片 → 全屏遮罩按「原始像素 1:1」显示，比视口大就滚动平移；
// 点任意处或按 Esc 关闭。光标用 zoom-in / zoom-out 提示可点。
//
// 范围只限 article 内的 img：Quartz 的悬浮预览（popover）节点挂在 body 下，不在 article 里，
// 预览里的小图不会误触发。遮罩节点挂在 body 上，SPA 导航（micromorph 替换正文）后若被移除，
// 下次点击会自动重建。
//
// 失效安全：选择器命中不了、图片没加载完，都只是「点了没反应」，不会报错、不影响页面其它行为。
import { h } from "preact"

const IMAGE_ZOOM_CSS = `
.image-zoom-overlay{position:fixed;inset:0;z-index:9999;display:none;overflow:auto;
  background:rgba(18,17,15,.9);cursor:zoom-out}
.image-zoom-overlay.open{display:block}
.image-zoom-overlay img{display:block;margin:2vh auto;width:auto;height:auto;max-width:none;
  border-radius:4px;box-shadow:0 8px 40px rgba(0,0,0,.5)}
article img{cursor:zoom-in}
`

const IMAGE_ZOOM_JS = `(function () {
  if (window.__imageZoomLoaded) return;
  window.__imageZoomLoaded = true;

  var overlay = null;

  function get() {
    if (overlay && overlay.isConnected) return overlay;
    overlay = document.createElement("div");
    overlay.className = "image-zoom-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-label", "图片放大视图：点任意处或按 Esc 关闭，可滚动查看");
    var img = document.createElement("img");
    img.alt = "";
    overlay.appendChild(img);
    overlay.addEventListener("click", close);
    document.body.appendChild(overlay);
    return overlay;
  }

  function open(source) {
    var ov = get();
    var view = ov.querySelector("img");
    view.src = source.currentSrc || source.src;
    view.alt = source.alt || "";
    ov.classList.add("open");
    ov.scrollTop = 0;
    ov.scrollLeft = 0;
    document.body.style.overflow = "hidden";
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  document.addEventListener("click", function (e) {
    var img = e.target && e.target.closest ? e.target.closest("article img") : null;
    if (!img) return;
    e.preventDefault();
    e.stopPropagation();
    open(img);
  }, true);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") close();
  });
})();`

export function ImageZoom() {
  return {
    htmlPlugins() {
      return []
    },
    externalResources() {
      return {
        additionalHead: [
          h("style", { dangerouslySetInnerHTML: { __html: IMAGE_ZOOM_CSS } }),
          h("script", { dangerouslySetInnerHTML: { __html: IMAGE_ZOOM_JS } }),
        ],
      }
    },
  }
}
