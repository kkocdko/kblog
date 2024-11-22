import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import worker_threads from "node:worker_threads";
import marked from "marked";
import htmlclean from "htmlclean";
import terser from "terser";

if (import.meta.dirname !== process.cwd())
  throw Error("Current directory is different from project directory");

if (process.argv.includes("develop")) {
  const childs = [];
  const exec = (argv) => {
    const worker = new worker_threads.Worker(import.meta.dirname, { argv });
    childs.push(worker.on("error", console.error));
  };
  let i = 0;
  const spawn = () => {
    console.log("#", ++i);
    childs.forEach(() => childs.pop().terminate());
    exec(["serve", "--dev"]);
  };
  spawn();
  process.stdin.on("data", spawn);
  await new Promise(() => {}); // Prevent script from continuing to run
} else if (process.argv.includes("serve")) {
  const port = 4000;
  const mime = {
    html: "text/html;charset=utf8",
    js: "text/javascript",
    svg: "image/svg+xml",
  };
  const r2a = path.join.bind(null, import.meta.dirname, "public");
  // (await import("node:https")).createServer((p=>(p=([s])=>fs.readFileSync(`/home/kkocdko/.local/share/caddy/certificates/local/127.0.0.1/127.0.0.1.${s}`),{key:p`key`,cert:p`crt`}))(),({url},res)=>{
  const server = http.createServer(({ url }, res) => {
    const pair = [
      [200, r2a(url)],
      [200, r2a(url, "index.html")],
      [404, r2a("404.html")],
    ].find(([_, p]) => fs.existsSync(p) && fs.statSync(p).isFile());
    if (!pair) return res.writeHead(404).end("404 Not Found");
    const [status, local] = pair;
    res.setHeader("content-type", mime[local.split(".").pop()] || "");
    res.writeHead(status).end(fs.readFileSync(local));
  });
  server.listen(port, "127.0.0.1");
  console.info(`server: 127.0.0.1:${port}`);
  // Fall through here, go ahead and run generator
} else if (process.argv.includes("generate")) {
} else {
  throw Error("unknown function"); // https://stackoverflow.com/questions/73742023
}

console.time("generate time");

