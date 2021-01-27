"use strict";

// Timer
{
  console.time("generate time");
  process.on("exit", () => console.timeEnd("generate time"));
}

const fs = require("fs");
const path = require("path");

const isDev = process.argv.includes("--dev");

// Convert relative path to absolute
const p = ([r], ...s) => path.join(__dirname, "..", r, ...s);

// mapstr`<p>Hi ${[ [ 22, 33 ], i => i ]}</p>` == "<p>Hi 2233</p>"
const mapstr = (parts, ...values) => {
  let str = parts[0];
  parts.slice(1).forEach((part) => {
    const value = values.shift();
    if (Array.isArray(value)) {
      const [iter, fn] = value;
      for (const entry of iter) str += fn(entry);
    } else {
      str += value;
    }
    str += part;
  });
  return str;
};

const minify = (() => {
  const htmlPretreat = (s) =>
    s // Strip spaces and restone "/>" in <svg>
      .replace(/\/?>\s*/g, ">")
      .replace(/\s+</g, "<")
      .replace(/; >/g, "/>");
  const f = (s) => s;
  if (isDev) return { html: htmlPretreat, htmlMd: f, css: f, js: f };
  const htmlclean = require("htmlclean");
  const CleanCss = require("clean-css");
  const terser = require("terser");
  return {
    html: (s) => htmlclean(htmlPretreat(s)),
    htmlMd: (s) => htmlclean(s),
    css: (s) => new CleanCss().minify(s).styles,
    js: (s) => terser.minify(s, { toplevel: true }).code,
  };
})();

const makePage = (() => {
  const marked = require("marked");
  const templateRaw = fs.readFileSync(p`./units/template.html`).toString();
  const template = minify.html(templateRaw);
  return ({ isMarkdown, path: pathname, title, description = "", content }) => {
    if (isMarkdown) {
      content = `<article><h1>${title}</h1>${marked(content)}</article>`;
      content = minify.htmlMd(content);
    } else {
      content = minify.html(content);
    }
    const result = template
      .replace("/*{title}*/", title)
      .replace("/*{description}*/", description)
      .replace("/*{content}*/", content);
    if (pathname.endsWith("/")) pathname += "index.html";
    const targetPath = p`./public/${pathname}`;
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, result);
  };
})();

const parseMdFile = (filePath) => {
  const meta = {};
  const str = fs.readFileSync(filePath).toString();
  const head = str.slice("```\n".length, str.indexOf("\n```"));
  head.split("\n").forEach((line) => {
    const pos = line.indexOf(":");
    const key = line.slice(0, pos);
    meta[key] = line.slice(pos + 1).trim();
  });
  const body = str.slice(str.indexOf("\n```") + "\n```".length);
  return { meta, body };
};

// Init
{
  fs.rmSync(p`./public`, { recursive: true, force: true });
  fs.mkdirSync(p`./public`);

  fs.writeFileSync(p`./public/.nojekyll`, "");
  fs.mkdirSync(p`./public/update`);
  fs.copyFileSync(p`./units/update.html`, p`./public/update/index.html`);

  const f = ([r]) => fs.readFileSync(p`./units/${r}`).toString(); // Read file str
  const avatar = "data:image/svg+xml," + f`avatar.svg`.replaceAll("#", "%23");
  const style = minify.css(f`main.css` + f`markdown.css`);
  const head = minify.html(f`head.html`).replace("/*{style}*/", style);
  const bundle = f`bundle.js`
    .replace("/*{avatar}*/", avatar)
    .replace("/*{head}*/", head)
    .replace("/*{extra}*/", minify.html(f`extra.html`))
    .replace("/*{script}*/", f`main.js`);
  fs.writeFileSync(p`./public/bundle.js`, minify.js(bundle));

  const copyDirSync = (sourceDir, targetDir) => {
    fs.mkdirSync(targetDir, { recursive: true });
    fs.readdirSync(sourceDir).forEach((item) => {
      const source = path.join(sourceDir, item);
      const target = path.join(targetDir, item);
      if (fs.statSync(source).isFile()) {
        fs.copyFileSync(source, target);
      } else {
        copyDirSync(source, target);
      }
    });
  };
  copyDirSync(p`./source/toys`, p`./public/toy`);
  copyDirSync(p`./source/res`, p`./public/res`);
}

