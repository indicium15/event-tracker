// Shared persistence and table helpers for the per-sport event trackers.
// Load before the sport's index.js:
//   <script src="{{ url_for('static', filename='js/tracker-storage.js') }}"></script>
(function (global) {
  "use strict";

  const STANDARD_SUFFIXES = [
    "ShotsData",
    "HomePlayerMap",
    "AwayPlayerMap",
    "EventNames",
  ];

  // Label keys that may be reset when defaultsVersion bumps. ShotsData is omitted on purpose.
  const LABEL_SUFFIXES = ["HomePlayerMap", "AwayPlayerMap", "EventNames"];
  const EVENT_SUFFIXES = STANDARD_SUFFIXES.filter((s) => !LABEL_SUFFIXES.includes(s));

  // iOS private browsing can throw on localStorage writes; fall back once.
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

  // Prefer localStorage so match data survives a killed tab/webview.
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
      ownedKeys,
      eventKeys: EVENT_SUFFIXES.map((s) => prefix + s),
      prefix,
    };

    // Migrate any leftovers from sessionStorage into localStorage.
    if (backingStore !== sessionStorage) {
      ownedKeys.forEach(function (key) {
        const legacy = sessionStorage.getItem(key);
        if (legacy !== null && store.get(key) === null) {
          store.set(key, legacy);
        }
        sessionStorage.removeItem(key);
      });
    }

    if (config.defaultsVersion) {
      const versionKey = prefix + "DefaultsVersion";
      if (store.get(versionKey) !== config.defaultsVersion) {
        LABEL_SUFFIXES.forEach((s) => store.remove(prefix + s));
        store.set(versionKey, config.defaultsVersion);
      }
    }

    return store;
  }

  // DataTables row indexes are stable ids, not array positions after deletions.
  function arrayPositionForRow(table, row) {
    const rowIndex = row.index();
    if (rowIndex === undefined) {
      return -1;
    }
    return table.rows({ order: "index" }).indexes().toArray().indexOf(rowIndex);
  }

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

  function exportSessionData(store) {
    const data = {};
    store.ownedKeys.forEach(function (key) {
      const value = store.get(key);
      if (value !== null) {
        data[key] = value;
      }
    });
    return data;
  }

  function downloadSessionData(store, filename) {
    const blob = new Blob([JSON.stringify(exportSessionData(store), null, 2)], {
      type: "application/json",
    });
    saveBlob(blob, filename);
  }

  function importSessionData(store, file) {
    return file.text().then(function (text) {
      let data;
      try {
        data = JSON.parse(text);
      } catch (error) {
        throw new Error("That file isn't valid session JSON");
      }
      store.ownedKeys.forEach(function (key) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          store.set(key, data[key]);
        }
      });
      return data;
    });
  }

  function saveTrackerSession(store, getCurrentDateTime) {
    downloadSessionData(
      store,
      `${store.prefix}_session_${getCurrentDateTime().replace(/[/: ]/g, "-")}.json`
    );
  }

  function loadTrackerSessionFile(store, fileInput) {
    const file = fileInput.files[0];
    if (!file) {
      return;
    }
    importSessionData(store, file)
      .then(() => location.reload())
      .catch((error) => alert(`Could not load session: ${error.message}`));
    fileInput.value = "";
  }

  function clearTrackedEvents(store, table, shotsData) {
    table.clear().draw();
    shotsData.length = 0;
    store.eventKeys.forEach((key) => store.remove(key));
  }

  function updateTrackerButtonStates(table) {
    const isEmpty = table.rows().count() === 0;
    ["save-session", "clear-all-events"].forEach(function (id) {
      const button = document.getElementById(id);
      if (button) {
        button.disabled = isEmpty;
      }
    });
  }

  global.createTrackerStore = createTrackerStore;
  global.arrayPositionForRow = arrayPositionForRow;
  global.saveBlob = saveBlob;
  global.downloadExport = downloadExport;
  global.exportSessionData = exportSessionData;
  global.downloadSessionData = downloadSessionData;
  global.importSessionData = importSessionData;
  global.saveTrackerSession = saveTrackerSession;
  global.loadTrackerSessionFile = loadTrackerSessionFile;
  global.clearTrackedEvents = clearTrackedEvents;
  global.updateTrackerButtonStates = updateTrackerButtonStates;
})(window);
