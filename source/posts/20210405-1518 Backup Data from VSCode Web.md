```
title: Backup Data from VSCode Web
date: 2021.04.05 15:18
tags: Code JavaScript VSCode
description: Export / import the user data
```

> Tested on VSCode 1.56 ~ 1.59, may become invalid in a future version.

## Intro

VSCode Web (like VSCode Remote, GitHub Codespaces) saves user data in [IndexedDB](https://developer.mozilla.org/docs/Web/API/IndexedDB_API) which will be lost if you clear the browser storage.

This code snippet enables you to export and import the user data. Run on DevTools, please **save your work** before doing anything!

## Code

```javascript
(async function exportData() {
  const json = {};
  const decoder = new TextDecoder();
  for (const { name: dbName } of await indexedDB.databases()) {
    json[dbName] = {};
    const req = indexedDB.open(dbName);
    await new Promise((r) => (req.onsuccess = r));
    for (const storeName of req.result.objectStoreNames) {
      json[dbName][storeName] = {};
      const transaction = req.result.transaction(storeName);
      const store = transaction.objectStore(storeName);
      const keysReq = store.getAllKeys();
      const valuesReq = store.getAll();
      await new Promise((r) => (transaction.oncomplete = r));
      for (const k of keysReq.result) {
        const v = valuesReq.result.shift();
        const item = { type: v.constructor.name }; // String | Uint8Array
        const str = item.type === "String" ? v : decoder.decode(v);
        item.value = encodeURIComponent(str);
        json[dbName][storeName][k] = item;
      }
    }
  }
  const link = document.createElement("a");
  link.download = "vscode-web-backup_" + Date.now() + ".json";
  link.href = "data:text/json," + encodeURIComponent(JSON.stringify(json));
  link.click();
})();
```

```javascript
(async function importData() {
  const input = document.createElement("input");
  input.type = "file";
  input.click();
  await new Promise((r) => (input.onchange = r));
  const reader = new FileReader();
  reader.readAsText(input.files[0]);
  await new Promise((r) => (reader.onload = r));
  const encoder = new TextEncoder();
  for (const [dbName, dbData] of Object.entries(JSON.parse(reader.result))) {
    const req = indexedDB.open(dbName);
    req.onupgradeneeded = ({ target: { result: db } }) =>
      Object.keys(dbData).forEach((name) => db.createObjectStore(name));
    await new Promise((r) => (req.onsuccess = r));
    for (const [storeName, storeData] of Object.entries(dbData)) {
      const transaction = req.result.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      store.clear(); // Avoid config conflict
      for (const [key, { type, value }] of Object.entries(storeData)) {
        const str = decodeURIComponent(value);
        store.put(type === "String" ? str : encoder.encode(str), key);
      }
      await new Promise((r) => (transaction.oncomplete = r));
    }
  }
  location.reload();
})();
```

## Change Log

### 20210729

- Reduce code.

### 20210728

- Update for VSCode `1.58`.

### 20210405

- First version.