// Posts
const posts = [];
{
  let files = fs.readdirSync(p`./source/posts`).reverse();
  if (isDev) files = files.slice(0, 12);
  files.forEach((fileName) => {
    const { meta, body } = parseMdFile(p`./source/posts/${fileName}`);
    const attr = {
      ...meta,
      id: meta.date.replace(/:|\.| /g, ""),
      tags: meta.tags.split(" "),
    };
    makePage({
      ...meta,
      isMarkdown: true,
      path: `/post/${attr.id}/`,
      content: body,
    });
    posts.push(attr);
    // Check filename
    {
      const prefix = attr.id.slice(0, 8) + "-" + attr.id.slice(8);
      if (fileName !== `${prefix} ${meta.title}.md`) {
        console.warn(`post file [ ${fileName} ] has incorrect name`);
      }
    }
  });
  posts.sort((post1, post2) => post2.id - post1.id);
}

// Custom Pages
const pages = [];
{
  fs.readdirSync(p`./source/pages`).forEach((fileName) => {
    const { meta, body } = parseMdFile(p`./source/pages/${fileName}`);
    makePage({
      ...meta,
      isMarkdown: true,
      path: `/${meta.name}/`,
      content: body,
    });
    pages.push(meta);
  });
}

// Pages - Home
{
  const volume = 10;
  const group = [];
  for (let i = 0; i < posts.length; i += volume) {
    group.push(posts.slice(i, i + volume));
  }
  group.forEach((list, i) => {
    const cur = i + 1;
    const last = group.length;
    makePage({
      path: cur === 1 ? "/" : `/home/${cur}/`,
      title: cur === 1 ? "Homepage" : `Home: ${cur}`,
      description: cur === 1 ? "Welcome to my blog!" : "",
      content: mapstr`
        ${[
          list,
          ({ id, title, description, tags }) => mapstr`
            <section>
              <h3>
                <a href="/./post/${id}/">${title}</a>
              </h3>
              <p>${description}</p>
              <div>
                ${[tags, (tag) => `<a href="/./tag/${tag}/">${tag}</a>`]}
              </div>
            </section>
          `,
        ]}
        <nav>
          <a href="/./">◁◁</a>
          <a href="/.${cur > 2 ? `/home/${cur - 1}` : ""}/">◁</a>
          <a>${cur} / ${last}</a>
          <a href="/./home/${cur < last ? cur + 1 : last}/">▷</a>
          <a href="/./home/${last}/">▷▷</a>
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
        <h1>Archive</h1>
        ${[map, ([year]) => `<a href="/./archive/${year}/">${year}</a>`]}
      </section>
    `,
  });
  map.forEach((list, year) => {
    makePage({
      path: `/archive/${year}/`,
      title: `Archive: ${year}`,
      content: mapstr`
        <section>
          <h1>${year}</h1>
          ${[
            list,
            ({ id, date, title }) => `
              <p>
                <a href="/./post/${id}/">
                  <span>${date.slice(5, 10)}</span>
                  ${title}
                </a>
              </p>
            `,
          ]}
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
        <h1>Tag</h1>
        ${[map, ([tag]) => `<a href="/./tag/${tag}/">${tag}</a>`]}
      </section>
    `,
  });
  map.forEach((list, tag) => {
    makePage({
      path: `/tag/${tag}/`,
      title: `Tag: ${tag}`,
      content: mapstr`
        <section>
          <h1>${tag}</h1>
          ${[
            list,
            ({ id, title }) => `
              <p>
                <a href="/./post/${id}/">${title}</a>
              </p>
            `,
          ]}
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
  const domain = "https://kkocdko.github.io";

  fs.writeFileSync(
    p`./public/robots.txt`,
    `User-agent: *\nAllow: /\nSitemap: ${domain}/sitemap.xml`
  );

  fs.writeFileSync(
    p`./public/sitemap.xml`,
    mapstr`
      <?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${[pages, ({ name }) => `<url><loc>${domain}/${name}/</loc></url>`]}
        ${[posts, ({ id }) => `<url><loc>${domain}/post/${id}/</loc></url>`]}
      </urlset>
    `.trimStart()
  );

  fs.writeFileSync(
    p`./public/feed.xml`,
    mapstr`
      <?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0">
        <channel>
        <title>kkocdko's blog</title>
        <link>${domain}</link>
        <description>kkocdko's blog</description>
        ${[
          posts,
          ({ id, title, description }) => `
            <item>
              <title>${title}</title>
              <description>${description}</description>
              <link>${domain}/post/${id}/</link>
            </item>
          `,
        ]}
        </channel>
      </rss>
    `.trimStart()
  );
}
