import { h } from "preact"

const ICONS = {
  posts: `<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>`,
  notes: `<path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4"/><path d="M2 6h4"/><path d="M2 10h4"/><path d="M2 14h4"/><path d="M2 18h4"/><path d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/>`,
  tags: `<path d="m15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L17 19"/><path d="M9.586 5.586A2 2 0 0 0 8.172 5H3a1 1 0 0 0-1 1v5.172a2 2 0 0 0 .586 1.414L8.29 18.29a2.426 2.426 0 0 0 3.42 0l3.58-3.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="6.5" cy="9.5" r=".5" fill="currentColor"/>`,
  github: `<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>`,
}

const LINKS = [
  { href: "/posts/", label: "文章", icon: ICONS.posts },
  { href: "/notes/", label: "笔记", icon: ICONS.notes },
  { href: "/tags/", label: "标签", icon: ICONS.tags },
  { href: "https://github.com/xiaohuzai", label: "GitHub", icon: ICONS.github, external: true },
]

function iconSvg(path) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`
}

export function LinksNav() {
  const LinksNavComp = () =>
    h("div", { id: "links-nav-container" },
      h("nav", { id: "links-nav", "aria-label": "站点导航" },
        LINKS.map((l) =>
          h("a", {
            class: "links-nav-item",
            href: l.href,
            ...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {}),
            dangerouslySetInnerHTML: { __html: iconSvg(l.icon) + `<span>${l.label}</span>` },
          }),
        ),
      ),
      h("hr"),
    )

  LinksNavComp.css = `
#links-nav {
  margin: 0 0.2em;
  font-size: 1.05em;
  display: flex;
  flex-wrap: wrap;
}
.links-nav-item {
  box-sizing: border-box;
  padding: 10px 15px;
  display: inline-flex;
  align-items: center;
  gap: 0.35em;
  color: var(--darkgray);
  border-radius: 6px;
  transition: background-color 0.2s ease, color 0.2s ease;
}
.links-nav-item svg {
  height: 1em;
  width: 1em;
  flex-shrink: 0;
}
.links-nav-item:hover {
  background-color: var(--highlight);
  color: var(--secondary);
}
#links-nav-container hr {
  margin: 1rem 0;
}
@media screen and (max-width: 800px) {
  #links-nav {
    flex-wrap: nowrap;
    overflow-x: auto;
    white-space: nowrap;
  }
  .links-nav-item {
    padding: 8px 12px;
  }
}
`

  return LinksNavComp
}
