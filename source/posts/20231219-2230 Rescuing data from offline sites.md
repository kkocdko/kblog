```
title: Rescuing data from offline sites
date: 2023.12.19 22:30
tags: Tutorial Web Browser
description: Dump localStorage and indexedDB when the site is inaccessible
```

Accidentally a site has been down, for any reason like the domain changed or you're moving from an offline device, you'll find that the data in web storage is unreadable.

DevTools? Open a page like this:

> This site can’t be reached - a.kkocdko.site unexpectedly closed the connection.

Type `localStorage` in DevTools "Console" tab:

> `>` `localStorage`
>
> `Uncaught DOMException: Failed to read the 'localStorage' property from 'Window': Access is denied for this document. at <anonymous>:1:1`

Chrome prevents you from accessing web storage if the server can't produce a valid response.

The solution is DevTools "Overrides" function. Switch to "Sources" tab, open "Overrides" panel, and select a folder. Recommend creating a new directory.

Because the server is down, you should **create a folder named as current domain manually** instead of some "create overrides" menu entry. Then create a blank `index.html`. Like this:

```
- overrides
  - a.kkocdko.site
    - index.html
```

Refresh and the blank page shown as expected. Now you can dump / restone storage using `JSON.stringify(localStorage)` and `Object.assign(localStorage, xxx)`.

> `>` `localStorage`
>
> `Storage {a: '1', length: 1}`

## Other ways

- Use service worker to respond.

- Read directly from Chromium's localStorage levelDB file.

- Run a local DNS or use hosts file to hijack the site.
