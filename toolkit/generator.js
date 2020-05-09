"use strict";

console.time("generate time");
process.on("exit", () => console.timeEnd("generate time"));

const path = require("path");
const fs = require("file-system"); // This is not native fs
const marked = require("marked");

const mfs = {
  r2a: require("path").join.bind(null, __dirname, ".."), // Relative to absolute
  readFileStrSync(path) {
    return fs.readFileSync(path).toString();
  },
  writeFile(path, data) {
    fs.writeFile(path, data);
  },
  copyFile(sourcePath, targetPath) {
    fs.copyFile(sourcePath, targetPath);
  },
  removeDirSync(path) {
    try {
      // Ignore error when dir is not existent
      fs.rmdirSync(path);
    } catch {}
  },
  copyDir(sourcePath, targetPath, filter = ["**/*"]) {
    fs.recurse(sourcePath, filter, (absolute, relative) => {
      fs.copyFile(absolute, path.join(targetPath, relative));
    });
  },
  walkDirSync(dirPath, filter = ["**/*"], callback) {
    fs.recurseSync(dirPath, filter, callback);
  },
};

const minifier = (() => {
  if (process.argv.includes("--dev-mode")) {
    return {
      html: (s) => s,
      htmlMd: (s) => s,
      css: (s) => s,
      js: (s) => s,
    };
  } else {
    const htmlMinifier = require("html-minifier-terser");
    const CleanCss = require("clean-css");
    const terser = require("terser");
    return {
      html: (s) =>
        htmlMinifier.minify(s, {
          collapseInlineTagWhitespace: true,
          collapseBooleanAttributes: true,
          collapseWhitespace: true,
          continueOnParseError: true,
          removeAttributeQuotes: true,
          removeComments: true,
          sortAttributes: true,
          sortClassName: true,
          minifyURLs: true,
        }),
      htmlMd: (s) =>
        htmlMinifier.minify(s, {
          collapseBooleanAttributes: true,
          collapseWhitespace: true,
          continueOnParseError: true,
          removeAttributeQuotes: true,
          removeComments: true,
          sortAttributes: true,
          sortClassName: true,
          minifyURLs: true,
        }),
      css: (s) => new CleanCss({ level: 2 }).minify(s).styles,
      js: (s) =>
        terser
          .minify(s.replace(/const\s/g, "let "), {
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
          })
          .code.replace(/"use strict";/g, "")
          .replace(/;$/, ""),
    };
  }
})();

const parseMdFile = (filePath) => {
  const str = mfs.readFileStrSync(filePath);
  const readMeta = (key) => {
    const matched = str.match(`\n${key}: ([^\n]*)`);
    return matched ? matched[1] : null;
  };
  const mdStr = str.slice(str.indexOf("\n```") + 4);
  const content = `# ${readMeta("title")}\n\n${mdStr}\n`;
  return { readMeta, content };
};

const makePage = (() => {
  const templateFileStr = mfs.readFileStrSync(mfs.r2a("/units/page.html"));
  const template = minifier.html(templateFileStr);
  return ({
    realPath = "",
    path = "",
    title = "",
    description = "",
    content = "",
    type = "html", // "html" | "markdown"
  }) => {
    switch (type) {
      case "html":
        content = minifier.html(content);
        break;
      case "markdown":
        content = `<article class="card">${marked(content)}</article>`;
        content = minifier.htmlMd(content);
        break;
    }
    const result = template
      .replace(/{{ title }}/g, title)
      .replace(/{{ description }}/g, description)
      .replace(/{{ content }}/g, content);
    const targetPath = realPath
      ? mfs.r2a("/public", realPath)
      : mfs.r2a("/public", path, "index.html");
    mfs.writeFile(targetPath, result);
  };
})();

// Initialization
{
  mfs.removeDirSync(mfs.r2a("/public"));

  mfs.copyFile(mfs.r2a("/units/_gitignore"), mfs.r2a("/public/.gitignore"));
  mfs.copyFile(mfs.r2a("/units/_nojekyll"), mfs.r2a("/public/.nojekyll"));
  mfs.copyFile(mfs.r2a("/units/favicon.ico"), mfs.r2a("/public/favicon.ico"));
  mfs.copyFile(mfs.r2a("/units/favicon.svg"), mfs.r2a("/public/favicon.svg"));

  // bundle.css
  {
    const mdCss = mfs.readFileStrSync(mfs.r2a("/units/markdown.css"));
    const appCss = mfs.readFileStrSync(mfs.r2a("/units/app.css"));
    const cssStr = mdCss + appCss;
    const result = minifier.css(cssStr);
    mfs.writeFile(mfs.r2a("/public/bundle.css"), result);
  }

  // bundle.js
  {
    const extraJs = mfs.readFileStrSync(mfs.r2a("/units/extra.js"));
    const extraHtmlFileStr = mfs.readFileStrSync(mfs.r2a("/units/extra.html"));
    const extraHtml = minifier.html(extraHtmlFileStr);
    const appJs = mfs.readFileStrSync(mfs.r2a("/units/app.js"));
    const jsStr = extraJs.replace("/* @ extra.html */", extraHtml) + appJs;
    const result = minifier.js(`(()=>{${jsStr}})()`);
    mfs.writeFile(mfs.r2a("/public/bundle.js"), result);
  }

  // check.js
  {
    const checkJs = mfs.readFileStrSync(mfs.r2a("/units/check.js"));
    const result = minifier.js(checkJs);
    mfs.writeFile(mfs.r2a("/public/check.js"), result);
  }
}

