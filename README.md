<h1 align="center">
<img height="43" align="top" src="https://kkocdko.github.io/favicon.svg">
KBlog
</h1>
<p align="center">
A static blog solution. Lightweight, fast, beautiful and practical.
</p>
<p align="center">
<img src="https://img.shields.io/github/languages/code-size/kkocdko/kkocdko.github.io.svg?color=brightgreen">
<img src="https://img.shields.io/badge/code_style-standard-brightgreen.svg">
<img src="https://img.shields.io/github/license/kkocdko/kkocdko.github.io.svg?color=brightgreen">
</p>

### Demo

![001](https://kkocdko.github.io/src/img/20190101-001011-001.webp)

<https://kkocdko.github.io>

### Features

* SPA with native javascript, size < 35kb before gzip.

* Build quickly, few dependents.

* Mobile & Desktop. Follow [Material Design](https://www.material.io).

#### but...

* Navigation by 404 page, very bad for SEO.

* Only supports modern browsers like `Chrome55+`, `Firefox59+` (Test date: 20190807).

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
