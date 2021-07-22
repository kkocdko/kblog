```
title: Backup Data from VSCode Web
date: 2021.04.05 15:18
tags: Code JavaScript VSCode
description: Export / import the user data
```

> This code does nothing on VSCode 1.58+, caution!
>
> I will update this soon.

### Intro

The VSCode Web (like VSCode Remote, GitHub Codespaces) saves user data in [IndexedDB](https://developer.mozilla.org/docs/Web/API/IndexedDB_API) which will be lost if you clear the browser's storage.

This code snippet enable you to export and import the user data.

Run on DevTools. To switch between export / import, please modify the code at the end.

### Code

```javascript
const transact = async () => {
  const req = indexedDB.open("vscode-web-db");
  await new Promise((r) => (req.onsuccess = r));
  const storeName = "vscode-userdata-store";
  const transaction = req.result.transaction(storeName, "readwrite");
  const oncomplete = new Promise((r) => (transaction.oncomplete = r));
  return { store: transaction.objectStore(storeName), oncomplete };
};
const exportData = async () => {
  const list /* You can add entries here */ = [
    "/User/settings.json",
    "/User/keybindings.json",
    "/User/state/global.json",
    "/User/workspaceStorage/",
  ];
  const allKeysReq = (await transact()).store.getAllKeys();
  await new Promise((r) => (allKeysReq.onsuccess = r));
  const match = (key) => list.find((i) => key.startsWith(i));
  const keys = allKeysReq.result.filter(match);
  const { store, oncomplete } = await transact();
  const reqs = keys.map((key) => store.get(key));
  await oncomplete;
  const decoder = new TextDecoder();
  const group = {};
  keys.forEach((k, i) => (group[k] = btoa(decoder.decode(reqs[i].result))));
  const link = document.createElement("a");
  link.download = "vscode-web-backup_" + Date.now() + ".json";
  link.href = "data:text/json," + encodeURIComponent(JSON.stringify(group));
  link.click();
};
const importData = async () => {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.click();
  await new Promise((r) => (fileInput.onchange = r));
  const fileReader = new FileReader();
  fileReader.readAsText(fileInput.files[0]);
  await new Promise((r) => (fileReader.onload = r));
  const group = JSON.parse(fileReader.result);
  const encoder = new TextEncoder();
  const b2u = (s) => encoder.encode(atob(s));
  const { store, oncomplete } = await transact();
  store.clear();
  for (const key in group) store.put(b2u(group[key]), key);
  await oncomplete;
  location.reload();
};
exportData();
// importData();
```

- You can wrap the code in `(()=>{ /* CODE */ })()` to avoid name pollution.
