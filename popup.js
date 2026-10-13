const q = document.getElementById("q");
const list = document.getElementById("list");
let tabs = [], shown = [], sel = 0, currentWindowId;
// Show any startup error where you can see it, instead of only in the console.
addEventListener("error", e => { q.placeholder = `Tab Filter error: ${e.message}`; });
addEventListener("unhandledrejection", e => { q.placeholder = `Tab Filter error: ${e.reason?.message ?? e.reason}`; });

// A word matches a tab with a score (lower is better) and the title positions to
// highlight. Exact text in the title beats exact text in the URL, which beats a
// fuzzy title match. Fuzzy matching skips the URL because query strings contain
// almost every letter and match nearly anything.
function wordMatch(title, url, word) {
  const at = title.toLowerCase().indexOf(word);
  if (at !== -1) return { score: 0, positions: [...word].map((_, i) => at + i) };
  if (url.toLowerCase().includes(word)) return { score: 1, positions: [] };
  const fuzzy = fuzzyMatch(title, word);
  // A cost above 2x the word length means the letters are too scattered to be useful.
  return fuzzy && fuzzy.cost <= word.length * 2 ? { score: 2 + fuzzy.cost, positions: fuzzy.positions } : null;
}

// True where a word begins: the first letter, after a space or symbol, or a camelCase hump.
function isWordStart(text, j) {
  if (j === 0) return true;
  const prev = text[j - 1], cur = text[j];
  return !/[\p{L}\p{N}]/u.test(prev) || (prev === prev.toLowerCase() && cur !== cur.toLowerCase());
}

// Cheapest way to find the word's letters in order. A letter that starts a word
// costs 0, so "gs" matches "GitHub Status" for free. Any other letter costs 1
// plus the letters skipped to reach it.
function fuzzyMatch(text, word) {
  const lower = text.toLowerCase(), n = lower.length;
  let prev = null; // prev[j] = { cost, positions } for the previous letter ending at j
  for (let i = 0; i < word.length; i++) {
    const cur = new Array(n).fill(null);
    for (let j = 0; j < n; j++) {
      if (lower[j] !== word[i]) continue;
      const start = isWordStart(text, j);
      if (i === 0) { cur[j] = { cost: start ? 0 : 1, positions: [j] }; continue; }
      for (let k = 0; k < j; k++) {
        if (!prev[k]) continue;
        const cost = prev[k].cost + (start ? 0 : 1 + j - k - 1);
        if (!cur[j] || cost < cur[j].cost) cur[j] = { cost, positions: [...prev[k].positions, j] };
      }
    }
    prev = cur;
  }
  return prev.reduce((best, m) => (m && (!best || m.cost < best.cost) ? m : best), null);
}

function match(tab, words) {
  let score = 0;
  const positions = new Set();
  for (const w of words) {
    const m = wordMatch(tab.title, tab.url, w);
    if (!m) return null;
    score += m.score;
    m.positions.forEach(p => positions.add(p));
  }
  return { tab, score, positions };
}

// Title text with the matched letters wrapped in <b>. textContent keeps page-set titles inert.
function highlighted(title, positions) {
  const span = document.createElement("span");
  [...title].forEach((ch, i) => {
    const node = positions.has(i) ? document.createElement("b") : document.createTextNode(ch);
    if (node.nodeType === 1) node.textContent = ch;
    span.append(node);
  });
  return span;
}

function render() {
  const words = q.value.toLowerCase().split(/\s+/).filter(Boolean);
  // sort() is stable, so equal scores keep the most-recently-used order.
  const matches = tabs.map(t => match(t, words)).filter(Boolean).sort((a, b) => a.score - b.score);
  shown = matches.map(m => m.tab);
  sel = Math.min(sel, Math.max(shown.length - 1, 0));
  list.replaceChildren(...matches.map(({ tab: t, positions }) => {
    const li = document.createElement("li");
    const img = document.createElement("img");
    img.src = t.favIconUrl || "";
    const host = document.createElement("small");
    const hostname = URL.canParse(t.url) ? new URL(t.url).hostname : "";
    host.textContent = t.windowId === currentWindowId ? hostname : `other window · ${hostname}`;
    // The full address shows only on the selected row, to tell similar titles apart.
    const url = document.createElement("div");
    url.className = "url";
    url.textContent = t.url;
    li.append(img, highlighted(t.title, positions), host, url);
    li.onclick = () => go(t);
    return li;
  }));
  select(sel);
}

// A live preview that switches tabs is not possible: Firefox moves keyboard focus
// to the page on a tab switch, and the popup can't take it back.
function select(i) {
  sel = i;
  [...list.children].forEach((li, j) => li.classList.toggle("sel", j === sel));
  list.children[sel]?.scrollIntoView({ block: "nearest" });
}

async function closeTab(tab) {
  await browser.tabs.remove(tab.id);
  // Closing the current tab makes Firefox switch tabs, which takes keyboard focus
  // from the popup for good, so close the popup rather than leave it unusable.
  if (tab.active && tab.windowId === currentWindowId) return window.close();
  tabs = tabs.filter(t => t.id !== tab.id);
  q.placeholder = `Search ${tabs.length} open tabs`;
  render();
}

async function go(tab) {
  await browser.tabs.update(tab.id, { active: true });
  await browser.windows.update(tab.windowId, { focused: true });
  window.close();
}

q.addEventListener("input", () => { sel = 0; render(); });
q.addEventListener("keydown", e => {
  if (e.key === "ArrowDown") return e.preventDefault(), select(Math.min(sel + 1, shown.length - 1));
  else if (e.key === "ArrowUp") return e.preventDefault(), select(Math.max(sel - 1, 0));
  else if (e.key === "Enter" && shown[sel]) return go(shown[sel]);
  // Delete still edits the search unless the cursor is at the end of it.
  else if (e.key === "Delete" && shown[sel] && q.selectionStart === q.value.length) { e.preventDefault(); return closeTab(shown[sel]); }
});

// Firefox focuses the popup window some time after the script runs, and a
// focus() call before that is lost. Retry until the input has focus, for at most 1 s.
let tries = 0;
const focusTimer = setInterval(() => {
  q.focus();
  if ((document.hasFocus() && document.activeElement === q) || ++tries > 20) clearInterval(focusTimer);
}, 50);

// Hidden tabs are ones an extension has hidden from the tab strip, so leave them out.
Promise.all([browser.tabs.query({ hidden: false }), browser.windows.getCurrent()]).then(([all, win]) => {
  currentWindowId = win.id;
  q.placeholder = `Search ${all.length} open tabs`;
  // Most recently used first, so an empty search lists the tabs you just left.
  tabs = all.sort((a, b) => b.lastAccessed - a.lastAccessed);
  render();
}).catch(e => {
  q.placeholder = `Tab Filter error: ${e.message}`;
  console.error(e);
});
