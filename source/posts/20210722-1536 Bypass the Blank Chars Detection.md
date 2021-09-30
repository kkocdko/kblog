```
title: Bypass the Blank Chars Detection
date: 2021.07.22 15:36
tags: Tutorial JavaScript
description: Register a blank nickname or others
```

Almost every website's user registrations page will put blank chars into an invalid list, then reject your registration request during form checking.

The original reason for this was to avoid confusion for other users and protect some databases' indexes.

But sometimes we still want a blank user name, so:

## Method 1

Use some chars that are not in the invalid list, like [Braille Pattern Blank (U+2800)](https://unicode-table.com/en/2800/).

You could see more on [Unicode Table](https://unicode-table.com/en/search/?q=space). From my experience, different sites have different forbidden list.

## Method 2

Right click the input box, choose "Inspect Element", switch to "console" panel, then enter this code:

```javascript
$0.value = "<name includes blank>";
```

This method will not trigger `input` event, which is helpful when page has real time detection.
