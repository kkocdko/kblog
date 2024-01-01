/**
 * Generator & Static Server.
 */
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import { Worker } from "node:worker_threads";
import fs from "node:fs";
import path from "node:path";
import marked from "marked";
import htmlclean from "htmlclean";
import terser from "terser";

const modulePath = fileURLToPath(import.meta.url);
if (path.dirname(modulePath) !== process.cwd())
  throw Error("Current directory is different from project directory");

if (process.argv.includes("develop")) {
  const childs = [];
  const exec = (argv) =>
    childs.push(new Worker(modulePath, { argv }).on("error", console.error));
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
  const r2a = path.join.bind(null, path.dirname(modulePath), "public");
  // (await import("node:https")).createServer((p=>(p=([s])=>fs.readFileSync(`/home/kkocdko/.local/share/caddy/certificates/local/127.0.0.1/127.0.0.1.${s}`),{key:p`key`,cert:p`crt`}))(),({url},res)=>{
  createServer(({ url }, res) => {
    const pair = [
      [200, r2a(url)],
      [200, r2a(url, "index.html")],
      [404, r2a("404.html")],
    ].find(([_, p]) => fs.existsSync(p) && fs.statSync(p).isFile());
    if (!pair) return res.writeHead(404).end("404 Not Found");
    const [status, local] = pair;
    res.setHeader("content-type", mime[local.split(".").pop()] || "");
    res.writeHead(status).end(fs.readFileSync(local));
  }).listen(port);
  console.info(`server: 127.0.0.1:${port}`);
  // Fall through here, go ahead and run generator
} else if (process.argv.includes("generate")) {
} else {
  throw Error("unknown function"); // https://stackoverflow.com/questions/73742023
}

console.time("generate time");

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
  const templateRaw = fs.readFileSync("./units/template.html").toString();
  const template = minify.htmlEnhanced(templateRaw);
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

  const f = ([r]) => fs.readFileSync(`./units/${r}`).toString(); // Read file str
  const avatar = "data:image/svg+xml," + f`avatar.svg`.replaceAll("#", "%23");
  const style = minify.css(f`main.css` + f`markdown.css`);
  const head = minify.htmlEnhanced(f`head.html`).replace("/*{style}*/", style);
  const bundle = f`bundle.js`
    .replace("/*{avatar}*/", avatar)
    .replace("/*{head}*/", head)
    .replace("/*{extra}*/", minify.htmlEnhanced(f`extra.html`))
    .replace("/*{script}*/", f`main.js`);
  fs.writeFileSync("./public/bundle.js", minify.js(bundle));
  fs.writeFileSync("./public/update.html", f`update.html`);
  fs.writeFileSync("./public/.nojekyll", ""); // Prevent the GitHub Pages to run Jekyll

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

// Site Map and RSS
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
}

console.timeEnd("generate time");
