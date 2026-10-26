/* GFM Table Fix: core Obsidian rejects pipe tables whose header starts with an
   empty cell ("||a|b|") — valid GFM. Reading mode gets them via a markdown
   post-processor; live preview gets a CodeMirror block-decoration widget. */
const { Plugin, MarkdownRenderer } = require("obsidian");
const { Decoration, WidgetType, EditorView } = require("@codemirror/view");
const { RangeSetBuilder, StateField } = require("@codemirror/state");

const DELIM_RE = /^\s*\|?\s*:?-{1,}:?\s*(?:\|\s*:?-{1,}:?\s*)+\|?\s*$/;
const REJECTED_HEADER_RE = /^\s*\|\|/; // core only fails on "||..." headers

function splitCells(line) {
  const s = line.trim();
  const cells = [];
  let cur = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "\\" && s[i + 1] === "|") { cur += "|"; i++; continue; }
    if (ch === "|") { cells.push(cur.trim()); cur = ""; continue; }
    cur += ch;
  }
  cells.push(cur.trim());
  if (s.startsWith("|")) cells.shift();
  if (s.endsWith("|")) cells.pop();
  return cells;
}

async function buildTable(app, plugin, sourcePath, tableLines, container) {
  const header = splitCells(tableLines[0]);
  const delim = splitCells(tableLines[1]);
  if (header.length < 1 || header.length !== delim.length) return null;
  const rows = tableLines.slice(2).filter(l => l.trim().includes("|"));

  const table = document.createElement("table");
  table.addClass("gfm-table-fix");
  const thead = table.createTHead();
  const hr = thead.insertRow();
  for (const c of header) {
    const th = document.createElement("th");
    hr.appendChild(th);
    await renderCell(app, plugin, sourcePath, c, th);
  }
  const tbody = table.createTBody();
  for (const rl of rows) {
    const cells = splitCells(rl);
    const tr = tbody.insertRow();
    for (let i = 0; i < header.length; i++) {
      const td = tr.insertCell();
      await renderCell(app, plugin, sourcePath, cells[i] ?? "", td);
    }
  }
  container.appendChild(table);
  return table;
}

async function renderCell(app, plugin, sourcePath, md, el) {
  await MarkdownRenderer.render(app, md, el, sourcePath, plugin);
  while (el.childNodes.length === 1 && el.firstChild instanceof HTMLParagraphElement) {
    const pEl = el.firstChild;
    while (pEl.firstChild) el.insertBefore(pEl.firstChild, pEl);
    pEl.remove();
  }
}

class LiveTableWidget extends WidgetType {
  constructor(plugin, sourcePath, lines) {
    super();
    this.plugin = plugin;
    this.sourcePath = sourcePath;
    this.lines = lines;
  }
  eq(other) { return other.sourcePath === this.sourcePath && other.lines.join("\n") === this.lines.join("\n"); }
  toDOM() {
    const wrap = document.createElement("div");
    wrap.addClass("gfm-table-fix-wrap");
    const { app } = this.plugin;
    const path = app.workspace.getActiveFile()?.path ?? "";
    buildTable(app, this.plugin, path, this.lines, wrap);
    return wrap;
  }
  ignoreEvent() { return false; }
}

module.exports = class GfmTableFixPlugin extends Plugin {
  async onload() {
    // Reading mode / embeds: failed tables come through as paragraphs.
    this.registerMarkdownPostProcessor(async (el, ctx) => {
      for (const p of Array.from(el.querySelectorAll("p"))) {
        try { await this.fixParagraph(p, ctx); } catch (e) { console.error("[gfm-table-fix]", e); }
      }
    });

    // Live preview: block decorations must come from a StateField, not a ViewPlugin.
    const plugin = this;
    const buildDeco = (state) => {
      const doc = state.doc;
      const allLines = doc.toString().split("\n");
      const path = plugin.app.workspace.getActiveFile()?.path ?? "";
      const b = new RangeSetBuilder();
      let i = 0;
      while (i < allLines.length) {
        if (REJECTED_HEADER_RE.test(allLines[i]) && i + 1 < allLines.length &&
            DELIM_RE.test(allLines[i + 1])) {
          let j = i + 2;
          while (j < allLines.length && allLines[j].trim().includes("|")) j++;
          const start = doc.line(i + 1).from;
          const end = doc.line(j).to;
          const inside = state.selection.ranges.some(r => r.from <= end && r.to >= start);
          if (!inside) {
            b.add(start, end, Decoration.replace({
              widget: new LiveTableWidget(plugin, path, allLines.slice(i, j)),
              block: true,
            }));
          }
          i = j;
          continue;
        }
        i++;
      }
      return b.finish();
    };
    const tableField = StateField.define({
      create: state => buildDeco(state),
      update: (value, tr) => (tr.docChanged || tr.selection) ? buildDeco(tr.state) : value,
      provide: f => EditorView.decorations.from(f),
    });
    this.registerEditorExtension(tableField);
  }

  async fixParagraph(p, ctx) {
    const lines = p.innerText.split(/\r?\n/).map(l => l.trim());
    if (lines.length < 2) return;
    if (!REJECTED_HEADER_RE.test(lines[0]) || !DELIM_RE.test(lines[1])) return;
    if (!lines.slice(2).every(l => l.includes("|"))) return;

    let tableLines = null;
    try {
      const info = ctx.getSectionInfo(p);
      if (info) {
        const block = info.filter(l => l.trim().includes("|"));
        if (block.length >= 2 && DELIM_RE.test(block[1])) tableLines = block;
      }
    } catch (e) { /* fall through to plain-text cells */ }
    if (!tableLines) tableLines = lines;

    const built = await buildTable(this.app, this, ctx.sourcePath, tableLines, document.createDocumentFragment());
    if (built) p.replaceWith(built);
  }
};
