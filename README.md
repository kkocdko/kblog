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

### Introduction

This is a blog solution that can run on [Github Pages](https://pages.github.com). See [Demo](https://kkocdko.github.io) (my blog).

#### Features

* Lightweight, size < 15kb (minify + gzip).

* Fast, [Single-Page-App](https://en.wikipedia.org/wiki/Single-page_application) with pure javascript.

* Mobile & Desktop. Follow [Material Design](https://www.material.io).

#### Disadvantage

* Only supports modern browsers. Target to `Chrome55+` and `Firefox52+`.

* No `CRLF` support. Must use the `LF` newline in all files.

### Usage

1. Download the `develop` branch of this repository.

2. Enter the blog directory and execute `npm install`.
    * Need [NodeJS](https://nodejs.org)

3. Write posts in the format of the example to `./data/posts` folder.
    * You can put images into `./data/media` folder, using them in posts like this: `![001](/res/media/001.png)`

4. (Optional) Execute `npm run dev` and view your blog in browser.

5. Execute `npm run build` and put the content of `dist` directory into `master` branch, then push to github.

### Migrating

* Here are some tips that can help you migrating from other platforms.

#### From [Jekyll](https://jekyllrb.com)

1. Pay attention to the port's meta, you may need to replace some meta names.

2. Need to build locally and then push the results to the cloud.

### Q&A

#### Why don't use build tool and framework?

It's sure that modern front-end tools bring a lot of convenience, but this project is just an acrobatics, not a product. I want a lightweight solution, both front-end and development-end.
