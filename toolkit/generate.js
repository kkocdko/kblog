"use strict";

// Timer
{
  console.time("generate time");
  process.on("exit", () => console.timeEnd("generate time"));
}

const fs = require("fs");
const path = require("path");

const isDevMode = process.argv.includes("--dev-mode");
const p = ([r], ...arr) => path.join(__dirname, "..", r, ...arr); // Relative to absolute

const minify = (() => {
  const htmlStrip = (s) =>
    s.replace(/\/?>(\s|\n)*/g, ">").replace(/(\s|\n)+</g, "<");
  if (isDevMode) {
    const f = (s) => s;
    return { html: htmlStrip, htmlMd: f, css: f, js: f };
  }
  const htmlclean = require("htmlclean");
  const CleanCss = require("clean-css");
  const terser = require("terser");
  return {
    html: (s) => htmlclean(htmlStrip(s)),
    htmlMd: (s) => htmlclean(s),
    css: (s) => new CleanCss().minify(s).styles,
    js: (s) => {
      const output = terser.minify(s, {
        compress: {
          booleans_as_integers: true,
          passes: 3,
          unsafe: true,
          unsafe_arrows: true,
          unsafe_comps: true,
          unsafe_Function: true,
          unsafe_math: true,
          unsafe_methods: true,
          unsafe_proto: true,
          unsafe_regexp: true,
          unsafe_undefined: true,
        },
      });
      if (output.error) {
        throw output.error;
      }
      return output.code.replace(/;$/, "");
    },
  };
})();

