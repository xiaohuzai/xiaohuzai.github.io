import { h } from "preact"

export function FooterExtras() {
  const FooterExtrasComp = () =>
    h("ul", { class: "footer-extras" },
      h("li", null, h("a", { href: "#", id: "back-to-top" }, "回到顶部 ↑")),
      h("li", null, h("a", { id: "random-page" }, "随便逛逛 🎲")),
    )

  FooterExtrasComp.afterDOMLoaded = `
function bindFooterExtras() {
  const backToTop = document.getElementById("back-to-top")
  if (backToTop) {
    backToTop.addEventListener("click", (e) => {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: "smooth" })
    })
  }
  const randomBtn = document.getElementById("random-page")
  if (randomBtn) {
    randomBtn.addEventListener("click", async () => {
      try {
        const res = await fetch("/static/contentIndex.json")
        if (!res.ok) return
        const index = await res.json()
        const slugs = Object.keys(index).filter((s) => s !== "index" && !s.startsWith("tags/") && s !== "404")
        if (slugs.length === 0) return
        const slug = slugs[Math.floor(Math.random() * slugs.length)]
        const url = new URL("https://" + document.location.host + "/" + slug)
        if (typeof window.spaNavigate === "function") {
          window.spaNavigate(url)
        } else {
          window.location.assign(url.pathname + url.search)
        }
      } catch {}
    })
  }
}
bindFooterExtras()
document.addEventListener("nav", bindFooterExtras)
`

  FooterExtrasComp.css = `
ul.footer-extras {
  display: flex;
  gap: 1.5rem;
  margin: 0 0 1rem;
  padding-left: 0;
  list-style: none;
}
ul.footer-extras a {
  cursor: pointer;
}
`

  return FooterExtrasComp
}