const html = ([s]) => s; // Please use this extension to show syntax highlight: https://github.com/0x00000001A/es6-string-html
const css = ([s]) => s;
// Front-end units
const units = {
  avatarSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" style="background:#333c3e"><path d="M-40 1000L0 0h960z" fill="#009083"/><path d="M-40 1000l318-318L0 200z" fill="#23b39b"/><path d="M-40 1000l318-318L0 521z" fill="#95e9dd"/><path d="M-40 1000l318-318 184 318z" fill="#698287"/><path d="M490 710L1200 0H80z" fill="#027e63"/><path d="M490 710L1200 0h360L718 842z" fill="#38574c"/></svg>`,
  mainCss: css`
    * {
      max-height: 100%; /* Disable Font Boosting */
      margin: 0;
    }
    html {
      font-family: sans-serif;
      line-height: 1.8;
      overflow-wrap: break-word;
      background: #f8f9fa;
      -webkit-tap-highlight-color: #0000;
    }
    a {
      color: #3f51b5;
      text-decoration: none;
    }
    main {
      width: 100%;
      min-height: 100vh;
      margin: 50px 0 0;
    }
    main > * {
      padding: 20px;
      margin-top: 1px;
      background: #fff;
      box-shadow: 0 1px #ddd;
    }
    @media (min-width: 750px) {
      main {
        width: 700px;
        margin: 75px auto 5px;
      }
      main > * {
        margin-top: 20px;
        border-radius: 8px;
        box-shadow: 0 1px 4px #aaa;
      }
    }
    main h1 {
      padding-bottom: 7px;
      margin: -9px 0 13px;
      font-weight: 400;
      box-shadow: 0 1px #ddd;
    }
    section > * {
      margin-top: 3px; /* For section > p */
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    section h3 {
      margin: -8px 0 5px;
      font-weight: 400;
    }
    section div {
      margin: 9px 0 -2px;
    }
    section div a,
    section > a,
    section span {
      padding: 2px 7px;
      margin: 5px 5px -4px 0;
      font-size: 13px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    section > a {
      display: inline-block;
    }
    nav {
      padding: 0;
      text-align: center;
    }
    nav a {
      display: inline-block;
      padding: 7px 6%;
      font-size: 14px;
    }
    header {
      position: fixed;
      top: 0;
      width: 100%;
      background: #3f51b5;
      box-shadow: 0 0 5px #aaa;
      transition: 0.2s;
    }
    header.hidden {
      transform: translateY(-55px);
    }
    header > * {
      float: left;
      height: 28px;
      padding: 11px;
      fill: #fff;
    }
    header a + * {
      float: right;
    }
    header img {
      width: 24px;
      margin-left: -10px;
      border: 2px solid #fff;
      border-radius: 50%;
    }
    footer {
      font-size: 13px;
      line-height: 3;
      text-align: center;
    }
    aside {
      position: fixed;
      top: 0;
      width: 100%;
      height: 100%;
      background: #0008;
      transition: 0.3s;
    }
    aside.hidden {
      visibility: hidden;
      background: #0000;
    }
    aside div {
      width: 70%;
      max-width: 230px;
      height: 100%;
      padding-top: 50px;
      overflow: auto;
      background: #fff;
      transition: 0.3s;
    }
    aside.hidden div {
      transform: translateX(-100%);
    }
    aside a {
      display: block;
      padding-left: 15%;
      line-height: 4;
      color: #333;
    }
    spin-circle {
      position: fixed;
      opacity: 0;
    }
    .loading spin-circle {
      top: 50%;
      left: 50%;
      padding: 17px;
      margin: -20px;
      border: 3px solid #3f51b5;
      border-top-color: #0000;
      border-radius: 50%;
      opacity: 1;
      transition: opacity 0.3s 0.1s, transform 5s linear;
      transform: rotate(3600deg);
    }
    .loading main,
    .loading footer {
      filter: opacity(0.2); /* Force GPU render */
      transition: 0.3s;
    }
    @keyframes loaded {
      0% {
        filter: opacity(0.1);
        transform: translateY(9px);
      }
    }
    .loaded main,
    .loaded footer {
      transition: none; /* Avoid flicker */
      animation: 0.2s ease-out loaded;
    }
  `,
  markdownCss: css`
    article > *,
    article details > *,
    article p {
      margin-top: 9px;
    }
    article h2,
    article h3 {
      margin-top: 13px;
      font-weight: 400;
    }
    article h2 {
      font-size: 21px;
    }
    article a {
      color: #0366d6;
    }
    article summary {
      padding-left: 3px;
    }
    article blockquote {
      padding-left: 13px;
      border-left: 3px solid #ddd;
    }
    article code {
      padding: 2px 5px;
      font-size: 14px;
      background: #f4f4f4;
      border-radius: 4px;
    }
    article pre code {
      display: block;
      padding: 16px;
      overflow: auto;
      line-height: 1.3;
    }
    article ol,
    article ul {
      padding-left: 22px;
    }
    article table {
      display: block;
      overflow: auto;
      border-collapse: collapse;
    }
    article tr:nth-child(2n) {
      background: #f8f9fa;
    }
    article tr > * {
      padding: 5px 13px;
      font-weight: 400;
      border: 1px solid #ddd;
    }
    article img {
      max-width: 100%;
      height: auto; /* Override the HTML height attr (about aspect-ratio) */
    }
    article img:not(.no-border) {
      filter: drop-shadow(0 0 2px #ccc); /* Fit irregular images */
      border-radius: 4px;
    }
  `,
  headHtml: html`
    <meta name="viewport" content="width=device-width" />
    <meta name="theme-color" content="#3f51b5" />
    <!-- prettier-ignore -->
    <link rel="icon" href='\${avatar}' />
    <style>
      /*{style}*/
    </style>
  `,
  extraHtml: html`
    <header>
      <!-- From material-design-icons, redrawed to reduce size -->
      <svg
        viewBox="-6 0 12 12"
        onclick="document.body.children[4].className=''"
      >
        <circle r="1" cy="3" ; />
        <circle r="1" cy="6" ; />
        <circle r="1" cy="9" ; />
      </svg>
      <a href="/.">
        <!-- prettier-ignore -->
        <img src='\${avatar}' />
      </a>
      <svg viewBox="0 0 48 48" onclick="self.scroll({top:0,behavior:'smooth'})">
        <path d="M22 15.7V40h4V15.7l11.2 11.1L40 24 24 8 8 24l2.8 2.8z" ; />
      </svg>
    </header>
    <footer>
      <a href="/./about#license">CC0</a>
       - 
      <a href="/feed.xml">RSS</a>
    </footer>
    <spin-circle></spin-circle>
    <aside class="hidden" onclick="className='hidden'">
      <div>
        <a href="/.">Home</a>
        <a href="/./archive">Archive</a>
        <a href="/./tag">Tag</a>
        <a href="/./toy">Toy</a>
        <a href="/./about">About</a>
      </div>
    </aside>
  `,
  temlpateHtml: html`
    <!DOCTYPE html>
    <!-- If <head> does not exist, some search engines will reject this page -->
    <head>
      <title>/*{title}*/ - kkocdko's blog</title>
      <meta name="description" content="/*{description}*/" />
      <!-- Firefox >= 62 | Chrome >= 69 | Safari >= 12 -->
      <script
        src="/bundle.js"
        onload="[].flat||(location='/update.html')"
      ></script>
    </head>
    <main>/*{content}*/</main>
  `,
  updateHtml: html`
    <script>
      location = "//browser-update.org/update.html";
    </script>
  `,
  bundleJs: (() => {
    "use strict";
    history.scrollRestoration = "auto"; // Restone position when page resume
    let avatar = `/*{avatar}*/`;
    document.head.insertAdjacentHTML("beforeend", `/*{head}*/`);
    document.addEventListener("DOMContentLoaded", () => {
      document.body.insertAdjacentHTML("beforeend", `/*{extra}*/`);
      /*{script}*/
    });
  })
    .toString()
    .slice("() => {".length, -"}".length),
  mainJs: (() => {
    "use strict";
    let [mainBox /* main */, topBar /* header */] = document.body.children;
    let scrollRecords = {};
    let scrollPos = 0;
    let onLinkClick = function (event) {
      if (event.ctrlKey) return; // Open in background
      event.preventDefault();
      history.pushState(null, "", this.href);
      onpopstate(); // Because "pushState" will not trigger "popstate" event
    };
    let onPageLoad = () => {
      (
        document.getElementById(location.hash.slice(1)) || topBar
      ).scrollIntoView();
      document
        .querySelectorAll('a[href^="/."],a[href^="#"]')
        .forEach((element) => (element.onclick = onLinkClick));
    };
    onscroll = () => {
      topBar.className =
        scrollPos < (scrollRecords[location] = scrollPos = scrollY) &&
        scrollPos /* Was set to "scrollY" */ > 55
          ? "hidden"
          : "";
    };
    onpopstate = (isPopState) => {
      document.body.className = "loading";
      history.scrollRestoration = "manual"; // Failed in fetch.then, Chrome's bug?
      fetch(location)
        .then((response) => response.text())
        .then((s) => {
          // Regexp is slower than indexOf, but it's usually less than 5 ms
          [, document.title, , mainBox.innerHTML] =
            s.split(/<\/?title>|<\/?main>/);
          scroll(0, isPopState ? scrollRecords[location] || 0 : 0);
          // Ensure anchor makes down-scroll to hide topbar
          onPageLoad();
          document.body.className = "loaded"; // Also replace the "loading"
          setTimeout(() => (document.body.className = ""), 250);
        });
    };
    onPageLoad();
  })
    .toString()
    .slice("() => {".length, -"}".length),
};

