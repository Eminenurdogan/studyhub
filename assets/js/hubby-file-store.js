(function initializeHubbyFileStore(global) {
  "use strict";

  const KEY = "studyhub.ai.files.v1";
  const readAll = () => {
    try {
      const value = JSON.parse(global.localStorage.getItem(KEY) ?? "[]");
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  };
  const writeAll = (files) =>
    global.localStorage.setItem(KEY, JSON.stringify(files));
  const createId = () =>
    global.crypto?.randomUUID?.() ||
    `file-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const save = (file, analysis) => {
    const files = readAll();
    const fingerprint = `${file.name}|${file.size}|${file.lastModified || 0}`;
    const existing = files.find((item) => item.fingerprint === fingerprint);
    if (existing) {
      const updated = {
        ...existing,
        uploadedAt: new Date().toISOString(),
        analysis,
      };
      writeAll([updated, ...files.filter((item) => item.id !== existing.id)]);
      return updated;
    }
    const record = {
      id: createId(),
      name: file.name,
      type:
        file.name.split(".").pop()?.toLocaleUpperCase("tr-TR") || "DOSYA",
      mimeType: file.type || "",
      size: file.size,
      uploadedAt: new Date().toISOString(),
      fingerprint,
      analysis,
    };
    writeAll([record, ...files].slice(0, 20));
    global.dispatchEvent(
      new CustomEvent("hubby:history-changed", {
        detail: { type: "file-saved", fileId: record.id },
      }),
    );
    return record;
  };
  const getAll = () =>
    readAll().sort(
      (first, second) =>
        new Date(second.uploadedAt) - new Date(first.uploadedAt),
    );
  const getById = (id) => getAll().find((file) => file.id === id) || null;

  global.StudyHubHubbyFileStore = Object.freeze({
    KEY,
    save,
    getAll,
    getById,
  });
})(window);
