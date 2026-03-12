/* global Blob, URL, chrome, document */

const state = {
  exportData: null,
  scanning: false,
};

const elements = {
  includeHtml: document.querySelector("#include-html"),
  maxTextChars: document.querySelector("#max-text-chars"),
  maxHtmlChars: document.querySelector("#max-html-chars"),
  scanButton: document.querySelector("#scan-button"),
  downloadButton: document.querySelector("#download-button"),
  status: document.querySelector("#status"),
  resultsMeta: document.querySelector("#results-meta"),
  resultsBody: document.querySelector("#results-body"),
  summaryWindows: document.querySelector("#summary-windows"),
  summaryTabs: document.querySelector("#summary-tabs"),
  summaryCaptured: document.querySelector("#summary-captured"),
  summarySkipped: document.querySelector("#summary-skipped"),
  summaryErrors: document.querySelector("#summary-errors"),
};

elements.scanButton.addEventListener("click", () => {
  void handleScanClick();
});

elements.downloadButton.addEventListener("click", () => {
  downloadExport();
});

render();

async function handleScanClick() {
  if (state.scanning) {
    return;
  }

  try {
    const granted = await chrome.permissions.request({
      origins: ["http://*/*", "https://*/*"],
    });

    if (!granted) {
      setStatus(
        "Chrome host access was denied. Grant site access if you want page content from tabs like x.com, Google, and Gemini.",
      );
      return;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setStatus(`Unable to request Chrome host access: ${message}`);
    return;
  }

  await runScan();
}

function readOptions() {
  return {
    includeHtml: elements.includeHtml.checked,
    maxTextChars: clampInteger(elements.maxTextChars.value, 1000, 2000000, 50000),
    maxHtmlChars: clampInteger(elements.maxHtmlChars.value, 5000, 4000000, 200000),
  };
}

function clampInteger(value, min, max, fallback) {
  const parsed = Number.parseInt(String(value), 10);

  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
}

function setStatus(message) {
  elements.status.textContent = message;
}

async function runScan() {
  if (state.scanning) {
    return;
  }

  state.scanning = true;
  state.exportData = null;
  setStatus("Scanning open tabs...");
  render();

  try {
    const options = readOptions();
    const exportData = await collectOpenTabs(options);
    state.exportData = exportData;

    const { summary } = exportData;
    const hostAccessErrorCount = exportData.tabs.filter((entry) =>
      entry.notes?.includes("Extension manifest must request permission to access the respective host."),
    ).length;

    if (hostAccessErrorCount > 0) {
      setStatus(
        `Scan finished. Captured ${summary.capturedTabs} tabs, skipped ${summary.skippedTabs}, errors ${summary.errorTabs}. Chrome is still restricting site access on ${hostAccessErrorCount} tabs; set this extension's Site access to On all sites and rescan.`,
      );
    } else {
      setStatus(
        `Scan finished. Captured ${summary.capturedTabs} tabs, skipped ${summary.skippedTabs}, errors ${summary.errorTabs}.`,
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setStatus(`Scan failed: ${message}`);
  } finally {
    state.scanning = false;
    render();
  }
}

async function collectOpenTabs(options) {
  const tabs = await chrome.tabs.query({});
  const orderedTabs = [...tabs].sort((left, right) => {
    if (left.windowId !== right.windowId) {
      return left.windowId - right.windowId;
    }

    return left.index - right.index;
  });

  const windowIds = [...new Set(orderedTabs.map((tab) => tab.windowId))];
  const windowLabels = new Map(windowIds.map((windowId, index) => [windowId, `Window ${index + 1}`]));
  const results = [];

  for (const [index, tab] of orderedTabs.entries()) {
    setStatus(`Scanning tab ${index + 1} of ${orderedTabs.length}: ${tab.title || tab.url || "Untitled tab"}`);

    const metadata = {
      windowId: tab.windowId,
      windowLabel: windowLabels.get(tab.windowId) ?? `Window ${tab.windowId}`,
      tabId: tab.id ?? null,
      tabIndex: tab.index,
      title: tab.title ?? "",
      url: tab.url ?? "",
      active: Boolean(tab.active),
      pinned: Boolean(tab.pinned),
      audible: Boolean(tab.audible),
      discarded: Boolean(tab.discarded),
      groupId: typeof tab.groupId === "number" ? tab.groupId : null,
      favIconUrl: tab.favIconUrl ?? null,
      loadingState: tab.status ?? "unknown",
    };

    const skipReason = getSkipReason(metadata.url);

    if (skipReason) {
      results.push({
        ...metadata,
        captureStatus: "skipped",
        notes: skipReason,
      });
      continue;
    }

    if (typeof tab.id !== "number") {
      results.push({
        ...metadata,
        captureStatus: "error",
        notes: "Chrome did not expose a usable tab id for this tab.",
      });
      continue;
    }

    try {
      const content = await captureTabContent(tab.id, metadata.url, options);

      results.push({
        ...metadata,
        captureStatus: "captured",
        notes: content.captureNote,
        content: content.payload,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({
        ...metadata,
        captureStatus: "error",
        notes: message,
      });
    }
  }

  const summary = buildSummary(results, windowLabels.size, options);

  return {
    generatedAt: new Date().toISOString(),
    tool: {
      name: "Open Tabs Exporter",
      version: "0.1.0",
    },
    options,
    summary,
    tabs: results,
  };
}

async function captureTabContent(tabId, url, options) {
  try {
    const injectionResults = await chrome.scripting.executeScript({
      target: { tabId },
      args: [options],
      func: (scanOptions) => {
        const normalizeWhitespace = (value) =>
          String(value ?? "")
            .replace(/\u0000/g, "")
            .replace(/\r/g, "")
            .replace(/[ \t]+\n/g, "\n")
            .replace(/\n{3,}/g, "\n\n")
            .trim();

        const documentElement = document.documentElement;
        const body = document.body;
        const rawText = body?.innerText || documentElement?.innerText || "";
        const rawHtml = scanOptions.includeHtml ? documentElement?.outerHTML || "" : "";
        const headings = Array.from(document.querySelectorAll("h1, h2, h3"))
          .map((heading) => ({
            level: heading.tagName.toLowerCase(),
            text: normalizeWhitespace(heading.textContent),
          }))
          .filter((heading) => heading.text.length > 0)
          .slice(0, 25);

        const metaDescription =
          document.querySelector('meta[name="description"]')?.getAttribute("content")?.trim() || null;
        const canonicalUrl = document.querySelector('link[rel="canonical"]')?.getAttribute("href") || null;
        const normalizedText = normalizeWhitespace(rawText);
        const trimmedText = normalizedText.slice(0, scanOptions.maxTextChars);
        const trimmedHtml = scanOptions.includeHtml ? rawHtml.slice(0, scanOptions.maxHtmlChars) : null;

        return {
          finalUrl: window.location.href,
          title: document.title || "",
          lang: documentElement?.lang || null,
          canonicalUrl,
          metaDescription,
          headings,
          textContent: trimmedText,
          textLength: normalizedText.length,
          textTruncated: normalizedText.length > scanOptions.maxTextChars,
          htmlContent: trimmedHtml,
          htmlLength: scanOptions.includeHtml ? rawHtml.length : 0,
          htmlTruncated: scanOptions.includeHtml ? rawHtml.length > scanOptions.maxHtmlChars : false,
        };
      },
    });

    const content = injectionResults[0]?.result ?? null;

    return {
      captureNote: content?.textTruncated
        ? `Text trimmed to ${options.maxTextChars.toLocaleString()} characters.`
        : "Captured successfully.",
      payload: content,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (!shouldTryNetworkFetch(message, url)) {
      throw error;
    }

    const fetchedPayload = await captureViaNetworkFetch(url, options);

    return {
      captureNote: `Captured via network fetch because live tab access was blocked: ${message}`,
      payload: fetchedPayload,
    };
  }
}

function shouldTryNetworkFetch(message, url) {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return false;
  }

  return (
    message.includes("Extension manifest must request permission to access the respective host.") ||
    message.includes("Cannot access contents of url") ||
    message.includes("The extensions gallery cannot be scripted.")
  );
}

async function captureViaNetworkFetch(url, options) {
  const response = await fetch(url, {
    credentials: "include",
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Network fetch failed with status ${response.status}.`);
  }

  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("text/html")) {
    throw new Error(`Network fetch returned unsupported content type: ${contentType || "unknown"}.`);
  }

  const html = await response.text();
  const parser = new DOMParser();
  const documentNode = parser.parseFromString(html, "text/html");

  return buildCapturedPayload({
    finalUrl: response.url || url,
    documentNode,
    rawHtml: html,
    options,
  });
}

function buildCapturedPayload({ finalUrl, documentNode, rawHtml, options }) {
  const normalizeWhitespace = (value) =>
    String(value ?? "")
      .replace(/\u0000/g, "")
      .replace(/\r/g, "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

  const textSource = documentNode.body?.innerText || documentNode.body?.textContent || documentNode.documentElement?.textContent || "";
  const normalizedText = normalizeWhitespace(textSource);
  const headings = Array.from(documentNode.querySelectorAll("h1, h2, h3"))
    .map((heading) => ({
      level: heading.tagName.toLowerCase(),
      text: normalizeWhitespace(heading.textContent),
    }))
    .filter((heading) => heading.text.length > 0)
    .slice(0, 25);

  const metaDescription = documentNode.querySelector('meta[name="description"]')?.getAttribute("content")?.trim() || null;
  const canonicalUrl = documentNode.querySelector('link[rel="canonical"]')?.getAttribute("href") || null;
  const lang = documentNode.documentElement?.getAttribute("lang") || null;

  return {
    finalUrl,
    title: documentNode.title || "",
    lang,
    canonicalUrl,
    metaDescription,
    headings,
    textContent: normalizedText.slice(0, options.maxTextChars),
    textLength: normalizedText.length,
    textTruncated: normalizedText.length > options.maxTextChars,
    htmlContent: options.includeHtml ? rawHtml.slice(0, options.maxHtmlChars) : null,
    htmlLength: options.includeHtml ? rawHtml.length : 0,
    htmlTruncated: options.includeHtml ? rawHtml.length > options.maxHtmlChars : false,
  };
}

function getSkipReason(url) {
  if (!url) {
    return "Chrome did not expose a URL for this tab.";
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    if (url.startsWith("https://chromewebstore.google.com/") || url.startsWith("https://chrome.google.com/webstore")) {
      return "Chrome blocks script injection on Chrome Web Store pages.";
    }

    return null;
  }

  if (url.startsWith("chrome://")) {
    return "Chrome internal pages cannot be inspected by extensions.";
  }

  if (url.startsWith("chrome-extension://")) {
    return "Extension pages are intentionally skipped.";
  }

  if (url.startsWith("about:")) {
    return "about: pages do not expose normal page content.";
  }

  if (url.startsWith("file://")) {
    return "Local file tabs need separate file access and are skipped by default.";
  }

  if (url.startsWith("devtools://")) {
    return "DevTools pages cannot be inspected by extensions.";
  }

  if (url.startsWith("view-source:")) {
    return "View-source pages are skipped.";
  }

  return `Unsupported URL scheme: ${url.split(":")[0] || "unknown"}.`;
}

function buildSummary(results, windowCount, options) {
  const capturedTabs = results.filter((entry) => entry.captureStatus === "captured");
  const skippedTabs = results.filter((entry) => entry.captureStatus === "skipped");
  const errorTabs = results.filter((entry) => entry.captureStatus === "error");
  const totalTextChars = capturedTabs.reduce((sum, entry) => sum + (entry.content?.textLength ?? 0), 0);
  const totalHtmlChars = capturedTabs.reduce((sum, entry) => sum + (entry.content?.htmlLength ?? 0), 0);

  return {
    windowCount,
    totalTabs: results.length,
    capturedTabs: capturedTabs.length,
    skippedTabs: skippedTabs.length,
    errorTabs: errorTabs.length,
    includeHtml: options.includeHtml,
    totalTextChars,
    totalHtmlChars,
  };
}

function render() {
  const exportData = state.exportData;
  elements.scanButton.disabled = state.scanning;
  elements.downloadButton.disabled = state.scanning || !exportData;

  if (!exportData) {
    elements.summaryWindows.textContent = "0";
    elements.summaryTabs.textContent = "0";
    elements.summaryCaptured.textContent = "0";
    elements.summarySkipped.textContent = "0";
    elements.summaryErrors.textContent = "0";
    elements.resultsMeta.textContent = "No scan has been run yet.";
    elements.resultsBody.innerHTML = '<tr><td colspan="6" class="empty-state">No results yet.</td></tr>';
    return;
  }

  const { summary, tabs } = exportData;
  elements.summaryWindows.textContent = summary.windowCount.toLocaleString();
  elements.summaryTabs.textContent = summary.totalTabs.toLocaleString();
  elements.summaryCaptured.textContent = summary.capturedTabs.toLocaleString();
  elements.summarySkipped.textContent = summary.skippedTabs.toLocaleString();
  elements.summaryErrors.textContent = summary.errorTabs.toLocaleString();

  const exportSize = new Blob([JSON.stringify(exportData)]).size;
  elements.resultsMeta.textContent =
    `${exportData.generatedAt} | ${summary.totalTextChars.toLocaleString()} text chars | ${formatBytes(exportSize)}`;

  const rows = tabs
    .map((entry) => {
      const title = escapeHtml(entry.title || "(Untitled tab)");
      const url = escapeHtml(entry.url || "(No URL)");
      const note = escapeHtml(entry.notes || "");
      const badgeClass =
        entry.captureStatus === "captured"
          ? "badge badge-captured"
          : entry.captureStatus === "skipped"
            ? "badge badge-skipped"
            : "badge badge-error";
      const textLength =
        entry.captureStatus === "captured" ? `${(entry.content?.textLength ?? 0).toLocaleString()} chars` : "-";
      const detailLine =
        entry.captureStatus === "captured" && entry.content?.metaDescription
          ? escapeHtml(entry.content.metaDescription)
          : entry.loadingState
            ? escapeHtml(`Load state: ${entry.loadingState}`)
            : "";
      const anchor =
        entry.url && (entry.url.startsWith("http://") || entry.url.startsWith("https://"))
          ? `<a href="${url}" target="_blank" rel="noreferrer">${url}</a>`
          : `<strong>${url}</strong>`;

      return `
        <tr>
          <td>${escapeHtml(entry.windowLabel)}</td>
          <td class="title-cell">
            <strong>${title}</strong>
            <span>Tab ${entry.tabIndex + 1}${entry.active ? " | active" : ""}${entry.pinned ? " | pinned" : ""}</span>
          </td>
          <td><span class="${badgeClass}">${escapeHtml(entry.captureStatus)}</span></td>
          <td class="url-cell">
            ${anchor}
            <small>${escapeHtml(entry.favIconUrl || "")}</small>
          </td>
          <td>${escapeHtml(textLength)}</td>
          <td class="notes-cell">
            <strong>${note}</strong>
            <small>${detailLine}</small>
          </td>
        </tr>
      `;
    })
    .join("");

  elements.resultsBody.innerHTML = rows || '<tr><td colspan="6" class="empty-state">No results yet.</td></tr>';
}

function formatBytes(value) {
  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function downloadExport() {
  if (!state.exportData) {
    return;
  }

  const json = JSON.stringify(state.exportData, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = `chrome-open-tabs-export-${state.exportData.generatedAt.replaceAll(":", "-")}.json`;
  anchor.click();
  URL.revokeObjectURL(blobUrl);
}
