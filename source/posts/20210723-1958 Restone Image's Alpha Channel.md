```
title: Restone Image's Alpha Channel
date: 2021.07.23 19:58
tags: Tutorial Media
description: Photoshop doesn't seem to provide this
```

Here is a simple but special problem: I need an icon from the app, but it is rendered dynamic by code, couldn't be extracted directly from the app package.

Just take a screenshot? This icon has some translucent parts. Use Photoshop to make translucent effect? Seems good, but it is impossible to restone alpha channel **precisely**. Why?

## Algorithm

```javascript
[fgR, fgG, fgB, alpha], [bgR, bgG, bgB];
outR = fgR * aplha + bgR * (1 - aplha);
```

Let's take a look at the algorithm for adding a background to a translucent image.

There are two unknowns in this equation! That's why Photoshop can't solve this problem. For example, with background `rgb(255, 255, 255)`, both `rgba(0, 0, 0, 63)` and `rgba(63, 63, 63, 255)` will mix the same result. So, we need two equations.

## Solution

Forcibly change the background color of app by debug tools, take two screenshots with different backgrounds.

Then, try my online tool: [/toy/realpha](/toy/realpha)

<img src="/res/20210723-1958-001.webp" width="640" height="984">

Click the left-top and right-top rectangles can load images with different backgrounds.

Input the background color, then click the big rectangle at the bottom to generate the output image.

Right-click the image to save.
