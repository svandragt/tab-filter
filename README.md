# Tab Filter

Tab Filter is a Firefox extension that finds an open tab by typing part of its title or address.

## Use it

1. Press `Ctrl+Insert`, or click the Tab Filter toolbar button.
2. Type part of the tab's title or address. The list filters as you type.
3. Press `Enter` to switch to the first result, or use the arrow keys to pick another one.

The search is fuzzy: `wmhm` finds "Wikimedia Home". Words can come in any order. With an empty search, the list shows your most recently used tabs first, so `Ctrl+Insert` then `Enter` returns to the previous tab.

To change the shortcut, open `about:addons`, click the gear icon and choose **Manage Extension Shortcuts**.

## Privacy

Tab Filter reads your tab titles and addresses only to show the list. It stores nothing and sends nothing anywhere.

## Develop

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on** and select `manifest.json`.

To check the extension against Mozilla's rules, run `npx web-ext lint`. To build a zip for addons.mozilla.org, run `npx web-ext build`.
