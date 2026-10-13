const fs = require("fs"), a = require("assert");
const src = fs.readFileSync(__dirname + "/popup.js", "utf8");
eval(src.slice(src.indexOf("// A word matches"), src.indexOf("// Title text with")));
const m = (title, url, w) => wordMatch(title, url, w);
a.deepEqual(m("sync: 1295-app", "", "1295"), { score: 0, positions: [6, 7, 8, 9] });
a.equal(m("GitHub Status", "https://www.githubstatus.com/", "githubstatus").score, 1);
a.equal(m("GitHub Status", "", "gs").score, 2);            // both letters start words
a.ok(m("Progress", "", "gs").score > m("GitHub Status", "", "gs").score);
a.deepEqual(m("GitHub Status", "", "gs").positions, [0, 7]);
a.equal(m("Home – Wikimedia Foundation", "", "wkmd").score, 2 + 6); // w free, k/m/d cost 2 each
a.equal(m("Pull Requests", "https://x.com/?q=abcdefghijz", "pqz"), null); // URL ignored for fuzzy
a.equal(m("x quick brown fiz", "", "xz"), null);           // z is mid-word and far from x: too loose
a.ok(isWordStart("GitHub", 3));                            // camelCase hump
const tabs = [{ title: "Progress", url: "" }, { title: "GitHub Status", url: "" }];
a.equal(tabs.map(t => match(t, ["gs"])).filter(Boolean).sort((x, y) => x.score - y.score)[0].tab.title, "GitHub Status");
console.log("ok");
