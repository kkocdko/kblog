"use strict";

// Timer
{
  console.time("generate time");
  process.on("exit", () => console.timeEnd("generate time"));
}

const fs = require("fs");
const path = require("path");

const isDevMode = process.argv.includes("--dev-mode");
const p = ([r], ...arr) => path.join(__dirname, "..", r, ...arr); // Relative path to absolute

const minify = (() => {
  const htmlStrip = (s) => s.replace(/\/?>(\s|\n)*/g, ">");
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
    realPath = "",
    path = "",
    title = "",
    description = "",
    content = "",
  }) => {
    const pageContent =
      type === "markdown"
        ? minify.htmlMd(`<article>${marked(content)}</article>`)
        : minify.html(content);
    const result = template
      .replace("{{ title }}", title)
      .replace("{{ description }}", description)
      .replace("{{ content }}", pageContent);
    const targetFilePath = realPath
      ? p`./public/${realPath}`
      : p`./public/${path}/${"index.html"}`;
    fs.mkdirSync(getPathDir(targetFilePath), { recursive: true });
    fs.writeFileSync(targetFilePath, result);
  };
})();

const parseMdFile = (filePath) => {
  const str = fs.readFileSync(filePath).toString();
  const meta = {};
  str
    .slice("```\n".length, str.indexOf("\n```"))
    .split("\n")
    .forEach((line) => {
      const pos = line.indexOf(":");
      meta[line.slice(0, pos)] = line.slice(pos + 1).trim();
    });
  const body = str.slice(str.indexOf("\n```") + 4);
  const content = `<h1>${meta.title}</h1>\n\n${body}\n`;
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

  const htmlStr = fs.readFileSync(p`./units/extra.html`).toString();
  const cssStr =
    fs.readFileSync(p`./units/app.css`).toString() +
    fs.readFileSync(p`./units/markdown.css`).toString();
  const jsStr = fs.readFileSync(p`./units/app.js`).toString();
  const bundleJsStr = fs
    .readFileSync(p`./units/bundle.js`)
    .toString()
    .replace("/*@ htmlStr */", minify.html(htmlStr))
    .replace("/*@ cssStr */", minify.css(cssStr))
    .replace("/*@ jsStr */", jsStr);
  fs.writeFileSync(p`./public/bundle.js`, minify.js(bundleJsStr));

  const checkJsStr = fs.readFileSync(p`./units/check.js`).toString();
  fs.writeFileSync(p`./public/check.js`, minify.js(checkJsStr));
}

