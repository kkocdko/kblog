<h1 align="center">
<img height="43" align="top" src="https://kkocdko.github.io/favicon.svg">
kblog
</h1>
<p align="center">
An unique blog solution. Lightweight, fast, beautiful and practical.
</p>
<p align="center">
<img src="https://img.shields.io/github/languages/code-size/kkocdko/kkocdko.github.io.svg?style=flat-square&color=4caf50">
<img src="https://img.shields.io/badge/code_style-standard-brightgreen.svg?style=flat-square&color=4caf50">
<img src="https://img.shields.io/github/license/kkocdko/kkocdko.github.io.svg?style=flat-square&color=4caf50">
</p>

### Demo

My blog: <https://kkocdko.github.io>

### Features

* SPA with pure javascript, size < 15kb minify + gzip.

* Build quickly, few dependents.

* Mobile & Desktop. Follow [Material Design](https://www.material.io).

### Matters

* Navigation by 404 page, very bad for SEO.

* No `CRLF` support. Must use the `LF` newline in all files.

* Only supports modern browsers. Target to `Chrome55+` and `Firefox52+`.

### Usage

1. Download the `develop` branch of this repo.

2. Enter the blog directory and run `npm install`.
    * Need [NodeJS](https://nodejs.org).

3. Write posts in the format of the example to `_post` folder.
    * You can put images into `_img` directory, using them like this in posts: `![001](/src/img/001.png)`

4. (Optional) Run `npm run dev` and view your blog in browser.

5. Run `npm run build` and put the content of `dist` directory into master branch, then push to github.

### Migrating

* Here are some tips that can help you migrating from other platform.

#### From [Jekyll](https://jekyllrb.com)

1. Pay attention to the header of post, you may need to replace some item names.

2. Need to build locally and then push the results to the cloud.
