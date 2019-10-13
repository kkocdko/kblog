<h1 align="center">
<img height="43" align="top" src="https://kkocdko.github.io/favicon.svg">
kblog
</h1>
<p align="center">
An unique blog solution. Lightweight, fast, beautiful and practical.
</p>
<p align="center">
<img src="https://img.shields.io/github/languages/code-size/kkocdko/kkocdko.github.io.svg?style=flat-square&color=4caf50">
<img src="https://img.shields.io/badge/code_style-standard-0.svg?style=flat-square&color=4caf50">
<img src="https://img.shields.io/github/license/kkocdko/kkocdko.github.io.svg?style=flat-square&color=4caf50">
</p>

### Demo

My blog: <https://kkocdko.github.io>

### Features

* SPA with native javascript, size < 15kb minify + gzip.

* Build quickly, few dependents.

* Mobile & Desktop. Follow [Material Design](https://www.material.io).

### Matters

* Navigation by 404 page, very bad for SEO.

* No `CRLF` support. Must use the `LF` newline in all files.

* Only supports modern browsers. Target to `Chrome55+` and `Firefox52+`, support to `Chrome49+` and `Firefox50+` (Test date: 2019-10-13).

### Usage

* You need [NodeJS](https://nodejs.org).

1. Download the `develop` branch of this repo.

2. Enter the blog directory and run `npm install`.

3. Write posts in the format of the example into `_post` directory.

4. Run `npm run dev` and view your blog in browser.

5. Put the content of `dist` directory into master branch, then push to github.

### Migrating

* Here are some tips that can help you migrating from other platform.

#### From [Jekyll](https://jekyllrb.com)

1. Pay attention to the header of post, you may need to replace some item names.

2. Need to build locally and then push the results to the cloud.
