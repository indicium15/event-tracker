// Shared persistence and table helpers for the per-sport event trackers.
//
// Every sport's static/index.js keeps its recorded events in browser storage
// and mirrors them into a DataTable. Both of those had the same two bugs in
// every sport, so the fixes live here rather than in six near-identical copies.
//
// Load this before the sport's index.js:
//   <script src="{{ url_for('static', filename='js/tracker-storage.js') }}"></script>
(function (global) {
  "use strict";

  // Keys every sport stores, minus its prefix. Sports with extra state (e.g.
  // basketballCourtType) pass those through `extraKeys` so they migrate too.
  const STANDARD_SUFFIXES = [
    "RawShots",
    "ShotsData",
    "HomePlayerMap",
    "AwayPlayerMap",
    "EventNames",
  ];

  // Only label data may be reset when a sport ships new defaults. Recorded
  // events (RawShots / ShotsData) are deliberately absent from this list.
  const LABEL_SUFFIXES = ["HomePlayerMap", "AwayPlayerMap", "EventNames"];

  // iOS private browsing gives localStorage a zero quota and throws on write,
  // so probe it once and fall back to sessionStorage rather than losing every
  // save. Shared across sports: the probe result can't differ between them.
  const backingStore = (function () {
    try {
      const probe = "__trackerStorageProbe";
      localStorage.setItem(probe, "1");
      localStorage.removeItem(probe);
      return localStorage;
    } catch (error) {
      console.warn(
        "localStorage unavailable, falling back to sessionStorage",
        error
      );
      return sessionStorage;
    }
  })();

  // Match data belongs in localStorage, not sessionStorage. sessionStorage is
  // scoped to a single browsing context, so it is thrown away whenever the tab
  // is closed or the browser/webview process is killed — which is exactly what
  // happens on a tablet when the page comes back after a crash. localStorage
  // survives all of that, so an interrupted match keeps its recorded events.
  //
  // config: { prefix, extraKeys?, defaultsVersion? }
  function createTrackerStore(config) {
    const prefix = config.prefix;
    const extraKeys = config.extraKeys || [];
    const ownedKeys = STANDARD_SUFFIXES.map((s) => prefix + s).concat(extraKeys);

    const store = {
      get(key) {
        try {
          return backingStore.getItem(key);
        } catch (error) {
          console.error(`Could not read ${key}`, error);
          return null;
        }
      },
      set(key, value) {
        try {
          backingStore.setItem(key, value);
          return true;
        } catch (error) {
          console.error(`Could not save ${key}`, error);
          return false;
        }
      },
      remove(key) {
        try {
          backingStore.removeItem(key);
        } catch (error) {
          console.error(`Could not remove ${key}`, error);
        }
      },
    };

    // Carry over anything an earlier version left in sessionStorage so a match
    // already in progress isn't lost when this build ships.
    if (backingStore !== sessionStorage) {
      ownedKeys.forEach(function (key) {
        const legacy = sessionStorage.getItem(key);
        if (legacy !== null && store.get(key) === null) {
          store.set(key, legacy);
        }
        sessionStorage.removeItem(key);
      });
    }

    // Fresh labels when the defaults shipped with the app change. Bumping
    // defaultsVersion resets them once, rather than on every page load.
    if (config.defaultsVersion) {
      const versionKey = prefix + "DefaultsVersion";
      if (store.get(versionKey) !== config.defaultsVersion) {
        LABEL_SUFFIXES.forEach((s) => store.remove(prefix + s));
        store.set(versionKey, config.defaultsVersion);
      }
    }

    return store;
  }

  // DataTables row indexes are stable ids, not positions: once a row has been
  // removed the remaining ids no longer line up with the shotsData/rawShots
  // arrays. Map an id back to a position by walking rows in insertion order.
  // Returns -1 when the row can't be located.
  function arrayPositionForRow(table, row) {
    const rowIndex = row.index();
    if (rowIndex === undefined) {
      return -1;
    }
    return table.rows({ order: "index" }).indexes().toArray().indexOf(rowIndex);
  }

  // Hand a blob to the browser as a download. The object URL is revoked once
  // the click has been dispatched — leaving them alive pins the whole blob in
  // memory, which matters on a tablet where an export can be several MB.
  function saveBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 10000);
  }

  // Exports must never take the recorded events down with them: the data is
  // already in storage before this runs, and a failed request reports the error
  // instead of downloading the server's error page as if it were a report.
  function downloadExport(url, payload, filename, label) {
    console.log(`Downloading ${label}...`);
    return fetch(url, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }
        return response.blob();
      })
      .then((blob) => saveBlob(blob, filename))
      .catch((error) => {
        console.error(`Error downloading ${label}:`, error);
        alert(
          `Could not download the ${label}: ${error.message}\n\n` +
            "Your recorded events are still saved — try again."
        );
      });
  }

  global.createTrackerStore = createTrackerStore;
  global.arrayPositionForRow = arrayPositionForRow;
  global.saveBlob = saveBlob;
  global.downloadExport = downloadExport;
})(window);
