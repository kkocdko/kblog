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

// htmlx`<a> Hi ${ [ [ 22, 33 ], i => i ] } </a>` == "<a> Hi 2233 </a>"
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
  const pathModule = path;
  const templateRaw = fs.readFileSync(p`./units/template.html`).toString();
  const template = minify.html(templateRaw);
  return ({
    type, // "html" | "markdown"
    realPath,
    path,
    title = "",
    description = "",
    content = "",
  }) => {
    if (type === "markdown") {
      content = `<article><h1>${title}</h1>${marked(content)}</article>`;
      content = minify.htmlMd(content);
    } else {
      content = minify.html(content);
    }
    const result = template
      .replace("/*{title}*/", title)
      .replace("/*{description}*/", description)
      .replace("/*{content}*/", content);
    const targetPath = realPath
      ? p`./public/${realPath}`
      : p`./public/${path}/${"index.html"}`;
    fs.mkdirSync(pathModule.dirname(targetPath), { recursive: true });
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

// Clear Dir
{
  fs.rmSync(p`./public`, { recursive: true, force: true });
  fs.mkdirSync(p`./public`);
}

// Init
{
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
  if (isDevMode) {
    filesList = filesList.slice(0, 15);
  }
  filesList.forEach((fileName) => {
    const { meta, body } = parseMdFile(p`./source/posts/${fileName}`);
    const attr = {
      id: meta.date.replace(/:|-|\s/g, ""),
      date: meta.date.split(" ")[0],
      title: meta.title,
      tags: meta.tags.split(" "),
      description: meta.description,
    };
    makePage({
      type: "markdown",
      ...attr,
      path: `/post/${attr.id}/`,
      content: body,
    });
    postsList.push(attr);
    // Check filename
    {
      const prefix = meta.date.replace(/:|-/g, "").replace(" ", "-");
      const expectant = `${prefix} ${meta.title}.md`;
      if (expectant !== fileName) {
        console.warn(`post file [ ${fileName} ] has nonstandard name`);
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
    const attr = {
      name: path.parse(fileName).name,
      title: meta.title,
      description: meta.description,
    };
    makePage({
      type: "markdown",
      ...attr,
      path: `/${attr.name}/`,
      content: body,
    });
    pagesList.push(attr);
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
      type: "html",
      path: cur === 1 ? "/" : `/home/${cur}/`,
      title: cur === 1 ? "Homepage" : `Home: ${cur}`,
      description: cur === 1 ? "Welcome to my blog!" : "",
      content: htmlx`
        ${[
          list,
          ({ id, title, description, tags }) => htmlx`
            <section>
              <h3>
                <a href="/./post/${id}">${title}</a>
              </h3>
              <p>${description}</p>
              <div>
                ${[tags, (tag) => `<a href="/./tag/${tag}">${tag}</a>`]}
              </div>
            </section>
          `,
        ]}
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

// Blog Pages - Archive
{
  const dict = {};
  postsList.forEach((post) => {
    const year = post.date.slice(0, 4);
    if (!dict[year]) dict[year] = [];
    dict[year].push(post);
  });
  const group = Object.entries(dict);

  makePage({
    type: "html",
    path: "/archive/",
    title: "Archive",
    content: htmlx`
      <section>
        <h1>Archive</h1>
        ${[group, ([year]) => `<a href="/./archive/${year}">${year}</a>`]}
      </section>
    `,
  });

  group.forEach(([year, list]) => {
    makePage({
      type: "html",
      path: `/archive/${year}/`,
      title: `${year} - Archive`,
      content: htmlx`
        <section>
          <h1>${year}</h1>
          ${[
            list,
            ({ id, date, title }) => `
              <p>
                <a href="/./post/${id}">
                  <span>${date.slice(5).replace("-", ".")}</span>
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
  const dict = {};
  postsList.forEach((post) => {
    post.tags.forEach((tag) => {
      if (!dict[tag]) dict[tag] = [];
      dict[tag].push(post);
    });
  });
  const group = Object.entries(dict);

  makePage({
    type: "html",
    path: "/tag/",
    title: "Tag",
    content: htmlx`
      <section>
        <h1>Tag</h1>
        ${[group, ([tag]) => `<a href="/./tag/${tag}">${tag}</a>`]}
      </section>
    `,
  });

  group.forEach(([tag, list]) => {
    makePage({
      type: "html",
      path: `/tag/${tag}/`,
      title: `${tag} - Tag`,
      content: htmlx`
        <section>
          <h1>${tag}</h1>
          ${[
            list,
            ({ id, title }) => `
              <p>
                <a href="/./post/${id}">${title}</a>
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
    type: "markdown",
    realPath: "/404.html",
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
