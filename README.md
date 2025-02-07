# kblog - ([webusbkvm](https://github.com/kkocdko/kblog/tree/master/source/toys/webusbkvm) inside)

[![Address](https://img.shields.io/badge/address-kkocdko.site-293?style=flat)](https://kkocdko.site)
[![Size](https://img.shields.io/badge/brotil%20size-2.7%20KB-293?style=flat)](https://kkocdko.site/res/20210612-0010-001.webp)
[![License](https://img.shields.io/github/license/kkocdko/kblog?style=flat&color=293)](LICENSE)

My Blog · 3 KB · Single Page · Material Design

## Intro

A unique blog solution, which is:

- 🗜️ Tiny, less than `3 KB` (after brotli).

- ⚡️ Fast, Single Page App built with vanilla JavaScript.

- 💎 Pretty, follow Material Design.

## Usage

```sh
npm i # or download stripped node_modules from release page
node . serve # serve | generate | develop
```

<details>
<summary>Nerd tips</summary>

### Publish to Vercel manually

```sh
node . generate
cd public
mkdir -p .vercel
echo '{ "projectId": "prj_xxx", "orgId": "team_xxx" }' > .vercel/project.json # use vercel link
echo '{ "framework": null, "headers": [{ "source": "/(.*)", "headers": [{ "key": "Cache-Control", "value": "max-age=30, stale-while-revalidate=604800" }] }] }' > vercel.json
vercel whoami
vercel pull --prod
vercel build --prod
vercel deploy --prod --prebuilt --archive=tgz
cd ..
# npm i -g vercel # 41.0.2 , you can remove all inside `./vercel/node_modules/` except of the `@vercel`
```

</details>

## Contributing

Follow [prettier](https://github.com/prettier/prettier) and [stylelint-config-recess-order](https://github.com/stormwarning/stylelint-config-recess-order).
