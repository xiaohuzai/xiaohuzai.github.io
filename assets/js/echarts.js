// ECharts integration for the Congo theme.
// Reads Congo's CSS color variables so charts match the active color scheme,
// and re-renders every chart when the light/dark appearance flips (ECharts
// can't restyle a live instance, so we dispose + re-init with fresh colors).
//
// Wrapped in an IIFE on purpose: this file is concatenated with echarts.min.js
// into one bundle, and the bundle loads alongside Congo's mermaid/chart bundles
// on pages that use several shortcodes. Congo's mermaid.js declares a top-level
// `let isDark`; a top-level `function isDark` here would collide with it in the
// shared script scope ("Identifier 'isDark' has already been declared") and
// break the whole bundle. The IIFE keeps css/isDark/mergeOption out of that
// scope -- only window.initEChartsChart is exposed.
(function () {
  function css(name) {
    return "rgb(" + getComputedStyle(document.documentElement).getPropertyValue(name) + ")";
  }

  function isDark() {
    return document.documentElement.classList.contains("dark");
  }

  // Base option: themed defaults for text, tooltip, legend and the color palette.
  // User options (passed from the shortcode) are merged on top of this.
  function echartsBaseOption() {
    var dark = isDark();
    return {
      backgroundColor: "transparent",
      textStyle: {
        color: dark ? css("--color-neutral-300") : css("--color-neutral-700"),
        fontFamily:
          "ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,segoe ui,Roboto,helvetica neue,Arial,noto sans,sans-serif",
      },
      color: [
        css("--color-primary-500"),
        css("--color-secondary-500"),
        dark ? css("--color-primary-300") : css("--color-primary-700"),
        dark ? css("--color-secondary-300") : css("--color-secondary-700"),
        css("--color-primary-400"),
        css("--color-secondary-400"),
        dark ? css("--color-neutral-400") : css("--color-neutral-500"),
      ],
      title: {
        textStyle: { color: dark ? css("--color-neutral-100") : css("--color-neutral-800") },
      },
      legend: {
        textStyle: { color: dark ? css("--color-neutral-300") : css("--color-neutral-600") },
      },
      tooltip: {
        backgroundColor: dark ? css("--color-neutral-800") : css("--color-neutral"),
        borderColor: dark ? css("--color-neutral-600") : css("--color-neutral-300"),
        textStyle: { color: dark ? css("--color-neutral-100") : css("--color-neutral-800") },
      },
    };
  }

  // Merge user option over the base, one level deep for the themed nested
  // objects so a per-chart tweak doesn't drop the theme colors entirely.
  function mergeOption(userOption) {
    var base = echartsBaseOption();
    var merged = Object.assign({}, base, userOption || {});
    ["tooltip", "legend", "title", "textStyle"].forEach(function (key) {
      merged[key] = Object.assign({}, base[key], (userOption && userOption[key]) || {});
    });
    return merged;
  }

  // Registry of active charts so we can re-render them on theme switch.
  window.__echartsInstances = window.__echartsInstances || [];

  // Called by the {{< echarts >}} shortcode for each chart on the page.
  window.initEChartsChart = function (el, userOption) {
    var instance = echarts.init(el, null, { renderer: "canvas" });
    instance.setOption(mergeOption(userOption));
    window.__echartsInstances.push({ instance: instance, el: el, userOption: userOption });
    return instance;
  };

  // Re-render every chart when the Congo appearance flips. The `dark` class on
  // <html> is what changes, so observe it and only act when it actually toggles.
  var lastDark = isDark();
  var observer = new MutationObserver(function () {
    var nowDark = isDark();
    if (nowDark === lastDark) return;
    lastDark = nowDark;
    window.__echartsInstances = window.__echartsInstances.map(function (entry) {
      entry.instance.dispose();
      var fresh = echarts.init(entry.el, null, { renderer: "canvas" });
      fresh.setOption(mergeOption(entry.userOption));
      return { instance: fresh, el: entry.el, userOption: entry.userOption };
    });
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });

  // Keep charts sized to their container on window resize.
  window.addEventListener("resize", function () {
    window.__echartsInstances.forEach(function (entry) {
      entry.instance.resize();
    });
  });
})();
