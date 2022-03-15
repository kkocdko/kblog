```
title: Dump PDF from HEP Website
date: 2022.03.14 23:18
tags: Tutorial Code JavaScript PDF
description: Bypass the encryption, may be broader used
```

## Background

As we know many publishers in China has [provided ebooks for home studies](https://library.xmu.edu.cn/info/1032/3824.htm) after the COVID-19 epidemic. But some of them like HEP **only allow you to read online**, so bad.

## Steps

Open a reader page such as [this one](https://ebook.hep.com.cn/ebooks/read/index.html#/pdfReader?url=https%3A%2F%2Fgateway.keledge.com%2Ftransfer%2Faqr%2Fauthorize&contentexternalid=P00079-01-9787040396638-Pdf), toggle developer tools and switch to `Network` tab, you will found some PDF file requests. Download and open it? Oh no, it's encrypted. These files have `BB 51 1F 73` magic code，but a formal PDF file should be `25 50 44 46`. Certainly, you could fiddle tenaciously with the code and finally found a way to decrypt.

However, we observed that this page is using [pdf.js](https://github.com/mozilla/pdf.js) to render the document, this is the weak point!

Type `pdfjsLib.version` in console, we got the version `2.2.228`. Now download [pdf_viewer.js](https://cdn.jsdelivr.net/npm/pdfjs-dist@2.2.228/web/pdf_viewer.js) and make some modify. Replace line 7558 `return _possibleConstructorReturn ...` with:

```javascript
let ret = "{ expression after `return` }";
window.hook = window.hook || [];
hook.push(ret);
return ret;
```

Install [Header Editor](https://chrome.google.com/webstore/detail/eningockdidmgiojffjmkdblpjocbhgh) extension, create a rule and redirect page's `pdf_viewer.js` to own one, or you can use the override function in developer tools.

Reload the page, you could dump decrypted PDF data by `hooks[i].pdfDocument.getData()`. Here is a code snippet that allows you to dump pages automatically:

```javascript
for (const [index, box] of canvas_box.childNodes.entries()) {
  // if (index < 210) continue; // skip
  box.scrollIntoView();
  while (!box.querySelector("canvas"))
    await new Promise((r) => setTimeout(r, 50));
  await new Promise((r) => setTimeout(r, 200));
  const entry = hook.find((entry) => entry.container === box);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([await entry.pdfDocument.getData()]));
  a.download = `${index}.pdf`.padStart(7, 0);
  a.click();
}
```

You may need to turn off "Ask where to save each file before downloading" in browser settings.

## Result Demo

<https://lanzoui.com/b0108u0lg>