const isDev = process.argv.includes("--dev");

// mapstr`<p>Hi ${[22,33]}${i=>i}</p>` === "<p>Hi 2233</p>"
const mapstr = (parts, ...inserts) => {
  let str = "";
  parts.forEach((part, i) => {
    if (part) str += (inserts[i] ?? []).keys ? part : part + inserts[i];
    else inserts[i - 1].forEach((v, k) => (str += inserts[i](v, k)));
  });
  return str;
};

const minify = (() => {
  const htmlStrip /* Strip useless chars, keep "/>" in <svg> */ = (s) =>
    s.replace(/(?<=>)( |\n)+|( |\n)+(?=<)|(?<!\; )\/(?=>)|; (?=\/>)/g, "");
  const f = (s) => s;
  if (isDev) return { htmlEnhanced: htmlStrip, html: f, css: f, js: f };
  const cssRule = /\/\*.+?\*\/|(?<=[^\w])\s|\s(?=[^\w:#-])|;\s*(?=})|0(?=\.)/g;
  return {
    htmlEnhanced: (s) => htmlclean(htmlStrip(s)),
    html: (s) => htmlclean(s), // bug: htmlclean(`<p><!-- ## Links --></p>`)
    css: (s) => s.replace(cssRule, ""),
    js: (s) => terser.minify(s, { toplevel: true }).code,
  };
})();

const makePage = (() => {
  const template = minify.htmlEnhanced(units.temlpateHtml);
  return ({ isMarkdown, path: rpath, title, description = "", content }) => {
    if (isMarkdown)
      content = `<article><h1>${title}</h1>${marked(content)}</article>`;
    content = minify.html(content);
    const result = template
      .replace("/*{title}*/", title)
      .replace("/*{description}*/", description)
      .replace("/*{content}*/", content);
    if (rpath.endsWith("/")) rpath += "index.html";
    const targetPath = `./public/${rpath}`;
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, result);
  };
})();

const loadMdFile = (filePath) => {
  const meta = {};
  const str = fs.readFileSync(filePath).toString();
  const head = str.slice(0, str.indexOf("\n```"));
  for (const line of head.split("\n").slice(1)) {
    const key = line.slice(0, line.indexOf(":"));
    meta[key] = line.slice(key.length + 1).trim();
  }
  return { meta, content: str.slice(head.length + "\n```".length) };
};

// Init
{
  fs.rmSync("./public_old", { recursive: true, force: true });
  if (fs.existsSync("./public")) fs.renameSync("./public", "./public_old");
  fs.rm("./public_old", { recursive: true, force: true }, () => {});
  fs.mkdirSync("./public");

  const avatar = "data:image/svg+xml," + units.avatarSvg.replaceAll("#", "%23");
  const style = minify.css(units.mainCss + units.markdownCss);
  const head = minify
    .htmlEnhanced(units.headHtml)
    .replace("/*{style}*/", style);
  const bundle = units.bundleJs
    .replace("/*{avatar}*/", avatar)
    .replace("/*{head}*/", head)
    .replace("/*{extra}*/", minify.htmlEnhanced(units.extraHtml))
    .replace("/*{script}*/", units.mainJs);
  fs.writeFileSync("./public/bundle.js", minify.js(bundle)); // import("node:zlib").then(m=>console.log(m.gzipSync(fs.readFileSync("./public/bundle.js"),{level:9}).length));
  fs.writeFileSync("./public/update.html", units.updateHtml);

  fs.cpSync("./source/toys", "./public/toy", { recursive: true });
  fs.cpSync("./source/res", "./public/res", { recursive: true });
}

// Posts
const posts = [];
{
  const files = fs.readdirSync("./source/posts");
  files.slice(isDev ? -12 : 0).forEach((fileName) => {
    const { meta, content } = loadMdFile(`./source/posts/${fileName}`);
    meta.id = meta.date.replace(/:|\.| /g, "");
    meta.tags = meta.tags.split(" ");
    posts.push(meta);
    makePage({
      ...meta,
      isMarkdown: true,
      path: `/post/${meta.id}/`,
      content,
    });
    // Check filename
    const prefix = meta.id.slice(0, 8) + "-" + meta.id.slice(8);
    if (fileName !== `${prefix} ${meta.title}.md`)
      console.warn(`post file [ ${fileName} ] has incorrect name`);
  });
  posts.sort((post1, post2) => post2.id - post1.id);
}

// Custom Pages
const pages = [];
{
  fs.readdirSync("./source/pages").forEach((fileName) => {
    const { meta, content } = loadMdFile(`./source/pages/${fileName}`);
    pages.push(meta);
    makePage({
      ...meta,
      isMarkdown: true,
      path: `/${meta.name}/`,
      content,
    });
  });
}

// Pages - Home
{
  const group = [];
  const volume = 10;
  for (let i = 0; i < posts.length; i += volume)
    group.push(posts.slice(i, i + volume));
  group.forEach((list, i, { length: last }) => {
    const cur = i + 1;
    makePage({
      path: i ? `/home/${cur}/` : "/",
      title: i ? `Home: ${cur}` : "Homepage",
      description: i ? "" : "Welcome to my blog!",
      content: mapstr`
        ${list}${({ id, title, description, tags }) => mapstr`
        <section>
          <h3><a href="/./post/${id}">${title}</a></h3>
          <p>${description}</p>
          <div>${tags}${(tag) => `<a href="/./tag/${tag}">${tag}</a> `}</div>
        </section>
        `}
        <nav>
          <a href="/.">◁◁</a>
          <a href="/.${cur > 2 ? `/home/${cur - 1}` : ""}">◁</a>
          <a>${cur} / ${last}</a>
          <a href="/./home/${cur < last ? cur + 1 : last}">▷</a>
          <a href="/./home/${last}">▷▷</a>
        </nav>
      `,
    });
  });
}

// Pages - Archive
{
  const map = new Map(); // Because Objcet's prop order is unspecified
  posts.forEach((post) => {
    const year = post.date.slice(0, 4);
    if (!map.has(year)) map.set(year, []);
    map.get(year).push(post);
  });
  makePage({
    path: "/archive/",
    title: "Archive",
    content: mapstr`
      <section>
        <h1><a href="/./archive">Archive</a></h1>
        ${map}${(_, year) => `<a href="/./archive/${year}">${year}</a> `}
      </section>
    `,
  });
  map.forEach((list, year) => {
    makePage({
      path: `/archive/${year}/`,
      title: `Archive: ${year}`,
      content: mapstr`
        <section>
          <h1><a href="/./archive/${year}">${year}</a></h1>
          ${list}${({ id, date, title }) => `
          <p>
            <a href="/./post/${id}">
              <span>${date.slice(5, 10)}</span> ${title}
            </a>
          </p>
          `}
        </section>
      `,
    });
  });
}

// Pages - Tag
{
  const map = new Map();
  posts.forEach((post) => {
    post.tags.forEach((tag) => {
      if (!map.has(tag)) map.set(tag, []);
      map.get(tag).push(post);
    });
  });
  makePage({
    path: "/tag/",
    title: "Tag",
    content: mapstr`
      <section>
        <h1><a href="/./tag">Tag</a></h1>
        ${map}${(_, tag) => `<a href="/./tag/${tag}">${tag}</a> `}
      </section>
    `,
  });
  map.forEach((list, tag) => {
    makePage({
      path: `/tag/${tag}/`,
      title: `Tag: ${tag}`,
      content: mapstr`
        <section>
          <h1><a href="/./tag/${tag}">${tag}</a></h1>
          ${list}${(p) => `<p><a href="/./post/${p.id}">${p.title}</a></p>`}
        </section>
      `,
    });
  });
}

// Pages - 404 Error
{
  makePage({
    isMarkdown: true,
    path: "/404.html",
    title: "404 Not Found",
    content: "The requested path could not be found.",
  });
}

// Site Map, RSS and more
{
  const domain = "https://kkocdko.site";

  fs.writeFileSync(
    "./public/robots.txt",
    `User-agent: *\nAllow: /\nSitemap: ${domain}/sitemap.xml`
  );

  fs.writeFileSync(
    "./public/sitemap.xml",
    mapstr`
      <?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${pages}${(p) => `<url><loc>${domain}/${p.name}</loc></url>`}
        ${posts}${(p) => `<url><loc>${domain}/post/${p.id}</loc></url>`}
      </urlset>
    `.trim()
  );

  fs.writeFileSync(
    "./public/feed.xml",
    mapstr`
      <?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0">
        <channel>
          <title>kkocdko's blog</title>
          <link>${domain}</link>
          <description>kkocdko's blog</description>
          ${posts}${({ id, title, description }) => `
          <item>
            <title>${title}</title>
            <description>${description}</description>
            <link>${domain}/post/${id}</link>
          </item>
          `}
        </channel>
      </rss>
    `.trim()
  );

  fs.writeFileSync("./public/.nojekyll", ""); // Prevent the GitHub Pages to run Jekyll

  fs.writeFileSync("./public/favicon.ico", ""); // Avoid favicon.ico 404
}

console.timeEnd("generate time");
