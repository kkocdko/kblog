<h1 style="text-align:center">
<img style="width:37px;vertical-align:bottom" src="//kkocdko.github.io/favicon.svg">
KBlog
<br>
<p style="font-size:14px;margin:7px 0 -3px 0">
A static blog solution, lightweight, fast, beautiful and practical.
</p>
<img src="//img.shields.io/github/languages/code-size/kkocdko/kkocdko.github.io.svg?color=brightgreen">
<img src="//img.shields.io/badge/code_style-standard-brightgreen.svg">
<img src="//img.shields.io/github/license/kkocdko/kkocdko.github.io.svg?color=brightgreen">
</h1>

### Demo

![001](https://kkocdko.github.io/src/img/20190101-001011-001.webp)

<https://kkocdko.github.io>

### Features

* SPA with native javascript, see [History API](https://developer.mozilla.org/docs/Web/API/History).

* Size < 40kb before gzip.

* Build quickly, few dependents.

* Mobile & Desktop. Follow [Material Design](https://www.material.io).

#### but...

* Navigation by 404 page, very bad for SEO.

* Only supports modern browsers like `Chrome55+`, `Firefox52+` (Test date: 20190215)

### Usage

1. You need [NodeJS](https://nodejs.org).

2. Download the `develop` branch of this repo.

3. Enter the blog directory and run `npm install`.

4. Write posts in the format of the example into `_post` directory.

5. Run `npm run dev`, and then open your blog in browser.

6. Push to github. You should put the content of `dist` directory into master branch.

### Migrating

* Here are some tips that can help you migrating from other platform.

#### From [Jekyll](https://jekyllrb.com)

1. Pay attention to the header of post, you may need to replace some item names.

2. Need to build locally and then push the results to the cloud.
