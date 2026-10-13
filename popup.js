const q = document.getElementById("q");
const list = document.getElementById("list");
let tabs = [], shown = [], sel = 0;

// Fuzzy: each word's letters must appear in order in the title or URL.
// Lower score is better: an exact substring scores 0, otherwise the gaps between letters count.
function wordScore(hay, word) {
  if (hay.includes(word)) return 0;
  let pos = -1, gaps = 0;
  for (const ch of word) {
    const next = hay.indexOf(ch, pos + 1);
    if (next === -1) return null;
    if (pos !== -1) gaps += next - pos - 1;
    pos = next;
  }
  return 1 + gaps;
}

function score(tab, words) {
  const hay = (tab.title + " " + tab.url).toLowerCase();
  let total = 0;
  for (const w of words) {
    const s = wordScore(hay, w);
    if (s === null) return null;
    total += s;
  }
  return total;
}

function render() {
  const words = q.value.toLowerCase().split(/\s+/).filter(Boolean);
  // sort() is stable, so equal scores keep the most-recently-used order.
  shown = tabs.map(t => [t, score(t, words)])
    .filter(([, s]) => s !== null)
    .sort((a, b) => a[1] - b[1])
    .map(([t]) => t);
  sel = Math.min(sel, Math.max(shown.length - 1, 0));
  list.replaceChildren(...shown.map((t, i) => {
    const li = document.createElement("li");
    if (i === sel) li.className = "sel";
    const img = document.createElement("img");
    img.src = t.favIconUrl || "";
    const title = document.createElement("span");
    title.textContent = t.title;
    const host = document.createElement("small");
    host.textContent = URL.canParse(t.url) ? new URL(t.url).hostname : "";
    li.append(img, title, host);
    li.onclick = () => go(t);
    return li;
  }));
  list.children[sel]?.scrollIntoView({ block: "nearest" });
}

async function go(tab) {
  await browser.tabs.update(tab.id, { active: true });
  await browser.windows.update(tab.windowId, { focused: true });
  window.close();
}

q.addEventListener("input", () => { sel = 0; render(); });
q.addEventListener("keydown", e => {
  if (e.key === "ArrowDown") sel = Math.min(sel + 1, shown.length - 1);
  else if (e.key === "ArrowUp") sel = Math.max(sel - 1, 0);
  else if (e.key === "Enter" && shown[sel]) return go(shown[sel]);
  else return;
  e.preventDefault();
  render();
});

// Firefox focuses the popup window some time after the script runs, and a
// focus() call before that is lost. Retry until the input has focus, for at most 1 s.
let tries = 0;
const focusTimer = setInterval(() => {
  q.focus();
  if ((document.hasFocus() && document.activeElement === q) || ++tries > 20) clearInterval(focusTimer);
}, 50);

browser.tabs.query({}).then(all => {
  // Most recently used first, so an empty search lists the tabs you just left.
  tabs = all.sort((a, b) => b.lastAccessed - a.lastAccessed);
  render();
});
