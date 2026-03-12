/* global chrome */

const PANEL_URL = chrome.runtime.getURL("panel.html");

chrome.action.onClicked.addListener(async () => {
  const tabs = await chrome.tabs.query({});
  const existingPanel = tabs.find((tab) => tab.url === PANEL_URL);

  if (existingPanel?.id !== undefined) {
    await chrome.tabs.update(existingPanel.id, { active: true });

    if (existingPanel.windowId !== undefined) {
      await chrome.windows.update(existingPanel.windowId, { focused: true });
    }

    return;
  }

  await chrome.tabs.create({ url: PANEL_URL });
});
