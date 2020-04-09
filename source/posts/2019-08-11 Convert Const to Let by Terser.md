```
title: Convert Const to Let by Terser
date: 2019-08-11 05:50:06
category: Tutorial
tags: Terser Javascript NodeJS Compress
description: Using TreeTransformer
```

> [Terser](https://github.com/terser-js/terser) is a Javascript optimizer for ES6+.

### Why

`const` is a keyword to define a unchangeable thing, it can make code stronger. But if you use `const`, Terser will not convert it to `let`. This **wastes more than two chars**:

Source:

```javascript
const a = 1
let b = 2
const c = 3
```

Terser output:

```javascript
const a=1;let b=2;const c=3; // 28 chars
```

If Terser convert `const` to `let`:

```javascript
let a=1,b=2,c=3; // 16 chars
```

But Terser's major contributors [refuse to implement this feature](https://github.com/terser-js/terser/issues/172). Certainly, is unsafe, but who will try to change a constant?

### Solution

```javascript
const Terser = require('terser')
const jsStr = 'const a = 0;'
const transformer = new Terser.TreeTransformer(node => {
  if (node instanceof Terser.AST_Const) {
    return new Terser.AST_Let(node)
  }
})
const ast = Terser.parse(jsStr).transform(transformer)
const minifiedJsStr = Terser.minify(ast).code
constle.log(minifiedJsStr) // => "let a=0;"
```

* Want to know more? See <https://github.com/terser-js/terser#working-with-terser-ast>