// Misc
{
  mfs.copyDir(mfs.r2a("/source/toys"), mfs.r2a("/public/toy"), [
    "**/*",
    "!.git/**/*",
  ]);

  mfs.copyDir(mfs.r2a("/source/res"), mfs.r2a("/public/res"), [
    "**/*",
    "!.git/**/*",
  ]);
}

// Pages
const pagesList = [];
{
  mfs.walkDirSync(mfs.r2a("/source/pages"), ["*.md"], (absolute) => {
    const { readMeta, content } = parseMdFile(absolute);
    const attr = {
      name: path.parse(absolute).name,
      title: readMeta("title"),
      description: readMeta("description"),
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

// Posts
const postsList = [];
{
  mfs.walkDirSync(mfs.r2a("/source/posts"), ["*.md"], (absolute) => {
    const { readMeta, content } = parseMdFile(absolute);
    const attr = {
      id: readMeta("date").replace(/:|-|\s/g, ""),
      date: readMeta("date").split(" ")[0],
      title: readMeta("title"),
      category: readMeta("category"),
      tags: readMeta("tags").split(" "),
      description: readMeta("description"),
    };
    makePage({
      ...attr,
      path: `/post/${attr.id}/`,
      type: "markdown",
      content,
    });
    postsList.push(attr);
    if (attr.date + " " + attr.title !== path.parse(absolute).name) {
      console.warn(`file name is not standard: ${attr.title}`);
    }
  });
  postsList.sort((post1, post2) => post2.id - post1.id);
}

// Home
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
            <a href="/post/${post.id}" data-sl>${post.title}</a>
          </h3>
          <p>${post.description}</p>
          <p>
            ${post.tags
              .map(
                (tag) => `<a href="/tag/${tag}" data-sl class="chip">${tag}</a>`
              )
              .join("")}
          </p>
        </div>
      `;
    }
    htmlStr += `
      <nav class="pagination">
        <a href="/" data-sl>〈◀</a>
        <a href="${curPage > 2 ? "/home/" + (curPage - 1) : "/"}" data-sl>◀</a>
        <a href="/home/${
          curPage < lastPage ? curPage + 1 : lastPage
        }" data-sl>▶</a>
        <a href="/home/${lastPage}" data-sl>▶〉</a>
      </nav>
    `;
    if (curPage === 1) {
      makePage({
        path: "/",
        title: "Homepage",
        description: "Welcome to my blog!",
        content: htmlStr,
      });
    } else {
      makePage({
        path: `/home/${curPage}/`,
        title: `Home: ${curPage}`,
        content: htmlStr,
      });
    }
  }
}

// Archive
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
    htmlStr += `<a href="/archive/${year}" data-sl class="chip">${year}</a>`;
  });
  htmlStr += "</div>";
  makePage({
    path: "/archive/",
    title: "Archive",
    content: htmlStr,
  });

  listsByYear.forEach((list, year) => {
    let htmlStr = '<div class="posts-group">';
    htmlStr += `<h1>${year}</h1>`;
    list.forEach((post) => {
      htmlStr += `
        <a href="/post/${post.id}" data-sl>
          <span class="chip">${post.date}</span>
          ${post.title}
        </a>
      `;
    });
    htmlStr += "</div>";
    makePage({
      path: `/archive/${year}`,
      title: `${year} - Archive`,
      content: htmlStr,
    });
  });
}

// Category
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
    htmlStr += `<a href="/category/${category}" data-sl class="chip">${category}</a>`;
  });
  htmlStr += "</div>";
  makePage({
    path: "/category/",
    title: "Category",
    content: htmlStr,
  });

  listsByCategory.forEach((list, category) => {
    let htmlStr = '<div class="posts-group">';
    htmlStr += `<h1>${category}</h1>`;
    list.forEach((post) => {
      htmlStr += `
        <a href="/post/${post.id}" data-sl>
          <span class="chip">${post.date}</span>
          ${post.title}
        </a>
      `;
    });
    htmlStr += "</div>";
    makePage({
      path: `/category/${category}`,
      title: `${category} - Category`,
      content: htmlStr,
    });
  });
}

// Tag
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
    htmlStr += `<a href="/tag/${tag}" data-sl class="chip">${tag}</a>`;
  });
  htmlStr += "</div>";
  makePage({
    path: "/tag/",
    title: "Tag",
    content: htmlStr,
  });

  listsByTag.forEach((list, tag) => {
    let htmlStr = '<div class="posts-group">';
    htmlStr += `<h1>${tag}</h1>`;
    list.forEach((post) => {
      htmlStr += `
        <a href="/post/${post.id}" data-sl>
          <span class="chip">${post.date}</span>
          ${post.title}
        </a>
      `;
    });
    htmlStr += "</div>";
    makePage({
      path: `/tag/${tag}`,
      title: `${tag} - Tag`,
      content: htmlStr,
    });
  });
}

// 404 Error
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

  mfs.writeFile(
    mfs.r2a("/public/robots.txt"),
    `User-agent: *\nAllow: /\nSitemap: ${domain}/sitemap.xml`
  );

  mfs.writeFile(
    mfs.r2a("/public/sitemap.xml"),
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

  mfs.writeFile(
    mfs.r2a("/public/feed.xml"),
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
