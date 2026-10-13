# Tab Filter

Tab Filter is a Firefox extension that finds an open tab by typing part of its title or address.

## Use it

1. Press `Ctrl+Insert`, or click the Tab Filter toolbar button.
2. Type part of the tab's title or address. The list filters as you type.
3. Press `Enter` to switch to the first result, or use the arrow keys to pick another one.

The selected result also shows the tab's full address, to tell tabs with similar titles apart.

To close the selected tab without leaving the list, press `Delete` with the cursor at the end of your search.

The search is fuzzy: `wkmd` finds "Wikimedia". Letters that start a word count most, so `gs` finds "GitHub Status". Fuzzy matches use the tab title; the address matches only when it contains the exact text. The matched letters are underlined.

Tabs from another window, such as an installed web app, show "other window" next to the site name. Words can come in any order. With an empty search, the list shows your most recently used tabs first, so `Ctrl+Insert` then `Enter` returns to the previous tab.

To change the shortcut, open `about:addons`, click the gear icon and choose **Manage Extension Shortcuts**.

## Privacy

Tab Filter reads your tab titles and addresses only to show the list. It stores nothing and sends nothing anywhere.

## Develop

| Command | What it does |
|---|---|
| `make run` | Opens Firefox with the extension loaded, and reloads it when you change a file |
| `make test` | Tests the search scoring |
| `make lint` | Checks the extension against Mozilla's rules |
| `make build` | Runs the test and lint, then builds the zip for addons.mozilla.org in `web-ext-artifacts/` |
| `make clean` | Deletes the built zips |

To load the extension in your own Firefox profile instead, open `about:debugging#/runtime/this-firefox`, click **Load Temporary Add-on** and select `manifest.json`.