const makePage = (() => {
  const marked = require("marked");
  const getPathDir = (p) => path.parse(p).dir;
  const template = minify.html(
    fs.readFileSync(p`./units/template.html`).toString()
  );
  return ({
    type, // "html" | "markdown"
    realPath,
    path,
    title = "",
    description = "",
    content = "",
  }) => {
    if (type === "markdown") {
      content = `
        <article>
          <h1>${title}</h1>
          ${marked(content)}
        </article>
      `;
    }
    content = minify[type === "html" ? "html" : "htmlMd"](content);
    const result = template
      .replace("/*[title]*/", title)
      .replace("/*[description]*/", description)
      .replace("/*[content]*/", content);
    const targetFilePath = realPath
      ? p`./public/${realPath}`
      : p`./public/${path}/${"index.html"}`;
    fs.mkdirSync(getPathDir(targetFilePath), { recursive: true });
    fs.writeFileSync(targetFilePath, result);
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
  const content = str.slice(str.indexOf("\n```") + 4);
  return { meta, content };
};

// Clear Dir
{
  fs.rmSync(p`./public`, { recursive: true, force: true });
  fs.mkdirSync(p`./public`);
}

// Init
{
  fs.copyFileSync(p`./units/_gitignore`, p`./public/.gitignore`);
  fs.copyFileSync(p`./units/_nojekyll`, p`./public/.nojekyll`);
  fs.copyFileSync(p`./units/favicon.ico`, p`./public/favicon.ico`);
  fs.copyFileSync(p`./units/favicon.svg`, p`./public/favicon.svg`);

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
  const style = minify.css(f`main.css` + f`markdown.css`);
  const head = minify.html(f`head.html`).replace("/*[style]*/", style);
  const extra = minify.html(f`extra.html`);
  const bundle = f`bundle.js`
    .replace("/*[head]*/", head)
    .replace("/*[extra]*/", extra)
    .replace("/*[script]*/", f`main.js`);
  fs.writeFileSync(p`./public/bundle.js`, minify.js(bundle));
  fs.writeFileSync(p`./public/check.js`, minify.js(f`check.js`));
}

// Posts
const postsList = [];
{
  let filesList = fs.readdirSync(p`./source/posts`);
  if (isDevMode) {
    filesList = filesList.reverse().slice(0, 15);
  }
  filesList.forEach((fileName) => {
    const { meta, content } = parseMdFile(p`./source/posts/${fileName}`);
    const attr = {
      id: meta.date.replace(/:|-|\s/g, ""),
      date: meta.date.split(" ")[0],
      title: meta.title,
      tags: meta.tags.split(" "),
      description: meta.description,
    };
    makePage({
      ...attr,
      path: `/post/${attr.id}/`,
      type: "markdown",
      content,
    });
    postsList.push(attr);
    // File name check
    {
      const prefix = meta.date.replace(/:|-/g, "").replace(" ", "-");
      const expectant = `${prefix} ${meta.title}.md`;
      if (expectant !== fileName) {
        console.warn(`post file [ ${fileName} ] has not standard name`);
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
    const { meta, content } = parseMdFile(p`./source/pages/${fileName}`);
    const attr = {
      name: path.parse(fileName).name,
      title: meta.title,
      description: meta.description,
    };
    makePage({
      ...attr,
      path: `/${attr.name}/`,
      type: "markdown",
      content,
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
    let htmlStr = "";
    list.forEach((post) => {
      htmlStr += `
        <section>
          <h3>
            <a _ href="/post/${post.id}">${post.title}</a>
          </h3>
          <p>${post.description}</p>
          <div>`;
      post.tags.forEach((tag) => {
        htmlStr += `<a _ href="/tag/${tag}">${tag}</a>`;
      });
      htmlStr += `
          </div>
        </section>
      `;
    });
    const cur = i + 1;
    const last = group.length;
    htmlStr += `
      <nav>
        <a _ href="/">◁◁</a>
        <a _ href="/${cur > 2 ? `home/${cur - 1}` : ""}">◁</a>
        <a>${cur} / ${last}</a>
        <a _ href="/home/${cur < last ? cur + 1 : last}">▷</a>
        <a _ href="/home/${last}">▷▷</a>
      </nav>
    `;
    if (cur === 1) {
      makePage({
        path: "/",
        type: "html",
        title: "Homepage",
        description: "Welcome to my blog!",
        content: htmlStr,
      });
    } else {
      makePage({
        path: `/home/${cur}/`,
        type: "html",
        title: `Home: ${cur}`,
        content: htmlStr,
      });
    }
  });
}

// Blog Pages - Archive
{
  const map = new Map();
  postsList.forEach((post) => {
    const year = post.date.slice(0, 4);
    if (!map.has(year)) {
      map.set(year, []);
    }
    map.get(year).push(post);
  });

  let htmlStr = "<section>";
  htmlStr += "<h1>Archive</h1>";
  map.forEach((_, year) => {
    htmlStr += `<a _ href="/archive/${year}">${year}</a>`;
  });
  htmlStr += "</section>";
  makePage({
    path: "/archive/",
    type: "html",
    title: "Archive",
    content: htmlStr,
  });

  map.forEach((list, year) => {
    let htmlStr = "<section>";
    htmlStr += `<h1>${year}</h1>`;
    list.forEach((post) => {
      htmlStr += `
        <p>
          <a _ href="/post/${post.id}">
            <span>${post.date.slice(5).replace("-", ".")}</span>
            ${post.title}
          </a>
        </p>
      `;
    });
    htmlStr += "</section>";
    makePage({
      path: `/archive/${year}`,
      type: "html",
      title: `${year} - Archive`,
      content: htmlStr,
    });
  });
}

// Blog Pages - Tag
{
  const map = new Map();
  postsList.forEach((post) =>
    post.tags.forEach((tag) => {
      if (!map.has(tag)) {
        map.set(tag, []);
      }
      map.get(tag).push(post);
    })
  );

  let htmlStr = "<section>";
  htmlStr += "<h1>Tag</h1>";
  map.forEach((_, tag) => {
    htmlStr += `<a _ href="/tag/${tag}">${tag}</a>`;
  });
  htmlStr += "</section>";
  makePage({
    path: "/tag/",
    type: "html",
    title: "Tag",
    content: htmlStr,
  });

  map.forEach((list, tag) => {
    let htmlStr = "<section>";
    htmlStr += `<h1>${tag}</h1>`;
    list.forEach((post) => {
      htmlStr += `
        <p>
          <a _ href="/post/${post.id}">${post.title}</a>
        </p>
      `;
    });
    htmlStr += "</section>";
    makePage({
      path: `/tag/${tag}`,
      type: "html",
      title: `${tag} - Tag`,
      content: htmlStr,
    });
  });
}

// Blog Pages - 404 Error
{
  makePage({
    realPath: "/404.html",
    title: "404 Not Found",
    type: "markdown",
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
    '<?xml version="1.0" encoding="UTF-8"?>' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
      pagesList
        .map(({ name }) => `<url><loc>${domain}/${name}/</loc></url>`)
        .join("") +
      postsList
        .map(({ id }) => `<url><loc>${domain}/post/${id}/</loc></url>`)
        .join("") +
      "</urlset>"
  );

  fs.writeFileSync(
    p`./public/feed.xml`,
    '<?xml version="1.0" encoding="UTF-8"?>' +
      '<rss version="2.0">' +
      "<channel>" +
      "<title>kkocdko's blog</title>" +
      `<link>${domain}</link>` +
      "<description>kkocdko's blog</description>" +
      postsList
        .map(
          ({ id, title, description }) =>
            "<item>" +
            `<title>${title}</title>` +
            `<link>${domain}/post/${id}/</link>` +
            `<description>${description}</description>` +
            "</item>"
        )
        .join("") +
      "</channel>" +
      "</rss>"
  );
}
