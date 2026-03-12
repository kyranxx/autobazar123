# Open Tabs Exporter

Temporary unpacked Chrome extension for exporting the tabs you already have open without restarting Chrome.

## What it captures

- window and tab ordering
- tab title and URL
- page text for normal `http/https` pages
- optional trimmed HTML snapshot
- explicit skip reasons for blocked tabs such as `chrome://`, `about:blank`, extension pages, Chrome Web Store pages, and unsupported schemes

## Load it in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select:
   - `C:\Users\User\Desktop\Projects\autobazar123\tools\chrome-tab-exporter`
5. Pin the extension if you want faster access.

## Use it

1. Click the extension icon.
2. The extension opens its own panel tab.
3. Leave **Include a trimmed HTML snapshot per tab** off unless you really need HTML output.
4. Click **Scan open tabs**.
5. Review the summary and per-tab status table.
6. Click **Download JSON**.

## Notes

- This works against your current Chrome session. It does not restart Chrome and does not replace your existing windows.
- Text and HTML are trimmed per tab so large pages do not explode the export file by default.
- Tabs that are still loading or pages Chrome blocks from script injection are included in the export with an explicit reason instead of being silently dropped.
- Incognito tabs are only visible if you manually allow the extension in incognito mode.
