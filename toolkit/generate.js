"use strict";

// Timer
{
  console.time("generate time");
  process.on("exit", () => console.timeEnd("generate time"));
}

const fs = require("fs");
const path = require("path");

const isDevMode = process.argv.includes("--dev-mode");

// Convert relative path to absolute
const p = ([r], ...arr) => path.join(__dirname, "..", r, ...arr);

// htmlx`<p>Hi ${[ [ 22, 33 ], i => i ]}</p>` == "<p>Hi 2233</p>"
const htmlx = (parts, ...values) => {
  let str = parts[0];
  parts.slice(1).forEach((part) => {
    const value = values.shift();
    if (Array.isArray(value)) {
      const [arr, fn] = value;
      str += arr.map(fn).join("");
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
  if (isDevMode) {
    const f = (s) => s;
    return { html: htmlPretreat, htmlMd: f, css: f, js: f };
  }
  const htmlclean = require("htmlclean");
  const CleanCss = require("clean-css");
  const terser = require("terser");
  return {
    html: (s) => htmlclean(htmlPretreat(s)),
    htmlMd: (s) => htmlclean(s),
    css: (s) => new CleanCss().minify(s).styles,
    js: (s) => {
      const output = terser.minify(s, { toplevel: true });
      if (output.error) throw output.error;
      return output.code.replace(/;$/, "");
    },
  };
})();

const makePage = (() => {
  const marked = require("marked");
  const templatePath = p`./units/template.html`;
  const template = minify.html(fs.readFileSync(templatePath).toString());
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
    const value = line.slice(pos + 1).trim();
    meta[key] = value;
  });
  const body = str.slice(str.indexOf("\n```") + "\n```".length);
  return { meta, body };
};

// Init
{
  fs.rmSync(p`./public`, { recursive: true, force: true });
  fs.mkdirSync(p`./public`);

  fs.writeFileSync(p`./public/.nojekyll`, "");
  fs.writeFileSync(p`./public/favicon.ico`, "");
  fs.mkdirSync(p`./public/u`);
  fs.copyFileSync(p`./units/update.html`, p`./public/u/index.html`);

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

  const f = ([r]) => fs.readFileSync(p`./units/${r}`).toString(); // Read file string
  const avatar = "data:image/svg+xml," + f`avatar.svg`.replaceAll("#", "%23");
  const style = minify.css(f`main.css` + f`markdown.css`);
  const head = minify.html(f`head.html`).replace("/*{style}*/", style);
  const bundle = f`bundle.js`
    .replace("/*{avatar}*/", avatar)
    .replace("/*{head}*/", head)
    .replace("/*{extra}*/", minify.html(f`extra.html`))
    .replace("/*{script}*/", f`main.js`);
  fs.writeFileSync(p`./public/bundle.js`, minify.js(bundle));
}

// Posts
const postsList = [];
{
  let filesList = fs.readdirSync(p`./source/posts`).reverse();
  if (isDevMode) filesList = filesList.slice(0, 12);
  filesList.forEach((fileName) => {
    const { meta, body } = parseMdFile(p`./source/posts/${fileName}`);
    const attr = {
      ...meta,
      id: meta.date.replace(/:|-|\s/g, ""),
      tags: meta.tags.split(" "),
    };
    makePage({
      ...meta,
      isMarkdown: true,
      path: `/post/${attr.id}/`,
      content: body,
    });
    postsList.push(attr);
    // Check filename
    {
      const prefix = meta.date.replace(/:|-/g, "").replace(" ", "-");
      const expectant = `${prefix} ${meta.title}.md`;
      if (fileName !== expectant) {
        console.warn(`post file [ ${fileName} ] has incorrect name`);
      }
    }
  });
  postsList.sort((post1, post2) => post2.id - post1.id);
}

// Custom Pages
const pagesList = [];
{
  const filesList = fs.readdirSync(p`./source/pages`);
  filesList.forEach((fileName) => {
    const { meta, body } = parseMdFile(p`./source/pages/${fileName}`);
    makePage({
      ...meta,
      isMarkdown: true,
      path: `/${meta.name}/`,
      content: body,
    });
    pagesList.push(meta);
  });
}

// Blog Pages - Home
{
  const volume = 10;
  const group = [];
  for (let i = 0; i < postsList.length; i += volume) {
    group.push(postsList.slice(i, i + volume));
  }
  group.forEach((list, i) => {
    const cur = i + 1;
    const last = group.length;
    makePage({
      path: cur === 1 ? "/" : `/home/${cur}/`,
      title: cur === 1 ? "Homepage" : `Home: ${cur}`,
      description: cur === 1 ? "Welcome to my blog!" : "",
      content: htmlx`
        ${[
          list,
          ({ id, title, description, tags }) => htmlx`
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

// Blog Pages - Archive
{
  const dict = new Map(); // Because Objcet's prop order is unspecified
  postsList.forEach((post) => {
    const year = post.date.slice(0, 4);
    if (!dict.has(year)) dict.set(year, []);
    dict.get(year).push(post);
  });
  const group = [...dict.entries()];
  makePage({
    path: "/archive/",
    title: "Archive",
    content: htmlx`
      <section>
        <h1>Archive</h1>
        ${[group, ([year]) => `<a href="/./archive/${year}/">${year}</a>`]}
      </section>
    `,
  });
  group.forEach(([year, list]) => {
    makePage({
      path: `/archive/${year}/`,
      title: `${year} - Archive`,
      content: htmlx`
        <section>
          <h1>${year}</h1>
          ${[
            list,
            ({ id, date, title }) => `
              <p>
                <a href="/./post/${id}/">
                  <span>${date.slice(5, 10).replace("-", ".")}</span>
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

// Blog Pages - Tag
{
  const dict = new Map();
  postsList.forEach((post) => {
    post.tags.forEach((tag) => {
      if (!dict.has(tag)) dict.set(tag, []);
      dict.get(tag).push(post);
    });
  });
  const group = [...dict.entries()];
  makePage({
    path: "/tag/",
    title: "Tag",
    content: htmlx`
      <section>
        <h1>Tag</h1>
        ${[group, ([tag]) => `<a href="/./tag/${tag}/">${tag}</a>`]}
      </section>
    `,
  });
  group.forEach(([tag, list]) => {
    makePage({
      path: `/tag/${tag}/`,
      title: `${tag} - Tag`,
      content: htmlx`
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

// Blog Pages - 404 Error
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
    htmlx`
      <?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${[pagesList, ({ name }) => `<url><loc>${domain}/${name}/</loc></url>`]}
      ${[postsList, ({ id }) => `<url><loc>${domain}/post/${id}/</loc></url>`]}
      </urlset>
    `
  );

  fs.writeFileSync(
    p`./public/feed.xml`,
    htmlx`
      <?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0">
        <channel>
        <title>kkocdko's blog</title>
        <link>${domain}</link>
        <description>kkocdko's blog</description>
        ${[
          postsList,
          ({ id, title, description }) => `
            <item>
              <title>${title}</title>
              <link>${domain}/post/${id}/</link>
              <description>${description}</description>
            </item>
          `,
        ]}
        </channel>
      </rss>
    `
  );
}