// Posts
const postsList = [];
{
  let filesList = fs.readdirSync(p`./source/posts`).reverse();
  if (isDevMode) {
    filesList = filesList.slice(0, 15);
  }
  filesList.forEach((fileName) => {
    const { meta, content } = parseMdFile(p`./source/posts/${fileName}`);
    const attr = {
      id: meta.date.replace(/:|-|\s/g, ""),
      date: meta.date.split(" ")[0],
      title: meta.title,
      category: meta.category,
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
    if (
      `${attr.id.slice(0, 8)}-${attr.id.slice(8)} ${attr.title}.md` !== fileName
    ) {
      console.warn(`post file [${fileName}] has not standard name`);
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

// Pages - Home
{
  const countPerPage = 10;
  const lastPage = Math.ceil(postsList.length / countPerPage);
  for (let curPage = 1; curPage <= lastPage; curPage++) {
    let htmlStr = "";
    for (
      let i = (curPage - 1) * countPerPage,
        maxI = i + countPerPage,
        l = postsList.length;
      i < maxI && i < l;
      i++
    ) {
      const post = postsList[i];
      htmlStr += `
        <div class="post-intro">
          <h3>
            <a data-sl href="/post/${post.id}">${post.title}</a>
          </h3>
          <p>${post.description}</p>
          <p>
            ${post.tags
              .map(
                (tag) => `<a data-sl href="/tag/${tag}" class="chip">${tag}</a>`
              )
              .join("")}
          </p>
        </div>
      `;
    }
    htmlStr += `
      <nav class="pagination">
        <a data-sl href="/">◁◁</a>
        <a data-sl href="${curPage > 2 ? "/home/" + (curPage - 1) : "/"}">◁</a>
        <a data-sl href="/home/${curPage < lastPage ? curPage + 1 : ""}">▷</a>
        <a data-sl href="/home/${lastPage}">▷▷</a>
      </nav>
    `;
    if (curPage === 1) {
      makePage({
        path: "/",
        type: "html",
        title: "Homepage",
        description: "Welcome to my blog!",
        content: htmlStr,
      });
    } else {
      makePage({
        path: `/home/${curPage}/`,
        type: "html",
        title: `Home: ${curPage}`,
        content: htmlStr,
      });
    }
  }
}

// Pages - Archive
{
  const listsByYear = new Map();
  postsList.forEach((post) => {
    const year = post.date.slice(0, 4);
    if (!listsByYear.has(year)) {
      listsByYear.set(year, []);
    }
    listsByYear.get(year).push(post);
  });

  let htmlStr = '<div class="chips-group">';
  htmlStr += "<h1>Archive</h1>";
  listsByYear.forEach((_, year) => {
    htmlStr += `<a data-sl href="/archive/${year}" class="chip">${year}</a>`;
  });
  htmlStr += "</div>";
  makePage({
    path: "/archive/",
    type: "html",
    title: "Archive",
    content: htmlStr,
  });

  listsByYear.forEach((list, year) => {
    let htmlStr = '<div class="posts-group">';
    htmlStr += `<h1>${year}</h1>`;
    list.forEach((post) => {
      htmlStr += `
        <a data-sl href="/post/${post.id}">
          <span class="chip">${post.date}</span>
          ${post.title}
        </a>
      `;
    });
    htmlStr += "</div>";
    makePage({
      path: `/archive/${year}`,
      type: "html",
      title: `${year} - Archive`,
      content: htmlStr,
    });
  });
}

// Pages - Category
{
  const listsByCategory = new Map();
  postsList.forEach((post) => {
    if (!listsByCategory.has(post.category)) {
      listsByCategory.set(post.category, []);
    }
    listsByCategory.get(post.category).push(post);
  });

  let htmlStr = '<div class="chips-group">';
  htmlStr += "<h1>Category</h1>";
  listsByCategory.forEach((_, category) => {
    htmlStr += `<a data-sl href="/category/${category}" class="chip">${category}</a>`;
  });
  htmlStr += "</div>";
  makePage({
    path: "/category/",
    type: "html",
    title: "Category",
    content: htmlStr,
  });

  listsByCategory.forEach((list, category) => {
    let htmlStr = '<div class="posts-group">';
    htmlStr += `<h1>${category}</h1>`;
    list.forEach((post) => {
      htmlStr += `
        <a data-sl href="/post/${post.id}">
          <span class="chip">${post.date}</span>
          ${post.title}
        </a>
      `;
    });
    htmlStr += "</div>";
    makePage({
      path: `/category/${category}`,
      type: "html",
      title: `${category} - Category`,
      content: htmlStr,
    });
  });
}

// Pages - Tag
{
  const listsByTag = new Map();
  postsList.forEach((post) =>
    post.tags.forEach((tag) => {
      if (!listsByTag.has(tag)) {
        listsByTag.set(tag, []);
      }
      listsByTag.get(tag).push(post);
    })
  );

  let htmlStr = '<div class="chips-group">';
  htmlStr += "<h1>Tag</h1>";
  listsByTag.forEach((_, tag) => {
    htmlStr += `<a data-sl href="/tag/${tag}" class="chip">${tag}</a>`;
  });
  htmlStr += "</div>";
  makePage({
    path: "/tag/",
    type: "html",
    title: "Tag",
    content: htmlStr,
  });

  listsByTag.forEach((list, tag) => {
    let htmlStr = '<div class="posts-group">';
    htmlStr += `<h1>${tag}</h1>`;
    list.forEach((post) => {
      htmlStr += `
        <a data-sl href="/post/${post.id}">
          <span class="chip">${post.date}</span>
          ${post.title}
        </a>
      `;
    });
    htmlStr += "</div>";
    makePage({
      path: `/tag/${tag}`,
      type: "html",
      title: `${tag} - Tag`,
      content: htmlStr,
    });
  });
}

// Pages - 404 Error
{
  makePage({
    realPath: "/404.html",
    title: "404 not found",
    type: "markdown",
    content: '<h1 style="text-align:center;border:none">404 not found</h1>',
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
