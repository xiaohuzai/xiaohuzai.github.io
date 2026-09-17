import { h } from "preact"

export function SiteLogo() {
  const SiteLogoComp = ({ cfg }) => {
    const title = cfg?.pageTitle ?? "小虎仔的小站"
    return h("h2", { class: "page-title site-logo" },
      h("a", { href: "/", "aria-label": title },
        h("span", {
          class: "logo-mark",
          "aria-hidden": "true",
          dangerouslySetInnerHTML: {
            __html: `<svg viewBox="0 0 48 46" xmlns="http://www.w3.org/2000/svg">
  <path class="logo-ear" d="M9 12 L4 1.5 L17 6.5 Z"/>
  <path class="logo-ear" d="M39 12 L44 1.5 L31 6.5 Z"/>
  <rect class="logo-term" x="4" y="10" width="40" height="32" rx="7"/>
  <circle class="logo-dot" cx="11.5" cy="17.5" r="2"/>
  <circle class="logo-dot" cx="18" cy="17.5" r="2"/>
  <circle class="logo-dot" cx="24.5" cy="17.5" r="2"/>
  <polyline class="logo-prompt" points="11,27 16.5,32.5 11,38"/>
  <line class="logo-prompt" x1="20" y1="38" x2="28" y2="38"/>
</svg>`,
          },
        }),
        h("span", { class: "logo-word" }, title),
      ),
    )
  }

  SiteLogoComp.css = `
.site-logo {
  margin: 0;
}
.site-logo > a {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--dark);
}
.site-logo .logo-mark {
  display: inline-flex;
}
.site-logo .logo-mark svg {
  width: 2.4rem;
  height: 2.3rem;
}
.site-logo .logo-term {
  fill: var(--secondary);
}
.site-logo .logo-ear {
  fill: var(--tertiary);
}
.site-logo .logo-dot {
  fill: var(--light);
  opacity: 0.9;
}
.site-logo .logo-prompt {
  stroke: var(--light);
  stroke-width: 2.6;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
}
.site-logo .logo-word {
  font-weight: 700;
  letter-spacing: 0.04em;
  font-size: 1.6rem;
  line-height: 1.2;
}
`

  return SiteLogoComp
}
